import { spawn } from 'child_process';

async function findPackagerPublicKey(fingerprint: string) {
  return new Promise<string>((resolve, reject) => {
    const pacmanKey = spawn('pacman-key', ['--export', fingerprint], {});

    let pgpPublicKeyBuffer = Buffer.from([]);

    pacmanKey.stdout.on('data', (data) => {
      pgpPublicKeyBuffer = Buffer.concat([pgpPublicKeyBuffer, data]);
    });
    pacmanKey.on('close', (code) => {
      if (code != 0) {
        reject(
          new Error("Could not get packager's public key using package manager")
        );
      }

      resolve(pgpPublicKeyBuffer.toString('utf8'));
    });
  });
}

export { findPackagerPublicKey };
