import fs from 'fs';
import { createHash } from 'crypto';
import { HASHING_ALGORITHM } from '../../constants';
import chalk from 'chalk';
import { join } from 'path';
import { EOL } from 'os';

async function computeSourceCodeHash(
  repositoryDirPath: string,
  packagedSourceCodePath: string
): Promise<string | null> {
  let hash = null;

  const sourceCodeHeader = chalk.cyan.bold('Source code');
  try {
    console.log(`📃 ${sourceCodeHeader} - Hash is being computed...`);

    const calculateHash = () =>
      new Promise<string>((resolve, reject) => {
        const hash = createHash(HASHING_ALGORITHM);
        const stream = fs.createReadStream(
          join(repositoryDirPath, packagedSourceCodePath)
        );
        const digest = 'hex';

        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest(digest)));
        stream.on('error', (err) => reject(err));
      });

    hash = await calculateHash();

    console.log(
      `✅ ${sourceCodeHeader} - Hash has been computed : ${chalk.bold(
        hash
      )}${EOL}`
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('Unknown error');
    }
  }
  return hash;
}
export { computeSourceCodeHash };
