import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findEmptyCatchClauseLines,
  findEmptyCatchClauseMatch,
  findConcreteDependencyInstantiationMatch,
  findConsoleLogCallMatch,
  findSensitiveLogCallMatch,
  findErrorLoggingFullContextMatch,
  findCorrelationIdsMatch,
  findCorsConfiguredMatch,
  findValidationPipeGlobalMatch,
  findValidationConfigMatch,
  findApiVersioningMatch,
  findInputValidationMatch,
  findNestedValidationMatch,
  findClassValidatorDecoratorsMatch,
  findClassTransformerDecoratorsMatch,
  findDtoBoundaryMatch,
  findSeparatedDtoMatch,
  findBackendReturnDtosExposureLines,
  findBackendCriticalTransactionsLines,
  findBackendCriticalTransactionsMatch,
  findBackendMultiTableTransactionsLines,
  findBackendMultiTableTransactionsMatch,
  findPrometheusMetricsMatch,
  findPasswordHashingPatternMatch,
  findRateLimitingThrottlerMatch,
  findWinstonStructuredLoggerMatch,
  findExplicitAnyTypeMatch,
  findCleanArchitectureMatch,
  findExceptionFilterClassMatch,
  findGuardUseGuardsJwtAuthGuardMatch,
  findUseInterceptorsLoggingTransformMatch,
  findFrameworkDependencyImportMatch,
  findMixedCommandQueryClassMatch,
  findMixedCommandQueryInterfaceMatch,
  findOverrideMethodThrowingNotImplementedMatch,
  findProductionMockCallMatch,
  findCallbackHellPatternMatch,
  findHardcodedValuePatternMatch,
  findEnvDefaultFallbackPatternMatch,
  findMagicNumberPatternMatch,
  findLargeClassDeclarationMatch,
  findReactClassComponentLines,
  findReactClassComponentMatch,
  findSingletonPatternMatch,
  findTypeDiscriminatorSwitchMatch,
  findNetworkCallWithoutErrorHandlingLines,
  findRecordStringUnknownTypeLines,
  findUndefinedInBaseTypeUnionLines,
  findUnknownWithoutGuardLines,
  findUnknownTypeAssertionLines,
  hasAsyncPromiseExecutor,
  hasConcreteDependencyInstantiation,
  hasConsoleErrorCall,
  hasConsoleLogCall,
  hasSensitiveLogCall,
  hasErrorLoggingFullContextPattern,
  hasCorrelationIdsPattern,
  hasCorsConfiguredPattern,
  hasValidationPipeGlobalPattern,
  hasValidationConfigPattern,
  hasApiVersioningPattern,
  hasInputValidationPattern,
  hasNestedValidationPattern,
  hasClassValidatorDecoratorsPattern,
  hasClassTransformerDecoratorsPattern,
  hasDtoBoundaryPattern,
  hasSeparatedDtoPattern,
  hasBackendReturnDtosExposureUsage,
  hasBackendCriticalTransactionsUsage,
  hasBackendMultiTableTransactionsUsage,
  hasPrometheusMetricsPattern,
  hasPasswordHashingPattern,
  hasRateLimitingThrottlerPattern,
  hasWinstonStructuredLoggerPattern,
  hasCallbackHellPattern,
  hasDebuggerStatement,
  hasDeleteOperator,
  hasEmptyCatchClause,
  hasEvalCall,
  hasExplicitAnyType,
  hasFrameworkDependencyImport,
  hasFunctionConstructorUsage,
  hasHardcodedValuePattern,
  hasEnvDefaultFallbackPattern,
  hasNetworkCallWithoutErrorHandling,
  hasMixedCommandQueryClass,
  hasMixedCommandQueryInterface,
  hasMagicNumberPattern,
  hasUnknownWithoutGuard,
  hasRecordStringUnknownType,
  hasOverrideMethodThrowingNotImplemented,
  hasLargeClassDeclaration,
  hasReactClassComponentUsage,
  hasExceptionFilterClass,
  hasGuardUseGuardsJwtAuthGuard,
  hasUseInterceptorsLoggingTransform,
  hasProductionMockCall,
  hasSingletonPattern,
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

test('findEmptyCatchClauseMatch devuelve payload semantico para catch vacio', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'processOrder' },
        loc: { start: { line: 2 }, end: { line: 8 } },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'TryStatement',
              loc: { start: { line: 4 }, end: { line: 7 } },
              block: { type: 'BlockStatement', body: [] },
              handler: {
                type: 'CatchClause',
                loc: { start: { line: 6 }, end: { line: 6 } },
                body: { type: 'BlockStatement', body: [] },
              },
            },
          ],
        },
      },
    ],
  };

  const match = findEmptyCatchClauseMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'member',
    name: 'processOrder',
    lines: [2],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'member', name: 'empty catch', lines: [6] },
  ]);
  assert.deepEqual(match?.lines, [2, 6]);
  assert.match(match?.why ?? '', /catch vac[ií]o/i);
  assert.match(match?.impact ?? '', /producci[oó]n|observabilidad/i);
  assert.match(match?.expected_fix ?? '', /registra|propaga|documenta/i);
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

test('findExplicitAnyTypeMatch devuelve payload semantico para any explicito', () => {
  const anyAst = {
    type: 'Program',
    body: [
      {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'parsePayload' },
        loc: { start: { line: 2 }, end: { line: 8 } },
        params: [
          {
            type: 'Identifier',
            name: 'payload',
            typeAnnotation: {
              type: 'TSTypeAnnotation',
              loc: { start: { line: 3 }, end: { line: 3 } },
              typeAnnotation: { type: 'TSAnyKeyword', loc: { start: { line: 3 }, end: { line: 3 } } },
            },
          },
        ],
        body: { type: 'BlockStatement', body: [] },
      },
    ],
  };

  const match = findExplicitAnyTypeMatch(anyAst);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'member',
    name: 'parsePayload',
    lines: [2],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'member', name: 'explicit any', lines: [3] },
  ]);
  assert.deepEqual(match?.lines, [2, 3]);
  assert.match(match?.why ?? '', /any/i);
  assert.match(match?.impact ?? '', /regresiones|tipad/i);
  assert.match(match?.expected_fix ?? '', /unknown|gen[eé]rico/i);
});

test('findCleanArchitectureMatch devuelve payload semantico para clean architecture', () => {
  const cleanArchitectureAst = {
    type: 'Program',
    body: [
      {
        type: 'ImportDeclaration',
        loc: { start: { line: 1 }, end: { line: 1 } },
        source: { type: 'StringLiteral', value: '@prisma/client' },
      },
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'OrderApplicationService' },
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

  const match = findCleanArchitectureMatch(cleanArchitectureAst);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'class',
    name: 'OrderApplicationService',
    lines: [3],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'member', name: 'import:@prisma/client', lines: [1] },
    { kind: 'call', name: 'new PrismaClient', lines: [4] },
  ]);
  assert.deepEqual(match?.lines, [1, 3, 4]);
  assert.match(match?.why ?? '', /Clean Architecture/i);
  assert.match(match?.impact ?? '', /direcci[oó]n de dependencias|acopl/i);
  assert.match(match?.expected_fix ?? '', /puerto|abstracci/i);
});

test('hasProductionMockCall detecta jest.mock y descarta llamadas no mock', () => {
  const productionMockAst = {
    type: 'CallExpression',
    loc: { start: { line: 14 }, end: { line: 14 } },
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'jest' },
      property: { type: 'Identifier', name: 'mock' },
    },
    arguments: [{ type: 'StringLiteral', value: '@prisma/client' }],
  };
  const nonMockAst = {
    type: 'CallExpression',
    loc: { start: { line: 18 }, end: { line: 18 } },
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'jest' },
      property: { type: 'Identifier', name: 'fn' },
    },
    arguments: [],
  };

  assert.equal(hasProductionMockCall(productionMockAst), true);
  assert.equal(hasProductionMockCall(nonMockAst), false);
});

test('findProductionMockCallMatch devuelve payload semantico para mocks en produccion', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'bootstrap' },
        loc: { start: { line: 2 }, end: { line: 10 } },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ExpressionStatement',
              loc: { start: { line: 6 }, end: { line: 6 } },
              expression: {
                type: 'CallExpression',
                loc: { start: { line: 6 }, end: { line: 6 } },
                callee: {
                  type: 'MemberExpression',
                  computed: false,
                  object: { type: 'Identifier', name: 'vi' },
                  property: { type: 'Identifier', name: 'mock' },
                },
                arguments: [{ type: 'StringLiteral', value: '@/services/order' }],
              },
            },
          ],
        },
      },
    ],
  };

  const match = findProductionMockCallMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'member',
    name: 'bootstrap',
    lines: [2],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'call', name: 'vi.mock', lines: [6] },
  ]);
  assert.deepEqual(match?.lines, [2, 6]);
  assert.match(match?.why ?? '', /mock/i);
  assert.match(match?.impact ?? '', /producci[oó]n|observabilidad|integraci[oó]n/i);
  assert.match(match?.expected_fix ?? '', /tests|fixtures|dobles|reales/i);
});

test('hasExceptionFilterClass detecta filtros globales de excepciones y descarta clases comunes', () => {
  const exceptionFilterAst = {
    type: 'ClassDeclaration',
    id: { type: 'Identifier', name: 'HttpExceptionFilter' },
    decorators: [
      {
        type: 'Decorator',
        expression: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'Catch' },
          arguments: [],
        },
      },
    ],
    implements: [
      {
        type: 'TSExpressionWithTypeArguments',
        expression: { type: 'Identifier', name: 'ExceptionFilter' },
      },
    ],
    body: {
      type: 'ClassBody',
      body: [
        {
          type: 'ClassMethod',
          key: { type: 'Identifier', name: 'catch' },
          params: [
            { type: 'Identifier', name: 'exception' },
            { type: 'Identifier', name: 'host' },
          ],
          body: { type: 'BlockStatement', body: [] },
        },
      ],
    },
  };
  const commonClassAst = {
    type: 'ClassDeclaration',
    id: { type: 'Identifier', name: 'OrderService' },
    body: {
      type: 'ClassBody',
      body: [],
    },
  };

  assert.equal(hasExceptionFilterClass(exceptionFilterAst), true);
  assert.equal(hasExceptionFilterClass(commonClassAst), false);
});

test('findExceptionFilterClassMatch devuelve payload semantico para filtros globales de excepciones', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'AllExceptionsFilter' },
        loc: { start: { line: 3 }, end: { line: 26 } },
        decorators: [
          {
            type: 'Decorator',
            loc: { start: { line: 3 }, end: { line: 3 } },
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'Catch' },
              arguments: [],
            },
          },
        ],
        implements: [
          {
            type: 'TSExpressionWithTypeArguments',
            expression: { type: 'Identifier', name: 'ExceptionFilter' },
          },
        ],
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'catch' },
              loc: { start: { line: 10 }, end: { line: 22 } },
              params: [
                { type: 'Identifier', name: 'exception' },
                { type: 'Identifier', name: 'host' },
              ],
              body: { type: 'BlockStatement', body: [] },
            },
          ],
        },
      },
    ],
  };

  const match = findExceptionFilterClassMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'class',
    name: 'AllExceptionsFilter',
    lines: [3],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'member', name: 'catch', lines: [10] },
    { kind: 'member', name: '@Catch', lines: [3] },
  ]);
  assert.deepEqual(match?.lines, [3, 10]);
  assert.match(match?.why ?? '', /filtro global|excepciones/i);
  assert.match(match?.impact ?? '', /trazabilidad|respuestas/i);
  assert.match(match?.expected_fix ?? '', /@Catch|catch/i);
});

test('hasGuardUseGuardsJwtAuthGuard detecta UseGuards(JwtAuthGuard) y descarta guards distintos', () => {
  const guardAst = {
    type: 'ClassDeclaration',
    id: { type: 'Identifier', name: 'OrdersController' },
    decorators: [
      {
        type: 'Decorator',
        expression: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'UseGuards' },
          arguments: [{ type: 'Identifier', name: 'JwtAuthGuard' }],
        },
      },
    ],
    body: {
      type: 'ClassBody',
      body: [],
    },
  };
  const otherGuardAst = {
    type: 'ClassDeclaration',
    id: { type: 'Identifier', name: 'OrdersController' },
    decorators: [
      {
        type: 'Decorator',
        expression: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'UseGuards' },
          arguments: [{ type: 'Identifier', name: 'RolesGuard' }],
        },
      },
    ],
    body: {
      type: 'ClassBody',
      body: [],
    },
  };

  assert.equal(hasGuardUseGuardsJwtAuthGuard(guardAst), true);
  assert.equal(hasGuardUseGuardsJwtAuthGuard(otherGuardAst), false);
});

test('findGuardUseGuardsJwtAuthGuardMatch devuelve payload semantico para UseGuards(JwtAuthGuard)', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'OrdersController' },
        loc: { start: { line: 3 }, end: { line: 18 } },
        decorators: [
          {
            type: 'Decorator',
            loc: { start: { line: 3 }, end: { line: 3 } },
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'UseGuards' },
              arguments: [{ type: 'Identifier', name: 'JwtAuthGuard' }],
            },
          },
        ],
        body: {
          type: 'ClassBody',
          body: [],
        },
      },
    ],
  };

  const match = findGuardUseGuardsJwtAuthGuardMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'class',
    name: 'OrdersController',
    lines: [3],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'call', name: 'UseGuards', lines: [3] },
    { kind: 'member', name: 'JwtAuthGuard', lines: [3] },
  ]);
  assert.deepEqual(match?.lines, [3]);
  assert.match(match?.why ?? '', /UseGuards/i);
  assert.match(match?.impact ?? '', /per[ií]metro|guard/i);
  assert.match(match?.expected_fix ?? '', /JwtAuthGuard|guard/i);
});

test('hasUseInterceptorsLoggingTransform detecta UseInterceptors y descarta decoradores no relevantes', () => {
  const interceptorAst = {
    type: 'ClassDeclaration',
    id: { type: 'Identifier', name: 'OrdersController' },
    decorators: [
      {
        type: 'Decorator',
        expression: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'UseInterceptors' },
          arguments: [{ type: 'Identifier', name: 'LoggingInterceptor' }],
        },
      },
    ],
    body: {
      type: 'ClassBody',
      body: [],
    },
  };
  const otherDecoratorAst = {
    type: 'ClassDeclaration',
    id: { type: 'Identifier', name: 'OrdersController' },
    decorators: [
      {
        type: 'Decorator',
        expression: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'UseGuards' },
          arguments: [{ type: 'Identifier', name: 'JwtAuthGuard' }],
        },
      },
    ],
    body: {
      type: 'ClassBody',
      body: [],
    },
  };

  assert.equal(hasUseInterceptorsLoggingTransform(interceptorAst), true);
  assert.equal(hasUseInterceptorsLoggingTransform(otherDecoratorAst), false);
});

test('findUseInterceptorsLoggingTransformMatch devuelve payload semantico para UseInterceptors', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'OrdersController' },
        loc: { start: { line: 4 }, end: { line: 24 } },
        decorators: [
          {
            type: 'Decorator',
            loc: { start: { line: 4 }, end: { line: 4 } },
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'UseInterceptors' },
              arguments: [{ type: 'Identifier', name: 'ClassSerializerInterceptor' }],
            },
          },
        ],
        body: {
          type: 'ClassBody',
          body: [],
        },
      },
    ],
  };

  const match = findUseInterceptorsLoggingTransformMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'class',
    name: 'OrdersController',
    lines: [4],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'call', name: 'UseInterceptors', lines: [4] },
    { kind: 'member', name: 'ClassSerializerInterceptor', lines: [4] },
  ]);
  assert.deepEqual(match?.lines, [4]);
  assert.match(match?.why ?? '', /UseInterceptors/i);
  assert.match(match?.impact ?? '', /logging|transform/i);
  assert.match(match?.expected_fix ?? '', /interceptor|reutilizable/i);
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

test('findConsoleLogCallMatch devuelve payload semantico para console.log', () => {
  const logAst = {
    type: 'Program',
    body: [
      {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'renderAuditTrail' },
        loc: { start: { line: 2 }, end: { line: 8 } },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ExpressionStatement',
              loc: { start: { line: 4 }, end: { line: 4 } },
              expression: {
                type: 'CallExpression',
                loc: { start: { line: 4 }, end: { line: 4 } },
                callee: {
                  type: 'MemberExpression',
                  computed: false,
                  object: { type: 'Identifier', name: 'console' },
                  property: { type: 'Identifier', name: 'log' },
                },
                arguments: [{ type: 'Identifier', name: 'value' }],
              },
            },
          ],
        },
      },
    ],
  };

  const match = findConsoleLogCallMatch(logAst);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'member',
    name: 'renderAuditTrail',
    lines: [2],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'call', name: 'console.log', lines: [4] },
  ]);
  assert.deepEqual(match?.lines, [2, 4]);
  assert.match(match?.why ?? '', /console\.log/i);
  assert.match(match?.impact ?? '', /logs de producci/i);
  assert.match(match?.expected_fix ?? '', /logger|traza/i);
});

test('hasSensitiveLogCall detecta logger con datos sensibles y descarta logs inocuos', () => {
  const sensitiveLogAst = {
    type: 'CallExpression',
    loc: { start: { line: 14 }, end: { line: 14 } },
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'logger' },
      property: { type: 'Identifier', name: 'info' },
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            loc: { start: { line: 14 }, end: { line: 14 } },
            key: { type: 'Identifier', name: 'password' },
            value: { type: 'Identifier', name: 'rawPassword' },
          },
        ],
      },
    ],
  };
  const safeLogAst = {
    type: 'CallExpression',
    loc: { start: { line: 18 }, end: { line: 18 } },
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'logger' },
      property: { type: 'Identifier', name: 'info' },
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            loc: { start: { line: 18 }, end: { line: 18 } },
            key: { type: 'Identifier', name: 'status' },
            value: { type: 'Identifier', name: 'state' },
          },
        ],
      },
    ],
  };

  assert.equal(hasSensitiveLogCall(sensitiveLogAst), true);
  assert.equal(hasSensitiveLogCall(safeLogAst), false);
});

test('findSensitiveLogCallMatch devuelve payload semantico para log sensible', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'createSession' },
        loc: { start: { line: 3 }, end: { line: 14 } },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ExpressionStatement',
              loc: { start: { line: 9 }, end: { line: 9 } },
              expression: {
                type: 'CallExpression',
                loc: { start: { line: 9 }, end: { line: 9 } },
                callee: {
                  type: 'MemberExpression',
                  computed: false,
                  object: { type: 'Identifier', name: 'logger' },
                  property: { type: 'Identifier', name: 'warn' },
                },
                arguments: [
                  {
                    type: 'StringLiteral',
                    value: 'session created',
                  },
                  {
                    type: 'Identifier',
                    loc: { start: { line: 9 }, end: { line: 9 } },
                    name: 'accessToken',
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };

  const match = findSensitiveLogCallMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'member',
    name: 'createSession',
    lines: [3],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'call', name: 'logging', lines: [9] },
    { kind: 'member', name: 'accessToken', lines: [9] },
  ]);
  assert.deepEqual(match?.lines, [3, 9]);
  assert.match(match?.why ?? '', /datos sensibles|accessToken/i);
  assert.match(match?.impact ?? '', /PII|tokens|Passwords/i);
  assert.match(match?.expected_fix ?? '', /red[aá]ctalo|mascarado|elimina/i);
});

test('hasErrorLoggingFullContextPattern detecta logger.error sin contexto y descarta logs completos', () => {
  const incompleteErrorLogAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'logger' },
      property: { type: 'Identifier', name: 'error' },
    },
    arguments: [{ type: 'Identifier', name: 'error' }],
  };
  const completeErrorLogAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'logger' },
      property: { type: 'Identifier', name: 'error' },
    },
    arguments: [
      { type: 'StringLiteral', value: 'Order failed' },
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'context' },
            value: { type: 'StringLiteral', value: 'checkout' },
          },
        ],
      },
    ],
  };

  assert.equal(hasErrorLoggingFullContextPattern(incompleteErrorLogAst), true);
  assert.equal(hasErrorLoggingFullContextPattern(completeErrorLogAst), false);
});

test('findErrorLoggingFullContextMatch devuelve payload semantico para logger.error sin contexto', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'processPayment' },
        loc: { start: { line: 2 }, end: { line: 8 } },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ExpressionStatement',
              loc: { start: { line: 4 }, end: { line: 4 } },
              expression: {
                type: 'CallExpression',
                loc: { start: { line: 4 }, end: { line: 4 } },
                callee: {
                  type: 'MemberExpression',
                  computed: false,
                  object: { type: 'Identifier', name: 'logger' },
                  property: { type: 'Identifier', name: 'error' },
                },
                arguments: [{ type: 'Identifier', name: 'error' }],
              },
            },
          ],
        },
      },
    ],
  };

  const match = findErrorLoggingFullContextMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'member',
    name: 'processPayment',
    lines: [2],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'call', name: 'logger.error', lines: [4] },
    { kind: 'member', name: 'missing context', lines: [4] },
  ]);
  assert.deepEqual(match?.lines, [2, 4]);
  assert.match(match?.why ?? '', /contexto completo/i);
  assert.match(match?.impact ?? '', /requestId|traceId|userId/i);
  assert.match(match?.expected_fix ?? '', /contexto|logger\.error/i);
});

test('hasCorrelationIdsPattern detecta logger con correlation ids y descarta logs sin contexto', () => {
  const correlationAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'logger' },
      property: { type: 'Identifier', name: 'info' },
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'requestId' },
            value: { type: 'Identifier', name: 'requestId' },
          },
        ],
      },
    ],
  };
  const plainAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'logger' },
      property: { type: 'Identifier', name: 'info' },
    },
    arguments: [{ type: 'StringLiteral', value: 'ok' }],
  };

  assert.equal(hasCorrelationIdsPattern(correlationAst), true);
  assert.equal(hasCorrelationIdsPattern(plainAst), false);
});

test('findCorrelationIdsMatch devuelve payload semantico para correlation ids', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'trackRequest' },
        loc: { start: { line: 2 }, end: { line: 8 } },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ExpressionStatement',
              loc: { start: { line: 4 }, end: { line: 4 } },
              expression: {
                type: 'CallExpression',
                loc: { start: { line: 4 }, end: { line: 4 } },
                callee: {
                  type: 'MemberExpression',
                  computed: false,
                  object: { type: 'Identifier', name: 'logger' },
                  property: { type: 'Identifier', name: 'info' },
                },
                arguments: [
                  {
                    type: 'ObjectExpression',
                    properties: [
                      {
                        type: 'ObjectProperty',
                        key: { type: 'Identifier', name: 'requestId' },
                        value: { type: 'Identifier', name: 'requestId' },
                      },
                      {
                        type: 'ObjectProperty',
                        key: { type: 'Identifier', name: 'traceId' },
                        value: { type: 'Identifier', name: 'traceId' },
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

  const match = findCorrelationIdsMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'member',
    name: 'trackRequest',
    lines: [2],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'call', name: 'logger.info', lines: [4] },
    { kind: 'member', name: 'correlation context', lines: [4] },
  ]);
  assert.deepEqual(match?.lines, [2, 4]);
  assert.match(match?.why ?? '', /correlation IDs/i);
  assert.match(match?.impact ?? '', /requestId|traceId|correlationId/i);
  assert.match(match?.expected_fix ?? '', /requestId|traceId|correlationId/i);
});

test('hasCorsConfiguredPattern detecta enableCors con orígenes permitidos y descarta comodines', () => {
  const configuredAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'app' },
      property: { type: 'Identifier', name: 'enableCors' },
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'origin' },
            value: {
              type: 'ArrayExpression',
              elements: [
                { type: 'StringLiteral', value: 'https://app.example.com' },
                { type: 'StringLiteral', value: 'https://admin.example.com' },
              ],
            },
          },
        ],
      },
    ],
  };
  const wildcardAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'app' },
      property: { type: 'Identifier', name: 'enableCors' },
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'origin' },
            value: { type: 'StringLiteral', value: '*' },
          },
        ],
      },
    ],
  };

  assert.equal(hasCorsConfiguredPattern(configuredAst), true);
  assert.equal(hasCorsConfiguredPattern(wildcardAst), false);
});

test('findCorsConfiguredMatch devuelve payload semantico para CORS configurado', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'bootstrap' },
        loc: { start: { line: 2 }, end: { line: 9 } },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ExpressionStatement',
              loc: { start: { line: 4 }, end: { line: 4 } },
              expression: {
                type: 'CallExpression',
                loc: { start: { line: 4 }, end: { line: 4 } },
                callee: {
                  type: 'MemberExpression',
                  computed: false,
                  object: { type: 'Identifier', name: 'app' },
                  property: { type: 'Identifier', name: 'enableCors' },
                },
                arguments: [
                  {
                    type: 'ObjectExpression',
                    properties: [
                      {
                        type: 'ObjectProperty',
                        key: { type: 'Identifier', name: 'origin' },
                        value: {
                          type: 'ArrayExpression',
                          elements: [
                            { type: 'StringLiteral', value: 'https://app.example.com' },
                            { type: 'StringLiteral', value: 'https://admin.example.com' },
                          ],
                        },
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

  const match = findCorsConfiguredMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'member',
    name: 'bootstrap',
    lines: [2],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'call', name: 'app.enableCors', lines: [4] },
    { kind: 'member', name: 'allowed origins', lines: [4] },
  ]);
  assert.deepEqual(match?.lines, [2, 4]);
  assert.match(match?.why ?? '', /CORS/i);
  assert.match(match?.impact ?? '', /cross-origin|orígenes permitidos/i);
  assert.match(match?.expected_fix ?? '', /enableCors|origin/i);
});

test('hasValidationPipeGlobalPattern detecta useGlobalPipes con whitelist y descarta configuraciones incompletas', () => {
  const configuredAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'app' },
      property: { type: 'Identifier', name: 'useGlobalPipes' },
    },
    arguments: [
      {
        type: 'NewExpression',
        callee: { type: 'Identifier', name: 'ValidationPipe' },
        arguments: [
          {
            type: 'ObjectExpression',
            properties: [
              {
                type: 'ObjectProperty',
                key: { type: 'Identifier', name: 'whitelist' },
                value: { type: 'BooleanLiteral', value: true },
              },
            ],
          },
        ],
      },
    ],
  };
  const incompleteAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'app' },
      property: { type: 'Identifier', name: 'useGlobalPipes' },
    },
    arguments: [
      {
        type: 'NewExpression',
        callee: { type: 'Identifier', name: 'ValidationPipe' },
        arguments: [{ type: 'ObjectExpression', properties: [] }],
      },
    ],
  };

  assert.equal(hasValidationPipeGlobalPattern(configuredAst), true);
  assert.equal(hasValidationPipeGlobalPattern(incompleteAst), false);
});

test('findValidationPipeGlobalMatch devuelve payload semantico para ValidationPipe global', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'bootstrap' },
        loc: { start: { line: 2 }, end: { line: 9 } },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ExpressionStatement',
              loc: { start: { line: 4 }, end: { line: 4 } },
              expression: {
                type: 'CallExpression',
                loc: { start: { line: 4 }, end: { line: 4 } },
                callee: {
                  type: 'MemberExpression',
                  computed: false,
                  object: { type: 'Identifier', name: 'app' },
                  property: { type: 'Identifier', name: 'useGlobalPipes' },
                },
                arguments: [
                  {
                    type: 'NewExpression',
                    callee: { type: 'Identifier', name: 'ValidationPipe' },
                    arguments: [
                      {
                        type: 'ObjectExpression',
                        properties: [
                          {
                            type: 'ObjectProperty',
                            key: { type: 'Identifier', name: 'whitelist' },
                            value: { type: 'BooleanLiteral', value: true },
                          },
                        ],
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

  const match = findValidationPipeGlobalMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'member',
    name: 'bootstrap',
    lines: [2],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'call', name: 'app.useGlobalPipes', lines: [4] },
    { kind: 'member', name: 'whitelist: true', lines: [4] },
  ]);
  assert.deepEqual(match?.lines, [2, 4]);
  assert.match(match?.why ?? '', /ValidationPipe/i);
  assert.match(match?.impact ?? '', /whitelist/i);
  assert.match(match?.expected_fix ?? '', /ValidationPipe|whitelist/i);
});

test('hasValidationConfigPattern detecta ConfigModule con validacion de env y descarta forRoot incompletos', () => {
  const configuredAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'ConfigModule' },
      property: { type: 'Identifier', name: 'forRoot' },
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'validationSchema' },
            value: {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                computed: false,
                object: { type: 'Identifier', name: 'Joi' },
                property: { type: 'Identifier', name: 'object' },
              },
              arguments: [],
            },
          },
        ],
      },
    ],
  };
  const incompleteAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'ConfigModule' },
      property: { type: 'Identifier', name: 'forRoot' },
    },
    arguments: [{ type: 'ObjectExpression', properties: [] }],
  };

  assert.equal(hasValidationConfigPattern(configuredAst), true);
  assert.equal(hasValidationConfigPattern(incompleteAst), false);
});

test('findValidationConfigMatch devuelve payload semantico para ConfigModule validation', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'bootstrap' },
        loc: { start: { line: 1 }, end: { line: 10 } },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ExpressionStatement',
              loc: { start: { line: 3 }, end: { line: 3 } },
              expression: {
                type: 'CallExpression',
                loc: { start: { line: 3 }, end: { line: 3 } },
                callee: {
                  type: 'MemberExpression',
                  computed: false,
                  object: { type: 'Identifier', name: 'ConfigModule' },
                  property: { type: 'Identifier', name: 'forRoot' },
                },
                arguments: [
                  {
                    type: 'ObjectExpression',
                    properties: [
                      {
                        type: 'ObjectProperty',
                        key: { type: 'Identifier', name: 'validationSchema' },
                        value: {
                          type: 'CallExpression',
                          callee: {
                            type: 'MemberExpression',
                            computed: false,
                            object: { type: 'Identifier', name: 'Joi' },
                            property: { type: 'Identifier', name: 'object' },
                          },
                          arguments: [],
                        },
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

  const match = findValidationConfigMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'member',
    name: 'bootstrap',
    lines: [1],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'call', name: 'ConfigModule.forRoot', lines: [3] },
    { kind: 'member', name: 'validationSchema / validate', lines: [3] },
  ]);
  assert.deepEqual(match?.lines, [1, 3]);
  assert.match(match?.why ?? '', /ConfigModule/i);
  assert.match(match?.impact ?? '', /variables inválidas|faltantes/i);
  assert.match(match?.expected_fix ?? '', /validationSchema|validate/i);
});

test('hasClassValidatorDecoratorsPattern detecta decoradores class-validator y descarta decoradores no relacionados', () => {
  const dtoAst = {
    type: 'ClassDeclaration',
    id: { type: 'Identifier', name: 'CreateOrderDto' },
    body: {
      type: 'ClassBody',
      body: [
        {
          type: 'ClassProperty',
          key: { type: 'Identifier', name: 'userEmail' },
          decorators: [
            {
              type: 'Decorator',
              expression: {
                type: 'CallExpression',
                callee: { type: 'Identifier', name: 'IsEmail' },
                arguments: [],
              },
            },
          ],
        },
      ],
    },
  };
  const unrelatedAst = {
    type: 'ClassDeclaration',
    id: { type: 'Identifier', name: 'OrderService' },
    body: {
      type: 'ClassBody',
      body: [
        {
          type: 'ClassMethod',
          key: { type: 'Identifier', name: 'save' },
          decorators: [
            {
              type: 'Decorator',
              expression: {
                type: 'CallExpression',
                callee: { type: 'Identifier', name: 'Injectable' },
                arguments: [],
              },
            },
          ],
        },
      ],
    },
  };

  assert.equal(hasClassValidatorDecoratorsPattern(dtoAst), true);
  assert.equal(hasClassValidatorDecoratorsPattern(unrelatedAst), false);
});

test('findClassValidatorDecoratorsMatch devuelve payload semantico para DTOs con class-validator', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'CreateUserDto' },
        loc: { start: { line: 3 }, end: { line: 16 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassProperty',
              key: { type: 'Identifier', name: 'email' },
              loc: { start: { line: 6 }, end: { line: 6 } },
              decorators: [
                {
                  type: 'Decorator',
                  loc: { start: { line: 6 }, end: { line: 6 } },
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'IsEmail' },
                    arguments: [],
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };

  const match = findClassValidatorDecoratorsMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'class',
    name: 'CreateUserDto',
    lines: [3],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'member', name: 'email', lines: [6] },
    { kind: 'member', name: '@IsEmail', lines: [6] },
  ]);
  assert.deepEqual(match?.lines, [3, 6]);
  assert.match(match?.why ?? '', /class-validator/i);
  assert.match(match?.impact ?? '', /inv[aá]lidos|runtime/i);
  assert.match(match?.expected_fix ?? '', /IsString|IsEmail|Min|Max/i);
});

test('hasClassTransformerDecoratorsPattern detecta decoradores class-transformer y descarta decoradores no relacionados', () => {
  const dtoAst = {
    type: 'ClassDeclaration',
    id: { type: 'Identifier', name: 'UserResponseDto' },
    body: {
      type: 'ClassBody',
      body: [
        {
          type: 'ClassProperty',
          key: { type: 'Identifier', name: 'password' },
          decorators: [
            {
              type: 'Decorator',
              expression: {
                type: 'CallExpression',
                callee: { type: 'Identifier', name: 'Exclude' },
                arguments: [],
              },
            },
          ],
        },
      ],
    },
  };
  const unrelatedAst = {
    type: 'ClassDeclaration',
    id: { type: 'Identifier', name: 'UserResponseDto' },
    body: {
      type: 'ClassBody',
      body: [
        {
          type: 'ClassProperty',
          key: { type: 'Identifier', name: 'password' },
          decorators: [
            {
              type: 'Decorator',
              expression: {
                type: 'CallExpression',
                callee: { type: 'Identifier', name: 'IsString' },
                arguments: [],
              },
            },
          ],
        },
      ],
    },
  };

  assert.equal(hasClassTransformerDecoratorsPattern(dtoAst), true);
  assert.equal(hasClassTransformerDecoratorsPattern(unrelatedAst), false);
});

test('findClassTransformerDecoratorsMatch devuelve payload semantico para DTOs con class-transformer', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'UserResponseDto' },
        loc: { start: { line: 4 }, end: { line: 14 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassProperty',
              key: { type: 'Identifier', name: 'internalNotes' },
              loc: { start: { line: 8 }, end: { line: 8 } },
              decorators: [
                {
                  type: 'Decorator',
                  loc: { start: { line: 8 }, end: { line: 8 } },
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'Exclude' },
                    arguments: [],
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };

  const match = findClassTransformerDecoratorsMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'class',
    name: 'UserResponseDto',
    lines: [4],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'member', name: 'internalNotes', lines: [8] },
    { kind: 'member', name: '@Exclude', lines: [8] },
  ]);
  assert.deepEqual(match?.lines, [4, 8]);
  assert.match(match?.why ?? '', /class-transformer/i);
  assert.match(match?.impact ?? '', /transformaci[oó]n|exposici[oó]n|filtrar/i);
  assert.match(match?.expected_fix ?? '', /Transform|Exclude|Expose/i);
});

test('hasDtoBoundaryPattern detecta DTOs en boundaries y descarta DTOs decorados', () => {
  const dtoAst = {
    type: 'ClassDeclaration',
    id: { type: 'Identifier', name: 'CreateOrderDto' },
    body: {
      type: 'ClassBody',
      body: [
        {
          type: 'ClassProperty',
          key: { type: 'Identifier', name: 'userId' },
        },
      ],
    },
  };
  const decoratedDtoAst = {
    type: 'ClassDeclaration',
    id: { type: 'Identifier', name: 'CreateOrderDto' },
    body: {
      type: 'ClassBody',
      body: [
        {
          type: 'ClassProperty',
          key: { type: 'Identifier', name: 'userId' },
          decorators: [
            {
              type: 'Decorator',
              expression: {
                type: 'CallExpression',
                callee: { type: 'Identifier', name: 'IsString' },
                arguments: [],
              },
            },
          ],
        },
      ],
    },
  };

  assert.equal(hasDtoBoundaryPattern(dtoAst), true);
  assert.equal(hasDtoBoundaryPattern(decoratedDtoAst), false);
});

test('findDtoBoundaryMatch devuelve payload semantico para DTOs en boundaries', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'CreateUserDto' },
        loc: { start: { line: 3 }, end: { line: 9 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassProperty',
              key: { type: 'Identifier', name: 'email' },
              loc: { start: { line: 5 }, end: { line: 5 } },
            },
            {
              type: 'ClassProperty',
              key: { type: 'Identifier', name: 'name' },
              loc: { start: { line: 6 }, end: { line: 6 } },
            },
          ],
        },
      },
    ],
  };

  const match = findDtoBoundaryMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'class',
    name: 'CreateUserDto',
    lines: [3],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'member', name: 'email', lines: [5] },
    { kind: 'member', name: 'name', lines: [6] },
  ]);
  assert.deepEqual(match?.lines, [3, 5, 6]);
  assert.match(match?.why ?? '', /boundary|DTO/i);
  assert.match(match?.impact ?? '', /contratos ambiguos|serializaci[oó]n/i);
  assert.match(match?.expected_fix ?? '', /entrada|salida|DTO/i);
});

test('hasBackendCriticalTransactionsUsage detecta transacciones criticas y descarta llamadas sin transaccion', () => {
  const criticalTransactionAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        loc: { start: { line: 4 }, end: { line: 8 } },
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 4 }, end: { line: 8 } },
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'dataSource' },
            property: { type: 'Identifier', name: 'transaction' },
          },
          arguments: [
            {
              type: 'ArrowFunctionExpression',
              loc: { start: { line: 4 }, end: { line: 8 } },
              body: { type: 'BlockStatement', body: [] },
            },
          ],
        },
      },
    ],
  };
  const noTransactionAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        loc: { start: { line: 4 }, end: { line: 4 } },
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 4 }, end: { line: 4 } },
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'dataSource' },
            property: { type: 'Identifier', name: 'query' },
          },
          arguments: [],
        },
      },
    ],
  };

  assert.equal(hasBackendCriticalTransactionsUsage(criticalTransactionAst), true);
  assert.equal(hasBackendCriticalTransactionsUsage(noTransactionAst), false);
});

test('findBackendCriticalTransactionsLines devuelve la linea de la transaccion critica', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        loc: { start: { line: 4 }, end: { line: 8 } },
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 4 }, end: { line: 8 } },
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'dataSource' },
            property: { type: 'Identifier', name: 'transaction' },
          },
          arguments: [
            {
              type: 'ArrowFunctionExpression',
              loc: { start: { line: 4 }, end: { line: 8 } },
              body: { type: 'BlockStatement', body: [] },
            },
          ],
        },
      },
    ],
  };

  assert.deepEqual(findBackendCriticalTransactionsLines(ast), [4]);
  assert.ok(findBackendCriticalTransactionsMatch(ast));
});

test('hasBackendMultiTableTransactionsUsage detecta transacciones multi-tabla y descarta una sola escritura', () => {
  const multiTableTransactionAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        loc: { start: { line: 4 }, end: { line: 9 } },
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 4 }, end: { line: 9 } },
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'dataSource' },
            property: { type: 'Identifier', name: 'transaction' },
          },
          arguments: [
            {
              type: 'ArrowFunctionExpression',
              loc: { start: { line: 4 }, end: { line: 9 } },
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ExpressionStatement',
                    loc: { start: { line: 5 }, end: { line: 5 } },
                    expression: {
                      type: 'CallExpression',
                      loc: { start: { line: 5 }, end: { line: 5 } },
                      callee: {
                        type: 'MemberExpression',
                        object: { type: 'Identifier', name: 'manager' },
                        property: { type: 'Identifier', name: 'save' },
                      },
                      arguments: [],
                    },
                  },
                  {
                    type: 'ExpressionStatement',
                    loc: { start: { line: 6 }, end: { line: 6 } },
                    expression: {
                      type: 'CallExpression',
                      loc: { start: { line: 6 }, end: { line: 6 } },
                      callee: {
                        type: 'MemberExpression',
                        object: { type: 'Identifier', name: 'manager' },
                        property: { type: 'Identifier', name: 'update' },
                      },
                      arguments: [],
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
  const singleWriteTransactionAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        loc: { start: { line: 4 }, end: { line: 8 } },
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 4 }, end: { line: 8 } },
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'dataSource' },
            property: { type: 'Identifier', name: 'transaction' },
          },
          arguments: [
            {
              type: 'ArrowFunctionExpression',
              loc: { start: { line: 4 }, end: { line: 8 } },
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ExpressionStatement',
                    loc: { start: { line: 5 }, end: { line: 5 } },
                    expression: {
                      type: 'CallExpression',
                      loc: { start: { line: 5 }, end: { line: 5 } },
                      callee: {
                        type: 'MemberExpression',
                        object: { type: 'Identifier', name: 'manager' },
                        property: { type: 'Identifier', name: 'save' },
                      },
                      arguments: [],
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

  assert.equal(hasBackendMultiTableTransactionsUsage(multiTableTransactionAst), true);
  assert.equal(hasBackendMultiTableTransactionsUsage(singleWriteTransactionAst), false);
});

test('findBackendMultiTableTransactionsLines devuelve la transaccion y las escrituras relacionadas', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        loc: { start: { line: 4 }, end: { line: 9 } },
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 4 }, end: { line: 9 } },
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'dataSource' },
            property: { type: 'Identifier', name: 'transaction' },
          },
          arguments: [
            {
              type: 'ArrowFunctionExpression',
              loc: { start: { line: 4 }, end: { line: 9 } },
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ExpressionStatement',
                    loc: { start: { line: 5 }, end: { line: 5 } },
                    expression: {
                      type: 'CallExpression',
                      loc: { start: { line: 5 }, end: { line: 5 } },
                      callee: {
                        type: 'MemberExpression',
                        object: { type: 'Identifier', name: 'manager' },
                        property: { type: 'Identifier', name: 'save' },
                      },
                      arguments: [],
                    },
                  },
                  {
                    type: 'ExpressionStatement',
                    loc: { start: { line: 6 }, end: { line: 6 } },
                    expression: {
                      type: 'CallExpression',
                      loc: { start: { line: 6 }, end: { line: 6 } },
                      callee: {
                        type: 'MemberExpression',
                        object: { type: 'Identifier', name: 'manager' },
                        property: { type: 'Identifier', name: 'update' },
                      },
                      arguments: [],
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

  assert.deepEqual(findBackendMultiTableTransactionsLines(ast), [4, 5, 6]);
  assert.ok(findBackendMultiTableTransactionsMatch(ast));
});

test('hasApiVersioningPattern detecta controllers versionados y descarta controllers sin version', () => {
  const versionedAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'OrdersController' },
        decorators: [
          {
            type: 'Decorator',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'Controller' },
              arguments: [
                {
                  type: 'ObjectExpression',
                  properties: [
                    {
                      type: 'ObjectProperty',
                      key: { type: 'Identifier', name: 'path' },
                      value: { type: 'StringLiteral', value: 'orders' },
                    },
                    {
                      type: 'ObjectProperty',
                      key: { type: 'Identifier', name: 'version' },
                      value: { type: 'StringLiteral', value: '1' },
                    },
                  ],
                },
              ],
            },
          },
        ],
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'list' },
              body: { type: 'BlockStatement', body: [] },
            },
          ],
        },
      },
    ],
  };
  const unversionedAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'OrdersController' },
        decorators: [
          {
            type: 'Decorator',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'Controller' },
              arguments: [{ type: 'StringLiteral', value: 'orders' }],
            },
          },
        ],
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'list' },
              body: { type: 'BlockStatement', body: [] },
            },
          ],
        },
      },
    ],
  };

  assert.equal(hasApiVersioningPattern(versionedAst), true);
  assert.equal(hasApiVersioningPattern(unversionedAst), false);
});

test('findApiVersioningMatch devuelve payload semantico para controllers versionados', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'OrdersController' },
        loc: { start: { line: 3 }, end: { line: 12 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'list' },
              loc: { start: { line: 5 }, end: { line: 8 } },
              decorators: [
                {
                  type: 'Decorator',
                  loc: { start: { line: 5 }, end: { line: 5 } },
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'Version' },
                    arguments: [{ type: 'StringLiteral', value: '2' }],
                  },
                },
              ],
              body: { type: 'BlockStatement', body: [] },
            },
          ],
        },
      },
    ],
  };

  const match = findApiVersioningMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'class',
    name: 'OrdersController',
    lines: [3],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'member', name: 'list', lines: [5] },
    { kind: 'member', name: '@Version', lines: [5] },
    { kind: 'member', name: 'v2', lines: [5] },
  ]);
  assert.deepEqual(match?.lines, [3, 5]);
  assert.match(match?.why ?? '', /versionadas|v1|v2/i);
  assert.match(match?.impact ?? '', /contratos de API|consumidores/i);
  assert.match(match?.expected_fix ?? '', /@Version|version:|\/api\/v1|\/api\/v2/i);
});

test('hasInputValidationPattern detecta DTOs de entrada en controllers y descarta parametros primitivos', () => {
  const dtoAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'OrdersController' },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'create' },
              params: [
                {
                  type: 'Identifier',
                  name: 'createOrderDto',
                  decorators: [
                    {
                      type: 'Decorator',
                      expression: {
                        type: 'CallExpression',
                        callee: { type: 'Identifier', name: 'Body' },
                        arguments: [],
                      },
                    },
                  ],
                  typeAnnotation: {
                    type: 'TSTypeAnnotation',
                    typeAnnotation: {
                      type: 'TSTypeReference',
                      typeName: { type: 'Identifier', name: 'CreateOrderDto' },
                    },
                  },
                },
              ],
              body: { type: 'BlockStatement', body: [] },
            },
          ],
        },
      },
    ],
  };
  const primitiveAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'OrdersController' },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'findById' },
              params: [
                {
                  type: 'Identifier',
                  name: 'id',
                  decorators: [
                    {
                      type: 'Decorator',
                      expression: {
                        type: 'CallExpression',
                        callee: { type: 'Identifier', name: 'Param' },
                        arguments: [],
                      },
                    },
                  ],
                  typeAnnotation: {
                    type: 'TSTypeAnnotation',
                    typeAnnotation: { type: 'TSStringKeyword' },
                  },
                },
              ],
              body: { type: 'BlockStatement', body: [] },
            },
          ],
        },
      },
    ],
  };

  assert.equal(hasInputValidationPattern(dtoAst), true);
  assert.equal(hasInputValidationPattern(primitiveAst), false);
});

test('findInputValidationMatch devuelve payload semantico para DTOs de entrada en controllers', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'OrdersController' },
        loc: { start: { line: 3 }, end: { line: 16 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'create' },
              loc: { start: { line: 5 }, end: { line: 11 } },
              params: [
                {
                  type: 'Identifier',
                  name: 'createOrderDto',
                  loc: { start: { line: 6 }, end: { line: 6 } },
                  decorators: [
                    {
                      type: 'Decorator',
                      loc: { start: { line: 6 }, end: { line: 6 } },
                      expression: {
                        type: 'CallExpression',
                        callee: { type: 'Identifier', name: 'Body' },
                        arguments: [],
                      },
                    },
                  ],
                  typeAnnotation: {
                    type: 'TSTypeAnnotation',
                    typeAnnotation: {
                      type: 'TSTypeReference',
                      typeName: { type: 'Identifier', name: 'CreateOrderDto' },
                    },
                  },
                },
              ],
              body: { type: 'BlockStatement', body: [] },
            },
          ],
        },
      },
    ],
  };

  const match = findInputValidationMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'class',
    name: 'OrdersController',
    lines: [3],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'member', name: 'create', lines: [5] },
    { kind: 'member', name: 'createOrderDto', lines: [6] },
    { kind: 'member', name: '@Body', lines: [6] },
    { kind: 'member', name: 'CreateOrderDto', lines: [6] },
  ]);
  assert.deepEqual(match?.lines, [3, 5, 6]);
  assert.match(match?.why ?? '', /controller/i);
  assert.match(match?.impact ?? '', /payloads crudos|validaci[oó]n/i);
  assert.match(match?.expected_fix ?? '', /ValidationPipe|class-validator|DTO/i);
});

test('hasNestedValidationPattern detecta @ValidateNested() y @Type() en DTOs anidados', () => {
  const nestedDtoAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'AddressDto' },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassProperty',
              key: { type: 'Identifier', name: 'street' },
              decorators: [
                {
                  type: 'Decorator',
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'IsString' },
                    arguments: [],
                  },
                },
              ],
              typeAnnotation: {
                type: 'TSTypeAnnotation',
                typeAnnotation: { type: 'TSStringKeyword' },
              },
            },
          ],
        },
      },
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'CreateOrderDto' },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassProperty',
              key: { type: 'Identifier', name: 'address' },
              decorators: [
                {
                  type: 'Decorator',
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'ValidateNested' },
                    arguments: [],
                  },
                },
                {
                  type: 'Decorator',
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'Type' },
                    arguments: [
                      {
                        type: 'ArrowFunctionExpression',
                        body: { type: 'Identifier', name: 'AddressDto' },
                      },
                    ],
                  },
                },
              ],
              typeAnnotation: {
                type: 'TSTypeAnnotation',
                typeAnnotation: {
                  type: 'TSTypeReference',
                  typeName: { type: 'Identifier', name: 'AddressDto' },
                },
              },
            },
          ],
        },
      },
    ],
  };
  const incompleteAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'CreateOrderDto' },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassProperty',
              key: { type: 'Identifier', name: 'address' },
              decorators: [
                {
                  type: 'Decorator',
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'Type' },
                    arguments: [],
                  },
                },
              ],
              typeAnnotation: {
                type: 'TSTypeAnnotation',
                typeAnnotation: {
                  type: 'TSTypeReference',
                  typeName: { type: 'Identifier', name: 'AddressDto' },
                },
              },
            },
          ],
        },
      },
    ],
  };

  assert.equal(hasNestedValidationPattern(nestedDtoAst), true);
  assert.equal(hasNestedValidationPattern(incompleteAst), false);
});

test('findNestedValidationMatch devuelve payload semantico para DTOs anidados', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'CreateOrderDto' },
        loc: { start: { line: 3 }, end: { line: 11 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassProperty',
              key: { type: 'Identifier', name: 'address' },
              loc: { start: { line: 5 }, end: { line: 10 } },
              decorators: [
                {
                  type: 'Decorator',
                  loc: { start: { line: 5 }, end: { line: 5 } },
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'ValidateNested' },
                    arguments: [],
                  },
                },
                {
                  type: 'Decorator',
                  loc: { start: { line: 6 }, end: { line: 6 } },
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'Type' },
                    arguments: [
                      {
                        type: 'ArrowFunctionExpression',
                        body: { type: 'Identifier', name: 'AddressDto' },
                      },
                    ],
                  },
                },
              ],
              typeAnnotation: {
                type: 'TSTypeAnnotation',
                typeAnnotation: {
                  type: 'TSTypeReference',
                  typeName: { type: 'Identifier', name: 'AddressDto' },
                },
              },
            },
          ],
        },
      },
    ],
  };

  const match = findNestedValidationMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'class',
    name: 'CreateOrderDto',
    lines: [3],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'member', name: 'address', lines: [5] },
    { kind: 'member', name: '@ValidateNested', lines: [5] },
    { kind: 'member', name: '@Type', lines: [6] },
    { kind: 'member', name: 'AddressDto', lines: [5] },
  ]);
  assert.deepEqual(match?.lines, [3, 5, 6]);
  assert.match(match?.why ?? '', /@ValidateNested|@Type|DTO/i);
  assert.match(match?.impact ?? '', /anidada|payloads inv[aá]lidos/i);
  assert.match(match?.expected_fix ?? '', /@ValidateNested|@Type|ChildDto/i);
});

test('hasSeparatedDtoPattern detecta DTOs separados y descarta variantes incompletas', () => {
  const dtoAst = {
    type: 'Program',
    body: [
      { type: 'ClassDeclaration', id: { type: 'Identifier', name: 'CreateOrderDto' }, body: { type: 'ClassBody', body: [] } },
      { type: 'ClassDeclaration', id: { type: 'Identifier', name: 'UpdateOrderDto' }, body: { type: 'ClassBody', body: [] } },
      { type: 'ClassDeclaration', id: { type: 'Identifier', name: 'OrderResponseDto' }, body: { type: 'ClassBody', body: [] } },
    ],
  };
  const incompleteAst = {
    type: 'Program',
    body: [
      { type: 'ClassDeclaration', id: { type: 'Identifier', name: 'CreateOrderDto' }, body: { type: 'ClassBody', body: [] } },
      { type: 'ClassDeclaration', id: { type: 'Identifier', name: 'OrderResponseDto' }, body: { type: 'ClassBody', body: [] } },
    ],
  };

  assert.equal(hasSeparatedDtoPattern(dtoAst), true);
  assert.equal(hasSeparatedDtoPattern(incompleteAst), false);
});

test('findSeparatedDtoMatch devuelve payload semantico para DTOs separados', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'CreateOrderDto' },
        loc: { start: { line: 3 }, end: { line: 6 } },
        body: { type: 'ClassBody', body: [] },
      },
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'UpdateOrderDto' },
        loc: { start: { line: 8 }, end: { line: 11 } },
        body: { type: 'ClassBody', body: [] },
      },
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'OrderResponseDto' },
        loc: { start: { line: 13 }, end: { line: 16 } },
        body: { type: 'ClassBody', body: [] },
      },
    ],
  };

  const match = findSeparatedDtoMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'class',
    name: 'CreateOrderDto',
    lines: [3],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'class', name: 'UpdateOrderDto', lines: [8] },
    { kind: 'class', name: 'OrderResponseDto', lines: [13] },
  ]);
  assert.deepEqual(match?.lines, [3, 8, 13]);
  assert.match(match?.why ?? '', /separan creación, actualización y respuesta/i);
  assert.match(match?.impact ?? '', /mezcla contratos|validaci[oó]n y serializaci[oó]n/i);
  assert.match(match?.expected_fix ?? '', /Create, Update y Response/i);
});

test('hasBackendReturnDtosExposureUsage detecta retornos directos de entidades y descarta DTOs', () => {
  const entityReturnAst = {
    type: 'ClassMethod',
    key: { type: 'Identifier', name: 'getOrder' },
    returnType: {
      type: 'TSTypeAnnotation',
      typeAnnotation: {
        type: 'TSTypeReference',
        typeName: { type: 'Identifier', name: 'Promise' },
        typeParameters: {
          params: [
            {
              type: 'TSTypeReference',
              typeName: { type: 'Identifier', name: 'OrderEntity' },
            },
          ],
        },
      },
    },
    body: { type: 'BlockStatement', body: [] },
  };
  const dtoReturnAst = {
    type: 'ClassMethod',
    key: { type: 'Identifier', name: 'getOrder' },
    returnType: {
      type: 'TSTypeAnnotation',
      typeAnnotation: {
        type: 'TSTypeReference',
        typeName: { type: 'Identifier', name: 'Promise' },
        typeParameters: {
          params: [
            {
              type: 'TSTypeReference',
              typeName: { type: 'Identifier', name: 'OrderResponseDto' },
            },
          ],
        },
      },
    },
    body: { type: 'BlockStatement', body: [] },
  };
  const returnStatementAst = {
    type: 'ReturnStatement',
    argument: { type: 'Identifier', name: 'orderEntity' },
  };
  const safeReturnStatementAst = {
    type: 'ReturnStatement',
    argument: { type: 'Identifier', name: 'orderResponseDto' },
  };

  assert.equal(hasBackendReturnDtosExposureUsage(entityReturnAst), true);
  assert.equal(hasBackendReturnDtosExposureUsage(returnStatementAst), true);
  assert.equal(hasBackendReturnDtosExposureUsage(dtoReturnAst), false);
  assert.equal(hasBackendReturnDtosExposureUsage(safeReturnStatementAst), false);
});

test('findBackendReturnDtosExposureLines devuelve lineas de retornos directos de entidades', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ClassMethod',
        key: { type: 'Identifier', name: 'getOrder' },
        loc: { start: { line: 4 }, end: { line: 10 } },
        returnType: {
          type: 'TSTypeAnnotation',
          typeAnnotation: {
            type: 'TSTypeReference',
            typeName: { type: 'Identifier', name: 'Promise' },
            typeParameters: {
              params: [
                {
                  type: 'TSTypeReference',
                  typeName: { type: 'Identifier', name: 'OrderEntity' },
                },
              ],
            },
          },
        },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ReturnStatement',
              loc: { start: { line: 7 }, end: { line: 7 } },
              argument: { type: 'Identifier', name: 'orderEntity' },
            },
          ],
        },
      },
    ],
  };

  assert.deepEqual(findBackendReturnDtosExposureLines(ast), [4, 7]);
});

test('hasPrometheusMetricsPattern detecta prom-client y descarta dependencias no metrics', () => {
  const importAst = {
    type: 'ImportDeclaration',
    source: { type: 'StringLiteral', value: 'prom-client' },
  };
  const requireAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'require' },
    arguments: [{ type: 'StringLiteral', value: 'prom-client' }],
  };
  const localAst = {
    type: 'ImportDeclaration',
    source: { type: 'StringLiteral', value: './metrics' },
  };

  assert.equal(hasPrometheusMetricsPattern(importAst), true);
  assert.equal(hasPrometheusMetricsPattern(requireAst), true);
  assert.equal(hasPrometheusMetricsPattern(localAst), false);
});

test('findPrometheusMetricsMatch devuelve payload semantico para prom-client', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'MetricsController' },
        loc: { start: { line: 2 }, end: { line: 8 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassProperty',
              loc: { start: { line: 3 }, end: { line: 3 } },
              key: { type: 'Identifier', name: 'metrics' },
              value: {
                type: 'CallExpression',
                loc: { start: { line: 3 }, end: { line: 3 } },
                callee: { type: 'Identifier', name: 'require' },
                arguments: [{ type: 'StringLiteral', value: 'prom-client' }],
              },
            },
          ],
        },
      },
    ],
  };

  const match = findPrometheusMetricsMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'class',
    name: 'MetricsController',
    lines: [2],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'member', name: 'import:prom-client', lines: [3] },
  ]);
  assert.deepEqual(match?.lines, [2, 3]);
  assert.match(match?.why ?? '', /Prometheus/i);
  assert.match(match?.impact ?? '', /m[eé]tricas/i);
  assert.match(match?.expected_fix ?? '', /prom-client/i);
});

test('hasPasswordHashingPattern detecta bcrypt con salt rounds inseguros y descarta rounds seguros', () => {
  const insecureHashAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'bcrypt' },
      property: { type: 'Identifier', name: 'hashSync' },
    },
    arguments: [
      { type: 'Identifier', name: 'password' },
      { type: 'NumericLiteral', value: 8, loc: { start: { line: 4 }, end: { line: 4 } } },
    ],
  };
  const insecureSaltAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'bcryptjs' },
      property: { type: 'Identifier', name: 'genSaltSync' },
    },
    arguments: [
      { type: 'NumericLiteral', value: 6, loc: { start: { line: 8 }, end: { line: 8 } } },
    ],
  };
  const secureHashAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'bcrypt' },
      property: { type: 'Identifier', name: 'hashSync' },
    },
    arguments: [
      { type: 'Identifier', name: 'password' },
      { type: 'NumericLiteral', value: 12, loc: { start: { line: 12 }, end: { line: 12 } } },
    ],
  };

  assert.equal(hasPasswordHashingPattern(insecureHashAst), true);
  assert.equal(hasPasswordHashingPattern(insecureSaltAst), true);
  assert.equal(hasPasswordHashingPattern(secureHashAst), false);
});

test('findPasswordHashingPatternMatch devuelve payload semantico para bcrypt', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'createPasswordHash' },
        loc: { start: { line: 2 }, end: { line: 8 } },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ExpressionStatement',
              loc: { start: { line: 4 }, end: { line: 4 } },
              expression: {
                type: 'CallExpression',
                loc: { start: { line: 4 }, end: { line: 4 } },
                callee: {
                  type: 'MemberExpression',
                  computed: false,
                  object: { type: 'Identifier', name: 'bcrypt' },
                  property: { type: 'Identifier', name: 'hashSync' },
                },
                arguments: [
                  { type: 'Identifier', name: 'password' },
                  { type: 'NumericLiteral', value: 8, loc: { start: { line: 4 }, end: { line: 4 } } },
                ],
              },
            },
          ],
        },
      },
    ],
  };

  const match = findPasswordHashingPatternMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'member',
    name: 'createPasswordHash',
    lines: [2],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'call', name: 'bcrypt.hashSync', lines: [4] },
    { kind: 'member', name: 'salt rounds: 8', lines: [4] },
  ]);
  assert.deepEqual(match?.lines, [2, 4]);
  assert.match(match?.why ?? '', /salt rounds/i);
  assert.match(match?.impact ?? '', /fuerza bruta|offline/i);
  assert.match(match?.expected_fix ?? '', /10 o m[aá]s|constante/i);
});

test('hasRateLimitingThrottlerPattern detecta ThrottlerModule y decoradores de throttling y descarta variantes ajenas', () => {
  const throttlerSetupAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'ThrottlerModule' },
      property: { type: 'Identifier', name: 'forRoot' },
    },
    arguments: [],
  };
  const throttleDecoratorAst = {
    type: 'Decorator',
    expression: {
      type: 'CallExpression',
      callee: { type: 'Identifier', name: 'Throttle' },
      arguments: [
        { type: 'NumericLiteral', value: 5 },
        { type: 'NumericLiteral', value: 60 },
      ],
    },
  };
  const throttlerGuardDecoratorAst = {
    type: 'Decorator',
    expression: {
      type: 'CallExpression',
      callee: { type: 'Identifier', name: 'UseGuards' },
      arguments: [{ type: 'Identifier', name: 'ThrottlerGuard' }],
    },
  };
  const unrelatedAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'RateLimitModule' },
      property: { type: 'Identifier', name: 'forRoot' },
    },
    arguments: [],
  };

  assert.equal(hasRateLimitingThrottlerPattern(throttlerSetupAst), true);
  assert.equal(hasRateLimitingThrottlerPattern(throttleDecoratorAst), true);
  assert.equal(hasRateLimitingThrottlerPattern(throttlerGuardDecoratorAst), true);
  assert.equal(hasRateLimitingThrottlerPattern(unrelatedAst), false);
});

test('findRateLimitingThrottlerMatch devuelve payload semantico para @UseGuards(ThrottlerGuard)', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'AuthController' },
        loc: { start: { line: 3 }, end: { line: 18 } },
        decorators: [
          {
            type: 'Decorator',
            loc: { start: { line: 3 }, end: { line: 3 } },
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'UseGuards' },
              arguments: [{ type: 'Identifier', name: 'ThrottlerGuard' }],
            },
          },
        ],
        body: {
          type: 'ClassBody',
          body: [],
        },
      },
    ],
  };

  const match = findRateLimitingThrottlerMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'class',
    name: 'AuthController',
    lines: [3],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'call', name: 'UseGuards', lines: [3] },
    { kind: 'member', name: 'ThrottlerGuard', lines: [3] },
  ]);
  assert.deepEqual(match?.lines, [3]);
  assert.match(match?.why ?? '', /rate limiting/i);
  assert.match(match?.impact ?? '', /brute force|abuso/i);
  assert.match(match?.expected_fix ?? '', /ThrottlerModule|Throttle|ThrottlerGuard/i);
});

test('hasWinstonStructuredLoggerPattern detecta createLogger con JSON logs y descarta configuraciones planas', () => {
  const structuredLoggerAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'winston' },
      property: { type: 'Identifier', name: 'createLogger' },
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'format' },
            value: {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                computed: false,
                object: { type: 'Identifier', name: 'format' },
                property: { type: 'Identifier', name: 'json' },
              },
              arguments: [],
            },
          },
        ],
      },
    ],
  };
  const flatLoggerAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'winston' },
      property: { type: 'Identifier', name: 'createLogger' },
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'level' },
            value: { type: 'StringLiteral', value: 'info' },
          },
        ],
      },
    ],
  };

  assert.equal(hasWinstonStructuredLoggerPattern(structuredLoggerAst), true);
  assert.equal(hasWinstonStructuredLoggerPattern(flatLoggerAst), false);
});

test('findWinstonStructuredLoggerMatch devuelve payload semantico para Winston con JSON logs', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'buildLogger' },
        loc: { start: { line: 2 }, end: { line: 10 } },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'VariableDeclaration',
              loc: { start: { line: 4 }, end: { line: 4 } },
              declarations: [
                {
                  type: 'VariableDeclarator',
                  id: { type: 'Identifier', name: 'logger' },
                  init: {
                    type: 'CallExpression',
                    loc: { start: { line: 4 }, end: { line: 4 } },
                    callee: {
                      type: 'MemberExpression',
                      computed: false,
                      object: { type: 'Identifier', name: 'winston' },
                      property: { type: 'Identifier', name: 'createLogger' },
                    },
                    arguments: [
                      {
                        type: 'ObjectExpression',
                        properties: [
                          {
                            type: 'ObjectProperty',
                            key: { type: 'Identifier', name: 'format' },
                            value: {
                              type: 'CallExpression',
                              loc: { start: { line: 4 }, end: { line: 4 } },
                              callee: {
                                type: 'MemberExpression',
                                computed: false,
                                object: { type: 'Identifier', name: 'format' },
                                property: { type: 'Identifier', name: 'json' },
                              },
                              arguments: [],
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };

  const match = findWinstonStructuredLoggerMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'member',
    name: 'logger',
    lines: undefined,
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'call', name: 'winston.createLogger', lines: [4] },
    { kind: 'member', name: 'format.json', lines: [4] },
  ]);
  assert.deepEqual(match?.lines, [4]);
  assert.match(match?.why ?? '', /Winston/i);
  assert.match(match?.impact ?? '', /JSON|agregadores|correlation/i);
  assert.match(match?.expected_fix ?? '', /createLogger|format\.json/i);
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

test('hasCallbackHellPattern detecta callbacks anidados y descarta encadenado plano', () => {
  const callbackHellAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'AsyncFlowService' },
        loc: { start: { line: 1 }, end: { line: 14 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'load' },
              loc: { start: { line: 2 }, end: { line: 13 } },
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ExpressionStatement',
                    loc: { start: { line: 3 }, end: { line: 12 } },
                    expression: {
                      type: 'CallExpression',
                      loc: { start: { line: 3 }, end: { line: 12 } },
                      callee: {
                        type: 'MemberExpression',
                        computed: false,
                        object: {
                          type: 'CallExpression',
                          loc: { start: { line: 3 }, end: { line: 3 } },
                          callee: { type: 'Identifier', name: 'fetchData' },
                          arguments: [],
                        },
                        property: { type: 'Identifier', name: 'then' },
                      },
                      arguments: [
                        {
                          type: 'ArrowFunctionExpression',
                          loc: { start: { line: 4 }, end: { line: 11 } },
                          body: {
                            type: 'BlockStatement',
                            body: [
                              {
                                type: 'ExpressionStatement',
                                loc: { start: { line: 5 }, end: { line: 10 } },
                                expression: {
                                  type: 'CallExpression',
                                  loc: { start: { line: 5 }, end: { line: 10 } },
                                  callee: {
                                    type: 'MemberExpression',
                                    computed: false,
                                    object: {
                                      type: 'CallExpression',
                                      loc: { start: { line: 5 }, end: { line: 5 } },
                                      callee: { type: 'Identifier', name: 'persist' },
                                      arguments: [],
                                    },
                                    property: { type: 'Identifier', name: 'then' },
                                  },
                                  arguments: [
                                    {
                                      type: 'ArrowFunctionExpression',
                                      loc: { start: { line: 6 }, end: { line: 9 } },
                                      body: { type: 'BlockStatement', body: [] },
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
              },
            },
          ],
        },
      },
    ],
  };
  const flatChainAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'fetchData' },
        arguments: [],
      },
      property: { type: 'Identifier', name: 'then' },
    },
    arguments: [
      {
        type: 'ArrowFunctionExpression',
        body: { type: 'BlockStatement', body: [] },
      },
    ],
  };

  assert.equal(hasCallbackHellPattern(callbackHellAst), true);
  assert.equal(hasCallbackHellPattern(flatChainAst), false);

  const match = findCallbackHellPatternMatch(callbackHellAst);
  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: 'load',
    lines: [2],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'call', name: 'then callback', lines: [3] },
    { kind: 'call', name: 'then nested callback', lines: [5] },
  ]);
  assert.deepEqual(match.lines, [2, 3, 4, 5]);
  assert.match(match.why, /async\/await/i);
  assert.match(match.impact, /difícil de leer/i);
  assert.match(match.expected_fix, /async\/await/i);
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

test('hasLargeClassDeclaration detecta god class por mezcla semantica de responsabilidades', () => {
  const godClassAst = {
    type: 'ClassDeclaration',
    loc: {
      start: { line: 1 },
      end: { line: 80 },
    },
    body: {
      type: 'ClassBody',
      body: [
        {
          type: 'ClassProperty',
          loc: { start: { line: 15 }, end: { line: 15 } },
          key: { type: 'Identifier', name: 'client' },
          value: {
            type: 'NewExpression',
            callee: { type: 'Identifier', name: 'PrismaClient' },
            arguments: [],
          },
        },
        {
          type: 'ClassMethod',
          key: { type: 'Identifier', name: 'getOrder' },
          loc: { start: { line: 20 }, end: { line: 24 } },
          body: { type: 'BlockStatement', body: [] },
        },
        {
          type: 'ClassMethod',
          key: { type: 'Identifier', name: 'saveOrder' },
          loc: { start: { line: 30 }, end: { line: 40 } },
          body: { type: 'BlockStatement', body: [] },
        },
      ],
    },
  };
  const oversizedButSingleResponsibilityAst = {
    type: 'ClassDeclaration',
    loc: {
      start: { line: 1 },
      end: { line: 1_000 },
    },
    body: {
      type: 'ClassBody',
      body: [
        {
          type: 'ClassMethod',
          key: { type: 'Identifier', name: 'getOrder' },
          loc: { start: { line: 20 }, end: { line: 24 } },
          body: { type: 'BlockStatement', body: [] },
        },
      ],
    },
  };
  const srpOnlyAst = {
    type: 'ClassDeclaration',
    loc: {
      start: { line: 1 },
      end: { line: 80 },
    },
    body: {
      type: 'ClassBody',
      body: [
        {
          type: 'ClassMethod',
          key: { type: 'Identifier', name: 'getOrder' },
          loc: { start: { line: 20 }, end: { line: 24 } },
          body: { type: 'BlockStatement', body: [] },
        },
        {
          type: 'ClassMethod',
          key: { type: 'Identifier', name: 'saveOrder' },
          loc: { start: { line: 30 }, end: { line: 40 } },
          body: { type: 'BlockStatement', body: [] },
        },
      ],
    },
  };

  assert.equal(hasLargeClassDeclaration(godClassAst), true);
  assert.equal(hasLargeClassDeclaration(oversizedButSingleResponsibilityAst), false);
  assert.equal(hasLargeClassDeclaration(srpOnlyAst), false);

  const match = findLargeClassDeclarationMatch(godClassAst);
  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'class',
    name: 'AnonymousClass',
    lines: [1],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'member', name: 'query:getOrder', lines: [20] },
    { kind: 'member', name: 'command:saveOrder', lines: [30] },
    { kind: 'call', name: 'new PrismaClient', lines: [15] },
  ]);
  assert.match(match?.why ?? '', /God Class/i);
});

test('hasReactClassComponentUsage detecta class components de React e ignora clases no React', () => {
  const reactClassAst = {
    type: 'Program',
    body: [
      {
        type: 'ImportDeclaration',
        loc: { start: { line: 1 }, end: { line: 1 } },
        source: { type: 'StringLiteral', value: 'react' },
        specifiers: [
          {
            type: 'ImportDefaultSpecifier',
            local: { type: 'Identifier', name: 'React' },
          },
        ],
      },
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'LegacyCounter' },
        superClass: {
          type: 'MemberExpression',
          computed: false,
          object: { type: 'Identifier', name: 'React' },
          property: { type: 'Identifier', name: 'Component' },
          loc: { start: { line: 3 }, end: { line: 3 } },
        },
        loc: { start: { line: 4 }, end: { line: 18 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'render' },
              loc: { start: { line: 8 }, end: { line: 14 } },
              body: { type: 'BlockStatement', body: [] },
            },
          ],
        },
      },
    ],
  };
  const nonReactClassAst = {
    type: 'Program',
    body: [
      {
        type: 'ImportDeclaration',
        loc: { start: { line: 1 }, end: { line: 1 } },
        source: { type: 'StringLiteral', value: 'somewhere-else' },
        specifiers: [
          {
            type: 'ImportDefaultSpecifier',
            local: { type: 'Identifier', name: 'Component' },
          },
        ],
      },
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'PlainClass' },
        superClass: { type: 'Identifier', name: 'Component' },
        loc: { start: { line: 4 }, end: { line: 9 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'render' },
              loc: { start: { line: 6 }, end: { line: 8 } },
              body: { type: 'BlockStatement', body: [] },
            },
          ],
        },
      },
    ],
  };

  assert.equal(hasReactClassComponentUsage(reactClassAst), true);
  assert.equal(hasReactClassComponentUsage(nonReactClassAst), false);
});

test('findReactClassComponentMatch devuelve payload semantico para class components de React', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ImportDeclaration',
        loc: { start: { line: 1 }, end: { line: 1 } },
        source: { type: 'StringLiteral', value: 'react' },
        specifiers: [
          {
            type: 'ImportDefaultSpecifier',
            local: { type: 'Identifier', name: 'React' },
          },
        ],
      },
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'LegacyCounter' },
        superClass: {
          type: 'MemberExpression',
          computed: false,
          object: { type: 'Identifier', name: 'React' },
          property: { type: 'Identifier', name: 'Component' },
          loc: { start: { line: 3 }, end: { line: 3 } },
        },
        loc: { start: { line: 4 }, end: { line: 18 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassProperty',
              key: { type: 'Identifier', name: 'state' },
              loc: { start: { line: 5 }, end: { line: 5 } },
            },
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'render' },
              loc: { start: { line: 8 }, end: { line: 14 } },
              body: { type: 'BlockStatement', body: [] },
            },
          ],
        },
      },
    ],
  };

  const match = findReactClassComponentMatch(ast);

  assert.ok(match);
  assert.deepEqual(match?.primary_node, {
    kind: 'class',
    name: 'LegacyCounter',
    lines: [4],
  });
  assert.deepEqual(match?.related_nodes, [
    { kind: 'member', name: 'extends React.Component', lines: [3] },
    { kind: 'member', name: 'import from react', lines: [1] },
  ]);
  assert.deepEqual(match?.lines, [1, 3, 4]);
  assert.match(match?.why ?? '', /componente funcional/i);
  assert.match(match?.impact ?? '', /hooks/i);
  assert.match(match?.expected_fix ?? '', /custom hooks/i);
});

test('findReactClassComponentLines devuelve lineas de class components de React', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'ImportDeclaration',
        loc: { start: { line: 1 }, end: { line: 1 } },
        source: { type: 'StringLiteral', value: 'react' },
        specifiers: [
          {
            type: 'ImportDefaultSpecifier',
            local: { type: 'Identifier', name: 'React' },
          },
        ],
      },
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'LegacyCounter' },
        superClass: {
          type: 'MemberExpression',
          computed: false,
          object: { type: 'Identifier', name: 'React' },
          property: { type: 'Identifier', name: 'Component' },
        },
        loc: { start: { line: 4 }, end: { line: 18 } },
        body: { type: 'ClassBody', body: [] },
      },
    ],
  };

  assert.deepEqual(findReactClassComponentLines(ast), [4]);
});

test('hasSingletonPattern detecta constructor privado y singleton estatico', () => {
  const singletonAst = {
    type: 'ClassDeclaration',
    loc: {
      start: { line: 1 },
      end: { line: 20 },
    },
    id: { type: 'Identifier', name: 'SingletonService' },
    body: {
      type: 'ClassBody',
      body: [
        {
          type: 'ClassMethod',
          kind: 'constructor',
          accessibility: 'private',
          key: { type: 'Identifier', name: 'constructor' },
          loc: { start: { line: 2 }, end: { line: 4 } },
          body: { type: 'BlockStatement', body: [] },
        },
        {
          type: 'ClassProperty',
          static: true,
          key: { type: 'Identifier', name: 'instance' },
          loc: { start: { line: 5 }, end: { line: 5 } },
          value: {
            type: 'NewExpression',
            callee: { type: 'Identifier', name: 'SingletonService' },
            arguments: [],
          },
        },
      ],
    },
  };
  const utilityAst = {
    type: 'ClassDeclaration',
    loc: {
      start: { line: 1 },
      end: { line: 18 },
    },
    id: { type: 'Identifier', name: 'UtilityService' },
    body: {
      type: 'ClassBody',
      body: [
        {
          type: 'ClassMethod',
          kind: 'constructor',
          accessibility: 'private',
          key: { type: 'Identifier', name: 'constructor' },
          loc: { start: { line: 2 }, end: { line: 4 } },
          body: { type: 'BlockStatement', body: [] },
        },
        {
          type: 'ClassMethod',
          static: true,
          key: { type: 'Identifier', name: 'format' },
          loc: { start: { line: 6 }, end: { line: 8 } },
          body: { type: 'BlockStatement', body: [] },
        },
      ],
    },
  };

  assert.equal(hasSingletonPattern(singletonAst), true);
  const match = findSingletonPatternMatch(singletonAst);
  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'class',
    name: 'SingletonService',
    lines: [1],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'private constructor', lines: [2] },
    { kind: 'member', name: 'static instance', lines: [5] },
  ]);
  assert.equal(hasSingletonPattern(utilityAst), false);
});

test('hasMagicNumberPattern detecta literales numericos en runtime y omite enums o tipos', () => {
  const magicNumberAst = {
    type: 'FunctionDeclaration',
    id: { type: 'Identifier', name: 'buildRetryPolicy' },
    loc: { start: { line: 1 }, end: { line: 8 } },
    body: {
      type: 'BlockStatement',
      body: [
        {
          type: 'ReturnStatement',
          loc: { start: { line: 4 }, end: { line: 4 } },
          argument: {
            type: 'NumericLiteral',
            value: 3,
            loc: { start: { line: 4 }, end: { line: 4 } },
          },
        },
      ],
    },
  };
  const enumAst = {
    type: 'TSEnumMember',
    id: { type: 'Identifier', name: 'RetryPolicy' },
    initializer: {
      type: 'NumericLiteral',
      value: 3,
      loc: { start: { line: 12 }, end: { line: 12 } },
    },
  };

  assert.equal(hasMagicNumberPattern(magicNumberAst), true);
  const match = findMagicNumberPatternMatch(magicNumberAst);
  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: 'buildRetryPolicy',
    lines: [1],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'numeric literal: 3', lines: [4] },
  ]);
  assert.equal(hasMagicNumberPattern(enumAst), false);
  assert.equal(findMagicNumberPatternMatch(enumAst), undefined);
});

test('hasHardcodedValuePattern detecta literals de configuracion y omite valores neutros', () => {
  const hardcodedConfigAst = {
    type: 'VariableDeclarator',
    id: { type: 'Identifier', name: 'apiBaseUrl' },
    init: {
      type: 'StringLiteral',
      value: 'https://api.example.com',
      loc: { start: { line: 3 }, end: { line: 3 } },
    },
    loc: { start: { line: 3 }, end: { line: 3 } },
  };
  const neutralLiteralAst = {
    type: 'VariableDeclarator',
    id: { type: 'Identifier', name: 'count' },
    init: {
      type: 'NumericLiteral',
      value: 3,
      loc: { start: { line: 9 }, end: { line: 9 } },
    },
    loc: { start: { line: 9 }, end: { line: 9 } },
  };

  assert.equal(hasHardcodedValuePattern(hardcodedConfigAst), true);
  const match = findHardcodedValuePatternMatch(hardcodedConfigAst);
  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: 'apiBaseUrl',
    lines: [3],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'hardcoded value: https://api.example.com', lines: [3] },
  ]);
  assert.equal(hasHardcodedValuePattern(neutralLiteralAst), false);
});

test('hasHardcodedValuePattern no bloquea tokens internos de metadata AST', () => {
  const astNodeTokenAst = {
    type: 'VariableDeclarator',
    id: { type: 'Identifier', name: 'astNodeToken' },
    init: {
      type: 'StringLiteral',
      value: 'none',
      loc: { start: { line: 4 }, end: { line: 4 } },
    },
    loc: { start: { line: 4 }, end: { line: 4 } },
  };

  assert.equal(hasHardcodedValuePattern(astNodeTokenAst), false);
  assert.equal(findHardcodedValuePatternMatch(astNodeTokenAst), undefined);
});

test('hasHardcodedValuePattern usa tokens exactos y no subcadenas accidentales', () => {
  const reportFunctionAst = {
    type: 'FunctionDeclaration',
    id: { type: 'Identifier', name: 'formatVintageEvidenceReportLines' },
    loc: { start: { line: 1 }, end: { line: 5 } },
    body: {
      type: 'BlockStatement',
      body: [
        {
          type: 'ReturnStatement',
          argument: {
            type: 'StringLiteral',
            value: 'Advanced Project Audit',
            loc: { start: { line: 3 }, end: { line: 3 } },
          },
        },
      ],
    },
  };
  const uiKeyAst = {
    type: 'ObjectProperty',
    key: { type: 'Identifier', name: 'key' },
    value: {
      type: 'StringLiteral',
      value: 'ast-intelligence-legacy',
      loc: { start: { line: 8 }, end: { line: 8 } },
    },
    loc: { start: { line: 8 }, end: { line: 8 } },
  };
  const configModuleDetectorAst = {
    type: 'FunctionDeclaration',
    id: { type: 'Identifier', name: 'isValidationConfigModuleCallExpression' },
    body: {
      type: 'BlockStatement',
      body: [
        {
          type: 'ReturnStatement',
          argument: {
            type: 'LogicalExpression',
            left: {
              type: 'BinaryExpression',
              left: { type: 'Identifier', name: 'objectName' },
              operator: '===',
              right: { type: 'StringLiteral', value: 'ConfigModule', loc: { start: { line: 16 }, end: { line: 16 } } },
            },
            operator: '&&',
            right: {
              type: 'BinaryExpression',
              left: { type: 'Identifier', name: 'propertyName' },
              operator: '===',
              right: { type: 'StringLiteral', value: 'forRoot', loc: { start: { line: 16 }, end: { line: 16 } } },
            },
          },
        },
      ],
    },
  };
  const apiVersionDetectorAst = {
    type: 'VariableDeclaration',
    declarations: [
      {
        type: 'VariableDeclarator',
        id: { type: 'Identifier', name: 'apiVersionDecoratorNames' },
        init: {
          type: 'NewExpression',
          callee: { type: 'Identifier', name: 'Set' },
          arguments: [
            {
              type: 'ArrayExpression',
              elements: [
                { type: 'StringLiteral', value: 'controller', loc: { start: { line: 24 }, end: { line: 24 } } },
                { type: 'StringLiteral', value: 'version', loc: { start: { line: 24 }, end: { line: 24 } } },
              ],
            },
          ],
        },
      },
    ],
  };
  const passwordDetectorAst = {
    type: 'FunctionDeclaration',
    id: { type: 'Identifier', name: 'isPasswordHashingCallExpression' },
    body: {
      type: 'BlockStatement',
      body: [
        {
          type: 'IfStatement',
          test: {
            type: 'BinaryExpression',
            left: { type: 'MemberExpression', object: { type: 'Identifier', name: 'node' }, property: { type: 'Identifier', name: 'type' } },
            operator: '!==',
            right: { type: 'StringLiteral', value: 'CallExpression', loc: { start: { line: 31 }, end: { line: 31 } } },
          },
        },
        {
          type: 'ReturnStatement',
          argument: {
            type: 'BinaryExpression',
            left: { type: 'UnaryExpression', operator: 'typeof', argument: { type: 'Identifier', name: 'objectName' } },
            operator: '===',
            right: { type: 'StringLiteral', value: 'string', loc: { start: { line: 34 }, end: { line: 34 } } },
          },
        },
        {
          type: 'IfStatement',
          test: {
            type: 'BinaryExpression',
            left: {
              type: 'MemberExpression',
              object: { type: 'Identifier', name: 'arguments' },
              property: { type: 'Identifier', name: 'length' },
            },
            operator: '===',
            right: { type: 'NumericLiteral', value: 0, loc: { start: { line: 37 }, end: { line: 37 } } },
          },
        },
      ],
    },
  };
  const timeoutDetectorAst = {
    type: 'FunctionDeclaration',
    id: { type: 'Identifier', name: 'hasSetTimeoutStringCallback' },
    body: {
      type: 'BlockStatement',
      body: [
        {
          type: 'ReturnStatement',
          argument: {
            type: 'BinaryExpression',
            left: { type: 'MemberExpression', object: { type: 'Identifier', name: 'callee' }, property: { type: 'Identifier', name: 'name' } },
            operator: '!==',
            right: { type: 'StringLiteral', value: 'setTimeout', loc: { start: { line: 45 }, end: { line: 45 } } },
          },
        },
        {
          type: 'ReturnStatement',
          argument: {
            type: 'BinaryExpression',
            left: { type: 'MemberExpression', object: { type: 'Identifier', name: 'firstArg' }, property: { type: 'Identifier', name: 'type' } },
            operator: '===',
            right: { type: 'StringLiteral', value: 'TemplateLiteral', loc: { start: { line: 48 }, end: { line: 48 } } },
          },
        },
      ],
    },
  };
  const hardcodedDetectorAst = {
    type: 'FunctionDeclaration',
    id: { type: 'Identifier', name: 'hasHardcodedConfigNameToken' },
    body: {
      type: 'BlockStatement',
      body: [
        {
          type: 'ReturnStatement',
          argument: {
            type: 'CallExpression',
            callee: {
              type: 'MemberExpression',
              object: { type: 'Identifier', name: 'tokenSet' },
              property: { type: 'Identifier', name: 'has' },
            },
            arguments: [{ type: 'StringLiteral', value: 'key', loc: { start: { line: 54 }, end: { line: 54 } } }],
          },
        },
      ],
    },
  };
  const processEnvDetectorAst = {
    type: 'FunctionDeclaration',
    id: { type: 'Identifier', name: 'isProcessEnvBaseAccess' },
    body: {
      type: 'BlockStatement',
      body: [
        {
          type: 'ReturnStatement',
          argument: {
            type: 'LogicalExpression',
            left: {
              type: 'BinaryExpression',
              left: { type: 'MemberExpression', object: { type: 'Identifier', name: 'object' }, property: { type: 'Identifier', name: 'name' } },
              operator: '===',
              right: { type: 'StringLiteral', value: 'process', loc: { start: { line: 60 }, end: { line: 60 } } },
            },
            operator: '&&',
            right: {
              type: 'BinaryExpression',
              left: { type: 'MemberExpression', object: { type: 'Identifier', name: 'property' }, property: { type: 'Identifier', name: 'name' } },
              operator: '===',
              right: { type: 'StringLiteral', value: 'env', loc: { start: { line: 61 }, end: { line: 61 } } },
            },
          },
        },
      ],
    },
  };

  assert.equal(hasHardcodedValuePattern(reportFunctionAst), false);
  assert.equal(hasHardcodedValuePattern(uiKeyAst), false);
  assert.equal(hasHardcodedValuePattern(configModuleDetectorAst), false);
  assert.equal(hasHardcodedValuePattern(apiVersionDetectorAst), false);
  assert.equal(hasHardcodedValuePattern(passwordDetectorAst), false);
  assert.equal(hasHardcodedValuePattern(timeoutDetectorAst), false);
  assert.equal(hasHardcodedValuePattern(hardcodedDetectorAst), false);
  assert.equal(hasHardcodedValuePattern(processEnvDetectorAst), false);
});

test('hasEnvDefaultFallbackPattern detecta defaults implícitos sobre process.env y descarta accesos directos', () => {
  const envDefaultAst = {
    type: 'LogicalExpression',
    operator: '||',
    left: {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'MemberExpression',
        computed: false,
        object: { type: 'Identifier', name: 'process' },
        property: { type: 'Identifier', name: 'env' },
      },
      property: { type: 'Identifier', name: 'API_URL' },
      loc: { start: { line: 6 }, end: { line: 6 } },
    },
    right: {
      type: 'StringLiteral',
      value: 'http://localhost:3000',
      loc: { start: { line: 6 }, end: { line: 6 } },
    },
    loc: { start: { line: 6 }, end: { line: 6 } },
  };
  const directEnvAccessAst = {
    type: 'MemberExpression',
    computed: false,
    object: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'process' },
      property: { type: 'Identifier', name: 'env' },
    },
    property: { type: 'Identifier', name: 'API_URL' },
    loc: { start: { line: 9 }, end: { line: 9 } },
  };

  assert.equal(hasEnvDefaultFallbackPattern(envDefaultAst), true);
  const match = findEnvDefaultFallbackPatternMatch(envDefaultAst);
  assert.ok(match);
  assert.deepEqual(match.primary_node, {
    kind: 'member',
    name: 'API_URL',
    lines: [6],
  });
  assert.deepEqual(match.related_nodes, [
    { kind: 'member', name: 'fallback value: http://localhost:3000', lines: [6] },
  ]);
  assert.equal(hasEnvDefaultFallbackPattern(directEnvAccessAst), false);
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
