import assert from 'node:assert/strict';
import test from 'node:test';
import { loadHeuristicsConfig } from './heuristics';

const ENV_KEY = 'PUMUKI_ENABLE_AST_HEURISTICS';
const originalValue = process.env[ENV_KEY];

test.after(() => {
  if (originalValue === undefined) {
    delete process.env[ENV_KEY];
    return;
  }
  process.env[ENV_KEY] = originalValue;
});

test('loadHeuristicsConfig usa false por defecto cuando no hay env', () => {
  delete process.env[ENV_KEY];

  const config = loadHeuristicsConfig();

  assert.equal(config.astSemanticEnabled, false);
});

test('loadHeuristicsConfig interpreta valores truthy ignorando mayúsculas y espacios', () => {
  process.env[ENV_KEY] = '  YES  ';

  const config = loadHeuristicsConfig();

  assert.equal(config.astSemanticEnabled, true);
});

test('loadHeuristicsConfig mantiene false con valores no soportados', () => {
  process.env[ENV_KEY] = 'enabled';

  const config = loadHeuristicsConfig();

  assert.equal(config.astSemanticEnabled, false);
});

test('loadHeuristicsConfig acepta variantes truthy explícitas del contrato', () => {
  for (const value of ['1', 'true', 'on']) {
    process.env[ENV_KEY] = value;
    const config = loadHeuristicsConfig();
    assert.equal(config.astSemanticEnabled, true, `expected truthy for ${value}`);
  }
});

test('loadHeuristicsConfig devuelve false para string vacío o solo espacios', () => {
  process.env[ENV_KEY] = '   ';
  assert.equal(loadHeuristicsConfig().astSemanticEnabled, false);

  process.env[ENV_KEY] = '';
  assert.equal(loadHeuristicsConfig().astSemanticEnabled, false);
});
