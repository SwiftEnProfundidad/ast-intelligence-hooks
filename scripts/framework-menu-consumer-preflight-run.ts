import {
  evaluateAiGate,
  type AiGateCheckResult,
} from '../integrations/gate/evaluateAiGate';
import { readLifecycleExperimentalFeaturesSnapshot } from '../integrations/lifecycle/experimentalFeaturesSnapshot';
import { LifecycleGitService } from '../integrations/lifecycle/gitService';
import { readGovernanceObservationSnapshot } from '../integrations/lifecycle/governanceObservationSnapshot';
import { readGovernanceNextAction } from '../integrations/lifecycle/governanceNextAction';
import { readLifecyclePolicyValidationSnapshot } from '../integrations/lifecycle/policyValidationSnapshot';
import {
  emitSystemNotification,
  type PumukiCriticalNotificationEvent,
  type SystemNotificationEmitResult,
} from './framework-menu-system-notifications-lib';
import {
  ACTIONABLE_HINTS_BY_CODE,
  buildConsumerPreflightHints,
  hasViolationCode,
} from './framework-menu-consumer-preflight-hints';
import type {
  ConsumerPreflightDependencies,
  ConsumerPreflightResult,
} from './framework-menu-consumer-preflight-types';

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
  readGovernanceNextAction,
};

const buildNotificationEvents = (
  result: AiGateCheckResult
): ReadonlyArray<PumukiCriticalNotificationEvent> => {
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
    const firstViolation = result.violations[0];
    const causeCode = firstViolation?.code ?? 'GATE_BLOCKED';
    const causeMessage =
      firstViolation?.message
      ?? `Detected ${result.violations.length} blocking violations in stage ${result.stage}.`;
    const remediation =
      (firstViolation ? ACTIONABLE_HINTS_BY_CODE[firstViolation.code] : undefined)
      ?? 'Corrige la causa bloqueante y vuelve a ejecutar el gate.';
    events.push({
      kind: 'gate.blocked',
      stage: result.stage,
      totalViolations: result.violations.length,
      causeCode,
      causeMessage,
      remediation,
    });
  }
  return events;
};

export const runConsumerPreflight = (
  params: {
    repoRoot?: string;
    stage: ConsumerPreflightResult['stage'];
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
  const governanceObservation = readGovernanceObservationSnapshot({
    repoRoot,
    experimentalFeatures: readLifecycleExperimentalFeaturesSnapshot(),
    policyValidation: readLifecyclePolicyValidationSnapshot(repoRoot),
    git: new LifecycleGitService(),
  });
  const governanceNextAction = activeDependencies.readGovernanceNextAction({
    repoRoot,
    stage: params.stage,
    governanceObservation,
  });
  const hints = buildConsumerPreflightHints(result, params.stage);
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
    governanceObservation,
    governanceNextAction,
    hints,
    notificationResults,
  };
};
