import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasFsAppendFileSyncCall,
  hasFsCpSyncCall,
  hasFsMkdtempSyncCall,
  hasFsOpenSyncCall,
  hasFsOpendirSyncCall,
} from './syncPart3PathOps';

const createFsSyncPart3PathOpsCallAst = (
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

test('syncPart3PathOps detecta llamadas fs.*Sync esperadas', () => {
  assert.equal(hasFsCpSyncCall(createFsSyncPart3PathOpsCallAst('cpSync')), true);
  assert.equal(hasFsOpenSyncCall(createFsSyncPart3PathOpsCallAst('openSync')), true);
  assert.equal(hasFsOpendirSyncCall(createFsSyncPart3PathOpsCallAst('opendirSync')), true);
  assert.equal(hasFsMkdtempSyncCall(createFsSyncPart3PathOpsCallAst('mkdtempSync')), true);
  assert.equal(hasFsAppendFileSyncCall(createFsSyncPart3PathOpsCallAst('appendFileSync')), true);
});

test('syncPart3PathOps descarta objeto distinto de fs', () => {
  assert.equal(
    hasFsCpSyncCall(createFsSyncPart3PathOpsCallAst('cpSync', { objectName: 'fsp' })),
    false
  );
  assert.equal(
    hasFsAppendFileSyncCall(
      createFsSyncPart3PathOpsCallAst('appendFileSync', { objectName: 'fsp' })
    ),
    false
  );
});

test('syncPart3PathOps descarta propiedades computed', () => {
  assert.equal(
    hasFsOpenSyncCall(createFsSyncPart3PathOpsCallAst('openSync', { computed: true })),
    false
  );
  assert.equal(
    hasFsMkdtempSyncCall(createFsSyncPart3PathOpsCallAst('mkdtempSync', { computed: true })),
    false
  );
});

test('syncPart3PathOps no cruza metodos entre detectores', () => {
  assert.equal(hasFsCpSyncCall(createFsSyncPart3PathOpsCallAst('openSync')), false);
  assert.equal(hasFsOpenSyncCall(createFsSyncPart3PathOpsCallAst('cpSync')), false);
  assert.equal(hasFsOpendirSyncCall(createFsSyncPart3PathOpsCallAst('mkdtempSync')), false);
  assert.equal(
    hasFsAppendFileSyncCall(createFsSyncPart3PathOpsCallAst('writeFileSync')),
    false
  );
});
