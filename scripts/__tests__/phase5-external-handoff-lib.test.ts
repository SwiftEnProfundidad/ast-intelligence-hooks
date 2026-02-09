import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPhase5ExternalHandoffMarkdown,
  summarizePhase5ExternalHandoff,
} from '../phase5-external-handoff-lib';

test('summarizePhase5ExternalHandoff returns READY when core reports and artifacts are ready', () => {
  const summary = summarizePhase5ExternalHandoff({
    hasPhase5StatusReport: true,
    hasPhase5BlockersReport: true,
    hasConsumerUnblockReport: true,
    hasMockAbReport: true,
    hasRunReport: true,
    phase5StatusVerdict: 'READY',
    phase5BlockersVerdict: 'READY',
    consumerUnblockVerdict: 'READY_FOR_RETEST',
    mockAbVerdict: 'READY',
    runReportVerdict: 'READY',
    artifactUrls: [
      'https://github.com/org/repo/actions/runs/123/artifacts/1',
    ],
    requireArtifactUrls: true,
    requireMockAbReport: true,
  });

  assert.equal(summary.verdict, 'READY');
  assert.equal(summary.missingInputs.length, 0);
  assert.equal(summary.blockers.length, 0);
  assert.equal(summary.warnings.length, 0);
});

test('summarizePhase5ExternalHandoff returns MISSING_INPUTS when required reports are absent', () => {
  const summary = summarizePhase5ExternalHandoff({
    hasPhase5StatusReport: false,
    hasPhase5BlockersReport: true,
    hasConsumerUnblockReport: false,
    hasMockAbReport: false,
    hasRunReport: false,
    artifactUrls: [],
    requireArtifactUrls: false,
    requireMockAbReport: true,
  });

  assert.equal(summary.verdict, 'MISSING_INPUTS');
  assert.deepEqual(summary.missingInputs, [
    'Missing Phase 5 execution closure status report',
    'Missing consumer startup unblock status report',
    'Missing mock consumer A/B report',
  ]);
});

test('summarizePhase5ExternalHandoff returns BLOCKED for non-ready verdicts and missing required artifacts', () => {
  const summary = summarizePhase5ExternalHandoff({
    hasPhase5StatusReport: true,
    hasPhase5BlockersReport: true,
    hasConsumerUnblockReport: true,
    hasMockAbReport: true,
    hasRunReport: true,
    phase5StatusVerdict: 'BLOCKED',
    phase5BlockersVerdict: 'READY',
    consumerUnblockVerdict: 'READY_FOR_RETEST',
    mockAbVerdict: 'READY',
    runReportVerdict: 'READY',
    artifactUrls: [],
    requireArtifactUrls: true,
    requireMockAbReport: true,
  });

  assert.equal(summary.verdict, 'BLOCKED');
  assert.match(
    summary.blockers.join('\n'),
    /Phase 5 execution closure status verdict is BLOCKED/
  );
  assert.match(summary.blockers.join('\n'), /No artifact URLs were provided/);
});

test('buildPhase5ExternalHandoffMarkdown renders deterministic sections', () => {
  const summary = summarizePhase5ExternalHandoff({
    hasPhase5StatusReport: true,
    hasPhase5BlockersReport: true,
    hasConsumerUnblockReport: true,
    hasMockAbReport: true,
    hasRunReport: true,
    phase5StatusVerdict: 'READY',
    phase5BlockersVerdict: 'READY',
    consumerUnblockVerdict: 'READY_FOR_RETEST',
    mockAbVerdict: 'READY',
    runReportVerdict: 'READY',
    artifactUrls: [
      'https://github.com/org/repo/actions/runs/123/artifacts/1',
    ],
    requireArtifactUrls: true,
    requireMockAbReport: true,
  });

  const markdown = buildPhase5ExternalHandoffMarkdown({
    generatedAt: '2026-02-09T00:00:00.000Z',
    repo: 'owner/repo',
    phase5StatusReportPath: '.audit-reports/phase5/phase5-execution-closure-status.md',
    phase5BlockersReportPath: '.audit-reports/phase5/phase5-blockers-readiness.md',
    consumerUnblockReportPath: '.audit-reports/phase5/consumer-startup-unblock-status.md',
    mockAbReportPath: '.audit-reports/phase5/mock-consumer-ab-report.md',
    runReportPath: '.audit-reports/phase5/phase5-execution-closure-run-report.md',
    hasPhase5StatusReport: true,
    hasPhase5BlockersReport: true,
    hasConsumerUnblockReport: true,
    hasMockAbReport: true,
    hasRunReport: true,
    summary,
  });

  assert.match(markdown, /# Phase 5 External Handoff Report/);
  assert.match(markdown, /- verdict: READY/);
  assert.match(markdown, /## Artifact URLs/);
  assert.match(markdown, /https:\/\/github\.com\/org\/repo\/actions\/runs\/123\/artifacts\/1/);
});
