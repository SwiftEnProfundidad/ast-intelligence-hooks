import assert from 'node:assert/strict';
import test from 'node:test';
import { loadHeuristicsConfig } from './heuristics';

const ENV_KEY = 'PUMUKI_ENABLE_AST_HEURISTICS';
const TS_SCOPE_ENV_KEY = 'PUMUKI_HEURISTICS_TS_SCOPE';
const originalValue = process.env[ENV_KEY];
const originalScopeValue = process.env[TS_SCOPE_ENV_KEY];

test.after(() => {
  if (originalValue === undefined) {
    delete process.env[ENV_KEY];
  } else {
    process.env[ENV_KEY] = originalValue;
  }

  if (originalScopeValue === undefined) {
    delete process.env[TS_SCOPE_ENV_KEY];
    return;
  }
  process.env[TS_SCOPE_ENV_KEY] = originalScopeValue;
});

test('loadHeuristicsConfig usa false por defecto cuando no hay env', () => {
  delete process.env[ENV_KEY];

  const config = loadHeuristicsConfig();

  assert.equal(config.astSemanticEnabled, false);
  assert.equal(config.typeScriptScope, 'platform');
});

test('loadHeuristicsConfig interpreta valores truthy ignorando mayúsculas y espacios', () => {
  process.env[ENV_KEY] = '  YES  ';

  const config = loadHeuristicsConfig();

  assert.equal(config.astSemanticEnabled, true);
  assert.equal(config.typeScriptScope, 'platform');
});

test('loadHeuristicsConfig mantiene false con valores no soportados', () => {
  process.env[ENV_KEY] = 'enabled';

  const config = loadHeuristicsConfig();

  assert.equal(config.astSemanticEnabled, false);
  assert.equal(config.typeScriptScope, 'platform');
});

test('loadHeuristicsConfig acepta variantes truthy explícitas del contrato', () => {
  for (const value of ['1', 'true', 'on']) {
    process.env[ENV_KEY] = value;
    const config = loadHeuristicsConfig();
    assert.equal(config.astSemanticEnabled, true, `expected truthy for ${value}`);
    assert.equal(config.typeScriptScope, 'platform');
  }
});

test('loadHeuristicsConfig devuelve false para string vacío o solo espacios', () => {
  process.env[ENV_KEY] = '   ';
  assert.equal(loadHeuristicsConfig().astSemanticEnabled, false);
  assert.equal(loadHeuristicsConfig().typeScriptScope, 'platform');

  process.env[ENV_KEY] = '';
  assert.equal(loadHeuristicsConfig().astSemanticEnabled, false);
  assert.equal(loadHeuristicsConfig().typeScriptScope, 'platform');
});

test('loadHeuristicsConfig soporta typeScriptScope=all por env explícita', () => {
  process.env[TS_SCOPE_ENV_KEY] = 'all';
  assert.equal(loadHeuristicsConfig().typeScriptScope, 'all');

  process.env[TS_SCOPE_ENV_KEY] = ' full ';
  assert.equal(loadHeuristicsConfig().typeScriptScope, 'all');
});

test('loadHeuristicsConfig usa scope platform por defecto cuando scope no es válido', () => {
  process.env[TS_SCOPE_ENV_KEY] = 'unknown';
  assert.equal(loadHeuristicsConfig().typeScriptScope, 'platform');
});
