import assert from 'node:assert/strict';
import test from 'node:test';
import consumerPreflightLib, {
  formatConsumerPreflight,
  runConsumerPreflight,
} from '../framework-menu-consumer-preflight-lib';

test('framework-menu-consumer-preflight-lib mantiene la fachada publica estable', () => {
  assert.equal(typeof runConsumerPreflight, 'function');
  assert.equal(typeof formatConsumerPreflight, 'function');
  assert.equal(consumerPreflightLib.runConsumerPreflight, runConsumerPreflight);
  assert.equal(consumerPreflightLib.formatConsumerPreflight, formatConsumerPreflight);
});
