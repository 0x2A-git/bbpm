import { Command } from 'commander';
import { updateCommand } from './update';

const statusCommand = new Command();

statusCommand
  .name('status')
  .description('Set of commands related to package status')
  .addCommand(updateCommand);

export { statusCommand };
