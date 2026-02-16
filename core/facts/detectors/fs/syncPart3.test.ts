import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasFsCpSyncCall,
  hasFsFsyncSyncCall,
  hasFsReadlinkSyncCall,
} from './syncPart3';

const createFsSyncPart3CallAst = (
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

test('syncPart3 detecta metodos reexportados de links, descriptorIo y pathOps', () => {
  assert.equal(hasFsReadlinkSyncCall(createFsSyncPart3CallAst('readlinkSync')), true);
  assert.equal(hasFsFsyncSyncCall(createFsSyncPart3CallAst('fsyncSync')), true);
  assert.equal(hasFsCpSyncCall(createFsSyncPart3CallAst('cpSync')), true);
});

test('syncPart3 descarta objeto distinto de fs', () => {
  assert.equal(
    hasFsReadlinkSyncCall(createFsSyncPart3CallAst('readlinkSync', { objectName: 'fsp' })),
    false
  );
  assert.equal(
    hasFsCpSyncCall(createFsSyncPart3CallAst('cpSync', { objectName: 'fsp' })),
    false
  );
});

test('syncPart3 descarta propiedades computed', () => {
  assert.equal(
    hasFsFsyncSyncCall(createFsSyncPart3CallAst('fsyncSync', { computed: true })),
    false
  );
  assert.equal(
    hasFsCpSyncCall(createFsSyncPart3CallAst('cpSync', { computed: true })),
    false
  );
});

test('syncPart3 no cruza metodos entre detectores', () => {
  assert.equal(hasFsReadlinkSyncCall(createFsSyncPart3CallAst('symlinkSync')), false);
  assert.equal(hasFsFsyncSyncCall(createFsSyncPart3CallAst('fdatasyncSync')), false);
  assert.equal(hasFsCpSyncCall(createFsSyncPart3CallAst('openSync')), false);
});
