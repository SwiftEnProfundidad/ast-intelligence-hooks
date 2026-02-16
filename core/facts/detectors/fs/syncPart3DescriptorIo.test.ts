import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasFsCloseSyncCall,
  hasFsFdatasyncSyncCall,
  hasFsFsyncSyncCall,
  hasFsReadSyncCall,
} from './syncPart3DescriptorIo';

const createFsSyncPart3DescriptorIoCallAst = (
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

test('syncPart3DescriptorIo detecta llamadas fs.*Sync esperadas', () => {
  assert.equal(hasFsFsyncSyncCall(createFsSyncPart3DescriptorIoCallAst('fsyncSync')), true);
  assert.equal(
    hasFsFdatasyncSyncCall(createFsSyncPart3DescriptorIoCallAst('fdatasyncSync')),
    true
  );
  assert.equal(hasFsCloseSyncCall(createFsSyncPart3DescriptorIoCallAst('closeSync')), true);
  assert.equal(hasFsReadSyncCall(createFsSyncPart3DescriptorIoCallAst('readSync')), true);
});

test('syncPart3DescriptorIo descarta objeto distinto de fs', () => {
  assert.equal(
    hasFsFsyncSyncCall(createFsSyncPart3DescriptorIoCallAst('fsyncSync', { objectName: 'fsp' })),
    false
  );
  assert.equal(
    hasFsReadSyncCall(createFsSyncPart3DescriptorIoCallAst('readSync', { objectName: 'fsp' })),
    false
  );
});

test('syncPart3DescriptorIo descarta propiedades computed', () => {
  assert.equal(
    hasFsFdatasyncSyncCall(
      createFsSyncPart3DescriptorIoCallAst('fdatasyncSync', { computed: true })
    ),
    false
  );
  assert.equal(
    hasFsCloseSyncCall(createFsSyncPart3DescriptorIoCallAst('closeSync', { computed: true })),
    false
  );
});

test('syncPart3DescriptorIo no cruza metodos entre detectores', () => {
  assert.equal(hasFsFsyncSyncCall(createFsSyncPart3DescriptorIoCallAst('fdatasyncSync')), false);
  assert.equal(hasFsCloseSyncCall(createFsSyncPart3DescriptorIoCallAst('readSync')), false);
  assert.equal(hasFsReadSyncCall(createFsSyncPart3DescriptorIoCallAst('closeSync')), false);
});
