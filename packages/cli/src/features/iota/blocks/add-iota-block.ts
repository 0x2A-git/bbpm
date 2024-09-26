import { utf8ToHex, Utils } from '@iota/sdk';
import chalk from 'chalk';
import { EOL } from 'os';
import terminalLink from 'terminal-link';
import { getExplorer, getIotaClient, getNetwork } from '../client';

async function addIotaBlock(blockData: any, signature: string) {
  const blockchainHeader = chalk.blueBright.bold('Blockchain');

  console.log(`🟨 ${blockchainHeader} - Creating Iota block...`);

  // Links data & signature

  const blockchainPayload = {
    data: blockData,
    signature: signature,
  };

  const blockchainData = JSON.stringify(blockchainPayload);

  const hexBlockchainData = utf8ToHex(blockchainData);

  const options = {
    data: hexBlockchainData,
    tag: utf8ToHex(''),
  };

  let blockId: string | null = null;

  try {
    const mnemonic = Utils.generateMnemonic();
    const secretManager = { mnemonic: mnemonic };

    const blockIdAndBlock = await getIotaClient().buildAndPostBlock(
      secretManager,
      options
    );

    blockId = blockIdAndBlock[0];
  } catch (err) {
    let message = 'Unknown error';

    if (err instanceof Error) {
      message = err.message;
    }

    throw new Error(`Could not post block to blockchain, reason : ${message}`);
  }

  console.log(
    `✅ ${blockchainHeader} - Done Creating Iota block : ${EOL}
    \tBlock ID : ${chalk.bold(blockId)}
    \tBlock : ${chalk.blue(
      terminalLink(
        'Click to open block in browser',
        `${getExplorer()}/block/${blockId}`
      )
    )}${EOL}`
  );

  return blockId;
}

export { addIotaBlock };
