import { findPackagerPublicKey } from '../../../utils/pacman/find-packager-public-key';
import chalk from 'chalk';
import * as openpgp from 'openpgp';
import { EOL } from 'os';
// TODO : type localMessage
async function verifyPackageSignature(
  blockSignature: string,
  localMessage: any,
  localSourceCodeHash: string,
  localBinaryHash: string
) {
  const signatureHeader = chalk.bold('Signature');

  const spacer = chalk.white.bold(' -> ');

  console.log(`🖊️ ${signatureHeader} - Verifying signature...`);
  const signature = await openpgp.readSignature({
    armoredSignature: blockSignature,
  });

  const packagerFingerprint = signature.getSigningKeyIDs()[0].toHex();

  const packagerRawPublicKey = await findPackagerPublicKey(packagerFingerprint);

  const packagerPublicKey = await openpgp.readKey({
    armoredKey: packagerRawPublicKey,
  });

  // Replace hashes with the ones generated locally to check if match
  // TODO : better handling of binaries

  localMessage.hashes = {
    sourceCode: localSourceCodeHash,
    binary: localBinaryHash,
  };

  const message = await openpgp.createMessage({
    text: JSON.stringify(localMessage),
  });

  const verificationResult = await openpgp.verify({
    message: message,
    signature: signature,
    verificationKeys: packagerPublicKey,
  });
  const { verified, keyID } = verificationResult.signatures[0];

  try {
    await verified; // throws on invalid signature

    console.log(
      `${spacer} ${signatureHeader} - Signed by key id ${chalk.bold(
        keyID.toHex()
      )}`
    );
  } catch (err: unknown) {
    let message = 'Unknown error';

    if (err instanceof Error) {
      message = err.message;
    }

    throw new Error(`Signature could not be verified: ${message}`);
  }

  console.log(`✅ ${signatureHeader} - Done verifying signature !${EOL}`);
}

export { verifyPackageSignature };
