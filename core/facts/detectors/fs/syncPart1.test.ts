import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasFsMkdirSyncCall,
  hasFsStatSyncCall,
  hasFsUtimesSyncCall,
  hasFsWriteFileSyncCall,
} from './syncPart1';

const createFsSyncCallAst = (
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

test('syncPart1 reexporta detectores y detecta fs.statSync', () => {
  assert.equal(hasFsStatSyncCall(createFsSyncCallAst('statSync')), true);
  assert.equal(hasFsStatSyncCall(createFsSyncCallAst('lstatSync')), false);
});

test('syncPart1 detecta fs.writeFileSync y descarta objeto distinto', () => {
  assert.equal(hasFsWriteFileSyncCall(createFsSyncCallAst('writeFileSync')), true);
  assert.equal(
    hasFsWriteFileSyncCall(createFsSyncCallAst('writeFileSync', { objectName: 'fsp' })),
    false
  );
});

test('syncPart1 detecta fs.mkdirSync y descarta propiedades computed', () => {
  assert.equal(hasFsMkdirSyncCall(createFsSyncCallAst('mkdirSync')), true);
  assert.equal(hasFsMkdirSyncCall(createFsSyncCallAst('mkdirSync', { computed: true })), false);
});

test('syncPart1 detecta fs.utimesSync y descarta metodos distintos', () => {
  assert.equal(hasFsUtimesSyncCall(createFsSyncCallAst('utimesSync')), true);
  assert.equal(hasFsUtimesSyncCall(createFsSyncCallAst('futimesSync')), false);
});
