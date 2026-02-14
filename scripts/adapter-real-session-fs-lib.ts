import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const readFileIfExists = (
  cwd: string,
  pathLike: string
): string | undefined => {
  const absolute = resolve(cwd, pathLike);
  if (!existsSync(absolute)) {
    return undefined;
  }

  return readFileSync(absolute, 'utf8');
};

export const findLatestAuditFileRelativePath = (params: {
  cwd: string;
  directory: string;
  prefix: string;
  suffix: string;
}): string | undefined => {
  const absoluteDirectory = resolve(params.cwd, params.directory);
  if (!existsSync(absoluteDirectory)) {
    return undefined;
  }

  const matches = readdirSync(absoluteDirectory)
    .filter((entry) => entry.startsWith(params.prefix) && entry.endsWith(params.suffix))
    .sort((left, right) => right.localeCompare(left));

  if (matches.length === 0) {
    return undefined;
  }

  return join(params.directory, matches[0]);
};
