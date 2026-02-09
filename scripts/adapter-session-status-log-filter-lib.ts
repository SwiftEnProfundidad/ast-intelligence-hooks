export const toTailFromText = (text: string, lines: number): string => {
  const rows = text.split(/\r?\n/);
  return rows.slice(Math.max(rows.length - lines, 0)).join('\n').trimEnd();
};

export const isPathInsideRepo = (params: {
  repoRoot: string;
  filePath: string;
}): boolean => {
  const candidate = params.filePath.trim();
  if (candidate.length === 0) {
    return false;
  }

  if (!candidate.startsWith('/')) {
    return true;
  }

  const normalizedRepo = params.repoRoot.endsWith('/')
    ? params.repoRoot
    : `${params.repoRoot}/`;
  return candidate === params.repoRoot || candidate.startsWith(normalizedRepo);
};

export const filterHookLogLinesForRepo = (params: {
  content: string;
  repoRoot: string;
}): ReadonlyArray<string> => {
  const allLines = params.content.split(/\r?\n/);
  const extractHookFilePath = (line: string): string | undefined => {
    const analyzingMatch = line.match(
      /^\\[[^\\]]+\\]\\s+ANALYZING:\\s+(.+?)\\s+\\(\\d+\\s+edits\\)/
    );
    if (analyzingMatch?.[1]) {
      return analyzingMatch[1];
    }

    const decisionMatch = line.match(/^\\[[^\\]]+\\]\\s+(?:BLOCKED|ALLOWED):.+\\s+in\\s+(.+)$/);
    if (decisionMatch?.[1]) {
      return decisionMatch[1];
    }

    return undefined;
  };

  return allLines.filter((line) => {
    if (line.trim().length === 0) {
      return false;
    }

    const filePath = extractHookFilePath(line);
    if (filePath && isPathInsideRepo({ repoRoot: params.repoRoot, filePath })) {
      return true;
    }

    return (
      line.includes('__pumuki_simulated__') ||
      line.includes('apps/backend/src/example.ts')
    );
  });
};

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
        filtered.push(line);
      }
    } catch {}
  }

  return filtered;
};
