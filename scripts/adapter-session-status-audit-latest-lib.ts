import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const findLatestAuditFile = (params: {
  directory: string;
  prefix: string;
  suffix: string;
}): string | undefined => {
  if (!existsSync(params.directory)) {
    return undefined;
  }

  const matches = readdirSync(params.directory)
    .filter((entry) => entry.startsWith(params.prefix) && entry.endsWith(params.suffix))
    .sort((left, right) => right.localeCompare(left));

  if (matches.length === 0) {
    return undefined;
  }

  return join(params.directory, matches[0]);
};
