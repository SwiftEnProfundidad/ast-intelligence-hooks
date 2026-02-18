import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluateOpenSpecCompatibility,
  OPENSPEC_COMPATIBILITY_MATRIX,
} from '../openSpecCli';

test('evaluateOpenSpecCompatibility marca incompatible cuando OpenSpec no está instalado', () => {
  const result = evaluateOpenSpecCompatibility({
    installed: false,
    version: undefined,
  });

  assert.equal(result.compatible, false);
  assert.equal(result.minimumVersion, OPENSPEC_COMPATIBILITY_MATRIX.minimumVersion);
  assert.equal(result.recommendedVersion, OPENSPEC_COMPATIBILITY_MATRIX.recommendedVersion);
});

test('evaluateOpenSpecCompatibility marca incompatible cuando la versión detectada es menor al mínimo', () => {
  const result = evaluateOpenSpecCompatibility({
    installed: true,
    version: 'OpenSpec CLI v1.0.9',
  });

  assert.equal(result.compatible, false);
  assert.equal(result.parsedVersion, '1.0.9');
});

test('evaluateOpenSpecCompatibility marca compatible cuando la versión detectada cumple el mínimo', () => {
  const result = evaluateOpenSpecCompatibility({
    installed: true,
    version: '1.1.1',
  });

  assert.equal(result.compatible, true);
  assert.equal(result.parsedVersion, '1.1.1');
});

test('evaluateOpenSpecCompatibility marca incompatible cuando no puede parsear semver', () => {
  const result = evaluateOpenSpecCompatibility({
    installed: true,
    version: 'OpenSpec CLI unknown',
  });

  assert.equal(result.compatible, false);
  assert.equal(result.parsedVersion, undefined);
});

test('evaluateOpenSpecCompatibility marca compatible cuando la versión detectada supera el mínimo', () => {
  const result = evaluateOpenSpecCompatibility({
    installed: true,
    version: 'OpenSpec CLI v1.2.0',
  });

  assert.equal(result.compatible, true);
  assert.equal(result.parsedVersion, '1.2.0');
  assert.equal(result.detectedVersion, 'OpenSpec CLI v1.2.0');
});

test('evaluateOpenSpecCompatibility marca compatible en patch superior del mínimo', () => {
  const result = evaluateOpenSpecCompatibility({
    installed: true,
    version: '1.1.9',
  });

  assert.equal(result.compatible, true);
  assert.equal(result.parsedVersion, '1.1.9');
});

test('evaluateOpenSpecCompatibility acepta formato con prefijo "v" en la versión mínima', () => {
  const result = evaluateOpenSpecCompatibility({
    installed: true,
    version: 'v1.1.1',
  });

  assert.equal(result.compatible, true);
  assert.equal(result.parsedVersion, '1.1.1');
});

test('evaluateOpenSpecCompatibility marca incompatible en versión menor de minor', () => {
  const result = evaluateOpenSpecCompatibility({
    installed: true,
    version: 'OpenSpec CLI 1.0.99',
  });

  assert.equal(result.compatible, false);
  assert.equal(result.parsedVersion, '1.0.99');
});
