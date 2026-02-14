import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildConsumerCiAuthMarkdown,
  parseAuthScopes,
  parseConsumerCiAuthArgs,
} from '../consumer-ci-auth-check-lib';

test('parseConsumerCiAuthArgs parses required repo and default output', () => {
  const parsed = parseConsumerCiAuthArgs(['--repo', 'owner/repo']);

  assert.equal(parsed.repo, 'owner/repo');
  assert.equal(
    parsed.outFile,
    '.audit-reports/consumer-triage/consumer-ci-auth-check.md'
  );
});

test('parseAuthScopes extracts comma-separated token scopes', () => {
  const scopes = parseAuthScopes([
    'github.com',
    "  - Token scopes: 'repo', 'workflow', 'user'",
  ].join('\n'));

  assert.deepEqual(scopes, ['repo', 'workflow', 'user']);
});

test('buildConsumerCiAuthMarkdown treats missing user scope as informational', () => {
  const markdown = buildConsumerCiAuthMarkdown({
    options: {
      repo: 'owner/repo',
      outFile: 'report.md',
    },
    authStatus: {
      ok: true,
      output: "  - Token scopes: 'repo', 'workflow'",
    },
    scopes: ['repo', 'workflow'],
    missingScopes: [],
    actionsPermissions: {
      ok: true,
      data: {
        enabled: true,
        allowed_actions: 'all',
        sha_pinning_required: false,
      },
    },
    billing: {
      ok: false,
      error: 'missing user scope',
    },
    verdict: 'READY',
  });

  assert.match(markdown, /- verdict: READY/);
  assert.doesNotMatch(markdown, /gh auth refresh -h github\.com -s user/);
  assert.match(markdown, /Billing probe is optional for startup unblock/);
  assert.match(markdown, /missing user scope/);
});
