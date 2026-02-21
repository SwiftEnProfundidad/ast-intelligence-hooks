import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chdir, cwd } from 'node:process';
import { runRepoGateSilent } from './framework-menu-gate-lib';
import { readMatrixOptionReport } from './framework-menu-matrix-evidence-lib';

export type ConsumerMenuCanaryResult = {
  option: '1';
  detected: boolean;
  totalViolations: number;
  filesScanned: number;
  ruleIds: string[];
};

const buildCanaryRelativePath = (): string => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  return `scripts/__pumuki_matrix_canary_${suffix}.ts`;
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

export const runConsumerMenuCanary = async (params?: {
  repoRoot?: string;
}): Promise<ConsumerMenuCanaryResult> => {
  const previousCwd = cwd();
  const repoRoot = params?.repoRoot ?? previousCwd;
  const canaryRelativePath = buildCanaryRelativePath();
  const canaryAbsolutePath = join(repoRoot, canaryRelativePath);

  chdir(repoRoot);
  try {
    writeFileSync(
      canaryAbsolutePath,
      [
        'export const __pumukiMatrixCanary = (): void => {',
        '  try {',
        "    throw new Error('pumuki-matrix-canary')",
        '  } catch {}',
        '};',
        '',
      ].join('\n'),
      'utf8'
    );

    await runRepoGateSilent();
    const option1Report = readMatrixOptionReport(repoRoot, '1');
    const ruleIds = extractRuleIdsFromEvidence(repoRoot);

    return {
      option: '1',
      detected:
        option1Report.totalViolations > 0 && ruleIds.includes('skills.backend.no-empty-catch'),
      totalViolations: option1Report.totalViolations,
      filesScanned: option1Report.filesScanned,
      ruleIds,
    };
  } finally {
    try {
      unlinkSync(canaryAbsolutePath);
    } catch {
      // best effort cleanup
    }
    chdir(previousCwd);
  }
};
