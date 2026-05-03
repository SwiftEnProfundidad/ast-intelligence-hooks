import type { Finding } from '../../core/gate/Finding';

const BLOCK_NEXT_ACTION_BY_CODE: Readonly<Record<string, string>> = {
  SDD_SESSION_MISSING:
    'npx --yes --package pumuki@latest pumuki sdd session --open --change=<id>',
  SDD_SESSION_INVALID:
    'npx --yes --package pumuki@latest pumuki sdd session --refresh --ttl-minutes=90',
  PRE_PUSH_UPSTREAM_MISSING:
    'git push --set-upstream origin <branch>',
  PRE_PUSH_UPSTREAM_MISALIGNED:
    'git branch --unset-upstream && git push --set-upstream origin <branch>',
  GIT_ATOMICITY_TOO_MANY_FILES:
    'git restore --staged . && separa cambios en commits más pequeños',
  GIT_ATOMICITY_TOO_MANY_SCOPES:
    'Revisa scope_files del bloqueo y aplica: git restore --staged . && git add <scope>/ && git commit -m "<tipo>: <scope>"',
  ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH:
    'Reconcilia policy/skills y reintenta PRE_COMMIT: npx --yes --package pumuki@latest pumuki policy reconcile --strict --apply --json && npx --yes --package pumuki@latest pumuki-pre-commit',
  SKILLS_SKILLS_FRONTEND_NO_SOLID_VIOLATIONS:
    'Aplica refactor incremental: extrae 1 componente/hook por commit y vuelve a ejecutar PRE_COMMIT.',
};

const buildStageValidateCommand = (stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI' | 'PRE_WRITE'): string =>
  `npx --yes --package pumuki@latest pumuki sdd validate --stage=${stage} --json`;

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
  [...findings].sort((left, right) => {
    const severityDelta = severityWeight(right.severity) - severityWeight(left.severity);
    if (severityDelta !== 0) {
      return severityDelta;
    }
    return left.ruleId.localeCompare(right.ruleId);
  });

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

export const printGateFindings = (
  findings: ReadonlyArray<Finding>,
  params?: { stage?: 'PRE_WRITE' | 'PRE_COMMIT' | 'PRE_PUSH' | 'CI' }
): void => {
  if (findings.length === 0) {
    return;
  }
  const orderedFindings = sortFindingsBySeverity(findings);
  const primary = resolvePrimaryFinding(orderedFindings);
  const stage = params?.stage ?? 'PRE_COMMIT';
  const nextAction =
    primary.code === 'EVIDENCE_STALE' || primary.code === 'EVIDENCE_BRANCH_MISMATCH'
      ? buildStageValidateCommand(stage)
      : BLOCK_NEXT_ACTION_BY_CODE[primary.code]
        ?? 'Corrige el bloqueante primario y vuelve a ejecutar el mismo comando.';
  process.stdout.write(
    `[pumuki][block-summary] primary=${primary.code} severity=${primary.severity.toUpperCase()} rule=${primary.ruleId}\n`
  );
  process.stdout.write(`[pumuki][block-summary] next_action=${nextAction}\n`);
  const secondaryWarnings = orderedFindings.filter(
    (finding) =>
      finding !== primary &&
      severityWeight(finding.severity) < severityWeight(primary.severity)
  );
  for (const finding of secondaryWarnings) {
    process.stdout.write(
      `[pumuki][warning-summary] secondary=${finding.code} severity=${finding.severity.toUpperCase()} rule=${finding.ruleId}\n`
    );
  }
  for (const finding of orderedFindings) {
    process.stdout.write(`${formatFinding(finding)}\n`);
  }
};
