import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import test from 'node:test';

const scriptPath = resolve(process.cwd(), 'scripts/build-consumer-startup-triage.ts');

const runDry = (args: ReadonlyArray<string>): string => {
  return execFileSync('npx', ['--yes', 'tsx@4.21.0', scriptPath, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
};

test('build-consumer-startup-triage dry-run renders command plan without workflow lint', () => {
  const output = runDry([
    '--repo',
    'owner/repo',
    '--skip-workflow-lint',
    '--dry-run',
  ]);

  assert.match(output, /consumer startup triage dry-run plan:/);
  assert.match(output, /- auth-check:/);
  assert.match(output, /- ci-artifacts:/);
  assert.match(output, /- support-bundle:/);
  assert.match(output, /- support-ticket-draft:/);
  assert.match(output, /- startup-unblock-status:/);
  assert.doesNotMatch(output, /- workflow-lint:/);
});

test('build-consumer-startup-triage dry-run renders workflow lint step when configured', () => {
  const output = runDry([
    '--repo',
    'owner/repo',
    '--repo-path',
    '/tmp/consumer',
    '--actionlint-bin',
    '/tmp/actionlint',
    '--dry-run',
  ]);

  assert.match(output, /- workflow-lint:/);
  assert.match(output, /--repo-path \/tmp\/consumer/);
  assert.match(output, /--actionlint-bin \/tmp\/actionlint/);
});

