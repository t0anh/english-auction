import { credentialToAddress } from '@lucid-evolution/lucid';
import { get } from 'lodash';
import invariant from 'tiny-invariant';
import { AuctionContract } from './plutus';

const { NETWORK } = process.env;

export function addressFromData(data: typeof AuctionContract.datum.sellerAddr) {
  const paymentVkh = get(data, [
    'paymentCredential',
    'VerificationKeyCredential',
    0,
  ]);

  const stakeVkh = get(data, [
    'stakeCredential',
    'Inline',
    0,
    'VerificationKeyCredential',
    0,
  ]);

  invariant(paymentVkh, 'Unsupported payment key type');
  invariant(stakeVkh, 'Unsupported stake key type');

  return credentialToAddress(
    NETWORK,
    { type: 'Key', hash: paymentVkh },
    { type: 'Key', hash: stakeVkh }
  );
}

export function hexToUtf8(h: string) {
  var s = '';
  for (var i = 0; i < h.length; i += 2) {
    s += String.fromCharCode(parseInt(h.substr(i, 2), 16));
  }
  return decodeURIComponent(escape(s));
}
