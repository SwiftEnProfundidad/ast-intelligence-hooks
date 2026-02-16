import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasAsyncPromiseExecutor,
  hasConsoleErrorCall,
  hasConsoleLogCall,
  hasDebuggerStatement,
  hasDeleteOperator,
  hasEmptyCatchClause,
  hasEvalCall,
  hasExplicitAnyType,
  hasFunctionConstructorUsage,
  hasSetIntervalStringCallback,
  hasSetTimeoutStringCallback,
  hasWithStatement,
} from './index';

test('hasEmptyCatchClause detecta catch vacio y descarta catch con cuerpo', () => {
  const emptyCatchAst = {
    type: 'CatchClause',
    body: { type: 'BlockStatement', body: [] },
  };
  const nonEmptyCatchAst = {
    type: 'CatchClause',
    body: {
      type: 'BlockStatement',
      body: [{ type: 'ExpressionStatement' }],
    },
  };

  assert.equal(hasEmptyCatchClause(emptyCatchAst), true);
  assert.equal(hasEmptyCatchClause(nonEmptyCatchAst), false);
});

test('hasExplicitAnyType detecta TSAnyKeyword', () => {
  const anyAst = {
    type: 'TSTypeAnnotation',
    typeAnnotation: { type: 'TSAnyKeyword' },
  };
  const unknownAst = {
    type: 'TSTypeAnnotation',
    typeAnnotation: { type: 'TSUnknownKeyword' },
  };

  assert.equal(hasExplicitAnyType(anyAst), true);
  assert.equal(hasExplicitAnyType(unknownAst), false);
});

test('hasConsoleLogCall detecta console.log y descarta variantes no soportadas', () => {
  const logAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'console' },
      property: { type: 'Identifier', name: 'log' },
    },
    arguments: [{ type: 'StringLiteral', value: 'x' }],
  };
  const computedAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: true,
      object: { type: 'Identifier', name: 'console' },
      property: { type: 'StringLiteral', value: 'log' },
    },
    arguments: [],
  };

  assert.equal(hasConsoleLogCall(logAst), true);
  assert.equal(hasConsoleLogCall(computedAst), false);
});

test('hasConsoleErrorCall detecta console.error y descarta metodos distintos', () => {
  const errorAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'console' },
      property: { type: 'Identifier', name: 'error' },
    },
    arguments: [{ type: 'Identifier', name: 'err' }],
  };
  const warnAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'console' },
      property: { type: 'Identifier', name: 'warn' },
    },
    arguments: [{ type: 'Identifier', name: 'err' }],
  };

  assert.equal(hasConsoleErrorCall(errorAst), true);
  assert.equal(hasConsoleErrorCall(warnAst), false);
});

test('hasEvalCall detecta eval directo y descarta member eval', () => {
  const directEvalAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'eval' },
    arguments: [{ type: 'StringLiteral', value: 'alert(1)' }],
  };
  const memberEvalAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'window' },
      property: { type: 'Identifier', name: 'eval' },
    },
    arguments: [{ type: 'StringLiteral', value: 'alert(1)' }],
  };

  assert.equal(hasEvalCall(directEvalAst), true);
  assert.equal(hasEvalCall(memberEvalAst), false);
});

test('hasFunctionConstructorUsage detecta new Function y descarta otros constructores', () => {
  const functionCtorAst = {
    type: 'NewExpression',
    callee: { type: 'Identifier', name: 'Function' },
    arguments: [{ type: 'StringLiteral', value: 'return 1;' }],
  };
  const otherCtorAst = {
    type: 'NewExpression',
    callee: { type: 'Identifier', name: 'Fn' },
    arguments: [],
  };

  assert.equal(hasFunctionConstructorUsage(functionCtorAst), true);
  assert.equal(hasFunctionConstructorUsage(otherCtorAst), false);
});

test('hasSetTimeoutStringCallback detecta callback string y template literal plano', () => {
  const stringAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'setTimeout' },
    arguments: [{ type: 'StringLiteral', value: 'work()' }, { type: 'NumericLiteral', value: 10 }],
  };
  const plainTemplateAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'setTimeout' },
    arguments: [
      {
        type: 'TemplateLiteral',
        expressions: [],
        quasis: [{ type: 'TemplateElement', value: { cooked: 'work()' } }],
      },
    ],
  };
  const fnAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'setTimeout' },
    arguments: [{ type: 'ArrowFunctionExpression', async: false }],
  };

  assert.equal(hasSetTimeoutStringCallback(stringAst), true);
  assert.equal(hasSetTimeoutStringCallback(plainTemplateAst), true);
  assert.equal(hasSetTimeoutStringCallback(fnAst), false);
});

test('hasSetIntervalStringCallback detecta callback string y descarta callback funcion', () => {
  const stringAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'setInterval' },
    arguments: [{ type: 'StringLiteral', value: 'tick()' }, { type: 'NumericLiteral', value: 100 }],
  };
  const fnAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'setInterval' },
    arguments: [{ type: 'FunctionExpression', async: false }],
  };

  assert.equal(hasSetIntervalStringCallback(stringAst), true);
  assert.equal(hasSetIntervalStringCallback(fnAst), false);
});

test('hasAsyncPromiseExecutor detecta ejecutor async en new Promise', () => {
  const asyncExecutorAst = {
    type: 'NewExpression',
    callee: { type: 'Identifier', name: 'Promise' },
    arguments: [{ type: 'ArrowFunctionExpression', async: true }],
  };
  const syncExecutorAst = {
    type: 'NewExpression',
    callee: { type: 'Identifier', name: 'Promise' },
    arguments: [{ type: 'ArrowFunctionExpression', async: false }],
  };

  assert.equal(hasAsyncPromiseExecutor(asyncExecutorAst), true);
  assert.equal(hasAsyncPromiseExecutor(syncExecutorAst), false);
});

test('hasWithStatement detecta with y hasDeleteOperator detecta operador delete', () => {
  const withAst = {
    type: 'Program',
    body: [{ type: 'WithStatement' }],
  };
  const deleteAst = {
    type: 'UnaryExpression',
    operator: 'delete',
    argument: { type: 'Identifier', name: 'obj' },
  };
  const typeofAst = {
    type: 'UnaryExpression',
    operator: 'typeof',
    argument: { type: 'Identifier', name: 'obj' },
  };

  assert.equal(hasWithStatement(withAst), true);
  assert.equal(hasDeleteOperator(deleteAst), true);
  assert.equal(hasDeleteOperator(typeofAst), false);
});

test('hasDebuggerStatement detecta nodos debugger', () => {
  const debuggerAst = {
    type: 'Program',
    body: [{ type: 'DebuggerStatement' }],
  };
  const noDebuggerAst = {
    type: 'Program',
    body: [{ type: 'ExpressionStatement' }],
  };

  assert.equal(hasDebuggerStatement(debuggerAst), true);
  assert.equal(hasDebuggerStatement(noDebuggerAst), false);
});
