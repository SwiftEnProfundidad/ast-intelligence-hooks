import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAdapterRealSessionReportCommandArgs,
  buildAdapterReadinessCommandArgs,
  buildConsumerStartupTriageCommandArgs,
  buildMockConsumerAbReportCommandArgs,
  buildPhase5BlockersReadinessCommandArgs,
  buildPhase5ExternalHandoffCommandArgs,
  buildPhase5ExecutionClosureStatusCommandArgs,
  buildSkillsLockCheckCommandArgs,
} from '../framework-menu';

test('builds deterministic command args for adapter real-session report', () => {
  const args = buildAdapterRealSessionReportCommandArgs({
    scriptPath: '/repo/scripts/build-adapter-real-session-report.ts',
    statusReportFile: '.audit-reports/adapter/adapter-session-status.md',
    outFile: '.audit-reports/adapter/adapter-real-session-report.md',
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/build-adapter-real-session-report.ts',
    '--status-report',
    '.audit-reports/adapter/adapter-session-status.md',
    '--out',
    '.audit-reports/adapter/adapter-real-session-report.md',
  ]);
});

test('builds deterministic command args for skills lock freshness check', () => {
  const args = buildSkillsLockCheckCommandArgs();

  assert.deepEqual(args, [
    'run',
    'skills:lock:check',
  ]);
});

test('builds deterministic command args for consumer startup triage without workflow lint', () => {
  const args = buildConsumerStartupTriageCommandArgs({
    scriptPath: '/repo/scripts/build-consumer-startup-triage.ts',
    repo: 'owner/repo',
    limit: 20,
    outDir: 'docs/validation',
    runWorkflowLint: false,
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/build-consumer-startup-triage.ts',
    '--repo',
    'owner/repo',
    '--limit',
    '20',
    '--out-dir',
    'docs/validation',
    '--skip-workflow-lint',
  ]);
});

test('builds deterministic command args for consumer startup triage with workflow lint', () => {
  const args = buildConsumerStartupTriageCommandArgs({
    scriptPath: '/repo/scripts/build-consumer-startup-triage.ts',
    repo: 'owner/repo',
    limit: 25,
    outDir: 'docs/validation',
    runWorkflowLint: true,
    repoPath: '/tmp/consumer',
    actionlintBin: '/tmp/actionlint',
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/build-consumer-startup-triage.ts',
    '--repo',
    'owner/repo',
    '--limit',
    '25',
    '--out-dir',
    'docs/validation',
    '--repo-path',
    '/tmp/consumer',
    '--actionlint-bin',
    '/tmp/actionlint',
  ]);
});

test('builds deterministic command args for mock consumer A/B report', () => {
  const args = buildMockConsumerAbReportCommandArgs({
    scriptPath: '/repo/scripts/build-mock-consumer-ab-report.ts',
    repo: 'mock/consumer',
    outFile: '.audit-reports/mock-consumer/mock-consumer-ab-report.md',
    blockSummaryFile: '.audit-reports/package-smoke/block/summary.md',
    minimalSummaryFile: '.audit-reports/package-smoke/minimal/summary.md',
    blockEvidenceFile: '.audit-reports/package-smoke/block/ci.ai_evidence.json',
    minimalEvidenceFile: '.audit-reports/package-smoke/minimal/ci.ai_evidence.json',
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/build-mock-consumer-ab-report.ts',
    '--repo',
    'mock/consumer',
    '--out',
    '.audit-reports/mock-consumer/mock-consumer-ab-report.md',
    '--block-summary',
    '.audit-reports/package-smoke/block/summary.md',
    '--minimal-summary',
    '.audit-reports/package-smoke/minimal/summary.md',
    '--block-evidence',
    '.audit-reports/package-smoke/block/ci.ai_evidence.json',
    '--minimal-evidence',
    '.audit-reports/package-smoke/minimal/ci.ai_evidence.json',
  ]);
});

test('builds deterministic command args for phase5 blockers readiness report', () => {
  const args = buildPhase5BlockersReadinessCommandArgs({
    scriptPath: '/repo/scripts/build-phase5-blockers-readiness.ts',
    adapterReportFile: '.audit-reports/adapter/adapter-real-session-report.md',
    consumerTriageReportFile: '.audit-reports/consumer-triage/consumer-startup-triage-report.md',
    outFile: '.audit-reports/phase5/phase5-blockers-readiness.md',
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/build-phase5-blockers-readiness.ts',
    '--adapter-report',
    '.audit-reports/adapter/adapter-real-session-report.md',
    '--consumer-triage-report',
    '.audit-reports/consumer-triage/consumer-startup-triage-report.md',
    '--out',
    '.audit-reports/phase5/phase5-blockers-readiness.md',
  ]);
});

test('builds deterministic command args for adapter readiness report', () => {
  const args = buildAdapterReadinessCommandArgs({
    scriptPath: '/repo/scripts/build-adapter-readiness.ts',
    adapterReportFile: '.audit-reports/adapter/adapter-real-session-report.md',
    outFile: '.audit-reports/adapter/adapter-readiness.md',
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/build-adapter-readiness.ts',
    '--adapter-report',
    '.audit-reports/adapter/adapter-real-session-report.md',
    '--out',
    '.audit-reports/adapter/adapter-readiness.md',
  ]);
});

test('builds deterministic command args for phase5 execution closure status report', () => {
  const args = buildPhase5ExecutionClosureStatusCommandArgs({
    scriptPath: '/repo/scripts/build-phase5-execution-closure-status.ts',
    phase5BlockersReportFile: '.audit-reports/phase5/phase5-blockers-readiness.md',
    consumerUnblockReportFile: '.audit-reports/consumer-triage/consumer-startup-unblock-status.md',
    adapterReadinessReportFile: '.audit-reports/adapter/adapter-readiness.md',
    outFile: '.audit-reports/phase5/phase5-execution-closure-status.md',
    requireAdapterReadiness: false,
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/build-phase5-execution-closure-status.ts',
    '--phase5-blockers-report',
    '.audit-reports/phase5/phase5-blockers-readiness.md',
    '--consumer-unblock-report',
    '.audit-reports/consumer-triage/consumer-startup-unblock-status.md',
    '--adapter-readiness-report',
    '.audit-reports/adapter/adapter-readiness.md',
    '--out',
    '.audit-reports/phase5/phase5-execution-closure-status.md',
  ]);
});

test('builds deterministic strict command args for phase5 execution closure status report', () => {
  const args = buildPhase5ExecutionClosureStatusCommandArgs({
    scriptPath: '/repo/scripts/build-phase5-execution-closure-status.ts',
    phase5BlockersReportFile: '.audit-reports/phase5/phase5-blockers-readiness.md',
    consumerUnblockReportFile: '.audit-reports/consumer-triage/consumer-startup-unblock-status.md',
    adapterReadinessReportFile: '.audit-reports/adapter/adapter-readiness.md',
    outFile: '.audit-reports/phase5/phase5-execution-closure-status.md',
    requireAdapterReadiness: true,
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/build-phase5-execution-closure-status.ts',
    '--phase5-blockers-report',
    '.audit-reports/phase5/phase5-blockers-readiness.md',
    '--consumer-unblock-report',
    '.audit-reports/consumer-triage/consumer-startup-unblock-status.md',
    '--adapter-readiness-report',
    '.audit-reports/adapter/adapter-readiness.md',
    '--out',
    '.audit-reports/phase5/phase5-execution-closure-status.md',
    '--require-adapter-readiness',
  ]);
});

test('builds deterministic command args for phase5 external handoff report', () => {
  const args = buildPhase5ExternalHandoffCommandArgs({
    scriptPath: '/repo/scripts/build-phase5-external-handoff.ts',
    repo: 'owner/repo',
    phase5StatusReportFile: '.audit-reports/phase5/phase5-execution-closure-status.md',
    phase5BlockersReportFile: '.audit-reports/phase5/phase5-blockers-readiness.md',
    consumerUnblockReportFile: '.audit-reports/phase5/consumer-startup-unblock-status.md',
    mockAbReportFile: '.audit-reports/phase5/mock-consumer-ab-report.md',
    runReportFile: '.audit-reports/phase5/phase5-execution-closure-run-report.md',
    outFile: '.audit-reports/phase5/phase5-external-handoff.md',
    artifactUrls: [
      'https://github.com/org/repo/actions/runs/123',
      'https://github.com/org/repo/actions/runs/456',
    ],
    requireArtifactUrls: true,
    requireMockAbReport: true,
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/build-phase5-external-handoff.ts',
    '--repo',
    'owner/repo',
    '--phase5-status-report',
    '.audit-reports/phase5/phase5-execution-closure-status.md',
    '--phase5-blockers-report',
    '.audit-reports/phase5/phase5-blockers-readiness.md',
    '--consumer-unblock-report',
    '.audit-reports/phase5/consumer-startup-unblock-status.md',
    '--mock-ab-report',
    '.audit-reports/phase5/mock-consumer-ab-report.md',
    '--run-report',
    '.audit-reports/phase5/phase5-execution-closure-run-report.md',
    '--out',
    '.audit-reports/phase5/phase5-external-handoff.md',
    '--artifact-url',
    'https://github.com/org/repo/actions/runs/123',
    '--artifact-url',
    'https://github.com/org/repo/actions/runs/456',
    '--require-artifact-urls',
    '--require-mock-ab-report',
  ]);
});
