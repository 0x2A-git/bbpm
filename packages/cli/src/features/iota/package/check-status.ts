import chalk from 'chalk';
import { EOL } from 'os';
import { PackageStatus } from '../package-status.enum';

function checkStatus(packageStatus: PackageStatus) {
  const statusHeader = chalk.yellowBright.bold('Status');

  const spacer = chalk.white.bold(' -> ');
  console.log(`🛡️ ${statusHeader} - Checking package status...`);

  const statusName = PackageStatus[packageStatus];

  const formattedStatusName = `${statusName
    .slice(0, 1)
    .toUpperCase()}${statusName.slice(1).split('_').join(' ').toLowerCase()} `;

  if (packageStatus <= PackageStatus.PROHIBITED) {
    throw new Error(
      chalk.bold.red(
        `Could not install package, reason : This package is marked as ${formattedStatusName}`
      )
    );
  }

  // TODO : Bad, switch enum to objects so we don't have to do these ugly conditions
  if (packageStatus == PackageStatus.OUTDATED) {
    console.log(
      `${spacer} ${statusHeader} - Package status is marked as ${chalk.bold.gray(
        formattedStatusName
      )} you can use but it is outdated`
    );
  } else if (packageStatus == PackageStatus.FINE) {
    console.log(
      `${spacer} ${statusHeader} - Package status is marked as ${chalk.bold.yellow(
        formattedStatusName
      )} you can use but it can contain ${chalk.bold.yellow(
        'yellow'
      )} or ${chalk.bold.blue('experimental')} features`
    );
  } else {
    console.log(
      `${spacer} ${statusHeader} - Package status ${chalk.bold(
        formattedStatusName
      )} is ${chalk.bold.green('allowed')}`
    );
  }

  console.log(`✅ ${statusHeader} - Done checking package status !${EOL}`);
}

export { checkStatus };
