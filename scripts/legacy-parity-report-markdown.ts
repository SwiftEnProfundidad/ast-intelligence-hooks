import type { LegacyParityReport } from './legacy-parity-report-types';

export const formatLegacyParityReportMarkdown = (report: LegacyParityReport): string => {
  const lines: string[] = [
    '# Legacy Parity Dominance Report',
    '',
    `- generated_at: ${report.generatedAt}`,
    `- legacy_path: ${report.legacyPath}`,
    `- enterprise_path: ${report.enterprisePath}`,
    `- dominance: ${report.dominance}`,
    `- rule_dominance: ${report.ruleDominance}`,
    `- hard_block_by_severity: ${report.severity.hardBlock ? 'YES' : 'NO'}`,
    '',
    '## Scope Validation',
    '',
    `- strict_scope: ${report.scope.strict ? 'ENABLED' : 'DISABLED'}`,
    `- stage_match: ${report.scope.matches.stage ? 'YES' : 'NO'}`,
    `- files_scanned_match: ${report.scope.matches.filesScanned ? 'YES' : 'NO'}`,
    `- repo_root_match: ${report.scope.matches.repoRoot ? 'YES' : 'NO'}`,
    `- legacy_stage: ${report.scope.legacy.stage ?? 'missing'}`,
    `- enterprise_stage: ${report.scope.enterprise.stage ?? 'missing'}`,
    `- legacy_files_scanned: ${report.scope.legacy.filesScanned ?? 'missing'}`,
    `- enterprise_files_scanned: ${report.scope.enterprise.filesScanned ?? 'missing'}`,
    `- legacy_repo_root: ${report.scope.legacy.repoRoot ?? 'missing'}`,
    `- enterprise_repo_root: ${report.scope.enterprise.repoRoot ?? 'missing'}`,
    '',
    '## Severity Matrix',
    '',
    '| severity | legacy | enterprise | dominance |',
    '|---|---:|---:|---|',
  ];
  for (const row of report.severity.rows) {
    lines.push(
      `| ${row.severity} | ${row.legacyCount} | ${row.enterpriseCount} | ${row.dominance} |`
    );
  }
  lines.push(
    '',
    '## Totals',
    '',
    `- compared_rules: ${report.totals.comparedRules}`,
    `- passed_rules: ${report.totals.passedRules}`,
    `- failed_rules: ${report.totals.failedRules}`,
    `- legacy_findings: ${report.totals.legacyFindings}`,
    `- enterprise_findings: ${report.totals.enterpriseFindings}`,
    '',
    '## Rule Matrix',
    '',
    '| platform | rule_id | legacy | enterprise | dominance |',
    '|---|---|---:|---:|---|'
  );

  for (const row of report.rows) {
    lines.push(
      `| ${row.platform} | ${row.ruleId} | ${row.legacyCount} | ${row.enterpriseCount} | ${row.dominance} |`
    );
  }

  return lines.join('\n');
};
