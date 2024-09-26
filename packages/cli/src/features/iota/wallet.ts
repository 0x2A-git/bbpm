import { Wallet } from '@iota/sdk';

let wallet: Wallet | null = null;

function getWallet() {
  if (!wallet) {
    wallet = new Wallet({});
  }

  return wallet;
}
