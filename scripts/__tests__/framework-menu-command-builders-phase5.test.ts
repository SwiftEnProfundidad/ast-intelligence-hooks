import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCleanValidationArtifactsCommandArgs,
  buildPhase5ExecutionClosureCommandArgs,
} from '../framework-menu';

test('builds deterministic command args for phase5 execution closure without workflow lint', () => {
  const args = buildPhase5ExecutionClosureCommandArgs({
    scriptPath: '/repo/scripts/run-phase5-execution-closure.ts',
    repo: 'owner/repo',
    limit: 20,
    outDir: 'docs/validation',
    runWorkflowLint: false,
    includeAuthPreflight: true,
    includeAdapter: true,
    requireAdapterReadiness: false,
    useMockConsumerTriage: false,
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/run-phase5-execution-closure.ts',
    '--repo',
    'owner/repo',
    '--limit',
    '20',
    '--out-dir',
    'docs/validation',
    '--skip-workflow-lint',
  ]);
});

test('builds deterministic strict command args for phase5 execution closure', () => {
  const args = buildPhase5ExecutionClosureCommandArgs({
    scriptPath: '/repo/scripts/run-phase5-execution-closure.ts',
    repo: 'owner/repo',
    limit: 25,
    outDir: 'docs/validation',
    runWorkflowLint: true,
    includeAuthPreflight: true,
    repoPath: '/tmp/consumer',
    actionlintBin: '/tmp/actionlint',
    includeAdapter: true,
    requireAdapterReadiness: true,
    useMockConsumerTriage: false,
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/run-phase5-execution-closure.ts',
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
    '--require-adapter-readiness',
  ]);
});

test('builds deterministic command args for phase5 execution closure without adapter', () => {
  const args = buildPhase5ExecutionClosureCommandArgs({
    scriptPath: '/repo/scripts/run-phase5-execution-closure.ts',
    repo: 'owner/repo',
    limit: 10,
    outDir: 'docs/validation',
    runWorkflowLint: false,
    includeAuthPreflight: true,
    includeAdapter: false,
    requireAdapterReadiness: false,
    useMockConsumerTriage: false,
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/run-phase5-execution-closure.ts',
    '--repo',
    'owner/repo',
    '--limit',
    '10',
    '--out-dir',
    'docs/validation',
    '--skip-workflow-lint',
    '--skip-adapter',
  ]);
});

test('builds deterministic command args for phase5 execution closure without auth preflight', () => {
  const args = buildPhase5ExecutionClosureCommandArgs({
    scriptPath: '/repo/scripts/run-phase5-execution-closure.ts',
    repo: 'owner/repo',
    limit: 20,
    outDir: '.audit-reports/phase5',
    runWorkflowLint: false,
    includeAuthPreflight: false,
    includeAdapter: true,
    requireAdapterReadiness: false,
    useMockConsumerTriage: false,
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/run-phase5-execution-closure.ts',
    '--repo',
    'owner/repo',
    '--limit',
    '20',
    '--out-dir',
    '.audit-reports/phase5',
    '--skip-workflow-lint',
    '--skip-auth-preflight',
  ]);
});

test('builds deterministic command args for phase5 execution closure in mock-consumer mode', () => {
  const args = buildPhase5ExecutionClosureCommandArgs({
    scriptPath: '/repo/scripts/run-phase5-execution-closure.ts',
    repo: 'mock/consumer',
    limit: 20,
    outDir: '.audit-reports/phase5',
    runWorkflowLint: false,
    includeAuthPreflight: false,
    includeAdapter: false,
    requireAdapterReadiness: false,
    useMockConsumerTriage: true,
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/run-phase5-execution-closure.ts',
    '--repo',
    'mock/consumer',
    '--limit',
    '20',
    '--out-dir',
    '.audit-reports/phase5',
    '--skip-workflow-lint',
    '--skip-auth-preflight',
    '--skip-adapter',
    '--mock-consumer',
  ]);
});

test('builds deterministic command args for validation artifacts cleanup dry-run', () => {
  const args = buildCleanValidationArtifactsCommandArgs({
    scriptPath: '/repo/scripts/clean-validation-artifacts.ts',
    dryRun: true,
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/clean-validation-artifacts.ts',
    '--dry-run',
  ]);
});

test('builds deterministic command args for validation artifacts cleanup execution', () => {
  const args = buildCleanValidationArtifactsCommandArgs({
    scriptPath: '/repo/scripts/clean-validation-artifacts.ts',
    dryRun: false,
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/clean-validation-artifacts.ts',
  ]);
});
