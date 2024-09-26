import chalk from 'chalk';
import * as openpgp from 'openpgp';
import { EOL } from 'os';

// TODO : type data
async function signBlockData(
  dataPayload: any,
  rawPrivateKey: string,
  passphrase: string
) {
  // Sign data payload

  const signatureHeader = chalk.bold('Signature');

  console.log(`🖊️ ${signatureHeader} - Generating signature...`);

  const data = JSON.stringify(dataPayload);

  const privateKey = await openpgp.readPrivateKey({
    armoredKey: rawPrivateKey,
  });

  const decryptedPrivateKey = await openpgp.decryptKey({
    privateKey: privateKey,
    passphrase: passphrase,
  });

  const message = await openpgp.createMessage({
    text: data,
  });

  const detachedSignature = await openpgp.sign({
    message: message,
    signingKeys: [decryptedPrivateKey],
    detached: true,
  });

  console.debug(`✅ ${signatureHeader}- Done generating signature !${EOL}`);

  return new String(detachedSignature).toString();
}

export { signBlockData };
