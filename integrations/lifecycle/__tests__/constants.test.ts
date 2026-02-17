import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PUMUKI_CONFIG_KEYS,
  PUMUKI_MANAGED_BLOCK_END,
  PUMUKI_MANAGED_BLOCK_START,
  PUMUKI_MANAGED_HOOKS,
} from '../constants';

test('managed block markers son estables y no ambiguos', () => {
  assert.match(PUMUKI_MANAGED_BLOCK_START, /^# >>> PUMUKI MANAGED START >>>$/);
  assert.match(PUMUKI_MANAGED_BLOCK_END, /^# <<< PUMUKI MANAGED END <<</);
  assert.notEqual(PUMUKI_MANAGED_BLOCK_START, PUMUKI_MANAGED_BLOCK_END);
});

test('config keys contienen el namespace pumuki y son únicos', () => {
  const values = Object.values(PUMUKI_CONFIG_KEYS);
  const uniqueValues = new Set(values);

  assert.equal(values.length, uniqueValues.size);
  for (const key of values) {
    assert.match(key, /^pumuki\./);
  }
});

test('managed hooks incluyen únicamente pre-commit y pre-push en orden determinista', () => {
  assert.deepEqual(PUMUKI_MANAGED_HOOKS, ['pre-commit', 'pre-push']);
});

test('config keys mantienen contrato estable por campo', () => {
  assert.deepEqual(PUMUKI_CONFIG_KEYS, {
    installed: 'pumuki.installed',
    version: 'pumuki.version',
    hooks: 'pumuki.hooks',
    installedAt: 'pumuki.installed-at',
  });
});

test('managed hooks tienen formato git hook válido y sin duplicados', () => {
  const hooks = [...PUMUKI_MANAGED_HOOKS];
  assert.equal(new Set(hooks).size, hooks.length);
  for (const hook of hooks) {
    assert.match(hook, /^[a-z]+(?:-[a-z]+)+$/);
  }
});
