import type { RuleCoverageDiagnosticsReport } from './framework-menu-rule-coverage-diagnostics-types';

export const formatRuleCoverageDiagnostics = (
  report: RuleCoverageDiagnosticsReport
): string => {
  const lines: string[] = [
    'RULE COVERAGE DIAGNOSTICS',
    `repo_root=${report.repoRoot}`,
    `generated_at=${report.generatedAt}`,
    '',
  ];

  for (const stage of report.stages) {
    lines.push(`[${stage.stage}] policy=${stage.policyTraceBundle}`);
    lines.push(
      `evaluation_stage=${stage.evaluationStage} sdd_allowed=${stage.sdd.allowed} sdd_code=${stage.sdd.code}`
    );
    lines.push(
      `facts_total=${stage.factsTotal} files_scanned=${stage.filesScanned} rules_total=${stage.rulesTotal}`
    );
    lines.push(
      `rules_baseline=${stage.baselineRules} rules_heuristics=${stage.heuristicRules} rules_skills=${stage.skillsRules} rules_project=${stage.projectRules}`
    );
    lines.push(
      `matched_rules=${stage.matchedRules} unmatched_rules=${stage.unmatchedRules} findings_total=${stage.findingsTotal}`
    );
    lines.push(
      `findings_by_severity_enterprise=CRITICAL:${stage.findingsByEnterpriseSeverity.CRITICAL}|HIGH:${stage.findingsByEnterpriseSeverity.HIGH}|MEDIUM:${stage.findingsByEnterpriseSeverity.MEDIUM}|LOW:${stage.findingsByEnterpriseSeverity.LOW}`
    );
    lines.push(
      `findings_by_severity_legacy=CRITICAL:${stage.findingsBySeverity.CRITICAL}|ERROR:${stage.findingsBySeverity.ERROR}|WARN:${stage.findingsBySeverity.WARN}|INFO:${stage.findingsBySeverity.INFO}`
    );
    lines.push(
      `evaluated_rule_ids=${stage.evaluatedRuleIds.length > 0 ? stage.evaluatedRuleIds.join(',') : 'none'}`
    );
    lines.push(
      `matched_rule_ids=${stage.matchedRuleIds.length > 0 ? stage.matchedRuleIds.join(',') : 'none'}`
    );
    lines.push(
      `unmatched_rule_ids=${stage.unmatchedRuleIds.length > 0 ? stage.unmatchedRuleIds.join(',') : 'none'}`
    );
    lines.push('');
  }

  return lines.join('\n').trimEnd();
};
