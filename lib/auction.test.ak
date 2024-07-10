use aiken/interval
use aiken/time.{PosixTime}
use aiken/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, ScriptContext, Spend,
  TransactionId,
}
use aiken/transaction/credential.{
  Address, from_script, from_verification_key, with_delegation_key,
}
use aiken/transaction/value.{ada_asset_name, ada_policy_id}
use auction
use test_utils/tx_builder

// interfaces
type Lovelace =
  Int

type AuctionState =
  Output

type BidDatum {
  seller_addr: Address,
  last_bid: Option<(Address, Lovelace)>,
  deadline: PosixTime,
  reserve_price: Lovelace,
}

type BidRedeemer {
  Bid(Address, Lovelace)
  Close
}

// constants

const auction_script_hash = "auction_script_hash"

const auctioner_payment_vkey = "auctioner_payent_vkey"

const auctioner_stake_vkey = "auctioner_stake_vkey"

const first_bidder_payment_vkey = "first_bidder_payment_vkey"

const first_bidder_stake_vkey = "first_bidder_stake_vkey"

const ada = 1_000_000

// utils

fn validate(datum, redeemer, context) {
  auction.spend(datum, redeemer, context)
}

fn get_initial_state() -> AuctionState {
  Output {
    address: from_script(auction_script_hash)
      |> with_delegation_key(auctioner_stake_vkey),
    value: value.from_lovelace(2 * ada)
      |> value.add("item_policy", "item_name_11", 1)
      |> value.add("item_policy", "item_name_12", 10)
      |> value.add("item_policy_2", "item_name_21", 100),
    datum: InlineDatum(
      BidDatum {
        seller_addr: from_verification_key(auctioner_payment_vkey)
          |> with_delegation_key(auctioner_stake_vkey),
        last_bid: None,
        deadline: 1000,
        reserve_price: 100 * ada,
      },
    ),
    reference_script: None,
  }
}

fn get_bid_state(self: AuctionState) {
  expect InlineDatum(datum) = self.datum
  expect bid_state: BidDatum = datum
  bid_state
}

fn bid(self: AuctionState, who: Address, offer: Lovelace) -> AuctionState {
  expect InlineDatum(datum) = self.datum
  expect bid_state: BidDatum = datum
  let BidDatum { last_bid, .. } = bid_state
  Output {
    address: Address { ..self.address, stake_credential: who.stake_credential },
    value: when last_bid is {
      None -> self.value |> value.add(ada_policy_id, ada_asset_name, offer)
      Some((_, last_offer)) ->
        self.value
          |> value.add(ada_policy_id, ada_asset_name, offer - last_offer)
    },
    datum: InlineDatum(BidDatum { ..bid_state, last_bid: Some((who, offer)) }),
    reference_script: None,
  }
}

// Tests

/// first bidder come with reserve_price offer
test succ_first_offer() {
  let reserve_price = 100 * ada
  let bidder_addr =
    from_verification_key(first_bidder_payment_vkey)
      |> with_delegation_key(first_bidder_stake_vkey)
  let offer = reserve_price

  let rdmr = Bid(bidder_addr, offer)

  let current_state = get_initial_state()
  let current_bid_state = current_state |> get_bid_state
  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_spend_bid"), 0),
      output: current_state,
    }

  let cont_bid = current_state |> bid(bidder_addr, offer)

  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(cont_bid)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), rdmr)
        |> tx_builder.set_validity_range(
            interval.entirely_before(current_bid_state.deadline),
          ),
    }

  validate(current_bid_state, rdmr, ctx)
}

/// later bidder come with higher offer
test succ_later_offer() {
  let first_bidder_addr =
    from_verification_key(first_bidder_payment_vkey)
      |> with_delegation_key(first_bidder_stake_vkey)
  let later_bidder_payment_vkey = "later_bidder_payment_vkey"
  let later_bidder_stake_vkey = "later_bidder_stake_vkey"
  let later_bidder_addr =
    from_verification_key(later_bidder_payment_vkey)
      |> with_delegation_key(later_bidder_stake_vkey)
  let offer = 100 * ada + 1

  let current_state = get_initial_state() |> bid(first_bidder_addr, 100 * ada)
  let current_bid_state = current_state |> get_bid_state
  let next_bid_state = current_state |> bid(later_bidder_addr, offer)

  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_spend_bid"), 0),
      output: current_state,
    }
  let prev_bidder_payout =
    Output {
      address: first_bidder_addr,
      value: value.from_lovelace(100 * ada),
      datum: NoDatum,
      reference_script: None,
    }

  let rdmr = Bid(later_bidder_addr, offer)

  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(next_bid_state)
        |> tx_builder.add_output(prev_bidder_payout)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), rdmr)
        |> tx_builder.set_validity_range(
            interval.entirely_before(current_bid_state.deadline),
          ),
    }

  validate(current_bid_state, rdmr, ctx)
}

/// The auction is closed, assets will be sold for the highest (last) bidder.
/// In this case, assets (tokens other than Lovelace) go to the bidder and 
/// funds (Lovelace) go to the seller/auctioner
test succ_sold() {
  let bidder_addr =
    from_verification_key(first_bidder_payment_vkey)
      |> with_delegation_key(first_bidder_stake_vkey)
  let offer = 200 * ada
  let current_state =
    get_initial_state()
      |> bid(bidder_addr, offer)
  let current_bid_state = current_state |> get_bid_state
  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_01"), 1),
      output: current_state,
    }
  let bidder_payout =
    Output {
      address: bidder_addr,
      value: value.without_lovelace(current_state.value)
        |> value.add(ada_policy_id, ada_asset_name, 2 * ada),
      datum: NoDatum,
      reference_script: None,
    }
  let seller_payout =
    Output {
      address: current_bid_state.seller_addr,
      value: value.lovelace_of(current_state.value) |> value.from_lovelace,
      datum: NoDatum,
      reference_script: None,
    }
  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(bidder_payout)
        |> tx_builder.add_output(seller_payout)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), Close)
        |> tx_builder.set_validity_range(
            interval.after(current_bid_state.deadline),
          ),
    }

  validate(current_state |> get_bid_state, Close, ctx)
}

test succ_refunds_assets() {
  let current_state = get_initial_state()
  let current_bid_state = current_state |> get_bid_state
  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_01"), 1),
      output: current_state,
    }

  let seller_payout =
    Output {
      address: current_bid_state.seller_addr,
      value: current_state.value,
      datum: NoDatum,
      reference_script: None,
    }

  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(seller_payout)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), Close)
        |> tx_builder.set_validity_range(
            interval.after(current_bid_state.deadline),
          ),
    }
  validate(current_state |> get_bid_state, Close, ctx)
}

test succ_refunds_assets_trigger_by_owner() {
  let current_state = get_initial_state()
  let current_bid_state = current_state |> get_bid_state
  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_01"), 1),
      output: current_state,
    }

  let seller_payout =
    Output {
      address: current_bid_state.seller_addr,
      value: current_state.value |> value.add(ada_policy_id, ada_asset_name, 1),
      datum: NoDatum,
      reference_script: None,
    }

  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(seller_payout)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), Close)
        |> tx_builder.set_validity_range(
            interval.after(current_bid_state.deadline),
          ),
    }
  validate(current_state |> get_bid_state, Close, ctx)
}

test succ_change_stake_key_on_biding() {
  let reserve_price = 100 * ada
  let bidder_addr =
    from_verification_key(first_bidder_payment_vkey)
      |> with_delegation_key(first_bidder_stake_vkey)
  let offer = reserve_price

  let rdmr = Bid(bidder_addr, offer)

  let current_state = get_initial_state()
  let current_bid_state = current_state |> get_bid_state
  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_spend_bid"), 0),
      output: current_state,
    }

  let cont_bid = {
    let output = current_state |> bid(bidder_addr, offer)
    Output {
      ..output,
      address: output.address |> with_delegation_key(first_bidder_stake_vkey),
    }
  }

  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(cont_bid)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), rdmr)
        |> tx_builder.set_validity_range(
            interval.entirely_before(current_bid_state.deadline),
          ),
    }

  validate(current_bid_state, rdmr, ctx)
}

test fail_doesnt_meet_reserve_price() fail {
  let reserve_price = 100 * ada
  let bidder_addr =
    from_verification_key(first_bidder_payment_vkey)
      |> with_delegation_key(first_bidder_stake_vkey)
  let offer = reserve_price - 1

  let rdmr = Bid(bidder_addr, offer)

  let current_state = get_initial_state()
  let current_bid_state = current_state |> get_bid_state
  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_spend_bid"), 0),
      output: current_state,
    }

  let cont_bid = current_state |> bid(bidder_addr, offer)

  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(cont_bid)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), rdmr)
        |> tx_builder.set_validity_range(
            interval.entirely_before(current_bid_state.deadline),
          ),
    }

  validate(current_bid_state, rdmr, ctx)
}

test fail_change_seller_addr() fail {
  let reserve_price = 100 * ada
  let bidder_addr =
    from_verification_key(first_bidder_payment_vkey)
      |> with_delegation_key(first_bidder_stake_vkey)
  let offer = reserve_price

  let rdmr = Bid(bidder_addr, offer)

  let current_state = get_initial_state()
  let current_bid_state = current_state |> get_bid_state
  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_spend_bid"), 0),
      output: current_state,
    }

  let cont_bid = {
    let output = current_state |> bid(bidder_addr, offer)
    expect InlineDatum(inl_dtm) = output.datum
    expect datum: BidDatum = inl_dtm
    Output {
      ..output,
      datum: InlineDatum(BidDatum { ..datum, seller_addr: bidder_addr }),
    }
  }

  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(cont_bid)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), rdmr)
        |> tx_builder.set_validity_range(
            interval.entirely_before(current_bid_state.deadline),
          ),
    }

  validate(current_bid_state, rdmr, ctx)
}

test fail_change_deadline() fail {
  let reserve_price = 100 * ada
  let bidder_addr =
    from_verification_key(first_bidder_payment_vkey)
      |> with_delegation_key(first_bidder_stake_vkey)
  let offer = reserve_price

  let rdmr = Bid(bidder_addr, offer)

  let current_state = get_initial_state()
  let current_bid_state = current_state |> get_bid_state
  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_spend_bid"), 0),
      output: current_state,
    }

  let cont_bid = {
    let output = current_state |> bid(bidder_addr, offer)
    expect InlineDatum(inl_dtm) = output.datum
    expect datum: BidDatum = inl_dtm
    Output {
      ..output,
      datum: InlineDatum(BidDatum { ..datum, deadline: datum.deadline - 1 }),
    }
  }

  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(cont_bid)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), rdmr)
        |> tx_builder.set_validity_range(
            interval.entirely_before(current_bid_state.deadline),
          ),
    }

  validate(current_bid_state, rdmr, ctx)
}

test fail_redeemer_unmatch_datum() fail {
  let reserve_price = 100 * ada
  let bidder_addr =
    from_verification_key(first_bidder_payment_vkey)
      |> with_delegation_key(first_bidder_stake_vkey)
  let offer = reserve_price

  let rdmr = Bid(bidder_addr, offer)

  let current_state = get_initial_state()
  let current_bid_state = current_state |> get_bid_state
  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_spend_bid"), 0),
      output: current_state,
    }

  let cont_bid = {
    let output = current_state |> bid(bidder_addr, offer)
    expect InlineDatum(inl_dtm) = output.datum
    expect datum: BidDatum = inl_dtm
    Output {
      ..output,
      datum: InlineDatum(
        BidDatum { ..datum, last_bid: Some((bidder_addr, offer + 1)) },
      ),
    }
  }

  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(cont_bid)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), rdmr)
        |> tx_builder.set_validity_range(
            interval.entirely_before(current_bid_state.deadline),
          ),
    }

  validate(current_bid_state, rdmr, ctx)
}

test fail_doesnt_deposit_funds() fail {
  let reserve_price = 100 * ada
  let bidder_addr =
    from_verification_key(first_bidder_payment_vkey)
      |> with_delegation_key(first_bidder_stake_vkey)
  let offer = reserve_price

  let rdmr = Bid(bidder_addr, offer)

  let current_state = get_initial_state()
  let current_bid_state = current_state |> get_bid_state
  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_spend_bid"), 0),
      output: current_state,
    }

  let cont_bid = {
    let expected = current_state |> bid(bidder_addr, offer)
    Output { ..expected, value: current_state.value }
  }

  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(cont_bid)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), rdmr)
        |> tx_builder.set_validity_range(
            interval.entirely_before(current_bid_state.deadline),
          ),
    }

  validate(current_bid_state, rdmr, ctx)
}

test fail_doesnt_refunds_prev_bidder() fail {
  let first_bidder_addr =
    from_verification_key(first_bidder_payment_vkey)
      |> with_delegation_key(first_bidder_stake_vkey)
  let later_bidder_payment_vkey = "later_bidder_payment_vkey"
  let later_bidder_stake_vkey = "later_bidder_stake_vkey"
  let later_bidder_addr =
    from_verification_key(later_bidder_payment_vkey)
      |> with_delegation_key(later_bidder_stake_vkey)
  let offer = 100 * ada + 1

  let current_state = get_initial_state() |> bid(first_bidder_addr, 100 * ada)
  let current_bid_state = current_state |> get_bid_state
  let next_bid_state = current_state |> bid(later_bidder_addr, offer)

  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_spend_bid"), 0),
      output: current_state,
    }

  let rdmr = Bid(later_bidder_addr, offer)

  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(next_bid_state)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), rdmr)
        |> tx_builder.set_validity_range(
            interval.entirely_before(current_bid_state.deadline),
          ),
    }

  validate(current_bid_state, rdmr, ctx)
}

test fail_redeem_doesnt_refunds() fail {
  let current_state = get_initial_state()
  let current_bid_state = current_state |> get_bid_state
  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_01"), 1),
      output: current_state,
    }

  let seller_payout =
    Output {
      address: from_verification_key("other"),
      value: current_state.value,
      datum: NoDatum,
      reference_script: None,
    }

  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(seller_payout)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), Close)
        |> tx_builder.set_validity_range(
            interval.after(current_bid_state.deadline),
          ),
    }
  validate(current_state |> get_bid_state, Close, ctx)
}

test fail_sold_doesnt_pay_to_seller() fail {
  let bidder_addr =
    from_verification_key(first_bidder_payment_vkey)
      |> with_delegation_key(first_bidder_stake_vkey)
  let offer = 200 * ada
  let current_state =
    get_initial_state()
      |> bid(bidder_addr, offer)
  let current_bid_state = current_state |> get_bid_state
  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_01"), 1),
      output: current_state,
    }
  let bidder_payout =
    Output {
      address: bidder_addr,
      value: value.without_lovelace(current_state.value)
        |> value.add(ada_policy_id, ada_asset_name, 2 * ada),
      datum: NoDatum,
      reference_script: None,
    }
  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(bidder_payout)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), Close)
        |> tx_builder.set_validity_range(
            interval.after(current_bid_state.deadline),
          ),
    }

  validate(current_state |> get_bid_state, Close, ctx)
}

test fail_sold_doesnt_pay_to_winner() fail {
  let bidder_addr =
    from_verification_key(first_bidder_payment_vkey)
      |> with_delegation_key(first_bidder_stake_vkey)
  let offer = 200 * ada
  let current_state =
    get_initial_state()
      |> bid(bidder_addr, offer)
  let current_bid_state = current_state |> get_bid_state
  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_01"), 1),
      output: current_state,
    }
  let seller_payout =
    Output {
      address: current_bid_state.seller_addr,
      value: value.lovelace_of(current_state.value) |> value.from_lovelace,
      datum: NoDatum,
      reference_script: None,
    }
  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(seller_payout)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), Close)
        |> tx_builder.set_validity_range(
            interval.after(current_bid_state.deadline),
          ),
    }

  validate(current_state |> get_bid_state, Close, ctx)
}

test fail_when_drain_assets_on_bid() fail {
  let reserve_price = 100 * ada
  let bidder_addr =
    from_verification_key(first_bidder_payment_vkey)
      |> with_delegation_key(first_bidder_stake_vkey)
  let offer = reserve_price

  let rdmr = Bid(bidder_addr, offer)

  let current_state = get_initial_state()
  let current_bid_state = current_state |> get_bid_state
  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_spend_bid"), 0),
      output: current_state,
    }

  let cont_bid = {
    let expected = current_state |> bid(bidder_addr, offer)
    Output {
      ..expected,
      value: expected.value |> value.lovelace_of |> value.from_lovelace,
    }
  }

  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(cont_bid)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), rdmr)
        |> tx_builder.set_validity_range(
            interval.entirely_before(current_bid_state.deadline),
          ),
    }
  validate(current_bid_state, rdmr, ctx)
}

test fail_when_double_satisfaction() fail {
  let reserve_price = 100 * ada
  let bidder_addr =
    from_verification_key(first_bidder_payment_vkey)
      |> with_delegation_key(first_bidder_stake_vkey)
  let offer = reserve_price

  let rdmr = Bid(bidder_addr, offer)

  let current_state = get_initial_state()
  let current_bid_state = current_state |> get_bid_state
  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_spend_bid"), 0),
      output: current_state,
    }

  let cont_bid = current_state |> bid(bidder_addr, offer)

  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(cont_bid)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), rdmr)
        |> tx_builder.set_validity_range(
            interval.entirely_before(current_bid_state.deadline),
          ),
    }

  validate(current_bid_state, rdmr, ctx)
}

test fail_when_spam_dust_tokens() fail {
  let reserve_price = 100 * ada
  let bidder_addr =
    from_verification_key(first_bidder_payment_vkey)
      |> with_delegation_key(first_bidder_stake_vkey)
  let offer = reserve_price

  let rdmr = Bid(bidder_addr, offer)

  let current_state = get_initial_state()
  let current_bid_state = current_state |> get_bid_state
  let spend_bid =
    Input {
      output_reference: OutputReference(TransactionId("tx_spend_bid"), 0),
      output: current_state,
    }

  let cont_bid = {
    let expected = current_state |> bid(bidder_addr, offer)
    Output {
      ..expected,
      value: expected.value |> value.add("other_pid", "token_name", 1),
    }
  }

  let ctx =
    ScriptContext {
      purpose: Spend(spend_bid.output_reference),
      transaction: tx_builder.new()
        |> tx_builder.add_input(spend_bid)
        |> tx_builder.add_output(cont_bid)
        |> tx_builder.add_redeemer(Spend(spend_bid.output_reference), rdmr)
        |> tx_builder.set_validity_range(
            interval.entirely_before(current_bid_state.deadline),
          ),
    }

  validate(current_bid_state, rdmr, ctx)
}
