import { existsSync, readFileSync } from 'node:fs';
import {
  filterHookLogLinesForRepo,
  filterWritesLogLinesForRepo,
  toTailFromText,
} from './adapter-session-status-log-filter-lib';

export const readTailFile = (filePath: string, lines: number): string => {
  if (!existsSync(filePath)) {
    return `[missing] ${filePath}`;
  }

  return toTailFromText(readFileSync(filePath, 'utf8'), lines);
};

const readTailForFilteredLog = (params: {
  filePath: string;
  lines: number;
  repoRoot: string;
  filter: (input: { content: string; repoRoot: string }) => ReadonlyArray<string>;
}): string => {
  if (!existsSync(params.filePath)) {
    return `[missing] ${params.filePath}`;
  }

  const filtered = params.filter({
    content: readFileSync(params.filePath, 'utf8'),
    repoRoot: params.repoRoot,
  });

  if (filtered.length === 0) {
    return `[no entries matched repoRoot=${params.repoRoot}]`;
  }

  return filtered.slice(Math.max(filtered.length - params.lines, 0)).join('\n').trimEnd();
};

export const readTailForHookLog = (params: {
  filePath: string;
  lines: number;
  repoRoot: string;
}): string => {
  return readTailForFilteredLog({
    ...params,
    filter: filterHookLogLinesForRepo,
  });
};

export const readTailForWritesLog = (params: {
  filePath: string;
  lines: number;
  repoRoot: string;
}): string => {
  return readTailForFilteredLog({
    ...params,
    filter: filterWritesLogLinesForRepo,
  });
};
