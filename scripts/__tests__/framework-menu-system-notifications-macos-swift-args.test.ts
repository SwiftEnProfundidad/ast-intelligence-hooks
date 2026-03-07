import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSwiftFloatingDialogArgs,
  resolveBlockedDialogMode,
} from '../framework-menu-system-notifications-macos-swift';

test('resolveBlockedDialogMode reconoce overrides válidos y hace fallback a auto', () => {
  assert.equal(
    resolveBlockedDialogMode({
      PUMUKI_MACOS_BLOCKED_DIALOG_MODE: 'applescript',
    } as NodeJS.ProcessEnv),
    'applescript'
  );
  assert.equal(
    resolveBlockedDialogMode({
      PUMUKI_MACOS_BLOCKED_DIALOG_MODE: 'swift-floating',
    } as NodeJS.ProcessEnv),
    'swift-floating'
  );
  assert.equal(
    resolveBlockedDialogMode({
      PUMUKI_MACOS_BLOCKED_DIALOG_MODE: 'otra-cosa',
    } as NodeJS.ProcessEnv),
    'auto'
  );
});

test('buildSwiftFloatingDialogArgs compone los argumentos esperados', () => {
  const args = buildSwiftFloatingDialogArgs({
    scriptPath: '/tmp/pumuki-blocked-dialog.swift',
    title: 'Pumuki bloqueado',
    cause: 'La rama no tiene upstream.',
    remediation: 'Ejecuta git push --set-upstream origin <branch>.',
  });

  assert.deepEqual(args.slice(0, 7), [
    '/tmp/pumuki-blocked-dialog.swift',
    '--title',
    'Pumuki bloqueado',
    '--cause',
    'La rama no tiene upstream.',
    '--remediation',
    'Ejecuta git push --set-upstream origin <branch>.',
  ]);
  assert.match(args.join(' '), /--timeout-seconds 15/);
});
