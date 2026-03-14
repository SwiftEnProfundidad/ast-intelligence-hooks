import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveMacOsBannerDeliveryRunner,
} from '../framework-menu-system-notifications-macos-banner-delivery-runner';

test('resolveMacOsBannerDeliveryRunner devuelve el runner explícito cuando existe', () => {
  const customRunner = () => 7;

  const runner = resolveMacOsBannerDeliveryRunner({
    payload: { title: 'x', message: 'y' },
    runCommand: customRunner,
  });

  assert.equal(runner, customRunner);
});

test('resolveMacOsBannerDeliveryRunner usa el runner por defecto cuando no hay override', () => {
  const runner = resolveMacOsBannerDeliveryRunner({
    payload: { title: 'x', message: 'y' },
  });

  assert.equal(typeof runner, 'function');
});
