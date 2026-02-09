import type { ParsedAuthReport, ParsedSupportBundle } from './consumer-support-ticket-parser-lib';

export const buildSupportTicketDraft = (params: {
  repo: string;
  supportBundlePath: string;
  authReportPath: string;
  support: ParsedSupportBundle;
  auth: ParsedAuthReport;
}): string => {
  const lines: string[] = [];
  const now = new Date().toISOString();
  const runUrls = params.support.runUrls.slice(0, 3);

  lines.push('# Consumer CI Support Ticket Draft');
  lines.push('');
  lines.push(`- generated_at: ${now}`);
  lines.push(`- repository: \`${params.repo}\``);
  lines.push(`- source_support_bundle: \`${params.supportBundlePath}\``);
  lines.push(`- source_auth_report: \`${params.authReportPath}\``);
  lines.push('');

  lines.push('## Subject');
  lines.push('');
  lines.push('Persistent GitHub Actions `startup_failure` with no jobs in private repository');
  lines.push('');

  lines.push('## Problem Summary');
  lines.push('');
  lines.push('- Runs consistently end with `conclusion: startup_failure`.');
  lines.push(`- startup_failure_runs observed: ${params.support.startupFailureRuns ?? 'unknown'}.`);
  lines.push(`- run metadata path: ${params.support.path ?? 'unknown'}.`);
  lines.push(`- jobs.total_count: ${params.support.jobsCount ?? 'unknown'}.`);
  lines.push(`- artifacts.total_count: ${params.support.artifactsCount ?? 'unknown'}.`);
  lines.push(`- repo visibility: ${params.support.repoVisibility ?? 'unknown'}.`);
  lines.push('');

  lines.push('## Evidence');
  lines.push('');
  if (runUrls.length === 0) {
    lines.push('- No run URLs extracted from support bundle; attach report file directly.');
  } else {
    lines.push('Sample run URLs:');
    for (const runUrl of runUrls) {
      lines.push(`- ${runUrl}`);
    }
  }
  lines.push('');

  lines.push('## Auth and Billing Probe');
  lines.push('');
  lines.push(`- auth verdict: ${params.auth.verdict ?? 'unknown'}`);
  lines.push(`- detected scopes: ${params.auth.detectedScopes ?? 'unknown'}`);
  lines.push(`- missing scopes: ${params.auth.missingScopes ?? 'unknown'}`);
  if (params.auth.billingError) {
    lines.push(`- billing probe error: ${params.auth.billingError}`);
  }
  lines.push('');

  lines.push('## Request');
  lines.push('');
  lines.push('Please verify account/repository-level controls for private Actions execution (billing, policy, quotas, or internal restrictions) and provide the exact root cause for startup_failure before job graph creation.');
  lines.push('');

  lines.push('## Attachments');
  lines.push('');
  lines.push(`- ${params.supportBundlePath}`);
  lines.push(`- ${params.authReportPath}`);
  lines.push('- .audit-reports/consumer-triage/consumer-ci-artifacts-report.md');
  lines.push('- .audit-reports/consumer-triage/consumer-workflow-lint-report.md');
  lines.push('- docs/validation/archive/skills-rollout-r_go-startup-fix-experiment.md');
  lines.push('- docs/validation/archive/private-actions-healthcheck.md');
  lines.push('');

  return `${lines.join('\n')}\n`;
};
