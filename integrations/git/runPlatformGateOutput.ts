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
  EVIDENCE_STALE:
    'npx --yes --package pumuki@latest pumuki-pre-commit',
  EVIDENCE_BRANCH_MISMATCH:
    'npx --yes --package pumuki@latest pumuki-pre-commit',
  GIT_ATOMICITY_TOO_MANY_FILES:
    'git restore --staged . && separa cambios en commits más pequeños',
  GIT_ATOMICITY_TOO_MANY_SCOPES:
    'Revisa scope_files del bloqueo y aplica: git restore --staged . && git add <scope>/ && git commit -m "<tipo>: <scope>"',
  ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH:
    'Reconcilia policy/skills y reintenta PRE_COMMIT: npx --yes --package pumuki@latest pumuki policy reconcile --strict --json && npx --yes --package pumuki@latest pumuki-pre-commit',
  SKILLS_SKILLS_FRONTEND_NO_SOLID_VIOLATIONS:
    'Aplica refactor incremental: extrae 1 componente/hook por commit y vuelve a ejecutar PRE_COMMIT.',
  SKILLS_SKILLS_BACKEND_NO_CONSOLE_LOG:
    'Elimina console.log del backend o sustitúyelo por el logger aprobado para runtime; vuelve a ejecutar el gate.',
  SKILLS_SKILLS_FRONTEND_NO_CONSOLE_LOG:
    'Elimina console.log del frontend de producción o muévelo a instrumentación aprobada; vuelve a ejecutar el gate.',
  HEURISTICS_CONSOLE_LOG_AST:
    'Elimina console.log del código productivo o usa el logger aprobado del proyecto; vuelve a ejecutar el gate.',
};

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

const isAstSkillFinding = (finding: Finding): boolean => {
  const ruleId = finding.ruleId.toLowerCase();
  const code = finding.code.toLowerCase();
  return (
    ruleId.startsWith('skills.') ||
    ruleId.startsWith('heuristics.') ||
    code.startsWith('skills_') ||
    code.startsWith('heuristics_') ||
    code.includes('_ast')
  );
};

const primaryWeight = (finding: Finding): number => {
  const astSkillWeight = isAstSkillFinding(finding) ? 100 : 0;
  return astSkillWeight + severityWeight(finding.severity);
};

const resolvePrimaryFinding = (findings: ReadonlyArray<Finding>): Finding => {
  let primary = findings[0];
  for (const finding of findings.slice(1)) {
    if (!primary) {
      primary = finding;
      continue;
    }
    if (primaryWeight(finding) > primaryWeight(primary)) {
      primary = finding;
    }
  }
  return primary ?? findings[0]!;
};

const sortFindingsBySeverity = (findings: ReadonlyArray<Finding>): ReadonlyArray<Finding> =>
  [...findings].sort((left, right) => {
    const primaryDelta = primaryWeight(right) - primaryWeight(left);
    if (primaryDelta !== 0) {
      return primaryDelta;
    }
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

const resolveAstSkillNextAction = (finding: Finding): string | null => {
  if (!isAstSkillFinding(finding)) {
    return null;
  }
  const location = formatLocation(finding);
  const fix = finding.expected_fix?.trim() || 'corrige la violación indicada por la regla';
  const locationText = location ? ` en ${location}` : '';
  return `Corrige ${finding.ruleId}${locationText}: ${fix}. Vuelve a ejecutar el gate.`;
};

const formatFinding = (finding: Finding): string => {
  const location = formatLocation(finding);
  const severity = finding.severity.toUpperCase();
  if (!location) {
    return `[${severity}] ${finding.ruleId}: ${finding.message}`;
  }
  return `[${severity}] ${finding.ruleId}: ${finding.message} -> ${location}`;
};

export const printGateFindings = (findings: ReadonlyArray<Finding>): void => {
  if (findings.length === 0) {
    return;
  }
  const orderedFindings = sortFindingsBySeverity(findings);
  const primary = resolvePrimaryFinding(orderedFindings);
  const nextAction =
    BLOCK_NEXT_ACTION_BY_CODE[primary.code]
    ?? resolveAstSkillNextAction(primary)
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
  process.stdout.write(`[pumuki][findings] total=${orderedFindings.length}\n`);
  for (const [index, finding] of orderedFindings.entries()) {
    process.stdout.write(`\n${index + 1}. ${formatFinding(finding)}\n`);
  }
};
