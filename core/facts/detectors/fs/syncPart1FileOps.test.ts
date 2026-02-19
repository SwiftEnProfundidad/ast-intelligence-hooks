import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasFsCopyFileSyncCall,
  hasFsReadFileSyncCall,
  hasFsRenameSyncCall,
  hasFsWriteFileSyncCall,
} from './syncPart1FileOps';

const createFsFileOpsCallAst = (
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

test('syncPart1FileOps detecta llamadas fs.*Sync esperadas', () => {
  assert.equal(hasFsWriteFileSyncCall(createFsFileOpsCallAst('writeFileSync')), true);
  assert.equal(hasFsReadFileSyncCall(createFsFileOpsCallAst('readFileSync')), true);
  assert.equal(hasFsRenameSyncCall(createFsFileOpsCallAst('renameSync')), true);
  assert.equal(hasFsCopyFileSyncCall(createFsFileOpsCallAst('copyFileSync')), true);
});

test('syncPart1FileOps descarta objeto distinto de fs', () => {
  assert.equal(
    hasFsWriteFileSyncCall(createFsFileOpsCallAst('writeFileSync', { objectName: 'fsp' })),
    false
  );
  assert.equal(
    hasFsCopyFileSyncCall(createFsFileOpsCallAst('copyFileSync', { objectName: 'fsp' })),
    false
  );
});

test('syncPart1FileOps descarta propiedades computed', () => {
  assert.equal(
    hasFsReadFileSyncCall(createFsFileOpsCallAst('readFileSync', { computed: true })),
    false
  );
  assert.equal(
    hasFsRenameSyncCall(createFsFileOpsCallAst('renameSync', { computed: true })),
    false
  );
});

test('syncPart1FileOps no cruza metodos entre detectores', () => {
  assert.equal(hasFsReadFileSyncCall(createFsFileOpsCallAst('writeFileSync')), false);
  assert.equal(hasFsRenameSyncCall(createFsFileOpsCallAst('copyFileSync')), false);
  assert.equal(hasFsCopyFileSyncCall(createFsFileOpsCallAst('renameSync')), false);
});
