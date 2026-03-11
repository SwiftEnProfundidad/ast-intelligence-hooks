import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMacOsBannerCommandArgs } from '../framework-menu-system-notifications-macos-banner-script';
import type { SystemNotificationPayload } from '../framework-menu-system-notifications-types';

const payload: SystemNotificationPayload = {
  title: 'Pumuki bloqueado',
  message: 'Causa breve',
  subtitle: 'PRE_PUSH',
  soundName: 'Glass',
};

test('buildMacOsBannerCommandArgs construye args de osascript con el script visible', () => {
  const args = buildMacOsBannerCommandArgs(payload);

  assert.deepEqual(args.slice(0, 1), ['-e']);
  assert.match(args[1] ?? '', /display notification/);
  assert.match(args[1] ?? '', /Pumuki bloqueado/);
});
