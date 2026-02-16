import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasFsReadlinkSyncCall,
  hasFsStatSyncCall,
  hasFsUnlinkSyncCall,
} from './sync';

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

test('sync barrel expone detectores de part1, part2 y part3', () => {
  assert.equal(hasFsStatSyncCall(createFsSyncCallAst('statSync')), true);
  assert.equal(hasFsUnlinkSyncCall(createFsSyncCallAst('unlinkSync')), true);
  assert.equal(hasFsReadlinkSyncCall(createFsSyncCallAst('readlinkSync')), true);
});

test('sync barrel descarta objetos distintos de fs', () => {
  assert.equal(hasFsStatSyncCall(createFsSyncCallAst('statSync', { objectName: 'fsp' })), false);
  assert.equal(
    hasFsUnlinkSyncCall(createFsSyncCallAst('unlinkSync', { objectName: 'fsp' })),
    false
  );
});

test('sync barrel descarta propiedades computed y metodos no coincidentes', () => {
  assert.equal(hasFsReadlinkSyncCall(createFsSyncCallAst('readlinkSync', { computed: true })), false);
  assert.equal(hasFsStatSyncCall(createFsSyncCallAst('lstatSync')), false);
  assert.equal(hasFsUnlinkSyncCall(createFsSyncCallAst('rmdirSync')), false);
});
