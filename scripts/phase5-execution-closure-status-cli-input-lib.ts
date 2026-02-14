import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const readPhase5ExecutionClosureStatusInput = (
  cwd: string,
  pathLike: string
): { exists: boolean; content?: string } => {
  const absolute = resolve(cwd, pathLike);
  if (!existsSync(absolute)) {
    return { exists: false };
  }

  return {
    exists: true,
    content: readFileSync(absolute, 'utf8'),
  };
};
