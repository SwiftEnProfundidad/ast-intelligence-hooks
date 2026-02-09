import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  buildAdapterReadinessCommandArgs,
  buildConsumerStartupTriageCommandArgs,
  buildMockConsumerAbReportCommandArgs,
  buildCleanValidationArtifactsCommandArgs,
  buildPhase5ExternalHandoffCommandArgs,
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
