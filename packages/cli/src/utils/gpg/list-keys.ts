import { spawn } from 'child_process';
import { EOL } from 'os';

interface GpgKey {
  fingerprint: string;
  owner: string;
}

// TODO : Parse keys info, don't have time for now so only fingerprint
function parseGpgKeys(data: any) {
  const keys = [];
  try {
    const pubKeys = data.split('pub:').slice(1);

    for (const pubKey of pubKeys) {
      data = pubKey.split(EOL);

      const header = data[0];

      const ownerRow = data[2];
      const shortFingerprint = header.split(/:+/)[3];
      const owner = ownerRow.split(/:+/)[4];
      keys.push({
        fingerprint: shortFingerprint,
        owner: owner,
      });
    }
  } catch (err: unknown) {
    let message = 'Unknown error';

    if (err instanceof Error) {
      message = err.message;
    }

    throw new Error(`Could not parse GPG keys, reason : ${message}`);
  }

  return keys;
}

async function listGpgKeys(): Promise<GpgKey[]> {
  const gpgKeysProcess = spawn('gpg', ['--list-keys', '--with-colons'], {});

  let keysBuffer = Buffer.from([]);
  gpgKeysProcess.stdout.on('data', (chunk) => {
    keysBuffer = Buffer.concat([keysBuffer, chunk]);
  });

  return new Promise<GpgKey[]>((resolve, reject) => {
    gpgKeysProcess.on('close', (code) => {
      if (code != 0) {
        reject(new Error('Could not list PGP keys using GPG'));
      }

      const parsedKeys = parseGpgKeys(keysBuffer.toString('utf8'));

      resolve(parsedKeys);
    });
  });
}

export { listGpgKeys };
