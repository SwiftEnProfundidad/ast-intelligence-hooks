import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAdapterReadinessMarkdown,
  parseAdapterReport,
  summarizeAdapterReadiness,
} from '../adapter-readiness-lib';

test('parseAdapterReport extracts PASS/FAIL and runtime-node signal', () => {
  const parsed = parseAdapterReport(`
# Adapter Hook Runtime - Real Session Report

- Validation result: FAIL
- Any \`bash: node: command not found\`: YES
`);

  assert.equal(parsed.validationResult, 'FAIL');
  assert.equal(parsed.nodeCommandNotFound, true);
});

test('summarizeAdapterReadiness returns PENDING when adapter report is missing', () => {
  const summary = summarizeAdapterReadiness({
    hasAdapterReport: false,
  });

  assert.equal(summary.verdict, 'PENDING');
  assert.match(summary.missingInputs.join('\n'), /Missing Adapter adapter report/);
  assert.equal(summary.adapters[0]?.status, 'MISSING');
});

test('summarizeAdapterReadiness returns BLOCKED when adapter report fails', () => {
  const summary = summarizeAdapterReadiness({
    hasAdapterReport: true,
    adapter: {
      validationResult: 'FAIL',
      nodeCommandNotFound: true,
    },
  });

  assert.equal(summary.verdict, 'BLOCKED');
  assert.match(summary.blockers.join('\n'), /Adapter adapter validation is FAIL/);
  assert.equal(summary.adapters[0]?.status, 'FAIL');
});

test('summarizeAdapterReadiness returns READY when adapter report passes', () => {
  const summary = summarizeAdapterReadiness({
    hasAdapterReport: true,
    adapter: {
      validationResult: 'PASS',
      nodeCommandNotFound: false,
    },
  });

  assert.equal(summary.verdict, 'READY');
  assert.equal(summary.blockers.length, 0);
  assert.equal(summary.adapters[0]?.status, 'PASS');
});

test('buildAdapterReadinessMarkdown renders deterministic readiness sections', () => {
  const markdown = buildAdapterReadinessMarkdown({
    generatedAt: '2026-02-08T00:00:00.000Z',
    adapterReportPath: 'docs/validation/adapter-real-session-report.md',
    hasAdapterReport: false,
    summary: {
      verdict: 'PENDING',
      adapters: [
        {
          name: 'adapter',
          status: 'MISSING',
          notes: ['No Adapter diagnostics report was provided.'],
        },
      ],
      blockers: [],
      missingInputs: ['Missing Adapter adapter report'],
    },
  });

  assert.match(markdown, /# Adapter Readiness/);
  assert.match(markdown, /- verdict: PENDING/);
  assert.match(markdown, /- adapter: MISSING/);
  assert.match(markdown, /Generate Adapter report/);
});
