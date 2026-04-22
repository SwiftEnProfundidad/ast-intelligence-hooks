import type { Finding } from '../../core/gate/Finding';
import { resolveGovernanceCatalogAction } from '../gate/governanceActionCatalog';

const severityWeight = (severity: string): number => {
  switch (severity.toUpperCase()) {
    case 'CRITICAL':
      return 5;
    case 'ERROR':
      return 4;
    case 'WARN':
      return 3;
    case 'INFO':
      return 2;
    default:
      return 1;
  }
};

const resolvePrimaryFinding = (findings: ReadonlyArray<Finding>): Finding => {
  let primary = findings[0];
  for (const finding of findings.slice(1)) {
    if (!primary) {
      primary = finding;
      continue;
    }
    if (severityWeight(finding.severity) > severityWeight(primary.severity)) {
      primary = finding;
    }
  }
  return primary ?? findings[0]!;
};

const sortFindingsBySeverity = (findings: ReadonlyArray<Finding>): ReadonlyArray<Finding> =>
  [...findings].sort((left, right) => severityWeight(right.severity) - severityWeight(left.severity));

const normalizeAnchorLine = (lines: Finding['lines']): number => {
  if (Array.isArray(lines)) {
    const candidates = lines
      .map((line) => Number(line))
      .filter((line) => Number.isFinite(line))
      .map((line) => Math.trunc(line))
      .filter((line) => line > 0);
    return candidates.length > 0 ? Math.min(...candidates) : 1;
  }
  if (typeof lines === 'number' && Number.isFinite(lines)) {
    const normalized = Math.trunc(lines);
    return normalized > 0 ? normalized : 1;
  }
  if (typeof lines === 'string') {
    const candidates = lines
      .match(/\d+/g)
      ?.map((token) => Number.parseInt(token, 10))
      .filter((line) => Number.isFinite(line) && line > 0);
    if (candidates && candidates.length > 0) {
      return Math.min(...candidates);
    }
  }
  return 1;
};

const formatLocation = (finding: Finding): string | null => {
  if (!finding.filePath || finding.filePath.trim().length === 0) {
    return null;
  }
  const anchorLine = normalizeAnchorLine(finding.lines);
  return `${finding.filePath.replace(/\\/g, '/')}:${anchorLine}`;
};

const formatFinding = (finding: Finding): string => {
  const location = formatLocation(finding);
  const severity = finding.severity.toUpperCase();
  if (!location) {
    return `[${severity}] ${finding.ruleId}: ${finding.message}`;
  }
  return `[${severity}] ${finding.ruleId}: ${finding.message} -> ${location}`;
};

const resolveAtomicityFallback = (code: string): string | null => {
  switch (code) {
    case 'GIT_ATOMICITY_TOO_MANY_FILES':
      return 'git restore --staged . && separa cambios en commits más pequeños';
    case 'GIT_ATOMICITY_TOO_MANY_SCOPES':
      return 'Revisa scope_files del bloqueo y aplica: git restore --staged . && git add <scope>/ && git commit -m "<tipo>: <scope>"';
    default:
      return null;
  }
};

export const printGateFindings = (
  findings: ReadonlyArray<Finding>,
  params?: { stage?: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI' }
): void => {
  if (findings.length === 0) {
    return;
  }
  const primary = resolvePrimaryFinding(findings);
  const action = resolveGovernanceCatalogAction({
    code: primary.code,
    stage: params?.stage ?? 'PRE_COMMIT',
    fallback: {
      reason_code: primary.code,
      instruction: 'Corrige el bloqueante primario y vuelve a ejecutar la validación del stage actual.',
      next_action: {
        kind: 'info',
        message:
          resolveAtomicityFallback(primary.code)
          ?? 'Corrige el bloqueante primario y vuelve a ejecutar el mismo comando.',
      },
    },
  });
  const nextAction = action.next_action.command ?? action.next_action.message;
  process.stdout.write(
    `[pumuki][block-summary] primary=${primary.code} severity=${primary.severity.toUpperCase()} rule=${primary.ruleId}\n`
  );
  process.stdout.write(`[pumuki][block-summary] reason_code=${action.reason_code}\n`);
  process.stdout.write(`[pumuki][block-summary] instruction=${action.instruction}\n`);
  process.stdout.write(`[pumuki][block-summary] next_action=${nextAction}\n`);
  if (action.next_action.command) {
    process.stdout.write(`[pumuki][block-summary] command=${action.next_action.command}\n`);
  }
  const orderedFindings = sortFindingsBySeverity(findings);
  const secondaryWarnings = orderedFindings.filter(
    (finding) => finding !== primary && finding.severity.toUpperCase() === 'WARN'
  );
  for (const warning of secondaryWarnings) {
    process.stdout.write(
      `[pumuki][warning-summary] secondary=${warning.code} severity=${warning.severity.toUpperCase()} rule=${warning.ruleId}\n`
    );
  }
  for (const finding of orderedFindings) {
    process.stdout.write(`${formatFinding(finding)}\n`);
  }
};
