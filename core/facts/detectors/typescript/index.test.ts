import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findEmptyCatchClauseLines,
  findConcreteDependencyInstantiationMatch,
  findDtoPropertyWithoutValidationMatch,
  findDtoNestedPropertyWithoutNestedValidationMatch,
  findBackendControllerRouteWithoutGuardLines,
  findBackendControllerRouteWithoutRolesLines,
  findBackendEventHandlerWithoutOnEventLines,
  findBackendAuthRouteWithoutThrottleLines,
  findBackendPermissiveCorsConfigurationLines,
  findBackendStringLiteralUnionEnumCandidateLines,
  findBackendSensitiveCacheWriteLines,
  findBackendHardDeleteWithoutSoftDeleteLines,
  findBackendLogWithoutContextLines,
  findBackendAuthResponseWithoutRefreshTokenLines,
  findBackendProcessEnvDefaultFallbackLines,
  findBackendDirectProcessEnvReadLines,
  findBackendConfigModuleWithoutValidationLines,
  findBackendInconsistentErrorResponseLines,
  findBackendErrorPayloadWithSuccessStatusLines,
  findBackendControllerEntityResponseLines,
  findBackendControllerBusinessLogicMatch,
  findBackendRepositoryBusinessLogicMatch,
  findBackendRawThrowExpressionLines,
  findBackendMissingGlobalValidationPipeLines,
  findBackendMissingHelmetSecurityHeadersLines,
  findBackendMissingCompressionMiddlewareLines,
  findFrameworkDependencyImportMatch,
  findMixedCommandQueryClassMatch,
  findMixedCommandQueryInterfaceMatch,
  findOverrideMethodThrowingNotImplementedMatch,
  findTypeDiscriminatorSwitchMatch,
  findNetworkCallWithoutErrorHandlingLines,
  findNestJsConstructorDependencyWithoutDecoratorMatch,
  findPersistenceMutationWithoutAuditEventMatch,
  findDtoPropertyWithoutApiPropertyLines,
  findRecordStringUnknownTypeLines,
  findUndefinedInBaseTypeUnionLines,
  findUnknownWithoutGuardLines,
  findUnknownTypeAssertionLines,
  hasAsyncPromiseExecutor,
  hasConcreteDependencyInstantiation,
  hasConsoleErrorCall,
  hasConsoleLogCall,
  hasDebuggerStatement,
  hasDeleteOperator,
  hasDefaultExportedApiRouteHandler,
  hasDirectNetworkCall,
  hasDtoPropertyWithoutValidation,
  hasDtoPropertyWithoutApiProperty,
  hasDtoNestedPropertyWithoutNestedValidation,
  hasBackendControllerRouteWithoutGuard,
  hasBackendControllerRouteWithoutRoles,
  hasBackendEventHandlerWithoutOnEvent,
  hasBackendAuthRouteWithoutThrottle,
  hasBackendPermissiveCorsConfiguration,
  hasBackendStringLiteralUnionEnumCandidate,
  hasBackendSensitiveCacheWrite,
  hasBackendHardDeleteWithoutSoftDelete,
  hasBackendInconsistentErrorResponse,
  hasBackendErrorPayloadWithSuccessStatus,
  hasBackendControllerEntityResponse,
  hasBackendControllerBusinessLogic,
  hasBackendRepositoryBusinessLogic,
  hasBackendRawThrowExpression,
  hasBackendMissingGlobalValidationPipe,
  hasBackendMissingHelmetSecurityHeaders,
  hasBackendMissingCompressionMiddleware,
  hasEmptyCatchClause,
  hasEvalCall,
  hasExplicitAnyType,
  hasFrameworkDependencyImport,
  hasFunctionConstructorUsage,
  hasInterpolatedUnsafeSqlCall,
  hasNestedCallbackUsage,
  hasNestedIfElseStatement,
  hasNestJsConstructorDependencyWithoutDecorator,
  hasBackendLogWithoutContext,
  hasBackendAuthResponseWithoutRefreshToken,
  hasBackendProcessEnvDefaultFallback,
  hasBackendDirectProcessEnvRead,
  hasBackendConfigModuleWithoutValidation,
  hasBackendMagicNumberLiteral,
  hasBackendGenericErrorThrow,
  hasBackendProductionMockOrSpy,
  hasBackendErrorStackInHttpResponse,
  hasBackendAnemicDomainModel,
  hasNonSemanticClickableJsx,
  hasSensitiveDataLoggingCall,
  hasSensitiveTokenInUrl,
  hasPersistenceMutationWithoutAuditEvent,
  hasWeakBcryptSaltRounds,
  hasNetworkCallWithoutErrorHandling,
  hasMixedCommandQueryClass,
  hasMixedCommandQueryInterface,
  hasUnknownWithoutGuard,
  hasRecordStringUnknownType,
  hasRedundantAriaRoleOnSemanticJsx,
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

test('hasSensitiveDataLoggingCall detecta datos sensibles en sinks de logging', () => {
  const sensitiveConsoleAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'console' },
      property: { type: 'Identifier', name: 'log' },
    },
    arguments: [{ type: 'Identifier', name: 'accessToken' }],
  };
  const sensitiveLoggerAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'logger' },
      property: { type: 'Identifier', name: 'error' },
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'password' },
            value: { type: 'Identifier', name: 'password' },
          },
        ],
      },
    ],
  };
  const safeLoggerAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'logger' },
      property: { type: 'Identifier', name: 'info' },
    },
    arguments: [{ type: 'Identifier', name: 'orderId' }],
  };

  assert.equal(hasSensitiveDataLoggingCall(sensitiveConsoleAst), true);
  assert.equal(hasSensitiveDataLoggingCall(sensitiveLoggerAst), true);
  assert.equal(hasSensitiveDataLoggingCall(safeLoggerAst), false);
});

test('hasBackendLogWithoutContext detecta logs backend sin request user o trace context', () => {
  const errorWithoutContextAst = {
    type: 'File',
    program: {
      type: 'Program',
      body: [
        {
          type: 'ExpressionStatement',
          loc: { start: { line: 8 } },
          expression: {
            type: 'CallExpression',
            loc: { start: { line: 8 } },
            callee: {
              type: 'MemberExpression',
              computed: false,
              object: { type: 'Identifier', name: 'logger' },
              property: { type: 'Identifier', name: 'error' },
            },
            arguments: [{ type: 'Identifier', name: 'error' }],
          },
        },
        {
          type: 'ExpressionStatement',
          loc: { start: { line: 12 } },
          expression: {
            type: 'CallExpression',
            loc: { start: { line: 12 } },
            callee: {
              type: 'MemberExpression',
              computed: false,
              object: { type: 'Identifier', name: 'logger' },
              property: { type: 'Identifier', name: 'error' },
            },
            arguments: [
              {
                type: 'ObjectExpression',
                properties: [
                  {
                    type: 'ObjectProperty',
                    key: { type: 'Identifier', name: 'message' },
                    value: { type: 'MemberExpression', property: { type: 'Identifier', name: 'message' } },
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  };
  const contextualLoggerAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'logger' },
      property: { type: 'Identifier', name: 'error' },
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [
          { type: 'ObjectProperty', key: { type: 'Identifier', name: 'message' }, value: { type: 'Identifier', name: 'message' } },
          { type: 'ObjectProperty', key: { type: 'Identifier', name: 'requestId' }, value: { type: 'Identifier', name: 'requestId' } },
          { type: 'ObjectProperty', key: { type: 'Identifier', name: 'traceId' }, value: { type: 'Identifier', name: 'traceId' } },
          { type: 'ObjectProperty', key: { type: 'Identifier', name: 'userId' }, value: { type: 'Identifier', name: 'userId' } },
        ],
      },
    ],
  };

  assert.equal(hasBackendLogWithoutContext(errorWithoutContextAst), true);
  assert.deepEqual(findBackendLogWithoutContextLines(errorWithoutContextAst), [8, 12]);
  assert.equal(hasBackendLogWithoutContext(contextualLoggerAst), false);
});

test('hasBackendAuthResponseWithoutRefreshToken detecta respuestas auth solo con access token', () => {
  const accessOnlyResponseAst = {
    type: 'Program',
    body: [
      {
        type: 'ReturnStatement',
        argument: {
          type: 'ObjectExpression',
          loc: { start: { line: 16 }, end: { line: 19 } },
          properties: [
            {
              type: 'ObjectProperty',
              key: { type: 'Identifier', name: 'accessToken' },
              value: { type: 'Identifier', name: 'accessToken' },
            },
          ],
        },
      },
    ],
  };
  const refreshTokenResponseAst = {
    type: 'Program',
    body: [
      {
        type: 'ReturnStatement',
        argument: {
          type: 'ObjectExpression',
          loc: { start: { line: 27 }, end: { line: 31 } },
          properties: [
            {
              type: 'ObjectProperty',
              key: { type: 'Identifier', name: 'accessToken' },
              value: { type: 'Identifier', name: 'accessToken' },
            },
            {
              type: 'ObjectProperty',
              key: { type: 'Identifier', name: 'refreshToken' },
              value: { type: 'Identifier', name: 'refreshToken' },
            },
          ],
        },
      },
    ],
  };

  assert.equal(hasBackendAuthResponseWithoutRefreshToken(accessOnlyResponseAst), true);
  assert.deepEqual(findBackendAuthResponseWithoutRefreshTokenLines(accessOnlyResponseAst), [16]);
  assert.equal(hasBackendAuthResponseWithoutRefreshToken(refreshTokenResponseAst), false);
});

test('hasBackendProcessEnvDefaultFallback detecta defaults literales en process.env', () => {
  const envFallbackAst = {
    type: 'Program',
    body: [
      {
        type: 'VariableDeclaration',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: { type: 'Identifier', name: 'jwtSecret' },
            init: {
              type: 'LogicalExpression',
              operator: '||',
              loc: { start: { line: 6 }, end: { line: 6 } },
              left: {
                type: 'MemberExpression',
                object: {
                  type: 'MemberExpression',
                  object: { type: 'Identifier', name: 'process' },
                  property: { type: 'Identifier', name: 'env' },
                },
                property: { type: 'Identifier', name: 'JWT_SECRET' },
              },
              right: { type: 'StringLiteral', value: 'dev-secret' },
            },
          },
          {
            type: 'VariableDeclarator',
            id: { type: 'Identifier', name: 'port' },
            init: {
              type: 'LogicalExpression',
              operator: '??',
              loc: { start: { line: 9 }, end: { line: 9 } },
              left: {
                type: 'MemberExpression',
                object: {
                  type: 'MemberExpression',
                  object: { type: 'Identifier', name: 'process' },
                  property: { type: 'Identifier', name: 'env' },
                },
                property: { type: 'Identifier', name: 'PORT' },
              },
              right: { type: 'NumericLiteral', value: 3000 },
            },
          },
        ],
      },
    ],
  };
  const strictEnvAst = {
    type: 'Program',
    body: [
      {
        type: 'VariableDeclaration',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: { type: 'Identifier', name: 'jwtSecret' },
            init: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'requiredEnv' },
              arguments: [
                {
                  type: 'MemberExpression',
                  object: {
                    type: 'MemberExpression',
                    object: { type: 'Identifier', name: 'process' },
                    property: { type: 'Identifier', name: 'env' },
                  },
                  property: { type: 'Identifier', name: 'JWT_SECRET' },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  assert.equal(hasBackendProcessEnvDefaultFallback(envFallbackAst), true);
  assert.deepEqual(findBackendProcessEnvDefaultFallbackLines(envFallbackAst), [6, 9]);
  assert.equal(hasBackendProcessEnvDefaultFallback(strictEnvAst), false);
});

test('hasBackendDirectProcessEnvRead detecta lecturas directas de process.env', () => {
  const directEnvAst = {
    type: 'Program',
    body: [
      {
        type: 'VariableDeclaration',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: { type: 'Identifier', name: 'databaseUrl' },
            init: {
              type: 'MemberExpression',
              loc: { start: { line: 6 }, end: { line: 6 } },
              object: {
                type: 'MemberExpression',
                object: { type: 'Identifier', name: 'process' },
                property: { type: 'Identifier', name: 'env' },
              },
              property: { type: 'Identifier', name: 'DATABASE_URL' },
            },
          },
        ],
      },
    ],
  };
  const configServiceAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: { type: 'Identifier', name: 'configService' },
      property: { type: 'Identifier', name: 'getOrThrow' },
    },
    arguments: [{ type: 'StringLiteral', value: 'DATABASE_URL' }],
  };

  assert.equal(hasBackendDirectProcessEnvRead(directEnvAst), true);
  assert.deepEqual(findBackendDirectProcessEnvReadLines(directEnvAst), [6]);
  assert.equal(hasBackendDirectProcessEnvRead(configServiceAst), false);
});

test('hasBackendConfigModuleWithoutValidation detecta ConfigModule sin validacion de env', () => {
  const missingValidationAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 8 }, end: { line: 11 } },
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'ConfigModule' },
            property: { type: 'Identifier', name: 'forRoot' },
          },
          arguments: [
            {
              type: 'ObjectExpression',
              properties: [
                {
                  type: 'ObjectProperty',
                  key: { type: 'Identifier', name: 'isGlobal' },
                  value: { type: 'BooleanLiteral', value: true },
                },
              ],
            },
          ],
        },
      },
    ],
  };
  const validatedAst = {
    type: 'CallExpression',
    loc: { start: { line: 18 }, end: { line: 21 } },
    callee: {
      type: 'MemberExpression',
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
            value: { type: 'Identifier', name: 'envSchema' },
          },
        ],
      },
    ],
  };

  assert.equal(hasBackendConfigModuleWithoutValidation(missingValidationAst), true);
  assert.deepEqual(findBackendConfigModuleWithoutValidationLines(missingValidationAst), [8]);
  assert.equal(hasBackendConfigModuleWithoutValidation(validatedAst), false);
});

test('hasBackendMagicNumberLiteral detecta numeros inline y permite constantes nombradas', () => {
  const inlineMagicNumberAst = {
    type: 'ReturnStatement',
    argument: { type: 'NumericLiteral', value: 42 },
  };
  const namedConstantAst = {
    type: 'VariableDeclaration',
    kind: 'const',
    declarations: [
      {
        type: 'VariableDeclarator',
        id: { type: 'Identifier', name: 'MAX_RETRY_ATTEMPTS' },
        init: { type: 'NumericLiteral', value: 3 },
      },
    ],
  };
  const trivialCounterAst = {
    type: 'BinaryExpression',
    operator: '+',
    left: { type: 'Identifier', name: 'count' },
    right: { type: 'NumericLiteral', value: 1 },
  };

  assert.equal(hasBackendMagicNumberLiteral(inlineMagicNumberAst), true);
  assert.equal(hasBackendMagicNumberLiteral(namedConstantAst), false);
  assert.equal(hasBackendMagicNumberLiteral(trivialCounterAst), false);
});

test('hasBackendGenericErrorThrow detecta throw new Error y permite excepciones especificas', () => {
  const genericErrorAst = {
    type: 'ThrowStatement',
    argument: {
      type: 'NewExpression',
      callee: { type: 'Identifier', name: 'Error' },
      arguments: [{ type: 'StringLiteral', value: 'invalid order' }],
    },
  };
  const specificErrorAst = {
    type: 'ThrowStatement',
    argument: {
      type: 'NewExpression',
      callee: { type: 'Identifier', name: 'ValidationException' },
      arguments: [{ type: 'StringLiteral', value: 'invalid order' }],
    },
  };

  assert.equal(hasBackendGenericErrorThrow(genericErrorAst), true);
  assert.equal(hasBackendGenericErrorThrow(specificErrorAst), false);
});

test('hasBackendRawThrowExpression detecta throw de valores crudos y permite excepciones tipadas', () => {
  const rawThrowAst = {
    type: 'Program',
    body: [
      {
        type: 'ThrowStatement',
        loc: { start: { line: 6 }, end: { line: 6 } },
        argument: { type: 'StringLiteral', value: 'invalid order' },
      },
      {
        type: 'ThrowStatement',
        loc: { start: { line: 9 }, end: { line: 9 } },
        argument: { type: 'Identifier', name: 'error' },
      },
    ],
  };
  const typedThrowAst = {
    type: 'Program',
    body: [
      {
        type: 'ThrowStatement',
        argument: {
          type: 'NewExpression',
          callee: { type: 'Identifier', name: 'ValidationException' },
          arguments: [{ type: 'StringLiteral', value: 'invalid order' }],
        },
      },
    ],
  };

  assert.equal(hasBackendRawThrowExpression(rawThrowAst), true);
  assert.deepEqual(findBackendRawThrowExpressionLines(rawThrowAst), [6, 9]);
  assert.equal(hasBackendRawThrowExpression(typedThrowAst), false);
});

test('hasBackendProductionMockOrSpy detecta mocks y spies de test en codigo production', () => {
  const jestMockAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'jest' },
      property: { type: 'Identifier', name: 'fn' },
    },
    arguments: [],
  };
  const chainedMockAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'CallExpression', callee: { type: 'Identifier', name: 'loadUser' } },
      property: { type: 'Identifier', name: 'mockResolvedValue' },
    },
    arguments: [],
  };
  const realFactoryAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'createUserRepository' },
    arguments: [],
  };

  assert.equal(hasBackendProductionMockOrSpy(jestMockAst), true);
  assert.equal(hasBackendProductionMockOrSpy(chainedMockAst), true);
  assert.equal(hasBackendProductionMockOrSpy(realFactoryAst), false);
});

test('hasBackendErrorStackInHttpResponse detecta stack trace expuesto en respuesta HTTP', () => {
  const exposedStackAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'res' },
      property: { type: 'Identifier', name: 'json' },
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'stack' },
            value: {
              type: 'MemberExpression',
              object: { type: 'Identifier', name: 'error' },
              property: { type: 'Identifier', name: 'stack' },
            },
          },
        ],
      },
    ],
  };
  const internalLoggingAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'logger' },
      property: { type: 'Identifier', name: 'error' },
    },
    arguments: [
      {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'error' },
        property: { type: 'Identifier', name: 'stack' },
      },
    ],
  };

  assert.equal(hasBackendErrorStackInHttpResponse(exposedStackAst), true);
  assert.equal(hasBackendErrorStackInHttpResponse(internalLoggingAst), false);
});

test('hasBackendInconsistentErrorResponse detecta respuestas de error sin contrato completo', () => {
  const inconsistentErrorResponseAst = {
    type: 'Program',
    body: [
      {
        type: 'TryStatement',
        block: { type: 'BlockStatement', body: [] },
        handler: {
          type: 'CatchClause',
          body: {
            type: 'BlockStatement',
            body: [
              {
                type: 'ExpressionStatement',
                expression: {
                  type: 'CallExpression',
                  loc: { start: { line: 12 }, end: { line: 12 } },
                  callee: {
                    type: 'MemberExpression',
                    computed: false,
                    object: { type: 'Identifier', name: 'res' },
                    property: { type: 'Identifier', name: 'json' },
                  },
                  arguments: [
                    {
                      type: 'ObjectExpression',
                      properties: [
                        {
                          type: 'ObjectProperty',
                          key: { type: 'Identifier', name: 'message' },
                          value: { type: 'StringLiteral', value: 'failed' },
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        },
      },
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 20 }, end: { line: 20 } },
          callee: {
            type: 'MemberExpression',
            computed: false,
            object: {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                computed: false,
                object: { type: 'Identifier', name: 'res' },
                property: { type: 'Identifier', name: 'status' },
              },
              arguments: [{ type: 'NumericLiteral', value: 404 }],
            },
            property: { type: 'Identifier', name: 'json' },
          },
          arguments: [
            {
              type: 'ObjectExpression',
              properties: [
                {
                  type: 'ObjectProperty',
                  key: { type: 'Identifier', name: 'error' },
                  value: { type: 'StringLiteral', value: 'not found' },
                },
              ],
            },
          ],
        },
      },
    ],
  };
  const consistentErrorResponseAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          computed: false,
          object: { type: 'Identifier', name: 'res' },
          property: { type: 'Identifier', name: 'status' },
        },
        arguments: [{ type: 'NumericLiteral', value: 400 }],
      },
      property: { type: 'Identifier', name: 'json' },
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [
          { type: 'ObjectProperty', key: { type: 'Identifier', name: 'statusCode' } },
          { type: 'ObjectProperty', key: { type: 'Identifier', name: 'message' } },
          { type: 'ObjectProperty', key: { type: 'Identifier', name: 'timestamp' } },
          { type: 'ObjectProperty', key: { type: 'Identifier', name: 'path' } },
        ],
      },
    ],
  };

  assert.equal(hasBackendInconsistentErrorResponse(inconsistentErrorResponseAst), true);
  assert.deepEqual(findBackendInconsistentErrorResponseLines(inconsistentErrorResponseAst), [
    12,
    20,
  ]);
  assert.equal(hasBackendInconsistentErrorResponse(consistentErrorResponseAst), false);
});

test('hasBackendErrorPayloadWithSuccessStatus detecta payload de error con status 2xx o 3xx', () => {
  const wrongStatusAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 9 }, end: { line: 9 } },
          callee: {
            type: 'MemberExpression',
            computed: false,
            object: {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                computed: false,
                object: { type: 'Identifier', name: 'res' },
                property: { type: 'Identifier', name: 'status' },
              },
              arguments: [{ type: 'NumericLiteral', value: 200 }],
            },
            property: { type: 'Identifier', name: 'json' },
          },
          arguments: [
            {
              type: 'ObjectExpression',
              properties: [
                {
                  type: 'ObjectProperty',
                  key: { type: 'Identifier', name: 'error' },
                  value: { type: 'StringLiteral', value: 'invalid order' },
                },
              ],
            },
          ],
        },
      },
    ],
  };
  const correctStatusAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          computed: false,
          object: { type: 'Identifier', name: 'res' },
          property: { type: 'Identifier', name: 'status' },
        },
        arguments: [{ type: 'NumericLiteral', value: 400 }],
      },
      property: { type: 'Identifier', name: 'json' },
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'error' },
            value: { type: 'StringLiteral', value: 'invalid order' },
          },
        ],
      },
    ],
  };

  assert.equal(hasBackendErrorPayloadWithSuccessStatus(wrongStatusAst), true);
  assert.deepEqual(findBackendErrorPayloadWithSuccessStatusLines(wrongStatusAst), [9]);
  assert.equal(hasBackendErrorPayloadWithSuccessStatus(correctStatusAst), false);
});

test('hasBackendControllerEntityResponse detecta entidades expuestas por controllers', () => {
  const entityReturnTypeAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassMethod',
        loc: { start: { line: 7 }, end: { line: 10 } },
        key: { type: 'Identifier', name: 'getOrder' },
        returnType: {
          type: 'TSTypeAnnotation',
          typeAnnotation: {
            type: 'TSTypeReference',
            typeName: { type: 'Identifier', name: 'Promise' },
            typeParameters: {
              type: 'TSTypeParameterInstantiation',
              params: [
                {
                  type: 'TSTypeReference',
                  typeName: { type: 'Identifier', name: 'OrderEntity' },
                },
              ],
            },
          },
        },
      },
      {
        type: 'ReturnStatement',
        loc: { start: { line: 14 }, end: { line: 14 } },
        argument: {
          type: 'NewExpression',
          callee: { type: 'Identifier', name: 'UserEntity' },
          arguments: [],
        },
      },
    ],
  };
  const dtoReturnTypeAst = {
    type: 'ClassMethod',
    key: { type: 'Identifier', name: 'getOrder' },
    returnType: {
      type: 'TSTypeAnnotation',
      typeAnnotation: {
        type: 'TSTypeReference',
        typeName: { type: 'Identifier', name: 'OrderResponseDto' },
      },
    },
  };

  assert.equal(hasBackendControllerEntityResponse(entityReturnTypeAst), true);
  assert.deepEqual(findBackendControllerEntityResponseLines(entityReturnTypeAst), [7, 14]);
  assert.equal(hasBackendControllerEntityResponse(dtoReturnTypeAst), false);
});

test('hasBackendControllerBusinessLogic detecta logica dentro de rutas controller NestJS', () => {
  const controllerWithLogicAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        decorators: [
          {
            type: 'Decorator',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'Controller' },
              arguments: [],
            },
          },
        ],
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'createOrder' },
              loc: { start: { line: 18 }, end: { line: 30 } },
              decorators: [
                {
                  type: 'Decorator',
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'Post' },
                    arguments: [],
                  },
                },
              ],
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'IfStatement',
                    test: { type: 'Identifier', name: 'invalid' },
                    consequent: { type: 'BlockStatement', body: [] },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };
  const thinControllerAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        decorators: [
          {
            type: 'Decorator',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'Controller' },
              arguments: [],
            },
          },
        ],
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'createOrder' },
              decorators: [
                {
                  type: 'Decorator',
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'Post' },
                    arguments: [],
                  },
                },
              ],
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ReturnStatement',
                    argument: {
                      type: 'CallExpression',
                      callee: {
                        type: 'MemberExpression',
                        object: {
                          type: 'MemberExpression',
                          object: { type: 'ThisExpression' },
                          property: { type: 'Identifier', name: 'ordersService' },
                        },
                        property: { type: 'Identifier', name: 'create' },
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

  assert.equal(hasBackendControllerBusinessLogic(controllerWithLogicAst), true);
  assert.equal(hasBackendControllerBusinessLogic(thinControllerAst), false);

  const match = findBackendControllerBusinessLogicMatch(controllerWithLogicAst);
  assert.ok(match);
  assert.deepEqual(match.lines, [18]);
  assert.equal(match.primary_node, 'createOrder');
});

test('hasBackendRepositoryBusinessLogic detecta decisiones de negocio dentro de repositories', () => {
  const repositoryWithLogicAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'OrdersRepository' },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'saveOrder' },
              loc: { start: { line: 27 }, end: { line: 35 } },
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'IfStatement',
                    test: { type: 'Identifier', name: 'isPremium' },
                    consequent: { type: 'BlockStatement', body: [] },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };
  const thinRepositoryAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'OrdersRepository' },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'findActiveOrdersByUserId' },
              body: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ReturnStatement',
                    argument: {
                      type: 'CallExpression',
                      callee: {
                        type: 'MemberExpression',
                        object: { type: 'Identifier', name: 'queryBuilder' },
                        property: { type: 'Identifier', name: 'where' },
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

  assert.equal(hasBackendRepositoryBusinessLogic(repositoryWithLogicAst), true);
  assert.equal(hasBackendRepositoryBusinessLogic(thinRepositoryAst), false);

  const match = findBackendRepositoryBusinessLogicMatch(repositoryWithLogicAst);
  assert.ok(match);
  assert.deepEqual(match.lines, [27]);
  assert.equal(match.primary_node, 'OrdersRepository');
  assert.deepEqual(match.related_nodes, ['saveOrder']);
});

test('hasBackendAnemicDomainModel detecta entidades de dominio anemicas', () => {
  const anemicEntityAst = {
    type: 'ClassDeclaration',
    id: { type: 'Identifier', name: 'OrderEntity' },
    body: {
      type: 'ClassBody',
      body: [
        { type: 'ClassProperty', key: { type: 'Identifier', name: 'id' } },
        { type: 'ClassProperty', key: { type: 'Identifier', name: 'status' } },
        {
          type: 'ClassMethod',
          kind: 'method',
          key: { type: 'Identifier', name: 'getStatus' },
          body: { type: 'BlockStatement', body: [] },
        },
        {
          type: 'ClassMethod',
          kind: 'method',
          key: { type: 'Identifier', name: 'setStatus' },
          body: { type: 'BlockStatement', body: [] },
        },
      ],
    },
  };
  const richEntityAst = {
    type: 'ClassDeclaration',
    id: { type: 'Identifier', name: 'OrderEntity' },
    body: {
      type: 'ClassBody',
      body: [
        { type: 'ClassProperty', key: { type: 'Identifier', name: 'id' } },
        { type: 'ClassProperty', key: { type: 'Identifier', name: 'status' } },
        {
          type: 'ClassMethod',
          kind: 'method',
          key: { type: 'Identifier', name: 'markAsPaid' },
          body: { type: 'BlockStatement', body: [] },
        },
      ],
    },
  };

  assert.equal(hasBackendAnemicDomainModel(anemicEntityAst), true);
  assert.equal(hasBackendAnemicDomainModel(richEntityAst), false);
});

test('hasBackendPermissiveCorsConfiguration detecta CORS permisivo y permite origenes acotados', () => {
  const permissiveAst = {
    type: 'Program',
    body: [
      {
        type: 'CallExpression',
        loc: { start: { line: 3 }, end: { line: 3 } },
        callee: {
          type: 'MemberExpression',
          computed: false,
          object: { type: 'Identifier', name: 'app' },
          property: { type: 'Identifier', name: 'enableCors' },
        },
        arguments: [],
      },
      {
        type: 'CallExpression',
        loc: { start: { line: 7 }, end: { line: 7 } },
        callee: {
          type: 'MemberExpression',
          computed: false,
          object: { type: 'Identifier', name: 'NestFactory' },
          property: { type: 'Identifier', name: 'create' },
        },
        arguments: [
          { type: 'Identifier', name: 'AppModule' },
          {
            type: 'ObjectExpression',
            properties: [
              {
                type: 'ObjectProperty',
                key: { type: 'Identifier', name: 'cors' },
                value: { type: 'BooleanLiteral', value: true },
              },
            ],
          },
        ],
      },
      {
        type: 'CallExpression',
        loc: { start: { line: 11 }, end: { line: 11 } },
        callee: { type: 'Identifier', name: 'cors' },
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
      },
    ],
  };
  const safeAst = {
    type: 'Program',
    body: [
      {
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
                value: { type: 'Identifier', name: 'allowedOrigins' },
              },
            ],
          },
        ],
      },
    ],
  };

  assert.equal(hasBackendPermissiveCorsConfiguration(permissiveAst), true);
  assert.deepEqual(findBackendPermissiveCorsConfigurationLines(permissiveAst), [
    3,
    7,
    11,
  ]);
  assert.equal(hasBackendPermissiveCorsConfiguration(safeAst), false);
});

test('hasBackendStringLiteralUnionEnumCandidate detecta uniones de literales string para enum', () => {
  const enumCandidateAst = {
    type: 'Program',
    body: [
      {
        type: 'TSTypeAliasDeclaration',
        id: { type: 'Identifier', name: 'OrderStatus' },
        typeAnnotation: {
          type: 'TSUnionType',
          loc: { start: { line: 4 }, end: { line: 4 } },
          types: [
            { type: 'TSLiteralType', literal: { type: 'StringLiteral', value: 'pending' } },
            { type: 'TSLiteralType', literal: { type: 'StringLiteral', value: 'paid' } },
            { type: 'TSLiteralType', literal: { type: 'StringLiteral', value: 'cancelled' } },
          ],
        },
      },
    ],
  };
  const openUnionAst = {
    type: 'Program',
    body: [
      {
        type: 'TSUnionType',
        types: [
          { type: 'TSLiteralType', literal: { type: 'StringLiteral', value: 'pending' } },
          { type: 'TSStringKeyword' },
        ],
      },
    ],
  };

  assert.equal(hasBackendStringLiteralUnionEnumCandidate(enumCandidateAst), true);
  assert.deepEqual(findBackendStringLiteralUnionEnumCandidateLines(enumCandidateAst), [4]);
  assert.equal(hasBackendStringLiteralUnionEnumCandidate(openUnionAst), false);
});

test('hasBackendSensitiveCacheWrite detecta datos sensibles escritos en cache', () => {
  const sensitiveCacheAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 18 }, end: { line: 18 } },
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'cacheManager' },
            property: { type: 'Identifier', name: 'set' },
          },
          arguments: [
            { type: 'StringLiteral', value: 'session:token' },
            { type: 'Identifier', name: 'accessToken' },
          ],
        },
      },
    ],
  };
  const safeCacheAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 27 }, end: { line: 27 } },
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'cacheManager' },
            property: { type: 'Identifier', name: 'set' },
          },
          arguments: [
            { type: 'StringLiteral', value: 'products:list' },
            { type: 'Identifier', name: 'products' },
          ],
        },
      },
    ],
  };

  assert.equal(hasBackendSensitiveCacheWrite(sensitiveCacheAst), true);
  assert.deepEqual(findBackendSensitiveCacheWriteLines(sensitiveCacheAst), [18]);
  assert.equal(hasBackendSensitiveCacheWrite(safeCacheAst), false);
});

test('hasBackendHardDeleteWithoutSoftDelete detecta borrados fisicos en persistencia backend', () => {
  const hardDeleteAst = {
    type: 'Program',
    body: [
      {
        type: 'CallExpression',
        loc: { start: { line: 8 }, end: { line: 8 } },
        callee: {
          type: 'MemberExpression',
          computed: false,
          object: { type: 'Identifier', name: 'ordersRepository' },
          property: { type: 'Identifier', name: 'delete' },
        },
        arguments: [{ type: 'Identifier', name: 'orderId' }],
      },
      {
        type: 'CallExpression',
        loc: { start: { line: 12 }, end: { line: 12 } },
        callee: {
          type: 'MemberExpression',
          computed: false,
          object: {
            type: 'MemberExpression',
            computed: false,
            object: { type: 'Identifier', name: 'prisma' },
            property: { type: 'Identifier', name: 'order' },
          },
          property: { type: 'Identifier', name: 'deleteMany' },
        },
        arguments: [],
      },
    ],
  };
  const softDeleteAst = {
    type: 'Program',
    body: [
      {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          computed: false,
          object: { type: 'Identifier', name: 'ordersRepository' },
          property: { type: 'Identifier', name: 'softDelete' },
        },
        arguments: [{ type: 'Identifier', name: 'orderId' }],
      },
    ],
  };

  assert.equal(hasBackendHardDeleteWithoutSoftDelete(hardDeleteAst), true);
  assert.deepEqual(findBackendHardDeleteWithoutSoftDeleteLines(hardDeleteAst), [8, 12]);
  assert.equal(hasBackendHardDeleteWithoutSoftDelete(softDeleteAst), false);
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

test('hasWeakBcryptSaltRounds detecta bcrypt con salt rounds inferiores a 10', () => {
  const weakHashAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: { type: 'Identifier', name: 'bcrypt' },
      property: { type: 'Identifier', name: 'hash' },
    },
    arguments: [
      { type: 'Identifier', name: 'password' },
      { type: 'NumericLiteral', value: 8 },
    ],
  };
  const strongHashAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: { type: 'Identifier', name: 'bcrypt' },
      property: { type: 'Identifier', name: 'hashSync' },
    },
    arguments: [
      { type: 'Identifier', name: 'password' },
      { type: 'NumericLiteral', value: 10 },
    ],
  };
  const configuredRoundsAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: { type: 'Identifier', name: 'bcrypt' },
      property: { type: 'Identifier', name: 'hash' },
    },
    arguments: [
      { type: 'Identifier', name: 'password' },
      { type: 'Identifier', name: 'saltRounds' },
    ],
  };

  assert.equal(hasWeakBcryptSaltRounds(weakHashAst), true);
  assert.equal(hasWeakBcryptSaltRounds(strongHashAst), false);
  assert.equal(hasWeakBcryptSaltRounds(configuredRoundsAst), false);
});

test('hasInterpolatedUnsafeSqlCall detecta SQL interpolado en llamadas no parametrizadas', () => {
  const unsafeQueryAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: { type: 'Identifier', name: 'db' },
      property: { type: 'Identifier', name: 'query' },
    },
    arguments: [
      {
        type: 'TemplateLiteral',
        expressions: [{ type: 'Identifier', name: 'userId' }],
        quasis: [],
      },
    ],
  };
  const unsafePrismaAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: { type: 'Identifier', name: 'prisma' },
      property: { type: 'Identifier', name: '$queryRawUnsafe' },
    },
    arguments: [
      {
        type: 'TemplateLiteral',
        expressions: [{ type: 'Identifier', name: 'email' }],
        quasis: [],
      },
    ],
  };
  const staticQueryAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: { type: 'Identifier', name: 'db' },
      property: { type: 'Identifier', name: 'query' },
    },
    arguments: [
      {
        type: 'TemplateLiteral',
        expressions: [],
        quasis: [],
      },
    ],
  };
  const taggedTemplateAst = {
    type: 'TaggedTemplateExpression',
    tag: {
      type: 'MemberExpression',
      object: { type: 'Identifier', name: 'prisma' },
      property: { type: 'Identifier', name: '$queryRaw' },
    },
    quasi: {
      type: 'TemplateLiteral',
      expressions: [{ type: 'Identifier', name: 'userId' }],
      quasis: [],
    },
  };

  assert.equal(hasInterpolatedUnsafeSqlCall(unsafeQueryAst), true);
  assert.equal(hasInterpolatedUnsafeSqlCall(unsafePrismaAst), true);
  assert.equal(hasInterpolatedUnsafeSqlCall(staticQueryAst), false);
  assert.equal(hasInterpolatedUnsafeSqlCall(taggedTemplateAst), false);
});

test('hasSensitiveTokenInUrl detecta tokens sensibles en URL de llamadas de red', () => {
  const fetchTokenAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'fetch' },
    arguments: [{ type: 'StringLiteral', value: '/api/me?access_token=abc' }],
  };
  const axiosTemplateTokenAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: { type: 'Identifier', name: 'axios' },
      property: { type: 'Identifier', name: 'get' },
    },
    arguments: [
      {
        type: 'TemplateLiteral',
        expressions: [{ type: 'Identifier', name: 'token' }],
        quasis: [{ type: 'TemplateElement', value: { cooked: '/api/me?token=' } }],
      },
    ],
  };
  const headerTokenAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'fetch' },
    arguments: [
      { type: 'StringLiteral', value: '/api/me' },
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'headers' },
            value: { type: 'ObjectExpression', properties: [] },
          },
        ],
      },
    ],
  };

  assert.equal(hasSensitiveTokenInUrl(fetchTokenAst), true);
  assert.equal(hasSensitiveTokenInUrl(axiosTemplateTokenAst), true);
  assert.equal(hasSensitiveTokenInUrl(headerTokenAst), false);
});

test('hasDirectNetworkCall detecta fetch y axios directos', () => {
  const fetchAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'fetch' },
    arguments: [{ type: 'StringLiteral', value: '/api/stores' }],
  };
  const axiosAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: { type: 'Identifier', name: 'axios' },
      property: { type: 'Identifier', name: 'get' },
    },
    arguments: [{ type: 'StringLiteral', value: '/api/stores' }],
  };
  const mswAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: { type: 'Identifier', name: 'server' },
      property: { type: 'Identifier', name: 'use' },
    },
    arguments: [],
  };

  assert.equal(hasDirectNetworkCall(fetchAst), true);
  assert.equal(hasDirectNetworkCall(axiosAst), true);
  assert.equal(hasDirectNetworkCall(mswAst), false);
});

test('hasNonSemanticClickableJsx detecta elementos no semanticos clicables sin teclado', () => {
  const clickableDivAst = {
    type: 'JSXOpeningElement',
    name: { type: 'JSXIdentifier', name: 'div' },
    attributes: [
      { type: 'JSXAttribute', name: { type: 'JSXIdentifier', name: 'onClick' } },
    ],
  };
  const keyboardAccessibleDivAst = {
    type: 'JSXOpeningElement',
    name: { type: 'JSXIdentifier', name: 'div' },
    attributes: [
      { type: 'JSXAttribute', name: { type: 'JSXIdentifier', name: 'onClick' } },
      { type: 'JSXAttribute', name: { type: 'JSXIdentifier', name: 'onKeyDown' } },
      { type: 'JSXAttribute', name: { type: 'JSXIdentifier', name: 'tabIndex' } },
    ],
  };
  const buttonAst = {
    type: 'JSXOpeningElement',
    name: { type: 'JSXIdentifier', name: 'button' },
    attributes: [
      { type: 'JSXAttribute', name: { type: 'JSXIdentifier', name: 'onClick' } },
    ],
  };

  assert.equal(hasNonSemanticClickableJsx(clickableDivAst), true);
  assert.equal(hasNonSemanticClickableJsx(keyboardAccessibleDivAst), false);
  assert.equal(hasNonSemanticClickableJsx(buttonAst), false);
});

test('hasRedundantAriaRoleOnSemanticJsx detecta roles ARIA redundantes en HTML semantico', () => {
  const redundantButtonRoleAst = {
    type: 'JSXOpeningElement',
    name: { type: 'JSXIdentifier', name: 'button' },
    attributes: [
      {
        type: 'JSXAttribute',
        name: { type: 'JSXIdentifier', name: 'role' },
        value: { type: 'StringLiteral', value: 'button' },
      },
    ],
  };
  const expressionRoleAst = {
    type: 'JSXOpeningElement',
    name: { type: 'JSXIdentifier', name: 'nav' },
    attributes: [
      {
        type: 'JSXAttribute',
        name: { type: 'JSXIdentifier', name: 'role' },
        value: {
          type: 'JSXExpressionContainer',
          expression: { type: 'StringLiteral', value: 'navigation' },
        },
      },
    ],
  };
  const necessaryRoleAst = {
    type: 'JSXOpeningElement',
    name: { type: 'JSXIdentifier', name: 'div' },
    attributes: [
      {
        type: 'JSXAttribute',
        name: { type: 'JSXIdentifier', name: 'role' },
        value: { type: 'StringLiteral', value: 'dialog' },
      },
    ],
  };

  assert.equal(hasRedundantAriaRoleOnSemanticJsx(redundantButtonRoleAst), true);
  assert.equal(hasRedundantAriaRoleOnSemanticJsx(expressionRoleAst), true);
  assert.equal(hasRedundantAriaRoleOnSemanticJsx(necessaryRoleAst), false);
});

test('hasNestedCallbackUsage detecta callback anidado en llamadas', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'loadUser' },
        arguments: [
          {
            type: 'ArrowFunctionExpression',
            body: {
              type: 'BlockStatement',
              body: [
                {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'loadOrders' },
                  arguments: [
                    {
                      type: 'FunctionExpression',
                      body: { type: 'BlockStatement', body: [] },
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  };

  assert.equal(hasNestedCallbackUsage(ast), true);
});

test('hasNestedCallbackUsage permite callbacks planos y funciones internas no pasadas como callback', () => {
  const flatCallbackAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'loadUser' },
    arguments: [
      {
        type: 'ArrowFunctionExpression',
        body: { type: 'BlockStatement', body: [] },
      },
    ],
  };
  const innerFunctionAst = {
    type: 'ArrowFunctionExpression',
    body: {
      type: 'BlockStatement',
      body: [
        {
          type: 'FunctionDeclaration',
          id: { type: 'Identifier', name: 'helper' },
          body: { type: 'BlockStatement', body: [] },
        },
      ],
    },
  };

  assert.equal(hasNestedCallbackUsage(flatCallbackAst), false);
  assert.equal(hasNestedCallbackUsage(innerFunctionAst), false);
});

test('hasNestedIfElseStatement detecta if else anidado y preserva early return', () => {
  const nestedIfElseAst = {
    type: 'IfStatement',
    test: { type: 'Identifier', name: 'isReady' },
    consequent: {
      type: 'BlockStatement',
      body: [
        {
          type: 'IfStatement',
          test: { type: 'Identifier', name: 'hasPermission' },
          consequent: { type: 'BlockStatement', body: [] },
          alternate: null,
        },
      ],
    },
    alternate: { type: 'BlockStatement', body: [] },
  };
  const elseIfAst = {
    type: 'IfStatement',
    test: { type: 'Identifier', name: 'isReady' },
    consequent: { type: 'BlockStatement', body: [] },
    alternate: {
      type: 'IfStatement',
      test: { type: 'Identifier', name: 'isFallback' },
      consequent: { type: 'BlockStatement', body: [] },
      alternate: null,
    },
  };
  const earlyReturnAst = {
    type: 'IfStatement',
    test: { type: 'Identifier', name: 'missing' },
    consequent: {
      type: 'BlockStatement',
      body: [{ type: 'ReturnStatement' }],
    },
    alternate: null,
  };

  assert.equal(hasNestedIfElseStatement(nestedIfElseAst), true);
  assert.equal(hasNestedIfElseStatement(elseIfAst), true);
  assert.equal(hasNestedIfElseStatement(earlyReturnAst), false);
});

test('hasDefaultExportedApiRouteHandler detecta handlers default de pages api', () => {
  const defaultFunctionAst = {
    type: 'ExportDefaultDeclaration',
    declaration: { type: 'FunctionDeclaration', id: { type: 'Identifier', name: 'handler' } },
  };
  const defaultIdentifierAst = {
    type: 'ExportDefaultDeclaration',
    declaration: { type: 'Identifier', name: 'handler' },
  };
  const namedRouteHandlerAst = {
    type: 'ExportNamedDeclaration',
    declaration: {
      type: 'FunctionDeclaration',
      id: { type: 'Identifier', name: 'GET' },
    },
  };

  assert.equal(hasDefaultExportedApiRouteHandler(defaultFunctionAst), true);
  assert.equal(hasDefaultExportedApiRouteHandler(defaultIdentifierAst), true);
  assert.equal(hasDefaultExportedApiRouteHandler(namedRouteHandlerAst), false);
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

test('hasNestJsConstructorDependencyWithoutDecorator detecta dependencias constructor sin decorador NestJS', () => {
  const undecoratedProviderAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'OrdersService' },
        loc: { start: { line: 7 }, end: { line: 15 } },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              kind: 'constructor',
              key: { type: 'Identifier', name: 'constructor' },
              params: [
                {
                  type: 'Identifier',
                  name: 'repository',
                  typeAnnotation: {
                    type: 'TSTypeAnnotation',
                    typeAnnotation: {
                      type: 'TSTypeReference',
                      typeName: { type: 'Identifier', name: 'OrdersRepository' },
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };
  const decoratedProviderAst = {
    ...undecoratedProviderAst,
    body: [
      {
        ...(undecoratedProviderAst.body[0] as object),
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
  };
  const primitiveConstructorAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'PrimitiveConfig' },
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              kind: 'constructor',
              key: { type: 'Identifier', name: 'constructor' },
              params: [
                {
                  type: 'Identifier',
                  name: 'name',
                  typeAnnotation: {
                    type: 'TSTypeAnnotation',
                    typeAnnotation: { type: 'TSStringKeyword' },
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };

  assert.equal(hasNestJsConstructorDependencyWithoutDecorator(undecoratedProviderAst), true);
  assert.equal(hasNestJsConstructorDependencyWithoutDecorator(decoratedProviderAst), false);
  assert.equal(hasNestJsConstructorDependencyWithoutDecorator(primitiveConstructorAst), false);

  const match = findNestJsConstructorDependencyWithoutDecoratorMatch(undecoratedProviderAst);
  assert.ok(match);
  assert.deepEqual(match.lines, [7]);
  assert.equal(match.primary_node, 'OrdersService');
});

test('hasPersistenceMutationWithoutAuditEvent detecta mutaciones persistentes sin evento ni auditoria', () => {
  const missingAuditAst = {
    type: 'Program',
    body: [
      {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'completeOrder' },
        loc: { start: { line: 21 }, end: { line: 25 } },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ExpressionStatement',
              expression: {
                type: 'CallExpression',
                callee: {
                  type: 'MemberExpression',
                  object: { type: 'Identifier', name: 'ordersRepository' },
                  property: { type: 'Identifier', name: 'save' },
                },
                arguments: [],
              },
            },
          ],
        },
      },
    ],
  };
  const auditedMutationAst = {
    type: 'Program',
    body: [
      {
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'completeOrder' },
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ExpressionStatement',
              expression: {
                type: 'CallExpression',
                callee: {
                  type: 'MemberExpression',
                  object: { type: 'Identifier', name: 'ordersRepository' },
                  property: { type: 'Identifier', name: 'save' },
                },
                arguments: [],
              },
            },
            {
              type: 'ExpressionStatement',
              expression: {
                type: 'CallExpression',
                callee: {
                  type: 'MemberExpression',
                  object: { type: 'Identifier', name: 'eventBus' },
                  property: { type: 'Identifier', name: 'emit' },
                },
                arguments: [],
              },
            },
          ],
        },
      },
    ],
  };

  assert.equal(hasPersistenceMutationWithoutAuditEvent(missingAuditAst), true);
  assert.equal(hasPersistenceMutationWithoutAuditEvent(auditedMutationAst), false);

  const match = findPersistenceMutationWithoutAuditEventMatch(missingAuditAst);
  assert.ok(match);
  assert.deepEqual(match.lines, [21]);
  assert.equal(match.primary_node, 'completeOrder');
});

test('hasDtoPropertyWithoutValidation detecta DTOs sin validacion class-validator', () => {
  const missingValidationAst = {
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
              key: { type: 'Identifier', name: 'email' },
              loc: { start: { line: 4 }, end: { line: 4 } },
              typeAnnotation: { type: 'TSTypeAnnotation' },
            },
          ],
        },
      },
    ],
  };
  const validatedDtoAst = {
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
              key: { type: 'Identifier', name: 'email' },
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
              typeAnnotation: { type: 'TSTypeAnnotation' },
            },
          ],
        },
      },
    ],
  };

  assert.equal(hasDtoPropertyWithoutValidation(missingValidationAst), true);
  assert.equal(hasDtoPropertyWithoutValidation(validatedDtoAst), false);

  const match = findDtoPropertyWithoutValidationMatch(missingValidationAst);
  assert.ok(match);
  assert.deepEqual(match.lines, [4]);
  assert.equal(match.primary_node, 'CreateOrderDto');
  assert.deepEqual(match.related_nodes, ['email']);
});

test('hasDtoPropertyWithoutApiProperty detecta DTOs sin decoradores Swagger', () => {
  const missingSwaggerAst = {
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
              key: { type: 'Identifier', name: 'email' },
              loc: { start: { line: 7 }, end: { line: 7 } },
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
      },
    ],
  };
  const swaggerDtoAst = {
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
              key: { type: 'Identifier', name: 'email' },
              loc: { start: { line: 14 }, end: { line: 14 } },
              decorators: [
                {
                  type: 'Decorator',
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'ApiProperty' },
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

  assert.equal(hasDtoPropertyWithoutApiProperty(missingSwaggerAst), true);
  assert.deepEqual(findDtoPropertyWithoutApiPropertyLines(missingSwaggerAst), [7]);
  assert.equal(hasDtoPropertyWithoutApiProperty(swaggerDtoAst), false);
});

test('hasDtoNestedPropertyWithoutNestedValidation detecta DTOs anidados sin ValidateNested y Type', () => {
  const missingNestedValidationAst = {
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
              loc: { start: { line: 9 }, end: { line: 9 } },
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
  const validNestedDtoAst = {
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
                    callee: { type: 'Identifier', name: 'ValidateNested' },
                    arguments: [],
                  },
                },
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

  assert.equal(hasDtoNestedPropertyWithoutNestedValidation(missingNestedValidationAst), true);
  assert.equal(hasDtoNestedPropertyWithoutNestedValidation(validNestedDtoAst), false);

  const match = findDtoNestedPropertyWithoutNestedValidationMatch(missingNestedValidationAst);
  assert.ok(match);
  assert.deepEqual(match.lines, [9]);
  assert.equal(match.primary_node, 'CreateOrderDto');
  assert.deepEqual(match.related_nodes, ['address']);
});

test('hasBackendMissingGlobalValidationPipe detecta bootstrap NestJS sin ValidationPipe estricto', () => {
  const missingPipeAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 7 }, end: { line: 7 } },
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'NestFactory' },
            property: { type: 'Identifier', name: 'create' },
          },
          arguments: [],
        },
      },
    ],
  };
  const unsafePipeAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 11 }, end: { line: 11 } },
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'app' },
            property: { type: 'Identifier', name: 'useGlobalPipes' },
          },
          arguments: [
            {
              type: 'NewExpression',
              callee: { type: 'Identifier', name: 'ValidationPipe' },
              arguments: [],
            },
          ],
        },
      },
    ],
  };
  const strictPipeAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'NestFactory' },
            property: { type: 'Identifier', name: 'create' },
          },
          arguments: [],
        },
      },
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
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
  };

  assert.equal(hasBackendMissingGlobalValidationPipe(missingPipeAst), true);
  assert.deepEqual(findBackendMissingGlobalValidationPipeLines(missingPipeAst), [7]);
  assert.equal(hasBackendMissingGlobalValidationPipe(unsafePipeAst), true);
  assert.deepEqual(findBackendMissingGlobalValidationPipeLines(unsafePipeAst), [11]);
  assert.equal(hasBackendMissingGlobalValidationPipe(strictPipeAst), false);
});

test('hasBackendMissingHelmetSecurityHeaders detecta bootstrap NestJS sin Helmet', () => {
  const missingHelmetAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 9 }, end: { line: 9 } },
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'NestFactory' },
            property: { type: 'Identifier', name: 'create' },
          },
          arguments: [],
        },
      },
    ],
  };
  const helmetAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 11 }, end: { line: 11 } },
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'NestFactory' },
            property: { type: 'Identifier', name: 'create' },
          },
          arguments: [],
        },
      },
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'app' },
            property: { type: 'Identifier', name: 'use' },
          },
          arguments: [
            {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'helmet' },
              arguments: [],
            },
          ],
        },
      },
    ],
  };

  assert.equal(hasBackendMissingHelmetSecurityHeaders(missingHelmetAst), true);
  assert.deepEqual(findBackendMissingHelmetSecurityHeadersLines(missingHelmetAst), [9]);
  assert.equal(hasBackendMissingHelmetSecurityHeaders(helmetAst), false);
});

test('hasBackendMissingCompressionMiddleware detecta bootstrap NestJS sin compression', () => {
  const missingCompressionAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 9 }, end: { line: 9 } },
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'NestFactory' },
            property: { type: 'Identifier', name: 'create' },
          },
          arguments: [],
        },
      },
    ],
  };
  const compressionAst = {
    type: 'Program',
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          loc: { start: { line: 7 }, end: { line: 7 } },
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'NestFactory' },
            property: { type: 'Identifier', name: 'create' },
          },
          arguments: [],
        },
      },
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'app' },
            property: { type: 'Identifier', name: 'use' },
          },
          arguments: [
            {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'compression' },
              arguments: [],
            },
          ],
        },
      },
    ],
  };

  assert.equal(hasBackendMissingCompressionMiddleware(missingCompressionAst), true);
  assert.deepEqual(findBackendMissingCompressionMiddlewareLines(missingCompressionAst), [9]);
  assert.equal(hasBackendMissingCompressionMiddleware(compressionAst), false);
});

test('hasBackendControllerRouteWithoutGuard detecta rutas NestJS sin UseGuards', () => {
  const unguardedRouteAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        decorators: [
          {
            type: 'Decorator',
            expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'Controller' }, arguments: [] },
          },
        ],
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'listOrders' },
              loc: { start: { line: 12 }, end: { line: 14 } },
              decorators: [
                {
                  type: 'Decorator',
                  expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'Get' }, arguments: [] },
                },
              ],
            },
          ],
        },
      },
    ],
  };
  const classGuardedRouteAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        decorators: [
          {
            type: 'Decorator',
            expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'Controller' }, arguments: [] },
          },
          {
            type: 'Decorator',
            expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'UseGuards' }, arguments: [] },
          },
        ],
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'listOrders' },
              loc: { start: { line: 22 }, end: { line: 24 } },
              decorators: [
                {
                  type: 'Decorator',
                  expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'Get' }, arguments: [] },
                },
              ],
            },
          ],
        },
      },
    ],
  };

  assert.equal(hasBackendControllerRouteWithoutGuard(unguardedRouteAst), true);
  assert.equal(hasBackendControllerRouteWithoutGuard(classGuardedRouteAst), false);
  assert.deepEqual(findBackendControllerRouteWithoutGuardLines(unguardedRouteAst), [12]);
});

test('hasBackendAuthRouteWithoutThrottle detecta endpoints auth sin rate limiting', () => {
  const loginWithoutThrottleAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        decorators: [
          {
            type: 'Decorator',
            expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'Controller' }, arguments: [] },
          },
        ],
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'login' },
              loc: { start: { line: 21 }, end: { line: 24 } },
              decorators: [
                {
                  type: 'Decorator',
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'Post' },
                    arguments: [{ type: 'StringLiteral', value: 'login' }],
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };
  const classThrottledLoginAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        decorators: [
          {
            type: 'Decorator',
            expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'Controller' }, arguments: [] },
          },
          {
            type: 'Decorator',
            expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'Throttle' }, arguments: [] },
          },
        ],
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'login' },
              loc: { start: { line: 34 }, end: { line: 37 } },
              decorators: [
                {
                  type: 'Decorator',
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'Post' },
                    arguments: [{ type: 'StringLiteral', value: 'login' }],
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };

  assert.equal(hasBackendAuthRouteWithoutThrottle(loginWithoutThrottleAst), true);
  assert.deepEqual(findBackendAuthRouteWithoutThrottleLines(loginWithoutThrottleAst), [21]);
  assert.equal(hasBackendAuthRouteWithoutThrottle(classThrottledLoginAst), false);
});

test('hasBackendControllerRouteWithoutRoles detecta rutas NestJS protegidas sin RBAC explicito', () => {
  const guardedWithoutRolesAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        decorators: [
          {
            type: 'Decorator',
            expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'Controller' }, arguments: [] },
          },
          {
            type: 'Decorator',
            expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'UseGuards' }, arguments: [] },
          },
        ],
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'deleteOrder' },
              loc: { start: { line: 31 }, end: { line: 33 } },
              decorators: [
                {
                  type: 'Decorator',
                  expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'Delete' }, arguments: [] },
                },
              ],
            },
          ],
        },
      },
    ],
  };
  const methodRolesAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        decorators: [
          {
            type: 'Decorator',
            expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'Controller' }, arguments: [] },
          },
          {
            type: 'Decorator',
            expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'UseGuards' }, arguments: [] },
          },
        ],
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'deleteOrder' },
              loc: { start: { line: 42 }, end: { line: 44 } },
              decorators: [
                {
                  type: 'Decorator',
                  expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'Roles' }, arguments: [] },
                },
                {
                  type: 'Decorator',
                  expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'Delete' }, arguments: [] },
                },
              ],
            },
          ],
        },
      },
    ],
  };
  const unguardedRouteAst = {
    type: 'ClassMethod',
    key: { type: 'Identifier', name: 'publicHealth' },
    loc: { start: { line: 51 }, end: { line: 53 } },
    decorators: [
      {
        type: 'Decorator',
        expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'Get' }, arguments: [] },
      },
    ],
  };

  assert.equal(hasBackendControllerRouteWithoutRoles(guardedWithoutRolesAst), true);
  assert.deepEqual(findBackendControllerRouteWithoutRolesLines(guardedWithoutRolesAst), [31]);
  assert.equal(hasBackendControllerRouteWithoutRoles(methodRolesAst), false);
  assert.equal(hasBackendControllerRouteWithoutRoles(unguardedRouteAst), false);
});

test('hasBackendEventHandlerWithoutOnEvent detecta handlers backend sin decorador OnEvent', () => {
  const missingOnEventAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'OrderCreatedEventHandler' },
        loc: { start: { line: 9 }, end: { line: 20 } },
        decorators: [
          {
            type: 'Decorator',
            expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'Injectable' }, arguments: [] },
          },
        ],
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'handleOrderCreatedEvent' },
              loc: { start: { line: 14 }, end: { line: 18 } },
              decorators: [],
            },
          ],
        },
      },
    ],
  };
  const decoratedMethodAst = {
    type: 'Program',
    body: [
      {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'OrderCreatedEventHandler' },
        loc: { start: { line: 29 }, end: { line: 40 } },
        decorators: [
          {
            type: 'Decorator',
            expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'Injectable' }, arguments: [] },
          },
        ],
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'ClassMethod',
              key: { type: 'Identifier', name: 'handleOrderCreatedEvent' },
              loc: { start: { line: 34 }, end: { line: 38 } },
              decorators: [
                {
                  type: 'Decorator',
                  expression: { type: 'CallExpression', callee: { type: 'Identifier', name: 'OnEvent' }, arguments: [] },
                },
              ],
            },
          ],
        },
      },
    ],
  };

  assert.equal(hasBackendEventHandlerWithoutOnEvent(missingOnEventAst), true);
  assert.deepEqual(findBackendEventHandlerWithoutOnEventLines(missingOnEventAst), [9, 14]);
  assert.equal(hasBackendEventHandlerWithoutOnEvent(decoratedMethodAst), false);
});
