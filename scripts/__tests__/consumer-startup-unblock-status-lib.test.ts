import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildConsumerStartupUnblockStatus,
  parseWorkflowLintReport,
  summarizeConsumerStartupUnblock,
} from '../consumer-startup-unblock-status-lib';

test('parseWorkflowLintReport extracts exit code and finding lines', () => {
  const parsed = parseWorkflowLintReport(`
# Consumer Workflow Lint Report

- exit_code: 1

## Raw Output

apps/.github/workflows/ci.yml:10:3: label "macos-13" is unknown [runner-label]
apps/.github/workflows/lighthouse.yml:20:5: input "assertions" is not defined [action]
`);

  assert.equal(parsed.exitCode, 1);
  assert.equal(parsed.findingsCount, 2);
});

test('summarizeConsumerStartupUnblock returns MISSING_INPUTS when required reports are absent', () => {
  const summary = summarizeConsumerStartupUnblock({
    hasSupportBundle: false,
    hasAuthReport: true,
  });

  assert.equal(summary.verdict, 'MISSING_INPUTS');
  assert.match(summary.blockers.join('\n'), /Missing support bundle report/);
});

test('summarizeConsumerStartupUnblock returns BLOCKED when failures and auth gaps remain', () => {
  const summary = summarizeConsumerStartupUnblock({
    hasSupportBundle: true,
    hasAuthReport: true,
    support: {
      startupFailureRuns: '12',
      jobsCount: '0',
      artifactsCount: '0',
      runUrls: [],
    },
    auth: {
      verdict: 'BLOCKED',
      missingScopes: 'user',
      billingError: 'needs user scope',
    },
    workflowLint: {
      findingsCount: 2,
      findings: ['a', 'b'],
      exitCode: 1,
    },
  });

  assert.equal(summary.verdict, 'BLOCKED');
  assert.equal(summary.startupFailureRuns, 12);
  assert.equal(summary.missingUserScope, true);
  assert.equal(summary.lintFindingsCount, 2);
});

test('summarizeConsumerStartupUnblock surfaces queued/no-jobs external blocker', () => {
  const summary = summarizeConsumerStartupUnblock({
    hasSupportBundle: true,
    hasAuthReport: true,
    support: {
      startupFailureRuns: '0',
      jobsCount: '0',
      artifactsCount: '0',
      runUrls: ['https://github.com/owner/repo/actions/runs/123'],
    },
    auth: {
      verdict: 'READY',
      missingScopes: '(none)',
    },
    workflowLint: {
      findingsCount: 0,
      findings: [],
      exitCode: 0,
    },
  });

  assert.equal(summary.verdict, 'BLOCKED');
  assert.match(
    summary.blockers.join('\n'),
    /stuck before job graph creation \(jobs=0, artifacts=0\)/
  );
});

test('summarizeConsumerStartupUnblock reports explicit startup stalled runs', () => {
  const summary = summarizeConsumerStartupUnblock({
    hasSupportBundle: true,
    hasAuthReport: true,
    support: {
      startupFailureRuns: '0',
      startupStalledRuns: '2',
      jobsCount: '0',
      artifactsCount: '0',
      runUrls: ['https://github.com/owner/repo/actions/runs/123'],
    },
    auth: {
      verdict: 'READY',
      missingScopes: '(none)',
    },
    workflowLint: {
      findingsCount: 0,
      findings: [],
      exitCode: 0,
    },
  });

  assert.equal(summary.verdict, 'BLOCKED');
  assert.match(summary.blockers.join('\n'), /Startup runs remain queued\/stalled \(2\)/);
  assert.equal(summary.startupStalledRuns, 2);
});

test('summarizeConsumerStartupUnblock returns READY_FOR_RETEST when blockers are cleared', () => {
  const summary = summarizeConsumerStartupUnblock({
    hasSupportBundle: true,
    hasAuthReport: true,
    support: {
      startupFailureRuns: '0',
      runUrls: [],
    },
    auth: {
      verdict: 'READY',
      missingScopes: '(none)',
    },
    workflowLint: {
      findingsCount: 0,
      findings: [],
      exitCode: 0,
    },
  });

  assert.equal(summary.verdict, 'READY_FOR_RETEST');
  assert.equal(summary.blockers.length, 0);
});

test('buildConsumerStartupUnblockStatus renders markdown with verdict and next actions', () => {
  const markdown = buildConsumerStartupUnblockStatus({
    repo: 'owner/repo',
    supportBundlePath: 'docs/validation/support.md',
    authReportPath: 'docs/validation/auth.md',
    workflowLintReportPath: 'docs/validation/lint.md',
    hasSupportBundle: true,
    hasAuthReport: true,
    hasWorkflowLintReport: true,
    summary: {
      verdict: 'BLOCKED',
      blockers: ['Startup failures still present (5)'],
      startupFailureRuns: 5,
      authVerdict: 'BLOCKED',
      missingUserScope: true,
      lintFindingsCount: 1,
    },
  });

  assert.match(markdown, /# Consumer Startup Failure Unblock Status/);
  assert.match(markdown, /- verdict: BLOCKED/);
  assert.match(markdown, /- startup_stalled_runs: unknown/);
  assert.match(markdown, /- missing_user_scope: yes/);
  assert.match(markdown, /workflow_lint_report: `docs\/validation\/lint\.md` \(found\)/);
});

test('buildConsumerStartupUnblockStatus marks missing workflow lint report as optional', () => {
  const markdown = buildConsumerStartupUnblockStatus({
    repo: 'owner/repo',
    supportBundlePath: 'docs/validation/support.md',
    authReportPath: 'docs/validation/auth.md',
    workflowLintReportPath: 'docs/validation/lint.md',
    hasSupportBundle: true,
    hasAuthReport: true,
    hasWorkflowLintReport: false,
    summary: {
      verdict: 'BLOCKED',
      blockers: ['Startup failures still present (1)'],
      startupFailureRuns: 1,
      startupStalledRuns: 3,
      authVerdict: 'READY',
      missingUserScope: false,
      lintFindingsCount: 0,
    },
  });

  assert.match(markdown, /workflow_lint_report: `docs\/validation\/lint\.md` \(missing, optional\)/);
  assert.match(markdown, /- startup_stalled_runs: 3/);
});
