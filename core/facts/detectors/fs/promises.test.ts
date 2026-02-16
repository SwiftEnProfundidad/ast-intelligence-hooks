import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasFsPromisesAppendFileCall,
  hasFsPromisesMkdirCall,
  hasFsPromisesOpenCall,
  hasFsPromisesReadFileCall,
  hasFsPromisesRmCall,
  hasFsPromisesWriteFileCall,
} from './promises';

const createFsPromisesCallAst = (
  methodName: string,
  options?: {
    computedMethod?: boolean;
    computedPromises?: boolean;
    fsObjectName?: string;
    promisesPropertyName?: string;
  }
) => {
  const computedMethod = options?.computedMethod === true;
  const computedPromises = options?.computedPromises === true;
  const fsObjectName = options?.fsObjectName ?? 'fs';
  const promisesPropertyName = options?.promisesPropertyName ?? 'promises';

  return {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: computedMethod,
      object: {
        type: 'MemberExpression',
        computed: computedPromises,
        object: { type: 'Identifier', name: fsObjectName },
        property: computedPromises
          ? { type: 'StringLiteral', value: promisesPropertyName }
          : { type: 'Identifier', name: promisesPropertyName },
      },
      property: computedMethod
        ? { type: 'StringLiteral', value: methodName }
        : { type: 'Identifier', name: methodName },
    },
    arguments: [{ type: 'StringLiteral', value: '/tmp/file.txt' }],
  };
};

test('detectores fs.promises detectan llamadas esperadas', () => {
  assert.equal(hasFsPromisesWriteFileCall(createFsPromisesCallAst('writeFile')), true);
  assert.equal(hasFsPromisesAppendFileCall(createFsPromisesCallAst('appendFile')), true);
  assert.equal(hasFsPromisesRmCall(createFsPromisesCallAst('rm')), true);
  assert.equal(hasFsPromisesReadFileCall(createFsPromisesCallAst('readFile')), true);
  assert.equal(hasFsPromisesMkdirCall(createFsPromisesCallAst('mkdir')), true);
  assert.equal(hasFsPromisesOpenCall(createFsPromisesCallAst('open')), true);
});

test('detectores fs.promises soportan propiedades computed', () => {
  assert.equal(
    hasFsPromisesWriteFileCall(
      createFsPromisesCallAst('writeFile', { computedPromises: true, computedMethod: true })
    ),
    true
  );
  assert.equal(
    hasFsPromisesReadFileCall(
      createFsPromisesCallAst('readFile', { computedPromises: true, computedMethod: true })
    ),
    true
  );
});

test('detectores fs.promises descartan objetos y rutas no validas', () => {
  assert.equal(
    hasFsPromisesWriteFileCall(createFsPromisesCallAst('writeFile', { fsObjectName: 'fsp' })),
    false
  );
  assert.equal(
    hasFsPromisesReadFileCall(
      createFsPromisesCallAst('readFile', { promisesPropertyName: 'promise' })
    ),
    false
  );
});

test('detectores fs.promises descartan metodos distintos al detector', () => {
  assert.equal(hasFsPromisesWriteFileCall(createFsPromisesCallAst('appendFile')), false);
  assert.equal(hasFsPromisesRmCall(createFsPromisesCallAst('unlink')), false);
  assert.equal(hasFsPromisesMkdirCall(createFsPromisesCallAst('mkdtemp')), false);
});
