import { readFile } from 'fs/promises';
import { EOL } from 'os';
import { join } from 'path';

async function parseGitignore(path: string, filename = '.gitignore') {
  const gitignorePath = join(path, filename);

  let ignoredFiles: string[] | null = null;

  try {
    const file = await readFile(gitignorePath);

    const data = file.toString();

    ignoredFiles = data.split(EOL);
  } catch (err: unknown) {
    let message = 'Unknown error';

    if (err instanceof Error) {
      message = err.message;
    }

    throw new Error(
      `Could not parse gitignore file ( ${path} ) this is likely to cause production of wrong hashes, reason : ${message}`
    );
  }

  return ignoredFiles.slice(0, ignoredFiles.length - 1);
}

export { parseGitignore };
