import { spawn } from 'child_process';

async function pgpSignFile(
  fingerprint: string,
  passphrase: string,
  filePath: string
) {
  const gpgPrivateKeyProcess = spawn(
    'gpg',
    [
      '--detach-sig',
      '--pinentry-mode=loopback',
      `--passphrase`,
      passphrase,
      `--local-user`,
      fingerprint,
      filePath,
    ],
    {}
  );

  gpgPrivateKeyProcess.stderr.on('data', (chunk) => {
    console.error(Buffer.from(chunk).toString('utf8'));
  });

  return new Promise<void>((resolve, reject) => {
    gpgPrivateKeyProcess.on('close', (code) => {
      if (code != 0) {
        reject(new Error('Could not produce PGP signature using GPG'));
      }

      resolve();
    });
  });

  // TODO : rewrite with openpgp
  // const privateKey = await openpgp.readPrivateKey({
  //   armoredKey: rawPrivateKey,
  // });
  //
  // const decryptedPrivateKey = await openpgp.decryptKey({
  //   privateKey: privateKey,
  //   passphrase: passphrase,
  // });
  //
  // const fileContent = await readFile(filePath);
  //
  // const message = await openpgp.createMessage({
  //   text: fileContent.toString(),
  // });
  //
  // const detachedSignature = await openpgp.sign({
  //   message: message,
  //   signingKeys: [decryptedPrivateKey],
  //   detached: true,
  //   format: 'binary',
  // });
  //
  // return detachedSignature;
}

export { pgpSignFile };
