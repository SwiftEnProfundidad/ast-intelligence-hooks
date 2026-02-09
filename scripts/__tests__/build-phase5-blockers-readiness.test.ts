import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

const scriptPath = resolve(
  process.cwd(),
  'scripts/build-phase5-blockers-readiness.ts'
);

const runGenerator = (params: {
  cwd: string;
  adapterReportFile?: string;
  consumerTriageReportFile?: string;
  outFile?: string;
  requireAdapterReport?: boolean;
}): { status: number; stdout: string; stderr: string } => {
  const args = [
    '--yes',
    'tsx@4.21.0',
    scriptPath,
  ];

  if (params.adapterReportFile) {
    args.push('--adapter-report', params.adapterReportFile);
  }
  if (params.consumerTriageReportFile) {
    args.push('--consumer-triage-report', params.consumerTriageReportFile);
  }
  if (params.outFile) {
    args.push('--out', params.outFile);
  }
  if (params.requireAdapterReport) {
    args.push('--require-adapter-report');
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

test('build-phase5-blockers-readiness reports missing inputs with non-zero exit code', async () => {
  await withTempDir('pumuki-phase5-readiness-missing-', (tempRoot) => {
    const result = runGenerator({
      cwd: tempRoot,
      outFile: '.audit-reports/phase5/phase5-blockers-readiness.md',
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /verdict=MISSING_INPUTS/);

    const report = readFileSync(
      join(tempRoot, '.audit-reports/phase5/phase5-blockers-readiness.md'),
      'utf8'
    );
    assert.match(report, /- verdict: MISSING_INPUTS/);
    assert.match(report, /Missing consumer startup triage report/);
  });
});

test('build-phase5-blockers-readiness reports READY without adapter report by default', async () => {
  await withTempDir('pumuki-phase5-readiness-optional-adapter-', (tempRoot) => {
    const consumerTriageDir = join(tempRoot, '.audit-reports/consumer-triage');
    mkdirSync(consumerTriageDir, { recursive: true });

    writeFileSync(
      join(consumerTriageDir, 'consumer-startup-triage-report.md'),
      [
        '# Consumer Startup Triage Report',
        '',
        '- verdict: READY',
      ].join('\n'),
      'utf8'
    );

    const result = runGenerator({
      cwd: tempRoot,
      consumerTriageReportFile: '.audit-reports/consumer-triage/consumer-startup-triage-report.md',
      outFile: '.audit-reports/phase5/phase5-blockers-readiness.md',
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /verdict=READY/);

    const report = readFileSync(
      join(tempRoot, '.audit-reports/phase5/phase5-blockers-readiness.md'),
      'utf8'
    );
    assert.match(report, /- verdict: READY/);
    assert.match(report, /- adapter_required: NO/);
    assert.match(report, /Optional: generate Adapter report for adapter diagnostics traceability/);
  });
});

test('build-phase5-blockers-readiness reports MISSING_INPUTS when adapter report is explicitly required', async () => {
  await withTempDir('pumuki-phase5-readiness-required-adapter-', (tempRoot) => {
    const consumerTriageDir = join(tempRoot, '.audit-reports/consumer-triage');
    mkdirSync(consumerTriageDir, { recursive: true });

    writeFileSync(
      join(consumerTriageDir, 'consumer-startup-triage-report.md'),
      [
        '# Consumer Startup Triage Report',
        '',
        '- verdict: READY',
      ].join('\n'),
      'utf8'
    );

    const result = runGenerator({
      cwd: tempRoot,
      consumerTriageReportFile: '.audit-reports/consumer-triage/consumer-startup-triage-report.md',
      outFile: '.audit-reports/phase5/phase5-blockers-readiness.md',
      requireAdapterReport: true,
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /verdict=MISSING_INPUTS/);

    const report = readFileSync(
      join(tempRoot, '.audit-reports/phase5/phase5-blockers-readiness.md'),
      'utf8'
    );
    assert.match(report, /- verdict: MISSING_INPUTS/);
    assert.match(report, /- adapter_required: YES/);
    assert.match(report, /Missing Adapter real-session report/);
  });
});

test('build-phase5-blockers-readiness reports READY with zero exit code', async () => {
  await withTempDir('pumuki-phase5-readiness-ready-', (tempRoot) => {
    const adapterDir = join(tempRoot, '.audit-reports/adapter');
    const consumerTriageDir = join(tempRoot, '.audit-reports/consumer-triage');
    mkdirSync(adapterDir, { recursive: true });
    mkdirSync(consumerTriageDir, { recursive: true });

    writeFileSync(
      join(adapterDir, 'adapter-real-session-report.md'),
      [
        '# Adapter Hook Runtime - Real Session Report',
        '',
        '- Validation result: PASS',
        '- Re-test required: NO',
        '- Any `bash: node: command not found`: NO',
      ].join('\n'),
      'utf8'
    );

    writeFileSync(
      join(consumerTriageDir, 'consumer-startup-triage-report.md'),
      [
        '# Consumer Startup Triage Report',
        '',
        '- verdict: READY',
      ].join('\n'),
      'utf8'
    );

    const result = runGenerator({
      cwd: tempRoot,
      adapterReportFile: '.audit-reports/adapter/adapter-real-session-report.md',
      consumerTriageReportFile: '.audit-reports/consumer-triage/consumer-startup-triage-report.md',
      outFile: '.audit-reports/phase5/phase5-blockers-readiness.md',
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /verdict=READY/);

    const report = readFileSync(
      join(tempRoot, '.audit-reports/phase5/phase5-blockers-readiness.md'),
      'utf8'
    );
    assert.match(report, /- verdict: READY/);
    assert.match(report, /- adapter_required: NO/);
    assert.match(report, /- none/);
    assert.match(report, /Phase 5 blockers are clear for execution closure\./);
  });
});
