import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasFsChmodSyncCall,
  hasFsFutimesSyncCall,
  hasFsUnlinkSyncCall,
  hasFsWritevSyncCall,
} from './syncPart2';

const createFsSyncPart2CallAst = (
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

test('syncPart2 detecta metodos reexportados de core, io, permissions y times', () => {
  assert.equal(hasFsUnlinkSyncCall(createFsSyncPart2CallAst('unlinkSync')), true);
  assert.equal(hasFsWritevSyncCall(createFsSyncPart2CallAst('writevSync')), true);
  assert.equal(hasFsChmodSyncCall(createFsSyncPart2CallAst('chmodSync')), true);
  assert.equal(hasFsFutimesSyncCall(createFsSyncPart2CallAst('futimesSync')), true);
});

test('syncPart2 descarta objeto distinto de fs', () => {
  assert.equal(
    hasFsUnlinkSyncCall(createFsSyncPart2CallAst('unlinkSync', { objectName: 'fsp' })),
    false
  );
  assert.equal(
    hasFsChmodSyncCall(createFsSyncPart2CallAst('chmodSync', { objectName: 'fsp' })),
    false
  );
});

test('syncPart2 descarta propiedades computed', () => {
  assert.equal(hasFsWritevSyncCall(createFsSyncPart2CallAst('writevSync', { computed: true })), false);
  assert.equal(
    hasFsFutimesSyncCall(createFsSyncPart2CallAst('futimesSync', { computed: true })),
    false
  );
});

test('syncPart2 no cruza metodos entre detectores', () => {
  assert.equal(hasFsUnlinkSyncCall(createFsSyncPart2CallAst('rmdirSync')), false);
  assert.equal(hasFsWritevSyncCall(createFsSyncPart2CallAst('writeSync')), false);
  assert.equal(hasFsChmodSyncCall(createFsSyncPart2CallAst('chownSync')), false);
  assert.equal(hasFsFutimesSyncCall(createFsSyncPart2CallAst('lutimesSync')), false);
});
