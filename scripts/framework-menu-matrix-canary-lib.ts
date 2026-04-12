import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { chdir, cwd } from 'node:process';
import { execFileSync as runBinarySync } from 'node:child_process';
import {
  runRepoAndStagedPrePushGateSilent,
  runRepoGateSilent,
  runStagedGateSilent,
  runUnstagedGateSilent,
  runWorkingTreeGateSilent,
  runWorkingTreePrePushGateSilent,
} from './framework-menu-gate-lib';
import { readMatrixOptionReport, type MatrixOptionId } from './framework-menu-matrix-evidence-lib';
import { extractRuleIdsFromEvidence } from './framework-menu-matrix-canary-evidence';
import { resolveConsumerMenuCanaryScenario } from './framework-menu-matrix-canary-scenario';
import type {
  ConsumerMenuCanaryPlatform,
  ConsumerMenuCanaryResult,
  ConsumerMenuCanaryStage,
} from './framework-menu-matrix-canary-types';

export type {
  ConsumerMenuCanaryPlatform,
  ConsumerMenuCanaryResult,
  ConsumerMenuCanaryScenario,
  ConsumerMenuCanaryStage,
} from './framework-menu-matrix-canary-types';
export { resolveConsumerMenuCanaryScenario } from './framework-menu-matrix-canary-scenario';

const stageCanaryPath = (repoRoot: string, relativePath: string): void => {
  runBinarySync('git', ['add', '--', relativePath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
};

const cleanupCanaryPathFromIndex = (repoRoot: string, relativePath: string): void => {
  try {
    runBinarySync('git', ['restore', '--staged', '--', relativePath], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: 'ignore',
    });
    return;
  } catch (restoreError) {
    void restoreError;
  }

  try {
    runBinarySync('git', ['rm', '--cached', '--ignore-unmatch', '--', relativePath], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: 'ignore',
    });
  } catch (removeError) {
    void removeError;
  }
};

const runGateByOption = async (option: MatrixOptionId): Promise<void> => {
  if (option === '1') {
    await runRepoGateSilent();
    return;
  }
  if (option === '2') {
    await runRepoAndStagedPrePushGateSilent();
    return;
  }
  if (option === '3') {
    await runStagedGateSilent();
    return;
  }
  if (option === '4') {
    await runWorkingTreePrePushGateSilent();
    return;
  }
  if (option === '9') {
    return;
  }
  if (option === '11') {
    await runStagedGateSilent();
    return;
  }
  if (option === '12') {
    await runUnstagedGateSilent();
    return;
  }
  if (option === '13') {
    await runWorkingTreeGateSilent();
    return;
  }
  if (option === '14') {
    await runRepoGateSilent();
  }
};

export const runConsumerMenuCanary = async (params?: {
  repoRoot?: string;
  stage?: ConsumerMenuCanaryStage;
  platform?: ConsumerMenuCanaryPlatform;
  dependencies?: {
    runGate?: (option: MatrixOptionId) => Promise<void>;
    readOptionReport?: typeof readMatrixOptionReport;
    extractRuleIds?: (repoRoot: string) => string[];
  };
}): Promise<ConsumerMenuCanaryResult> => {
  const previousCwd = cwd();
  const repoRoot = params?.repoRoot ?? previousCwd;
  const scenario = resolveConsumerMenuCanaryScenario({
    stage: params?.stage,
    platform: params?.platform,
  });
  const canaryRelativePath = scenario.canaryRelativePath;
  const canaryAbsolutePath = join(repoRoot, canaryRelativePath);
  const dependencies = params?.dependencies;
  const runGate = dependencies?.runGate ?? runGateByOption;
  const readOptionReport = dependencies?.readOptionReport ?? readMatrixOptionReport;
  const extractRuleIds = dependencies?.extractRuleIds ?? extractRuleIdsFromEvidence;

  chdir(repoRoot);
  try {
    mkdirSync(dirname(canaryAbsolutePath), { recursive: true });
    writeFileSync(
      canaryAbsolutePath,
      scenario.canarySource,
      'utf8'
    );
    if (scenario.option === '1' || scenario.option === '2' || scenario.option === '3' || scenario.option === '11') {
      stageCanaryPath(repoRoot, canaryRelativePath);
    }

    await runGate(scenario.option);
    const optionReport = readOptionReport(repoRoot, scenario.option);
    const ruleIds = extractRuleIds(repoRoot);

    return {
      option: scenario.option,
      detected:
        optionReport.totalViolations > 0 && ruleIds.includes(scenario.expectedRuleId),
      totalViolations: optionReport.totalViolations,
      filesScanned: optionReport.filesScanned,
      ruleIds,
    };
  } finally {
    try {
      cleanupCanaryPathFromIndex(repoRoot, canaryRelativePath);
    } catch (cleanupError) {
      void cleanupError;
    }
    try {
      unlinkSync(canaryAbsolutePath);
    } catch (unlinkError) {
      void unlinkError;
    }
    chdir(previousCwd);
  }
};
