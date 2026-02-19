import assert from 'node:assert/strict';
import test from 'node:test';
import type { FactSet } from './FactSet';

test('FactSet acepta colecciones de hechos tipados como solo lectura', () => {
  const factSet: FactSet = [
    {
      kind: 'FileChange',
      path: 'apps/backend/src/main.ts',
      changeType: 'modified',
      source: 'git',
    },
    {
      kind: 'FileContent',
      path: 'apps/backend/src/main.ts',
      content: 'export const ready = true;',
      source: 'repo',
    },
    {
      kind: 'Dependency',
      from: 'module/a',
      to: 'module/b',
      source: 'deps',
    },
  ];

  assert.equal(factSet.length, 3);
  assert.equal(factSet[0]?.kind, 'FileChange');
  assert.equal(factSet[1]?.kind, 'FileContent');
  assert.equal(factSet[2]?.kind, 'Dependency');
});

test('FactSet puede representar colecciones vacias', () => {
  const emptyFactSet: FactSet = [];

  assert.deepEqual(emptyFactSet, []);
  assert.equal(emptyFactSet.length, 0);
});
