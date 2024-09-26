import chalk from 'chalk';
import { Clone } from 'nodegit';
import { EOL } from 'os';

async function cloneRemoteRepository(
  repositoryUrl: string,
  localRepoDstPath: string
) {
  const gitHeader = chalk.redBright.bold('Git');

  console.debug(`🌿 ${gitHeader} - Cloning git repo...`);

  await Clone(repositoryUrl, localRepoDstPath);

  console.debug(`✅ ${gitHeader} - Done cloning git repo !${EOL}`);
}

export { cloneRemoteRepository };
