import assert from 'node:assert/strict';
import test from 'node:test';

import { runSystemCommandWithOutput } from '../framework-menu-system-notifications-macos-runner-output';

test('runSystemCommandWithOutput devuelve stdout cuando el comando termina bien', () => {
  const result = runSystemCommandWithOutput('node', ['-e', "process.stdout.write('ok')"]);

  assert.deepEqual(result, {
    exitCode: 0,
    stdout: 'ok',
  });
});

test('runSystemCommandWithOutput devuelve stdout parcial cuando el comando falla', () => {
  const result = runSystemCommandWithOutput('node', [
    '-e',
    "process.stdout.write('partial'); process.exit(1)",
  ]);

  assert.deepEqual(result, {
    exitCode: 1,
    stdout: 'partial',
  });
});
