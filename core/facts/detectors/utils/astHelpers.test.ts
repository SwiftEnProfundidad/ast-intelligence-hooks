import assert from 'node:assert/strict';
import test from 'node:test';
import { collectNodeLineMatches, hasNode, isObject } from './astHelpers';

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

test('collectNodeLineMatches devuelve lineas ordenadas y unicas para nodos coincidentes', () => {
  const ast = {
    type: 'Program',
    loc: { start: { line: 1 }, end: { line: 6 } },
    body: [
      {
        type: 'CatchClause',
        loc: { start: { line: 2 }, end: { line: 2 } },
      },
      {
        type: 'CatchClause',
        loc: { start: { line: 4 }, end: { line: 4 } },
      },
      {
        type: 'CatchClause',
        loc: { start: { line: 4 }, end: { line: 4 } },
      },
    ],
  };

  assert.deepEqual(
    collectNodeLineMatches(ast, (value) => value.type === 'CatchClause'),
    [2, 4]
  );
});

test('collectNodeLineMatches respeta maximo de lineas', () => {
  const ast = {
    type: 'Program',
    body: [
      { type: 'CallExpression', loc: { start: { line: 10 }, end: { line: 10 } } },
      { type: 'CallExpression', loc: { start: { line: 20 }, end: { line: 20 } } },
      { type: 'CallExpression', loc: { start: { line: 30 }, end: { line: 30 } } },
    ],
  };

  assert.deepEqual(
    collectNodeLineMatches(ast, (value) => value.type === 'CallExpression', { max: 2 }),
    [10, 20]
  );
});
