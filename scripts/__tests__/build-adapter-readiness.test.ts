import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

const scriptPath = resolve(process.cwd(), 'scripts/build-adapter-readiness.ts');

const runGenerator = (params: {
  cwd: string;
  windsurfReportFile?: string;
  outFile?: string;
}): { status: number; stdout: string; stderr: string } => {
  const args = ['--yes', 'tsx@4.21.0', scriptPath];

  if (params.windsurfReportFile) {
    args.push('--windsurf-report', params.windsurfReportFile);
  }
  if (params.outFile) {
    args.push('--out', params.outFile);
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

test('build-adapter-readiness returns PENDING when windsurf report is missing', async () => {
  await withTempDir('pumuki-adapter-readiness-missing-', (tempRoot) => {
    mkdirSync(join(tempRoot, 'docs/validation'), { recursive: true });

    const result = runGenerator({
      cwd: tempRoot,
      outFile: 'docs/validation/adapter-readiness.md',
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /verdict=PENDING/);

    const report = readFileSync(
      join(tempRoot, 'docs/validation/adapter-readiness.md'),
      'utf8'
    );
    assert.match(report, /- verdict: PENDING/);
    assert.match(report, /Missing Windsurf adapter report/);
  });
});

test('build-adapter-readiness returns READY when windsurf report passes', async () => {
  await withTempDir('pumuki-adapter-readiness-ready-', (tempRoot) => {
    const docsValidation = join(tempRoot, 'docs/validation');
    mkdirSync(docsValidation, { recursive: true });

    writeFileSync(
      join(docsValidation, 'windsurf-real-session-report.md'),
      [
        '# Windsurf Hook Runtime - Real Session Report',
        '',
        '- Validation result: PASS',
        '- Any `bash: node: command not found`: NO',
      ].join('\n'),
      'utf8'
    );

    const result = runGenerator({
      cwd: tempRoot,
      windsurfReportFile: 'docs/validation/windsurf-real-session-report.md',
      outFile: 'docs/validation/adapter-readiness.md',
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /verdict=READY/);

    const report = readFileSync(
      join(docsValidation, 'adapter-readiness.md'),
      'utf8'
    );
    assert.match(report, /- verdict: READY/);
    assert.match(report, /- windsurf: PASS/);
  });
});

test('build-adapter-readiness returns BLOCKED when windsurf report fails', async () => {
  await withTempDir('pumuki-adapter-readiness-blocked-', (tempRoot) => {
    const docsValidation = join(tempRoot, 'docs/validation');
    mkdirSync(docsValidation, { recursive: true });

    writeFileSync(
      join(docsValidation, 'windsurf-real-session-report.md'),
      [
        '# Windsurf Hook Runtime - Real Session Report',
        '',
        '- Validation result: FAIL',
        '- Any `bash: node: command not found`: YES',
      ].join('\n'),
      'utf8'
    );

    const result = runGenerator({
      cwd: tempRoot,
      windsurfReportFile: 'docs/validation/windsurf-real-session-report.md',
      outFile: 'docs/validation/adapter-readiness.md',
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /verdict=BLOCKED/);

    const report = readFileSync(
      join(docsValidation, 'adapter-readiness.md'),
      'utf8'
    );
    assert.match(report, /- verdict: BLOCKED/);
    assert.match(report, /Windsurf adapter validation is FAIL/);
  });
});
