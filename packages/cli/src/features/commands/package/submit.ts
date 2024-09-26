import fs from 'fs';
import { Command } from 'commander';
import { computeSourceCodeHash } from '../../../utils/hashes/source-code-hash';
import { join } from 'path';
import { packageSourceCode } from '../../../utils/package-source-code';
import { makePackage } from '../../../utils/make-package';
import { computeBinaryHash } from '../../../utils/hashes/binary-hash';
import { glob } from 'glob';
import { cp, mkdir } from 'fs/promises';
import { blockchainCommit } from '../../../utils/git/blockchain-commit';
import { addIotaBlock } from '../../../features/iota/blocks/add-iota-block';
import { PackageStatus } from '../../iota/package-status.enum';
import { signBlockData } from '../../../features/iota/blocks/sign-block-data';
import { gitPush } from '../../../utils/git/push';
import { gpgPrivateKeyPrompt } from '../../../utils/prompts/gpg-private-key-prompt';

const submitCommand = new Command();

submitCommand
  .name('submit')
  .description('Submits source code and binary hashes to blockchain')
  .argument('<pkgbuild_path>', 'PKGBUILD path')
  .argument('<package_name>', 'Package name')
  .argument('<version>', 'Version')
  .action(async (pkgBuildPath, packageName, version, opts) => {
    const currentDirectory = process.cwd();

    const packagedSourceCodeTarFilename = `.bbpm_${packageName}-${version}.tar.gz`;
    const packagingDirectoryName = '.bbpm_pkgbuild';

    // Package source code using tar
    const cleanupPackageSourceCode = await packageSourceCode(
      currentDirectory,
      packageName,
      version,
      packagedSourceCodeTarFilename
    );

    // Calculates source code hash
    const sourceCodeHash = await computeSourceCodeHash(
      currentDirectory,
      packagedSourceCodeTarFilename
    );

    // Get private key & passphrase
    const [privateKey, passphrase, fingerprint] = await gpgPrivateKeyPrompt();

    if (!sourceCodeHash) {
      throw new Error('Could not calculate source code hash');
    }

    // Build package
    const cleanupPackageDirectory = await makePackage(
      pkgBuildPath,
      join(currentDirectory, packagedSourceCodeTarFilename),
      sourceCodeHash,
      packagingDirectoryName,
      packageName,
      version,
      {
        fingerprint: fingerprint,
        passphrase: passphrase,
      }
    );

    // TODO : support multi binaries

    const binaryPath = join(
      currentDirectory,
      packagingDirectoryName,
      'pkg',
      packageName,
      'usr',
      'bin',
      packageName
    );

    const binaryHash = await computeBinaryHash(binaryPath);

    const packagingDirectoryPath = join(
      currentDirectory,
      packagingDirectoryName
    );
    const distRepoFiles = await glob('*.zst*', {
      cwd: packagingDirectoryPath,
    });

    const buildDirName = 'bbpm_build';
    const buildDirPath = join(currentDirectory, buildDirName);

    if (!fs.existsSync(buildDirPath)) {
      await mkdir(join(currentDirectory, buildDirName));
    }

    for (const zst of distRepoFiles) {
      await cp(join(packagingDirectoryPath, zst), join(buildDirPath, zst));
    }

    await cleanupPackageDirectory();
    await cleanupPackageSourceCode();

    // Creates iota block

    const dataPayload = {
      hashes: {
        sourceCode: sourceCodeHash,
        binary: binaryHash,
      },
      version: version,
      status: PackageStatus.RECOMMENDED,
    };

    const signature = await signBlockData(dataPayload, privateKey, passphrase);

    const blockId = await addIotaBlock(dataPayload, signature);

    // Generates commit

    const commitMessagePayload = JSON.stringify({
      version: version,
      blockId: blockId,
    });

    await blockchainCommit(commitMessagePayload);
    await gitPush();
  });

export { submitCommand };
