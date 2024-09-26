import chalk from 'chalk';
import { Commit, Repository, Signature, Tree } from 'nodegit';
import { EOL } from 'os';
async function blockchainCommit(
  commitMessage: string,
  author: string = 'bbpm-bot',
  email: string = 'bbpm-bot@CwbcpjcY7HMnfMzK5L2bn3bZ6ZQc2ZwcFSRgZ87p3aUGkzspRB9ctvQzWhbS3qf8.com'
) {
  const commitHeader = chalk.yellow('Commit');
  console.debug(`📝 ${commitHeader} - Generating commit...`);

  const gitRepository = await Repository.open('.git');

  const gitIndex = await gitRepository.refreshIndex();

  const gitOid = await gitIndex.writeTree(); // Write tree object to index

  const gitTree = await Tree.lookup(gitRepository, gitOid);

  const gitSignature = Signature.create(author, email, Date.now(), 0);

  const latestCommit = await gitRepository.getHeadCommit();

  const commit = await Commit.create(
    gitRepository,
    'HEAD',
    gitSignature,
    gitSignature,
    'UTF-8',
    commitMessage,
    gitTree,
    1,
    [latestCommit]
  );

  console.debug(`✅ ${commitHeader} - Done generating commit !${EOL}`);
}

export { blockchainCommit };
