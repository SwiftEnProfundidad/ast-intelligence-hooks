import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type CanaryEvidenceRuleMatch = {
  ruleId: string;
  filePath: string;
};

const normalizeEvidencePath = (value: string): string => value.replaceAll('\\', '/');

const readEvidenceSnapshotFindings = (repoRoot: string): Array<Record<string, unknown>> => {
  const evidencePath = join(repoRoot, '.ai_evidence.json');
  try {
    const parsed = JSON.parse(readFileSync(evidencePath, 'utf8')) as {
      snapshot?: {
        findings?: Array<Record<string, unknown>>;
      };
    };
    return Array.isArray(parsed?.snapshot?.findings) ? parsed.snapshot.findings : [];
  } catch {
    return [];
  }
};

export const extractRuleIdsFromEvidence = (repoRoot: string): string[] => {
  try {
    const evidencePath = join(repoRoot, '.ai_evidence.json');
    const parsed = JSON.parse(readFileSync(evidencePath, 'utf8')) as {
      snapshot?: {
        findings?: Array<{ ruleId?: unknown }>;
        rules_coverage?: { matched_rule_ids?: unknown };
        evaluation_metrics?: { matched_rule_ids?: unknown };
      };
    };
    const fromFindings = Array.isArray(parsed?.snapshot?.findings)
      ? parsed.snapshot.findings
          .map((finding) => (typeof finding.ruleId === 'string' ? finding.ruleId : ''))
          .filter((ruleId) => ruleId.length > 0)
      : [];
    const fromCoverage = Array.isArray(parsed?.snapshot?.rules_coverage?.matched_rule_ids)
      ? parsed.snapshot.rules_coverage.matched_rule_ids
          .map((ruleId) => (typeof ruleId === 'string' ? ruleId : ''))
          .filter((ruleId) => ruleId.length > 0)
      : [];
    const fromEvaluation = Array.isArray(parsed?.snapshot?.evaluation_metrics?.matched_rule_ids)
      ? parsed.snapshot.evaluation_metrics.matched_rule_ids
          .map((ruleId) => (typeof ruleId === 'string' ? ruleId : ''))
          .filter((ruleId) => ruleId.length > 0)
      : [];

    return [...new Set([...fromCoverage, ...fromEvaluation, ...fromFindings])];
  } catch {
    return [];
  }
};

export const extractRuleMatchesFromEvidence = (repoRoot: string): CanaryEvidenceRuleMatch[] => {
  return readEvidenceSnapshotFindings(repoRoot)
    .map((finding) => {
      const ruleId = typeof finding.ruleId === 'string' ? finding.ruleId : '';
      const filePath =
        typeof finding.filePath === 'string'
          ? finding.filePath
          : typeof finding.file === 'string'
            ? finding.file
            : typeof finding.path === 'string'
              ? finding.path
              : '';
      return {
        ruleId,
        filePath: normalizeEvidencePath(filePath),
      };
    })
    .filter((match) => match.ruleId.length > 0 && match.filePath.length > 0);
};
