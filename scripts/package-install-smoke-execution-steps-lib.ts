import type { SmokeExpectation } from './package-install-smoke-contract';
import { runGateStep, type SmokeGateStep } from './package-install-smoke-gate-lib';
import { resolveConsumerPumukiCommand } from './package-install-smoke-command-resolution-lib';
import type { SmokeWorkspace } from './package-install-smoke-workspace-contract';

export type SmokeStepResult = {
  label: SmokeGateStep['label'];
  outcome: string;
  exitCode: number;
};

type SmokeGateStepDescriptor = {
  label: SmokeGateStep['label'];
  binary: string;
  args?: ReadonlyArray<string>;
  evidenceFile: SmokeGateStep['evidenceFile'];
  stage: SmokeGateStep['stage'];
};

export const DEFAULT_SMOKE_GATE_STEPS: ReadonlyArray<SmokeGateStepDescriptor> = [
  {
    label: 'pre-commit',
    binary: 'pumuki-pre-commit',
    evidenceFile: 'pre-commit.ai_evidence.json',
    stage: 'PRE_COMMIT',
  },
  {
    label: 'pre-push',
    binary: 'pumuki-pre-push',
    evidenceFile: 'pre-push.ai_evidence.json',
    stage: 'PRE_PUSH',
  },
  {
    label: 'ci',
    binary: 'pumuki-ci',
    evidenceFile: 'ci.ai_evidence.json',
    stage: 'CI',
  },
];

export const runDefaultSmokeGateSteps = (params: {
  workspace: SmokeWorkspace;
  expectation: SmokeExpectation;
}): ReadonlyArray<SmokeStepResult> =>
  DEFAULT_SMOKE_GATE_STEPS.map((stepDescriptor) => {
    const resolvedCommand = resolveConsumerPumukiCommand({
      consumerRepo: params.workspace.consumerRepo,
      binary: stepDescriptor.binary,
      args: stepDescriptor.args,
    });
    const step: SmokeGateStep = {
      label: stepDescriptor.label,
      command: resolvedCommand.executable,
      args: resolvedCommand.args,
      evidenceFile: stepDescriptor.evidenceFile,
      stage: stepDescriptor.stage,
    };
    const result = runGateStep(params.workspace, step, params.expectation);
    return {
      label: stepDescriptor.label,
      outcome: result.outcome,
      exitCode: result.exitCode,
    };
  });
