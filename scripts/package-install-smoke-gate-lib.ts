import { copyFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SmokeExpectation } from './package-install-smoke-contract';
import {
  assertNoFatalOutput,
  parseEvidence,
  runCommand,
} from './package-install-smoke-runner-common';
import {
  pushCommandLog,
  type SmokeWorkspace,
} from './package-install-smoke-workspace-lib';

export type SmokeGateStep = {
  label: 'pre-commit' | 'pre-push' | 'ci';
  command: string;
  args: string[];
  evidenceFile: string;
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
};

export const runGateStep = (
  workspace: SmokeWorkspace,
  step: SmokeGateStep,
  expectation: SmokeExpectation
): { outcome: string; exitCode: number } => {
  const gateEnv: NodeJS.ProcessEnv = {
    PUMUKI_SDD_BYPASS: '1',
    ...(step.label === 'ci' ? { GITHUB_BASE_REF: 'main' } : {}),
  };

  const result = runCommand({
    cwd: workspace.consumerRepo,
    executable: step.command,
    args: step.args,
    env: gateEnv,
  });

  pushCommandLog(workspace.commandLog, result);
  assertNoFatalOutput(result, `pumuki-${step.label}`);
  if (result.exitCode !== expectation.expectedExitCode) {
    throw new Error(
      `pumuki-${step.label} expected exit code ${expectation.expectedExitCode}, got ${result.exitCode}`
    );
  }

  copyFileSync(
    join(workspace.consumerRepo, '.ai_evidence.json'),
    join(workspace.reportRoot, step.evidenceFile)
  );

  const evidence = parseEvidence(join(workspace.reportRoot, step.evidenceFile));
  if (evidence.version !== '2.1' || evidence.stage !== step.stage) {
    throw new Error(
      `Invalid ${step.stage} evidence metadata: version=${evidence.version} stage=${evidence.stage}`
    );
  }

  if (evidence.outcome !== expectation.expectedOutcome) {
    throw new Error(
      `Unexpected ${step.stage} evidence outcome for mode: ${evidence.outcome}`
    );
  }

  return {
    outcome: evidence.outcome,
    exitCode: result.exitCode,
  };
};
