import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasFsMkdirSyncCall,
  hasFsReaddirSyncCall,
  hasFsRmSyncCall,
  hasFsUtimesSyncCall,
} from './syncPart1DirTimes';

const createFsDirTimesCallAst = (
  methodName: string,
  options?: { objectName?: string; computed?: boolean }
) => {
  const objectName = options?.objectName ?? 'fs';
  const computed = options?.computed === true;

  return {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed,
      object: { type: 'Identifier', name: objectName },
      property: computed
        ? { type: 'StringLiteral', value: methodName }
        : { type: 'Identifier', name: methodName },
    },
    arguments: [{ type: 'StringLiteral', value: '/tmp/file.txt' }],
  };
};

test('syncPart1DirTimes detecta llamadas fs.*Sync esperadas', () => {
  assert.equal(hasFsRmSyncCall(createFsDirTimesCallAst('rmSync')), true);
  assert.equal(hasFsMkdirSyncCall(createFsDirTimesCallAst('mkdirSync')), true);
  assert.equal(hasFsReaddirSyncCall(createFsDirTimesCallAst('readdirSync')), true);
  assert.equal(hasFsUtimesSyncCall(createFsDirTimesCallAst('utimesSync')), true);
});

test('syncPart1DirTimes descarta objeto distinto de fs', () => {
  assert.equal(hasFsRmSyncCall(createFsDirTimesCallAst('rmSync', { objectName: 'fsp' })), false);
  assert.equal(
    hasFsReaddirSyncCall(createFsDirTimesCallAst('readdirSync', { objectName: 'fsp' })),
    false
  );
});

test('syncPart1DirTimes descarta propiedades computed', () => {
  assert.equal(hasFsMkdirSyncCall(createFsDirTimesCallAst('mkdirSync', { computed: true })), false);
  assert.equal(
    hasFsUtimesSyncCall(createFsDirTimesCallAst('utimesSync', { computed: true })),
    false
  );
});

test('syncPart1DirTimes no cruza metodos entre detectores', () => {
  assert.equal(hasFsRmSyncCall(createFsDirTimesCallAst('mkdirSync')), false);
  assert.equal(hasFsMkdirSyncCall(createFsDirTimesCallAst('rmSync')), false);
  assert.equal(hasFsReaddirSyncCall(createFsDirTimesCallAst('utimesSync')), false);
});
