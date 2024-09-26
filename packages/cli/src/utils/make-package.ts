import { spawn } from 'child_process';
import { cp, mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { rm } from 'fs/promises';
import chalk from 'chalk';
import { EOL } from 'os';
import {
  cleanUpEventEmitter,
  EARLY_CLEANUP_EVENT,
} from '../events/early-cleanup';
import { glob } from 'glob';
import { pgpSignFile } from './pgp/sign-files';

async function makePackage(
  pkgbuildPath: string,
  sourceCodeTarPath: string,
  sourceCodeHash: string,
  packagingDirectoryName: string,
  packageName: string,
  packageVersion: string,
  signatureSettings?: {
    fingerprint: string;
    passphrase: string;
  }
) {
  const sourceCodeTarName = `${packageName}-${packageVersion}.tar.gz`;

  const bbpmPackagePath = join(process.cwd(), packagingDirectoryName);

  const makePkgHeader = chalk.yellow.bold('MakePkg');

  console.log(`🔨 ${makePkgHeader} - Building package...`);

  const cleanupCallback = async () => {
    console.log(`🧹 ${makePkgHeader} - Cleaning up packaging directory...`);

    try {
      await rm(bbpmPackagePath, {
        recursive: true,
      });
    } catch (err: unknown) {
      let message = 'Unknown error';

      if (err instanceof Error) {
        message = err.message;
      }
      console.error(
        `Error, could not cleanup temporary directory made by MakePkg, reason : ${message}${EOL}`
      );
    }

    console.log(
      `✨ ${makePkgHeader} - Done cleaning up packaging directory !${EOL}`
    );

    cleanUpEventEmitter.off(EARLY_CLEANUP_EVENT, cleanupCallback);
  };

  cleanUpEventEmitter.on(EARLY_CLEANUP_EVENT, cleanupCallback);

  try {
    await mkdir(bbpmPackagePath);

    const localPkgBuildPath = join(bbpmPackagePath, 'PKGBUILD');

    await cp(pkgbuildPath, localPkgBuildPath);

    await cp(sourceCodeTarPath, join(bbpmPackagePath, sourceCodeTarName));

    const pkgBuildFile = await readFile(localPkgBuildPath);

    const pkgBuildEdited = pkgBuildFile
      .toString('utf8')
      .replace(
        /source=[\s\S]*?(?=\n.*?=|$)/,
        `source=("$pkgname-$pkgver.tar.gz"::${sourceCodeTarName})`
      )
      .replace(
        /sha512sums=[\s\S]*?(?=\n.*?=|$)/,
        `sha512sums=("${sourceCodeHash}")`
      );

    await writeFile(localPkgBuildPath, pkgBuildEdited);

    const build = () =>
      new Promise<void>((resolve, reject) => {
        spawn('makepkg', ['-sr'], { cwd: bbpmPackagePath }).on(
          'close',
          (code) => {
            if (code != 0) {
              reject(
                new Error(
                  'makepkg seems to have failed while trying to build package'
                )
              );
            }

            resolve();
          }
        );
      });

    await build();

    // Sign
    if (signatureSettings) {
      const distZstFiles = await glob('*.zst', {
        cwd: packagingDirectoryName,
      });

      for (const zstFile of distZstFiles) {
        await pgpSignFile(
          signatureSettings.fingerprint,
          signatureSettings.passphrase,
          join(packagingDirectoryName, zstFile)
        );
      }
    }
  } catch (error: unknown) {
    let message = 'Unknown error';

    if (error instanceof Error) {
      message = error.message;
    }

    await cleanupCallback();

    throw new Error(`Could not build package, reason : ${message}`);
  }

  console.log(`✅ ${makePkgHeader} - Done building package !${EOL}`);

  return cleanupCallback;
}

export { makePackage };
