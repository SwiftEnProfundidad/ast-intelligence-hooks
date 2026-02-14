import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const withTempDir = async <T>(
  prefix: string,
  callback: (tempRoot: string) => Promise<T> | T
): Promise<T> => {
  const tempRoot = mkdtempSync(join(tmpdir(), prefix));

  try {
    return await callback(tempRoot);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
};

export const createTempDir = (prefix: string): string => {
  return mkdtempSync(join(tmpdir(), prefix));
};

export const removeTempDir = (tempRoot: string): void => {
  rmSync(tempRoot, { recursive: true, force: true });
};
