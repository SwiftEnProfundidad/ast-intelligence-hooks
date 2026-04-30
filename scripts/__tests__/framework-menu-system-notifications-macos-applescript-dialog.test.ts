import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDisplayDialogScript } from '../framework-menu-system-notifications-macos-applescript-dialog';

test('buildDisplayDialogScript construye un diálogo bloqueante con información accionable', () => {
  const script = buildDisplayDialogScript({
    title: 'Pumuki bloqueado',
    cause: 'Causa: La evidencia está desactualizada.\nImpacto: El gate no deja avanzar.',
    remediation: 'Comando: pumuki sdd validate --stage=PRE_PUSH --json\nSiguiente acción: Refresca la evidencia.',
  });

  assert.match(script, /display dialog/i);
  assert.match(script, /Causa: La evidencia está desactualizada\./);
  assert.match(script, /Impacto: El gate no deja avanzar\./);
  assert.match(script, /Comando: pumuki sdd validate --stage=PRE_PUSH --json/);
  assert.match(script, /Siguiente acción: Refresca la evidencia\./);
  assert.match(script, /buttons \{"Desactivar", "Silenciar 30 min", "Mantener activas"\}/);
});
