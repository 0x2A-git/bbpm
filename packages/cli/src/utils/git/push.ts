import chalk from 'chalk';
import { spawn } from 'child_process';

async function gitPush() {
  // TODO : find why ssh-userauth error
  //const gitRemote = await gitRepository.getRemote('origin');
  //await gitRemote.connect(Enums.DIRECTION.PUSH, {});
  //const gitCurrentBranch = gitRepository.getCurrentBranch();
  //await gitRemote.push(
  //  [`${gitCurrentBranch}:refs/heads/${gitCurrentBranch}`], // Push local branch to remote branch
  //  {
  //    callbacks: {
  //      credentials: function (url, userName) {
  //        return Cred.sshKeyFromAgent(userName);
  //      },
  //    },
  //  }
  //);

  const gitHeader = chalk.redBright.bold('Git');

  return new Promise<void>((resolve, reject) => {
    console.debug(`🌿 ${gitHeader} - Pushing commit...`);
    spawn('git', ['push'], { cwd: process.cwd() }).on('close', (code) => {
      if (code != 0) {
        reject(new Error('Could not push git commit'));
      }

      console.debug(`✅ ${gitHeader} - Done pushing commit !`);
      resolve();
    });
  });
}

export { gitPush };
