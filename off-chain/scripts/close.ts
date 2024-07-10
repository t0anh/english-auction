import { Data, type LucidEvolution, type OutRef } from '@lucid-evolution/lucid';
import { omit } from 'lodash';
import invariant from 'tiny-invariant';
import { addressFromData } from '../utils/data';
import { linkToExplorer } from '../utils/link';
import { AuctionContract } from '../utils/plutus';
import { Minutes } from '../utils/time';
import { initLucid } from '../utils/wallet';

async function close(lucid: LucidEvolution, ref: OutRef) {
  const [auctionUtxo] = await lucid.utxosByOutRef([ref]);

  const fundsToSeller = auctionUtxo.assets.lovelace;

  invariant(auctionUtxo.datum, 'Invalid auction datum');

  const auctionContract = new AuctionContract();
  const auctionState = Data.from(auctionUtxo.datum, AuctionContract.datum);

  const sellerAddr = addressFromData(auctionState.sellerAddr);

  const validFrom = new Date().getTime() - 1 * Minutes;
  const validTo = validFrom + 5 * Minutes;

  let tx = lucid
    .newTx()
    .attach.SpendingValidator(auctionContract)
    .collectFrom([auctionUtxo], Data.to('Close', AuctionContract.redeemer))
    .validFrom(validFrom)
    .validTo(validTo);

  if (auctionState.lastBid) {
    const [buyerAddrData, _] = auctionState.lastBid;

    const buyerAddr = addressFromData(buyerAddrData);

    const buyerAssets = omit(auctionUtxo.assets, 'lovelace');

    tx = tx.pay
      .ToAddress(sellerAddr, { lovelace: fundsToSeller })
      .pay.ToAddress(buyerAddr, buyerAssets);
  } else {
    tx = tx.pay.ToAddress(sellerAddr, auctionUtxo.assets);
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
    outputIndex: 0,
    txHash: '71c7c9b3089de306b974085c17bd3a3b07202f4b0d59671928f246fe81313206',
  };
  await close(lucid, ref).then(console.log);
})();
