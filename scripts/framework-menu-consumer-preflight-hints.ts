import type { AiGateCheckResult } from '../integrations/gate/evaluateAiGate';
import type {
  ConsumerPreflightHintDependencies,
  ConsumerPreflightResult,
  ConsumerPreflightStage,
  ConsumerPreflightViolationList,
} from './framework-menu-consumer-preflight-types';

export const ACTIONABLE_HINTS_BY_CODE: Readonly<Record<string, string>> = {
  EVIDENCE_MISSING: 'ejecuta una auditoría (1/2/3/4) para regenerar .ai_evidence.json.',
  EVIDENCE_INVALID: 'regenera .ai_evidence.json desde una opción de auditoría.',
  EVIDENCE_STALE: 'refresca evidencia antes de continuar con commit/push.',
  EVIDENCE_TIMESTAMP_INVALID: 'regenera evidencia para obtener un timestamp válido.',
  EVIDENCE_GATE_BLOCKED: 'corrige primero las violaciones bloqueantes y vuelve a auditar.',
  EVIDENCE_REPO_ROOT_MISMATCH: 'regenera evidencia desde este mismo repositorio.',
  EVIDENCE_BRANCH_MISMATCH: 'regenera evidencia en la rama actual antes de continuar.',
  EVIDENCE_GATE_STATUS_INCOHERENT: 'regenera evidencia para alinear ai_gate y severity_metrics.',
  EVIDENCE_OUTCOME_INCOHERENT: 'regenera evidencia para alinear ai_gate y snapshot.outcome.',
  EVIDENCE_RULES_COVERAGE_MISSING: 'ejecuta auditoría completa para recalcular rules_coverage.',
  EVIDENCE_RULES_COVERAGE_STAGE_MISMATCH: 'reanuda auditoría en el stage correcto.',
  EVIDENCE_RULES_COVERAGE_INCOMPLETE:
    'asegura unevaluated=0 y coverage_ratio=1 antes de continuar.',
  EVIDENCE_SKILLS_CONTRACT_INCOMPLETE:
    'completa contrato de skills/policy para el stage actual y vuelve a validar.',
  EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT:
    'reduce el worktree pendiente en slices atómicos y vuelve a ejecutar PRE_WRITE.',
  EVIDENCE_PREWRITE_WORKTREE_WARN:
    'conviene particionar cambios ahora para evitar bloqueo tardío en commit/push.',
  EVIDENCE_UNSUPPORTED_AUTO_RULES:
    'mapea todas las reglas AUTO a detectores AST antes de continuar.',
  EVIDENCE_TIMESTAMP_FUTURE: 'corrige la hora del sistema y regenera evidencia.',
  GITFLOW_PROTECTED_BRANCH:
    'evita trabajo directo en ramas protegidas (usa feature/*).',
};

export const hasViolationCode = (
  violations: ConsumerPreflightViolationList,
  code: string
): boolean => violations.some((violation) => violation.code === code);

const resolveActionableHintsByCode = (
  dependencies?: ConsumerPreflightHintDependencies
): Readonly<Record<string, string>> =>
  dependencies?.actionableHintsByCode ?? ACTIONABLE_HINTS_BY_CODE;

export const buildConsumerPreflightHints = (
  result: AiGateCheckResult,
  stage: ConsumerPreflightStage,
  dependencies?: ConsumerPreflightHintDependencies
): ReadonlyArray<string> => {
  const hints: string[] = [];
  const violations = result.violations;
  const handledCodes = new Set<string>();
  const actionableHintsByCode = resolveActionableHintsByCode(dependencies);

  if (hasViolationCode(violations, 'EVIDENCE_MISSING')) {
    hints.push('Evidence missing: ejecuta una auditoría (1/2/3/4) para regenerar .ai_evidence.json.');
    handledCodes.add('EVIDENCE_MISSING');
  }
  if (hasViolationCode(violations, 'EVIDENCE_INVALID')) {
    hints.push('Evidence invalid: regenera .ai_evidence.json desde una opción de auditoría.');
    handledCodes.add('EVIDENCE_INVALID');
  }
  if (hasViolationCode(violations, 'EVIDENCE_STALE')) {
    hints.push('Evidence stale: refresca evidencia antes de continuar con commit/push.');
    handledCodes.add('EVIDENCE_STALE');
  }
  if (hasViolationCode(violations, 'GITFLOW_PROTECTED_BRANCH')) {
    hints.push('Git-flow violation: evita trabajo directo en ramas protegidas (usa feature/*).');
    handledCodes.add('GITFLOW_PROTECTED_BRANCH');
  }
  for (const violation of violations) {
    if (handledCodes.has(violation.code)) {
      continue;
    }
    const action = actionableHintsByCode[violation.code];
    if (!action) {
      continue;
    }
    hints.push(`${violation.code}: ${action}`);
    handledCodes.add(violation.code);
  }
  if (stage === 'PRE_PUSH' && !result.repo_state.git.upstream) {
    hints.push('PRE_PUSH sin upstream: configura tracking (git push --set-upstream origin <branch>).');
  }

  if (result.status === 'ALLOWED' && hints.length === 0) {
    hints.push('Pre-flight operativo: sin bloqueos previos detectados.');
  }

  return hints;
};

export const buildConsumerPreflightBlockingCauseLines = (
  preflight: ConsumerPreflightResult,
  dependencies?: ConsumerPreflightHintDependencies
): ReadonlyArray<string> => {
  if (preflight.status !== 'BLOCKED' || preflight.result.violations.length === 0) {
    return [];
  }
  const lines: string[] = ['', 'Blocking causes:'];
  const emitted = new Set<string>();
  const actionableHintsByCode = resolveActionableHintsByCode(dependencies);

  for (const violation of preflight.result.violations) {
    const key = `${violation.code}:${violation.message}`;
    if (emitted.has(key)) {
      continue;
    }
    emitted.add(key);
    lines.push(`• ${violation.code}: ${violation.message}`);
    const action =
      actionableHintsByCode[violation.code]
      ?? 'revisa esta violación y corrige la causa antes de continuar.';
    lines.push(`  Action: ${action}`);
  }

  return lines;
};
