import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPhase5ExecutionClosureCommands,
  buildPhase5ExecutionClosureRunReportMarkdown,
  resolvePhase5ExecutionClosureOutputs,
} from '../phase5-execution-closure-lib';

test('resolvePhase5ExecutionClosureOutputs uses deterministic output names', () => {
  const outputs = resolvePhase5ExecutionClosureOutputs('.audit-reports/phase5');
  assert.deepEqual(outputs, {
    adapterSessionStatus: '.audit-reports/phase5/adapter-session-status.md',
    adapterRealSessionReport: '.audit-reports/phase5/adapter-real-session-report.md',
    adapterReadiness: '.audit-reports/phase5/adapter-readiness.md',
    consumerCiAuthCheck: '.audit-reports/phase5/consumer-ci-auth-check.md',
    mockConsumerAbReport: '.audit-reports/phase5/mock-consumer-ab-report.md',
    consumerStartupTriageReport: '.audit-reports/phase5/consumer-startup-triage-report.md',
    consumerStartupUnblockStatus: '.audit-reports/phase5/consumer-startup-unblock-status.md',
    phase5BlockersReadiness: '.audit-reports/phase5/phase5-blockers-readiness.md',
    phase5ExecutionClosureStatus: '.audit-reports/phase5/phase5-execution-closure-status.md',
    closureRunReport: '.audit-reports/phase5/phase5-execution-closure-run-report.md',
  });
});

test('buildPhase5ExecutionClosureCommands builds non-strict plan with adapter enabled', () => {
  const commands = buildPhase5ExecutionClosureCommands({
    repo: 'owner/repo',
    limit: 25,
    outDir: 'docs/validation',
    runWorkflowLint: false,
    includeAuthPreflight: true,
    includeAdapter: true,
    requireAdapterReadiness: false,
  });

  assert.deepEqual(
    commands.map((command) => command.id),
    [
      'adapter-session-status',
      'adapter-real-session-report',
      'adapter-readiness',
      'consumer-auth-preflight',
      'consumer-startup-triage',
      'phase5-blockers-readiness',
      'phase5-execution-closure-status',
    ]
  );
  assert.match(
    commands.find((command) => command.id === 'consumer-startup-triage')?.args.join(' ') ?? '',
    /--skip-workflow-lint/
  );
  assert.match(
    commands.find((command) => command.id === 'consumer-startup-triage')?.args.join(' ') ?? '',
    /--skip-auth-check/
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
    includeAuthPreflight: true,
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
        includeAuthPreflight: true,
        includeAdapter: false,
        requireAdapterReadiness: true,
      }),
    /Cannot require adapter readiness/
  );
});

test('buildPhase5ExecutionClosureCommands can skip auth preflight and keep triage auth check', () => {
  const commands = buildPhase5ExecutionClosureCommands({
    repo: 'owner/repo',
    limit: 20,
    outDir: 'docs/validation',
    runWorkflowLint: false,
    includeAuthPreflight: false,
    includeAdapter: false,
    requireAdapterReadiness: false,
  });

  assert.equal(
    commands.some((command) => command.id === 'consumer-auth-preflight'),
    false
  );
  assert.doesNotMatch(
    commands.find((command) => command.id === 'consumer-startup-triage')?.args.join(' ') ?? '',
    /--skip-auth-check/
  );
});

test('buildPhase5ExecutionClosureCommands supports mock consumer triage without external GH preflight', () => {
  const commands = buildPhase5ExecutionClosureCommands({
    repo: 'owner/repo',
    limit: 20,
    outDir: 'docs/validation',
    runWorkflowLint: true,
    includeAuthPreflight: true,
    includeAdapter: false,
    requireAdapterReadiness: false,
    useMockConsumerTriage: true,
  });

  assert.equal(
    commands.some((command) => command.id === 'consumer-auth-preflight'),
    false
  );
  const triage = commands.find((command) => command.id === 'consumer-startup-triage');
  const abReport = commands.find((command) => command.id === 'mock-consumer-ab-report');
  assert.ok(abReport);
  assert.equal(abReport.script, 'scripts/build-mock-consumer-ab-report.ts');
  assert.match(abReport.args.join(' '), /--block-summary/);
  assert.match(abReport.args.join(' '), /--minimal-summary/);
  assert.match(abReport.args.join(' '), /--block-evidence/);
  assert.match(abReport.args.join(' '), /--minimal-evidence/);
  assert.ok(triage);
  assert.equal(triage.script, 'scripts/build-mock-consumer-startup-triage.ts');
  assert.doesNotMatch(triage.args.join(' '), /--repo-path|--actionlint-bin|--skip-auth-check/);
});

test('buildPhase5ExecutionClosureRunReportMarkdown renders deterministic run sections', () => {
  const commands = buildPhase5ExecutionClosureCommands({
    repo: 'owner/repo',
    limit: 20,
    outDir: 'docs/validation',
    runWorkflowLint: false,
    includeAuthPreflight: true,
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
      includeAuthPreflight: true,
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
  assert.match(report, /include_auth_preflight: YES/);
  assert.match(report, /consumer-auth-preflight/);
  assert.match(report, /consumer-startup-triage/);
  assert.match(report, /phase5-execution-closure-status/);
});
