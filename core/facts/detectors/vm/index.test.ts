import assert from 'node:assert/strict';
import test from 'node:test';
import { hasVmDynamicCodeExecutionCall } from './index';

test('hasVmDynamicCodeExecutionCall detecta llamadas directas por identificador', () => {
  const ast = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'runInNewContext' },
    arguments: [{ type: 'StringLiteral', value: 'code' }],
  };

  assert.equal(hasVmDynamicCodeExecutionCall(ast), true);
});

test('hasVmDynamicCodeExecutionCall detecta MemberExpression no computed', () => {
  const ast = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'vm' },
      property: { type: 'Identifier', name: 'runInThisContext' },
    },
    arguments: [{ type: 'StringLiteral', value: 'code' }],
  };

  assert.equal(hasVmDynamicCodeExecutionCall(ast), true);
});

test('hasVmDynamicCodeExecutionCall detecta MemberExpression computed', () => {
  const ast = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: true,
      object: { type: 'Identifier', name: 'vm' },
      property: { type: 'StringLiteral', value: 'runInNewContext' },
    },
    arguments: [{ type: 'StringLiteral', value: 'code' }],
  };

  assert.equal(hasVmDynamicCodeExecutionCall(ast), true);
});

test('hasVmDynamicCodeExecutionCall descarta llamadas no objetivo', () => {
  const ast = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'vm' },
      property: { type: 'Identifier', name: 'createContext' },
    },
    arguments: [],
  };

  assert.equal(hasVmDynamicCodeExecutionCall(ast), false);
});
