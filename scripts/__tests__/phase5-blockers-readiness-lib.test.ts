import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPhase5BlockersReadinessMarkdown,
  parseConsumerStartupTriageReport,
  parseAdapterRealSessionReport,
  summarizePhase5Blockers,
} from '../phase5-blockers-readiness-lib';

test('parseAdapterRealSessionReport extracts validation result and node runtime failures', () => {
  const parsed = parseAdapterRealSessionReport(`
# Adapter Hook Runtime - Real Session Report

- Validation result: FAIL
- Re-test required: YES
- Any \`bash: node: command not found\`: YES
`);

  assert.equal(parsed.validationResult, 'FAIL');
  assert.equal(parsed.reTestRequired, true);
  assert.equal(parsed.nodeCommandNotFound, true);
});

test('parseAdapterRealSessionReport respects explicit NO runtime-node signal', () => {
  const parsed = parseAdapterRealSessionReport(`
# Adapter Hook Runtime - Real Session Report

- Validation result: PASS
- Re-test required: NO
- Any \`bash: node: command not found\`: NO
`);

  assert.equal(parsed.validationResult, 'PASS');
  assert.equal(parsed.reTestRequired, false);
  assert.equal(parsed.nodeCommandNotFound, false);
});

test('parseConsumerStartupTriageReport extracts verdict and failed required steps', () => {
  const parsed = parseConsumerStartupTriageReport(`
# Consumer Startup Triage Report

- verdict: BLOCKED

## Next Actions

- Resolve failed required step \`auth-check\` and rerun startup triage.
- Resolve failed required step \`support-bundle\` and rerun startup triage.
`);

  assert.equal(parsed.verdict, 'BLOCKED');
  assert.deepEqual(parsed.requiredFailedSteps, ['auth-check', 'support-bundle']);
});

test('summarizePhase5Blockers returns READY when both blockers are clear', () => {
  const summary = summarizePhase5Blockers({
    hasAdapterReport: true,
    hasConsumerTriageReport: true,
    adapter: {
      validationResult: 'PASS',
      reTestRequired: false,
      nodeCommandNotFound: false,
    },
    consumer: {
      verdict: 'READY',
      requiredFailedSteps: [],
    },
  });

  assert.equal(summary.verdict, 'READY');
  assert.equal(summary.blockers.length, 0);
  assert.equal(summary.adapterRequired, false);
});

test('summarizePhase5Blockers returns READY when adapter report is missing by default', () => {
  const summary = summarizePhase5Blockers({
    hasAdapterReport: false,
    hasConsumerTriageReport: true,
    consumer: {
      verdict: 'READY',
      requiredFailedSteps: [],
    },
  });

  assert.equal(summary.verdict, 'READY');
  assert.deepEqual(summary.missingInputs, []);
  assert.equal(summary.adapterRequired, false);
});

test('summarizePhase5Blockers returns MISSING_INPUTS when adapter report is explicitly required', () => {
  const summary = summarizePhase5Blockers({
    hasAdapterReport: false,
    hasConsumerTriageReport: true,
    consumer: {
      verdict: 'READY',
      requiredFailedSteps: [],
    },
    requireAdapterReport: true,
  });

  assert.equal(summary.verdict, 'MISSING_INPUTS');
  assert.match(summary.blockers.join('\n'), /Missing Adapter real-session report/);
  assert.equal(summary.adapterRequired, true);
});

test('summarizePhase5Blockers returns BLOCKED when adapter or consumer blockers remain', () => {
  const summary = summarizePhase5Blockers({
    hasAdapterReport: true,
    hasConsumerTriageReport: true,
    adapter: {
      validationResult: 'FAIL',
      reTestRequired: true,
      nodeCommandNotFound: true,
    },
    consumer: {
      verdict: 'BLOCKED',
      requiredFailedSteps: ['auth-check'],
    },
  });

  assert.equal(summary.verdict, 'BLOCKED');
  assert.match(summary.blockers.join('\n'), /Adapter real-session validation is FAIL/);
  assert.match(summary.blockers.join('\n'), /Consumer triage required step failed: auth-check/);
});

test('buildPhase5BlockersReadinessMarkdown renders verdict and next actions', () => {
  const markdown = buildPhase5BlockersReadinessMarkdown({
    generatedAt: '2026-02-08T00:00:00.000Z',
    adapterReportPath: 'docs/validation/adapter-real-session-report.md',
    consumerTriageReportPath: 'docs/validation/consumer-startup-triage-report.md',
    hasAdapterReport: true,
    hasConsumerTriageReport: true,
    summary: {
      verdict: 'BLOCKED',
      blockers: ['Consumer startup triage verdict is BLOCKED'],
      adapterValidationResult: 'PASS',
      consumerTriageVerdict: 'BLOCKED',
      adapterRequired: false,
      missingInputs: [],
    },
    requireAdapterReport: false,
  });

  assert.match(markdown, /# Phase 5 Blockers Readiness/);
  assert.match(markdown, /- verdict: BLOCKED/);
  assert.match(markdown, /- adapter_required: NO/);
  assert.match(markdown, /- consumer_triage_verdict: BLOCKED/);
  assert.match(markdown, /Resolve failed consumer triage steps and rerun `validation:consumer-startup-triage`/);
});
