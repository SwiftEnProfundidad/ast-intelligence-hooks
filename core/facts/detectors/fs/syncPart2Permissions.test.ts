import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasFsChmodSyncCall,
  hasFsChownSyncCall,
  hasFsFchmodSyncCall,
  hasFsFchownSyncCall,
} from './syncPart2Permissions';

const createFsSyncPart2PermissionsCallAst = (
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

test('syncPart2Permissions detecta llamadas fs.*Sync esperadas', () => {
  assert.equal(hasFsChmodSyncCall(createFsSyncPart2PermissionsCallAst('chmodSync')), true);
  assert.equal(hasFsChownSyncCall(createFsSyncPart2PermissionsCallAst('chownSync')), true);
  assert.equal(hasFsFchownSyncCall(createFsSyncPart2PermissionsCallAst('fchownSync')), true);
  assert.equal(hasFsFchmodSyncCall(createFsSyncPart2PermissionsCallAst('fchmodSync')), true);
});

test('syncPart2Permissions descarta objeto distinto de fs', () => {
  assert.equal(
    hasFsChmodSyncCall(createFsSyncPart2PermissionsCallAst('chmodSync', { objectName: 'fsp' })),
    false
  );
  assert.equal(
    hasFsFchmodSyncCall(
      createFsSyncPart2PermissionsCallAst('fchmodSync', { objectName: 'fsp' })
    ),
    false
  );
});

test('syncPart2Permissions descarta propiedades computed', () => {
  assert.equal(
    hasFsChownSyncCall(createFsSyncPart2PermissionsCallAst('chownSync', { computed: true })),
    false
  );
  assert.equal(
    hasFsFchownSyncCall(createFsSyncPart2PermissionsCallAst('fchownSync', { computed: true })),
    false
  );
});

test('syncPart2Permissions no cruza metodos entre detectores', () => {
  assert.equal(hasFsChmodSyncCall(createFsSyncPart2PermissionsCallAst('chownSync')), false);
  assert.equal(hasFsChownSyncCall(createFsSyncPart2PermissionsCallAst('chmodSync')), false);
  assert.equal(hasFsFchmodSyncCall(createFsSyncPart2PermissionsCallAst('fchownSync')), false);
});
