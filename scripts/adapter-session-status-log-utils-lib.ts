export const toTailFromText = (text: string, lines: number): string => {
  const rows = text.split(/\r?\n/);
  return rows.slice(Math.max(rows.length - lines, 0)).join('\n').trimEnd();
};

const normalizePath = (value: string): string => {
  return value.replace(/\\/g, '/');
};

const normalizeRepoRoot = (repoRoot: string): string => {
  const normalized = normalizePath(repoRoot.trim());
  if (normalized.endsWith('/')) {
    return normalized.slice(0, -1);
  }
  return normalized;
};

export const toRepoRelativePath = (params: {
  repoRoot: string;
  filePath: string;
}): string => {
  const candidate = normalizePath(params.filePath.trim()).replace(/^\.\//, '');
  if (candidate.length === 0) {
    return '';
  }
  if (!candidate.startsWith('/')) {
    return candidate;
  }

  const repoRoot = normalizeRepoRoot(params.repoRoot);
  const normalizedRepo = `${repoRoot}/`;
  if (candidate === repoRoot) {
    return '.';
  }
  if (candidate.startsWith(normalizedRepo)) {
    const relativePath = candidate.slice(normalizedRepo.length);
    return relativePath.length > 0 ? relativePath : '.';
  }
  return candidate;
};

export const isPathInsideRepo = (params: {
  repoRoot: string;
  filePath: string;
}): boolean => {
  const candidate = normalizePath(params.filePath.trim());
  if (candidate.length === 0) {
    return false;
  }

  if (!candidate.startsWith('/')) {
    return true;
  }

  const repoRoot = normalizeRepoRoot(params.repoRoot);
  const normalizedRepo = `${repoRoot}/`;
  return candidate === repoRoot || candidate.startsWith(normalizedRepo);
};
