import { Command } from 'commander';

let program: Command | null = null;

function getProgram() {
  if (!program) {
    program = new Command();
  }

  return program;
}

export { getProgram };
