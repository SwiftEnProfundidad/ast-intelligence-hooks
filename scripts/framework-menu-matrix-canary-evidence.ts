import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const extractRuleIdsFromEvidence = (repoRoot: string): string[] => {
  const evidencePath = join(repoRoot, '.ai_evidence.json');
  try {
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
