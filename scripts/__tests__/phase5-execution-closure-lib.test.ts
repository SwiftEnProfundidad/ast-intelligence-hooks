import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPhase5ExecutionClosureCommands,
  buildPhase5ExecutionClosureRunReportMarkdown,
  resolvePhase5ExecutionClosureOutputs,
} from '../phase5-execution-closure-lib';

test('resolvePhase5ExecutionClosureOutputs uses deterministic output names', () => {
  const outputs = resolvePhase5ExecutionClosureOutputs('docs/validation');
  assert.deepEqual(outputs, {
    adapterSessionStatus: 'docs/validation/adapter-session-status.md',
    adapterRealSessionReport: 'docs/validation/adapter-real-session-report.md',
    adapterReadiness: 'docs/validation/adapter-readiness.md',
    consumerStartupTriageReport: 'docs/validation/consumer-startup-triage-report.md',
    consumerStartupUnblockStatus: 'docs/validation/consumer-startup-unblock-status.md',
    phase5BlockersReadiness: 'docs/validation/phase5-blockers-readiness.md',
    phase5ExecutionClosureStatus: 'docs/validation/phase5-execution-closure-status.md',
    closureRunReport: 'docs/validation/phase5-execution-closure-run-report.md',
  });
});

test('buildPhase5ExecutionClosureCommands builds non-strict plan with adapter enabled', () => {
  const commands = buildPhase5ExecutionClosureCommands({
    repo: 'owner/repo',
    limit: 25,
    outDir: 'docs/validation',
    runWorkflowLint: false,
    includeAdapter: true,
    requireAdapterReadiness: false,
  });

  assert.deepEqual(
    commands.map((command) => command.id),
    [
      'adapter-session-status',
      'adapter-real-session-report',
      'adapter-readiness',
      'consumer-startup-triage',
      'phase5-blockers-readiness',
      'phase5-execution-closure-status',
    ]
  );
  assert.match(
    commands.find((command) => command.id === 'consumer-startup-triage')?.args.join(' ') ?? '',
    /--skip-workflow-lint/
  );
  assert.equal(
    commands.find((command) => command.id === 'phase5-blockers-readiness')?.args.includes(
      '--require-adapter-report'
    ),
    false
  );
});

test('buildPhase5ExecutionClosureCommands enforces strict adapter mode arguments', () => {
  const commands = buildPhase5ExecutionClosureCommands({
    repo: 'owner/repo',
    limit: 20,
    outDir: 'docs/validation',
    runWorkflowLint: true,
    repoPath: '/tmp/consumer',
    actionlintBin: '/tmp/actionlint',
    includeAdapter: true,
    requireAdapterReadiness: true,
  });

  const blockers = commands.find((command) => command.id === 'phase5-blockers-readiness');
  const closure = commands.find(
    (command) => command.id === 'phase5-execution-closure-status'
  );
  assert.ok(blockers);
  assert.ok(closure);
  assert.equal(blockers.required, true);
  assert.equal(closure.required, true);
  assert.equal(blockers.args.includes('--require-adapter-report'), true);
  assert.equal(closure.args.includes('--require-adapter-readiness'), true);
});

test('buildPhase5ExecutionClosureCommands rejects strict mode when adapter flow is skipped', () => {
  assert.throws(
    () =>
      buildPhase5ExecutionClosureCommands({
        repo: 'owner/repo',
        limit: 20,
        outDir: 'docs/validation',
        runWorkflowLint: false,
        includeAdapter: false,
        requireAdapterReadiness: true,
      }),
    /Cannot require adapter readiness/
  );
});

test('buildPhase5ExecutionClosureRunReportMarkdown renders deterministic run sections', () => {
  const commands = buildPhase5ExecutionClosureCommands({
    repo: 'owner/repo',
    limit: 20,
    outDir: 'docs/validation',
    runWorkflowLint: false,
    includeAdapter: true,
    requireAdapterReadiness: false,
  });

  const report = buildPhase5ExecutionClosureRunReportMarkdown({
    generatedAt: '2026-02-09T00:00:00.000Z',
    repo: 'owner/repo',
    options: {
      outDir: 'docs/validation',
      limit: 20,
      runWorkflowLint: false,
      includeAdapter: true,
      requireAdapterReadiness: false,
      repoPathProvided: false,
      actionlintBinProvided: false,
    },
    commands,
    executions: commands.map((command) => ({
      command,
      exitCode: 0,
      ok: true,
    })),
  });

  assert.match(report, /# Phase 5 Execution Closure Run Report/);
  assert.match(report, /- verdict: READY/);
  assert.match(report, /consumer-startup-triage/);
  assert.match(report, /phase5-execution-closure-status/);
});
