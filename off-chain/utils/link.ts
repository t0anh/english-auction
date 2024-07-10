const { NETWORK } = process.env;

export function linkToExplorer(txHash: string) {
  return `https://${NETWORK.toLowerCase()}.cardanoscan.io/transaction/${txHash}`;
}
