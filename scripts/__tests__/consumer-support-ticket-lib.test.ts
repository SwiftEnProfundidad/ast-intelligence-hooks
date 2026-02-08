import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSupportTicketDraft,
  parseAuthReport,
  parseSupportBundle,
} from '../consumer-support-ticket-lib';

test('parseSupportBundle extracts startup diagnostics and deduplicates run urls', () => {
  const markdown = `
# Consumer Startup Failure Support Bundle

- repo_visibility: \`private\` (private=true)
- startup_failure_runs: 3

https://github.com/acme/repo/actions/runs/100
https://github.com/acme/repo/actions/runs/100
https://github.com/acme/repo/actions/runs/101

## Run Diagnostics

- path: BuildFailed
- jobs.total_count: 0
- artifacts.total_count: 0
`;

  const parsed = parseSupportBundle(markdown);

  assert.equal(parsed.repoVisibility, 'private');
  assert.equal(parsed.startupFailureRuns, '3');
  assert.equal(parsed.path, 'BuildFailed');
  assert.equal(parsed.jobsCount, '0');
  assert.equal(parsed.artifactsCount, '0');
  assert.deepEqual(parsed.runUrls, [
    'https://github.com/acme/repo/actions/runs/100',
    'https://github.com/acme/repo/actions/runs/101',
  ]);
});

test('parseAuthReport extracts verdict, scopes and billing error', () => {
  const markdown = `
# Consumer CI Auth Check

- verdict: BLOCKED
- detected_scopes: repo, workflow
- missing_scopes: user

## Billing Probe

- error: gh: This API operation needs the "user" scope.
`;

  const parsed = parseAuthReport(markdown);

  assert.equal(parsed.verdict, 'BLOCKED');
  assert.equal(parsed.detectedScopes, 'repo, workflow');
  assert.equal(parsed.missingScopes, 'user');
  assert.equal(parsed.billingError, 'gh: This API operation needs the "user" scope.');
});

test('buildSupportTicketDraft renders deterministic support sections with attachments', () => {
  const markdown = buildSupportTicketDraft({
    repo: 'acme/repo',
    supportBundlePath: 'docs/validation/support-bundle.md',
    authReportPath: 'docs/validation/auth-check.md',
    support: {
      repoVisibility: 'private',
      startupFailureRuns: '4',
      runUrls: [
        'https://github.com/acme/repo/actions/runs/1',
        'https://github.com/acme/repo/actions/runs/2',
      ],
      path: 'BuildFailed',
      jobsCount: '0',
      artifactsCount: '0',
    },
    auth: {
      verdict: 'BLOCKED',
      detectedScopes: 'repo, workflow',
      missingScopes: 'user',
      billingError: 'missing user scope',
    },
  });

  assert.match(markdown, /# Consumer CI Support Ticket Draft/);
  assert.match(markdown, /- repository: `acme\/repo`/);
  assert.match(markdown, /startup_failure_runs observed: 4\./);
  assert.match(markdown, /Sample run URLs:/);
  assert.match(markdown, /https:\/\/github\.com\/acme\/repo\/actions\/runs\/1/);
  assert.match(markdown, /- auth verdict: BLOCKED/);
  assert.match(markdown, /- billing probe error: missing user scope/);
  assert.match(markdown, /## Attachments/);
  assert.match(markdown, /docs\/validation\/auth-check\.md/);
});
