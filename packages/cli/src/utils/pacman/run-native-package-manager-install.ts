import chalk from 'chalk';
import { spawn } from 'child_process';

async function runNativePackageManagerInstall(packageName: string) {
  return new Promise<void>((resolve, reject) => {
    const installPackageHeader = chalk.bold.green('Installation');

    console.log(`🚚 ${installPackageHeader} - Installing package...`);

    const installPackage = spawn(
      'pacman',
      ['-S', '--noconfirm', packageName],
      {}
    );

    installPackage.stderr.on('data', (chunk) => {
      console.error(Buffer.from(chunk).toString('utf8'));
    });

    installPackage.stdout.on('data', (chunk) => {
      console.log(Buffer.from(chunk).toString('utf8'));
    });
    installPackage.on('close', (code) => {
      if (code != 0) {
        reject(new Error('Could not install package using pacman'));
      }

      console.log(
        `🎉 ${installPackageHeader} - Done installing package, ${chalk.bold.magentaBright(
          'enjoy'
        )} !`
      );
      resolve();
    });
  });
}

export { runNativePackageManagerInstall };
