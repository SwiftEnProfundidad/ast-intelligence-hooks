import type {
  EnterpriseEvidenceSeverity,
  EvidenceFinding,
  EvidenceMetricValue,
  EvidenceSeverity,
} from './framework-menu-evidence-summary-types';

export const toStringOrNull = (value: unknown): string | null => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
};

export const asFindings = (value: unknown): EvidenceFinding[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as EvidenceFinding[];
};

export const normalizePath = (value: string): string => {
  return value.replace(/\\/g, '/');
};

export const normalizeRepoRoot = (repoRoot: string): string => {
  const normalized = normalizePath(repoRoot.trim());
  if (normalized.endsWith('/')) {
    return normalized.slice(0, -1);
  }
  return normalized;
};

export const toRepoRelativePath = (params: { repoRoot: string; filePath: string }): string => {
  const candidate = normalizePath(params.filePath).replace(/^\.\//, '');
  if (!candidate.startsWith('/')) {
    return candidate;
  }
  const repoRoot = normalizeRepoRoot(params.repoRoot);
  const repoPrefix = `${repoRoot}/`;
  if (candidate === repoRoot) {
    return '.';
  }
  if (candidate.startsWith(repoPrefix)) {
    const relativePath = candidate.slice(repoPrefix.length);
    return relativePath.length > 0 ? relativePath : '.';
  }
  return candidate;
};

export const normalizeSeverity = (value: unknown): EvidenceSeverity | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  if (normalized === 'CRITICAL') {
    return 'CRITICAL';
  }
  if (normalized === 'ERROR') {
    return 'ERROR';
  }
  if (normalized === 'WARN') {
    return 'WARN';
  }
  if (normalized === 'INFO') {
    return 'INFO';
  }
  return null;
};

export const normalizeEnterpriseSeverityCounts = (
  value: unknown
): Record<EnterpriseEvidenceSeverity, number> | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const record = value as Record<string, EvidenceMetricValue>;
  const parse = (entry: EvidenceMetricValue | undefined): number => {
    if (typeof entry !== 'number' || !Number.isFinite(entry)) {
      return 0;
    }
    return Math.max(0, Math.trunc(entry));
  };
  return {
    CRITICAL: parse(record.CRITICAL),
    HIGH: parse(record.HIGH),
    MEDIUM: parse(record.MEDIUM),
    LOW: parse(record.LOW),
  };
};

export const asNonNegativeInt = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
};
