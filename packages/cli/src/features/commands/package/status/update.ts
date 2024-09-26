import { getBlocksByVersion } from '../../../../features/iota/blocks/get-blocks-by-version';
import { Command } from 'commander';
import { PackageStatus } from '../../../iota/package-status.enum';
import { parseIotaPayload } from '../../../../features/iota/blocks/parse-iota-payload';
import { getIotaClient } from '../../../iota/client';
import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import { signBlockData } from '../../../../features/iota/blocks/sign-block-data';
import { addIotaBlock } from '../../../../features/iota/blocks/add-iota-block';
import { blockchainCommit } from '../../../../utils/git/blockchain-commit';
import { gitPush } from '../../../../utils/git/push';
import { gpgPrivateKeyPrompt } from '../../../../utils/prompts/gpg-private-key-prompt';
import { Block } from '@iota/sdk';

const updateCommand = new Command();

updateCommand
  .name('update')
  .description('Updates package status on blockchain')
  .argument('<version>', 'Version')
  .action(async (version) => {
    const currentDirectory = process.cwd();

    const blocksIds = await getBlocksByVersion(version, currentDirectory);

    let latestVersionBlock: Block;
    try {
      latestVersionBlock = await getIotaClient().getBlock(blocksIds[0]);
    } catch (err: unknown) {
      let message = 'Unknown error';

      if (err instanceof Error) {
        message = err.message;
      }
      throw new Error(`Could not fetch block to update, reason: ${message}`);
    }

    const blockData = parseIotaPayload(latestVersionBlock, 'data');

    const newStatus = await select({
      message: 'Select a status',
      choices: [
        {
          name: chalk.magenta('N/A'),
          value: PackageStatus.NA,
          description: 'The package is unavailable',
        },
        {
          name: chalk.red('PROHIBITED'),
          value: PackageStatus.PROHIBITED,
          description:
            'Dangerous package, might include virus, worm or a serious error',
        },

        {
          name: chalk.gray('OUTDATED'),
          value: PackageStatus.OUTDATED,
          description:
            'The package in BBPM is outdated compared to “official source"',
        },
        {
          name: chalk.yellow('FINE'),
          value: PackageStatus.FINE,
          description:
            'It’s fine, but the package may include bugs or it’s alpha version',
        },

        {
          name: chalk.green('RECOMMENDED'),
          value: PackageStatus.RECOMMENDED,
          description: 'Everything is good, fresh package',
        },
        {
          name: chalk.blue('HIGHLY RECOMMENDED'),
          value: PackageStatus.HIGHLY_RECOMMENDED,
          description:
            'Package has been tested & verified as safe and stable by several committers.',
        },
      ],
    });

    blockData.status = newStatus;

    const [privateKey, passphrase] = await gpgPrivateKeyPrompt();

    const signature = await signBlockData(blockData, privateKey, passphrase);

    const blockId = await addIotaBlock(blockData, signature);

    const commitMessagePayload = JSON.stringify({
      version: version,
      blockId: blockId,
    });

    await blockchainCommit(commitMessagePayload);

    await gitPush();
  });

export { updateCommand };
