import assert from 'node:assert/strict';
import test from 'node:test';
import { hasNode, isObject } from './astHelpers';

test('isObject devuelve true para objetos y arrays, false para null y primitivos', () => {
  assert.equal(isObject({ key: 'value' }), true);
  assert.equal(isObject([]), true);
  assert.equal(isObject(null), false);
  assert.equal(isObject('value'), false);
  assert.equal(isObject(10), false);
});

test('hasNode devuelve false cuando la raiz no es un objeto', () => {
  assert.equal(hasNode(null, () => true), false);
  assert.equal(hasNode('text', () => true), false);
  assert.equal(hasNode(42, () => true), false);
});

test('hasNode encuentra coincidencias en la raiz y en nodos anidados', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: 'targetCall',
          },
          arguments: [],
        },
      },
    ],
  };

  assert.equal(hasNode(ast, (value) => value.type === 'Program'), true);
  assert.equal(
    hasNode(
      ast,
      (value) => value.type === 'Identifier' && value.name === 'targetCall'
    ),
    true
  );
});

test('hasNode recorre arrays y objetos anidados y descarta cuando no hay match', () => {
  const ast = {
    type: 'Root',
    sections: [
      {
        type: 'Section',
        nodes: [
          { type: 'Literal', value: 'a' },
          { type: 'Literal', value: 'b' },
        ],
      },
      {
        type: 'Section',
        payload: {
          type: 'NestedPayload',
          child: {
            type: 'Identifier',
            name: 'needle',
          },
        },
      },
    ],
  };

  assert.equal(
    hasNode(ast, (value) => value.type === 'Identifier' && value.name === 'needle'),
    true
  );
  assert.equal(
    hasNode(ast, (value) => value.type === 'Identifier' && value.name === 'missing'),
    false
  );
});
