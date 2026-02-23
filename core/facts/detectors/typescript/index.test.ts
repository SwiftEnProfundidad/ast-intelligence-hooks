import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasAsyncPromiseExecutor,
  hasConcreteDependencyInstantiation,
  hasConsoleErrorCall,
  hasConsoleLogCall,
  hasDebuggerStatement,
  hasDeleteOperator,
  hasEmptyCatchClause,
  hasEvalCall,
  hasExplicitAnyType,
  hasFrameworkDependencyImport,
  hasFunctionConstructorUsage,
  hasNetworkCallWithoutErrorHandling,
  hasMixedCommandQueryClass,
  hasMixedCommandQueryInterface,
  hasRecordStringUnknownType,
  hasOverrideMethodThrowingNotImplemented,
  hasLargeClassDeclaration,
  hasSetIntervalStringCallback,
  hasSetTimeoutStringCallback,
  hasTypeDiscriminatorSwitch,
  hasUndefinedInBaseTypeUnion,
  hasUnknownTypeAssertion,
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

test('hasMixedCommandQueryClass detecta mezcla command/query en la misma clase', () => {
  const mixedClassAst = {
    type: 'ClassDeclaration',
    body: {
      type: 'ClassBody',
      body: [
        { type: 'ClassMethod', key: { type: 'Identifier', name: 'getById' } },
        { type: 'ClassMethod', key: { type: 'Identifier', name: 'save' } },
      ],
    },
  };
  const queryOnlyClassAst = {
    type: 'ClassDeclaration',
    body: {
      type: 'ClassBody',
      body: [{ type: 'ClassMethod', key: { type: 'Identifier', name: 'getById' } }],
    },
  };

  assert.equal(hasMixedCommandQueryClass(mixedClassAst), true);
  assert.equal(hasMixedCommandQueryClass(queryOnlyClassAst), false);
});

test('hasMixedCommandQueryInterface detecta mezcla command/query en la misma interfaz', () => {
  const mixedInterfaceAst = {
    type: 'TSInterfaceDeclaration',
    body: {
      type: 'TSInterfaceBody',
      body: [
        { type: 'TSMethodSignature', key: { type: 'Identifier', name: 'findById' } },
        { type: 'TSMethodSignature', key: { type: 'Identifier', name: 'create' } },
      ],
    },
  };
  const queryOnlyInterfaceAst = {
    type: 'TSInterfaceDeclaration',
    body: {
      type: 'TSInterfaceBody',
      body: [{ type: 'TSMethodSignature', key: { type: 'Identifier', name: 'findById' } }],
    },
  };

  assert.equal(hasMixedCommandQueryInterface(mixedInterfaceAst), true);
  assert.equal(hasMixedCommandQueryInterface(queryOnlyInterfaceAst), false);
});

test('hasTypeDiscriminatorSwitch detecta switch por tipo/kind con multiples cases', () => {
  const switchAst = {
    type: 'SwitchStatement',
    discriminant: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'event' },
      property: { type: 'Identifier', name: 'kind' },
    },
    cases: [
      { type: 'SwitchCase', test: { type: 'StringLiteral', value: 'a' } },
      { type: 'SwitchCase', test: { type: 'StringLiteral', value: 'b' } },
    ],
  };
  const nonDiscriminatorAst = {
    type: 'SwitchStatement',
    discriminant: { type: 'Identifier', name: 'index' },
    cases: [
      { type: 'SwitchCase', test: { type: 'NumericLiteral', value: 1 } },
      { type: 'SwitchCase', test: { type: 'NumericLiteral', value: 2 } },
    ],
  };

  assert.equal(hasTypeDiscriminatorSwitch(switchAst), true);
  assert.equal(hasTypeDiscriminatorSwitch(nonDiscriminatorAst), false);
});

test('hasOverrideMethodThrowingNotImplemented detecta override con throw not implemented', () => {
  const overrideThrowAst = {
    type: 'ClassMethod',
    override: true,
    body: {
      type: 'BlockStatement',
      body: [
        {
          type: 'ThrowStatement',
          argument: {
            type: 'NewExpression',
            callee: { type: 'Identifier', name: 'Error' },
            arguments: [{ type: 'StringLiteral', value: 'Not implemented' }],
          },
        },
      ],
    },
  };
  const overrideValidAst = {
    type: 'ClassMethod',
    override: true,
    body: {
      type: 'BlockStatement',
      body: [{ type: 'ReturnStatement', argument: { type: 'NumericLiteral', value: 1 } }],
    },
  };

  assert.equal(hasOverrideMethodThrowingNotImplemented(overrideThrowAst), true);
  assert.equal(hasOverrideMethodThrowingNotImplemented(overrideValidAst), false);
});

test('hasFrameworkDependencyImport detecta import/require de frameworks concretos', () => {
  const importAst = {
    type: 'ImportDeclaration',
    source: { type: 'StringLiteral', value: '@nestjs/common' },
  };
  const requireAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'require' },
    arguments: [{ type: 'StringLiteral', value: '@prisma/client' }],
  };
  const localRequireAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'require' },
    arguments: [{ type: 'StringLiteral', value: './local' }],
  };

  assert.equal(hasFrameworkDependencyImport(importAst), true);
  assert.equal(hasFrameworkDependencyImport(requireAst), true);
  assert.equal(hasFrameworkDependencyImport(localRequireAst), false);
});

test('hasConcreteDependencyInstantiation detecta instanciacion directa de dependencias concretas', () => {
  const concreteAst = {
    type: 'NewExpression',
    callee: { type: 'Identifier', name: 'PrismaClient' },
    arguments: [],
  };
  const localAst = {
    type: 'NewExpression',
    callee: { type: 'Identifier', name: 'LocalBuilder' },
    arguments: [],
  };

  assert.equal(hasConcreteDependencyInstantiation(concreteAst), true);
  assert.equal(hasConcreteDependencyInstantiation(localAst), false);
});

test('hasLargeClassDeclaration detecta clases con mas de 500 lineas', () => {
  const oversizedClassAst = {
    type: 'ClassDeclaration',
    loc: {
      start: { line: 10 },
      end: { line: 520 },
    },
  };
  const compactClassAst = {
    type: 'ClassDeclaration',
    loc: {
      start: { line: 10 },
      end: { line: 80 },
    },
  };

  assert.equal(hasLargeClassDeclaration(oversizedClassAst), true);
  assert.equal(hasLargeClassDeclaration(compactClassAst), false);
});

test('hasRecordStringUnknownType detecta Record<string, unknown>', () => {
  const recordUnknownAst = {
    type: 'TSTypeReference',
    typeName: { type: 'Identifier', name: 'Record' },
    typeParameters: {
      params: [{ type: 'TSStringKeyword' }, { type: 'TSUnknownKeyword' }],
    },
  };
  const recordStringAst = {
    type: 'TSTypeReference',
    typeName: { type: 'Identifier', name: 'Record' },
    typeParameters: {
      params: [{ type: 'TSStringKeyword' }, { type: 'TSStringKeyword' }],
    },
  };

  assert.equal(hasRecordStringUnknownType(recordUnknownAst), true);
  assert.equal(hasRecordStringUnknownType(recordStringAst), false);
});

test('hasUnknownTypeAssertion detecta as unknown', () => {
  const unknownAssertionAst = {
    type: 'TSAsExpression',
    expression: { type: 'Identifier', name: 'value' },
    typeAnnotation: { type: 'TSUnknownKeyword' },
  };
  const stringAssertionAst = {
    type: 'TSAsExpression',
    expression: { type: 'Identifier', name: 'value' },
    typeAnnotation: { type: 'TSStringKeyword' },
  };

  assert.equal(hasUnknownTypeAssertion(unknownAssertionAst), true);
  assert.equal(hasUnknownTypeAssertion(stringAssertionAst), false);
});

test('hasUndefinedInBaseTypeUnion detecta uniones base con undefined', () => {
  const unionWithUndefinedAst = {
    type: 'TSUnionType',
    types: [{ type: 'TSStringKeyword' }, { type: 'TSUndefinedKeyword' }],
  };
  const unionWithoutUndefinedAst = {
    type: 'TSUnionType',
    types: [{ type: 'TSStringKeyword' }, { type: 'TSNullKeyword' }],
  };

  assert.equal(hasUndefinedInBaseTypeUnion(unionWithUndefinedAst), true);
  assert.equal(hasUndefinedInBaseTypeUnion(unionWithoutUndefinedAst), false);
});

test('hasNetworkCallWithoutErrorHandling detecta llamadas de red sin try/catch ni .catch', () => {
  const unhandledNetworkAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'axios' },
            property: { type: 'Identifier', name: 'get' },
          },
          arguments: [],
        },
      },
    ],
  };
  const handledNetworkAst = {
    type: 'Program',
    body: [
      {
        type: 'TryStatement',
        block: { type: 'BlockStatement', body: [] },
        handler: { type: 'CatchClause', body: { type: 'BlockStatement', body: [] } },
      },
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'axios' },
            property: { type: 'Identifier', name: 'get' },
          },
          arguments: [],
        },
      },
    ],
  };

  assert.equal(hasNetworkCallWithoutErrorHandling(unhandledNetworkAst), true);
  assert.equal(hasNetworkCallWithoutErrorHandling(handledNetworkAst), false);
});
