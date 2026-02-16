import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasFsAccessSyncCall,
  hasFsExistsSyncCall,
  hasFsLstatSyncCall,
  hasFsRealpathSyncCall,
  hasFsStatSyncCall,
  hasFsStatfsSyncCall,
} from './syncPart1Metadata';

const createFsMetadataCallAst = (
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

test('syncPart1Metadata detecta llamadas fs.*Sync esperadas', () => {
  assert.equal(hasFsStatSyncCall(createFsMetadataCallAst('statSync')), true);
  assert.equal(hasFsStatfsSyncCall(createFsMetadataCallAst('statfsSync')), true);
  assert.equal(hasFsRealpathSyncCall(createFsMetadataCallAst('realpathSync')), true);
  assert.equal(hasFsLstatSyncCall(createFsMetadataCallAst('lstatSync')), true);
  assert.equal(hasFsExistsSyncCall(createFsMetadataCallAst('existsSync')), true);
  assert.equal(hasFsAccessSyncCall(createFsMetadataCallAst('accessSync')), true);
});

test('syncPart1Metadata descarta objetos distintos de fs', () => {
  assert.equal(hasFsStatSyncCall(createFsMetadataCallAst('statSync', { objectName: 'fsp' })), false);
  assert.equal(
    hasFsRealpathSyncCall(createFsMetadataCallAst('realpathSync', { objectName: 'fsp' })),
    false
  );
  assert.equal(
    hasFsAccessSyncCall(createFsMetadataCallAst('accessSync', { objectName: 'fsp' })),
    false
  );
});

test('syncPart1Metadata descarta propiedades computed', () => {
  assert.equal(hasFsStatSyncCall(createFsMetadataCallAst('statSync', { computed: true })), false);
  assert.equal(hasFsExistsSyncCall(createFsMetadataCallAst('existsSync', { computed: true })), false);
  assert.equal(hasFsLstatSyncCall(createFsMetadataCallAst('lstatSync', { computed: true })), false);
});

test('syncPart1Metadata no cruza metodos entre detectores', () => {
  assert.equal(hasFsStatSyncCall(createFsMetadataCallAst('lstatSync')), false);
  assert.equal(hasFsExistsSyncCall(createFsMetadataCallAst('accessSync')), false);
  assert.equal(hasFsStatfsSyncCall(createFsMetadataCallAst('statSync')), false);
});
