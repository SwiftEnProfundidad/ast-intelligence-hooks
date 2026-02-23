import {
  evaluateAiGate,
  type AiGateCheckResult,
  type AiGateViolation,
} from '../integrations/gate/evaluateAiGate';
import { renderLegacyPanel, resolveLegacyPanelOuterWidth } from './framework-menu-legacy-audit-lib';
import {
  emitSystemNotification,
  type PumukiCriticalNotificationEvent,
  type SystemNotificationEmitResult,
} from './framework-menu-system-notifications-lib';

type ConsumerPreflightStage = 'PRE_COMMIT' | 'PRE_PUSH';

export type ConsumerPreflightResult = {
  stage: ConsumerPreflightStage;
  status: AiGateCheckResult['status'];
  result: AiGateCheckResult;
  hints: ReadonlyArray<string>;
  notificationResults: ReadonlyArray<SystemNotificationEmitResult>;
};

type ConsumerPreflightDependencies = {
  evaluateAiGate: (params: { repoRoot: string; stage: ConsumerPreflightStage }) => AiGateCheckResult;
  emitSystemNotification: (params: {
    event: PumukiCriticalNotificationEvent;
    repoRoot: string;
  }) => SystemNotificationEmitResult;
};

const defaultDependencies: ConsumerPreflightDependencies = {
  evaluateAiGate: (params) =>
    evaluateAiGate({
      repoRoot: params.repoRoot,
      stage: params.stage,
    }),
  emitSystemNotification: (params) =>
    emitSystemNotification({
      event: params.event,
      repoRoot: params.repoRoot,
    }),
};

const hasViolationCode = (
  violations: ReadonlyArray<AiGateViolation>,
  code: string
): boolean => violations.some((violation) => violation.code === code);

const ACTIONABLE_HINTS_BY_CODE: Readonly<Record<string, string>> = {
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
  EVIDENCE_UNSUPPORTED_AUTO_RULES:
    'mapea todas las reglas AUTO a detectores AST antes de continuar.',
  EVIDENCE_TIMESTAMP_FUTURE: 'corrige la hora del sistema y regenera evidencia.',
  GITFLOW_PROTECTED_BRANCH:
    'evita trabajo directo en ramas protegidas (usa feature/*).',
};

const buildHints = (
  result: AiGateCheckResult,
  stage: ConsumerPreflightStage
): ReadonlyArray<string> => {
  const hints: string[] = [];
  const violations = result.violations;
  const handledCodes = new Set<string>();

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
    const action = ACTIONABLE_HINTS_BY_CODE[violation.code];
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

const buildBlockingCauseLines = (preflight: ConsumerPreflightResult): ReadonlyArray<string> => {
  if (preflight.status !== 'BLOCKED' || preflight.result.violations.length === 0) {
    return [];
  }
  const lines: string[] = ['', 'Blocking causes:'];
  const emitted = new Set<string>();

  for (const violation of preflight.result.violations) {
    const key = `${violation.code}:${violation.message}`;
    if (emitted.has(key)) {
      continue;
    }
    emitted.add(key);
    lines.push(`• ${violation.code}: ${violation.message}`);
    const action =
      ACTIONABLE_HINTS_BY_CODE[violation.code]
      ?? 'revisa esta violación y corrige la causa antes de continuar.';
    lines.push(`  Action: ${action}`);
  }

  return lines;
};

const buildNotificationEvents = (result: AiGateCheckResult): ReadonlyArray<PumukiCriticalNotificationEvent> => {
  const events: PumukiCriticalNotificationEvent[] = [];
  if (hasViolationCode(result.violations, 'EVIDENCE_STALE')) {
    const ageSeconds = result.evidence.age_seconds ?? 0;
    events.push({
      kind: 'evidence.stale',
      evidencePath: '.ai_evidence.json',
      ageMinutes: Math.max(1, Math.ceil(ageSeconds / 60)),
    });
  }
  if (hasViolationCode(result.violations, 'GITFLOW_PROTECTED_BRANCH')) {
    events.push({
      kind: 'gitflow.violation',
      currentBranch: result.repo_state.git.branch ?? 'unknown',
      reason: 'protected-branch',
    });
  }
  if (result.status === 'BLOCKED') {
    events.push({
      kind: 'gate.blocked',
      stage: result.stage,
      totalViolations: result.violations.length,
    });
  }
  return events;
};

export const runConsumerPreflight = (
  params: {
    repoRoot?: string;
    stage: ConsumerPreflightStage;
  },
  dependencies: Partial<ConsumerPreflightDependencies> = {}
): ConsumerPreflightResult => {
  const activeDependencies: ConsumerPreflightDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const repoRoot = params.repoRoot ?? process.cwd();
  const result = activeDependencies.evaluateAiGate({
    repoRoot,
    stage: params.stage,
  });
  const hints = buildHints(result, params.stage);
  const notificationEvents = buildNotificationEvents(result);
  const notificationResults = notificationEvents.map((event) =>
    activeDependencies.emitSystemNotification({
      event,
      repoRoot,
    })
  );

  return {
    stage: params.stage,
    status: result.status,
    result,
    hints,
    notificationResults,
  };
};

export const formatConsumerPreflight = (
  preflight: ConsumerPreflightResult,
  options?: {
    panelWidth?: number;
    color?: boolean;
  }
): string => {
  const git = preflight.result.repo_state.git;
  const evidence = preflight.result.evidence;
  const lines = [
    'PRE-FLIGHT CHECK',
    `Stage: ${preflight.stage}`,
    `Branch: ${git.branch ?? 'unknown'} · Upstream: ${git.upstream ?? 'none'}`,
    `Worktree: dirty=${git.dirty ? 'yes' : 'no'} staged=${git.staged} unstaged=${git.unstaged} ahead=${git.ahead} behind=${git.behind}`,
    `Evidence: kind=${evidence.kind} age=${evidence.age_seconds ?? 'n/a'}s max=${evidence.max_age_seconds}s`,
    `Gate: ${preflight.status} (${preflight.result.violations.length} violations)`,
  ];
  lines.push(...buildBlockingCauseLines(preflight));

  if (preflight.hints.length > 0) {
    lines.push('', 'Operational hints:');
    for (const hint of preflight.hints) {
      lines.push(`• ${hint}`);
    }
  }

  return renderLegacyPanel(lines, {
    width: options?.panelWidth ?? resolveLegacyPanelOuterWidth(),
    color: options?.color ?? (process.stdout.isTTY === true && process.env.NO_COLOR !== '1'),
  });
};
