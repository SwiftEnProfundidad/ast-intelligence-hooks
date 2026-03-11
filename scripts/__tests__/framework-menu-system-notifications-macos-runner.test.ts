import assert from 'node:assert/strict';
import test from 'node:test';

import { extractDialogButton } from '../framework-menu-system-notifications-macos-runner';

test('framework-menu-system-notifications-macos-runner mantiene la fachada pública', () => {
  assert.equal(typeof extractDialogButton, 'function');
});

test('extractDialogButton devuelve null si no hay marcador de salida', () => {
  assert.equal(extractDialogButton('sin salida útil'), null);
});

test('extractDialogButton devuelve el botón cuando el helper lo imprime', () => {
  assert.equal(
    extractDialogButton('button returned:Mantener activas\n'),
    'Mantener activas'
  );
});
