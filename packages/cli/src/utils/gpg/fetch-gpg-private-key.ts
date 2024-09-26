import { spawn } from 'child_process';

function fetchGpgPrivateKey(fingerprint: string, passphrase: string) {
  const gpgPrivateKeyProcess = spawn(
    'gpg',
    [
      '--passphrase',
      passphrase,
      '--pinentry-mode',
      'loopback',
      '--armor',
      '--export-secret-key',
      fingerprint,
    ],
    {}
  );

  let privateKeyBuffer = Buffer.from([]);

  gpgPrivateKeyProcess.stderr.on('data', (chunk) => {
    console.error(Buffer.from(chunk).toString('utf8'));
  });
  gpgPrivateKeyProcess.stdout.on('data', (chunk) => {
    privateKeyBuffer = Buffer.concat([privateKeyBuffer, chunk]);
  });

  return new Promise<string>((resolve, reject) => {
    gpgPrivateKeyProcess.on('close', (code) => {
      if (code != 0) {
        reject(new Error('Could not fetch PGP private key through GPG'));
      }

      resolve(privateKeyBuffer.toString('utf8'));
    });
  });
}

export { fetchGpgPrivateKey };
