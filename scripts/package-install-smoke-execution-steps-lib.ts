import type { SmokeExpectation } from './package-install-smoke-contract';
import { runGateStep, type SmokeGateStep } from './package-install-smoke-gate-lib';
import type { SmokeWorkspace } from './package-install-smoke-workspace-contract';

export type SmokeStepResult = {
  label: SmokeGateStep['label'];
  outcome: string;
  exitCode: number;
};

export const DEFAULT_SMOKE_GATE_STEPS: ReadonlyArray<SmokeGateStep> = [
  {
    label: 'pre-commit',
    command: 'npx',
    args: ['--yes', 'pumuki-pre-commit'],
    evidenceFile: 'pre-commit.ai_evidence.json',
    stage: 'PRE_COMMIT',
  },
  {
    label: 'pre-push',
    command: 'npx',
    args: ['--yes', 'pumuki-pre-push'],
    evidenceFile: 'pre-push.ai_evidence.json',
    stage: 'PRE_PUSH',
  },
  {
    label: 'ci',
    command: 'npx',
    args: ['--yes', 'pumuki-ci'],
    evidenceFile: 'ci.ai_evidence.json',
    stage: 'CI',
  },
];

export const runDefaultSmokeGateSteps = (params: {
  workspace: SmokeWorkspace;
  expectation: SmokeExpectation;
}): ReadonlyArray<SmokeStepResult> =>
  DEFAULT_SMOKE_GATE_STEPS.map((step) => {
    const result = runGateStep(params.workspace, step, params.expectation);
    return {
      label: step.label,
      outcome: result.outcome,
      exitCode: result.exitCode,
    };
  });
