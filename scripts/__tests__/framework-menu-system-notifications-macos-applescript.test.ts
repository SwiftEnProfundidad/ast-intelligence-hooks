import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDisplayNotificationScript,
  runBlockedDialogWithAppleScript,
} from '../framework-menu-system-notifications-macos-applescript';

test('buildDisplayNotificationScript incluye subtitle y sound cuando existen', () => {
  const script = buildDisplayNotificationScript({
    title: '🔴 Pumuki bloqueado',
    subtitle: 'Repo · PRE_PUSH',
    message: 'Solución: Configura upstream.',
    soundName: 'Basso',
  });

  assert.match(script, /display notification/i);
  assert.match(script, /subtitle "Repo · PRE_PUSH"/);
  assert.match(script, /sound name "Basso"/);
});

test('runBlockedDialogWithAppleScript extrae el botón seleccionado', () => {
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
