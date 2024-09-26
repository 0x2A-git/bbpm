import chalk from 'chalk';
import { spawn } from 'child_process';
import { EOL } from 'os';
import { basename, dirname, join } from 'path';
import { extract } from 'tar';

async function extractZstPackage(sourceFilesTarZstPath: string) {
  // TODO : use stream along with zstd lib instead of spawning

  const zstHeader = chalk.blue.bold('ZST');
  console.log(`📤 ${zstHeader} - Extracting package...`);

  const unzstdPackage = () =>
    new Promise<void>((resolve, reject) => {
      spawn('unzstd', [sourceFilesTarZstPath], {
        cwd: dirname(sourceFilesTarZstPath),
      }).on('close', (code) => {
        if (code != 0) {
          reject(new Error('Unable to extract ZST package using unzstd'));
        }

        resolve();
      });
    });

  await unzstdPackage();

  const sourceFilesTarPath = sourceFilesTarZstPath.slice(
    0,
    sourceFilesTarZstPath.lastIndexOf('.')
  );

  await extract({
    file: join(dirname(sourceFilesTarZstPath), basename(sourceFilesTarPath)),
    gzip: true,
    cwd: dirname(sourceFilesTarPath),
  });

  console.log(`✅ ${zstHeader} - Done extracting package !${EOL}`);
}

export { extractZstPackage };
