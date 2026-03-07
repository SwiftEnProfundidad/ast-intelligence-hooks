import assert from 'node:assert/strict';
import test from 'node:test';

import { runSystemCommand } from '../framework-menu-system-notifications-macos-runner-exec';

test('runSystemCommand devuelve 0 cuando el comando termina bien', () => {
  const exitCode = runSystemCommand('node', ['-e', 'process.exit(0)']);

  assert.equal(exitCode, 0);
});

test('runSystemCommand devuelve 1 cuando el comando falla', () => {
  const exitCode = runSystemCommand('node', ['-e', 'process.exit(1)']);

  assert.equal(exitCode, 1);
});
