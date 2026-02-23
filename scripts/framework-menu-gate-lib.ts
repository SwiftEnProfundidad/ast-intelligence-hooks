import { resolvePolicyForStage } from '../integrations/gate/stagePolicies';
import { runPlatformGate } from '../integrations/git/runPlatformGate';
import { evaluatePlatformGateFindings } from '../integrations/git/runPlatformGateEvaluation';
import { runAndPrintExitCode } from './framework-menu-runners';

export type MenuStage = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';

export type MenuScope =
  | { kind: 'staged' }
  | { kind: 'repo' }
  | { kind: 'repoAndStaged' }
  | { kind: 'workingTree' }
  | {
      kind: 'range';
      fromRef: string;
      toRef: string;
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

export const runRepoGateSilent = async (): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'repo' },
  });
  await runMenuAuditGate(gateParams);
};

export const runRepoAndStagedGateSilent = async (): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'repoAndStaged' },
  });
  await runMenuAuditGate(gateParams);
};

export const runRepoAndStagedPrePushGateSilent = async (): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_PUSH',
    scope: { kind: 'repoAndStaged' },
  });
  await runMenuAuditGate(gateParams);
};

export const runWorkingTreeGateSilent = async (): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_COMMIT',
    scope: { kind: 'workingTree' },
  });
  await runMenuAuditGate(gateParams);
};

export const runWorkingTreePrePushGateSilent = async (): Promise<void> => {
  const gateParams = buildMenuGateParams({
    stage: 'PRE_PUSH',
    scope: { kind: 'workingTree' },
  });
  await runMenuAuditGate(gateParams);
};

const runMenuAuditGate = async (
  gateParams: ReturnType<typeof buildMenuGateParams>
): Promise<void> => {
  await runPlatformGate({
    ...gateParams,
    auditMode: 'engine',
    dependencies: {
      printGateFindings: () => {},
      evaluatePlatformGateFindings: (params) =>
        evaluatePlatformGateFindings(params, {
          loadHeuristicsConfig: () => ({
            astSemanticEnabled: true,
            typeScriptScope: 'all',
          }),
        }),
    },
  });
};
