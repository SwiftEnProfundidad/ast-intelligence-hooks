import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveBlockedMacOsDialogRunner } from '../framework-menu-system-notifications-macos-blocked-dispatch-runner';

test('resolveBlockedMacOsDialogRunner devuelve el runner explícito cuando existe', () => {
  const customRunner = () => ({ exitCode: 0, stdout: '', stderr: '' });

  const runner = resolveBlockedMacOsDialogRunner(customRunner);

  assert.equal(runner, customRunner);
});

test('resolveBlockedMacOsDialogRunner devuelve un runner funcional por defecto', () => {
  const runner = resolveBlockedMacOsDialogRunner();

  assert.equal(typeof runner, 'function');
});
