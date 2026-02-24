import {
  isPathInsideRepo,
  toRepoRelativePath,
} from './adapter-session-status-log-utils-lib';

export const filterWritesLogLinesForRepo = (params: {
  content: string;
  repoRoot: string;
}): ReadonlyArray<string> => {
  const allLines = params.content.split(/\r?\n/);
  const filtered: string[] = [];

  for (const line of allLines) {
    if (line.trim().length === 0) {
      continue;
    }

    try {
      const parsed = JSON.parse(line) as { file?: string };
      const filePath = typeof parsed.file === 'string' ? parsed.file : '';
      if (isPathInsideRepo({ repoRoot: params.repoRoot, filePath })) {
        const normalizedPath = toRepoRelativePath({
          repoRoot: params.repoRoot,
          filePath,
        });
        parsed.file = normalizedPath;
        filtered.push(JSON.stringify(parsed));
      }
    } catch {
      continue;
    }
  }

  return filtered;
};
