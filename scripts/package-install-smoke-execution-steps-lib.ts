import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SmokeExpectation } from './package-install-smoke-contract';
import {
  assertNoFatalOutput,
  assertSuccess,
  runCommand,
} from './package-install-smoke-runner-common';
import { runGateStep, type SmokeGateStep } from './package-install-smoke-gate-lib';
import { resolveConsumerPumukiCommand } from './package-install-smoke-command-resolution-lib';
import type { SmokeWorkspace } from './package-install-smoke-workspace-contract';
import { pushCommandLog } from './package-install-smoke-workspace-lib';

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

export const runSmokeGoldenFlowEvidenceStep = (workspace: SmokeWorkspace): void => {
  writeFileSync(
    join(workspace.consumerRepo, 'package-smoke-minimal.feature'),
    [
      'Feature: Package smoke minimal',
      '',
      '  Scenario: package smoke minimal',
      '    Given a minimal package consumer',
      '    When Pumuki gates run',
      '    Then the package smoke passes',
      '',
    ].join('\n'),
    'utf8'
  );
  const addFeatureResult = runCommand({
    cwd: workspace.consumerRepo,
    executable: 'git',
    args: ['add', 'package-smoke-minimal.feature'],
  });
  pushCommandLog(workspace.commandLog, addFeatureResult);
  assertSuccess(addFeatureResult, 'git add package smoke feature');

  const resolvedCommand = resolveConsumerPumukiCommand({
    consumerRepo: workspace.consumerRepo,
    binary: 'pumuki',
    args: [
      'sdd',
      'evidence',
      '--scenario-id=package-smoke-minimal',
      '--test-command=package-smoke-minimal',
      '--test-status=passed',
      '--json',
    ],
  });
  const result = runCommand({
    cwd: workspace.consumerRepo,
    executable: resolvedCommand.executable,
    args: resolvedCommand.args,
    env: {
      PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS: '1',
      PUMUKI_SYSTEM_NOTIFICATIONS: '0',
      PUMUKI_NOTIFICATIONS: '0',
      PUMUKI_SDD_BYPASS: '1',
    },
  });

  pushCommandLog(workspace.commandLog, result);
  assertNoFatalOutput(result, 'pumuki-sdd-evidence');
  assertSuccess(result, 'pumuki-sdd-evidence');
};
