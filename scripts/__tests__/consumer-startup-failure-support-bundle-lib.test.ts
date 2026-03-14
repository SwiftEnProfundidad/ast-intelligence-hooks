import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildConsumerSupportBundleMarkdown,
  extractRepoOwner,
  parseConsumerSupportBundleArgs,
} from '../consumer-startup-failure-support-bundle-lib';

test('parseConsumerSupportBundleArgs provides defaults and validates required repo', () => {
  const parsed = parseConsumerSupportBundleArgs(['--repo', 'owner/repo']);

  assert.equal(parsed.repo, 'owner/repo');
  assert.equal(parsed.limit, 20);
  assert.equal(
    parsed.outFile,
    '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md'
  );
});

test('extractRepoOwner returns owner when repo slug is valid', () => {
  assert.equal(extractRepoOwner('owner/repo'), 'owner');
  assert.equal(extractRepoOwner(''), undefined);
});

test('buildConsumerSupportBundleMarkdown renders billing remediation when probe fails', () => {
  const markdown = buildConsumerSupportBundleMarkdown({
    generatedAtIso: '2026-02-09T00:00:00.000Z',
    options: {
      repo: 'owner/repo',
      limit: 1,
      outFile: 'report.md',
    },
    authStatus: 'ok',
    repoInfo: {
      full_name: 'owner/repo',
      private: true,
      visibility: 'private',
    },
    actionsPermissions: {
      enabled: true,
      allowed_actions: 'all',
      sha_pinning_required: false,
    },
    billingError: 'missing user scope',
    runs: [
      {
        databaseId: 123,
        workflowName: 'Build',
        status: 'completed',
        conclusion: 'startup_failure',
        url: 'https://example.local/runs/123',
        event: 'push',
        createdAt: '2026-02-09T00:00:00.000Z',
        headBranch: 'main',
        headSha: 'abc',
      },
    ],
    diagnostics: [
      {
        run: {
          databaseId: 123,
          workflowName: 'Build',
          status: 'completed',
          conclusion: 'startup_failure',
          url: 'https://example.local/runs/123',
          event: 'push',
          createdAt: '2026-02-09T00:00:00.000Z',
          headBranch: 'main',
          headSha: 'abc',
        },
        jobsCount: 0,
        artifactsCount: 0,
      },
    ],
  });

  assert.match(markdown, /## Billing Scope Probe/);
  assert.match(markdown, /gh auth refresh -h github\.com -s user/);
  assert.match(markdown, /startup_failure runs: 1/);
  assert.match(markdown, /Observed GitHub Actions startup_failure runs in private repository/);
});

test('buildConsumerSupportBundleMarkdown stays evidence-driven when no startup failures exist', () => {
  const markdown = buildConsumerSupportBundleMarkdown({
    generatedAtIso: '2026-02-09T00:00:00.000Z',
    options: {
      repo: 'owner/repo',
      limit: 1,
      outFile: 'report.md',
    },
    authStatus: 'ok',
    repoInfo: {
      full_name: 'owner/repo',
      private: false,
      visibility: 'public',
    },
    actionsPermissions: {
      enabled: true,
      allowed_actions: 'all',
      sha_pinning_required: false,
    },
    runs: [
      {
        databaseId: 124,
        workflowName: 'Build',
        status: 'completed',
        conclusion: 'success',
        url: 'https://example.local/runs/124',
        event: 'push',
        createdAt: '2026-02-09T00:00:00.000Z',
        headBranch: 'main',
        headSha: 'def',
      },
    ],
    diagnostics: [
      {
        run: {
          databaseId: 124,
          workflowName: 'Build',
          status: 'completed',
          conclusion: 'success',
          url: 'https://example.local/runs/124',
          event: 'push',
          createdAt: '2026-02-09T00:00:00.000Z',
          headBranch: 'main',
          headSha: 'def',
        },
        jobsCount: 2,
        artifactsCount: 1,
      },
    ],
  });

  assert.match(
    markdown,
    /No startup_failure runs were observed in the sampled workflow runs for this public repository/
  );
  assert.match(
    markdown,
    /The current support bundle does not show startup_failure runs in the sampled evidence window/
  );
  assert.doesNotMatch(markdown, /Persistent GitHub Actions startup_failure in private repository/);
});
