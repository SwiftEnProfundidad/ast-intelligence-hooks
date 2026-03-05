import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const resolveScriptPath = (relativePath: string): string =>
  fileURLToPath(new URL(relativePath, import.meta.url));

const runTsxScript = (scriptPath: string, args: ReadonlyArray<string>) =>
  spawnSync('node', ['--import', 'tsx', scriptPath, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

test('watch-consumer-backlog --help devuelve exit code 0', () => {
  const scriptPath = resolveScriptPath('../watch-consumer-backlog.ts');
  const result = runTsxScript(scriptPath, ['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /--id-issue-map-from/);
});

test('reconcile-consumer-backlog-issues --help devuelve exit code 0', () => {
  const scriptPath = resolveScriptPath('../reconcile-consumer-backlog-issues.ts');
  const result = runTsxScript(scriptPath, ['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /--resolve-missing-via-gh/);
});

test('watch-consumer-backlog unknown arg devuelve exit code 1', () => {
  const scriptPath = resolveScriptPath('../watch-consumer-backlog.ts');
  const result = runTsxScript(scriptPath, ['--unknown']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown argument/);
});

test('reconcile-consumer-backlog-issues unknown arg devuelve exit code 1', () => {
  const scriptPath = resolveScriptPath('../reconcile-consumer-backlog-issues.ts');
  const result = runTsxScript(scriptPath, ['--unknown']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown argument/);
});
