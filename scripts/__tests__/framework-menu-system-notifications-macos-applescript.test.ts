import assert from 'node:assert/strict';
import test from 'node:test';

import { runBlockedDialogWithAppleScript } from '../framework-menu-system-notifications-macos-applescript';

test('runBlockedDialogWithAppleScript mantiene la fachada pública estable', () => {
  const result = runBlockedDialogWithAppleScript({
    title: 'Pumuki bloqueado',
    cause: 'La evidencia está desactualizada.',
    remediation: 'Regenera evidencia.',
    runner: () => ({
      exitCode: 0,
      stdout: 'button returned:Silenciar 30 min\n',
    }),
  });

  assert.equal(result.commandFailed, false);
  assert.equal(result.selectedButton, 'Silenciar 30 min');
});
