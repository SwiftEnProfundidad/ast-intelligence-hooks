import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

const scriptPath = resolve(
  process.cwd(),
  'scripts/build-mock-consumer-startup-triage.ts'
);

const runGenerator = (params: {
  cwd: string;
  outDir?: string;
  repo?: string;
  blockSummaryFile?: string;
  minimalSummaryFile?: string;
}): { status: number; stdout: string; stderr: string } => {
  const args = ['--yes', 'tsx@4.21.0', scriptPath];

  if (params.repo) {
    args.push('--repo', params.repo);
  }
  if (params.outDir) {
    args.push('--out-dir', params.outDir);
  }
  if (params.blockSummaryFile) {
    args.push('--block-summary', params.blockSummaryFile);
  }
  if (params.minimalSummaryFile) {
    args.push('--minimal-summary', params.minimalSummaryFile);
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
    return {
      status: Number.isFinite(cast.status) ? Number(cast.status) : 1,
      stdout:
        typeof cast.stdout === 'string'
          ? cast.stdout
          : cast.stdout?.toString('utf8') ?? '',
      stderr:
        typeof cast.stderr === 'string'
          ? cast.stderr
          : cast.stderr?.toString('utf8') ?? '',
    };
  }
};

test('build-mock-consumer-startup-triage returns READY when block/minimal smoke summaries are healthy', async () => {
  await withTempDir('pumuki-mock-triage-ready-', (tempRoot) => {
    const smokeRoot = join(tempRoot, '.audit-reports', 'package-smoke');
    mkdirSync(join(smokeRoot, 'block'), { recursive: true });
    mkdirSync(join(smokeRoot, 'minimal'), { recursive: true });

    writeFileSync(
      join(smokeRoot, 'block', 'summary.md'),
      [
        '# Package Install Smoke Report',
        '',
        '- Smoke mode: `block`',
        '- Status: PASS',
        '- pre-commit exit: `1` (BLOCK)',
        '- pre-push exit: `1` (BLOCK)',
        '- ci exit: `1` (BLOCK)',
      ].join('\n'),
      'utf8'
    );
    writeFileSync(
      join(smokeRoot, 'minimal', 'summary.md'),
      [
        '# Package Install Smoke Report',
        '',
        '- Smoke mode: `minimal`',
        '- Status: PASS',
        '- pre-commit exit: `0` (PASS)',
        '- pre-push exit: `0` (PASS)',
        '- ci exit: `0` (PASS)',
      ].join('\n'),
      'utf8'
    );

    const result = runGenerator({
      cwd: tempRoot,
      repo: 'mock/consumer',
      outDir: '.audit-reports/phase5',
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /verdict=READY/);

    const triage = readFileSync(
      join(tempRoot, '.audit-reports/phase5/consumer-startup-triage-report.md'),
      'utf8'
    );
    const unblock = readFileSync(
      join(tempRoot, '.audit-reports/phase5/consumer-startup-unblock-status.md'),
      'utf8'
    );

    assert.match(triage, /- verdict: READY/);
    assert.match(unblock, /- verdict: READY_FOR_RETEST/);
  });
});

test('build-mock-consumer-startup-triage returns BLOCKED when smoke summaries are missing or inconsistent', async () => {
  await withTempDir('pumuki-mock-triage-blocked-', (tempRoot) => {
    const smokeRoot = join(tempRoot, '.audit-reports', 'package-smoke', 'block');
    mkdirSync(smokeRoot, { recursive: true });

    writeFileSync(
      join(smokeRoot, 'summary.md'),
      [
        '# Package Install Smoke Report',
        '',
        '- Smoke mode: `block`',
        '- Status: PASS',
        '- pre-commit exit: `1` (BLOCK)',
        '- pre-push exit: `1` (BLOCK)',
        '- ci exit: `1` (BLOCK)',
      ].join('\n'),
      'utf8'
    );

    const result = runGenerator({
      cwd: tempRoot,
      outDir: '.audit-reports/phase5',
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /verdict=BLOCKED/);

    const triage = readFileSync(
      join(tempRoot, '.audit-reports/phase5/consumer-startup-triage-report.md'),
      'utf8'
    );
    const unblock = readFileSync(
      join(tempRoot, '.audit-reports/phase5/consumer-startup-unblock-status.md'),
      'utf8'
    );

    assert.match(triage, /- verdict: BLOCKED/);
    assert.match(triage, /Resolve failed required step `mock-package-smoke-minimal`/);
    assert.match(unblock, /- verdict: BLOCKED/);
  });
});
