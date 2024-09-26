import { readFile } from 'fs/promises';
import { EOL } from 'os';

async function parsePkgInfo(pkgInfoPath: string) {
  // Fetch repo url

  const pkgInfoBuffer = await readFile(pkgInfoPath);

  const pkgInfoAttrs: any = pkgInfoBuffer
    .toString('utf8')
    .replace(/ /g, '')
    .split(EOL)
    .reduce<{ [key: string]: string }>((prev, curr) => {
      const [k, v] = curr.split('=');
      prev[k] = v;
      return prev;
    }, {});

  return pkgInfoAttrs;
}

export { parsePkgInfo };
