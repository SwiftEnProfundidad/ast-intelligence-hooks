import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasDocumentWriteCall,
  hasInnerHtmlAssignment,
  hasInsertAdjacentHtmlCall,
} from './index';

test('hasInnerHtmlAssignment detecta asignacion directa a innerHTML', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'AssignmentExpression',
          left: {
            type: 'MemberExpression',
            computed: false,
            object: { type: 'Identifier', name: 'element' },
            property: { type: 'Identifier', name: 'innerHTML' },
          },
          right: { type: 'StringLiteral', value: '<div>x</div>' },
        },
      },
    ],
  };

  assert.equal(hasInnerHtmlAssignment(ast), true);
});

test('hasInnerHtmlAssignment detecta acceso computed con StringLiteral', () => {
  const ast = {
    type: 'AssignmentExpression',
    left: {
      type: 'MemberExpression',
      computed: true,
      object: { type: 'Identifier', name: 'target' },
      property: { type: 'StringLiteral', value: 'innerHTML' },
    },
    right: { type: 'Identifier', name: 'payload' },
  };

  assert.equal(hasInnerHtmlAssignment(ast), true);
});

test('hasInnerHtmlAssignment no detecta propiedades distintas', () => {
  const ast = {
    type: 'AssignmentExpression',
    left: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'element' },
      property: { type: 'Identifier', name: 'textContent' },
    },
    right: { type: 'StringLiteral', value: 'safe' },
  };

  assert.equal(hasInnerHtmlAssignment(ast), false);
});

test('hasDocumentWriteCall detecta document.write no computed', () => {
  const ast = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'document' },
      property: { type: 'Identifier', name: 'write' },
    },
    arguments: [{ type: 'StringLiteral', value: '<script>alert(1)</script>' }],
  };

  assert.equal(hasDocumentWriteCall(ast), true);
});

test('hasDocumentWriteCall ignora member expressions computed', () => {
  const ast = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: true,
      object: { type: 'Identifier', name: 'document' },
      property: { type: 'StringLiteral', value: 'write' },
    },
    arguments: [],
  };

  assert.equal(hasDocumentWriteCall(ast), false);
});

test('hasInsertAdjacentHtmlCall detecta propiedad insertAdjacentHTML', () => {
  const directAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'node' },
      property: { type: 'Identifier', name: 'insertAdjacentHTML' },
    },
    arguments: [],
  };
  const computedAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: true,
      object: { type: 'Identifier', name: 'node' },
      property: { type: 'StringLiteral', value: 'insertAdjacentHTML' },
    },
    arguments: [],
  };

  assert.equal(hasInsertAdjacentHtmlCall(directAst), true);
  assert.equal(hasInsertAdjacentHtmlCall(computedAst), true);
});

test('hasInsertAdjacentHtmlCall no detecta metodos distintos', () => {
  const ast = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'node' },
      property: { type: 'Identifier', name: 'insertAdjacentText' },
    },
    arguments: [],
  };

  assert.equal(hasInsertAdjacentHtmlCall(ast), false);
});
