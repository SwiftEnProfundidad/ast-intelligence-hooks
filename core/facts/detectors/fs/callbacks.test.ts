import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasFsFstatCallbackCall,
  hasFsReadFileCallbackCall,
  hasFsRmCallbackCall,
  hasFsWatchCallbackCall,
  hasFsWriteFileCallbackCall,
  hasFsWritevCallbackCall,
} from './callbacks';

const createFsCallbackCallAst = (
  methodName: string,
  options?: {
    computed?: boolean;
    callbackType?: 'ArrowFunctionExpression' | 'FunctionExpression' | 'Identifier';
    objectName?: string;
  }
) => {
  const computed = options?.computed === true;
  const callbackType = options?.callbackType ?? 'ArrowFunctionExpression';
  const objectName = options?.objectName ?? 'fs';

  const callbackArg =
    callbackType === 'Identifier'
      ? { type: 'Identifier', name: 'cb' }
      : { type: callbackType, async: false, params: [], body: { type: 'BlockStatement', body: [] } };

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
    arguments: [{ type: 'StringLiteral', value: '/tmp/file.txt' }, callbackArg],
  };
};

test('detectores callback de fs detectan llamadas esperadas', () => {
  assert.equal(hasFsReadFileCallbackCall(createFsCallbackCallAst('readFile')), true);
  assert.equal(hasFsWriteFileCallbackCall(createFsCallbackCallAst('writeFile')), true);
  assert.equal(hasFsWatchCallbackCall(createFsCallbackCallAst('watch')), true);
  assert.equal(hasFsRmCallbackCall(createFsCallbackCallAst('rm')), true);
  assert.equal(hasFsFstatCallbackCall(createFsCallbackCallAst('fstat')), true);
  assert.equal(hasFsWritevCallbackCall(createFsCallbackCallAst('writev')), true);
});

test('detectores callback de fs soportan propiedades computed con StringLiteral', () => {
  assert.equal(hasFsReadFileCallbackCall(createFsCallbackCallAst('readFile', { computed: true })), true);
  assert.equal(hasFsRmCallbackCall(createFsCallbackCallAst('rm', { computed: true })), true);
  assert.equal(hasFsWritevCallbackCall(createFsCallbackCallAst('writev', { computed: true })), true);
});

test('detectores callback de fs descartan llamadas sin callback function', () => {
  assert.equal(
    hasFsReadFileCallbackCall(createFsCallbackCallAst('readFile', { callbackType: 'Identifier' })),
    false
  );
  assert.equal(
    hasFsWriteFileCallbackCall(createFsCallbackCallAst('writeFile', { callbackType: 'Identifier' })),
    false
  );
});

test('detectores callback de fs descartan objetos distintos de fs o metodos distintos', () => {
  assert.equal(hasFsReadFileCallbackCall(createFsCallbackCallAst('readFile', { objectName: 'fsExtra' })), false);
  assert.equal(hasFsWriteFileCallbackCall(createFsCallbackCallAst('appendFile')), false);
  assert.equal(hasFsWatchCallbackCall(createFsCallbackCallAst('watchFile')), false);
});
