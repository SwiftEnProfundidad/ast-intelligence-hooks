import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDisplayNotificationScript,
  escapeAppleScriptString,
} from '../framework-menu-system-notifications-macos-applescript-banner';

test('escapeAppleScriptString escapa comillas, barras y saltos', () => {
  assert.equal(
    escapeAppleScriptString('Hola "Pumuki"\\\nNueva línea'),
    'Hola \\"Pumuki\\"\\\\ Nueva línea',
  );
});

test('buildDisplayNotificationScript incluye subtitle y sound cuando existen', () => {
  const script = buildDisplayNotificationScript({
    title: '🔴 Pumuki bloqueado',
    subtitle: 'Repo · PRE_PUSH',
    message:
      'Causa: La rama no tiene upstream configurado.\nImpacto: No puedes continuar el pre-push.\nComando: git push --set-upstream origin <branch>\nSiguiente acción: Configura upstream y repite PRE_PUSH.',
    soundName: 'Basso',
  });

  assert.match(script, /display notification/i);
  assert.match(script, /subtitle "Repo · PRE_PUSH"/);
  assert.match(script, /sound name "Basso"/);
});
