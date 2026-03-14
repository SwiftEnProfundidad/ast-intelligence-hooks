import assert from 'node:assert/strict';
import test from 'node:test';
import { runMacOsBannerCommand } from '../framework-menu-system-notifications-macos-banner-run';

test('runMacOsBannerCommand ejecuta osascript con los args recibidos', () => {
  const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];

  const exitCode = runMacOsBannerCommand({
    runner: (command, args) => {
      calls.push({ command, args });
      return 0;
    },
    args: ['-e', 'display notification "hola"'],
  });

  assert.equal(exitCode, 0);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.command, 'osascript');
  assert.deepEqual(calls[0]?.args, ['-e', 'display notification "hola"']);
});
