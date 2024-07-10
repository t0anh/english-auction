import { KoiosClient } from '@danogojs/sdk';
import {
  Data,
  validatorToScriptHash,
  type OutRef,
} from '@lucid-evolution/lucid';
import { AuctionContract } from '../utils/plutus';
import invariant from 'tiny-invariant';
import { addressFromData, hexToUtf8 } from '../utils/data';
import { linkToExplorer } from '../utils/link';

const { NETWORK } = process.env;

async function listAuctions() {
  // Init a provider to query on-chain data
  const koios = new KoiosClient(NETWORK);

  const contract = new AuctionContract();

  const scriptHash = validatorToScriptHash(contract);

  // Get all utxos sitting at the auction contract (all active auctions)
  const utxos = await koios.getUtxosByCredentials([scriptHash]);

  // Map data to a human-readable structure
  const auctions = utxos.map((utxo) => {
    invariant(utxo.inline_datum);
    const { sellerAddr, deadline, reservePrice, lastBid } = Data.from(
      utxo.inline_datum.bytes,
      AuctionContract.datum
    );
    return {
      ref: { txHash: utxo.tx_hash, outputIndex: utxo.tx_index } as OutRef,
      assets: utxo.asset_list?.map((asset) => [
        hexToUtf8(asset.asset_name ?? ''),
        asset.quantity,
      ]),
      lockedFunds: utxo.value,
      state: {
        seller: addressFromData(sellerAddr),
        lastBid: lastBid ? [addressFromData(lastBid[0]), lastBid[1]] : null,
        deadline: new Date(Number(deadline)).toTimeString(),
        reservePrice,
      },
      link: linkToExplorer(utxo.tx_hash),
    };
  });

  return auctions;
}

(async function main() {
  await listAuctions().then(console.log);
})();
