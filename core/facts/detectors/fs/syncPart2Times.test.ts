import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasFsFtruncateSyncCall,
  hasFsFutimesSyncCall,
  hasFsLutimesSyncCall,
  hasFsTruncateSyncCall,
} from './syncPart2Times';

const createFsSyncPart2TimesCallAst = (
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

test('syncPart2Times detecta llamadas fs.*Sync esperadas', () => {
  assert.equal(hasFsTruncateSyncCall(createFsSyncPart2TimesCallAst('truncateSync')), true);
  assert.equal(hasFsFtruncateSyncCall(createFsSyncPart2TimesCallAst('ftruncateSync')), true);
  assert.equal(hasFsFutimesSyncCall(createFsSyncPart2TimesCallAst('futimesSync')), true);
  assert.equal(hasFsLutimesSyncCall(createFsSyncPart2TimesCallAst('lutimesSync')), true);
});

test('syncPart2Times descarta objeto distinto de fs', () => {
  assert.equal(
    hasFsTruncateSyncCall(createFsSyncPart2TimesCallAst('truncateSync', { objectName: 'fsp' })),
    false
  );
  assert.equal(
    hasFsLutimesSyncCall(createFsSyncPart2TimesCallAst('lutimesSync', { objectName: 'fsp' })),
    false
  );
});

test('syncPart2Times descarta propiedades computed', () => {
  assert.equal(
    hasFsFtruncateSyncCall(
      createFsSyncPart2TimesCallAst('ftruncateSync', { computed: true })
    ),
    false
  );
  assert.equal(
    hasFsFutimesSyncCall(createFsSyncPart2TimesCallAst('futimesSync', { computed: true })),
    false
  );
});

test('syncPart2Times no cruza metodos entre detectores', () => {
  assert.equal(hasFsTruncateSyncCall(createFsSyncPart2TimesCallAst('ftruncateSync')), false);
  assert.equal(hasFsFtruncateSyncCall(createFsSyncPart2TimesCallAst('truncateSync')), false);
  assert.equal(hasFsFutimesSyncCall(createFsSyncPart2TimesCallAst('lutimesSync')), false);
});
