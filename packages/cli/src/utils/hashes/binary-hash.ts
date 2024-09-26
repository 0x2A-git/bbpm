import fs from 'fs';
import { createHash } from 'crypto';
import { HASHING_ALGORITHM } from '../../constants';
import chalk from 'chalk';
import { EOL } from 'os';

async function computeBinaryHash(path: string): Promise<string> {
  let binaryHash: string | null = null;

  const binariesHeader = chalk.green.bold('Binaries');
  try {
    console.log(`💾 ${binariesHeader} - Binaries hashes are being computed...`);

    const binPath = path;
    const calculateHash = () =>
      new Promise<string>((resolve, reject) => {
        const hash = createHash(HASHING_ALGORITHM);
        const stream = fs.createReadStream(binPath);
        const digest = 'hex';

        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest(digest)));
        stream.on('error', (err) => reject(err));
      });

    binaryHash = await calculateHash();

    console.log(
      `✅ ${binariesHeader} - Binaries hashes have been computed : ${chalk.bold(
        binaryHash
      )}${EOL}`
    );
  } catch (error: unknown) {
    let message = 'Unknown error';

    if (error instanceof Error) {
      message = error.message;
    }

    throw new Error(`Could not hash binaries, reason : ${message}`);
  }

  return binaryHash;
}

export { computeBinaryHash };
