import { Command } from 'commander';
import { statusCommand } from './status';
import { submitCommand } from './submit';

const packageCommand = new Command();

packageCommand
  .name('package')
  .description('Set of commands to handle package')
  .addCommand(statusCommand)
  .addCommand(submitCommand);

export { packageCommand };
