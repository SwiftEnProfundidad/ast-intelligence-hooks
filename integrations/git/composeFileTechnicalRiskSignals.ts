import { hasAllowedExtension } from './gitDiffUtils';
import type { FileChurnOwnershipSignal } from './collectFileChurnOwnership';

export type EnterpriseRiskSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type FileTechnicalRiskSignal = {
  path: string;
  churnCommits: number;
  churnDistinctAuthors: number;
  churnAddedLines: number;
  churnDeletedLines: number;
  churnTotalLines: number;
  churnLastTouchedAt: string | null;
  findingsTotal: number;
  findingsByEnterpriseSeverity: Record<EnterpriseRiskSeverity, number>;
  findingsDistinctRules: number;
  findingsWithLines: number;
  findingsWithoutLines: number;
};

type EvidenceFindingLike = {
  file?: unknown;
  ruleId?: unknown;
  severity?: unknown;
  lines?: unknown;
};

type MutableSignal = Omit<FileTechnicalRiskSignal, 'findingsDistinctRules'> & {
  rules: Set<string>;
};

const emptyFindingsByEnterpriseSeverity = (): Record<EnterpriseRiskSeverity, number> => ({
  CRITICAL: 0,
  HIGH: 0,
  MEDIUM: 0,
  LOW: 0,
});

const normalizePath = (value: string): string => value.replace(/\\/g, '/');

const normalizeRepoRoot = (repoRoot: string): string => {
  const normalized = normalizePath(repoRoot.trim());
  if (normalized.endsWith('/')) {
    return normalized.slice(0, -1);
  }
  return normalized;
};

const isAbsolutePath = (value: string): boolean => {
  return value.startsWith('/') || /^[A-Za-z]:\//.test(value);
};

const toRepoRelativePath = (params: { repoRoot: string; filePath: string }): string => {
  const candidate = normalizePath(params.filePath).replace(/^\.\//, '').trim();
  if (!candidate) {
    return '';
  }
  if (!isAbsolutePath(candidate)) {
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

const normalizeEnterpriseSeverity = (value: unknown): EnterpriseRiskSeverity | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  if (normalized === 'CRITICAL') {
    return 'CRITICAL';
  }
  if (normalized === 'HIGH' || normalized === 'ERROR') {
    return 'HIGH';
  }
  if (normalized === 'MEDIUM' || normalized === 'WARN') {
    return 'MEDIUM';
  }
  if (normalized === 'LOW' || normalized === 'INFO') {
    return 'LOW';
  }
  return null;
};

const hasFindingLines = (value: unknown): boolean => {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.some((line) => typeof line === 'number' && Number.isFinite(line));
  }
  return false;
};

const shouldIncludePath = (path: string, extensions: ReadonlyArray<string>): boolean => {
  if (extensions.length === 0) {
    return true;
  }
  return hasAllowedExtension(path, extensions);
};

const buildMutableSignal = (params: {
  path: string;
  churn: FileChurnOwnershipSignal | null;
}): MutableSignal => {
  const churn = params.churn;
  return {
    path: params.path,
    churnCommits: churn?.commits ?? 0,
    churnDistinctAuthors: churn?.distinctAuthors ?? 0,
    churnAddedLines: churn?.churnAddedLines ?? 0,
    churnDeletedLines: churn?.churnDeletedLines ?? 0,
    churnTotalLines: churn?.churnTotalLines ?? 0,
    churnLastTouchedAt: churn?.lastTouchedAt ?? null,
    findingsTotal: 0,
    findingsByEnterpriseSeverity: emptyFindingsByEnterpriseSeverity(),
    findingsWithLines: 0,
    findingsWithoutLines: 0,
    rules: new Set<string>(),
  };
};

const toSafeRuleId = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
};

export const composeFileTechnicalRiskSignals = (params: {
  churnSignals: ReadonlyArray<FileChurnOwnershipSignal>;
  findings: ReadonlyArray<EvidenceFindingLike>;
  repoRoot?: string;
  extensions?: ReadonlyArray<string>;
}): ReadonlyArray<FileTechnicalRiskSignal> => {
  const repoRoot = params.repoRoot ?? process.cwd();
  const extensions = params.extensions ?? [];
  const byPath = new Map<string, MutableSignal>();

  for (const churn of params.churnSignals) {
    const normalizedPath = toRepoRelativePath({
      repoRoot,
      filePath: churn.path,
    });
    if (!normalizedPath || !shouldIncludePath(normalizedPath, extensions)) {
      continue;
    }
    byPath.set(
      normalizedPath,
      buildMutableSignal({
        path: normalizedPath,
        churn,
      })
    );
  }

  for (const finding of params.findings) {
    const rawFile = typeof finding.file === 'string' ? finding.file.trim() : '';
    if (!rawFile) {
      continue;
    }
    const normalizedPath = toRepoRelativePath({
      repoRoot,
      filePath: rawFile,
    });
    if (!normalizedPath || !shouldIncludePath(normalizedPath, extensions)) {
      continue;
    }
    const severity = normalizeEnterpriseSeverity(finding.severity);
    if (!severity) {
      continue;
    }
    const current =
      byPath.get(normalizedPath) ??
      buildMutableSignal({
        path: normalizedPath,
        churn: null,
      });
    current.findingsTotal += 1;
    current.findingsByEnterpriseSeverity[severity] += 1;
    if (hasFindingLines(finding.lines)) {
      current.findingsWithLines += 1;
    } else {
      current.findingsWithoutLines += 1;
    }
    const safeRuleId = toSafeRuleId(finding.ruleId);
    if (safeRuleId.length > 0) {
      current.rules.add(safeRuleId);
    }
    byPath.set(normalizedPath, current);
  }

  return [...byPath.values()]
    .map((item) => ({
      path: item.path,
      churnCommits: item.churnCommits,
      churnDistinctAuthors: item.churnDistinctAuthors,
      churnAddedLines: item.churnAddedLines,
      churnDeletedLines: item.churnDeletedLines,
      churnTotalLines: item.churnTotalLines,
      churnLastTouchedAt: item.churnLastTouchedAt,
      findingsTotal: item.findingsTotal,
      findingsByEnterpriseSeverity: {
        CRITICAL: item.findingsByEnterpriseSeverity.CRITICAL,
        HIGH: item.findingsByEnterpriseSeverity.HIGH,
        MEDIUM: item.findingsByEnterpriseSeverity.MEDIUM,
        LOW: item.findingsByEnterpriseSeverity.LOW,
      },
      findingsDistinctRules: item.rules.size,
      findingsWithLines: item.findingsWithLines,
      findingsWithoutLines: item.findingsWithoutLines,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
};
