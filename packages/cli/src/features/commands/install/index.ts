import { Command } from 'commander';
import { mkdtemp } from 'fs/promises';
import path, { join } from 'path';
import os from 'os';
import { getIotaClient } from '../../iota/client';
import { packageSourceCode } from '../../../utils/package-source-code';
import { computeSourceCodeHash } from '../../../utils/hashes/source-code-hash';
import { computeBinaryHash } from '../../../utils/hashes/binary-hash';
import { getBlocksByVersion } from '../../../features/iota/blocks/get-blocks-by-version';
import { parseIotaPayload } from '../../../features/iota/blocks/parse-iota-payload';
import { PackageStatus } from '../../iota/package-status.enum';
import { confirm } from '@inquirer/prompts';
import { fetchPackage } from '../../../utils/pacman/fetch-package';
import { cloneRemoteRepository } from '../../../utils/git/clone-remote-repository';
import { extractZstPackage } from '../../../utils/zst/extract';
import { parsePkgInfo } from '../../..//utils/pkg/parse-pkg-info';
import { runNativePackageManagerInstall } from '../../../utils/pacman/run-native-package-manager-install';
import { verifyPackageSignature } from '../../iota/package/verify-package-signature';
import { checkStatus } from '../../iota/package/check-status';
const installCommand = new Command();

installCommand
  .name('install')
  .description('Install package using BBPM')
  .argument('<package_name>', 'Package to install')
  .action(async (packageName, opts) => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'bbpm-'));

    const localRepositoryPath = join(tempDir, 'repo'); // Git repo local location

    let pkgVersion: string;
    const [sourceFilesTarZstPath, signatureFilesTarZstPath] =
      await fetchPackage(packageName, tempDir);

    await extractZstPackage(sourceFilesTarZstPath);

    const pkgInfoPath = join(tempDir, '.PKGINFO');

    const pkgInfoAttrs: any = await parsePkgInfo(pkgInfoPath);

    pkgVersion = pkgInfoAttrs['pkgver'];
    const remoteRepositoryUrl = pkgInfoAttrs['url'];

    await cloneRemoteRepository(remoteRepositoryUrl, localRepositoryPath);

    const blocksIds = await getBlocksByVersion(
      pkgVersion.slice(0, pkgVersion.lastIndexOf('-')),
      localRepositoryPath
    );

    const latestBlockId = blocksIds[0];

    const block = await getIotaClient().getBlock(latestBlockId);

    if (!block.payload) {
      throw new Error('Block seems empty');
    }

    const blockData = parseIotaPayload(block);

    const blockSignature = blockData.signature;

    const packagedSourceCodeTarName = '.bbpm_source_code.tar.gz';

    const cleanupPackageSourceCode = await packageSourceCode(
      localRepositoryPath,
      packageName,
      '1.0.0',
      packagedSourceCodeTarName
    );

    const localSourceFileHash: string | null = await computeSourceCodeHash(
      localRepositoryPath,
      packagedSourceCodeTarName
    );

    if (!localSourceFileHash) {
      throw new Error('Local source code file hash could not be calculated');
    }

    await cleanupPackageSourceCode();

    const localBinaryHash: string = await computeBinaryHash(
      join(tempDir, 'usr', 'bin', packageName)
    );

    await verifyPackageSignature(
      blockSignature,
      blockData.data,
      localSourceFileHash,
      localBinaryHash
    );

    const packageStatus: PackageStatus = blockData.data.status;

    checkStatus(packageStatus);
    const shouldInstall = await confirm({
      message: 'Proceed with installation ?',
    });

    if (!shouldInstall) {
      console.log('Installation was aborted, exiting...');
      process.exit(0);
    }

    await runNativePackageManagerInstall(packageName);
  });

export { installCommand };
