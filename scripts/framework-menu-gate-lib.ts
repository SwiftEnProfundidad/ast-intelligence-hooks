import { resolvePolicyForStage } from '../integrations/gate/stagePolicies';
import { runPlatformGate } from '../integrations/git/runPlatformGate';
import { evaluatePlatformGateFindings } from '../integrations/git/runPlatformGateEvaluation';
import { runPrePushStage } from '../integrations/git/stageRunners';
import { runAndPrintExitCode } from './framework-menu-runners';
import type { ConsumerRuntimeGateResult } from './framework-menu-consumer-runtime-types';

export type MenuStage = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';

export type MenuScope =
  | { kind: 'staged' }
  | { kind: 'unstaged' }
  | { kind: 'repo' }
  | { kind: 'repoAndStaged' }
  | { kind: 'workingTree' }
  | {
      kind: 'range';
      fromRef: string;
      toRef: string;
    };

type MenuGateDependencies = {
  runPlatformGate: typeof runPlatformGate;
  runPrePushStage: typeof runPrePushStage;
};

const defaultDependencies: MenuGateDependencies = {
  runPlatformGate,
  runPrePushStage,
};

export const buildMenuGateParams = (params: {
  stage: MenuStage;
  scope: MenuScope;
  repoRoot?: string;
}) => {
  const resolved = resolvePolicyForStage(params.stage, params.repoRoot);

  return {
    policy: resolved.policy,
    policyTrace: resolved.trace,
    scope: params.scope,
  };
};

export const runStagedGate = async (): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'staged' },
  });

  await runAndPrintExitCode(() => runPlatformGate(gateParams));
};

export const runRangeGate = async (params: {
  fromRef: string;
  toRef: string;
  stage: 'PRE_PUSH' | 'CI';
}): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: params.stage,
    scope: {
      kind: 'range',
      fromRef: params.fromRef,
      toRef: params.toRef,
    },
  });

  await runAndPrintExitCode(() => runPlatformGate(gateParams));
};

export const runRepoGate = async (): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'repo' },
  });

  await runAndPrintExitCode(() => runPlatformGate(gateParams));
};

export const runRepoAndStagedGate = async (): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'repoAndStaged' },
  });

  await runAndPrintExitCode(() => runPlatformGate(gateParams));
};

export const runWorkingTreeGate = async (): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'workingTree' },
  });

  await runAndPrintExitCode(() => runPlatformGate(gateParams));
};

export const runStagedGateSilent = async (): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'staged' },
  });
  await runMenuAuditGate(gateParams);
};

export const runStagedGateSilentWithBlocked = async (): Promise<
  ConsumerRuntimeGateResult | void
> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'staged' },
  });
  return await runMenuAuditGateWithBlocked(gateParams);
};

export const runRepoGateSilent = async (): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'repo' },
  });
  await runMenuAuditGate(gateParams);
};

export const runRepoGateSilentWithBlocked = async (): Promise<
  ConsumerRuntimeGateResult | void
> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'repo' },
  });
  return await runMenuAuditGateWithBlocked(gateParams);
};

export const runRepoAndStagedGateSilent = async (): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'repoAndStaged' },
  });
  await runMenuAuditGate(gateParams);
};

export const runRepoAndStagedGateSilentWithBlocked = async (): Promise<
  ConsumerRuntimeGateResult | void
> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'repoAndStaged' },
  });
  return await runMenuAuditGateWithBlocked(gateParams);
};

export const runRepoAndStagedPrePushGateSilent = async (): Promise<
  ConsumerRuntimeGateResult | void
> => {
  return await runRepoAndStagedPrePushGateSilentWithDependencies(defaultDependencies);
};

export const runWorkingTreeGateSilent = async (): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'workingTree' },
  });
  await runMenuAuditGate(gateParams);
};

export const runWorkingTreeGateSilentWithBlocked = async (): Promise<
  ConsumerRuntimeGateResult | void
> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'workingTree' },
  });
  return await runMenuAuditGateWithBlocked(gateParams);
};

export const runWorkingTreePrePushGateSilent = async (): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_PUSH',
    scope: { kind: 'workingTree' },
  });
  await runMenuAuditGate(gateParams);
};

export const runWorkingTreePrePushGateSilentWithBlocked = async (): Promise<
  ConsumerRuntimeGateResult | void
> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_PUSH',
    scope: { kind: 'workingTree' },
  });
  return await runMenuAuditGateWithBlocked(gateParams);
};

export const runUnstagedGateSilent = async (): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'unstaged' },
  });
  await runMenuAuditGate(gateParams);
};

export const runUnstagedGateSilentWithBlocked = async (): Promise<
  ConsumerRuntimeGateResult | void
> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'unstaged' },
  });
  return await runMenuAuditGateWithBlocked(gateParams);
};

const runMenuAuditGate = async (
  gateParams: ReturnType<typeof buildMenuGateParams>
): Promise<void> => {
  await runMenuAuditGateWithBlocked(gateParams);
};

const runMenuAuditGateWithBlocked = async (
  gateParams: ReturnType<typeof buildMenuGateParams>,
  dependencies: MenuGateDependencies = defaultDependencies
): Promise<ConsumerRuntimeGateResult | void> => {
  let blocked: ConsumerRuntimeGateResult['blocked'];

  await dependencies.runPlatformGate({
    ...gateParams,
    auditMode: 'engine',
    sddDecisionOverride: {
      allowed: true,
      code: 'ALLOWED',
      message: 'Framework menu audit gate runs without implicit SDD/OpenSpec bootstrap.',
    },
    dependencies: {
      printGateFindings: () => {},
      notifyGateBlocked: (params) => {
        blocked = {
          stage: params.stage,
          totalViolations: params.totalViolations,
          causeCode: params.causeCode,
          causeMessage: params.causeMessage,
          remediation: params.remediation,
          blockingCauses: params.blockingCauses,
        };
        return {
          delivered: false,
          reason: 'menu-silent-capture',
        };
      },
      evaluatePlatformGateFindings: (params) =>
        evaluatePlatformGateFindings(params, {
          loadHeuristicsConfig: () => ({
            astSemanticEnabled: true,
            typeScriptScope: 'all',
          }),
        }),
    },
  });

  return blocked ? { blocked } : undefined;
};

const runRepoAndStagedPrePushGateSilentWithDependencies = async (
  dependencies: MenuGateDependencies
): Promise<ConsumerRuntimeGateResult | void> => {
  let blocked: ConsumerRuntimeGateResult['blocked'];

  await dependencies.runPrePushStage({
    isQuietMode: () => true,
    notifyAuditSummaryFromEvidence: () => {},
    notifyGateBlocked: (params) => {
      blocked = {
        stage: params.stage,
        totalViolations: params.totalViolations,
        causeCode: params.causeCode,
        causeMessage: params.causeMessage,
        remediation: params.remediation,
        blockingCauses: params.blockingCauses,
      };
    },
    writeHookGateSummary: () => {},
  });

  return blocked ? { blocked } : undefined;
};

export const __testables = {
  runMenuAuditGateWithBlocked,
  runRepoAndStagedPrePushGateSilentWithDependencies,
};
