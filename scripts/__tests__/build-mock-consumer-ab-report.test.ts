import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

const scriptPath = resolve(process.cwd(), 'scripts/build-mock-consumer-ab-report.ts');

const runReport = (params: {
  cwd: string;
  repo?: string;
  out?: string;
  blockSummaryFile?: string;
  minimalSummaryFile?: string;
  evidenceFile?: string;
}): { status: number; stdout: string; stderr: string } => {
  const args = ['--yes', 'tsx@4.21.0', scriptPath];

  if (params.repo) {
    args.push('--repo', params.repo);
  }
  if (params.out) {
    args.push('--out', params.out);
  }
  if (params.blockSummaryFile) {
    args.push('--block-summary', params.blockSummaryFile);
  }
  if (params.minimalSummaryFile) {
    args.push('--minimal-summary', params.minimalSummaryFile);
  }
  if (params.evidenceFile) {
    args.push('--evidence', params.evidenceFile);
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

test('build-mock-consumer-ab-report returns READY for healthy smoke summaries and evidence v2.1', async () => {
  await withTempDir('pumuki-mock-ab-ready-', (tempRoot) => {
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

    writeFileSync(
      join(tempRoot, '.ai_evidence.json'),
      JSON.stringify(
        {
          version: '2.1',
          snapshot: {
            stage: 'CI',
            outcome: 'PASS',
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const result = runReport({
      cwd: tempRoot,
      repo: 'mock/consumer',
      out: '.audit-reports/mock-consumer/mock-consumer-ab-report.md',
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /verdict=READY/);

    const report = readFileSync(
      join(tempRoot, '.audit-reports/mock-consumer/mock-consumer-ab-report.md'),
      'utf8'
    );
    assert.match(report, /- verdict: READY/);
    assert.match(report, /- evidence_schema_v2_1: PASS/);
  });
});

test('build-mock-consumer-ab-report returns BLOCKED when smoke/evidence assertions fail', async () => {
  await withTempDir('pumuki-mock-ab-blocked-', (tempRoot) => {
    const smokeRoot = join(tempRoot, '.audit-reports', 'package-smoke');
    mkdirSync(join(smokeRoot, 'block'), { recursive: true });

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
      join(tempRoot, '.ai_evidence.json'),
      JSON.stringify(
        {
          version: '2.0',
          snapshot: {},
        },
        null,
        2
      ),
      'utf8'
    );

    const result = runReport({
      cwd: tempRoot,
      out: '.audit-reports/mock-consumer/mock-consumer-ab-report.md',
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /verdict=BLOCKED/);

    const report = readFileSync(
      join(tempRoot, '.audit-reports/mock-consumer/mock-consumer-ab-report.md'),
      'utf8'
    );
    assert.match(report, /- verdict: BLOCKED/);
    assert.match(
      report,
      /Package smoke minimal mode summary is not in expected pass state/
    );
    assert.match(report, /ai_evidence does not expose expected v2\.1 snapshot metadata/);
  });
});
