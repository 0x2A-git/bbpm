import { spawn } from 'child_process';
import { cp } from 'fs/promises';
import { EOL } from 'os';
import { basename, join } from 'path';

async function fetchPackage(packageName: string, tempDirPath: string) {
  // Only for demo, abstract package manager later

  const fetchPackageSourceCode = () =>
    new Promise<void>((resolve, reject) => {
      spawn('pacman', ['-Syw', '--noconfirm', packageName], {}).on(
        'close',
        (code) => {
          if (code != 0) {
            reject(
              new Error('Package could not be fetched, make sure network is up')
            );
          }

          resolve();
        }
      );
    });

  await fetchPackageSourceCode();

  const getPackageFiles = () =>
    new Promise<string[]>((resolve, reject) => {
      const packageFiles = spawn(
        'pacman',
        ['-Syi', '--noconfirm', packageName],
        {}
      );

      let packageAttrs = Buffer.from([]);

      packageFiles.stdout.on('data', (data) => {
        packageAttrs = Buffer.concat([packageAttrs, data]);
      });

      packageFiles.on('close', (code) => {
        if (code != 0) {
          reject(
            new Error(
              'Could not fetch package source code from package manager repository'
            )
          );
        }

        const attrs = packageAttrs
          .toString('utf8')
          .replace(/ /g, '')
          .split(EOL)
          .reduce<{ [key: string]: string }>((prev, curr) => {
            const [k, v] = curr.split(':');
            prev[k] = v;
            return prev;
          }, {});

        // TODO : bad leading slash find better solution
        const pacmanCachePath = join('/', 'var', 'cache', 'pacman', 'pkg');

        const sourceFiles = join(
          pacmanCachePath,
          `${attrs['Name']}-${attrs['Version']}-${attrs['Architecture']}.pkg.tar.zst`
        );

        const signatureFile = sourceFiles.concat('.sig');
        resolve([sourceFiles, signatureFile]);
      });
    });

  const packageFiles = await getPackageFiles();

  for (const filepath of packageFiles) {
    await cp(filepath, join(tempDirPath, basename(filepath)));
  }

  const packageFilesPath = packageFiles.map((path) =>
    join(tempDirPath, basename(path))
  );

  return packageFilesPath;
}

export { fetchPackage };
