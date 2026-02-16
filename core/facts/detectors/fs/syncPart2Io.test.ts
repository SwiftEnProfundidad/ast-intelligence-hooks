import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasFsReadvSyncCall,
  hasFsWriteSyncCall,
  hasFsWritevSyncCall,
} from './syncPart2Io';

const createFsSyncPart2IoCallAst = (
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

test('syncPart2Io detecta llamadas fs.*Sync esperadas', () => {
  assert.equal(hasFsReadvSyncCall(createFsSyncPart2IoCallAst('readvSync')), true);
  assert.equal(hasFsWritevSyncCall(createFsSyncPart2IoCallAst('writevSync')), true);
  assert.equal(hasFsWriteSyncCall(createFsSyncPart2IoCallAst('writeSync')), true);
});

test('syncPart2Io descarta objeto distinto de fs', () => {
  assert.equal(
    hasFsReadvSyncCall(createFsSyncPart2IoCallAst('readvSync', { objectName: 'fsp' })),
    false
  );
  assert.equal(
    hasFsWriteSyncCall(createFsSyncPart2IoCallAst('writeSync', { objectName: 'fsp' })),
    false
  );
});

test('syncPart2Io descarta propiedades computed', () => {
  assert.equal(
    hasFsWritevSyncCall(createFsSyncPart2IoCallAst('writevSync', { computed: true })),
    false
  );
  assert.equal(
    hasFsReadvSyncCall(createFsSyncPart2IoCallAst('readvSync', { computed: true })),
    false
  );
});

test('syncPart2Io no cruza metodos entre detectores', () => {
  assert.equal(hasFsReadvSyncCall(createFsSyncPart2IoCallAst('writevSync')), false);
  assert.equal(hasFsWritevSyncCall(createFsSyncPart2IoCallAst('writeSync')), false);
  assert.equal(hasFsWriteSyncCall(createFsSyncPart2IoCallAst('readvSync')), false);
});
