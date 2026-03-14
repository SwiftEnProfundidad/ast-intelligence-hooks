import assert from 'node:assert/strict';
import test from 'node:test';
import { emitMacOsBannerStage } from '../framework-menu-system-notifications-macos-banner-stage';
import type { SystemNotificationPayload } from '../framework-menu-system-notifications-types';

const payload: SystemNotificationPayload = {
  title: 'Pumuki bloqueado',
  message: 'Causa breve',
};

test('emitMacOsBannerStage mantiene la fachada del stage de banner', () => {
  const result = emitMacOsBannerStage({
    payload,
    runCommand: () => 0,
  });

  assert.deepEqual(result, { delivered: true, reason: 'delivered' });
});
