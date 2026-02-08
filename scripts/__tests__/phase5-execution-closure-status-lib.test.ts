import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPhase5ExecutionClosureStatusMarkdown,
  parseVerdictFromMarkdown,
  summarizePhase5ExecutionClosure,
} from '../phase5-execution-closure-status-lib';

test('parseVerdictFromMarkdown extracts verdict marker', () => {
  const verdict = parseVerdictFromMarkdown(
    ['# Report', '', '- verdict: READY_FOR_RETEST'].join('\n')
  );

  assert.equal(verdict, 'READY_FOR_RETEST');
});

test('summarizePhase5ExecutionClosure returns READY when closure signals are clear', () => {
  const summary = summarizePhase5ExecutionClosure({
    hasPhase5BlockersReport: true,
    hasConsumerUnblockReport: true,
    hasAdapterReadinessReport: false,
    phase5BlockersVerdict: 'READY',
    consumerUnblockVerdict: 'READY_FOR_RETEST',
    adapterReadinessVerdict: undefined,
    requireAdapterReadiness: false,
  });

  assert.equal(summary.verdict, 'READY');
  assert.deepEqual(summary.blockers, []);
  assert.deepEqual(summary.missingInputs, []);
});

test('summarizePhase5ExecutionClosure returns BLOCKED for non-ready consumer signal', () => {
  const summary = summarizePhase5ExecutionClosure({
    hasPhase5BlockersReport: true,
    hasConsumerUnblockReport: true,
    hasAdapterReadinessReport: true,
    phase5BlockersVerdict: 'READY',
    consumerUnblockVerdict: 'BLOCKED',
    adapterReadinessVerdict: 'READY',
    requireAdapterReadiness: true,
  });

  assert.equal(summary.verdict, 'BLOCKED');
  assert.match(summary.blockers.join('\n'), /Consumer startup unblock verdict is BLOCKED/);
});

test('buildPhase5ExecutionClosureStatusMarkdown renders deterministic sections', () => {
  const summary = summarizePhase5ExecutionClosure({
    hasPhase5BlockersReport: false,
    hasConsumerUnblockReport: false,
    hasAdapterReadinessReport: false,
    phase5BlockersVerdict: undefined,
    consumerUnblockVerdict: undefined,
    adapterReadinessVerdict: undefined,
    requireAdapterReadiness: true,
  });

  const markdown = buildPhase5ExecutionClosureStatusMarkdown({
    generatedAt: '2026-02-08T00:00:00.000Z',
    phase5BlockersReportPath: 'docs/validation/phase5-blockers-readiness.md',
    consumerUnblockReportPath: 'docs/validation/consumer-startup-unblock-status.md',
    adapterReadinessReportPath: 'docs/validation/adapter-readiness.md',
    hasPhase5BlockersReport: false,
    hasConsumerUnblockReport: false,
    hasAdapterReadinessReport: false,
    summary,
  });

  assert.match(markdown, /# Phase 5 Execution Closure Status/);
  assert.match(markdown, /- verdict: MISSING_INPUTS/);
  assert.match(markdown, /Missing Phase 5 blockers readiness report/);
  assert.match(markdown, /Missing consumer startup unblock status report/);
  assert.match(markdown, /Missing adapter readiness report/);
});
