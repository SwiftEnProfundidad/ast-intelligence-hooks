import {
  isPathInsideRepo,
  toRepoRelativePath,
} from './adapter-session-status-log-utils-lib';

const extractHookFilePath = (line: string): string | undefined => {
  const analyzingMatch = line.match(/^\[[^\]]+\]\s+ANALYZING:\s+(.+?)\s+\(\d+\s+edits\)/);
  if (analyzingMatch?.[1]) {
    return analyzingMatch[1];
  }

  const decisionMatch = line.match(/^\[[^\]]+\]\s+(?:BLOCKED|ALLOWED):.+\s+in\s+(.+)$/);
  if (decisionMatch?.[1]) {
    return decisionMatch[1];
  }

  return undefined;
};

const isSimulatedLine = (line: string): boolean =>
  line.includes('__pumuki_simulated__');

const normalizeHookLinePath = (params: {
  line: string;
  filePath: string;
  repoRoot: string;
}): string => {
  const relativePath = toRepoRelativePath({
    repoRoot: params.repoRoot,
    filePath: params.filePath,
  });
  if (relativePath.length === 0 || relativePath === params.filePath) {
    return params.line;
  }
  return params.line.replace(params.filePath, relativePath);
};

export const filterHookLogLinesForRepo = (params: {
  content: string;
  repoRoot: string;
}): ReadonlyArray<string> => {
  const allLines = params.content.split(/\r?\n/);
  const filtered: string[] = [];
  for (const line of allLines) {
    if (line.trim().length === 0) {
      continue;
    }

    const filePath = extractHookFilePath(line);
    if (filePath && isPathInsideRepo({ repoRoot: params.repoRoot, filePath })) {
      filtered.push(normalizeHookLinePath({
        line,
        filePath,
        repoRoot: params.repoRoot,
      }));
      continue;
    }

    if (isSimulatedLine(line)) {
      filtered.push(line);
    }
  }
  return filtered;
};
