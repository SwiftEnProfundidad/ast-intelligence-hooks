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

const buildHints = (
  result: AiGateCheckResult,
  stage: ConsumerPreflightStage
): ReadonlyArray<string> => {
  const hints: string[] = [];
  const violations = result.violations;

  if (hasViolationCode(violations, 'EVIDENCE_MISSING')) {
    hints.push('Evidence missing: ejecuta una auditoría (1/2/3/4) para regenerar .ai_evidence.json.');
  }
  if (hasViolationCode(violations, 'EVIDENCE_INVALID')) {
    hints.push('Evidence invalid: regenera .ai_evidence.json desde una opción de auditoría.');
  }
  if (hasViolationCode(violations, 'EVIDENCE_STALE')) {
    hints.push('Evidence stale: refresca evidencia antes de continuar con commit/push.');
  }
  if (hasViolationCode(violations, 'GITFLOW_PROTECTED_BRANCH')) {
    hints.push('Git-flow violation: evita trabajo directo en ramas protegidas (usa feature/*).');
  }
  if (stage === 'PRE_PUSH' && !result.repo_state.git.upstream) {
    hints.push('PRE_PUSH sin upstream: configura tracking (git push --set-upstream origin <branch>).');
  }

  if (result.status === 'ALLOWED' && hints.length === 0) {
    hints.push('Pre-flight operativo: sin bloqueos previos detectados.');
  }

  return hints;
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
