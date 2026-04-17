import assert from 'node:assert/strict';
import test from 'node:test';

import { truncateNotificationText } from '../framework-menu-system-notifications-text';

test('truncateNotificationText corta por palabra cuando hay margen suficiente', () => {
  const result = truncateNotificationText(
    'Divide el cambio por scope o en commits más pequeños y vuelve a ejecutar el gate.',
    48
  );

  assert.equal(result, 'Divide el cambio por scope o en commits más…');
});

test('truncateNotificationText mantiene corte duro cuando no existe un separador útil', () => {
  const result = truncateNotificationText('ABCDEFGHIJKLMN', 8);

  assert.equal(result, 'ABCDEFG…');
});
