use aiken/transaction.{Input, Output, ScriptPurpose, Transaction, ValidityRange}
use aiken/transaction/value.{PolicyId}

pub fn new() {
  transaction.placeholder()
}

pub fn unwrap_option(self: Option<a>) -> a {
  expect Some(value) = self
  value
}

pub fn add_input(self: Transaction, input: Input) {
  Transaction { ..self, inputs: [input, ..self.inputs] }
}

pub fn add_ref_input(self: Transaction, input: Input) {
  Transaction { ..self, reference_inputs: [input, ..self.reference_inputs] }
}

pub fn add_output(self: Transaction, output: Output) {
  Transaction { ..self, outputs: [output, ..self.outputs] }
}

pub fn add_redeemer(self: Transaction, purpose: ScriptPurpose, datum: Data) {
  Transaction { ..self, redeemers: [Pair(purpose, datum), ..self.redeemers] }
}

pub fn set_validity_range(self: Transaction, range: ValidityRange) {
  Transaction { ..self, validity_range: range }
}

pub fn mint_asset(self: Transaction, pid: PolicyId, name: ByteArray, qty: Int) {
  Transaction {
    ..self,
    mint: self.mint
      |> value.from_minted_value
      |> value.add(pid, name, qty)
      |> value.to_minted_value,
  }
}
