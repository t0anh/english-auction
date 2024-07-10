# english-auction

An education project that implements a simple auction contract on Cardano

## Auction Smart Contract

```mermaid
stateDiagram
direction LR
[*] --> bidding: <pre>create(\n  who, assets,\n  reserve_price, deadline,\n)<pre>
bidding --> bidding: bid(who, price)
bidding --> [*]: close()

bidding: Bidding UTxO
state bidding {
 direction LR
 adr: Address
 adr: payment#colon; auction_script_hash
 adr: stake#colon; Optional#lt;DelegationKey>
 
 val: Value
 val: AssetNFT#colon; 1
 val: Lovelace#colon; min_ada
 
 dtm: Datum
 dtm: seller_addr#colon; Address
 dtm: last_bid#colon; Optional<(buyer_addr#colon; Address, price#colon; Lovelace)>
 dtm: deadline#colon; PosixTime
 dtm: reserve_price#colon; Lovelace
}
```

## Building

```sh
aiken build
```

## Testing

To run all tests, simply do:

```sh
aiken check
```

To run only tests matching the string `foo`, do:

```sh
aiken check -m foo
```

## Resources

Find more on the [Aiken's user manual](https://aiken-lang.org).
