import type { Fact } from '../../core/facts/Fact';

type ComplexityThresholds = {
  maxChangedFiles: number;
  maxEstimatedLoc: number;
};

const DEFAULT_COMPLEXITY_THRESHOLDS: ComplexityThresholds = {
  maxChangedFiles: 5,
  maxEstimatedLoc: 120,
};

const resolveThreshold = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const loadThresholds = (): ComplexityThresholds => {
  return {
    maxChangedFiles: resolveThreshold(
      process.env.PUMUKI_TDD_COMPLEX_MAX_FILES,
      DEFAULT_COMPLEXITY_THRESHOLDS.maxChangedFiles
    ),
    maxEstimatedLoc: resolveThreshold(
      process.env.PUMUKI_TDD_COMPLEX_MAX_LOC,
      DEFAULT_COMPLEXITY_THRESHOLDS.maxEstimatedLoc
    ),
  };
};

const normalizePath = (path: string): string => path.replace(/\\/g, '/');

const isTestPath = (path: string): boolean => {
  const normalized = normalizePath(path).toLowerCase();
  return (
    normalized.includes('/__tests__/') ||
    normalized.includes('/tests/') ||
    normalized.includes('/test/') ||
    normalized.endsWith('.spec.ts') ||
    normalized.endsWith('.spec.tsx') ||
    normalized.endsWith('.spec.js') ||
    normalized.endsWith('.spec.jsx') ||
    normalized.endsWith('.test.ts') ||
    normalized.endsWith('.test.tsx') ||
    normalized.endsWith('.test.js') ||
    normalized.endsWith('.test.jsx') ||
    normalized.endsWith('test.swift') ||
    normalized.endsWith('tests.swift') ||
    normalized.endsWith('test.kt') ||
    normalized.endsWith('tests.kt')
  );
};

const isFeaturePath = (path: string): boolean => {
  return normalizePath(path).toLowerCase().endsWith('.feature');
};

const isImplementationPath = (path: string): boolean => {
  const normalized = normalizePath(path).toLowerCase();
  if (isTestPath(normalized) || isFeaturePath(normalized)) {
    return false;
  }
  return /\.(ts|tsx|js|jsx|swift|kt|kts)$/i.test(normalized);
};

const criticalPathPatterns = [
  '/domain/',
  '/application/',
  '/core/',
  '/use-cases/',
  '/presentation/',
  '/api/',
  '/controllers/',
  '/contracts/',
];

const hasCriticalPath = (path: string): boolean => {
  const normalized = normalizePath(path).toLowerCase();
  return criticalPathPatterns.some((segment) => normalized.includes(segment));
};

const publicInterfacePatterns = [
  /\bexport\s+class\b/,
  /\bexport\s+interface\b/,
  /\bexport\s+type\b/,
  /\bexport\s+function\b/,
  /\bpublic\s+(?:func|class|interface|type|enum)\b/i,
  /\bprotocol\s+[A-Za-z0-9_]+/i,
  /\bopen\s+class\b/i,
];

const hasPublicInterfaceToken = (content: string): boolean => {
  return publicInterfacePatterns.some((pattern) => pattern.test(content));
};

export type TddBddScopeDecision = {
  inScope: boolean;
  isNewFeature: boolean;
  isComplexChange: boolean;
  reasons: string[];
  metrics: {
    changedFiles: number;
    estimatedLoc: number;
    criticalPathFiles: number;
    publicInterfaceFiles: number;
  };
};

export const classifyTddBddScope = (
  facts: ReadonlyArray<Fact>
): TddBddScopeDecision => {
  const thresholds = loadThresholds();
  const changedImplementationPaths = new Set<string>();
  const addedImplementationPaths = new Set<string>();
  const criticalPaths = new Set<string>();
  const publicInterfacePaths = new Set<string>();
  let estimatedLoc = 0;

  for (const fact of facts) {
    if (fact.kind === 'FileChange') {
      if (!isImplementationPath(fact.path)) {
        continue;
      }
      const normalized = normalizePath(fact.path);
      changedImplementationPaths.add(normalized);
      if (fact.changeType === 'added') {
        addedImplementationPaths.add(normalized);
      }
      if (hasCriticalPath(normalized)) {
        criticalPaths.add(normalized);
      }
      continue;
    }
    if (fact.kind === 'FileContent') {
      if (!isImplementationPath(fact.path)) {
        continue;
      }
      const normalized = normalizePath(fact.path);
      const lineCount = fact.content.split('\n').length;
      estimatedLoc += lineCount;
      if (hasCriticalPath(normalized)) {
        criticalPaths.add(normalized);
      }
      if (hasPublicInterfaceToken(fact.content)) {
        publicInterfacePaths.add(normalized);
      }
    }
  }

  const reasons: string[] = [];
  if (changedImplementationPaths.size > thresholds.maxChangedFiles) {
    reasons.push('complex.changed_files_threshold');
  }
  if (estimatedLoc > thresholds.maxEstimatedLoc) {
    reasons.push('complex.estimated_loc_threshold');
  }
  if (criticalPaths.size > 0) {
    reasons.push('complex.critical_paths_touched');
  }
  if (publicInterfacePaths.size > 0) {
    reasons.push('complex.public_interface_changed');
  }

  const isNewFeature = addedImplementationPaths.size > 0;
  const isComplexChange = reasons.length > 0;
  return {
    inScope: isNewFeature || isComplexChange,
    isNewFeature,
    isComplexChange,
    reasons,
    metrics: {
      changedFiles: changedImplementationPaths.size,
      estimatedLoc,
      criticalPathFiles: criticalPaths.size,
      publicInterfaceFiles: publicInterfacePaths.size,
    },
  };
};
