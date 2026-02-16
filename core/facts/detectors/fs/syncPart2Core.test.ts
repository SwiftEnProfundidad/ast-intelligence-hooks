import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasFsFstatSyncCall,
  hasFsRmdirSyncCall,
  hasFsUnlinkSyncCall,
} from './syncPart2Core';

const createFsSyncPart2CoreCallAst = (
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

test('syncPart2Core detecta llamadas fs.*Sync esperadas', () => {
  assert.equal(hasFsUnlinkSyncCall(createFsSyncPart2CoreCallAst('unlinkSync')), true);
  assert.equal(hasFsRmdirSyncCall(createFsSyncPart2CoreCallAst('rmdirSync')), true);
  assert.equal(hasFsFstatSyncCall(createFsSyncPart2CoreCallAst('fstatSync')), true);
});

test('syncPart2Core descarta objeto distinto de fs', () => {
  assert.equal(
    hasFsUnlinkSyncCall(createFsSyncPart2CoreCallAst('unlinkSync', { objectName: 'fsp' })),
    false
  );
  assert.equal(
    hasFsFstatSyncCall(createFsSyncPart2CoreCallAst('fstatSync', { objectName: 'fsp' })),
    false
  );
});

test('syncPart2Core descarta propiedades computed', () => {
  assert.equal(
    hasFsRmdirSyncCall(createFsSyncPart2CoreCallAst('rmdirSync', { computed: true })),
    false
  );
  assert.equal(
    hasFsFstatSyncCall(createFsSyncPart2CoreCallAst('fstatSync', { computed: true })),
    false
  );
});

test('syncPart2Core no cruza metodos entre detectores', () => {
  assert.equal(hasFsUnlinkSyncCall(createFsSyncPart2CoreCallAst('rmdirSync')), false);
  assert.equal(hasFsRmdirSyncCall(createFsSyncPart2CoreCallAst('unlinkSync')), false);
  assert.equal(hasFsFstatSyncCall(createFsSyncPart2CoreCallAst('statSync')), false);
});
