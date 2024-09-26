import chalk from 'chalk';
import { EOL } from 'os';
import {
  cleanUpEventEmitter,
  EARLY_CLEANUP_EVENT,
} from './events/early-cleanup';
import { installCommand } from './features/commands/install';
import { packageCommand } from './features/commands/package';
import { getProgram } from './program';

const program = getProgram();

const letterHightlight = chalk.bold;
console.log(
  chalk.blue(
    `${letterHightlight('B')}lockhain-${letterHightlight(
      'B'
    )}ased ${letterHightlight('P')}ackage ${letterHightlight('M')}anager${EOL}`
  )
);

try {
  program
    .name('bbpm')
    .description('CLI to verify packages sources from blockchain')
    .version('1.0.0')
    .hook('postAction', async () => {
      // Mandatory when using Iota client, else CLI hangs
      process.exit();
    });

  program.addCommand(packageCommand);
  program.addCommand(installCommand);

  program.parse();
} catch (err: unknown) {
  let message = null;

  if (err instanceof Error) {
    message = err.message;
  }

  console.error(`Program crashed with following error : ${message ?? err}`);

  cleanUpEventEmitter.emit(EARLY_CLEANUP_EVENT);
}
