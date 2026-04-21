import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findEmptyCatchClauseLines,
  findConcreteDependencyInstantiationMatch,
  findFrameworkDependencyImportMatch,
  findMixedCommandQueryClassMatch,
  findMixedCommandQueryInterfaceMatch,
  findOverrideMethodThrowingNotImplementedMatch,
  findTypeDiscriminatorSwitchMatch,
  findNetworkCallWithoutErrorHandlingLines,
  findRecordStringUnknownTypeLines,
  findUndefinedInBaseTypeUnionLines,
  findUnknownWithoutGuardLines,
  findUnknownTypeAssertionLines,
  findAnemicDomainModelLines,
  findMagicNumberLiteralLines,
  findProductionMockArtifactUsageLines,
  hasAnemicDomainModel,
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
  hasMagicNumberLiteral,
  hasProductionMockArtifactUsage,
  hasNetworkCallWithoutErrorHandling,
  hasMixedCommandQueryClass,
  hasMixedCommandQueryInterface,
  hasUnknownWithoutGuard,
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

test('findEmptyCatchClauseLines devuelve lineas ancla para catch vacio', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'CatchClause',
        loc: { start: { line: 7 }, end: { line: 7 } },
        body: { type: 'BlockStatement', body: [] },
      },
      {
        type: 'CatchClause',
        loc: { start: { line: 12 }, end: { line: 12 } },
        body: { type: 'BlockStatement', body: [{ type: 'ExpressionStatement' }] },
      },
    ],
  };

  assert.deepEqual(findEmptyCatchClauseLines(ast), [7]);
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

test('findMixedCommandQueryClassMatch devuelve payload semantico para SRP/CQS', () => {
  const mixedClassAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'PumukiSrpCommandQueryCanary' },
        loc: { start: { line: 1 }, end: { line: 10 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'getById' },
              loc: { start: { line: 2 }, end: { line: 4 } },
            },
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'save' },
              loc: { start: { line: 6 }, end: { line: 8 } },
            },
          ],
        },
      },
    ],
  };

  const match = findMixedCommandQueryClassMatch(mixedClassAst);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiSrpCommandQueryCanary',
    lines: [1],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'query:getById', lines: [2] },
    { kind: 'member', name: 'command:save', lines: [6] },
  ]);
  assert.deepEqual(match.lines, [1, 2, 6]);
  assert.match(match.why, /SRP/i);
  assert.match(match.impact, /testeo aislado/i);
  assert.match(match.expected_fix, /lectura y escritura/i);
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

test('findMixedCommandQueryInterfaceMatch devuelve payload semantico para ISP backend', () => {
  const mixedInterfaceAst = {
    type: 'Program',
    body: [
      {
        type: 'TSInterfaceDeclaration',
        id: { type: 'Identifier', name: 'PumukiIspBackendCatalogPort' },
        loc: { start: { line: 1 }, end: { line: 4 } },
        body: {
          type: 'TSInterfaceBody',
          body: [
            {
              type: 'TSMethodSignature',
              key: { type: 'Identifier', name: 'findById' },
              loc: { start: { line: 2 }, end: { line: 2 } },
            },
            {
              type: 'TSMethodSignature',
              key: { type: 'Identifier', name: 'saveSnapshot' },
              loc: { start: { line: 3 }, end: { line: 3 } },
            },
          ],
        },
      },
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'PumukiIspBackendCanaryUseCase' },
        loc: { start: { line: 6 }, end: { line: 17 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassProperty',
              key: { type: 'Identifier', name: 'catalogPort' },
              loc: { start: { line: 7 }, end: { line: 7 } },
              typeAnnotation: {
                type: 'TSTypeAnnotation',
                typeAnnotation: {
                  type: 'TSTypeReference',
                  typeName: { type: 'Identifier', name: 'PumukiIspBackendCatalogPort' },
                },
              },
            },
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'execute' },
              loc: { start: { line: 9 }, end: { line: 15 } },
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ExpressionStatement',
                    expression: {
                      type: 'CallExpression',
                      loc: { start: { line: 10 }, end: { line: 10 } },
                      callee: {
                        type: 'MemberExpression',
                        computed: false,
                        object: {
                          type: 'MemberExpression',
                          computed: false,
                          object: { type: 'ThisExpression' },
                          property: { type: 'Identifier', name: 'catalogPort' },
                        },
                        property: { type: 'Identifier', name: 'findById' },
                      },
                      arguments: [{ type: 'Identifier', name: 'id' }],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };

  const match = findMixedCommandQueryInterfaceMatch(mixedInterfaceAst);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiIspBackendCanaryUseCase',
    lines: [6],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'fat interface: PumukiIspBackendCatalogPort', lines: [1] },
    { kind: 'member', name: 'used member: findById', lines: [10] },
    { kind: 'member', name: 'unused contract member: saveSnapshot', lines: [3] },
  ]);
  assert.deepEqual(match.lines, [1, 3, 6, 10]);
  assert.match(match.why, /ISP/i);
  assert.match(match.impact, /contrato|acopla|test/i);
  assert.match(match.expected_fix, /puertos|separa|split/i);
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

test('findTypeDiscriminatorSwitchMatch devuelve payload semantico para OCP backend', () => {
  const switchAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'PumukiOcpBackendCanaryUseCase' },
        loc: { start: { line: 1 }, end: { line: 14 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'resolveChannel' },
              loc: { start: { line: 2 }, end: { line: 13 } },
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'SwitchStatement',
                    loc: { start: { line: 3 }, end: { line: 11 } },
                    discriminant: {
                      type: 'MemberExpression',
                      computed: false,
                      object: { type: 'Identifier', name: 'request' },
                      property: { type: 'Identifier', name: 'kind' },
                    },
                    cases: [
                      {
                        type: 'SwitchCase',
                        loc: { start: { line: 4 }, end: { line: 5 } },
                        test: { type: 'StringLiteral', value: 'pickup' },
                      },
                      {
                        type: 'SwitchCase',
                        loc: { start: { line: 6 }, end: { line: 7 } },
                        test: { type: 'StringLiteral', value: 'delivery' },
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };

  const match = findTypeDiscriminatorSwitchMatch(switchAst);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiOcpBackendCanaryUseCase',
    lines: [1],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'discriminator switch: kind', lines: [3] },
    { kind: 'member', name: 'case:pickup', lines: [4] },
    { kind: 'member', name: 'case:delivery', lines: [6] },
  ]);
  assert.deepEqual(match.lines, [1, 3, 4, 6]);
  assert.match(match.why, /OCP/i);
  assert.match(match.impact, /nuevo caso|modificar/i);
  assert.match(match.expected_fix, /estrategia|polimorfismo|mapa/i);
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

test('findOverrideMethodThrowingNotImplementedMatch devuelve payload semantico para LSP backend', () => {
  const lspAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'PumukiLspBackendCanaryDiscountPolicy' },
        loc: { start: { line: 1 }, end: { line: 4 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'apply' },
              loc: { start: { line: 2 }, end: { line: 3 } },
              body: { type: 'BlockStatement', body: [] },
            },
          ],
        },
      },
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'PumukiLspBackendStandardDiscountPolicy' },
        superClass: {
          type: 'Identifier',
          name: 'PumukiLspBackendCanaryDiscountPolicy',
          loc: { start: { line: 5 }, end: { line: 5 } },
        },
        loc: { start: { line: 5 }, end: { line: 10 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              override: true,
              key: { type: 'Identifier', name: 'apply' },
              loc: { start: { line: 6 }, end: { line: 8 } },
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ReturnStatement',
                    argument: { type: 'NumericLiteral', value: 10 },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'PumukiLspBackendPremiumDiscountPolicy' },
        superClass: {
          type: 'Identifier',
          name: 'PumukiLspBackendCanaryDiscountPolicy',
          loc: { start: { line: 12 }, end: { line: 12 } },
        },
        loc: { start: { line: 12 }, end: { line: 19 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              override: true,
              key: { type: 'Identifier', name: 'apply' },
              loc: { start: { line: 13 }, end: { line: 18 } },
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ThrowStatement',
                    loc: { start: { line: 14 }, end: { line: 14 } },
                    argument: {
                      type: 'NewExpression',
                      callee: { type: 'Identifier', name: 'Error' },
                      arguments: [
                        {
                          type: 'StringLiteral',
                          value: 'Not implemented for low amount',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };

  const match = findOverrideMethodThrowingNotImplementedMatch(lspAst);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiLspBackendPremiumDiscountPolicy',
    lines: [12],
  });
  assert.deepEqual(match.related_nodes, [
    {
      kind: 'member',
      name: 'base contract: PumukiLspBackendCanaryDiscountPolicy',
      lines: [1],
    },
    {
      kind: 'member',
      name: 'safe substitute: PumukiLspBackendStandardDiscountPolicy',
      lines: [5],
    },
    {
      kind: 'member',
      name: 'unsafe override: apply',
      lines: [13],
    },
    {
      kind: 'call',
      name: 'throw not implemented',
      lines: [14],
    },
  ]);
  assert.deepEqual(match.lines, [1, 5, 12, 13, 14]);
  assert.match(match.why, /LSP/i);
  assert.match(match.impact, /sustituci|regresion|crash/i);
  assert.match(match.expected_fix, /contrato|estrategia|subtipo/i);
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

test('findFrameworkDependencyImportMatch devuelve payload semantico para DIP', () => {
  const importAst = {
    type: 'Program',
    body: [
      {
        type: 'ImportDeclaration',
        loc: { start: { line: 1 }, end: { line: 1 } },
        source: { type: 'StringLiteral', value: '@prisma/client' },
      },
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'PumukiDipFrameworkImportCanary' },
        loc: { start: { line: 3 }, end: { line: 12 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassProperty',
              key: { type: 'Identifier', name: 'client' },
              loc: { start: { line: 4 }, end: { line: 4 } },
              value: {
                type: 'NewExpression',
                loc: { start: { line: 4 }, end: { line: 4 } },
                callee: { type: 'Identifier', name: 'PrismaClient' },
                arguments: [],
              },
            },
          ],
        },
      },
    ],
  };

  const match = findFrameworkDependencyImportMatch(importAst);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiDipFrameworkImportCanary',
    lines: [3],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'import:@prisma/client', lines: [1] },
    { kind: 'call', name: 'new PrismaClient', lines: [4] },
  ]);
  assert.deepEqual(match.lines, [1, 3, 4]);
  assert.match(match.why, /DIP/i);
  assert.match(match.impact, /infraestructura concreta/i);
  assert.match(match.expected_fix, /puerto|abstracci/i);
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

test('findConcreteDependencyInstantiationMatch devuelve payload semantico para DIP', () => {
  const concreteAst = {
    type: 'Program',
    body: [
      {
        type: 'ImportDeclaration',
        loc: { start: { line: 1 }, end: { line: 1 } },
        source: { type: 'StringLiteral', value: '@prisma/client' },
      },
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'PumukiDipConcreteInstantiationCanary' },
        loc: { start: { line: 3 }, end: { line: 12 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassProperty',
              key: { type: 'Identifier', name: 'client' },
              loc: { start: { line: 4 }, end: { line: 4 } },
              value: {
                type: 'NewExpression',
                loc: { start: { line: 4 }, end: { line: 4 } },
                callee: { type: 'Identifier', name: 'PrismaClient' },
                arguments: [],
              },
            },
          ],
        },
      },
    ],
  };

  const match = findConcreteDependencyInstantiationMatch(concreteAst);

  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'PumukiDipConcreteInstantiationCanary',
    lines: [3],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'import:@prisma/client', lines: [1] },
    { kind: 'call', name: 'new PrismaClient', lines: [4] },
  ]);
  assert.deepEqual(match.lines, [1, 3, 4]);
  assert.match(match.why, /DIP/i);
  assert.match(match.impact, /tests aislados/i);
  assert.match(match.expected_fix, /adapter|puerto|abstracci/i);
});

test('hasLargeClassDeclaration detecta clases con 300 lineas o mas', () => {
  const oversizedClassAst = {
    type: 'ClassDeclaration',
    loc: {
      start: { line: 10 },
      end: { line: 320 },
    },
  };
  const thresholdClassAst = {
    type: 'ClassDeclaration',
    loc: {
      start: { line: 10 },
      end: { line: 309 },
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
  assert.equal(hasLargeClassDeclaration(thresholdClassAst), true);
  assert.equal(hasLargeClassDeclaration(compactClassAst), false);
});

test('hasMagicNumberLiteral detecta literales numericos repetidos en contexto ejecutable y descarta declarativos', () => {
  const magicAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'retry' },
          arguments: [{ type: 'NumericLiteral', value: 42, loc: { start: { line: 3 }, end: { line: 3 } } }],
        },
      },
      {
        type: 'VariableDeclaration',
        kind: 'const',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: { type: 'Identifier', name: 'timeoutMs' },
            init: { type: 'NumericLiteral', value: 42, loc: { start: { line: 5 }, end: { line: 5 } } },
          },
        ],
      },
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'BinaryExpression',
          operator: '>',
          left: { type: 'Identifier', name: 'elapsedMs' },
          right: { type: 'NumericLiteral', value: 42, loc: { start: { line: 7 }, end: { line: 7 } } },
        },
      },
      {
        type: 'ReturnStatement',
        argument: { type: 'NumericLiteral', value: 1, loc: { start: { line: 9 }, end: { line: 9 } } },
      },
    ],
  };

  const ignoredAst = {
    type: 'Program',
    body: [
      {
        type: 'VariableDeclaration',
        kind: 'const',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: { type: 'Identifier', name: 'port' },
            init: { type: 'NumericLiteral', value: 3000, loc: { start: { line: 2 }, end: { line: 2 } } },
          },
        ],
      },
      {
        type: 'ReturnStatement',
        argument: { type: 'NumericLiteral', value: 1, loc: { start: { line: 4 }, end: { line: 4 } } },
      },
    ],
  };

  assert.equal(hasMagicNumberLiteral(magicAst), true);
  assert.deepEqual(findMagicNumberLiteralLines(magicAst), [3, 7]);
  assert.equal(hasMagicNumberLiteral(ignoredAst), false);
  assert.deepEqual(findMagicNumberLiteralLines(ignoredAst), []);
});

test('hasProductionMockArtifactUsage detecta imports/requires de doubles en runtime productivo', () => {
  const importAst = {
    type: 'ImportDeclaration',
    source: { type: 'StringLiteral', value: '../mocks/user-repository', loc: { start: { line: 3 }, end: { line: 3 } } },
    specifiers: [],
    loc: { start: { line: 3 }, end: { line: 3 } },
  };
  const requireAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'require' },
    arguments: [{ type: 'StringLiteral', value: 'sinon', loc: { start: { line: 7 }, end: { line: 7 } } }],
    loc: { start: { line: 7 }, end: { line: 7 } },
  };
  const cleanAst = {
    type: 'Program',
    body: [
      {
        type: 'ImportDeclaration',
        source: { type: 'StringLiteral', value: '../adapters/user-repository', loc: { start: { line: 1 }, end: { line: 1 } } },
        specifiers: [],
      },
    ],
  };
  const mixedAst = {
    type: 'Program',
    body: [importAst, { type: 'ExpressionStatement', expression: requireAst }],
  };

  assert.equal(hasProductionMockArtifactUsage(importAst), true);
  assert.equal(hasProductionMockArtifactUsage(requireAst), true);
  assert.equal(hasProductionMockArtifactUsage(cleanAst), false);
  assert.deepEqual(findProductionMockArtifactUsageLines(mixedAst), [3, 7]);
});

test('hasAnemicDomainModel detecta clases de dominio con solo accessors y sin comportamiento', () => {
  const anemicAst = {
    type: 'ClassDeclaration',
    id: { type: 'Identifier', name: 'OrderEntity' },
    body: {
      type: 'ClassBody',
      body: [
        { type: 'ClassMethod', kind: 'constructor', key: { type: 'Identifier', name: 'constructor' }, loc: { start: { line: 3 }, end: { line: 3 } } },
        { type: 'ClassMethod', key: { type: 'Identifier', name: 'getStatus' }, loc: { start: { line: 5 }, end: { line: 5 } } },
        { type: 'ClassMethod', key: { type: 'Identifier', name: 'setStatus' }, loc: { start: { line: 7 }, end: { line: 7 } } },
      ],
    },
    loc: { start: { line: 1 }, end: { line: 9 } },
  };
  const richAst = {
    type: 'ClassDeclaration',
    id: { type: 'Identifier', name: 'OrderEntity' },
    body: {
      type: 'ClassBody',
      body: [
        { type: 'ClassMethod', kind: 'constructor', key: { type: 'Identifier', name: 'constructor' }, loc: { start: { line: 3 }, end: { line: 3 } } },
        { type: 'ClassMethod', key: { type: 'Identifier', name: 'getStatus' }, loc: { start: { line: 5 }, end: { line: 5 } } },
        { type: 'ClassMethod', key: { type: 'Identifier', name: 'confirm' }, loc: { start: { line: 7 }, end: { line: 7 } } },
      ],
    },
    loc: { start: { line: 1 }, end: { line: 9 } },
  };
  const serviceAst = {
    type: 'ClassDeclaration',
    id: { type: 'Identifier', name: 'OrderService' },
    body: {
      type: 'ClassBody',
      body: [
        { type: 'ClassMethod', kind: 'constructor', key: { type: 'Identifier', name: 'constructor' }, loc: { start: { line: 3 }, end: { line: 3 } } },
        { type: 'ClassMethod', key: { type: 'Identifier', name: 'getStatus' }, loc: { start: { line: 5 }, end: { line: 5 } } },
        { type: 'ClassMethod', key: { type: 'Identifier', name: 'setStatus' }, loc: { start: { line: 7 }, end: { line: 7 } } },
      ],
    },
    loc: { start: { line: 1 }, end: { line: 9 } },
  };

  assert.equal(hasAnemicDomainModel(anemicAst), true);
  assert.deepEqual(findAnemicDomainModelLines(anemicAst), [1]);
  assert.equal(hasAnemicDomainModel(richAst), false);
  assert.equal(hasAnemicDomainModel(serviceAst), false);
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

test('findRecordStringUnknownTypeLines devuelve lineas de Record<string, unknown>', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'TSTypeReference',
        loc: { start: { line: 3 }, end: { line: 3 } },
        typeName: { type: 'Identifier', name: 'Record' },
        typeParameters: {
          params: [{ type: 'TSStringKeyword' }, { type: 'TSUnknownKeyword' }],
        },
      },
      {
        type: 'TSTypeReference',
        loc: { start: { line: 9 }, end: { line: 9 } },
        typeName: { type: 'Identifier', name: 'Record' },
        typeParameters: {
          params: [{ type: 'TSStringKeyword' }, { type: 'TSStringKeyword' }],
        },
      },
    ],
  };

  assert.deepEqual(findRecordStringUnknownTypeLines(ast), [3]);
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

test('findUnknownTypeAssertionLines devuelve lineas de as unknown', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'TSAsExpression',
        loc: { start: { line: 11 }, end: { line: 11 } },
        expression: { type: 'Identifier', name: 'value' },
        typeAnnotation: { type: 'TSUnknownKeyword' },
      },
      {
        type: 'TSAsExpression',
        loc: { start: { line: 20 }, end: { line: 20 } },
        expression: { type: 'Identifier', name: 'value' },
        typeAnnotation: { type: 'TSStringKeyword' },
      },
    ],
  };

  assert.deepEqual(findUnknownTypeAssertionLines(ast), [11]);
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

test('findUndefinedInBaseTypeUnionLines devuelve lineas de union base con undefined', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'TSUnionType',
        loc: { start: { line: 5 }, end: { line: 5 } },
        types: [{ type: 'TSStringKeyword' }, { type: 'TSUndefinedKeyword' }],
      },
      {
        type: 'TSUnionType',
        loc: { start: { line: 9 }, end: { line: 9 } },
        types: [{ type: 'TSNullKeyword' }, { type: 'TSUndefinedKeyword' }],
      },
    ],
  };

  assert.deepEqual(findUndefinedInBaseTypeUnionLines(ast), [5]);
});

test('hasUnknownWithoutGuard detecta unknown fuera de Record<string, unknown>', () => {
  const unsafeUnknownAst = {
    type: 'Program',
    body: [
      {
        type: 'VariableDeclaration',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: {
              type: 'Identifier',
              name: 'payload',
              typeAnnotation: {
                type: 'TSTypeAnnotation',
                typeAnnotation: { type: 'TSUnknownKeyword' },
              },
            },
            init: { type: 'Identifier', name: 'raw' },
          },
        ],
      },
    ],
  };
  const recordUnknownAst = {
    type: 'Program',
    body: [
      {
        type: 'TSTypeAliasDeclaration',
        id: { type: 'Identifier', name: 'Payload' },
        typeAnnotation: {
          type: 'TSTypeReference',
          typeName: { type: 'Identifier', name: 'Record' },
          typeParameters: {
            params: [{ type: 'TSStringKeyword' }, { type: 'TSUnknownKeyword' }],
          },
        },
      },
    ],
  };

  assert.equal(hasUnknownWithoutGuard(unsafeUnknownAst), true);
  assert.equal(hasUnknownWithoutGuard(recordUnknownAst), false);
});

test('findUnknownWithoutGuardLines devuelve lineas de unknown sin guardas explicitas', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'VariableDeclaration',
        declarations: [
          {
            type: 'VariableDeclarator',
            loc: { start: { line: 4 }, end: { line: 4 } },
            id: {
              type: 'Identifier',
              name: 'payload',
              typeAnnotation: {
                type: 'TSTypeAnnotation',
                typeAnnotation: {
                  type: 'TSUnknownKeyword',
                  loc: { start: { line: 4 }, end: { line: 4 } },
                },
              },
            },
            init: { type: 'Identifier', name: 'raw' },
          },
        ],
      },
      {
        type: 'TSTypeAliasDeclaration',
        id: { type: 'Identifier', name: 'Payload' },
        typeAnnotation: {
          type: 'TSTypeReference',
          typeName: { type: 'Identifier', name: 'Record' },
          typeParameters: {
            params: [
              { type: 'TSStringKeyword' },
              { type: 'TSUnknownKeyword', loc: { start: { line: 10 }, end: { line: 10 } } },
            ],
          },
        },
      },
    ],
  };

  assert.deepEqual(findUnknownWithoutGuardLines(ast), [4]);
});

test('hasNetworkCallWithoutErrorHandling detecta solo llamadas de red realmente sin manejo local', () => {
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
  const chainedCatchAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                object: { type: 'Identifier', name: 'axios' },
                property: { type: 'Identifier', name: 'get' },
              },
              arguments: [],
            },
            property: { type: 'Identifier', name: 'catch' },
          },
          arguments: [{ type: 'ArrowFunctionExpression', body: { type: 'Identifier', name: 'err' } }],
        },
      },
    ],
  };

  assert.equal(hasNetworkCallWithoutErrorHandling(unhandledNetworkAst), true);
  assert.equal(hasNetworkCallWithoutErrorHandling(handledNetworkAst), true);
  assert.equal(hasNetworkCallWithoutErrorHandling(chainedCatchAst), false);
});

test('findNetworkCallWithoutErrorHandlingLines devuelve lineas de llamadas sin manejo', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'TryStatement',
        block: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ExpressionStatement',
              expression: {
                type: 'CallExpression',
                loc: { start: { line: 5 }, end: { line: 5 } },
                callee: {
                  type: 'MemberExpression',
                  object: { type: 'Identifier', name: 'axios' },
                  property: { type: 'Identifier', name: 'get' },
                },
                arguments: [],
              },
            },
          ],
        },
        handler: { type: 'CatchClause', body: { type: 'BlockStatement', body: [] } },
      },
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 12 }, end: { line: 12 } },
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

  assert.deepEqual(findNetworkCallWithoutErrorHandlingLines(ast), [12]);
});
