import { resolvePolicyForStage } from '../integrations/gate/stagePolicies';
import { runPlatformGate } from '../integrations/git/runPlatformGate';
import { runAndPrintExitCode } from './framework-menu-runners';

export type MenuStage = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';

export type MenuScope =
  | { kind: 'staged' }
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
