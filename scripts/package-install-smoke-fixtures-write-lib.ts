import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDirectory } from './package-install-smoke-runner-common';

export const writeSmokeFixtureFile = (params: {
  consumerRepo: string;
  relativePath: string;
  content: string;
}): string => {
  const filePath = join(params.consumerRepo, params.relativePath);
  ensureDirectory(join(filePath, '..'));
  writeFileSync(filePath, params.content, 'utf8');
  return params.relativePath;
};
