import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import test from 'node:test';

const scriptPath = resolve(process.cwd(), 'scripts/run-phase5-execution-closure.ts');

const runClosureCommand = (args: string[]): {
  status: number;
  stdout: string;
  stderr: string;
} => {
  try {
    const stdout = execFileSync('npx', ['--yes', 'tsx@4.21.0', scriptPath, ...args], {
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

test('run-phase5-execution-closure renders deterministic dry-run command plan', () => {
  const result = runClosureCommand([
    '--repo',
    'owner/repo',
    '--skip-workflow-lint',
    '--dry-run',
  ]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /phase5 execution closure dry-run plan/);
  assert.match(result.stdout, /check-consumer-ci-auth\.ts/);
  assert.match(result.stdout, /build-consumer-startup-triage\.ts/);
  assert.match(result.stdout, /--skip-auth-check/);
  assert.match(result.stdout, /build-phase5-blockers-readiness\.ts/);
  assert.match(result.stdout, /build-phase5-execution-closure-status\.ts/);
});

test('run-phase5-execution-closure supports skip-auth-preflight mode in dry-run', () => {
  const result = runClosureCommand([
    '--repo',
    'owner/repo',
    '--skip-workflow-lint',
    '--skip-auth-preflight',
    '--dry-run',
  ]);

  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stdout, /check-consumer-ci-auth\.ts/);
  assert.doesNotMatch(result.stdout, /--skip-auth-check/);
  assert.match(result.stdout, /build-consumer-startup-triage\.ts/);
});

test('run-phase5-execution-closure fails when strict adapter mode is requested with skip-adapter', () => {
  const result = runClosureCommand([
    '--repo',
    'owner/repo',
    '--skip-workflow-lint',
    '--skip-adapter',
    '--require-adapter-readiness',
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Cannot require adapter readiness/);
});

test('run-phase5-execution-closure validates workflow lint requirements', () => {
  const result = runClosureCommand([
    '--repo',
    'owner/repo',
    '--dry-run',
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Workflow lint requires --repo-path and --actionlint-bin/);
});
