import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAdapterReadinessMarkdown,
  parseWindsurfAdapterReport,
  summarizeAdapterReadiness,
} from '../adapter-readiness-lib';

test('parseWindsurfAdapterReport extracts PASS/FAIL and runtime-node signal', () => {
  const parsed = parseWindsurfAdapterReport(`
# Windsurf Hook Runtime - Real Session Report

- Validation result: FAIL
- Any \`bash: node: command not found\`: YES
`);

  assert.equal(parsed.validationResult, 'FAIL');
  assert.equal(parsed.nodeCommandNotFound, true);
});

test('summarizeAdapterReadiness returns PENDING when windsurf report is missing', () => {
  const summary = summarizeAdapterReadiness({
    hasWindsurfReport: false,
  });

  assert.equal(summary.verdict, 'PENDING');
  assert.match(summary.missingInputs.join('\n'), /Missing Windsurf adapter report/);
  assert.equal(summary.adapters[0]?.status, 'MISSING');
});

test('summarizeAdapterReadiness returns BLOCKED when windsurf report fails', () => {
  const summary = summarizeAdapterReadiness({
    hasWindsurfReport: true,
    windsurf: {
      validationResult: 'FAIL',
      nodeCommandNotFound: true,
    },
  });

  assert.equal(summary.verdict, 'BLOCKED');
  assert.match(summary.blockers.join('\n'), /Windsurf adapter validation is FAIL/);
  assert.equal(summary.adapters[0]?.status, 'FAIL');
});

test('summarizeAdapterReadiness returns READY when windsurf report passes', () => {
  const summary = summarizeAdapterReadiness({
    hasWindsurfReport: true,
    windsurf: {
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
    windsurfReportPath: 'docs/validation/windsurf-real-session-report.md',
    hasWindsurfReport: false,
    summary: {
      verdict: 'PENDING',
      adapters: [
        {
          name: 'windsurf',
          status: 'MISSING',
          notes: ['No Windsurf diagnostics report was provided.'],
        },
      ],
      blockers: [],
      missingInputs: ['Missing Windsurf adapter report'],
    },
  });

  assert.match(markdown, /# Adapter Readiness/);
  assert.match(markdown, /- verdict: PENDING/);
  assert.match(markdown, /- windsurf: MISSING/);
  assert.match(markdown, /Generate Windsurf report/);
});
