import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { chdir, cwd } from 'node:process';
import { execFileSync } from 'node:child_process';
import {
  runRepoAndStagedPrePushGateSilent,
  runRepoGateSilent,
  runStagedGateSilent,
  runWorkingTreePrePushGateSilent,
} from './framework-menu-gate-lib';
import { readMatrixOptionReport, type MatrixOptionId } from './framework-menu-matrix-evidence-lib';

export type ConsumerMenuCanaryStage = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
export type ConsumerMenuCanaryPlatform = 'ios' | 'android' | 'backend' | 'frontend';

export type ConsumerMenuCanaryResult = {
  option: MatrixOptionId;
  detected: boolean;
  totalViolations: number;
  filesScanned: number;
  ruleIds: string[];
};

export type ConsumerMenuCanaryScenario = {
  stage: ConsumerMenuCanaryStage;
  platform: ConsumerMenuCanaryPlatform;
  option: MatrixOptionId;
  expectedRuleId: string;
  canaryRelativePath: string;
  canarySource: string;
};

const buildCanarySuffix = (): string => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  return suffix;
};

export const resolveConsumerMenuCanaryScenario = (params?: {
  stage?: ConsumerMenuCanaryStage;
  platform?: ConsumerMenuCanaryPlatform;
}): ConsumerMenuCanaryScenario => {
  const stage = params?.stage ?? 'PRE_COMMIT';
  const platform = params?.platform ?? 'backend';
  const suffix = buildCanarySuffix();

  if (platform === 'frontend') {
    return {
      stage,
      platform,
      option: stage === 'PRE_COMMIT' ? '1' : '2',
      expectedRuleId: 'skills.frontend.avoid-explicit-any',
      canaryRelativePath: `apps/frontend/__pumuki_matrix_canary_frontend_${suffix}.ts`,
      canarySource: [
        'export const __pumukiMatrixCanaryFrontend = (): void => {',
        '  const risky: any = {};',
        '  void risky;',
        '};',
        '',
      ].join('\n'),
    };
  }

  if (platform === 'ios') {
    return {
      stage,
      platform,
      option: stage === 'PRE_COMMIT' ? '1' : '2',
      expectedRuleId: 'skills.ios.no-force-unwrap',
      canaryRelativePath: `apps/ios/App/__pumuki_matrix_canary_ios_${suffix}.swift`,
      canarySource: [
        'import Foundation',
        '',
        'func __pumukiMatrixCanaryIOS() {',
        '  let value: String? = "canary"',
        '  _ = value!',
        '}',
        '',
      ].join('\n'),
    };
  }

  if (platform === 'android') {
    return {
      stage,
      platform,
      option: stage === 'PRE_COMMIT' ? '1' : '2',
      expectedRuleId: 'skills.android.no-runblocking',
      canaryRelativePath: `apps/android/app/src/main/java/com/pumuki/__pumuki_matrix_canary_android_${suffix}.kt`,
      canarySource: [
        'package com.pumuki',
        '',
        'import kotlinx.coroutines.runBlocking',
        '',
        'fun pumukiMatrixCanaryAndroid() {',
        '  runBlocking {',
        '  }',
        '}',
        '',
      ].join('\n'),
    };
  }

  return {
    stage,
    platform: 'backend',
    option: stage === 'PRE_COMMIT' ? '1' : '2',
    expectedRuleId: 'skills.backend.no-empty-catch',
    canaryRelativePath: `apps/backend/src/__pumuki_matrix_canary_backend_${suffix}.ts`,
    canarySource: [
      'export const __pumukiMatrixCanaryBackend = (): void => {',
      '  try {',
      "    throw new Error('pumuki-matrix-canary')",
      '  } catch {}',
      '};',
      '',
    ].join('\n'),
  };
};

const extractRuleIdsFromEvidence = (repoRoot: string): string[] => {
  const evidencePath = join(repoRoot, '.ai_evidence.json');
  try {
    const parsed = JSON.parse(readFileSync(evidencePath, 'utf8')) as {
      snapshot?: { findings?: Array<{ ruleId?: unknown }> };
    };
    const findings = parsed?.snapshot?.findings;
    if (!Array.isArray(findings)) {
      return [];
    }
    return findings
      .map((finding) => (typeof finding.ruleId === 'string' ? finding.ruleId : ''))
      .filter((ruleId) => ruleId.length > 0);
  } catch {
    return [];
  }
};

const stageCanaryPath = (repoRoot: string, relativePath: string): void => {
  execFileSync('git', ['add', '--', relativePath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
};

const cleanupCanaryPathFromIndex = (repoRoot: string, relativePath: string): void => {
  try {
    execFileSync('git', ['restore', '--staged', '--', relativePath], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: 'ignore',
    });
    return;
  } catch {
    // Continue to fallback cleanup strategy.
  }

  try {
    execFileSync('git', ['rm', '--cached', '--ignore-unmatch', '--', relativePath], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: 'ignore',
    });
  } catch {
    // best effort cleanup
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
    if (scenario.option === '1' || scenario.option === '2') {
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
    } catch {
      // best effort cleanup
    }
    try {
      unlinkSync(canaryAbsolutePath);
    } catch {
      // best effort cleanup
    }
    chdir(previousCwd);
  }
};
