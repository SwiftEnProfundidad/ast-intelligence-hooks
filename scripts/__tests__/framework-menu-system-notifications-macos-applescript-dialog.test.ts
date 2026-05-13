import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDisplayDialogScript } from '../framework-menu-system-notifications-macos-applescript-dialog';

test('buildDisplayDialogScript construye un diálogo bloqueante con causa y solución', () => {
  const script = buildDisplayDialogScript({
    title: 'Pumuki bloqueado',
    cause: 'La evidencia está desactualizada.',
    remediation: 'Regenera evidencia.',
  });

  assert.match(script, /display dialog/i);
  assert.match(script, /Causa: La evidencia está desactualizada\./);
  assert.match(script, /Solución: Regenera evidencia\./);
  assert.match(script, /buttons \{"Desactivar", "Silenciar 30 min", "Mantener activas"\}/);
});
