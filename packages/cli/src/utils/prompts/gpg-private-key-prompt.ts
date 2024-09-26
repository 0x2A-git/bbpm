import { password, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { listGpgKeys } from '../gpg/list-keys';
import { fetchGpgPrivateKey } from '../gpg/fetch-gpg-private-key';

async function gpgPrivateKeyPrompt() {
  let availableKeys = [];
  try {
    availableKeys = await listGpgKeys();
  } catch (err: unknown) {
    let message = 'Unknown error';

    if (err instanceof Error) {
      message = err.message;
    }

    throw new Error(`Could not list GPG keys, reason : ${message}`);
  }

  const fingerprint = await select({
    message: 'Select a key to sign with',
    choices: availableKeys.map((key) => ({
      name: chalk.white(
        `🔑 ${chalk.bold.blueBright(key.fingerprint)} ( ${chalk.bold.blue(
          key.owner
        )} )`
      ),
      value: key.fingerprint,
    })),
  });

  const passphrase = await password({
    message: `${fingerprint} passphrase :`,
    mask: true,
  });

  let privateKey = '';

  try {
    privateKey = await fetchGpgPrivateKey(fingerprint, passphrase);
  } catch (err: unknown) {
    let message = 'Unknown error';

    if (err instanceof Error) {
      message = err.message;
    }

    throw new Error(`Could not fetch GPG key, reason : ${message}`);
  }

  return [privateKey, passphrase, fingerprint];
}
export { gpgPrivateKeyPrompt };
