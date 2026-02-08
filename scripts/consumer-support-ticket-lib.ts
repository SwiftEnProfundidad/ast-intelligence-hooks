export type ParsedSupportBundle = {
  repoVisibility?: string;
  startupFailureRuns?: string;
  runUrls: ReadonlyArray<string>;
  path?: string;
  jobsCount?: string;
  artifactsCount?: string;
};

export type ParsedAuthReport = {
  verdict?: string;
  detectedScopes?: string;
  missingScopes?: string;
  billingError?: string;
};

const extractLineValue = (source: string, pattern: RegExp): string | undefined => {
  const match = source.match(pattern);
  if (!match || !match[1]) {
    return undefined;
  }
  return match[1].trim();
};

const dedupe = (values: ReadonlyArray<string>): string[] => {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    output.push(value);
  }

  return output;
};

export const parseSupportBundle = (markdown: string): ParsedSupportBundle => {
  const runUrls = dedupe(
    Array.from(
      markdown.matchAll(/https:\/\/github\.com\/[^\s)]+\/actions\/runs\/\d+/g),
      (match) => match[0]
    )
  );

  return {
    repoVisibility: extractLineValue(markdown, /- repo_visibility:\s*`([^`]+)`/),
    startupFailureRuns: extractLineValue(markdown, /- startup_failure_runs:\s*([0-9]+)/),
    runUrls,
    path: extractLineValue(markdown, /- path:\s*([^\n]+)/),
    jobsCount: extractLineValue(markdown, /- jobs\.total_count:\s*([0-9]+)/),
    artifactsCount: extractLineValue(markdown, /- artifacts\.total_count:\s*([0-9]+)/),
  };
};

export const parseAuthReport = (markdown: string): ParsedAuthReport => {
  return {
    verdict: extractLineValue(markdown, /- verdict:\s*([^\n]+)/),
    detectedScopes: extractLineValue(markdown, /- detected_scopes:\s*([^\n]+)/),
    missingScopes: extractLineValue(markdown, /- missing_scopes:\s*([^\n]+)/),
    billingError: extractLineValue(markdown, /## Billing Probe\s+[\s\S]*?- error:\s*([^\n]+)/),
  };
};

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
  lines.push('- docs/validation/consumer-ci-artifacts-report.md');
  lines.push('- docs/validation/consumer-workflow-lint-report.md');
  lines.push('- docs/validation/consumer-startup-fix-experiment.md');
  lines.push('- docs/validation/private-actions-healthcheck-temp.md');
  lines.push('');

  return `${lines.join('\n')}\n`;
};
