import assert from 'node:assert/strict';
import test from 'node:test';

import { parseAppleScriptDialogSelection } from '../framework-menu-system-notifications-macos-applescript-parse';

test('parseAppleScriptDialogSelection devuelve el botón seleccionado', () => {
  assert.equal(
    parseAppleScriptDialogSelection('button returned:Silenciar 30 min\n'),
    'Silenciar 30 min',
  );
});

test('parseAppleScriptDialogSelection devuelve null si stdout no trae marcador', () => {
  assert.equal(parseAppleScriptDialogSelection('sin salida útil'), null);
});
