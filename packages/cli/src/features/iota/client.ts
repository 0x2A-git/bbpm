import { Client } from '@iota/sdk';
import { DEFAULT_NETWORK } from '../../constants';

let client: Client | null = null;

// TODO : Remove hardcoded explorer
function getExplorer() {
  return `https://explorer.iota.org/mainnet`;
}
function getNetwork() {
  return process.env['NODE_URL'] ?? DEFAULT_NETWORK;
}

function getIotaClient() {
  const nodeUrl = getNetwork();

  if (!client) {
    client = new Client({
      nodes: [nodeUrl],
    });
  }

  return client;
}

export { getIotaClient, getNetwork, getExplorer };
