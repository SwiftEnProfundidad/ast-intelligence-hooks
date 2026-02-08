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
  windsurfReportFile?: string;
  consumerTriageReportFile?: string;
  outFile?: string;
  requireWindsurfReport?: boolean;
}): { status: number; stdout: string; stderr: string } => {
  const args = [
    '--yes',
    'tsx@4.21.0',
    scriptPath,
  ];

  if (params.windsurfReportFile) {
    args.push('--windsurf-report', params.windsurfReportFile);
  }
  if (params.consumerTriageReportFile) {
    args.push('--consumer-triage-report', params.consumerTriageReportFile);
  }
  if (params.outFile) {
    args.push('--out', params.outFile);
  }
  if (params.requireWindsurfReport) {
    args.push('--require-windsurf-report');
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
    mkdirSync(join(tempRoot, 'docs/validation'), { recursive: true });

    const result = runGenerator({
      cwd: tempRoot,
      outFile: 'docs/validation/phase5-blockers-readiness.md',
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /verdict=MISSING_INPUTS/);

    const report = readFileSync(
      join(tempRoot, 'docs/validation/phase5-blockers-readiness.md'),
      'utf8'
    );
    assert.match(report, /- verdict: MISSING_INPUTS/);
    assert.match(report, /Missing consumer startup triage report/);
  });
});

test('build-phase5-blockers-readiness reports READY without windsurf report by default', async () => {
  await withTempDir('pumuki-phase5-readiness-optional-windsurf-', (tempRoot) => {
    const docsValidation = join(tempRoot, 'docs/validation');
    mkdirSync(docsValidation, { recursive: true });

    writeFileSync(
      join(docsValidation, 'consumer-startup-triage-report.md'),
      [
        '# Consumer Startup Triage Report',
        '',
        '- verdict: READY',
      ].join('\n'),
      'utf8'
    );

    const result = runGenerator({
      cwd: tempRoot,
      consumerTriageReportFile: 'docs/validation/consumer-startup-triage-report.md',
      outFile: 'docs/validation/phase5-blockers-readiness.md',
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /verdict=READY/);

    const report = readFileSync(
      join(docsValidation, 'phase5-blockers-readiness.md'),
      'utf8'
    );
    assert.match(report, /- verdict: READY/);
    assert.match(report, /- windsurf_required: NO/);
    assert.match(report, /Optional: generate Windsurf report for adapter diagnostics traceability/);
  });
});

test('build-phase5-blockers-readiness reports MISSING_INPUTS when windsurf report is explicitly required', async () => {
  await withTempDir('pumuki-phase5-readiness-required-windsurf-', (tempRoot) => {
    const docsValidation = join(tempRoot, 'docs/validation');
    mkdirSync(docsValidation, { recursive: true });

    writeFileSync(
      join(docsValidation, 'consumer-startup-triage-report.md'),
      [
        '# Consumer Startup Triage Report',
        '',
        '- verdict: READY',
      ].join('\n'),
      'utf8'
    );

    const result = runGenerator({
      cwd: tempRoot,
      consumerTriageReportFile: 'docs/validation/consumer-startup-triage-report.md',
      outFile: 'docs/validation/phase5-blockers-readiness.md',
      requireWindsurfReport: true,
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /verdict=MISSING_INPUTS/);

    const report = readFileSync(
      join(docsValidation, 'phase5-blockers-readiness.md'),
      'utf8'
    );
    assert.match(report, /- verdict: MISSING_INPUTS/);
    assert.match(report, /- windsurf_required: YES/);
    assert.match(report, /Missing Windsurf real-session report/);
  });
});

test('build-phase5-blockers-readiness reports READY with zero exit code', async () => {
  await withTempDir('pumuki-phase5-readiness-ready-', (tempRoot) => {
    const docsValidation = join(tempRoot, 'docs/validation');
    mkdirSync(docsValidation, { recursive: true });

    writeFileSync(
      join(docsValidation, 'windsurf-real-session-report.md'),
      [
        '# Windsurf Hook Runtime - Real Session Report',
        '',
        '- Validation result: PASS',
        '- Re-test required: NO',
        '- Any `bash: node: command not found`: NO',
      ].join('\n'),
      'utf8'
    );

    writeFileSync(
      join(docsValidation, 'consumer-startup-triage-report.md'),
      [
        '# Consumer Startup Triage Report',
        '',
        '- verdict: READY',
      ].join('\n'),
      'utf8'
    );

    const result = runGenerator({
      cwd: tempRoot,
      windsurfReportFile: 'docs/validation/windsurf-real-session-report.md',
      consumerTriageReportFile: 'docs/validation/consumer-startup-triage-report.md',
      outFile: 'docs/validation/phase5-blockers-readiness.md',
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /verdict=READY/);

    const report = readFileSync(
      join(docsValidation, 'phase5-blockers-readiness.md'),
      'utf8'
    );
    assert.match(report, /- verdict: READY/);
    assert.match(report, /- windsurf_required: NO/);
    assert.match(report, /- none/);
    assert.match(report, /Phase 5 blockers are clear for execution closure\./);
  });
});
