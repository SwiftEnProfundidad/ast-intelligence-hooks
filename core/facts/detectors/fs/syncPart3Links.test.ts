import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasFsLinkSyncCall,
  hasFsReadlinkSyncCall,
  hasFsSymlinkSyncCall,
} from './syncPart3Links';

const createFsSyncPart3LinksCallAst = (
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

test('syncPart3Links detecta llamadas fs.*Sync esperadas', () => {
  assert.equal(hasFsReadlinkSyncCall(createFsSyncPart3LinksCallAst('readlinkSync')), true);
  assert.equal(hasFsSymlinkSyncCall(createFsSyncPart3LinksCallAst('symlinkSync')), true);
  assert.equal(hasFsLinkSyncCall(createFsSyncPart3LinksCallAst('linkSync')), true);
});

test('syncPart3Links descarta objeto distinto de fs', () => {
  assert.equal(
    hasFsReadlinkSyncCall(createFsSyncPart3LinksCallAst('readlinkSync', { objectName: 'fsp' })),
    false
  );
  assert.equal(
    hasFsLinkSyncCall(createFsSyncPart3LinksCallAst('linkSync', { objectName: 'fsp' })),
    false
  );
});

test('syncPart3Links descarta propiedades computed', () => {
  assert.equal(
    hasFsSymlinkSyncCall(createFsSyncPart3LinksCallAst('symlinkSync', { computed: true })),
    false
  );
  assert.equal(
    hasFsLinkSyncCall(createFsSyncPart3LinksCallAst('linkSync', { computed: true })),
    false
  );
});

test('syncPart3Links no cruza metodos entre detectores', () => {
  assert.equal(hasFsReadlinkSyncCall(createFsSyncPart3LinksCallAst('symlinkSync')), false);
  assert.equal(hasFsSymlinkSyncCall(createFsSyncPart3LinksCallAst('linkSync')), false);
  assert.equal(hasFsLinkSyncCall(createFsSyncPart3LinksCallAst('readlinkSync')), false);
});
