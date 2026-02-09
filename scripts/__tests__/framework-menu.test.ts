import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  buildAdapterReadinessCommandArgs,
  buildConsumerStartupTriageCommandArgs,
  buildCleanValidationArtifactsCommandArgs,
  buildPhase5BlockersReadinessCommandArgs,
  buildPhase5ExecutionClosureCommandArgs,
  buildPhase5ExecutionClosureStatusCommandArgs,
  buildSkillsLockCheckCommandArgs,
  buildValidationDocsHygieneCommandArgs,
  buildMenuGateParams,
  buildAdapterRealSessionReportCommandArgs,
  formatActiveSkillsBundles,
} from '../framework-menu';

test('returns guidance when no active skills bundles are available', () => {
  const rendered = formatActiveSkillsBundles([]);

  assert.equal(
    rendered,
    'No active skills bundles found. Run `npm run skills:compile` to generate skills.lock.json.'
  );
});

test('renders active skills bundles deterministically by name/version', () => {
  const rendered = formatActiveSkillsBundles([
    {
      name: 'ios-guidelines',
      version: '1.0.0',
      hash: 'b'.repeat(64),
    },
    {
      name: 'backend-guidelines',
      version: '1.2.0',
      hash: 'a'.repeat(64),
    },
  ]);

  assert.equal(
    rendered,
    [
      'Active skills bundles:',
      '- backend-guidelines@1.2.0 hash=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '- ios-guidelines@1.0.0 hash=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    ].join('\n')
  );
});

test('builds menu gate params using stage policy override from skills.policy.json', async () => {
  await withTempDir('pumuki-menu-policy-', async (tempRoot) => {
    writeFileSync(
      join(tempRoot, 'skills.policy.json'),
      JSON.stringify(
        {
          version: '1.0',
          defaultBundleEnabled: true,
          stages: {
            PRE_COMMIT: { blockOnOrAbove: 'CRITICAL', warnOnOrAbove: 'ERROR' },
            PRE_PUSH: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'ERROR' },
            CI: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
          },
          bundles: {},
        },
        null,
        2
      ),
      'utf8'
    );

    const params = buildMenuGateParams({
      stage: 'PRE_PUSH',
      scope: {
        kind: 'range',
        fromRef: 'origin/main',
        toRef: 'HEAD',
      },
      repoRoot: tempRoot,
    });

    assert.equal(params.policy.stage, 'PRE_PUSH');
    assert.equal(params.policy.blockOnOrAbove, 'ERROR');
    assert.equal(params.policy.warnOnOrAbove, 'ERROR');
    assert.equal(params.policyTrace.bundle, 'gate-policy.skills.policy.PRE_PUSH');
    assert.equal(params.scope.kind, 'range');
    assert.equal(params.scope.fromRef, 'origin/main');
    assert.equal(params.scope.toRef, 'HEAD');
  });
});

test('builds menu gate params with default policy trace when skills policy is missing', async () => {
  await withTempDir('pumuki-menu-policy-default-', async (tempRoot) => {
    const params = buildMenuGateParams({
      stage: 'CI',
      scope: { kind: 'staged' },
      repoRoot: tempRoot,
    });

    assert.equal(params.policy.stage, 'CI');
    assert.equal(params.policy.blockOnOrAbove, 'ERROR');
    assert.equal(params.policy.warnOnOrAbove, 'WARN');
    assert.equal(params.policyTrace.bundle, 'gate-policy.default.CI');
    assert.equal(params.scope.kind, 'staged');
  });
});

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

test('builds deterministic command args for validation docs hygiene check', () => {
  const args = buildValidationDocsHygieneCommandArgs({
    scriptPath: '/repo/scripts/check-validation-docs-hygiene.ts',
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/check-validation-docs-hygiene.ts',
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
