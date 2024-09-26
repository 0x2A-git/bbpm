import { spawn } from 'child_process';
import { EOL } from 'os';
import chalk from 'chalk';

/**
 * Returns blocks of given version by leveraging git's history
 */
async function getBlocksByVersion(
  version: string,
  localRepositoryPath: string
) {
  return new Promise<string[]>((resolve, reject) => {
    const blockchainHeader = chalk.blueBright.bold('Blockchain');
    console.log(`🟦 ${blockchainHeader} - Finding block ID by version...`);
    const gitLog = spawn(
      'git',
      ['log', '--pretty=format:%B', '--author=bbpm-bot'],
      {
        cwd: localRepositoryPath,
      }
    );

    let logsBuffer = Buffer.from([]);

    gitLog.stdout.on('data', (data) => {
      logsBuffer = Buffer.concat([logsBuffer, data]);
    });

    gitLog.stderr.on('data', (err) => {
      console.log(Buffer.from(err).toString('utf8'));
    });
    gitLog.on('close', (code) => {
      if (code != 0) {
        reject(new Error('Could not find blocks through git by using version'));
      }

      let blocksIds = [];

      try {
        // Find all updates made to blockchain
        blocksIds = logsBuffer
          .toString('utf8')
          .split(EOL)
          .reduce<string[]>((prev, curr) => {
            const data = JSON.parse(curr);

            if (data['version'] === version) {
              prev.push(data['blockId']);
            }
            return prev;
          }, []);
      } catch (err: unknown) {
        throw new Error(
          chalk.bold.red(
            "Could not find BBPM's git history, is current directory a git repository ?"
          )
        );
      }
      console.log(
        `✅ ${blockchainHeader} - Done finding block ID by version !${EOL}`
      );
      resolve(blocksIds);
    });
  });
}

export { getBlocksByVersion };
