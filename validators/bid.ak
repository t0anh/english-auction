use aiken/transaction.{ScriptContext}
use auction.{BidDatum, BidRedeemer}

validator {
  fn spend(datum: BidDatum, redeemer: BidRedeemer, context: ScriptContext) {
    auction.spend(datum, redeemer, context)
  }
}
