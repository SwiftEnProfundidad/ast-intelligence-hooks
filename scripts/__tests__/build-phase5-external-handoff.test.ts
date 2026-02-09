import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

const scriptPath = resolve(process.cwd(), 'scripts/build-phase5-external-handoff.ts');

const runGenerator = (params: {
  cwd: string;
  repo?: string;
  out?: string;
  requireArtifactUrls?: boolean;
  requireMockAbReport?: boolean;
  artifactUrls?: string[];
}): { status: number; stdout: string; stderr: string } => {
  const args = ['--yes', 'tsx@4.21.0', scriptPath];

  if (params.repo) {
    args.push('--repo', params.repo);
  }
  if (params.out) {
    args.push('--out', params.out);
  }
  if (params.requireArtifactUrls) {
    args.push('--require-artifact-urls');
  }
  if (params.requireMockAbReport) {
    args.push('--require-mock-ab-report');
  }
  for (const url of params.artifactUrls ?? []) {
    args.push('--artifact-url', url);
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

test('build-phase5-external-handoff returns READY when required reports and artifact url are present', async () => {
  await withTempDir('pumuki-phase5-handoff-ready-', (tempRoot) => {
    const phase5Root = join(tempRoot, '.audit-reports', 'phase5');
    mkdirSync(phase5Root, { recursive: true });

    writeFileSync(
      join(phase5Root, 'phase5-execution-closure-status.md'),
      '# status\n\n- verdict: READY\n',
      'utf8'
    );
    writeFileSync(
      join(phase5Root, 'phase5-blockers-readiness.md'),
      '# blockers\n\n- verdict: READY\n',
      'utf8'
    );
    writeFileSync(
      join(phase5Root, 'consumer-startup-unblock-status.md'),
      '# unblock\n\n- verdict: READY_FOR_RETEST\n',
      'utf8'
    );
    writeFileSync(
      join(phase5Root, 'mock-consumer-ab-report.md'),
      '# mock ab\n\n- verdict: READY\n',
      'utf8'
    );
    writeFileSync(
      join(phase5Root, 'phase5-execution-closure-run-report.md'),
      '# run\n\n- verdict: READY\n',
      'utf8'
    );

    const result = runGenerator({
      cwd: tempRoot,
      repo: 'mock/consumer',
      requireArtifactUrls: true,
      requireMockAbReport: true,
      artifactUrls: ['https://github.com/org/repo/actions/runs/123/artifacts/1'],
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /verdict=READY/);

    const report = readFileSync(
      join(phase5Root, 'phase5-external-handoff.md'),
      'utf8'
    );
    assert.match(report, /- verdict: READY/);
    assert.match(report, /https:\/\/github\.com\/org\/repo\/actions\/runs\/123\/artifacts\/1/);
  });
});

test('build-phase5-external-handoff returns BLOCKED when required artifact url is missing', async () => {
  await withTempDir('pumuki-phase5-handoff-blocked-', (tempRoot) => {
    const phase5Root = join(tempRoot, '.audit-reports', 'phase5');
    mkdirSync(phase5Root, { recursive: true });

    writeFileSync(
      join(phase5Root, 'phase5-execution-closure-status.md'),
      '# status\n\n- verdict: READY\n',
      'utf8'
    );
    writeFileSync(
      join(phase5Root, 'phase5-blockers-readiness.md'),
      '# blockers\n\n- verdict: READY\n',
      'utf8'
    );
    writeFileSync(
      join(phase5Root, 'consumer-startup-unblock-status.md'),
      '# unblock\n\n- verdict: READY_FOR_RETEST\n',
      'utf8'
    );

    const result = runGenerator({
      cwd: tempRoot,
      requireArtifactUrls: true,
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /verdict=BLOCKED/);

    const report = readFileSync(
      join(phase5Root, 'phase5-external-handoff.md'),
      'utf8'
    );
    assert.match(report, /- verdict: BLOCKED/);
    assert.match(report, /No artifact URLs were provided/);
  });
});
