import assert from 'node:assert/strict';
import test from 'node:test';
import { stableStringify } from './stableStringify';

test('stableStringify ordena claves de objeto de forma determinista', () => {
  const input = { z: 1, a: 2, m: 3 };

  assert.equal(stableStringify(input), '{"a":2,"m":3,"z":1}');
});

test('stableStringify preserva orden de arrays y ordena objetos anidados', () => {
  const input = [
    { b: 2, a: 1 },
    { d: 4, c: 3 },
  ];

  assert.equal(stableStringify(input), '[{"a":1,"b":2},{"c":3,"d":4}]');
});

test('stableStringify serializa undefined como null para salida estable', () => {
  assert.equal(stableStringify(undefined), 'null');
});
