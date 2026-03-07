import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMacOsBannerResult } from '../framework-menu-system-notifications-macos-banner-result';

test('resolveMacOsBannerResult devuelve delivered cuando osascript termina bien', () => {
  assert.deepEqual(resolveMacOsBannerResult(0), {
    delivered: true,
    reason: 'delivered',
  });
});

test('resolveMacOsBannerResult devuelve command-failed cuando osascript falla', () => {
  assert.deepEqual(resolveMacOsBannerResult(1), {
    delivered: false,
    reason: 'command-failed',
  });
});
