use aiken/interval
use aiken/list
use aiken/time.{PosixTime}
use aiken/transaction.{InlineDatum, Input, ScriptContext, Spend, Transaction}
use aiken/transaction/credential.{Address}
use aiken/transaction/value.{Value, ada_asset_name, ada_policy_id}

type Lovelace =
  Int

pub type BidDatum {
  seller_addr: Address,
  last_bid: Option<(Address, Lovelace)>,
  deadline: PosixTime,
  reserve_price: Lovelace,
}

pub type BidRedeemer {
  Bid(Address, Lovelace)
  Close
}

pub fn spend(datum: Data, redeemer: Data, context: ScriptContext) {
  expect datum: BidDatum = datum
  expect redeemer: BidRedeemer = redeemer
  let BidDatum { deadline, reserve_price, last_bid, seller_addr } = datum
  let ScriptContext {
    transaction: Transaction { validity_range, inputs, outputs, .. },
    purpose,
  } = context

  expect Spend(out_ref) = purpose

  expect Some(Input { output: this_bid, .. }) =
    list.find(inputs, fn(input) { input.output_reference == out_ref })

  // Only allow single spend to defend double satisfaction
  expect [_] =
    list.filter(
      inputs,
      fn(input) {
        input.output.address.payment_credential == this_bid.address.payment_credential
      },
    )

  when redeemer is {
    Bid(bidder_addr, price) -> and {
        // price must satisfiy reserve_price
        price >= reserve_price,
        // session is active
        interval.intersection(interval.before(deadline), validity_range) == validity_range,
        // redeemer is valid
        {
          expect [cont_bid] =
            list.filter(
              outputs,
              fn(output) {
                output.address.payment_credential == this_bid.address.payment_credential
              },
            )

          expect InlineDatum(inl_dtm) = cont_bid.datum
          expect out_datum: BidDatum = inl_dtm

          and {
            out_datum == BidDatum {
              ..datum,
              last_bid: Some((bidder_addr, price)),
            },
            when last_bid is {
              None ->
                cont_bid.value == value.add(
                  this_bid.value,
                  ada_policy_id,
                  ada_asset_name,
                  price,
                )
              Some((prev_bidder_addr, prev_price)) -> {
                let prev_bidder_payout_assets =
                  list.reduce(
                    outputs,
                    value.zero(),
                    fn(acc, output) {
                      if output.address == prev_bidder_addr {
                        value.merge(acc, output.value)
                      } else {
                        acc
                      }
                    },
                  )
                and {
                  // must refunds to previous bidder
                  is_covered(
                    prev_bidder_payout_assets,
                    value.from_lovelace(prev_price),
                  ),
                  price > prev_price,
                }
              }
            },
          }
        },
        True,
      }

    Close -> and {
        interval.intersection(interval.after(deadline), validity_range) == validity_range,
        when last_bid is {
          None -> {
            let seller_payout_assets =
              list.reduce(
                outputs,
                value.zero(),
                fn(acc, output) {
                  if output.address == seller_addr {
                    value.merge(acc, output.value)
                  } else {
                    acc
                  }
                },
              )
            is_covered(seller_payout_assets, this_bid.value)
          }
          Some((winner_addr, _price)) -> {
            let (seller_payout_assets, buyer_payout_assets) =
              list.reduce(
                outputs,
                (value.zero(), value.zero()),
                fn(acc, output) {
                  if output.address == seller_addr {
                    (value.merge(acc.1st, output.value), acc.2nd)
                  } else if output.address == winner_addr {
                    (acc.1st, value.merge(acc.2nd, output.value))
                  } else {
                    acc
                  }
                },
              )
            and {
              is_covered(
                seller_payout_assets,
                value.from_lovelace(value.lovelace_of(this_bid.value)),
              )?,
              is_covered(
                buyer_payout_assets,
                value.without_lovelace(this_bid.value),
              ),
            }
          }
        },
      }
  }
}

fn is_covered(left: Value, right: Value) -> Bool {
  left
    |> value.merge(value.negate(right))
    |> value.flatten
    |> list.all(fn(asset) { asset.3rd >= 0 })
}
