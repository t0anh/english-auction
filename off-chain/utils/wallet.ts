import { KoiosProvider } from '@danogojs/sdk';
import { Lucid } from '@lucid-evolution/lucid';

const { NETWORK, SEED } = process.env;

export async function initLucid() {
  const provider = new KoiosProvider(NETWORK);
  const lucid = await Lucid(provider, NETWORK);
  lucid.selectWallet.fromSeed(SEED);
  return lucid;
}
