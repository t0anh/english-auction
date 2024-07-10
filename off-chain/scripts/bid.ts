import {
  Data,
  getAddressDetails,
  validatorToAddress,
  type LucidEvolution,
  type OutRef,
} from '@lucid-evolution/lucid';
import { initLucid } from '../utils/wallet';
import { AuctionContract } from '../utils/plutus';
import invariant from 'tiny-invariant';
import { linkToExplorer } from '../utils/link';
import { addressFromData } from '../utils/data';

const { NETWORK } = process.env;

async function bid(lucid: LucidEvolution, ref: OutRef, price: bigint) {
  const [auctionUtxo] = await lucid.utxosByOutRef([ref]);
  const ownAddr = await lucid.wallet().address();
  const { paymentCredential, stakeCredential } = getAddressDetails(ownAddr);
  const contract = new AuctionContract();
  const contractAddr = validatorToAddress(NETWORK, contract, stakeCredential);

  invariant(auctionUtxo.datum, 'Invalid auction datum');

  // Other types of credential are supported by smart contract, but we only
  // support to build verification key to keep things simple
  // @TODO: support other key types
  invariant(
    paymentCredential?.hash && paymentCredential.type === 'Key',
    'Unsupported payment key'
  );
  invariant(
    stakeCredential?.hash && stakeCredential.type === 'Key',
    'Unsupported stake key'
  );

  const currentState = Data.from(auctionUtxo.datum, AuctionContract.datum);
  const ownAddrData: typeof AuctionContract.datum.sellerAddr = {
    paymentCredential: {
      VerificationKeyCredential: [paymentCredential.hash],
    },
    stakeCredential: {
      Inline: [{ VerificationKeyCredential: [stakeCredential.hash] }],
    },
  };

  const nextState: typeof currentState = {
    ...currentState,
    lastBid: [ownAddrData, price],
  };

  const validFrom = new Date().getTime() - 1 * 60 * 1000;
  const validTo = validFrom + 5 * 60 * 1000;

  let tx = lucid
    .newTx()
    .attach.SpendingValidator(contract)
    .collectFrom(
      [auctionUtxo],
      Data.to({ Bid: [ownAddrData, price] }, AuctionContract.redeemer)
    )
    .validFrom(validFrom)
    .validTo(validTo);

  // Refunds to last bidder if exists
  if (currentState.lastBid) {
    const [lastBidderAddrData, refunds] = currentState.lastBid;

    const lastBidderAddr = addressFromData(lastBidderAddrData);

    tx = tx.pay
      .ToContract(
        contractAddr,
        {
          kind: 'inline',
          value: Data.to(nextState, AuctionContract.datum),
        },
        {
          ...auctionUtxo.assets,
          lovelace: auctionUtxo.assets.lovelace - refunds + price,
        }
      )
      .pay.ToAddress(lastBidderAddr, {
        lovelace: refunds,
      });
  } else {
    tx = tx.pay.ToContract(
      contractAddr,
      {
        kind: 'inline',
        value: Data.to(nextState, AuctionContract.datum),
      },
      {
        ...auctionUtxo.assets,
        lovelace: auctionUtxo.assets.lovelace + price,
      }
    );
  }

  const txHash = await tx
    .complete()
    .then((tx) => tx.sign.withWallet().complete())
    .then((tx) => tx.submit());

  return linkToExplorer(txHash);
}

(async function main() {
  const lucid = await initLucid();
  const ref: OutRef = {
    txHash: 'aedb33a41835c2dbc01654cd56f6357bac774a5e51880044a1c679f2133a8f0d',
    outputIndex: 0,
  };
  const price = 101_000_000n;

  await bid(lucid, ref, price)
    .then(console.log)
    .catch((err) => {
      console.log(err);
    });
})();
