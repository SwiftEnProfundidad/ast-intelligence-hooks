import { isPathInsideRepo } from './adapter-session-status-log-utils-lib';

const extractHookFilePath = (line: string): string | undefined => {
  const analyzingMatch = line.match(/^\\[[^\\]]+\\]\\s+ANALYZING:\\s+(.+?)\\s+\\(\\d+\\s+edits\\)/);
  if (analyzingMatch?.[1]) {
    return analyzingMatch[1];
  }

  const decisionMatch = line.match(/^\\[[^\\]]+\\]\\s+(?:BLOCKED|ALLOWED):.+\\s+in\\s+(.+)$/);
  if (decisionMatch?.[1]) {
    return decisionMatch[1];
  }

  return undefined;
};

const isSimulatedLine = (line: string): boolean =>
  line.includes('__pumuki_simulated__') || line.includes('apps/backend/src/example.ts');

export const filterHookLogLinesForRepo = (params: {
  content: string;
  repoRoot: string;
}): ReadonlyArray<string> => {
  const allLines = params.content.split(/\r?\n/);

  return allLines.filter((line) => {
    if (line.trim().length === 0) {
      return false;
    }

    const filePath = extractHookFilePath(line);
    if (filePath && isPathInsideRepo({ repoRoot: params.repoRoot, filePath })) {
      return true;
    }

    return isSimulatedLine(line);
  });
};
