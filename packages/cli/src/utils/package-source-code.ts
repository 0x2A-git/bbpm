import chalk from 'chalk';
import fs from 'fs';
import { cp, rm } from 'fs/promises';
import { EOL, tmpdir } from 'os';
import { basename, dirname, join, sep } from 'path';
import { create } from 'tar';
import {
  cleanUpEventEmitter,
  EARLY_CLEANUP_EVENT,
} from '../events/early-cleanup';
import { parseGitignore } from './gitignore.parser';

async function packageSourceCode(
  sourceCodePath: string,
  packageName: string,
  version: string,
  filename: string
) {
  let packagingHeader = chalk.yellow.bold('Packaging');

  console.log(`📦 ${packagingHeader} - Packaging source code...`);

  // Indent
  const spacer = chalk.white.bold(' -> ');

  packagingHeader = spacer.concat(packagingHeader);

  let excludedDirectories = [filename, '.git'];

  const currentDirectory = sourceCodePath;

  const packageFullname = `${packageName}-${version}`;

  const packageTempDest = join(tmpdir(), packageFullname);

  const packageTarDstPath = join(currentDirectory, filename);

  const cleanupCallback = async () => {
    console.log(`🧹 ${packagingHeader} - Cleaning up source code package...`);

    try {
      await rm(packageTarDstPath, {
        recursive: true,
      });
    } catch (err: unknown) {
      let message = 'Unknown error';

      if (err instanceof Error) {
        message = err.message;
      }
      console.error(
        `Error, could not cleanup temporary source code package made by Packaging, reason : ${message}${EOL}`
      );
    }

    console.log(
      `✨ ${packagingHeader} - Done cleaning up source code package !${EOL}`
    );

    cleanUpEventEmitter.off(EARLY_CLEANUP_EVENT, cleanupCallback);
  };

  cleanUpEventEmitter.on(EARLY_CLEANUP_EVENT, cleanupCallback);

  try {
    if (fs.existsSync(join(currentDirectory, '.gitignore'))) {
      const gitignoreHeader = chalk.redBright.bold('Gitignore');
      console.debug(
        `${packagingHeader} ( ${gitignoreHeader} ) - .gitignore was found, parsing...`
      );
      const gitignores = await parseGitignore(currentDirectory);

      excludedDirectories = excludedDirectories.concat(gitignores);

      console.debug(
        `${packagingHeader} ( ${gitignoreHeader} ) Done parsing .gitignore !`
      );
    }

    console.debug(`${packagingHeader} - Creating TAR file ${filename}...`);

    // Make copy of source code, then rename to expected name by PKGBUILD

    await cp(currentDirectory, packageTempDest, {
      recursive: true,
    });

    // Create TAR file
    await create(
      {
        portable: true,
        gzip: true,
        file: packageTarDstPath,
        noMtime: true,
        cwd: dirname(packageTempDest),
        filter: (path) => {
          if (path.includes('.gitignore')) return true;
          return !excludedDirectories.some(
            (exclusion) =>
              path.includes(basename(exclusion)) ||
              path.includes(exclusion.concat(sep))
          );
        },
      },
      [basename(packageTempDest)]
    );

    console.debug(`${packagingHeader} - Done creating TAR file ${filename} !`);
  } catch (err: unknown) {
    let message = 'Unknown error';
    if (err instanceof Error) {
      message = err.message;
    }
    console.error(`Error: Could not package source code, reason : ${message} `);
  } finally {
    console.debug(
      `${packagingHeader} - Cleaning up temporary source code directory...`
    );

    await rm(packageTempDest, {
      recursive: true,
    });

    console.debug(
      `${packagingHeader} - Done cleaning up temporary source code directory !`
    );
  }

  // Remove indentation
  packagingHeader = packagingHeader.slice(
    spacer.length,
    packagingHeader.length
  );

  console.log(`✅ ${packagingHeader} - Done packaging source code !${EOL}`);

  return cleanupCallback;
}

export { packageSourceCode };
