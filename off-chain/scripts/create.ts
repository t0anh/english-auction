import {
  Data,
  fromText,
  getAddressDetails,
  mintingPolicyToId,
  scriptFromNative,
  toUnit,
  validatorToAddress,
  type LucidEvolution,
} from '@lucid-evolution/lucid';
import invariant from 'tiny-invariant';
import { linkToExplorer } from '../utils/link';
import { initLucid } from '../utils/wallet';
import { AuctionContract } from '../utils/plutus';
import { Minutes } from '../utils/time';

const { NETWORK } = process.env;

/**
 * Mint a token and send to auction smart contract to open an auction session
 */
async function createAuction(
  lucid: LucidEvolution,
  {
    tokenName,
    reservePrice,
    deadline,
  }: { tokenName: string; reservePrice: bigint; deadline: number }
) {
  const ownAddr = await lucid.wallet().address();
  const { paymentCredential, stakeCredential } = getAddressDetails(ownAddr);

  invariant(
    paymentCredential && paymentCredential.type === 'Key',
    'Only support verification payment key'
  );

  invariant(
    stakeCredential && stakeCredential.type === 'Key',
    'Only support verification stake key'
  );

  const ownMintingPolicy = scriptFromNative({
    type: 'all',
    scripts: [
      // Only this address is able to mint this policy
      { type: 'sig', keyHash: paymentCredential.hash },
    ],
  });

  const contract = new AuctionContract();
  const contractAddr = validatorToAddress(NETWORK, contract, stakeCredential);

  const ownPolicyId = mintingPolicyToId(ownMintingPolicy);
  const mintToken = toUnit(ownPolicyId, tokenName);
  const mintQty = 1n;

  const txHash = await lucid
    .newTx()
    .attach.MintingPolicy(ownMintingPolicy)
    .mintAssets({
      [mintToken]: mintQty,
    })
    .pay.ToContract(
      contractAddr,
      {
        kind: 'inline',
        value: Data.to(
          {
            sellerAddr: {
              paymentCredential: {
                VerificationKeyCredential: [paymentCredential.hash],
              },
              stakeCredential: {
                Inline: [{ VerificationKeyCredential: [stakeCredential.hash] }],
              },
            },
            deadline: BigInt(deadline),
            lastBid: null,
            reservePrice,
          },
          AuctionContract.datum
        ),
      },
      { [mintToken]: mintQty }
    )
    .complete()
    .then((tx) => tx.sign.withWallet().complete())
    .then((tx) => tx.submit());

  return linkToExplorer(txHash);
}

(async function main() {
  const lucid = await initLucid();

  await createAuction(lucid, {
    tokenName: fromText('My token'),
    // Closed after 5 mins
    deadline: new Date().getTime() + 15 * Minutes,
    // Ask at least 100 ADA for this token
    reservePrice: 100_000_000n,
  }).then(console.log);
})();
