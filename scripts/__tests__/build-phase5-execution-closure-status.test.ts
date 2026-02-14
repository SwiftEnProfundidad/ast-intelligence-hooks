import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

const scriptPath = resolve(
  process.cwd(),
  'scripts/build-phase5-execution-closure-status.ts'
);

const runGenerator = (params: {
  cwd: string;
  phase5BlockersReportFile?: string;
  consumerUnblockReportFile?: string;
  adapterReadinessReportFile?: string;
  outFile?: string;
  requireAdapterReadiness?: boolean;
}): { status: number; stdout: string; stderr: string } => {
  const args = [
    '--yes',
    'tsx@4.21.0',
    scriptPath,
  ];

  if (params.phase5BlockersReportFile) {
    args.push('--phase5-blockers-report', params.phase5BlockersReportFile);
  }
  if (params.consumerUnblockReportFile) {
    args.push('--consumer-unblock-report', params.consumerUnblockReportFile);
  }
  if (params.adapterReadinessReportFile) {
    args.push('--adapter-readiness-report', params.adapterReadinessReportFile);
  }
  if (params.outFile) {
    args.push('--out', params.outFile);
  }
  if (params.requireAdapterReadiness) {
    args.push('--require-adapter-readiness');
  }

  try {
    const stdout = execFileSync('npx', args, {
      cwd: params.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    const cast = error as {
      status?: number;
      stdout?: string | Buffer;
      stderr?: string | Buffer;
    };
    const stdout =
      typeof cast.stdout === 'string'
        ? cast.stdout
        : cast.stdout?.toString('utf8') ?? '';
    const stderr =
      typeof cast.stderr === 'string'
        ? cast.stderr
        : cast.stderr?.toString('utf8') ?? '';
    return {
      status: Number.isFinite(cast.status) ? Number(cast.status) : 1,
      stdout,
      stderr,
    };
  }
};

test('build-phase5-execution-closure-status reports missing inputs by default', async () => {
  await withTempDir('pumuki-phase5-exec-closure-missing-', (tempRoot) => {
    const result = runGenerator({
      cwd: tempRoot,
      outFile: '.audit-reports/phase5/phase5-execution-closure-status.md',
      requireAdapterReadiness: true,
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /verdict=MISSING_INPUTS/);

    const report = readFileSync(
      join(tempRoot, '.audit-reports/phase5/phase5-execution-closure-status.md'),
      'utf8'
    );
    assert.match(report, /- verdict: MISSING_INPUTS/);
    assert.match(report, /Missing Phase 5 blockers readiness report/);
    assert.match(report, /Missing consumer startup unblock status report/);
    assert.match(report, /Missing adapter readiness report/);
  });
});

test('build-phase5-execution-closure-status reports READY when required inputs are clear', async () => {
  await withTempDir('pumuki-phase5-exec-closure-ready-', (tempRoot) => {
    const phase5Dir = join(tempRoot, '.audit-reports/phase5');
    const consumerTriageDir = join(tempRoot, '.audit-reports/consumer-triage');
    mkdirSync(phase5Dir, { recursive: true });
    mkdirSync(consumerTriageDir, { recursive: true });

    writeFileSync(
      join(phase5Dir, 'phase5-blockers-readiness.md'),
      ['# Phase 5 Blockers Readiness', '', '- verdict: READY'].join('\n'),
      'utf8'
    );
    writeFileSync(
      join(consumerTriageDir, 'consumer-startup-unblock-status.md'),
      ['# Consumer Startup Failure Unblock Status', '', '- verdict: READY_FOR_RETEST'].join('\n'),
      'utf8'
    );

    const result = runGenerator({
      cwd: tempRoot,
      phase5BlockersReportFile: '.audit-reports/phase5/phase5-blockers-readiness.md',
      consumerUnblockReportFile: '.audit-reports/consumer-triage/consumer-startup-unblock-status.md',
      outFile: '.audit-reports/phase5/phase5-execution-closure-status.md',
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /verdict=READY/);

    const report = readFileSync(
      join(phase5Dir, 'phase5-execution-closure-status.md'),
      'utf8'
    );
    assert.match(report, /- verdict: READY/);
    assert.match(report, /- phase5_blockers: READY/);
    assert.match(report, /- consumer_unblock: READY_FOR_RETEST/);
  });
});

test('build-phase5-execution-closure-status blocks when adapter readiness is required and not ready', async () => {
  await withTempDir('pumuki-phase5-exec-closure-strict-adapter-', (tempRoot) => {
    const phase5Dir = join(tempRoot, '.audit-reports/phase5');
    const consumerTriageDir = join(tempRoot, '.audit-reports/consumer-triage');
    const adapterDir = join(tempRoot, '.audit-reports/adapter');
    mkdirSync(phase5Dir, { recursive: true });
    mkdirSync(consumerTriageDir, { recursive: true });
    mkdirSync(adapterDir, { recursive: true });

    writeFileSync(
      join(phase5Dir, 'phase5-blockers-readiness.md'),
      ['# Phase 5 Blockers Readiness', '', '- verdict: READY'].join('\n'),
      'utf8'
    );
    writeFileSync(
      join(consumerTriageDir, 'consumer-startup-unblock-status.md'),
      ['# Consumer Startup Failure Unblock Status', '', '- verdict: READY_FOR_RETEST'].join('\n'),
      'utf8'
    );
    writeFileSync(
      join(adapterDir, 'adapter-readiness.md'),
      ['# Adapter Readiness', '', '- verdict: BLOCKED'].join('\n'),
      'utf8'
    );

    const result = runGenerator({
      cwd: tempRoot,
      phase5BlockersReportFile: '.audit-reports/phase5/phase5-blockers-readiness.md',
      consumerUnblockReportFile: '.audit-reports/consumer-triage/consumer-startup-unblock-status.md',
      adapterReadinessReportFile: '.audit-reports/adapter/adapter-readiness.md',
      outFile: '.audit-reports/phase5/phase5-execution-closure-status.md',
      requireAdapterReadiness: true,
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /verdict=BLOCKED/);

    const report = readFileSync(
      join(phase5Dir, 'phase5-execution-closure-status.md'),
      'utf8'
    );
    assert.match(report, /- verdict: BLOCKED/);
    assert.match(report, /Adapter readiness verdict is BLOCKED/);
  });
});
