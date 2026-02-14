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
