import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  buildAdapterReadinessCommandArgs,
  buildConsumerStartupTriageCommandArgs,
  buildPhase5BlockersReadinessCommandArgs,
  buildSkillsLockCheckCommandArgs,
  buildValidationDocsHygieneCommandArgs,
  buildMenuGateParams,
  buildWindsurfRealSessionReportCommandArgs,
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

test('builds deterministic command args for windsurf real-session report', () => {
  const args = buildWindsurfRealSessionReportCommandArgs({
    scriptPath: '/repo/scripts/build-windsurf-real-session-report.ts',
    statusReportFile: 'docs/validation/windsurf-session-status.md',
    outFile: 'docs/validation/windsurf-real-session-report.md',
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/build-windsurf-real-session-report.ts',
    '--status-report',
    'docs/validation/windsurf-session-status.md',
    '--out',
    'docs/validation/windsurf-real-session-report.md',
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
    windsurfReportFile: 'docs/validation/windsurf-real-session-report.md',
    consumerTriageReportFile: 'docs/validation/consumer-startup-triage-report.md',
    outFile: 'docs/validation/phase5-blockers-readiness.md',
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/build-phase5-blockers-readiness.ts',
    '--windsurf-report',
    'docs/validation/windsurf-real-session-report.md',
    '--consumer-triage-report',
    'docs/validation/consumer-startup-triage-report.md',
    '--out',
    'docs/validation/phase5-blockers-readiness.md',
  ]);
});

test('builds deterministic command args for adapter readiness report', () => {
  const args = buildAdapterReadinessCommandArgs({
    scriptPath: '/repo/scripts/build-adapter-readiness.ts',
    windsurfReportFile: 'docs/validation/windsurf-real-session-report.md',
    outFile: 'docs/validation/adapter-readiness.md',
  });

  assert.deepEqual(args, [
    '--yes',
    'tsx@4.21.0',
    '/repo/scripts/build-adapter-readiness.ts',
    '--windsurf-report',
    'docs/validation/windsurf-real-session-report.md',
    '--out',
    'docs/validation/adapter-readiness.md',
  ]);
});
