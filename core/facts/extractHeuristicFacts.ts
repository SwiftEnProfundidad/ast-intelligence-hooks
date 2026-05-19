import { parse } from '@babel/parser';
import type { Fact } from './Fact';
import type { FileContentFact } from './FileContentFact';
import type { HeuristicFact } from './HeuristicFact';

// Import detectors
import * as TS from './detectors/typescript';
import * as Process from './detectors/process';
import * as Security from './detectors/security';
import * as Browser from './detectors/browser';
import * as VM from './detectors/vm';
import * as FsSync from './detectors/fs/sync';
import * as FsPromises from './detectors/fs/promises';
import * as FsCallbacks from './detectors/fs/callbacks';
import * as TextIOS from './detectors/text/ios';
import * as TextAndroid from './detectors/text/android';
import { collectNodeLineMatches, isObject } from './detectors/utils/astHelpers';

export type HeuristicExtractionParams = {
  facts: ReadonlyArray<Fact>;
  detectedPlatforms: {
    ios?: { detected: boolean };
    android?: { detected: boolean };
    frontend?: { detected: boolean };
    backend?: { detected: boolean };
  };
  typeScriptScope?: 'platform' | 'all';
};

export type ExtractedHeuristicFact = HeuristicFact & { source: string };

const HEURISTIC_SOURCE = 'heuristics:ast';

// --- Helper Functions ---

const isAllTypeScriptHeuristicScopeEnabled = (
  params?: Pick<HeuristicExtractionParams, 'typeScriptScope'>
): boolean => {
  if (params?.typeScriptScope === 'all') {
    return true;
  }
  if (params?.typeScriptScope === 'platform') {
    return false;
  }
  return process.env.PUMUKI_HEURISTICS_TS_SCOPE?.trim().toLowerCase() === 'all';
};

const isTypeScriptHeuristicTargetPath = (
  path: string,
  params?: Pick<HeuristicExtractionParams, 'typeScriptScope'>
): boolean => {
  if (isAllTypeScriptHeuristicScopeEnabled(params)) {
    return path.endsWith('.ts') || path.endsWith('.tsx');
  }
  return (
    (path.endsWith('.ts') || path.endsWith('.tsx')) &&
    (path.startsWith('apps/frontend/') ||
      path.startsWith('apps/web/') ||
      path.startsWith('apps/backend/'))
  );
};

const isTypeScriptDomainOrApplicationPath = (path: string): boolean => {
  if (!isTypeScriptHeuristicTargetPath(path)) {
    return false;
  }
  return (
    path.includes('/domain/') ||
    path.includes('/application/') ||
    path.includes('/use-cases/') ||
    path.includes('/core/')
  );
};

const isBackendTypeScriptPath = (path: string): boolean => {
  return isTypeScriptHeuristicTargetPath(path) && path.startsWith('apps/backend/');
};

const isBackendNonConfigTypeScriptPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  return (
    isBackendTypeScriptPath(path) &&
    !normalized.includes('/config/') &&
    !normalized.endsWith('.config.ts') &&
    !normalized.endsWith('/configuration.ts') &&
    !normalized.endsWith('/environment.ts')
  );
};

const isBackendControllerTypeScriptPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  return isBackendTypeScriptPath(path) && normalized.endsWith('.controller.ts');
};

const isBackendDomainEntityPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  return (
    isBackendTypeScriptPath(path) &&
    (normalized.includes('/domain/entities/') ||
      normalized.includes('/domain/entity/') ||
      normalized.includes('/entities/'))
  );
};

const isIOSSwiftPath = (path: string): boolean => {
  return path.endsWith('.swift') && path.startsWith('apps/ios/');
};

const isIOSSwiftPackageManifestPath = (path: string): boolean => {
  return path.replace(/\\/g, '/') === 'apps/ios/Package.swift';
};

const isIOSXcodeProjectFilePath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/');
  return normalized.startsWith('apps/ios/') && normalized.endsWith('/project.pbxproj');
};

const isIOSPodfilePath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/');
  return (
    normalized.startsWith('apps/ios/') &&
    (normalized.endsWith('/Podfile') || normalized.endsWith('/Podfile.lock'))
  );
};

const isIOSCartfilePath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/');
  return (
    normalized.startsWith('apps/ios/') &&
    (normalized.endsWith('/Cartfile') || normalized.endsWith('/Cartfile.resolved'))
  );
};

const isIOSInfoPlistPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/');
  return normalized.startsWith('apps/ios/') && normalized.endsWith('/Info.plist');
};

const isIOSLocalizableStringsPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/');
  return normalized.startsWith('apps/ios/') && normalized.endsWith('/Localizable.strings');
};

const isIOSInterfaceBuilderPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/');
  return (
    normalized.startsWith('apps/ios/') &&
    (normalized.endsWith('.storyboard') || normalized.endsWith('.xib'))
  );
};

const isIOSApplicationOrPresentationPath = (path: string): boolean => {
  return (
    isIOSSwiftPath(path) &&
    (path.includes('/Application/') || path.includes('/Presentation/'))
  );
};

const isIOSPresentationPath = (path: string): boolean => {
  return isIOSSwiftPath(path) && path.includes('/Presentation/');
};

const isAndroidKotlinPath = (path: string): boolean => {
  return (path.endsWith('.kt') || path.endsWith('.kts')) && path.startsWith('apps/android/');
};

const isAndroidSourcePath = (path: string): boolean => {
  return (
    (path.endsWith('.kt') || path.endsWith('.kts') || path.endsWith('.java')) &&
    path.startsWith('apps/android/')
  );
};

const isAndroidLocalPropertiesPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  return normalized.startsWith('apps/android/') && normalized.endsWith('/local.properties');
};

const detectsTrackedFilePresence = (_source: string): boolean => true;

const isAndroidPresentationPath = (path: string): boolean => {
  return isAndroidKotlinPath(path) && path.includes('/presentation/');
};

const isAndroidApplicationOrPresentationPath = (path: string): boolean => {
  return isAndroidKotlinPath(path) && (path.includes('/application/') || path.includes('/presentation/'));
};

const isAndroidDomainOrApplicationPath = (path: string): boolean => {
  return isAndroidKotlinPath(path) && (path.includes('/domain/') || path.includes('/application/'));
};

const isAndroidNonPresentationKotlinPath = (path: string): boolean => {
  return isAndroidKotlinPath(path) && !path.includes('/presentation/');
};

const isApprovedIOSBridgePath = (path: string): boolean => {
  const normalized = path.toLowerCase();
  return (
    normalized.includes('/bridge/') ||
    normalized.includes('/bridges/') ||
    normalized.endsWith('bridge.swift')
  );
};

const isTestPath = (path: string): boolean => {
  return (
    path.includes('/__tests__/') ||
    path.includes('/tests/') ||
    path.endsWith('.spec.ts') ||
    path.endsWith('.spec.tsx') ||
    path.endsWith('.test.ts') ||
    path.endsWith('.test.tsx') ||
    path.endsWith('.spec.js') ||
    path.endsWith('.spec.jsx') ||
    path.endsWith('.test.js') ||
    path.endsWith('.test.jsx')
  );
};

const isSwiftTestPath = (path: string): boolean => {
  return (
    path.includes('/Tests/') ||
    path.includes('/tests/') ||
    path.endsWith('Tests.swift') ||
    path.endsWith('Test.swift')
  );
};

const isIOSSwiftTestPath = (path: string): boolean => {
  return isIOSSwiftPath(path) && isSwiftTestPath(path);
};

const isKotlinTestPath = (path: string): boolean => {
  const normalized = path.toLowerCase();
  return (
    normalized.includes('/test/') ||
    normalized.includes('/androidtest/') ||
    normalized.endsWith('test.kt') ||
    normalized.endsWith('tests.kt')
  );
};

const isAndroidKotlinTestPath = (path: string): boolean => {
  return isAndroidKotlinPath(path) && isKotlinTestPath(path);
};

const isExcludedProjectScanPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  return (
    normalized.includes('/node_modules/') ||
    normalized.includes('/dist/') ||
    normalized.includes('/build/') ||
    normalized.includes('/coverage/') ||
    normalized.includes('/.git/')
  );
};

const isTypeScriptNetworkResiliencePath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  if (isExcludedProjectScanPath(normalized)) {
    return false;
  }
  return !/\/(infrastructure\/ast|analyzers?|detectors?|scanner)\//i.test(normalized);
};

const isFrontendTestPath = (path: string): boolean =>
  (path.startsWith('apps/frontend/') || path.startsWith('apps/web/')) && isTestPath(path);

const isNextPagesApiPath = (path: string): boolean => {
  if (!isTypeScriptHeuristicTargetPath(path)) {
    return false;
  }
  const normalized = path.replace(/\\/g, '/');
  return (
    normalized.includes('/pages/api/') &&
    (normalized.endsWith('.ts') || normalized.endsWith('.tsx'))
  );
};

const isWorkflowImplementationPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/');
  const lower = normalized.toLowerCase();
  if (isExcludedProjectScanPath(lower)) {
    return false;
  }
  if (!/\.(swift|kt|kts|ts|tsx|js|jsx)$/i.test(normalized)) {
    return false;
  }
  if (isTestPath(normalized) || isSwiftTestPath(normalized) || isKotlinTestPath(normalized)) {
    return false;
  }
  return true;
};

const isWorkflowFeaturePath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  if (isExcludedProjectScanPath(normalized)) {
    return false;
  }
  return normalized.endsWith('.feature');
};

const asFileContentFact = (fact: Fact): FileContentFact | undefined => {
  if (fact.kind !== 'FileContent') {
    return undefined;
  }
  return fact;
};

const hasDetectedHeuristicPlatform = (params: HeuristicExtractionParams): boolean => {
  if (isAllTypeScriptHeuristicScopeEnabled(params)) {
    return true;
  }
  return Boolean(
    params.detectedPlatforms.frontend?.detected ||
    params.detectedPlatforms.backend?.detected ||
    params.detectedPlatforms.ios?.detected ||
    params.detectedPlatforms.android?.detected
  );
};

const createHeuristicFact = (params: {
  ruleId: string;
  code: string;
  message: string;
  filePath?: string;
  lines?: readonly number[];
  severity?: HeuristicFact['severity'];
  primary_node?: HeuristicFact['primary_node'];
  related_nodes?: HeuristicFact['related_nodes'];
  why?: string;
  impact?: string;
  expected_fix?: string;
}): ExtractedHeuristicFact => {
  return {
    kind: 'Heuristic',
    source: HEURISTIC_SOURCE,
    ruleId: params.ruleId,
    severity: params.severity ?? 'WARN',
    code: params.code,
    message: params.message,
    filePath: params.filePath,
    lines: params.lines,
    primary_node: params.primary_node,
    related_nodes: params.related_nodes,
    why: params.why,
    impact: params.impact,
    expected_fix: params.expected_fix,
  };
};

// --- Registries ---

type ASTDetectorFunction = (ast: unknown) => boolean;
type ASTLineLocator = (ast: unknown) => readonly number[];

const lowerFirst = (value: string): string => {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toLowerCase() + value.slice(1);
};

const isIdentifierPropertyMatch = (node: unknown, expectedName: string): boolean => {
  return isObject(node) && node.type === 'Identifier' && node.name === expectedName;
};

const isStringLiteralPropertyMatch = (node: unknown, expectedName: string): boolean => {
  return isObject(node) && node.type === 'StringLiteral' && node.value === expectedName;
};

const createFsSyncMethodLineLocator = (methodName: string): ASTLineLocator => {
  return (ast: unknown): readonly number[] => {
    return collectNodeLineMatches(ast, (value) => {
      if (value.type !== 'CallExpression') {
        return false;
      }
      const callee = value.callee;
      if (!isObject(callee) || callee.type !== 'MemberExpression' || callee.computed === true) {
        return false;
      }
      return isIdentifierPropertyMatch(callee.object, 'fs') && isIdentifierPropertyMatch(callee.property, methodName);
    });
  };
};

const createFsPromisesMethodLineLocator = (methodName: string): ASTLineLocator => {
  return (ast: unknown): readonly number[] => {
    return collectNodeLineMatches(ast, (value) => {
      if (value.type !== 'CallExpression') {
        return false;
      }
      const callee = value.callee;
      if (!isObject(callee) || callee.type !== 'MemberExpression') {
        return false;
      }

      const methodMatches =
        (callee.computed === true && isStringLiteralPropertyMatch(callee.property, methodName)) ||
        (callee.computed !== true && isIdentifierPropertyMatch(callee.property, methodName));
      if (!methodMatches) {
        return false;
      }

      const objectNode = callee.object;
      if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
        return false;
      }
      const promisesMatches =
        (objectNode.computed === true && isStringLiteralPropertyMatch(objectNode.property, 'promises')) ||
        (objectNode.computed !== true && isIdentifierPropertyMatch(objectNode.property, 'promises'));
      if (!promisesMatches) {
        return false;
      }

      return isIdentifierPropertyMatch(objectNode.object, 'fs');
    });
  };
};

const createFsCallbackMethodLineLocator = (methodName: string): ASTLineLocator => {
  return (ast: unknown): readonly number[] => {
    return collectNodeLineMatches(ast, (value) => {
      if (value.type !== 'CallExpression') {
        return false;
      }
      const callee = value.callee;
      if (!isObject(callee) || callee.type !== 'MemberExpression') {
        return false;
      }

      const methodMatches =
        (callee.computed === true && isStringLiteralPropertyMatch(callee.property, methodName)) ||
        (callee.computed !== true && isIdentifierPropertyMatch(callee.property, methodName));
      if (!methodMatches || !isIdentifierPropertyMatch(callee.object, 'fs')) {
        return false;
      }

      const args = value.arguments as unknown[];
      if (!Array.isArray(args)) {
        return false;
      }
      return args.some(
        (argument) =>
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
      );
    });
  };
};

const inferFsLineLocatorFromDetectorExportName = (exportName: string): ASTLineLocator | undefined => {
  const fsSyncMatch = exportName.match(/^hasFs(.+)SyncCall$/);
  if (fsSyncMatch?.[1]) {
    return createFsSyncMethodLineLocator(`${lowerFirst(fsSyncMatch[1])}Sync`);
  }

  const fsPromisesMatch = exportName.match(/^hasFsPromises(.+)Call$/);
  if (fsPromisesMatch?.[1]) {
    return createFsPromisesMethodLineLocator(lowerFirst(fsPromisesMatch[1]));
  }

  const fsCallbackMatch = exportName.match(/^hasFs(.+)CallbackCall$/);
  if (fsCallbackMatch?.[1]) {
    return createFsCallbackMethodLineLocator(lowerFirst(fsCallbackMatch[1]));
  }

  return undefined;
};

const astDetectorLineLocatorRegistry = new Map<ASTDetectorFunction, ASTLineLocator>();

const registerAstDetectorLineLocators = (moduleExports: Record<string, string | number | boolean | bigint | symbol | null | Date | object>): void => {
  for (const [exportName, exportValue] of Object.entries(moduleExports)) {
    if (!exportName.startsWith('has') || typeof exportValue !== 'function') {
      continue;
    }

    const detect = exportValue as ASTDetectorFunction;
    const lineLocatorExportName = `find${exportName.slice(3)}Lines`;
    const locatorExport = moduleExports[lineLocatorExportName];
    if (typeof locatorExport === 'function') {
      astDetectorLineLocatorRegistry.set(detect, locatorExport as ASTLineLocator);
      continue;
    }

    const inferredLocator = inferFsLineLocatorFromDetectorExportName(exportName);
    if (inferredLocator) {
      astDetectorLineLocatorRegistry.set(detect, inferredLocator);
    }
  }
};

type ASTDetectorRegistryEntry = {
  readonly detect: ASTDetectorFunction;
  readonly locateLines?: (ast: unknown) => readonly number[];
  readonly ruleId: string;
  readonly code: string;
  readonly message: string;
  readonly pathCheck?: (path: string) => boolean;
  readonly includeTestPaths?: boolean;
};

const astDetectorRegistry: ReadonlyArray<ASTDetectorRegistryEntry> = [
  // TypeScript
  { detect: TS.hasEmptyCatchClause, locateLines: TS.findEmptyCatchClauseLines, ruleId: 'heuristics.ts.empty-catch.ast', code: 'HEURISTICS_EMPTY_CATCH_AST', message: 'AST heuristic detected an empty catch block.' },
  { detect: TS.hasEmptyCatchClause, locateLines: TS.findEmptyCatchClauseLines, ruleId: 'common.error.empty_catch', code: 'COMMON_ERROR_EMPTY_CATCH_AST', message: 'AST heuristic detected empty catch block without handling.' },
  { detect: TS.hasExplicitAnyType, ruleId: 'heuristics.ts.explicit-any.ast', code: 'HEURISTICS_EXPLICIT_ANY_AST', message: 'AST heuristic detected explicit any usage.' },
  { detect: TS.hasConsoleLogCall, ruleId: 'heuristics.ts.console-log.ast', code: 'HEURISTICS_CONSOLE_LOG_AST', message: 'AST heuristic detected console.log usage.' },
  { detect: TS.hasConsoleErrorCall, ruleId: 'heuristics.ts.console-error.ast', code: 'HEURISTICS_CONSOLE_ERROR_AST', message: 'AST heuristic detected console.error usage.' },
  { detect: TS.hasSensitiveDataLoggingCall, ruleId: 'heuristics.ts.backend.sensitive-data-logging.ast', code: 'HEURISTICS_BACKEND_SENSITIVE_DATA_LOGGING_AST', message: 'AST heuristic detected sensitive data passed to a logging sink.' },
  { detect: TS.hasBackendLogWithoutContext, locateLines: TS.findBackendLogWithoutContextLines, ruleId: 'heuristics.ts.backend.log-without-context.ast', code: 'HEURISTICS_BACKEND_LOG_WITHOUT_CONTEXT_AST', message: 'AST heuristic detected backend log call without request/user/trace context.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendAuthResponseWithoutRefreshToken, locateLines: TS.findBackendAuthResponseWithoutRefreshTokenLines, ruleId: 'heuristics.ts.backend.auth-response-without-refresh-token.ast', code: 'HEURISTICS_BACKEND_AUTH_RESPONSE_WITHOUT_REFRESH_TOKEN_AST', message: 'AST heuristic detected backend auth response returning an access token without a refresh token.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendProcessEnvDefaultFallback, locateLines: TS.findBackendProcessEnvDefaultFallbackLines, ruleId: 'heuristics.ts.backend.process-env-default-fallback.ast', code: 'HEURISTICS_BACKEND_PROCESS_ENV_DEFAULT_FALLBACK_AST', message: 'AST heuristic detected backend process.env configuration with a literal production fallback.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendDirectProcessEnvRead, locateLines: TS.findBackendDirectProcessEnvReadLines, ruleId: 'heuristics.ts.backend.direct-process-env-read.ast', code: 'HEURISTICS_BACKEND_DIRECT_PROCESS_ENV_READ_AST', message: 'AST heuristic detected direct backend process.env read outside the configuration boundary.', pathCheck: isBackendNonConfigTypeScriptPath },
  { detect: TS.hasBackendConfigModuleWithoutValidation, locateLines: TS.findBackendConfigModuleWithoutValidationLines, ruleId: 'heuristics.ts.backend.config-module-without-validation.ast', code: 'HEURISTICS_BACKEND_CONFIG_MODULE_WITHOUT_VALIDATION_AST', message: 'AST heuristic detected ConfigModule.forRoot without env validationSchema or validate.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendMagicNumberLiteral, ruleId: 'heuristics.ts.backend.magic-number-literal.ast', code: 'HEURISTICS_BACKEND_MAGIC_NUMBER_LITERAL_AST', message: 'AST heuristic detected an inline numeric literal; use a named constant for backend readability and maintainability.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendGenericErrorThrow, ruleId: 'heuristics.ts.backend.generic-error-throw.ast', code: 'HEURISTICS_BACKEND_GENERIC_ERROR_THROW_AST', message: 'AST heuristic detected throw new Error in backend code; use a specific domain/application exception.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendRawThrowExpression, locateLines: TS.findBackendRawThrowExpressionLines, ruleId: 'heuristics.ts.backend.raw-throw-expression.ast', code: 'HEURISTICS_BACKEND_RAW_THROW_EXPRESSION_AST', message: 'AST heuristic detected raw throw expression in backend code; throw a typed exception.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendProductionMockOrSpy, ruleId: 'heuristics.ts.backend.production-mock-or-spy.ast', code: 'HEURISTICS_BACKEND_PRODUCTION_MOCK_OR_SPY_AST', message: 'AST heuristic detected mock or spy test primitive in backend production code.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendErrorStackInHttpResponse, ruleId: 'heuristics.ts.backend.error-stack-in-http-response.ast', code: 'HEURISTICS_BACKEND_ERROR_STACK_IN_HTTP_RESPONSE_AST', message: 'AST heuristic detected stack trace exposed in a backend HTTP response.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendInconsistentErrorResponse, locateLines: TS.findBackendInconsistentErrorResponseLines, ruleId: 'heuristics.ts.backend.inconsistent-error-response.ast', code: 'HEURISTICS_BACKEND_INCONSISTENT_ERROR_RESPONSE_AST', message: 'AST heuristic detected backend error response without statusCode, message, timestamp and path.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendErrorPayloadWithSuccessStatus, locateLines: TS.findBackendErrorPayloadWithSuccessStatusLines, ruleId: 'heuristics.ts.backend.error-payload-success-status.ast', code: 'HEURISTICS_BACKEND_ERROR_PAYLOAD_SUCCESS_STATUS_AST', message: 'AST heuristic detected backend error payload sent with a success HTTP status.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendControllerEntityResponse, locateLines: TS.findBackendControllerEntityResponseLines, ruleId: 'heuristics.ts.backend.controller-entity-response.ast', code: 'HEURISTICS_BACKEND_CONTROLLER_ENTITY_RESPONSE_AST', message: 'AST heuristic detected backend controller exposing domain entities directly; return DTOs instead.', pathCheck: isBackendControllerTypeScriptPath },
  { detect: TS.hasBackendControllerBusinessLogic, locateLines: TS.findBackendControllerBusinessLogicLines, ruleId: 'heuristics.ts.backend.controller-business-logic.ast', code: 'HEURISTICS_BACKEND_CONTROLLER_BUSINESS_LOGIC_AST', message: 'AST heuristic detected business logic inside a NestJS controller route handler.', pathCheck: isBackendControllerTypeScriptPath },
  { detect: TS.hasBackendRepositoryBusinessLogic, locateLines: TS.findBackendRepositoryBusinessLogicLines, ruleId: 'heuristics.ts.backend.repository-business-logic.ast', code: 'HEURISTICS_BACKEND_REPOSITORY_BUSINESS_LOGIC_AST', message: 'AST heuristic detected business decision logic inside a backend repository.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendAnemicDomainModel, ruleId: 'heuristics.ts.backend.anemic-domain-model.ast', code: 'HEURISTICS_BACKEND_ANEMIC_DOMAIN_MODEL_AST', message: 'AST heuristic detected an anemic backend domain entity without business behavior.', pathCheck: isBackendDomainEntityPath },
  { detect: TS.hasBackendPermissiveCorsConfiguration, locateLines: TS.findBackendPermissiveCorsConfigurationLines, ruleId: 'heuristics.ts.backend.permissive-cors.ast', code: 'HEURISTICS_BACKEND_PERMISSIVE_CORS_AST', message: 'AST heuristic detected permissive backend CORS configuration; restrict allowed origins explicitly.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendMissingHelmetSecurityHeaders, locateLines: TS.findBackendMissingHelmetSecurityHeadersLines, ruleId: 'heuristics.ts.backend.missing-helmet-security-headers.ast', code: 'HEURISTICS_BACKEND_MISSING_HELMET_SECURITY_HEADERS_AST', message: 'AST heuristic detected NestJS bootstrap without Helmet security headers middleware.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendMissingCompressionMiddleware, locateLines: TS.findBackendMissingCompressionMiddlewareLines, ruleId: 'heuristics.ts.backend.missing-compression-middleware.ast', code: 'HEURISTICS_BACKEND_MISSING_COMPRESSION_MIDDLEWARE_AST', message: 'AST heuristic detected NestJS bootstrap without compression middleware.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendMissingGlobalValidationPipe, locateLines: TS.findBackendMissingGlobalValidationPipeLines, ruleId: 'heuristics.ts.backend.missing-global-validation-pipe.ast', code: 'HEURISTICS_BACKEND_MISSING_GLOBAL_VALIDATION_PIPE_AST', message: 'AST heuristic detected NestJS bootstrap without global ValidationPipe whitelist.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendStringLiteralUnionEnumCandidate, locateLines: TS.findBackendStringLiteralUnionEnumCandidateLines, ruleId: 'heuristics.ts.backend.string-literal-union-enum.ast', code: 'HEURISTICS_BACKEND_STRING_LITERAL_UNION_ENUM_AST', message: 'AST heuristic detected fixed backend string literal union; use an enum or centralized typed constants.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendSensitiveCacheWrite, locateLines: TS.findBackendSensitiveCacheWriteLines, ruleId: 'heuristics.ts.backend.sensitive-cache-write.ast', code: 'HEURISTICS_BACKEND_SENSITIVE_CACHE_WRITE_AST', message: 'AST heuristic detected sensitive data written to backend cache.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasEvalCall, ruleId: 'heuristics.ts.eval.ast', code: 'HEURISTICS_EVAL_AST', message: 'AST heuristic detected eval usage.' },
  { detect: TS.hasFunctionConstructorUsage, ruleId: 'heuristics.ts.function-constructor.ast', code: 'HEURISTICS_FUNCTION_CONSTRUCTOR_AST', message: 'AST heuristic detected Function constructor usage.' },
  { detect: TS.hasSetTimeoutStringCallback, ruleId: 'heuristics.ts.set-timeout-string.ast', code: 'HEURISTICS_SET_TIMEOUT_STRING_AST', message: 'AST heuristic detected setTimeout with a string callback.' },
  { detect: TS.hasSetIntervalStringCallback, ruleId: 'heuristics.ts.set-interval-string.ast', code: 'HEURISTICS_SET_INTERVAL_STRING_AST', message: 'AST heuristic detected setInterval with a string callback.' },
  { detect: TS.hasAsyncPromiseExecutor, ruleId: 'heuristics.ts.new-promise-async.ast', code: 'HEURISTICS_NEW_PROMISE_ASYNC_AST', message: 'AST heuristic detected async Promise executor usage.' },
  { detect: TS.hasWeakBcryptSaltRounds, ruleId: 'heuristics.ts.bcrypt-weak-salt-rounds.ast', code: 'HEURISTICS_BCRYPT_WEAK_SALT_ROUNDS_AST', message: 'AST heuristic detected bcrypt salt rounds below 10.' },
  { detect: TS.hasInterpolatedUnsafeSqlCall, ruleId: 'heuristics.ts.sql-interpolated-unsafe-call.ast', code: 'HEURISTICS_SQL_INTERPOLATED_UNSAFE_CALL_AST', message: 'AST heuristic detected interpolated SQL passed to an unsafe query/raw call.' },
  { detect: TS.hasSensitiveTokenInUrl, ruleId: 'heuristics.ts.sensitive-token-in-url.ast', code: 'HEURISTICS_SENSITIVE_TOKEN_IN_URL_AST', message: 'AST heuristic detected sensitive token or credential in a network URL.' },
  { detect: TS.hasDirectNetworkCall, ruleId: 'heuristics.ts.frontend-test-direct-network-call.ast', code: 'HEURISTICS_FRONTEND_TEST_DIRECT_NETWORK_CALL_AST', message: 'AST heuristic detected direct fetch/axios/request usage in a frontend test; use MSW handlers instead.', pathCheck: isFrontendTestPath, includeTestPaths: true },
  { detect: TS.hasNonSemanticClickableJsx, ruleId: 'heuristics.tsx.non-semantic-clickable.ast', code: 'HEURISTICS_TSX_NON_SEMANTIC_CLICKABLE_AST', message: 'AST heuristic detected non-semantic clickable JSX without keyboard accessibility.' },
  { detect: TS.hasRedundantAriaRoleOnSemanticJsx, ruleId: 'heuristics.tsx.redundant-aria-role.ast', code: 'HEURISTICS_TSX_REDUNDANT_ARIA_ROLE_AST', message: 'AST heuristic detected redundant ARIA role on semantic JSX.' },
  { detect: TS.hasNestedCallbackUsage, ruleId: 'heuristics.ts.callback-hell.ast', code: 'HEURISTICS_CALLBACK_HELL_AST', message: 'AST heuristic detected nested callback usage; prefer async/await or promise composition.' },
  { detect: TS.hasNestedIfElseStatement, ruleId: 'heuristics.ts.nested-if-else.ast', code: 'HEURISTICS_NESTED_IF_ELSE_AST', message: 'AST heuristic detected nested if/else control flow; prefer early returns.' },
  { detect: TS.hasDefaultExportedApiRouteHandler, ruleId: 'heuristics.ts.next-pages-api-route.ast', code: 'HEURISTICS_NEXT_PAGES_API_ROUTE_AST', message: 'AST heuristic detected a legacy Next.js pages/api default route handler; use app/api route handlers.', pathCheck: isNextPagesApiPath },
  { detect: TS.hasWithStatement, ruleId: 'heuristics.ts.with-statement.ast', code: 'HEURISTICS_WITH_STATEMENT_AST', message: 'AST heuristic detected with-statement usage.' },
  { detect: TS.hasDeleteOperator, ruleId: 'heuristics.ts.delete-operator.ast', code: 'HEURISTICS_DELETE_OPERATOR_AST', message: 'AST heuristic detected delete-operator usage.' },
  { detect: TS.hasDebuggerStatement, ruleId: 'heuristics.ts.debugger.ast', code: 'HEURISTICS_DEBUGGER_AST', message: 'AST heuristic detected debugger statement usage.' },
  { detect: TS.hasMixedCommandQueryClass, ruleId: 'heuristics.ts.solid.srp.class-command-query-mix.ast', code: 'HEURISTICS_SOLID_SRP_CLASS_COMMAND_QUERY_MIX_AST', message: 'AST heuristic detected class-level SRP/CQS mix (commands and queries in the same class).' },
  { detect: TS.hasMixedCommandQueryInterface, ruleId: 'heuristics.ts.solid.isp.interface-command-query-mix.ast', code: 'HEURISTICS_SOLID_ISP_INTERFACE_COMMAND_QUERY_MIX_AST', message: 'AST heuristic detected interface-level ISP/CQS mix (commands and queries in the same contract).' },
  { detect: TS.hasTypeDiscriminatorSwitch, ruleId: 'heuristics.ts.solid.ocp.discriminator-switch.ast', code: 'HEURISTICS_SOLID_OCP_DISCRIMINATOR_SWITCH_AST', message: 'AST heuristic detected OCP risk via discriminator switch branching.' },
  { detect: TS.hasOverrideMethodThrowingNotImplemented, ruleId: 'heuristics.ts.solid.lsp.override-not-implemented.ast', code: 'HEURISTICS_SOLID_LSP_OVERRIDE_NOT_IMPLEMENTED_AST', message: 'AST heuristic detected LSP risk: override throws not-implemented/unsupported.' },
  { detect: TS.hasFrameworkDependencyImport, ruleId: 'heuristics.ts.solid.dip.framework-import.ast', code: 'HEURISTICS_SOLID_DIP_FRAMEWORK_IMPORT_AST', message: 'AST heuristic detected DIP risk: framework dependency imported in domain/application code.', pathCheck: isTypeScriptDomainOrApplicationPath },
  { detect: TS.hasConcreteDependencyInstantiation, ruleId: 'heuristics.ts.solid.dip.concrete-instantiation.ast', code: 'HEURISTICS_SOLID_DIP_CONCRETE_INSTANTIATION_AST', message: 'AST heuristic detected DIP risk: direct instantiation of concrete framework dependency.', pathCheck: isTypeScriptDomainOrApplicationPath },
  { detect: TS.hasNestJsConstructorDependencyWithoutDecorator, ruleId: 'heuristics.ts.nestjs.constructor-di-without-decorator.ast', code: 'HEURISTICS_NESTJS_CONSTRUCTOR_DI_WITHOUT_DECORATOR_AST', message: 'AST heuristic detected NestJS constructor dependency injection without an explicit class decorator.' },
  { detect: TS.hasBackendControllerRouteWithoutGuard, locateLines: TS.findBackendControllerRouteWithoutGuardLines, ruleId: 'heuristics.ts.backend.controller-route-without-guard.ast', code: 'HEURISTICS_BACKEND_CONTROLLER_ROUTE_WITHOUT_GUARD_AST', message: 'AST heuristic detected NestJS controller route without UseGuards at method or class level.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendControllerRouteWithoutRoles, locateLines: TS.findBackendControllerRouteWithoutRolesLines, ruleId: 'heuristics.ts.backend.controller-route-without-roles.ast', code: 'HEURISTICS_BACKEND_CONTROLLER_ROUTE_WITHOUT_ROLES_AST', message: 'AST heuristic detected guarded NestJS controller route without Roles/SetMetadata roles authorization.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendAuthRouteWithoutThrottle, locateLines: TS.findBackendAuthRouteWithoutThrottleLines, ruleId: 'heuristics.ts.backend.auth-route-without-throttle.ast', code: 'HEURISTICS_BACKEND_AUTH_ROUTE_WITHOUT_THROTTLE_AST', message: 'AST heuristic detected authentication route without NestJS throttling/rate limiting.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasBackendEventHandlerWithoutOnEvent, locateLines: TS.findBackendEventHandlerWithoutOnEventLines, ruleId: 'heuristics.ts.backend.event-handler-without-on-event.ast', code: 'HEURISTICS_BACKEND_EVENT_HANDLER_WITHOUT_ON_EVENT_AST', message: 'AST heuristic detected backend event handler without @OnEvent subscription.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasPersistenceMutationWithoutAuditEvent, ruleId: 'heuristics.ts.backend.persistence-mutation-without-audit-event.ast', code: 'HEURISTICS_BACKEND_PERSISTENCE_MUTATION_WITHOUT_AUDIT_EVENT_AST', message: 'AST heuristic detected backend persistence mutation without audit log or domain event.' },
  { detect: TS.hasBackendHardDeleteWithoutSoftDelete, locateLines: TS.findBackendHardDeleteWithoutSoftDeleteLines, ruleId: 'heuristics.ts.backend.hard-delete-without-soft-delete.ast', code: 'HEURISTICS_BACKEND_HARD_DELETE_WITHOUT_SOFT_DELETE_AST', message: 'AST heuristic detected backend physical delete; use soft delete with deletedAt/deleted_at.', pathCheck: isBackendTypeScriptPath },
  { detect: TS.hasDtoPropertyWithoutValidation, ruleId: 'heuristics.ts.backend.dto-property-without-validation.ast', code: 'HEURISTICS_BACKEND_DTO_PROPERTY_WITHOUT_VALIDATION_AST', message: 'AST heuristic detected DTO property without class-validator/class-transformer decorator.' },
  { detect: TS.hasDtoPropertyWithoutApiProperty, locateLines: TS.findDtoPropertyWithoutApiPropertyLines, ruleId: 'heuristics.ts.backend.dto-property-without-api-property.ast', code: 'HEURISTICS_BACKEND_DTO_PROPERTY_WITHOUT_API_PROPERTY_AST', message: 'AST heuristic detected DTO property without Swagger ApiProperty decorator.' },
  { detect: TS.hasDtoNestedPropertyWithoutNestedValidation, ruleId: 'heuristics.ts.backend.dto-nested-property-without-nested-validation.ast', code: 'HEURISTICS_BACKEND_DTO_NESTED_PROPERTY_WITHOUT_NESTED_VALIDATION_AST', message: 'AST heuristic detected nested DTO property without @ValidateNested/@Type decorators.' },
  { detect: TS.hasLargeClassDeclaration, ruleId: 'heuristics.ts.god-class-large-class.ast', code: 'HEURISTICS_GOD_CLASS_LARGE_CLASS_AST', message: 'AST heuristic detected God Class candidate by mixed responsibility nodes in a single class declaration.' },
  { detect: TS.hasRecordStringUnknownType, locateLines: TS.findRecordStringUnknownTypeLines, ruleId: 'common.types.record_unknown_requires_type', code: 'COMMON_TYPES_RECORD_UNKNOWN_REQUIRES_TYPE_AST', message: 'AST heuristic detected Record<string, unknown> without explicit value union.' },
  { detect: TS.hasUnknownWithoutGuard, locateLines: TS.findUnknownWithoutGuardLines, ruleId: 'common.types.unknown_without_guard', code: 'COMMON_TYPES_UNKNOWN_WITHOUT_GUARD_AST', message: 'AST heuristic detected unknown usage without explicit guard evidence.', pathCheck: isTypeScriptDomainOrApplicationPath },
  { detect: TS.hasUndefinedInBaseTypeUnion, locateLines: TS.findUndefinedInBaseTypeUnionLines, ruleId: 'common.types.undefined_in_base_type', code: 'COMMON_TYPES_UNDEFINED_IN_BASE_TYPE_AST', message: 'AST heuristic detected undefined inside base-type unions.' },
  { detect: TS.hasNetworkCallWithoutErrorHandling, locateLines: TS.findNetworkCallWithoutErrorHandlingLines, ruleId: 'common.network.missing_error_handling', code: 'COMMON_NETWORK_MISSING_ERROR_HANDLING_AST', message: 'AST heuristic detected network calls without explicit error handling.', pathCheck: isTypeScriptNetworkResiliencePath, includeTestPaths: true },

  // Process
  { detect: Process.hasProcessExitCall, ruleId: 'heuristics.ts.process-exit.ast', code: 'HEURISTICS_PROCESS_EXIT_AST', message: 'AST heuristic detected process.exit usage.' },
  { detect: Process.hasChildProcessImport, ruleId: 'heuristics.ts.child-process-import.ast', code: 'HEURISTICS_CHILD_PROCESS_IMPORT_AST', message: 'AST heuristic detected child_process import/require usage.' },
  { detect: Process.hasProcessEnvMutation, ruleId: 'heuristics.ts.process-env-mutation.ast', code: 'HEURISTICS_PROCESS_ENV_MUTATION_AST', message: 'AST heuristic detected process.env mutation.' },
  { detect: Process.hasExecSyncCall, ruleId: 'heuristics.ts.child-process-exec-sync.ast', code: 'HEURISTICS_CHILD_PROCESS_EXEC_SYNC_AST', message: 'AST heuristic detected execSync usage.' },
  { detect: Process.hasExecCall, ruleId: 'heuristics.ts.child-process-exec.ast', code: 'HEURISTICS_CHILD_PROCESS_EXEC_AST', message: 'AST heuristic detected exec usage.' },
  { detect: Process.hasDynamicShellInvocationCall, ruleId: 'heuristics.ts.dynamic-shell-invocation.ast', code: 'HEURISTICS_DYNAMIC_SHELL_INVOCATION_AST', message: 'AST heuristic detected dynamic shell command invocation.' },
  { detect: Process.hasChildProcessShellTrueCall, ruleId: 'heuristics.ts.child-process-shell-true.ast', code: 'HEURISTICS_CHILD_PROCESS_SHELL_TRUE_AST', message: 'AST heuristic detected child_process call with shell=true.' },
  { detect: Process.hasExecFileUntrustedArgsCall, ruleId: 'heuristics.ts.child-process-exec-file-untrusted-args.ast', code: 'HEURISTICS_CHILD_PROCESS_EXEC_FILE_UNTRUSTED_ARGS_AST', message: 'AST heuristic detected execFile/execFileSync with non-literal args array.' },
  { detect: Process.hasSpawnSyncCall, ruleId: 'heuristics.ts.child-process-spawn-sync.ast', code: 'HEURISTICS_CHILD_PROCESS_SPAWN_SYNC_AST', message: 'AST heuristic detected spawnSync usage.' },
  { detect: Process.hasSpawnCall, ruleId: 'heuristics.ts.child-process-spawn.ast', code: 'HEURISTICS_CHILD_PROCESS_SPAWN_AST', message: 'AST heuristic detected spawn usage.' },
  { detect: Process.hasForkCall, ruleId: 'heuristics.ts.child-process-fork.ast', code: 'HEURISTICS_CHILD_PROCESS_FORK_AST', message: 'AST heuristic detected fork usage.' },
  { detect: Process.hasExecFileSyncCall, ruleId: 'heuristics.ts.child-process-exec-file-sync.ast', code: 'HEURISTICS_CHILD_PROCESS_EXEC_FILE_SYNC_AST', message: 'AST heuristic detected execFileSync usage.' },
  { detect: Process.hasExecFileCall, ruleId: 'heuristics.ts.child-process-exec-file.ast', code: 'HEURISTICS_CHILD_PROCESS_EXEC_FILE_AST', message: 'AST heuristic detected execFile usage.' },

  // Security
  { detect: Security.hasHardcodedSecretTokenLiteral, ruleId: 'heuristics.ts.hardcoded-secret-token.ast', code: 'HEURISTICS_HARDCODED_SECRET_TOKEN_AST', message: 'AST heuristic detected hardcoded secret/token literal.' },
  { detect: Security.hasWeakCryptoHashCreateHashCall, ruleId: 'heuristics.ts.weak-crypto-hash.ast', code: 'HEURISTICS_WEAK_CRYPTO_HASH_AST', message: 'AST heuristic detected weak crypto hash usage (md5/sha1).' },
  { detect: Security.hasInsecureTokenGenerationWithMathRandom, ruleId: 'heuristics.ts.insecure-token-math-random.ast', code: 'HEURISTICS_INSECURE_TOKEN_MATH_RANDOM_AST', message: 'AST heuristic detected insecure token generation via Math.random.' },
  { detect: Security.hasInsecureTokenGenerationWithDateNow, ruleId: 'heuristics.ts.insecure-token-date-now.ast', code: 'HEURISTICS_INSECURE_TOKEN_DATE_NOW_AST', message: 'AST heuristic detected insecure token generation via Date.now.' },
  { detect: Security.hasWeakTokenGenerationWithCryptoRandomUuid, ruleId: 'heuristics.ts.weak-token-randomuuid.ast', code: 'HEURISTICS_WEAK_TOKEN_RANDOMUUID_AST', message: 'AST heuristic detected weak token generation via crypto.randomUUID.' },
  { detect: Security.hasJwtDecodeWithoutVerifyCall, ruleId: 'heuristics.ts.jwt-decode-without-verify.ast', code: 'HEURISTICS_JWT_DECODE_WITHOUT_VERIFY_AST', message: 'AST heuristic detected jsonwebtoken.decode usage without verify.' },
  { detect: Security.hasJwtVerifyIgnoreExpirationCall, ruleId: 'heuristics.ts.jwt-verify-ignore-expiration.ast', code: 'HEURISTICS_JWT_VERIFY_IGNORE_EXPIRATION_AST', message: 'AST heuristic detected jsonwebtoken.verify with ignoreExpiration=true.' },
  { detect: Security.hasJwtSignWithoutExpirationCall, ruleId: 'heuristics.ts.jwt-sign-no-expiration.ast', code: 'HEURISTICS_JWT_SIGN_NO_EXPIRATION_AST', message: 'AST heuristic detected jsonwebtoken.sign without expiration.' },
  { detect: Security.hasTlsRejectUnauthorizedFalseOption, ruleId: 'heuristics.ts.tls-reject-unauthorized-false.ast', code: 'HEURISTICS_TLS_REJECT_UNAUTHORIZED_FALSE_AST', message: 'AST heuristic detected TLS rejectUnauthorized=false configuration.' },
  { detect: Security.hasTlsEnvRejectUnauthorizedZeroOverride, ruleId: 'heuristics.ts.tls-env-override.ast', code: 'HEURISTICS_TLS_ENV_OVERRIDE_AST', message: 'AST heuristic detected NODE_TLS_REJECT_UNAUTHORIZED=0 override.' },
  { detect: Security.hasBufferAllocUnsafeCall, ruleId: 'heuristics.ts.buffer-alloc-unsafe.ast', code: 'HEURISTICS_BUFFER_ALLOC_UNSAFE_AST', message: 'AST heuristic detected Buffer.allocUnsafe usage.' },
  { detect: Security.hasBufferAllocUnsafeSlowCall, ruleId: 'heuristics.ts.buffer-alloc-unsafe-slow.ast', code: 'HEURISTICS_BUFFER_ALLOC_UNSAFE_SLOW_AST', message: 'AST heuristic detected Buffer.allocUnsafeSlow usage.' },

  // Browser
  { detect: Browser.hasInnerHtmlAssignment, ruleId: 'heuristics.ts.inner-html.ast', code: 'HEURISTICS_INNER_HTML_AST', message: 'AST heuristic detected innerHTML assignment.' },
  { detect: Browser.hasDocumentWriteCall, ruleId: 'heuristics.ts.document-write.ast', code: 'HEURISTICS_DOCUMENT_WRITE_AST', message: 'AST heuristic detected document.write usage.' },
  { detect: Browser.hasInsertAdjacentHtmlCall, ruleId: 'heuristics.ts.insert-adjacent-html.ast', code: 'HEURISTICS_INSERT_ADJACENT_HTML_AST', message: 'AST heuristic detected insertAdjacentHTML usage.' },

  // VM
  { detect: VM.hasVmDynamicCodeExecutionCall, ruleId: 'heuristics.ts.vm-dynamic-code-execution.ast', code: 'HEURISTICS_VM_DYNAMIC_CODE_EXECUTION_AST', message: 'AST heuristic detected vm dynamic code execution call.' },

  // FS Sync
  { detect: FsSync.hasFsWriteFileSyncCall, ruleId: 'heuristics.ts.fs-write-file-sync.ast', code: 'HEURISTICS_FS_WRITE_FILE_SYNC_AST', message: 'AST heuristic detected fs.writeFileSync usage.' },
  { detect: FsSync.hasFsRmSyncCall, ruleId: 'heuristics.ts.fs-rm-sync.ast', code: 'HEURISTICS_FS_RM_SYNC_AST', message: 'AST heuristic detected fs.rmSync usage.' },
  { detect: FsSync.hasFsMkdirSyncCall, ruleId: 'heuristics.ts.fs-mkdir-sync.ast', code: 'HEURISTICS_FS_MKDIR_SYNC_AST', message: 'AST heuristic detected fs.mkdirSync usage.' },
  { detect: FsSync.hasFsReaddirSyncCall, ruleId: 'heuristics.ts.fs-readdir-sync.ast', code: 'HEURISTICS_FS_READDIR_SYNC_AST', message: 'AST heuristic detected fs.readdirSync usage.' },
  { detect: FsSync.hasFsReadFileSyncCall, ruleId: 'heuristics.ts.fs-read-file-sync.ast', code: 'HEURISTICS_FS_READ_FILE_SYNC_AST', message: 'AST heuristic detected fs.readFileSync usage.' },
  { detect: FsSync.hasFsStatSyncCall, ruleId: 'heuristics.ts.fs-stat-sync.ast', code: 'HEURISTICS_FS_STAT_SYNC_AST', message: 'AST heuristic detected fs.statSync usage.' },
  { detect: FsSync.hasFsStatfsSyncCall, ruleId: 'heuristics.ts.fs-statfs-sync.ast', code: 'HEURISTICS_FS_STATFS_SYNC_AST', message: 'AST heuristic detected fs.statfsSync usage.' },
  { detect: FsSync.hasFsRealpathSyncCall, ruleId: 'heuristics.ts.fs-realpath-sync.ast', code: 'HEURISTICS_FS_REALPATH_SYNC_AST', message: 'AST heuristic detected fs.realpathSync usage.' },
  { detect: FsSync.hasFsLstatSyncCall, ruleId: 'heuristics.ts.fs-lstat-sync.ast', code: 'HEURISTICS_FS_LSTAT_SYNC_AST', message: 'AST heuristic detected fs.lstatSync usage.' },
  { detect: FsSync.hasFsExistsSyncCall, ruleId: 'heuristics.ts.fs-exists-sync.ast', code: 'HEURISTICS_FS_EXISTS_SYNC_AST', message: 'AST heuristic detected fs.existsSync usage.' },
  { detect: FsSync.hasFsAccessSyncCall, ruleId: 'heuristics.ts.fs-access-sync.ast', code: 'HEURISTICS_FS_ACCESS_SYNC_AST', message: 'AST heuristic detected fs.accessSync usage.' },
  { detect: FsSync.hasFsUtimesSyncCall, ruleId: 'heuristics.ts.fs-utimes-sync.ast', code: 'HEURISTICS_FS_UTIMES_SYNC_AST', message: 'AST heuristic detected fs.utimesSync usage.' },
  { detect: FsSync.hasFsRenameSyncCall, ruleId: 'heuristics.ts.fs-rename-sync.ast', code: 'HEURISTICS_FS_RENAME_SYNC_AST', message: 'AST heuristic detected fs.renameSync usage.' },
  { detect: FsSync.hasFsCopyFileSyncCall, ruleId: 'heuristics.ts.fs-copy-file-sync.ast', code: 'HEURISTICS_FS_COPY_FILE_SYNC_AST', message: 'AST heuristic detected fs.copyFileSync usage.' },
  { detect: FsSync.hasFsUnlinkSyncCall, ruleId: 'heuristics.ts.fs-unlink-sync.ast', code: 'HEURISTICS_FS_UNLINK_SYNC_AST', message: 'AST heuristic detected fs.unlinkSync usage.' },
  { detect: FsSync.hasFsTruncateSyncCall, ruleId: 'heuristics.ts.fs-truncate-sync.ast', code: 'HEURISTICS_FS_TRUNCATE_SYNC_AST', message: 'AST heuristic detected fs.truncateSync usage.' },
  { detect: FsSync.hasFsRmdirSyncCall, ruleId: 'heuristics.ts.fs-rmdir-sync.ast', code: 'HEURISTICS_FS_RMDIR_SYNC_AST', message: 'AST heuristic detected fs.rmdirSync usage.' },
  { detect: FsSync.hasFsChmodSyncCall, ruleId: 'heuristics.ts.fs-chmod-sync.ast', code: 'HEURISTICS_FS_CHMOD_SYNC_AST', message: 'AST heuristic detected fs.chmodSync usage.' },
  { detect: FsSync.hasFsChownSyncCall, ruleId: 'heuristics.ts.fs-chown-sync.ast', code: 'HEURISTICS_FS_CHOWN_SYNC_AST', message: 'AST heuristic detected fs.chownSync usage.' },
  { detect: FsSync.hasFsFchownSyncCall, ruleId: 'heuristics.ts.fs-fchown-sync.ast', code: 'HEURISTICS_FS_FCHOWN_SYNC_AST', message: 'AST heuristic detected fs.fchownSync usage.' },
  { detect: FsSync.hasFsFchmodSyncCall, ruleId: 'heuristics.ts.fs-fchmod-sync.ast', code: 'HEURISTICS_FS_FCHMOD_SYNC_AST', message: 'AST heuristic detected fs.fchmodSync usage.' },
  { detect: FsSync.hasFsFstatSyncCall, ruleId: 'heuristics.ts.fs-fstat-sync.ast', code: 'HEURISTICS_FS_FSTAT_SYNC_AST', message: 'AST heuristic detected fs.fstatSync usage.' },
  { detect: FsSync.hasFsFtruncateSyncCall, ruleId: 'heuristics.ts.fs-ftruncate-sync.ast', code: 'HEURISTICS_FS_FTRUNCATE_SYNC_AST', message: 'AST heuristic detected fs.ftruncateSync usage.' },
  { detect: FsSync.hasFsFutimesSyncCall, ruleId: 'heuristics.ts.fs-futimes-sync.ast', code: 'HEURISTICS_FS_FUTIMES_SYNC_AST', message: 'AST heuristic detected fs.futimesSync usage.' },
  { detect: FsSync.hasFsLutimesSyncCall, ruleId: 'heuristics.ts.fs-lutimes-sync.ast', code: 'HEURISTICS_FS_LUTIMES_SYNC_AST', message: 'AST heuristic detected fs.lutimesSync usage.' },
  { detect: FsSync.hasFsReadvSyncCall, ruleId: 'heuristics.ts.fs-readv-sync.ast', code: 'HEURISTICS_FS_READV_SYNC_AST', message: 'AST heuristic detected fs.readvSync usage.' },
  { detect: FsSync.hasFsWritevSyncCall, ruleId: 'heuristics.ts.fs-writev-sync.ast', code: 'HEURISTICS_FS_WRITEV_SYNC_AST', message: 'AST heuristic detected fs.writevSync usage.' },
  { detect: FsSync.hasFsWriteSyncCall, ruleId: 'heuristics.ts.fs-write-sync.ast', code: 'HEURISTICS_FS_WRITE_SYNC_AST', message: 'AST heuristic detected fs.writeSync usage.' },
  { detect: FsSync.hasFsFsyncSyncCall, ruleId: 'heuristics.ts.fs-fsync-sync.ast', code: 'HEURISTICS_FS_FSYNC_SYNC_AST', message: 'AST heuristic detected fs.fsyncSync usage.' },
  { detect: FsSync.hasFsFdatasyncSyncCall, ruleId: 'heuristics.ts.fs-fdatasync-sync.ast', code: 'HEURISTICS_FS_FDATASYNC_SYNC_AST', message: 'AST heuristic detected fs.fdatasyncSync usage.' },
  { detect: FsSync.hasFsCloseSyncCall, ruleId: 'heuristics.ts.fs-close-sync.ast', code: 'HEURISTICS_FS_CLOSE_SYNC_AST', message: 'AST heuristic detected fs.closeSync usage.' },
  { detect: FsSync.hasFsReadSyncCall, ruleId: 'heuristics.ts.fs-read-sync.ast', code: 'HEURISTICS_FS_READ_SYNC_AST', message: 'AST heuristic detected fs.readSync usage.' },
  { detect: FsSync.hasFsReadlinkSyncCall, ruleId: 'heuristics.ts.fs-readlink-sync.ast', code: 'HEURISTICS_FS_READLINK_SYNC_AST', message: 'AST heuristic detected fs.readlinkSync usage.' },
  { detect: FsSync.hasFsSymlinkSyncCall, ruleId: 'heuristics.ts.fs-symlink-sync.ast', code: 'HEURISTICS_FS_SYMLINK_SYNC_AST', message: 'AST heuristic detected fs.symlinkSync usage.' },
  { detect: FsSync.hasFsLinkSyncCall, ruleId: 'heuristics.ts.fs-link-sync.ast', code: 'HEURISTICS_FS_LINK_SYNC_AST', message: 'AST heuristic detected fs.linkSync usage.' },
  { detect: FsSync.hasFsCpSyncCall, ruleId: 'heuristics.ts.fs-cp-sync.ast', code: 'HEURISTICS_FS_CP_SYNC_AST', message: 'AST heuristic detected fs.cpSync usage.' },
  { detect: FsSync.hasFsOpenSyncCall, ruleId: 'heuristics.ts.fs-open-sync.ast', code: 'HEURISTICS_FS_OPEN_SYNC_AST', message: 'AST heuristic detected fs.openSync usage.' },
  { detect: FsSync.hasFsOpendirSyncCall, ruleId: 'heuristics.ts.fs-opendir-sync.ast', code: 'HEURISTICS_FS_OPENDIR_SYNC_AST', message: 'AST heuristic detected fs.opendirSync usage.' },
  { detect: FsSync.hasFsMkdtempSyncCall, ruleId: 'heuristics.ts.fs-mkdtemp-sync.ast', code: 'HEURISTICS_FS_MKDTEMP_SYNC_AST', message: 'AST heuristic detected fs.mkdtempSync usage.' },
  { detect: FsSync.hasFsAppendFileSyncCall, ruleId: 'heuristics.ts.fs-append-file-sync.ast', code: 'HEURISTICS_FS_APPEND_FILE_SYNC_AST', message: 'AST heuristic detected fs.appendFileSync usage.' },

  // FS Promises
  { detect: FsPromises.hasFsPromisesWriteFileCall, ruleId: 'heuristics.ts.fs-promises-write-file.ast', code: 'HEURISTICS_FS_PROMISES_WRITE_FILE_AST', message: 'AST heuristic detected fs.promises.writeFile usage.' },
  { detect: FsPromises.hasFsPromisesAppendFileCall, ruleId: 'heuristics.ts.fs-promises-append-file.ast', code: 'HEURISTICS_FS_PROMISES_APPEND_FILE_AST', message: 'AST heuristic detected fs.promises.appendFile usage.' },
  { detect: FsPromises.hasFsPromisesRmCall, ruleId: 'heuristics.ts.fs-promises-rm.ast', code: 'HEURISTICS_FS_PROMISES_RM_AST', message: 'AST heuristic detected fs.promises.rm usage.' },
  { detect: FsPromises.hasFsPromisesUnlinkCall, ruleId: 'heuristics.ts.fs-promises-unlink.ast', code: 'HEURISTICS_FS_PROMISES_UNLINK_AST', message: 'AST heuristic detected fs.promises.unlink usage.' },
  { detect: FsPromises.hasFsPromisesReadFileCall, ruleId: 'heuristics.ts.fs-promises-read-file.ast', code: 'HEURISTICS_FS_PROMISES_READ_FILE_AST', message: 'AST heuristic detected fs.promises.readFile usage.' },
  { detect: FsPromises.hasFsPromisesReaddirCall, ruleId: 'heuristics.ts.fs-promises-readdir.ast', code: 'HEURISTICS_FS_PROMISES_READDIR_AST', message: 'AST heuristic detected fs.promises.readdir usage.' },
  { detect: FsPromises.hasFsPromisesMkdirCall, ruleId: 'heuristics.ts.fs-promises-mkdir.ast', code: 'HEURISTICS_FS_PROMISES_MKDIR_AST', message: 'AST heuristic detected fs.promises.mkdir usage.' },
  { detect: FsPromises.hasFsPromisesStatCall, ruleId: 'heuristics.ts.fs-promises-stat.ast', code: 'HEURISTICS_FS_PROMISES_STAT_AST', message: 'AST heuristic detected fs.promises.stat usage.' },
  { detect: FsPromises.hasFsPromisesCopyFileCall, ruleId: 'heuristics.ts.fs-promises-copy-file.ast', code: 'HEURISTICS_FS_PROMISES_COPY_FILE_AST', message: 'AST heuristic detected fs.promises.copyFile usage.' },
  { detect: FsPromises.hasFsPromisesRenameCall, ruleId: 'heuristics.ts.fs-promises-rename.ast', code: 'HEURISTICS_FS_PROMISES_RENAME_AST', message: 'AST heuristic detected fs.promises.rename usage.' },
  { detect: FsPromises.hasFsPromisesAccessCall, ruleId: 'heuristics.ts.fs-promises-access.ast', code: 'HEURISTICS_FS_PROMISES_ACCESS_AST', message: 'AST heuristic detected fs.promises.access usage.' },
  { detect: FsPromises.hasFsPromisesChmodCall, ruleId: 'heuristics.ts.fs-promises-chmod.ast', code: 'HEURISTICS_FS_PROMISES_CHMOD_AST', message: 'AST heuristic detected fs.promises.chmod usage.' },
  { detect: FsPromises.hasFsPromisesChownCall, ruleId: 'heuristics.ts.fs-promises-chown.ast', code: 'HEURISTICS_FS_PROMISES_CHOWN_AST', message: 'AST heuristic detected fs.promises.chown usage.' },
  { detect: FsPromises.hasFsPromisesUtimesCall, ruleId: 'heuristics.ts.fs-promises-utimes.ast', code: 'HEURISTICS_FS_PROMISES_UTIMES_AST', message: 'AST heuristic detected fs.promises.utimes usage.' },
  { detect: FsPromises.hasFsPromisesLstatCall, ruleId: 'heuristics.ts.fs-promises-lstat.ast', code: 'HEURISTICS_FS_PROMISES_LSTAT_AST', message: 'AST heuristic detected fs.promises.lstat usage.' },
  { detect: FsPromises.hasFsPromisesRealpathCall, ruleId: 'heuristics.ts.fs-promises-realpath.ast', code: 'HEURISTICS_FS_PROMISES_REALPATH_AST', message: 'AST heuristic detected fs.promises.realpath usage.' },
  { detect: FsPromises.hasFsPromisesSymlinkCall, ruleId: 'heuristics.ts.fs-promises-symlink.ast', code: 'HEURISTICS_FS_PROMISES_SYMLINK_AST', message: 'AST heuristic detected fs.promises.symlink usage.' },
  { detect: FsPromises.hasFsPromisesLinkCall, ruleId: 'heuristics.ts.fs-promises-link.ast', code: 'HEURISTICS_FS_PROMISES_LINK_AST', message: 'AST heuristic detected fs.promises.link usage.' },
  { detect: FsPromises.hasFsPromisesReadlinkCall, ruleId: 'heuristics.ts.fs-promises-readlink.ast', code: 'HEURISTICS_FS_PROMISES_READLINK_AST', message: 'AST heuristic detected fs.promises.readlink usage.' },
  { detect: FsPromises.hasFsPromisesOpenCall, ruleId: 'heuristics.ts.fs-promises-open.ast', code: 'HEURISTICS_FS_PROMISES_OPEN_AST', message: 'AST heuristic detected fs.promises.open usage.' },
  { detect: FsPromises.hasFsPromisesOpendirCall, ruleId: 'heuristics.ts.fs-promises-opendir.ast', code: 'HEURISTICS_FS_PROMISES_OPENDIR_AST', message: 'AST heuristic detected fs.promises.opendir usage.' },
  { detect: FsPromises.hasFsPromisesCpCall, ruleId: 'heuristics.ts.fs-promises-cp.ast', code: 'HEURISTICS_FS_PROMISES_CP_AST', message: 'AST heuristic detected fs.promises.cp usage.' },
  { detect: FsPromises.hasFsPromisesMkdtempCall, ruleId: 'heuristics.ts.fs-promises-mkdtemp.ast', code: 'HEURISTICS_FS_PROMISES_MKDTEMP_AST', message: 'AST heuristic detected fs.promises.mkdtemp usage.' },

  // FS Callbacks
  { detect: FsCallbacks.hasFsUtimesCallbackCall, ruleId: 'heuristics.ts.fs-utimes-callback.ast', code: 'HEURISTICS_FS_UTIMES_CALLBACK_AST', message: 'AST heuristic detected fs.utimes callback usage.' },
  { detect: FsCallbacks.hasFsWatchCallbackCall, ruleId: 'heuristics.ts.fs-watch-callback.ast', code: 'HEURISTICS_FS_WATCH_CALLBACK_AST', message: 'AST heuristic detected fs.watch callback usage.' },
  { detect: FsCallbacks.hasFsWatchFileCallbackCall, ruleId: 'heuristics.ts.fs-watch-file-callback.ast', code: 'HEURISTICS_FS_WATCH_FILE_CALLBACK_AST', message: 'AST heuristic detected fs.watchFile callback usage.' },
  { detect: FsCallbacks.hasFsUnwatchFileCallbackCall, ruleId: 'heuristics.ts.fs-unwatch-file-callback.ast', code: 'HEURISTICS_FS_UNWATCH_FILE_CALLBACK_AST', message: 'AST heuristic detected fs.unwatchFile callback usage.' },
  { detect: FsCallbacks.hasFsReadFileCallbackCall, ruleId: 'heuristics.ts.fs-read-file-callback.ast', code: 'HEURISTICS_FS_READ_FILE_CALLBACK_AST', message: 'AST heuristic detected fs.readFile callback usage.' },
  { detect: FsCallbacks.hasFsExistsCallbackCall, ruleId: 'heuristics.ts.fs-exists-callback.ast', code: 'HEURISTICS_FS_EXISTS_CALLBACK_AST', message: 'AST heuristic detected fs.exists callback usage.' },
  { detect: FsCallbacks.hasFsWriteFileCallbackCall, ruleId: 'heuristics.ts.fs-write-file-callback.ast', code: 'HEURISTICS_FS_WRITE_FILE_CALLBACK_AST', message: 'AST heuristic detected fs.writeFile callback usage.' },
  { detect: FsCallbacks.hasFsAppendFileCallbackCall, ruleId: 'heuristics.ts.fs-append-file-callback.ast', code: 'HEURISTICS_FS_APPEND_FILE_CALLBACK_AST', message: 'AST heuristic detected fs.appendFile callback usage.' },
  { detect: FsCallbacks.hasFsReaddirCallbackCall, ruleId: 'heuristics.ts.fs-readdir-callback.ast', code: 'HEURISTICS_FS_READDIR_CALLBACK_AST', message: 'AST heuristic detected fs.readdir callback usage.' },
  { detect: FsCallbacks.hasFsMkdirCallbackCall, ruleId: 'heuristics.ts.fs-mkdir-callback.ast', code: 'HEURISTICS_FS_MKDIR_CALLBACK_AST', message: 'AST heuristic detected fs.mkdir callback usage.' },
  { detect: FsCallbacks.hasFsRmdirCallbackCall, ruleId: 'heuristics.ts.fs-rmdir-callback.ast', code: 'HEURISTICS_FS_RMDIR_CALLBACK_AST', message: 'AST heuristic detected fs.rmdir callback usage.' },
  { detect: FsCallbacks.hasFsRmCallbackCall, ruleId: 'heuristics.ts.fs-rm-callback.ast', code: 'HEURISTICS_FS_RM_CALLBACK_AST', message: 'AST heuristic detected fs.rm callback usage.' },
  { detect: FsCallbacks.hasFsRenameCallbackCall, ruleId: 'heuristics.ts.fs-rename-callback.ast', code: 'HEURISTICS_FS_RENAME_CALLBACK_AST', message: 'AST heuristic detected fs.rename callback usage.' },
  { detect: FsCallbacks.hasFsCopyFileCallbackCall, ruleId: 'heuristics.ts.fs-copy-file-callback.ast', code: 'HEURISTICS_FS_COPY_FILE_CALLBACK_AST', message: 'AST heuristic detected fs.copyFile callback usage.' },
  { detect: FsCallbacks.hasFsStatCallbackCall, ruleId: 'heuristics.ts.fs-stat-callback.ast', code: 'HEURISTICS_FS_STAT_CALLBACK_AST', message: 'AST heuristic detected fs.stat callback usage.' },
  { detect: FsCallbacks.hasFsStatfsCallbackCall, ruleId: 'heuristics.ts.fs-statfs-callback.ast', code: 'HEURISTICS_FS_STATFS_CALLBACK_AST', message: 'AST heuristic detected fs.statfs callback usage.' },
  { detect: FsCallbacks.hasFsLstatCallbackCall, ruleId: 'heuristics.ts.fs-lstat-callback.ast', code: 'HEURISTICS_FS_LSTAT_CALLBACK_AST', message: 'AST heuristic detected fs.lstat callback usage.' },
  { detect: FsCallbacks.hasFsRealpathCallbackCall, ruleId: 'heuristics.ts.fs-realpath-callback.ast', code: 'HEURISTICS_FS_REALPATH_CALLBACK_AST', message: 'AST heuristic detected fs.realpath callback usage.' },
  { detect: FsCallbacks.hasFsAccessCallbackCall, ruleId: 'heuristics.ts.fs-access-callback.ast', code: 'HEURISTICS_FS_ACCESS_CALLBACK_AST', message: 'AST heuristic detected fs.access callback usage.' },
  { detect: FsCallbacks.hasFsChmodCallbackCall, ruleId: 'heuristics.ts.fs-chmod-callback.ast', code: 'HEURISTICS_FS_CHMOD_CALLBACK_AST', message: 'AST heuristic detected fs.chmod callback usage.' },
  { detect: FsCallbacks.hasFsChownCallbackCall, ruleId: 'heuristics.ts.fs-chown-callback.ast', code: 'HEURISTICS_FS_CHOWN_CALLBACK_AST', message: 'AST heuristic detected fs.chown callback usage.' },
  { detect: FsCallbacks.hasFsLchownCallbackCall, ruleId: 'heuristics.ts.fs-lchown-callback.ast', code: 'HEURISTICS_FS_LCHOWN_CALLBACK_AST', message: 'AST heuristic detected fs.lchown callback usage.' },
  { detect: FsCallbacks.hasFsLchmodCallbackCall, ruleId: 'heuristics.ts.fs-lchmod-callback.ast', code: 'HEURISTICS_FS_LCHMOD_CALLBACK_AST', message: 'AST heuristic detected fs.lchmod callback usage.' },
  { detect: FsCallbacks.hasFsUnlinkCallbackCall, ruleId: 'heuristics.ts.fs-unlink-callback.ast', code: 'HEURISTICS_FS_UNLINK_CALLBACK_AST', message: 'AST heuristic detected fs.unlink callback usage.' },
  { detect: FsCallbacks.hasFsReadlinkCallbackCall, ruleId: 'heuristics.ts.fs-readlink-callback.ast', code: 'HEURISTICS_FS_READLINK_CALLBACK_AST', message: 'AST heuristic detected fs.readlink callback usage.' },
  { detect: FsCallbacks.hasFsSymlinkCallbackCall, ruleId: 'heuristics.ts.fs-symlink-callback.ast', code: 'HEURISTICS_FS_SYMLINK_CALLBACK_AST', message: 'AST heuristic detected fs.symlink callback usage.' },
  { detect: FsCallbacks.hasFsLinkCallbackCall, ruleId: 'heuristics.ts.fs-link-callback.ast', code: 'HEURISTICS_FS_LINK_CALLBACK_AST', message: 'AST heuristic detected fs.link callback usage.' },
  { detect: FsCallbacks.hasFsMkdtempCallbackCall, ruleId: 'heuristics.ts.fs-mkdtemp-callback.ast', code: 'HEURISTICS_FS_MKDTEMP_CALLBACK_AST', message: 'AST heuristic detected fs.mkdtemp callback usage.' },
  { detect: FsCallbacks.hasFsOpendirCallbackCall, ruleId: 'heuristics.ts.fs-opendir-callback.ast', code: 'HEURISTICS_FS_OPENDIR_CALLBACK_AST', message: 'AST heuristic detected fs.opendir callback usage.' },
  { detect: FsCallbacks.hasFsOpenCallbackCall, ruleId: 'heuristics.ts.fs-open-callback.ast', code: 'HEURISTICS_FS_OPEN_CALLBACK_AST', message: 'AST heuristic detected fs.open callback usage.' },
  { detect: FsCallbacks.hasFsCpCallbackCall, ruleId: 'heuristics.ts.fs-cp-callback.ast', code: 'HEURISTICS_FS_CP_CALLBACK_AST', message: 'AST heuristic detected fs.cp callback usage.' },
  { detect: FsCallbacks.hasFsCloseCallbackCall, ruleId: 'heuristics.ts.fs-close-callback.ast', code: 'HEURISTICS_FS_CLOSE_CALLBACK_AST', message: 'AST heuristic detected fs.close callback usage.' },
  { detect: FsCallbacks.hasFsReadCallbackCall, ruleId: 'heuristics.ts.fs-read-callback.ast', code: 'HEURISTICS_FS_READ_CALLBACK_AST', message: 'AST heuristic detected fs.read callback usage.' },
  { detect: FsCallbacks.hasFsReadvCallbackCall, ruleId: 'heuristics.ts.fs-readv-callback.ast', code: 'HEURISTICS_FS_READV_CALLBACK_AST', message: 'AST heuristic detected fs.readv callback usage.' },
  { detect: FsCallbacks.hasFsWritevCallbackCall, ruleId: 'heuristics.ts.fs-writev-callback.ast', code: 'HEURISTICS_FS_WRITEV_CALLBACK_AST', message: 'AST heuristic detected fs.writev callback usage.' },
  { detect: FsCallbacks.hasFsWriteCallbackCall, ruleId: 'heuristics.ts.fs-write-callback.ast', code: 'HEURISTICS_FS_WRITE_CALLBACK_AST', message: 'AST heuristic detected fs.write callback usage.' },
  { detect: FsCallbacks.hasFsFsyncCallbackCall, ruleId: 'heuristics.ts.fs-fsync-callback.ast', code: 'HEURISTICS_FS_FSYNC_CALLBACK_AST', message: 'AST heuristic detected fs.fsync callback usage.' },
  { detect: FsCallbacks.hasFsFdatasyncCallbackCall, ruleId: 'heuristics.ts.fs-fdatasync-callback.ast', code: 'HEURISTICS_FS_FDATASYNC_CALLBACK_AST', message: 'AST heuristic detected fs.fdatasync callback usage.' },
  { detect: FsCallbacks.hasFsFchownCallbackCall, ruleId: 'heuristics.ts.fs-fchown-callback.ast', code: 'HEURISTICS_FS_FCHOWN_CALLBACK_AST', message: 'AST heuristic detected fs.fchown callback usage.' },
  { detect: FsCallbacks.hasFsFchmodCallbackCall, ruleId: 'heuristics.ts.fs-fchmod-callback.ast', code: 'HEURISTICS_FS_FCHMOD_CALLBACK_AST', message: 'AST heuristic detected fs.fchmod callback usage.' },
  { detect: FsCallbacks.hasFsFstatCallbackCall, ruleId: 'heuristics.ts.fs-fstat-callback.ast', code: 'HEURISTICS_FS_FSTAT_CALLBACK_AST', message: 'AST heuristic detected fs.fstat callback usage.' },
  { detect: FsCallbacks.hasFsFtruncateCallbackCall, ruleId: 'heuristics.ts.fs-ftruncate-callback.ast', code: 'HEURISTICS_FS_FTRUNCATE_CALLBACK_AST', message: 'AST heuristic detected fs.ftruncate callback usage.' },
  { detect: FsCallbacks.hasFsTruncateCallbackCall, ruleId: 'heuristics.ts.fs-truncate-callback.ast', code: 'HEURISTICS_FS_TRUNCATE_CALLBACK_AST', message: 'AST heuristic detected fs.truncate callback usage.' },
  { detect: FsCallbacks.hasFsFutimesCallbackCall, ruleId: 'heuristics.ts.fs-futimes-callback.ast', code: 'HEURISTICS_FS_FUTIMES_CALLBACK_AST', message: 'AST heuristic detected fs.futimes callback usage.' },
  { detect: FsCallbacks.hasFsLutimesCallbackCall, ruleId: 'heuristics.ts.fs-lutimes-callback.ast', code: 'HEURISTICS_FS_LUTIMES_CALLBACK_AST', message: 'AST heuristic detected fs.lutimes callback usage.' },
];

registerAstDetectorLineLocators(TS as Record<string, string | number | boolean | bigint | symbol | null | Date | object>);
registerAstDetectorLineLocators(Process as Record<string, string | number | boolean | bigint | symbol | null | Date | object>);
registerAstDetectorLineLocators(Security as Record<string, string | number | boolean | bigint | symbol | null | Date | object>);
registerAstDetectorLineLocators(Browser as Record<string, string | number | boolean | bigint | symbol | null | Date | object>);
registerAstDetectorLineLocators(FsSync as Record<string, string | number | boolean | bigint | symbol | null | Date | object>);
registerAstDetectorLineLocators(FsPromises as Record<string, string | number | boolean | bigint | symbol | null | Date | object>);
registerAstDetectorLineLocators(FsCallbacks as Record<string, string | number | boolean | bigint | symbol | null | Date | object>);
registerAstDetectorLineLocators(VM as Record<string, string | number | boolean | bigint | symbol | null | Date | object>);

type TextDetectorRegistryEntry = {
  readonly platform: 'ios' | 'android';
  readonly pathCheck: (path: string) => boolean;
  readonly excludePaths: ReadonlyArray<(path: string) => boolean>;
  readonly detect: (content: string) => boolean;
  readonly locateLines?: (content: string) => readonly number[];
  readonly primaryNode?: (lines: readonly number[]) => HeuristicFact['primary_node'];
  readonly relatedNodes?: (lines: readonly number[]) => HeuristicFact['related_nodes'];
  readonly why?: string;
  readonly impact?: string;
  readonly expected_fix?: string;
  readonly ruleId: string;
  readonly code: string;
  readonly message: string;
};

const textDetectorRegistry: ReadonlyArray<TextDetectorRegistryEntry> = [
  // iOS
  { platform: 'ios', pathCheck: isIOSPodfilePath, excludePaths: [], detect: detectsTrackedFilePresence, ruleId: 'heuristics.ios.dependencies.cocoapods.ast', code: 'HEURISTICS_IOS_DEPENDENCIES_COCOAPODS_AST', message: 'AST heuristic detected CocoaPods dependency files in an iOS project; Swift Package Manager remains the preferred baseline for new code.' },
  { platform: 'ios', pathCheck: isIOSCartfilePath, excludePaths: [], detect: detectsTrackedFilePresence, ruleId: 'heuristics.ios.dependencies.carthage.ast', code: 'HEURISTICS_IOS_DEPENDENCIES_CARTHAGE_AST', message: 'AST heuristic detected Carthage dependency files in an iOS project; Swift Package Manager remains the preferred baseline for new code.' },
  { platform: 'ios', pathCheck: isIOSSwiftPackageManifestPath, excludePaths: [], detect: TextIOS.hasSwiftPackageBranchDependencyUsage, locateLines: TextIOS.collectSwiftPackageBranchDependencyLines, primaryNode: (lines) => ({ kind: 'call', name: 'SwiftPM .package(..., branch: ...)', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: .package(..., exact:/from: version)', lines }], why: 'Branch-based SwiftPM dependencies drift over time and do not provide a reproducible iOS dependency graph.', impact: 'A consumer can build different code from the same commit when the remote branch moves, making production audits and regressions non-deterministic.', expected_fix: 'Pin the dependency to an exact version or an approved semantic version requirement in Package.swift; avoid branch-based dependencies outside explicitly approved experiments.', ruleId: 'heuristics.ios.dependencies.swiftpm-branch-dependency.ast', code: 'HEURISTICS_IOS_DEPENDENCIES_SWIFTPM_BRANCH_DEPENDENCY_AST', message: 'AST heuristic detected a branch-based SwiftPM dependency in iOS Package.swift; use specific versions for reproducible builds.' },
  { platform: 'ios', pathCheck: isIOSSwiftPackageManifestPath, excludePaths: [], detect: TextIOS.hasSwiftPackageToolsVersionBelow62Usage, locateLines: TextIOS.collectSwiftPackageToolsVersionBelow62Lines, primaryNode: (lines) => ({ kind: 'property', name: 'Package.swift swift-tools-version directive', lines }), relatedNodes: (lines) => [{ kind: 'property', name: 'replacement: // swift-tools-version: 6.2', lines }], why: 'An iOS Swift package manifest below Swift tools 6.2 cannot guarantee the current Swift 6.2 language baseline expected by the project skills.', impact: 'Consumers can compile with an older toolchain mode and miss concurrency or language diagnostics that Pumuki expects to enforce.', expected_fix: 'Update the Package.swift directive to // swift-tools-version: 6.2 and verify the package with the repository Xcode/Swift toolchain.', ruleId: 'heuristics.ios.dependencies.swift-tools-version-below-6-2.ast', code: 'HEURISTICS_IOS_DEPENDENCIES_SWIFT_TOOLS_VERSION_BELOW_6_2_AST', message: 'AST heuristic detected Package.swift using swift-tools-version below 6.2.' },
  { platform: 'ios', pathCheck: isIOSXcodeProjectFilePath, excludePaths: [], detect: TextIOS.hasSwiftStrictConcurrencyBelowCompleteUsage, locateLines: TextIOS.collectSwiftStrictConcurrencyBelowCompleteLines, primaryNode: (lines) => ({ kind: 'property', name: 'SWIFT_STRICT_CONCURRENCY below complete', lines }), relatedNodes: (lines) => [{ kind: 'property', name: 'replacement: SWIFT_STRICT_CONCURRENCY = complete', lines }], why: 'The iOS skill contract requires Complete strict concurrency checking so unsafe actor/sendability issues cannot pass silently.', impact: 'Minimal or targeted strict concurrency leaves parts of the module below the Swift concurrency safety baseline and can hide data-race warnings.', expected_fix: 'Set SWIFT_STRICT_CONCURRENCY = complete for the affected iOS build configuration after addressing surfaced warnings.', ruleId: 'heuristics.ios.concurrency.strict-concurrency-below-complete.ast', code: 'HEURISTICS_IOS_CONCURRENCY_STRICT_CONCURRENCY_BELOW_COMPLETE_AST', message: 'AST heuristic detected SWIFT_STRICT_CONCURRENCY below complete in an iOS Xcode project.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNonPascalCaseTypeDeclarationUsage, locateLines: TextIOS.collectSwiftNonPascalCaseTypeDeclarationLines, primaryNode: (lines) => ({ kind: 'class', name: 'Swift type declaration without PascalCase', lines }), relatedNodes: (lines) => [{ kind: 'class', name: 'replacement: PascalCase type name', lines }], why: 'Swift type declarations should use PascalCase so public and internal APIs remain idiomatic, searchable and reviewable.', impact: 'Non-PascalCase type names make ownership boundaries less consistent and weaken automated remediation because the gate cannot rely on the declaration node name.', expected_fix: 'Rename the Swift class, struct, enum, actor or protocol declaration to PascalCase and update its references in the same slice.', ruleId: 'heuristics.ios.naming.non-pascal-case-type.ast', code: 'HEURISTICS_IOS_NAMING_NON_PASCAL_CASE_TYPE_AST', message: 'AST heuristic detected Swift type declaration without PascalCase.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftCellCreationWithoutReuseUsage, locateLines: TextIOS.collectSwiftCellCreationWithoutReuseLines, primaryNode: (lines) => ({ kind: 'call', name: 'UIKit cell created without reuse in cell provider', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: dequeueReusableCell(withIdentifier:for:)', lines }], why: 'UITableView and UICollectionView cell providers must reuse cells instead of allocating a fresh cell for every item.', impact: 'Creating cells directly inside cellForRowAt or cellForItemAt degrades scrolling performance and bypasses UIKit reuse semantics.', expected_fix: 'Register the cell type or nib and return tableView/collectionView.dequeueReusableCell(withIdentifier:for:) from the cell provider.', ruleId: 'heuristics.ios.uikit.cell-without-reuse.ast', code: 'HEURISTICS_IOS_UIKIT_CELL_WITHOUT_REUSE_AST', message: 'AST heuristic detected UIKit cell provider creating cells without dequeueReusableCell.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftForceUnwrap, locateLines: TextIOS.collectSwiftForceUnwrapLines, primaryNode: (lines) => ({ kind: 'member', name: 'force unwrap postfix !', lines }), relatedNodes: (lines) => [{ kind: 'member', name: 'replacement: guarded optional binding or explicit failure path', lines }], why: 'Force unwrap turns optional handling into a runtime crash path instead of a checked domain, UI or infrastructure decision.', impact: 'A nil value can terminate the app outside the error boundary, making production behavior non-deterministic and hard to recover or test.', expected_fix: 'Replace postfix ! with guard let, if let, nil coalescing, throwing validation, or an explicit fallback. In modern Swift tests prefer #require when the unwrap is part of an assertion contract.', ruleId: 'heuristics.ios.force-unwrap.ast', code: 'HEURISTICS_IOS_FORCE_UNWRAP_AST', message: 'AST heuristic detected force unwrap usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftAnyViewUsage, locateLines: TextIOS.collectSwiftAnyViewLines, primaryNode: (lines) => ({ kind: 'call', name: 'type erasure wrapper AnyView', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: concrete View composition or @ViewBuilder branch', lines }], why: 'AnyView erases SwiftUI view identity and type information, hiding structural changes from the compiler and making diffing less predictable.', impact: 'SwiftUI may lose optimization opportunities, navigation/sheet branches become harder to reason about, and remediating UI regressions requires reading dynamic wrappers instead of concrete view composition.', expected_fix: 'Replace AnyView with concrete some View composition, @ViewBuilder branching, generic View parameters, or small extracted subviews that preserve static SwiftUI identity.', ruleId: 'heuristics.ios.anyview.ast', code: 'HEURISTICS_IOS_ANYVIEW_AST', message: 'AST heuristic detected AnyView usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftAnyTypeErasureUsage, locateLines: TextIOS.collectSwiftAnyTypeErasureLines, primaryNode: (lines) => ({ kind: 'property', name: 'Swift Any/AnyObject/AnyHashable type erasure', lines }), relatedNodes: (lines) => [{ kind: 'member', name: 'replacement: generics, associated types, protocol boundary or concrete domain type', lines }], why: 'General Swift type erasure hides domain contracts that should be expressed with generics, associated types or explicit protocol boundaries.', impact: 'Callers lose compile-time guarantees, invalid states travel through the codebase and remediation becomes runtime/debug driven instead of type-system driven.', expected_fix: 'Replace Any, AnyObject or AnyHashable usage with a generic parameter, associated type, concrete value object or narrow protocol boundary.', ruleId: 'heuristics.ios.type-erasure.any.ast', code: 'HEURISTICS_IOS_TYPE_ERASURE_ANY_AST', message: 'AST heuristic detected Swift Any/AnyObject/AnyHashable type erasure in production code.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftForceTryUsage, locateLines: TextIOS.collectSwiftForceTryLines, primaryNode: (lines) => ({ kind: 'call', name: 'force try expression try!', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: do/catch or throwing boundary', lines }], why: 'Force try converts a throwable operation into an unconditional runtime crash instead of preserving the typed error boundary.', impact: 'A recoverable domain, network, persistence or decoding error can terminate the app and bypass user-facing recovery, telemetry and tests.', expected_fix: 'Replace try! with do/catch, try await propagation, throws on the current boundary, or a guarded fallback that handles the error explicitly.', ruleId: 'heuristics.ios.force-try.ast', code: 'HEURISTICS_IOS_FORCE_TRY_AST', message: 'AST heuristic detected force try usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftForceCastUsage, locateLines: TextIOS.collectSwiftForceCastLines, primaryNode: (lines) => ({ kind: 'call', name: 'force cast expression as!', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: conditional cast or typed boundary', lines }], why: 'Force cast converts a type mismatch into an unconditional runtime crash instead of preserving a checked domain or presentation boundary.', impact: 'Unexpected payloads, dependency substitutions or navigation models can terminate the app instead of producing a recoverable validation path.', expected_fix: 'Replace as! with as?, guard let, pattern matching, generic constraints, protocol boundaries, or a typed mapper that validates the runtime value explicitly.', ruleId: 'heuristics.ios.force-cast.ast', code: 'HEURISTICS_IOS_FORCE_CAST_AST', message: 'AST heuristic detected force cast usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath, isApprovedIOSBridgePath], detect: TextIOS.hasSwiftCallbackStyleSignature, locateLines: TextIOS.collectSwiftCallbackStyleSignatureLines, primaryNode: (lines) => ({ kind: 'call', name: 'escaping callback-style API signature', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: async/await API or explicit bridge adapter', lines }], why: 'Callback-style completion APIs outside bridge layers bypass Swift structured concurrency and make cancellation, isolation and error flow implicit.', impact: 'Consumers must reason about escaping lifetime, actor hops and callback ordering manually, which increases race, leak and flaky-test risk in production iOS flows.', expected_fix: 'Expose async/await or AsyncSequence APIs in production boundaries. Keep callbacks only inside approved bridge/adapters that wrap legacy SDKs and document the conversion point explicitly.', ruleId: 'heuristics.ios.callback-style.ast', code: 'HEURISTICS_IOS_CALLBACK_STYLE_AST', message: 'AST heuristic detected callback-style API signature outside bridge layers.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftCombineSinkWithoutStoreUsage, ruleId: 'heuristics.ios.combine.sink-without-store.ast', code: 'HEURISTICS_IOS_COMBINE_SINK_WITHOUT_STORE_AST', message: 'AST heuristic detected Combine sink without store(in:); keep cancellables retained explicitly.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftProductionTestDoubleUsage, ruleId: 'heuristics.ios.testing.production-test-double.ast', code: 'HEURISTICS_IOS_TESTING_PRODUCTION_TEST_DOUBLE_AST', message: 'AST heuristic detected Mock/Fake/Spy/Stub usage in iOS production code.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftDispatchQueueUsage, locateLines: TextIOS.collectSwiftDispatchQueueLines, primaryNode: (lines) => ({ kind: 'call', name: 'GCD DispatchQueue call', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: structured concurrency Task/actor/MainActor boundary', lines }], why: 'DispatchQueue introduces unstructured GCD scheduling in production Swift code instead of preserving Swift concurrency cancellation, priority and actor isolation semantics.', impact: 'Manual queue hops make ordering, cancellation and main-actor safety harder to reason about, increasing race and flaky UI update risk.', expected_fix: 'Use async/await, Task, TaskGroup, actors, MainActor.run or isolated async APIs. Keep GCD only inside explicitly approved legacy bridge layers with documented ownership.', ruleId: 'heuristics.ios.dispatchqueue.ast', code: 'HEURISTICS_IOS_DISPATCHQUEUE_AST', message: 'AST heuristic detected DispatchQueue usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftDispatchGroupUsage, locateLines: TextIOS.collectSwiftDispatchGroupLines, primaryNode: (lines) => ({ kind: 'call', name: 'GCD DispatchGroup call', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: structured concurrency TaskGroup or async aggregation boundary', lines }], why: 'DispatchGroup is an unstructured coordination primitive that makes asynchronous control flow and cancellation implicit instead of modeled by Swift concurrency.', impact: 'Group coordination is harder to reason about and can hide waiting or deadlock risks in production code paths that should be expressed through TaskGroup or async aggregation.', expected_fix: 'Use TaskGroup, async let, await aggregation, actors or explicit async APIs. Keep DispatchGroup only inside approved legacy bridge layers with documented ownership and migration scope.', ruleId: 'heuristics.ios.dispatchgroup.ast', code: 'HEURISTICS_IOS_DISPATCHGROUP_AST', message: 'AST heuristic detected DispatchGroup usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftDispatchSemaphoreUsage, locateLines: TextIOS.collectSwiftDispatchSemaphoreLines, primaryNode: (lines) => ({ kind: 'call', name: 'GCD DispatchSemaphore call', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: structured concurrency TaskGroup, AsyncStream or explicit async boundary', lines }], why: 'DispatchSemaphore is a blocking synchronization primitive that hides ordering and backpressure behind manual waits instead of Swift concurrency boundaries.', impact: 'Semaphore waits can stall threads, obscure cancellation and create deadlock-prone coordination in production code paths that should remain async.', expected_fix: 'Use TaskGroup, AsyncStream, async/await or explicit async boundaries. Keep DispatchSemaphore only inside approved legacy bridge layers with documented ownership and bounded waiting.', ruleId: 'heuristics.ios.dispatchsemaphore.ast', code: 'HEURISTICS_IOS_DISPATCHSEMAPHORE_AST', message: 'AST heuristic detected DispatchSemaphore usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftOperationQueueUsage, ruleId: 'heuristics.ios.operation-queue.ast', code: 'HEURISTICS_IOS_OPERATION_QUEUE_AST', message: 'AST heuristic detected OperationQueue usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftTaskDetachedUsage, ruleId: 'heuristics.ios.task-detached.ast', code: 'HEURISTICS_IOS_TASK_DETACHED_AST', message: 'AST heuristic detected Task.detached usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftAsyncWithoutAwaitUsage, ruleId: 'heuristics.ios.concurrency.async-without-await.ast', code: 'HEURISTICS_IOS_CONCURRENCY_ASYNC_WITHOUT_AWAIT_AST', message: 'AST heuristic detected a private async function without await; remove async unless a protocol/override boundary requires it.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftEmptyCatchUsage, ruleId: 'heuristics.ios.error.empty-catch.ast', code: 'HEURISTICS_IOS_ERROR_EMPTY_CATCH_AST', message: 'AST heuristic detected an empty Swift catch block; handle, log, or propagate the error.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNSErrorThrowUsage, locateLines: TextIOS.collectSwiftNSErrorThrowLines, primaryNode: (lines) => ({ kind: 'call', name: 'throw NSError(...)', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: typed Swift Error enum case', lines }], why: 'NSError throws bypass the typed Swift error boundary that should model network, domain or infrastructure failures explicitly.', impact: 'Callers receive an untyped Foundation error instead of a remediable enum case, making recovery, tests and user-facing handling less deterministic.', expected_fix: 'Define a domain-specific Error enum such as NetworkError or AppError and throw typed cases instead of constructing NSError directly.', ruleId: 'heuristics.ios.error.nserror-throw.ast', code: 'HEURISTICS_IOS_ERROR_NSERROR_THROW_AST', message: 'AST heuristic detected throw NSError(...) in iOS production code; use typed Swift Error enums such as NetworkError or AppError.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftOnAppearTaskUsage, locateLines: TextIOS.collectSwiftOnAppearTaskLines, primaryNode: (lines) => ({ kind: 'call', name: 'Task launched inside SwiftUI onAppear', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: .task { ... } on the view', lines }], why: 'A Task launched from onAppear is not owned by the SwiftUI view lifecycle in the same way as .task.', impact: 'Async work can outlive view disappearance or require manual cancellation, and the gate must point to the exact Task line instead of blocking the whole file.', expected_fix: 'Move the async work from .onAppear { Task { ... } } into .task { ... } so SwiftUI owns automatic cancellation. Keep onAppear only for synchronous side effects such as analytics.', ruleId: 'heuristics.ios.swiftui.onappear-task.ast', code: 'HEURISTICS_IOS_SWIFTUI_ONAPPEAR_TASK_AST', message: 'AST heuristic detected Task launched from SwiftUI onAppear; .task/.task(id:) provides lifecycle-aware cancellation.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftOnChangeTaskUsage, locateLines: TextIOS.collectSwiftOnChangeTaskLines, primaryNode: (lines) => ({ kind: 'call', name: 'Task launched inside SwiftUI onChange', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: .task(id:) for value-dependent async work', lines }], why: 'A Task launched from onChange makes value-dependent async work manual instead of tying cancellation to the changing value.', impact: 'Search, load or refresh work can race after state changes because cancellation is not expressed through SwiftUI .task(id:).', expected_fix: 'Move value-dependent async work from .onChange { Task { ... } } into .task(id: value) { ... }. Keep onChange only for synchronous derivations or analytics.', ruleId: 'heuristics.ios.swiftui.onchange-task.ast', code: 'HEURISTICS_IOS_SWIFTUI_ONCHANGE_TASK_AST', message: 'AST heuristic detected Task launched from SwiftUI onChange; .task(id:) provides lifecycle-aware cancellation for value-dependent async work.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftOnChangeReadonlyVarUsage, locateLines: TextIOS.collectSwiftOnChangeReadonlyVarLines, primaryNode: (lines) => ({ kind: 'property', name: 'var declared inside SwiftUI onChange closure', lines }), relatedNodes: (lines) => [{ kind: 'property', name: 'replacement: let for read-only derived value inside onChange', lines }], why: 'A local var inside onChange hides whether the closure is deriving a read-only value or mutating state as part of a reactive update.', impact: 'Reactive closures become harder to audit because unnecessary mutability can mask accidental state changes and value-dependent side effects.', expected_fix: 'Use let for read-only derived values inside onChange. Keep var only when the local value is intentionally mutated and extract complex mutation out of the view closure.', ruleId: 'heuristics.ios.swiftui.onchange-readonly-var.ast', code: 'HEURISTICS_IOS_SWIFTUI_ONCHANGE_READONLY_VAR_AST', message: 'AST heuristic detected local var inside SwiftUI onChange; prefer let for read-only derived values.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftStrongDelegateReferenceUsage, ruleId: 'heuristics.ios.memory.strong-delegate.ast', code: 'HEURISTICS_IOS_MEMORY_STRONG_DELEGATE_AST', message: 'AST heuristic detected a strong delegate/dataSource reference; weak delegates remain the preferred baseline to avoid retain cycles.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftStrongSelfEscapingClosureUsage, ruleId: 'heuristics.ios.memory.strong-self-escaping-closure.ast', code: 'HEURISTICS_IOS_MEMORY_STRONG_SELF_ESCAPING_CLOSURE_AST', message: 'AST heuristic detected strong self capture in an escaping iOS closure; weak or unowned captures remain the preferred baseline when ownership is not explicit.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUnownedSelfCaptureUsage, ruleId: 'heuristics.ios.memory.unowned-self-capture.ast', code: 'HEURISTICS_IOS_MEMORY_UNOWNED_SELF_CAPTURE_AST', message: 'AST heuristic detected unowned capture in an iOS closure; use weak capture unless lifetime is explicitly guaranteed.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftManualMemoryManagementUsage, locateLines: TextIOS.collectSwiftManualMemoryManagementLines, primaryNode: (lines) => ({ kind: 'call', name: 'manual ARC bypass / Core Foundation retain-release', lines }), relatedNodes: (lines) => [{ kind: 'class', name: 'replacement: ARC-owned Swift object lifetime', lines }], why: 'Manual Unmanaged or Core Foundation retain/release bypasses normal Swift ARC ownership and needs an explicit bridge boundary.', impact: 'Manual memory ownership can leak or over-release objects, and without line evidence the gate cannot identify the unsafe bridge call.', expected_fix: 'Prefer ARC-owned Swift references. If a Core Foundation bridge is unavoidable, isolate it in infrastructure with documented ownership invariants and typed wrappers.', ruleId: 'heuristics.ios.memory.manual-management.ast', code: 'HEURISTICS_IOS_MEMORY_MANUAL_MANAGEMENT_AST', message: 'AST heuristic detected manual memory management that bypasses Swift ARC.' },
  { platform: 'ios', pathCheck: isSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftDirectSUTInstantiationWithoutMakeSUTUsage, locateLines: TextIOS.collectSwiftDirectSUTInstantiationWithoutMakeSUTLines, primaryNode: (lines) => ({ kind: 'call', name: 'direct let sut = Type(...) instantiation', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: makeSUT() factory', lines }], why: 'iOS tests that instantiate the SUT inline duplicate setup and bypass the repository makeSUT factory contract.', impact: 'Test setup drifts across methods, memory tracking and dependency wiring become inconsistent, and later brownfield quality checks cannot rely on a single factory boundary.', expected_fix: 'Move direct SUT construction into a private makeSUT() helper and let test methods call let sut = makeSUT(). Add trackForMemoryLeaks(sut) inside the factory when the repository memory contract requires it.', ruleId: 'heuristics.ios.testing.direct-sut-instantiation-without-makesut.ast', code: 'HEURISTICS_IOS_TESTING_DIRECT_SUT_INSTANTIATION_WITHOUT_MAKESUT_AST', message: 'AST heuristic detected direct SUT instantiation in an iOS test without makeSUT().' },
  { platform: 'ios', pathCheck: isSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftMakeSUTWithoutMemoryTrackingUsage, locateLines: TextIOS.collectSwiftMakeSUTWithoutMemoryTrackingLines, primaryNode: (lines) => ({ kind: 'call', name: 'makeSUT() without trackForMemoryLeaks', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: trackForMemoryLeaks(sut)', lines }], why: 'A repository-specific XCTest quality contract that uses makeSUT must also register created SUT instances for memory-leak tracking.', impact: 'Tests can keep passing while leaked view models, views or controllers are introduced, weakening the brownfield XCTest quality baseline that Pumuki relies on.', expected_fix: 'Inside makeSUT(), assign the SUT to a local value, call trackForMemoryLeaks(sut), and then return the SUT. Preserve repository-specific makeSUT and memory tracking helpers when they are mandatory.', ruleId: 'heuristics.ios.testing.makesut-without-memory-tracking.ast', code: 'HEURISTICS_IOS_TESTING_MAKESUT_WITHOUT_MEMORY_TRACKING_AST', message: 'AST heuristic detected makeSUT() in an iOS test without trackForMemoryLeaks(sut).' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNestedIfPyramidUsage, ruleId: 'heuristics.ios.maintainability.nested-if-pyramid.ast', code: 'HEURISTICS_IOS_MAINTAINABILITY_NESTED_IF_PYRAMID_AST', message: 'AST heuristic detected nested if pyramid in iOS code; prefer guard clauses and early returns.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftProductionCommentUsage, ruleId: 'heuristics.ios.maintainability.comment-trivia.ast', code: 'HEURISTICS_IOS_MAINTAINABILITY_COMMENT_TRIVIA_AST', message: 'AST heuristic detected source comments in iOS production code; prefer self-documenting names and extracted concepts.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftWarningSuppressionUsage, locateLines: TextIOS.collectSwiftWarningSuppressionLines, primaryNode: (lines) => ({ kind: 'member', name: 'Swift warning or lint suppression directive', lines }), relatedNodes: (lines) => [{ kind: 'member', name: 'replacement: fix the warned code or configure the exception centrally', lines }], why: 'Local warning and lint suppressions hide code-quality failures from the normal compiler/tooling feedback loop.', impact: 'Suppressed diagnostics can turn into future errors or let unsafe production code bypass Pumuki and repository skills without a visible remediation path.', expected_fix: 'Remove local swiftlint/swiftformat/periphery disable directives and #warning markers by fixing the underlying code, or move a justified project-wide exception into policy/config with traceability.', ruleId: 'heuristics.ios.maintainability.warning-suppression.ast', code: 'HEURISTICS_IOS_MAINTAINABILITY_WARNING_SUPPRESSION_AST', message: 'AST heuristic detected local warning/lint suppression in iOS production code; fix the underlying issue instead of hiding diagnostics.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftCustomSingletonUsage, ruleId: 'heuristics.ios.architecture.custom-singleton.ast', code: 'HEURISTICS_IOS_ARCHITECTURE_CUSTOM_SINGLETON_AST', message: 'AST heuristic detected a custom static shared singleton in iOS production code; dependency injection remains the preferred baseline for app-owned services.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftSwinjectUsage, ruleId: 'heuristics.ios.architecture.swinject.ast', code: 'HEURISTICS_IOS_ARCHITECTURE_SWINJECT_AST', message: 'AST heuristic detected Swinject usage; manual dependency injection or SwiftUI Environment remain the preferred native baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftComposableArchitectureUsage, locateLines: TextIOS.collectSwiftComposableArchitectureUsageLines, primaryNode: (lines) => ({ kind: 'call', name: 'Composable Architecture dependency node', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: native SwiftUI state, use case, actor or environment boundary', lines }], why: 'The iOS skill baseline prefers native SwiftUI, structured concurrency and explicit architecture boundaries over third-party TCA runtime primitives.', impact: 'TCA imports and Store/Reducer nodes introduce a non-native dependency model that can bypass the repository architecture contract and make remediation depend on framework-specific DSL semantics.', expected_fix: 'Replace ComposableArchitecture usage with native SwiftUI state, @Observable view models, use cases, actors and explicit Environment/dependency boundaries approved by the repo.', ruleId: 'heuristics.ios.architecture.tca-composable-architecture.ast', code: 'HEURISTICS_IOS_ARCHITECTURE_TCA_COMPOSABLE_ARCHITECTURE_AST', message: 'AST heuristic detected The Composable Architecture usage in iOS production code; use native SwiftUI and explicit architecture boundaries.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftMassiveViewControllerResponsibilityUsage, ruleId: 'heuristics.ios.architecture.massive-view-controller.ast', code: 'HEURISTICS_IOS_ARCHITECTURE_MASSIVE_VIEW_CONTROLLER_AST', message: 'AST heuristic detected a UIViewController with direct infrastructure/data access; move data access behind application/domain boundaries.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNonIBOutletImplicitlyUnwrappedOptionalUsage, ruleId: 'heuristics.ios.safety.non-iboutlet-iuo.ast', code: 'HEURISTICS_IOS_SAFETY_NON_IBOUTLET_IUO_AST', message: 'AST heuristic detected an implicitly unwrapped optional outside IBOutlet wiring; explicit optionals or initialization guarantees remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftMagicNumberLayoutUsage, locateLines: TextIOS.collectSwiftMagicNumberLayoutLines, primaryNode: (lines) => ({ kind: 'call', name: 'SwiftUI layout numeric literal', lines }), relatedNodes: (lines) => [{ kind: 'property', name: 'replacement: named metric constant or design token', lines }], why: 'Inline numeric layout literals hide design intent and make visual remediation dependent on scanning the whole view body.', impact: 'Pixel-perfect slices can be blocked without a concrete node unless the finding points to the exact spacing, frame or padding call to fix.', expected_fix: 'Move repeated or meaningful layout numbers into named constants or design tokens, or use relative layout APIs when the number encodes screen geometry.', ruleId: 'heuristics.ios.maintainability.magic-number-layout.ast', code: 'HEURISTICS_IOS_MAINTAINABILITY_MAGIC_NUMBER_LAYOUT_AST', message: 'AST heuristic detected SwiftUI layout magic numbers; named constants or design tokens remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUIKitManualFrameLayoutUsage, locateLines: TextIOS.collectSwiftUIKitManualFrameLayoutLines, primaryNode: (lines) => ({ kind: 'call', name: 'UIKit manual frame CGRect layout', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: Auto Layout constraints or SwiftUI relative layout', lines }], why: 'Manual UIKit frames hard-code geometry instead of using Auto Layout constraints or SwiftUI relative layout, so the layout cannot adapt reliably to devices, Dynamic Type or localization.', impact: 'Pixel-perfect work can regress across screens because fixed CGRect values bypass constraint solving and produce file-level ambiguity unless the exact frame node is reported.', expected_fix: 'Replace UIView(frame: CGRect(...)) and .frame = CGRect(...) layout with Auto Layout anchors/NSLayoutConstraint, UIStackView constraints, or SwiftUI relative layout where the screen is SwiftUI-first.', ruleId: 'heuristics.ios.uikit.manual-frame-layout.ast', code: 'HEURISTICS_IOS_UIKIT_MANUAL_FRAME_LAYOUT_AST', message: 'AST heuristic detected UIKit manual frame layout; use Auto Layout constraints or SwiftUI relative layout.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftAdHocLoggingUsage, ruleId: 'heuristics.ios.logging.adhoc-print.ast', code: 'HEURISTICS_IOS_LOGGING_ADHOC_PRINT_AST', message: 'AST heuristic detected print/debugPrint/dump/NSLog/os_log usage in iOS production code.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftSensitiveLoggingUsage, ruleId: 'heuristics.ios.logging.sensitive-data.ast', code: 'HEURISTICS_IOS_LOGGING_SENSITIVE_DATA_AST', message: 'AST heuristic detected sensitive data in an iOS logging call.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftHardcodedSensitiveStringUsage, locateLines: TextIOS.collectSwiftHardcodedSensitiveStringLines, primaryNode: (lines) => ({ kind: 'property', name: 'hardcoded sensitive Swift string', lines }), relatedNodes: (lines) => [{ kind: 'property', name: 'replacement: Keychain, secure config or environment-specific secret source', lines }], why: 'Sensitive strings assigned directly to token/password/secret properties create static production secrets and cannot be rotated safely.', impact: 'Credentials or identifiers can leak through source, binaries, logs or screenshots and block release until the concrete assignment is removed.', expected_fix: 'Read sensitive values from Keychain, secure configuration, injected environment or a repository-approved secret provider. Keep user-facing copy in localization assets, not sensitive variables.', ruleId: 'heuristics.ios.security.hardcoded-sensitive-string.ast', code: 'HEURISTICS_IOS_SECURITY_HARDCODED_SENSITIVE_STRING_AST', message: 'AST heuristic detected hardcoded sensitive Swift string; Keychain, secure config or environment-specific secrets remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUnlocalizedDateFormatterUsage, ruleId: 'heuristics.ios.localization.unlocalized-dateformatter.ast', code: 'HEURISTICS_IOS_LOCALIZATION_UNLOCALIZED_DATEFORMATTER_AST', message: 'AST heuristic detected DateFormatter dateFormat usage without an explicit locale.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftAlamofireUsage, ruleId: 'heuristics.ios.networking.alamofire.ast', code: 'HEURISTICS_IOS_NETWORKING_ALAMOFIRE_AST', message: 'AST heuristic detected Alamofire usage in iOS production code; URLSession remains the preferred baseline for new code.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftJSONSerializationUsage, ruleId: 'heuristics.ios.json.jsonserialization.ast', code: 'HEURISTICS_IOS_JSON_JSONSERIALIZATION_AST', message: 'AST heuristic detected JSONSerialization usage in iOS production code; Codable remains the preferred baseline for new code.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftSensitiveUserDefaultsStorageUsage, ruleId: 'heuristics.ios.security.userdefaults-sensitive-data.ast', code: 'HEURISTICS_IOS_SECURITY_USERDEFAULTS_SENSITIVE_DATA_AST', message: 'AST heuristic detected sensitive data stored in UserDefaults/AppStorage; native Keychain remains the preferred baseline for secrets.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftInsecureTransportUsage, ruleId: 'heuristics.ios.security.insecure-transport.ast', code: 'HEURISTICS_IOS_SECURITY_INSECURE_TRANSPORT_AST', message: 'AST heuristic detected insecure HTTP transport in iOS production code; HTTPS and ATS remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSInfoPlistPath, excludePaths: [], detect: TextIOS.hasSwiftInsecureTransportUsage, ruleId: 'heuristics.ios.security.insecure-transport.ast', code: 'HEURISTICS_IOS_SECURITY_INSECURE_TRANSPORT_AST', message: 'AST heuristic detected permissive App Transport Security configuration; HTTPS and ATS remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSLocalizableStringsPath, excludePaths: [], detect: detectsTrackedFilePresence, ruleId: 'heuristics.ios.localization.localizable-strings.ast', code: 'HEURISTICS_IOS_LOCALIZATION_LOCALIZABLE_STRINGS_AST', message: 'AST heuristic detected Localizable.strings usage; String Catalogs (.xcstrings) remain the preferred baseline for new localization work.' },
  { platform: 'ios', pathCheck: isIOSInterfaceBuilderPath, excludePaths: [], detect: detectsTrackedFilePresence, ruleId: 'heuristics.ios.interface-builder.storyboard-xib.ast', code: 'HEURISTICS_IOS_INTERFACE_BUILDER_STORYBOARD_XIB_AST', message: 'AST heuristic detected Storyboard/XIB usage; programmatic SwiftUI/UIKit UI remains the preferred baseline for versionable iOS code.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftHardcodedUiStringUsage, locateLines: TextIOS.collectSwiftHardcodedUiStringLines, primaryNode: (lines) => ({ kind: 'property', name: 'hardcoded user-facing SwiftUI string', lines }), relatedNodes: (lines) => [{ kind: 'property', name: 'replacement: String Catalog key or String(localized:)', lines }], why: 'User-facing literals in SwiftUI code bypass String Catalogs and make localization drift invisible.', impact: 'A consumer slice can be blocked without knowing which text literal must move to localization assets.', expected_fix: 'Move visible copy to String Catalogs or use repository-approved localized string keys; keep only localization keys in SwiftUI code.', ruleId: 'heuristics.ios.localization.hardcoded-ui-string.ast', code: 'HEURISTICS_IOS_LOCALIZATION_HARDCODED_UI_STRING_AST', message: 'AST heuristic detected hardcoded user-facing SwiftUI text; String(localized:) and String Catalogs remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftLooseAssetResourceUsage, ruleId: 'heuristics.ios.assets.loose-resource.ast', code: 'HEURISTICS_IOS_ASSETS_LOOSE_RESOURCE_AST', message: 'AST heuristic detected loose image resource loading in iOS production code; Asset Catalogs remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftFixedFontSizeUsage, locateLines: TextIOS.collectSwiftFixedFontSizeLines, primaryNode: (lines) => ({ kind: 'call', name: 'fixed font size API', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: Dynamic Type semantic text style or scaled metric', lines }], why: 'Fixed font sizes bypass Dynamic Type unless explicitly scaled through the text system.', impact: 'Accessibility regressions become hard to remediate if the gate reports only the file instead of the exact font call.', expected_fix: 'Use semantic SwiftUI text styles such as .headline/.body, Font.TextStyle, or UIFontMetrics/scaled metrics when a custom size is required.', ruleId: 'heuristics.ios.accessibility.fixed-font-size.ast', code: 'HEURISTICS_IOS_ACCESSIBILITY_FIXED_FONT_SIZE_AST', message: 'AST heuristic detected fixed font sizing in iOS production code; Dynamic Type semantic text styles remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftPhysicalTextAlignmentUsage, ruleId: 'heuristics.ios.localization.physical-text-alignment.ast', code: 'HEURISTICS_IOS_LOCALIZATION_PHYSICAL_TEXT_ALIGNMENT_AST', message: 'AST heuristic detected physical left/right text alignment in iOS production code; leading/trailing remain the preferred RTL-safe baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftMainThreadBlockingSleepUsage, ruleId: 'heuristics.ios.performance.blocking-sleep.ast', code: 'HEURISTICS_IOS_PERFORMANCE_BLOCKING_SLEEP_AST', message: 'AST heuristic detected blocking sleep usage in iOS production code; async clocks, suspension or cancellable scheduling remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftIconOnlyControlWithoutAccessibilityLabelUsage, locateLines: TextIOS.collectSwiftIconOnlyControlWithoutAccessibilityLabelLines, primaryNode: (lines) => ({ kind: 'call', name: 'icon-only SwiftUI control', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: add accessibilityLabel to the control', lines }], why: 'Icon-only controls have no accessible name unless the label is supplied explicitly.', impact: 'VoiceOver and UI automation users cannot identify or operate the control reliably when the gate reports only the file.', expected_fix: 'Add .accessibilityLabel(...) to the icon-only control or replace the control with a visible text label.', ruleId: 'heuristics.ios.accessibility.icon-only-control-label.ast', code: 'HEURISTICS_IOS_ACCESSIBILITY_ICON_ONLY_CONTROL_LABEL_AST', message: 'AST heuristic detected an icon-only SwiftUI control without accessibilityLabel; explicit accessible labels remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftInteractiveControlWithoutAccessibilityIdentifierUsage, locateLines: TextIOS.collectSwiftInteractiveControlWithoutAccessibilityIdentifierLines, ruleId: 'heuristics.ios.accessibility.missing-accessibility-identifier.ast', code: 'HEURISTICS_IOS_ACCESSIBILITY_MISSING_ACCESSIBILITY_IDENTIFIER_AST', message: 'AST heuristic detected an interactive SwiftUI control without accessibilityIdentifier; stable identifiers are required for UI automation and traceability.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftBindableMissingForObservableBindingUsage, locateLines: TextIOS.collectSwiftBindableMissingForObservableBindingUsageLines, ruleId: 'heuristics.ios.swiftui.missing-bindable-observable-binding.ast', code: 'HEURISTICS_IOS_SWIFTUI_MISSING_BINDABLE_OBSERVABLE_BINDING_AST', message: 'AST heuristic detected an injected @Observable used as a binding without @Bindable.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUncheckedSendableUsage, ruleId: 'heuristics.ios.unchecked-sendable.ast', code: 'HEURISTICS_IOS_UNCHECKED_SENDABLE_AST', message: 'AST heuristic detected @unchecked Sendable usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftPreconcurrencyUsage, ruleId: 'heuristics.ios.preconcurrency.ast', code: 'HEURISTICS_IOS_PRECONCURRENCY_AST', message: 'AST heuristic detected @preconcurrency usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNonisolatedUnsafeUsage, ruleId: 'heuristics.ios.nonisolated-unsafe.ast', code: 'HEURISTICS_IOS_NONISOLATED_UNSAFE_AST', message: 'AST heuristic detected nonisolated(unsafe) usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftAssumeIsolatedUsage, ruleId: 'heuristics.ios.assume-isolated.ast', code: 'HEURISTICS_IOS_ASSUME_ISOLATED_AST', message: 'AST heuristic detected assumeIsolated usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftObservableObjectUsage, ruleId: 'heuristics.ios.observable-object.ast', code: 'HEURISTICS_IOS_OBSERVABLE_OBJECT_AST', message: 'AST heuristic detected ObservableObject usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftLegacyPreviewProviderUsage, ruleId: 'heuristics.ios.swiftui.legacy-preview-provider.ast', code: 'HEURISTICS_IOS_SWIFTUI_LEGACY_PREVIEW_PROVIDER_AST', message: 'AST heuristic detected PreviewProvider usage; use #Preview macros for modern SwiftUI previews.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftLegacySwiftUiObservableWrapperUsage, ruleId: 'heuristics.ios.legacy-swiftui-observable-wrapper.ast', code: 'HEURISTICS_IOS_LEGACY_SWIFTUI_OBSERVABLE_WRAPPER_AST', message: 'AST heuristic detected @StateObject/@ObservedObject usage in a modern SwiftUI path.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftEnvironmentObjectUsage, locateLines: TextIOS.collectSwiftEnvironmentObjectLines, ruleId: 'heuristics.ios.swiftui.environment-object.ast', code: 'HEURISTICS_IOS_SWIFTUI_ENVIRONMENT_OBJECT_AST', message: 'AST heuristic detected @EnvironmentObject in SwiftUI presentation code; use explicit dependencies or narrowly scoped Environment values unless the object is truly global and stable.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [], detect: TextIOS.hasSwiftTestDoubleWithoutProtocolConformanceUsage, ruleId: 'heuristics.ios.testing.test-double-without-protocol.ast', code: 'HEURISTICS_IOS_TESTING_TEST_DOUBLE_WITHOUT_PROTOCOL_AST', message: 'AST heuristic detected a Swift test double class without protocol conformance.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftLowContrastStaticColorPairUsage, ruleId: 'heuristics.ios.accessibility.low-contrast-static-color-pair.ast', code: 'HEURISTICS_IOS_ACCESSIBILITY_LOW_CONTRAST_STATIC_COLOR_PAIR_AST', message: 'AST heuristic detected a static SwiftUI foreground/background color pair with insufficient contrast.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNonPrivateStateOwnershipUsage, ruleId: 'heuristics.ios.swiftui.non-private-state-ownership.ast', code: 'HEURISTICS_IOS_SWIFTUI_NON_PRIVATE_STATE_OWNERSHIP_AST', message: 'AST heuristic detected @State/@StateObject without private visibility; SwiftUI owned state should be private.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftPassedValueStateWrapperUsage, ruleId: 'heuristics.ios.passed-value-state-wrapper.ast', code: 'HEURISTICS_IOS_PASSED_VALUE_STATE_WRAPPER_AST', message: 'AST heuristic detected a passed value stored as @State/@StateObject via init wrapper ownership.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftForEachIndicesUsage, locateLines: TextIOS.collectSwiftForEachIndicesLines, primaryNode: (lines) => ({ kind: 'call', name: 'ForEach over collection indices', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: ForEach over Identifiable elements or stable ids', lines }], why: 'Iterating indices couples SwiftUI identity to collection position instead of the domain element.', impact: 'Insertions, filtering or reordering can produce unstable view identity and confusing diffing behavior.', expected_fix: 'Iterate elements that conform to Identifiable, or pass an explicit stable id such as id: \\.id.', ruleId: 'heuristics.ios.foreach-indices.ast', code: 'HEURISTICS_IOS_FOREACH_INDICES_AST', message: 'AST heuristic detected ForEach(...indices...) usage where stable element identity may be preferred.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftForEachSelfIdentityUsage, locateLines: TextIOS.collectSwiftForEachSelfIdentityLines, primaryNode: (lines) => ({ kind: 'call', name: 'ForEach using id: \\.self', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: stable domain id or Identifiable model', lines }], why: 'id: \\.self is only stable when the value is immutable and uniquely identifies the domain entity.', impact: 'Lists can animate or update incorrectly when value identity changes with presentation data.', expected_fix: 'Use Identifiable models or an explicit stable domain identifier such as id: \\.id.', ruleId: 'heuristics.ios.swiftui.foreach-self-identity.ast', code: 'HEURISTICS_IOS_SWIFTUI_FOREACH_SELF_IDENTITY_AST', message: 'AST heuristic detected ForEach(..., id: \\.self) usage; prefer a stable domain identity such as id: \\.id or Identifiable models.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftSelfPrintChangesUsage, ruleId: 'heuristics.ios.swiftui.self-print-changes.ast', code: 'HEURISTICS_IOS_SWIFTUI_SELF_PRINT_CHANGES_AST', message: 'AST heuristic detected Self._printChanges() in SwiftUI presentation; keep this debugging helper out of production view code.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftInlineForEachTransformUsage, locateLines: TextIOS.collectSwiftInlineForEachTransformLines, primaryNode: (lines) => ({ kind: 'call', name: 'ForEach with inline collection transform', lines }), relatedNodes: (lines) => [{ kind: 'property', name: 'replacement: precomputed/cached collection', lines }], why: 'Inline filtering, mapping or sorting inside ForEach repeats work in the render path and obscures list identity.', impact: 'SwiftUI list updates become harder to reason about and performance can degrade under recomposition.', expected_fix: 'Move the transformed collection to a named computed value, view model output or cached state before passing it to ForEach.', ruleId: 'heuristics.ios.swiftui.inline-foreach-transform.ast', code: 'HEURISTICS_IOS_SWIFTUI_INLINE_FOREACH_TRANSFORM_AST', message: 'AST heuristic detected inline filter/map/sort work inside ForEach; prefiltered or cached collections remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUiForEachConditionalViewCountUsage, locateLines: TextIOS.collectSwiftUiForEachConditionalViewCountLines, primaryNode: (lines) => ({ kind: 'call', name: 'ForEach row with conditional view count', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: row view with stable structure or conditional modifiers', lines }], why: 'Changing the number of views emitted by each ForEach element can destabilize SwiftUI diffing.', impact: 'Rows can lose identity or produce unexpected animations when conditions toggle.', expected_fix: 'Move branching into a dedicated row view or prefer conditional modifiers/values that keep a stable view structure per element.', ruleId: 'heuristics.ios.swiftui.foreach-conditional-view-count.ast', code: 'HEURISTICS_IOS_SWIFTUI_FOREACH_CONDITIONAL_VIEW_COUNT_AST', message: 'AST heuristic detected conditional view count inside ForEach; keep a constant number of views per element by moving branching into row views or modifiers.' },
  { platform: 'ios', pathCheck: isIOSApplicationOrPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftContainsUserFilterUsage, ruleId: 'heuristics.ios.contains-user-filter.ast', code: 'HEURISTICS_IOS_CONTAINS_USER_FILTER_AST', message: 'AST heuristic detected contains() in a user-facing filter where localizedStandardContains() may be preferred.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftGeometryReaderUsage, ruleId: 'heuristics.ios.geometryreader.ast', code: 'HEURISTICS_IOS_GEOMETRYREADER_AST', message: 'AST heuristic detected GeometryReader usage that may be replaceable with modern layout APIs.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftFontWeightBoldUsage, ruleId: 'heuristics.ios.font-weight-bold.ast', code: 'HEURISTICS_IOS_FONT_WEIGHT_BOLD_AST', message: 'AST heuristic detected fontWeight(.bold) usage where bold() may be preferred.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftExplicitColorStaticMemberUsage, locateLines: TextIOS.collectSwiftExplicitColorStaticMemberLines, primaryNode: (lines) => ({ kind: 'member', name: 'explicit Color.* static member', lines }), relatedNodes: (lines) => [{ kind: 'member', name: 'replacement: SwiftUI static member lookup .colorName', lines }], why: 'Explicit Color.* in SwiftUI view modifiers is noisier than static member lookup and can hide style token drift in presentation code.', impact: 'The fix is local and mechanical, but without line evidence the user sees a whole-file block instead of the exact member access.', expected_fix: 'Replace Color.blue/Color.primary/etc. with .blue/.primary in SwiftUI style contexts, or use named asset colors such as Color("BrandPrimary") when design tokens are required.', ruleId: 'heuristics.ios.swiftui.explicit-color-static-member.ast', code: 'HEURISTICS_IOS_SWIFTUI_EXPLICIT_COLOR_STATIC_MEMBER_AST', message: 'AST heuristic detected Color.* static member usage where SwiftUI static member lookup may be preferred.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftClosureBasedViewBuilderContentUsage, ruleId: 'heuristics.ios.swiftui.closure-based-viewbuilder-content.ast', code: 'HEURISTICS_IOS_SWIFTUI_CLOSURE_BASED_VIEWBUILDER_CONTENT_AST', message: 'AST heuristic detected closure-based content storage; @ViewBuilder let content: Content remains the preferred SwiftUI container baseline.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftLargeConfigContextViewPropertyUsage, ruleId: 'heuristics.ios.swiftui.large-config-context-prop.ast', code: 'HEURISTICS_IOS_SWIFTUI_LARGE_CONFIG_CONTEXT_PROP_AST', message: 'AST heuristic detected a SwiftUI View storing a broad config/context object; pass only needed values to reduce update fan-out.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUiConditionalSameViewIdentityUsage, locateLines: TextIOS.collectSwiftUiConditionalSameViewIdentityLines, primaryNode: (lines) => ({ kind: 'call', name: 'conditional branches rebuilding same SwiftUI view type', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: conditional modifier or conditional value', lines }], why: 'Rebuilding the same view type in if/else branches hides a state change that should be a modifier or value.', impact: 'SwiftUI identity can churn unnecessarily and block pixel-perfect slices without pointing to the conditional branch.', expected_fix: 'Keep one view instance and move the condition into modifiers, parameters or extracted stable row state.', ruleId: 'heuristics.ios.swiftui.conditional-same-view-identity.ast', code: 'HEURISTICS_IOS_SWIFTUI_CONDITIONAL_SAME_VIEW_IDENTITY_AST', message: 'AST heuristic detected conditional branches rebuilding the same SwiftUI View type; prefer conditional modifiers or values to preserve view identity.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUiParentOwnedSheetActionUsage, ruleId: 'heuristics.ios.swiftui.parent-owned-sheet-action.ast', code: 'HEURISTICS_IOS_SWIFTUI_PARENT_OWNED_SHEET_ACTION_AST', message: 'AST heuristic detected a SwiftUI sheet receiving parent-owned action callbacks; sheets should own save/cancel actions and call dismiss() internally.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftRedundantReactiveStateAssignmentUsage, ruleId: 'heuristics.ios.swiftui.redundant-reactive-state-assignment.ast', code: 'HEURISTICS_IOS_SWIFTUI_REDUNDANT_REACTIVE_STATE_ASSIGNMENT_AST', message: 'AST heuristic detected reactive state assignment without a value-change guard; check for value changes before assigning state in hot paths.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNonLazyScrollForEachUsage, locateLines: TextIOS.collectSwiftNonLazyScrollForEachLines, primaryNode: (lines) => ({ kind: 'call', name: 'ScrollView non-lazy stack with ForEach', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: LazyVStack or LazyHStack', lines }], why: 'A non-lazy stack inside ScrollView renders all rows eagerly instead of virtualizing collection content.', impact: 'Large lists can degrade performance and the gate must point to the ScrollView/ForEach pair, not the whole file.', expected_fix: 'Replace VStack/HStack under ScrollView with LazyVStack/LazyHStack when rendering collection rows.', ruleId: 'heuristics.ios.swiftui.non-lazy-scroll-foreach.ast', code: 'HEURISTICS_IOS_SWIFTUI_NON_LAZY_SCROLL_FOREACH_AST', message: 'AST heuristic detected ScrollView with a non-lazy stack feeding ForEach; LazyVStack/LazyHStack remain the preferred baseline for large scrollable collections.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftViewBodyObjectCreationUsage, ruleId: 'heuristics.ios.swiftui.body-object-creation.ast', code: 'HEURISTICS_IOS_SWIFTUI_BODY_OBJECT_CREATION_AST', message: 'AST heuristic detected formatter object creation inside SwiftUI body; keep body simple and move expensive objects out of render paths.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUiImageDataDecodingUsage, ruleId: 'heuristics.ios.swiftui.image-data-decoding.ast', code: 'HEURISTICS_IOS_SWIFTUI_IMAGE_DATA_DECODING_AST', message: 'AST heuristic detected UIImage(data:) in SwiftUI presentation; downsample image data before rendering large images.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUiManualRenderingWithoutImageRendererUsage, locateLines: TextIOS.collectSwiftUiManualRenderingWithoutImageRendererLines, primaryNode: (lines) => ({ kind: 'call', name: 'manual SwiftUI view rendering via UIHostingController', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: ImageRenderer(content:)', lines }], why: 'Manual UIHostingController plus UIGraphicsImageRenderer rendering snapshots SwiftUI imperatively instead of using the native ImageRenderer API.', impact: 'Rendering code becomes UIKit-bound, harder to test, and can drift from SwiftUI rendering semantics while the gate cannot point to the exact rendering node.', expected_fix: 'Replace manual UIHostingController/UIGraphicsImageRenderer/drawHierarchy rendering with ImageRenderer(content:) and read uiImage/cgImage from that renderer.', ruleId: 'heuristics.ios.swiftui.manual-rendering-without-imagerenderer.ast', code: 'HEURISTICS_IOS_SWIFTUI_MANUAL_RENDERING_WITHOUT_IMAGERENDERER_AST', message: 'AST heuristic detected manual SwiftUI view rendering without ImageRenderer.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftLargeViewBuilderFunctionUsage, locateLines: TextIOS.collectSwiftLargeViewBuilderFunctionLines, primaryNode: (lines) => ({ kind: 'call', name: 'large @ViewBuilder helper function', lines }), relatedNodes: (lines) => [{ kind: 'class', name: 'replacement: extracted SwiftUI subview', lines }], why: '@ViewBuilder helper functions are intended for small sections; large builders hide view structure inside a function body instead of explicit subviews.', impact: 'Large helper builders become hard to review, diff and test, and whole-file blocks are likely when the gate lacks the exact function node.', expected_fix: 'Extract the large @ViewBuilder function into one or more named SwiftUI subviews or reduce the helper to a small focused section.', ruleId: 'heuristics.ios.swiftui.large-viewbuilder-function.ast', code: 'HEURISTICS_IOS_SWIFTUI_LARGE_VIEWBUILDER_FUNCTION_AST', message: 'AST heuristic detected a large @ViewBuilder helper function; keep @ViewBuilder functions small and extract complex sections into subviews.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftAnimationWithoutReduceMotionUsage, locateLines: TextIOS.collectSwiftAnimationWithoutReduceMotionLines, primaryNode: (lines) => ({ kind: 'call', name: 'SwiftUI animation without reduce motion guard', lines }), relatedNodes: (lines) => [{ kind: 'property', name: 'replacement: accessibilityReduceMotion / UIAccessibility.isReduceMotionEnabled', lines }], why: 'SwiftUI animations must respect the system reduce motion preference.', impact: 'Users who reduce motion can still receive animated transitions, making the UI less accessible.', expected_fix: 'Read @Environment(\\.accessibilityReduceMotion) or UIAccessibility.isReduceMotionEnabled and disable or replace animations when reduce motion is enabled.', ruleId: 'heuristics.ios.accessibility.animation-without-reduce-motion.ast', code: 'HEURISTICS_IOS_ACCESSIBILITY_ANIMATION_WITHOUT_REDUCE_MOTION_AST', message: 'AST heuristic detected SwiftUI animation without reduce motion handling.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUiInlineActionLogicUsage, locateLines: TextIOS.collectSwiftUiInlineActionLogicLines, primaryNode: (lines) => ({ kind: 'call', name: 'SwiftUI Button action with inline logic', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: extracted action method', lines }], why: 'Inline branching or async work in a SwiftUI action makes the view declaration own behavior instead of delegating to a named action.', impact: 'Reviewers and agents cannot remediate a blocked view safely when the finding lacks the exact Button action node.', expected_fix: 'Extract the action body to a named method or view model command and reference that method from Button.', ruleId: 'heuristics.ios.swiftui.inline-action-logic.ast', code: 'HEURISTICS_IOS_SWIFTUI_INLINE_ACTION_LOGIC_AST', message: 'AST heuristic detected inline logic inside a SwiftUI action handler; action handlers should reference methods and keep view declarations focused.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNavigationViewUsage, ruleId: 'heuristics.ios.navigation-view.ast', code: 'HEURISTICS_IOS_NAVIGATION_VIEW_AST', message: 'AST heuristic detected NavigationView usage.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUntypedNavigationLinkDestinationUsage, ruleId: 'heuristics.ios.swiftui.untyped-navigation-link-destination.ast', code: 'HEURISTICS_IOS_SWIFTUI_UNTYPED_NAVIGATION_LINK_DESTINATION_AST', message: 'AST heuristic detected untyped NavigationLink destination usage; prefer NavigationLink(value:) with navigationDestination(for:) for type-safe navigation.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftForegroundColorUsage, locateLines: TextIOS.collectSwiftForegroundColorLines, primaryNode: (lines) => ({ kind: 'call', name: 'SwiftUI foregroundColor modifier', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: foregroundStyle or design token', lines }], why: 'foregroundColor is a legacy SwiftUI styling API compared with foregroundStyle and tokenized style values.', impact: 'Modernization blockers need the exact modifier line to avoid whole-file refactors.', expected_fix: 'Replace .foregroundColor(...) with .foregroundStyle(...) or the repository-approved design token style.', ruleId: 'heuristics.ios.foreground-color.ast', code: 'HEURISTICS_IOS_FOREGROUND_COLOR_AST', message: 'AST heuristic detected foregroundColor usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftCornerRadiusUsage, locateLines: TextIOS.collectSwiftCornerRadiusLines, primaryNode: (lines) => ({ kind: 'call', name: 'SwiftUI cornerRadius modifier', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: clipShape with rounded rectangle style', lines }], why: 'cornerRadius is a legacy shape shortcut that hides the shape semantics used by modern SwiftUI styling.', impact: 'The fix is local, but without line evidence the gate forces unsafe file-wide remediation.', expected_fix: 'Replace .cornerRadius(...) with .clipShape(.rect(cornerRadius: ...)) or a named reusable shape/style token.', ruleId: 'heuristics.ios.corner-radius.ast', code: 'HEURISTICS_IOS_CORNER_RADIUS_AST', message: 'AST heuristic detected cornerRadius usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftTabItemUsage, ruleId: 'heuristics.ios.tab-item.ast', code: 'HEURISTICS_IOS_TAB_ITEM_AST', message: 'AST heuristic detected tabItem usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftOnTapGestureUsage, ruleId: 'heuristics.ios.on-tap-gesture.ast', code: 'HEURISTICS_IOS_ON_TAP_GESTURE_AST', message: 'AST heuristic detected onTapGesture usage where Button may be preferred.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftOnTapGestureWithoutButtonTraitUsage, locateLines: TextIOS.collectSwiftOnTapGestureWithoutButtonTraitLines, primaryNode: (lines) => ({ kind: 'call', name: 'SwiftUI onTapGesture without button accessibility trait', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: Button or accessibilityAddTraits(.isButton)', lines }], why: 'A tappable SwiftUI element that is not a Button must expose button semantics to assistive technologies.', impact: 'VoiceOver users can encounter an interactive element without the expected button trait, and the gate must point to the exact tap modifier.', expected_fix: 'Prefer Button for interactive controls. If onTapGesture is required, add .accessibilityAddTraits(.isButton) to the same element.', ruleId: 'heuristics.ios.accessibility.on-tap-without-button-trait.ast', code: 'HEURISTICS_IOS_ACCESSIBILITY_ON_TAP_WITHOUT_BUTTON_TRAIT_AST', message: 'AST heuristic detected onTapGesture without button accessibility trait.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftStringFormatUsage, ruleId: 'heuristics.ios.string-format.ast', code: 'HEURISTICS_IOS_STRING_FORMAT_AST', message: 'AST heuristic detected String(format:) usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftScrollViewShowsIndicatorsUsage, ruleId: 'heuristics.ios.scrollview-shows-indicators.ast', code: 'HEURISTICS_IOS_SCROLLVIEW_SHOWS_INDICATORS_AST', message: 'AST heuristic detected ScrollView(showsIndicators: false) usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftSheetIsPresentedUsage, ruleId: 'heuristics.ios.sheet-is-presented.ast', code: 'HEURISTICS_IOS_SHEET_IS_PRESENTED_AST', message: 'AST heuristic detected .sheet(isPresented:) usage where .sheet(item:) may be preferred.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftLegacyOnChangeUsage, ruleId: 'heuristics.ios.legacy-onchange.ast', code: 'HEURISTICS_IOS_LEGACY_ONCHANGE_AST', message: 'AST heuristic detected legacy onChange usage where modern overloads may be preferred.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUIScreenMainBoundsUsage, ruleId: 'heuristics.ios.uiscreen-main-bounds.ast', code: 'HEURISTICS_IOS_UISCREEN_MAIN_BOUNDS_AST', message: 'AST heuristic detected UIScreen.main.bounds usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftLegacyXCTestImportUsage, ruleId: 'heuristics.ios.testing.xctest-import.ast', code: 'HEURISTICS_IOS_TESTING_XCTEST_IMPORT_AST', message: 'AST heuristic detected XCTest-only test usage where Swift Testing may be preferred.' },
  { platform: 'ios', pathCheck: isIOSSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftModernizableXCTestSuiteUsage, locateLines: TextIOS.collectSwiftModernizableXCTestSuiteLines, primaryNode: (lines) => ({ kind: 'class', name: 'modernizable XCTestCase test suite', lines }), relatedNodes: (lines) => [{ kind: 'class', name: 'replacement: Swift Testing @Suite/@Test suite', lines }], why: 'XCTestCase suites with test... methods keep unit tests on the legacy XCTest lifecycle even when the file can be expressed as a native Swift Testing suite.', impact: 'New or modernizable tests drift away from the preferred Swift Testing contract, making suite migration, diagnostics and rule enforcement harder to audit.', expected_fix: 'Replace import XCTest and XCTestCase/test... unit suites with import Testing, @Suite where useful and @Test functions. Keep XCTestCase only for explicit UI, performance or brownfield compatibility cases.', ruleId: 'heuristics.ios.testing.xctest-suite-modernizable.ast', code: 'HEURISTICS_IOS_TESTING_XCTEST_SUITE_MODERNIZABLE_AST', message: 'AST heuristic detected modernizable XCTestCase/test... suite; use native Swift Testing where applicable.' },
  { platform: 'ios', pathCheck: isIOSSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftXCTestAssertionUsage, locateLines: TextIOS.collectSwiftXCTestAssertionLines, primaryNode: (lines) => ({ kind: 'call', name: 'legacy XCTest assertion call', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: #expect(...)', lines }], why: 'XCTAssert* and XCTFail keep modern unit tests tied to XCTest assertion APIs even when Swift Testing can express the same expectation natively.', impact: 'Assertion style drifts across the test suite and makes migration to Swift Testing harder to audit because failures use mixed vocabularies and diagnostics.', expected_fix: 'Replace XCTAssert* and XCTFail with Swift Testing #expect(...) or a thrown test failure pattern when the target already supports Swift Testing. Keep XCTest assertions only for explicit legacy, UI or performance test compatibility.', ruleId: 'heuristics.ios.testing.xctassert.ast', code: 'HEURISTICS_IOS_TESTING_XCTASSERT_AST', message: 'AST heuristic detected legacy XCTest assertion calls; use native Swift Testing #expect where applicable.' },
  { platform: 'ios', pathCheck: isIOSSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftXCTUnwrapUsage, locateLines: TextIOS.collectSwiftXCTUnwrapLines, primaryNode: (lines) => ({ kind: 'call', name: 'legacy XCTest unwrap call', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: #require(...)', lines }], why: 'XCTUnwrap keeps optional unwrapping tied to XCTest even when Swift Testing can express required values natively.', impact: 'Tests retain mixed assertion vocabulary and weaker migration traceability because required optional values are not represented through Swift Testing diagnostics.', expected_fix: 'Replace try XCTUnwrap(optionalValue) with try #require(optionalValue) when the target already supports Swift Testing. Keep XCTUnwrap only for explicit XCTest compatibility, UI or performance test cases.', ruleId: 'heuristics.ios.testing.xctunwrap.ast', code: 'HEURISTICS_IOS_TESTING_XCTUNWRAP_AST', message: 'AST heuristic detected legacy XCTUnwrap calls; use native Swift Testing #require where applicable.' },
  { platform: 'ios', pathCheck: isIOSSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftWaitForExpectationsUsage, locateLines: TextIOS.collectSwiftWaitForExpectationsLines, primaryNode: (lines) => ({ kind: 'call', name: 'legacy XCTest wait call', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: await fulfillment(of:timeout:) or predicate-driven UI wait wrapper', lines }], why: 'Legacy XCTest wait APIs block the current test thread and hide async intent that Swift concurrency can express directly.', impact: 'Async tests become less deterministic, harder to cancel and easier to keep tied to XCTest-only migration paths.', expected_fix: 'Replace wait(for:timeout:), self.wait(for:timeout:), waitForExpectations(timeout:) or raw waitForExistence(timeout:) calls with await fulfillment(of:timeout:) or a repository-approved async UI wait helper.', ruleId: 'heuristics.ios.testing.wait-for-expectations.ast', code: 'HEURISTICS_IOS_TESTING_WAIT_FOR_EXPECTATIONS_AST', message: 'AST heuristic detected wait(for:)/waitForExpectations/waitForExistence usage where an explicit async wait contract may be preferred.' },
  { platform: 'ios', pathCheck: isIOSSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftLegacyExpectationDescriptionUsage, locateLines: TextIOS.collectSwiftLegacyExpectationDescriptionLines, primaryNode: (lines) => ({ kind: 'call', name: 'legacy XCTest expectation(description:) call', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: await confirmation or awaited fulfillment flow', lines }], why: 'Legacy expectation(description:) scaffolding keeps async tests coupled to XCTest-style callbacks instead of expressing confirmation intent directly.', impact: 'Tests can remain harder to read and migrate because the assertion flow is split between expectation creation, callback fulfillment and a later wait.', expected_fix: 'Prefer await confirmation(...) for callback confirmation, or pair legacy expectations with await fulfillment(of:timeout:) when the target still requires XCTest compatibility.', ruleId: 'heuristics.ios.testing.legacy-expectation-description.ast', code: 'HEURISTICS_IOS_TESTING_LEGACY_EXPECTATION_DESCRIPTION_AST', message: 'AST heuristic detected expectation(description:) usage without modern fulfillment/confirmation flow.' },
  { platform: 'ios', pathCheck: isIOSSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftMixedTestingFrameworksUsage, locateLines: TextIOS.collectSwiftMixedTestingFrameworkLines, primaryNode: (lines) => ({ kind: 'class', name: 'mixed XCTestCase and Swift Testing suite', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: isolate XCTest compatibility from Swift Testing suites', lines }], why: 'Mixing XCTestCase and Swift Testing markers in the same file makes the test contract ambiguous and hides whether the target is legacy XCTest compatibility or modern Swift Testing.', impact: 'Migration work becomes harder to audit because one file can carry two lifecycle models, assertion styles and setup conventions at once.', expected_fix: 'Split XCTest compatibility tests and Swift Testing suites into separate files, or migrate the legacy XCTestCase suite fully to import Testing with @Suite/@Test and #expect/#require.', ruleId: 'heuristics.ios.testing.mixed-frameworks.ast', code: 'HEURISTICS_IOS_TESTING_MIXED_FRAMEWORKS_AST', message: 'AST heuristic detected XCTestCase and Swift Testing markers mixed in the same test file without explicit compatibility reason.' },
  { platform: 'ios', pathCheck: isIOSSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftQuickNimbleUsage, locateLines: TextIOS.collectSwiftQuickNimbleLines, primaryNode: (lines) => ({ kind: 'class', name: 'QuickSpec legacy test suite', lines }), relatedNodes: (lines) => [{ kind: 'call', name: 'replacement: Swift Testing @Suite/@Test with #expect/#require', lines }], why: 'Quick and Nimble introduce a third-party BDD lifecycle and matcher vocabulary that diverges from the native Swift Testing contract expected for new tests.', impact: 'New tests become harder to migrate, audit and run consistently because they depend on legacy DSL hooks instead of Swift Testing suites and assertions.', expected_fix: 'For new tests, replace QuickSpec/describe/context/it/expect with native Swift Testing @Suite/@Test and #expect/#require. Keep existing Quick/Nimble only as explicit brownfield legacy until migrated.', ruleId: 'heuristics.ios.testing.quick-nimble.ast', code: 'HEURISTICS_IOS_TESTING_QUICK_NIMBLE_AST', message: 'AST heuristic detected Quick/Nimble legacy test nodes; use native Swift Testing for new test code.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNSManagedObjectBoundaryUsage, ruleId: 'heuristics.ios.core-data.nsmanagedobject-boundary.ast', code: 'HEURISTICS_IOS_CORE_DATA_NSMANAGEDOBJECT_BOUNDARY_AST', message: 'AST heuristic detected NSManagedObject in a shared boundary.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNSManagedObjectAsyncBoundaryUsage, ruleId: 'heuristics.ios.core-data.nsmanagedobject-async-boundary.ast', code: 'HEURISTICS_IOS_CORE_DATA_NSMANAGEDOBJECT_ASYNC_BOUNDARY_AST', message: 'AST heuristic detected NSManagedObject in an async boundary.' },
  { platform: 'ios', pathCheck: isIOSApplicationOrPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftCoreDataLayerLeakUsage, ruleId: 'heuristics.ios.core-data.layer-leak.ast', code: 'HEURISTICS_IOS_CORE_DATA_LAYER_LEAK_AST', message: 'AST heuristic detected Core Data APIs leaking into application/presentation code.' },
  { platform: 'ios', pathCheck: isIOSApplicationOrPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftSwiftDataLayerLeakUsage, ruleId: 'heuristics.ios.swiftdata.layer-leak.ast', code: 'HEURISTICS_IOS_SWIFTDATA_LAYER_LEAK_AST', message: 'AST heuristic detected SwiftData APIs leaking into application/presentation code.' },
  { platform: 'ios', pathCheck: isIOSApplicationOrPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNSManagedObjectStateLeakUsage, ruleId: 'heuristics.ios.core-data.nsmanagedobject-state-leak.ast', code: 'HEURISTICS_IOS_CORE_DATA_NSMANAGEDOBJECT_STATE_LEAK_AST', message: 'AST heuristic detected NSManagedObject leaking into SwiftUI state or a ViewModel.' },

  // Android
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinThreadSleepCall, ruleId: 'heuristics.android.thread-sleep.ast', code: 'HEURISTICS_ANDROID_THREAD_SLEEP_AST', message: 'AST heuristic detected Thread.sleep usage in production Kotlin code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinGlobalScopeUsage, ruleId: 'heuristics.android.globalscope.ast', code: 'HEURISTICS_ANDROID_GLOBAL_SCOPE_AST', message: 'AST heuristic detected GlobalScope coroutine usage in production Kotlin code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinRunBlockingUsage, ruleId: 'heuristics.android.run-blocking.ast', code: 'HEURISTICS_ANDROID_RUN_BLOCKING_AST', message: 'AST heuristic detected runBlocking usage in production Kotlin code.' },
  { platform: 'android', pathCheck: isAndroidSourcePath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidAsyncTaskUsage, ruleId: 'heuristics.android.concurrency.asynctask.ast', code: 'HEURISTICS_ANDROID_CONCURRENCY_ASYNCTASK_AST', message: 'AST heuristic detected deprecated AsyncTask usage in Android production code; use coroutines.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinGodActivityUsage, ruleId: 'heuristics.android.architecture.god-activity.ast', code: 'HEURISTICS_ANDROID_ARCHITECTURE_GOD_ACTIVITY_AST', message: 'AST heuristic detected an Android Activity mixing UI entrypoint with product responsibilities; keep Activity thin and move features to composables/ViewModels/use cases.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinNonLazyScrollableCollectionUsage, ruleId: 'heuristics.android.compose.non-lazy-scrollable-collection.ast', code: 'HEURISTICS_ANDROID_COMPOSE_NON_LAZY_SCROLLABLE_COLLECTION_AST', message: 'AST heuristic detected a scrollable Column/Row rendering a collection; use LazyColumn/LazyRow for virtualized lists.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinUnstableLaunchedEffectKeyUsage, ruleId: 'heuristics.android.compose.unstable-launched-effect-key.ast', code: 'HEURISTICS_ANDROID_COMPOSE_UNSTABLE_LAUNCHED_EFFECT_KEY_AST', message: 'AST heuristic detected LaunchedEffect without a stable state key; use a meaningful key that controls when the effect restarts.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinLaunchedEffectBusyLoopUsage, ruleId: 'heuristics.android.compose.launched-effect-busy-loop.ast', code: 'HEURISTICS_ANDROID_COMPOSE_LAUNCHED_EFFECT_BUSY_LOOP_AST', message: 'AST heuristic detected non-cooperative loop inside LaunchedEffect; add suspension/cancellation cooperation or move work to lifecycle-aware flow.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinProductionLoggingUsage, ruleId: 'heuristics.android.observability.production-logging.ast', code: 'HEURISTICS_ANDROID_OBSERVABILITY_PRODUCTION_LOGGING_AST', message: 'AST heuristic detected unguarded Android production logging; use structured logging guarded by BuildConfig.DEBUG or remove it.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinModifierBackgroundBeforePaddingUsage, ruleId: 'heuristics.android.compose.modifier-background-before-padding.ast', code: 'HEURISTICS_ANDROID_COMPOSE_MODIFIER_BACKGROUND_BEFORE_PADDING_AST', message: 'AST heuristic detected Modifier.background before padding; apply padding before background when the content inset should not be painted.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinMissingContentDescriptionUsage, ruleId: 'heuristics.android.accessibility.missing-content-description.ast', code: 'HEURISTICS_ANDROID_ACCESSIBILITY_MISSING_CONTENT_DESCRIPTION_AST', message: 'AST heuristic detected Image/Icon without contentDescription; provide an accessibility label or explicit null for decorative content.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinFontScaleDisabledUsage, ruleId: 'heuristics.android.accessibility.fontscale-disabled.ast', code: 'HEURISTICS_ANDROID_ACCESSIBILITY_FONTSCALE_DISABLED_AST', message: 'AST heuristic detected disabled Android font scaling; respect system fontScale for text accessibility.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinIncompleteMaterialThemeUsage, ruleId: 'heuristics.android.compose.incomplete-material-theme.ast', code: 'HEURISTICS_ANDROID_COMPOSE_INCOMPLETE_MATERIAL_THEME_AST', message: 'AST heuristic detected MaterialTheme without colorScheme, typography and shapes.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinLegacyBottomNavigationUsage, ruleId: 'heuristics.android.compose.legacy-bottom-navigation.ast', code: 'HEURISTICS_ANDROID_COMPOSE_LEGACY_BOTTOM_NAVIGATION_AST', message: 'AST heuristic detected Material 2 BottomNavigation usage; use Material 3 NavigationBar/NavigationBarItem.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinImperativeNavigationUsage, ruleId: 'heuristics.android.navigation.imperative-navigation.ast', code: 'HEURISTICS_ANDROID_NAVIGATION_IMPERATIVE_NAVIGATION_AST', message: 'AST heuristic detected imperative Android navigation; use Navigation Compose with NavHost and typed routes.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinComposableObjectCreationWithoutRememberUsage, ruleId: 'heuristics.android.compose.object-creation-without-remember.ast', code: 'HEURISTICS_ANDROID_COMPOSE_OBJECT_CREATION_WITHOUT_REMEMBER_AST', message: 'AST heuristic detected object creation inside a Composable without remember; hoist or wrap stable objects in remember.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinComposableStateCreationWithoutRememberUsage, ruleId: 'heuristics.android.compose.state-creation-without-remember.ast', code: 'HEURISTICS_ANDROID_COMPOSE_STATE_CREATION_WITHOUT_REMEMBER_AST', message: 'AST heuristic detected Compose state creation without remember; keep state stable across recompositions.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinForceUnwrapUsage, ruleId: 'heuristics.android.null-safety.force-unwrap.ast', code: 'HEURISTICS_ANDROID_NULL_SAFETY_FORCE_UNWRAP_AST', message: 'AST heuristic detected Kotlin force unwrap (!!); use safe calls, Elvis, let or requireNotNull.' },
  { platform: 'android', pathCheck: isAndroidLocalPropertiesPath, excludePaths: [], detect: detectsTrackedFilePresence, ruleId: 'heuristics.android.security.local-properties-tracked.ast', code: 'HEURISTICS_ANDROID_SECURITY_LOCAL_PROPERTIES_TRACKED_AST', message: 'AST heuristic detected tracked Android local.properties file.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinSharedPreferencesUsage, ruleId: 'heuristics.android.persistence.shared-preferences-usage.ast', code: 'HEURISTICS_ANDROID_PERSISTENCE_SHARED_PREFERENCES_USAGE_AST', message: 'AST heuristic detected SharedPreferences usage in Android production Kotlin code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinProductionMockUsage, ruleId: 'heuristics.android.testing.production-mock-usage.ast', code: 'HEURISTICS_ANDROID_TESTING_PRODUCTION_MOCK_USAGE_AST', message: 'AST heuristic detected mock or spy usage in Android production Kotlin code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinHardcodedUiStringUsage, locateLines: TextAndroid.collectKotlinHardcodedUiStringLines, ruleId: 'heuristics.android.ui.hardcoded-string.ast', code: 'HEURISTICS_ANDROID_UI_HARDCODED_STRING_AST', message: 'AST heuristic detected hardcoded user-facing Android UI string; use stringResource/R.string resources.' },
  { platform: 'android', pathCheck: isAndroidKotlinTestPath, excludePaths: [], detect: TextAndroid.hasKotlinJUnit4Usage, ruleId: 'heuristics.android.testing.junit4-usage.ast', code: 'HEURISTICS_ANDROID_TESTING_JUNIT4_USAGE_AST', message: 'AST heuristic detected JUnit4 usage in Android Kotlin tests where JUnit5 is preferred.' },
  { platform: 'android', pathCheck: isAndroidPresentationPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinLiveDataStateExposureUsage, ruleId: 'heuristics.android.flow.livedata-state-exposure.ast', code: 'HEURISTICS_ANDROID_FLOW_LIVEDATA_STATE_EXPOSURE_AST', message: 'AST heuristic detected LiveData state exposure in Android presentation code where StateFlow or SharedFlow should be preferred.' },
  { platform: 'android', pathCheck: isAndroidPresentationPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinViewModelFlowWithoutStateInUsage, ruleId: 'heuristics.android.flow.viewmodel-flow-without-statein.ast', code: 'HEURISTICS_ANDROID_FLOW_VIEWMODEL_FLOW_WITHOUT_STATEIN_AST', message: 'AST heuristic detected ViewModel exposing cold Flow state without stateIn; expose StateFlow for UI state.' },
  { platform: 'android', pathCheck: isAndroidPresentationPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinSharedFlowUsedAsStateUsage, ruleId: 'heuristics.android.flow.sharedflow-used-as-state.ast', code: 'HEURISTICS_ANDROID_FLOW_SHAREDFLOW_USED_AS_STATE_AST', message: 'AST heuristic detected SharedFlow used as ViewModel state; use StateFlow for state and SharedFlow for events.' },
  { platform: 'android', pathCheck: isAndroidPresentationPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinManualCoroutineScopeInViewModelUsage, ruleId: 'heuristics.android.coroutines.manual-scope-in-viewmodel.ast', code: 'HEURISTICS_ANDROID_COROUTINES_MANUAL_SCOPE_IN_VIEWMODEL_AST', message: 'AST heuristic detected manual CoroutineScope inside an Android ViewModel where viewModelScope should be preferred.' },
  { platform: 'android', pathCheck: isAndroidNonPresentationKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinDispatcherMainBoundaryLeakUsage, ruleId: 'heuristics.android.coroutines.dispatchers-main-boundary-leak.ast', code: 'HEURISTICS_ANDROID_COROUTINES_DISPATCHERS_MAIN_BOUNDARY_LEAK_AST', message: 'AST heuristic detected Dispatchers.Main outside Android presentation code.' },
  { platform: 'android', pathCheck: isAndroidDomainOrApplicationPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinHardcodedBackgroundDispatcherUsage, ruleId: 'heuristics.android.coroutines.hardcoded-background-dispatcher.ast', code: 'HEURISTICS_ANDROID_COROUTINES_HARDCODED_BACKGROUND_DISPATCHER_AST', message: 'AST heuristic detected hard-coded Dispatchers.IO or Dispatchers.Default in Android domain/application code.' },
  { platform: 'android', pathCheck: isAndroidDomainOrApplicationPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinWithContextUsage, ruleId: 'heuristics.android.coroutines.with-context.ast', code: 'HEURISTICS_ANDROID_COROUTINES_WITH_CONTEXT_AST', message: 'AST heuristic detected withContext usage in Android domain/application code.' },
  { platform: 'android', pathCheck: isAndroidDomainOrApplicationPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinLifecycleScopeUsage, ruleId: 'heuristics.android.coroutines.lifecycle-scope-boundary-leak.ast', code: 'HEURISTICS_ANDROID_COROUTINES_LIFECYCLE_SCOPE_BOUNDARY_LEAK_AST', message: 'AST heuristic detected lifecycleScope usage in Android domain/application code.' },
  { platform: 'android', pathCheck: isAndroidDomainOrApplicationPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinSupervisorScopeUsage, ruleId: 'heuristics.android.coroutines.supervisor-scope.ast', code: 'HEURISTICS_ANDROID_COROUTINES_SUPERVISOR_SCOPE_AST', message: 'AST heuristic detected supervisorScope usage in Android domain/application code.' },
  { platform: 'android', pathCheck: isAndroidDomainOrApplicationPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinCoroutineTryCatchUsage, ruleId: 'heuristics.android.coroutines.try-catch.ast', code: 'HEURISTICS_ANDROID_COROUTINES_TRY_CATCH_AST', message: 'AST heuristic detected try-catch handling in Android coroutine code.' },
];

const extractWorkflowHeuristicFacts = (
  params: HeuristicExtractionParams
): ReadonlyArray<ExtractedHeuristicFact> => {
  const fileFacts = params.facts
    .map((fact) => asFileContentFact(fact))
    .filter((fact): fact is FileContentFact => Boolean(fact));

  if (fileFacts.length === 0) {
    return [];
  }

  const featureFiles = fileFacts.filter((fact) => isWorkflowFeaturePath(fact.path));
  const implementationFiles = fileFacts.filter((fact) =>
    isWorkflowImplementationPath(fact.path)
  );
  const workflowFacts: ExtractedHeuristicFact[] = [];

  if (implementationFiles.length > 50 && featureFiles.length === 0) {
    workflowFacts.push(
      createHeuristicFact({
        ruleId: 'workflow.bdd.missing_feature_files',
        code: 'WORKFLOW_BDD_MISSING_FEATURE_FILES_AST',
        message:
          'Project has implementation files without feature files (.feature). BDD -> TDD -> Implementation flow is not being enforced.',
        filePath: 'PROJECT_ROOT',
        severity: 'CRITICAL',
      })
    );
  }

  if (implementationFiles.length > 20 && featureFiles.length < 3) {
    workflowFacts.push(
      createHeuristicFact({
        ruleId: 'workflow.bdd.insufficient_features',
        code: 'WORKFLOW_BDD_INSUFFICIENT_FEATURES_AST',
        message:
          'Feature coverage is insufficient for implementation volume. Increase BDD feature files before adding more implementation code.',
        filePath: 'PROJECT_ROOT',
        severity: 'ERROR',
      })
    );
  }

  return workflowFacts;
};

export const extractHeuristicFacts = (
  params: HeuristicExtractionParams
): ReadonlyArray<ExtractedHeuristicFact> => {
  if (!hasDetectedHeuristicPlatform(params)) {
    return [];
  }

  const heuristicFacts: ExtractedHeuristicFact[] = [];

  for (const fact of params.facts) {
    const fileFact = asFileContentFact(fact);
    if (!fileFact) {
      continue;
    }

    // Text-based heuristics
    for (const entry of textDetectorRegistry) {
      const platformDetected = params.detectedPlatforms[entry.platform]?.detected;
      if (
        platformDetected &&
        entry.pathCheck(fileFact.path) &&
        (entry.excludePaths ?? []).every((exclude) => !exclude(fileFact.path)) &&
        entry.detect(fileFact.content)
      ) {
        const lines = entry.locateLines?.(fileFact.content);
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: entry.ruleId,
            code: entry.code,
            message: entry.message,
            filePath: fileFact.path,
            lines,
            primary_node: lines && lines.length > 0 ? entry.primaryNode?.(lines) : undefined,
            related_nodes: lines && lines.length > 0 ? entry.relatedNodes?.(lines) : undefined,
            why: entry.why,
            impact: entry.impact,
            expected_fix: entry.expected_fix,
          })
        );
      }
    }

    if (
      params.detectedPlatforms.ios?.detected &&
      isIOSSwiftPath(fileFact.path) &&
      !isSwiftTestPath(fileFact.path)
    ) {
      if (isIOSApplicationOrPresentationPath(fileFact.path)) {
        const semanticOcpMatch = TextIOS.findSwiftOpenClosedSwitchMatch(fileFact.content);
        if (semanticOcpMatch) {
          heuristicFacts.push(
            createHeuristicFact({
              ruleId: 'heuristics.ios.solid.ocp.discriminator-switch.ast',
              code: 'HEURISTICS_IOS_SOLID_OCP_DISCRIMINATOR_SWITCH_AST',
              message:
                'Semantic iOS OCP heuristic detected application/presentation branching that must be modified to support new cases.',
              filePath: fileFact.path,
              lines: semanticOcpMatch.lines,
              severity: 'CRITICAL',
              primary_node: semanticOcpMatch.primary_node,
              related_nodes: semanticOcpMatch.related_nodes,
              why: semanticOcpMatch.why,
              impact: semanticOcpMatch.impact,
              expected_fix: semanticOcpMatch.expected_fix,
            })
          );
        }

        const semanticDipMatch = TextIOS.findSwiftConcreteDependencyDipMatch(fileFact.content);
        if (semanticDipMatch) {
          heuristicFacts.push(
            createHeuristicFact({
              ruleId: 'heuristics.ios.solid.dip.concrete-framework-dependency.ast',
              code: 'HEURISTICS_IOS_SOLID_DIP_CONCRETE_FRAMEWORK_DEPENDENCY_AST',
              message:
                'Semantic iOS DIP heuristic detected application/presentation code depending on concrete framework services.',
              filePath: fileFact.path,
              lines: semanticDipMatch.lines,
              severity: 'CRITICAL',
              primary_node: semanticDipMatch.primary_node,
              related_nodes: semanticDipMatch.related_nodes,
              why: semanticDipMatch.why,
              impact: semanticDipMatch.impact,
              expected_fix: semanticDipMatch.expected_fix,
            })
          );
        }

        const semanticIspMatch = TextIOS.findSwiftInterfaceSegregationMatch(fileFact.content);
        if (semanticIspMatch) {
          heuristicFacts.push(
            createHeuristicFact({
              ruleId: 'heuristics.ios.solid.isp.fat-protocol-dependency.ast',
              code: 'HEURISTICS_IOS_SOLID_ISP_FAT_PROTOCOL_DEPENDENCY_AST',
              message:
                'Semantic iOS ISP heuristic detected application/presentation code depending on a protocol broader than the members it actually uses.',
              filePath: fileFact.path,
              lines: semanticIspMatch.lines,
              severity: 'CRITICAL',
              primary_node: semanticIspMatch.primary_node,
              related_nodes: semanticIspMatch.related_nodes,
              why: semanticIspMatch.why,
              impact: semanticIspMatch.impact,
              expected_fix: semanticIspMatch.expected_fix,
            })
          );
        }

        const semanticLspMatch = TextIOS.findSwiftLiskovSubstitutionMatch(fileFact.content);
        if (semanticLspMatch) {
          heuristicFacts.push(
            createHeuristicFact({
              ruleId: 'heuristics.ios.solid.lsp.narrowed-precondition.ast',
              code: 'HEURISTICS_IOS_SOLID_LSP_NARROWED_PRECONDITION_AST',
              message:
                'Semantic iOS LSP heuristic detected an application/presentation subtype that narrows the contract preconditions and breaks safe substitution.',
              filePath: fileFact.path,
              lines: semanticLspMatch.lines,
              severity: 'CRITICAL',
              primary_node: semanticLspMatch.primary_node,
              related_nodes: semanticLspMatch.related_nodes,
              why: semanticLspMatch.why,
              impact: semanticLspMatch.impact,
              expected_fix: semanticLspMatch.expected_fix,
            })
          );
        }
      }

      const semanticSrpMatch = TextIOS.findSwiftPresentationSrpMatch(fileFact.content);
      if (semanticSrpMatch) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ios.solid.srp.presentation-mixed-responsibilities.ast',
            code: 'HEURISTICS_IOS_SOLID_SRP_PRESENTATION_MIXED_RESPONSIBILITIES_AST',
            message:
              'Semantic iOS SRP heuristic detected a presentation type mixing session, networking, persistence and navigation responsibilities.',
            filePath: fileFact.path,
            lines: semanticSrpMatch.lines,
            severity: 'CRITICAL',
            primary_node: semanticSrpMatch.primary_node,
            related_nodes: semanticSrpMatch.related_nodes,
            why: semanticSrpMatch.why,
            impact: semanticSrpMatch.impact,
            expected_fix: semanticSrpMatch.expected_fix,
          })
        );
      }

      const semanticCanaryMatch = TextIOS.findSwiftIOSCanary001Match(fileFact.content);
      if (semanticCanaryMatch) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ios.canary-001.presentation-mixed-responsibilities.ast',
            code: 'HEURISTICS_IOS_CANARY_001_PRESENTATION_MIXED_RESPONSIBILITIES_AST',
            message:
              'Semantic iOS canary detected a ViewModel mixing singleton, network, persistence and navigation responsibilities.',
            filePath: fileFact.path,
            lines: semanticCanaryMatch.lines,
            severity: 'CRITICAL',
            primary_node: semanticCanaryMatch.primary_node,
            related_nodes: semanticCanaryMatch.related_nodes,
            why: semanticCanaryMatch.why,
            impact: semanticCanaryMatch.impact,
            expected_fix: semanticCanaryMatch.expected_fix,
          })
        );
      }
    }

    if (
      params.detectedPlatforms.android?.detected &&
      isAndroidPresentationPath(fileFact.path) &&
      !isKotlinTestPath(fileFact.path)
    ) {
      const semanticSrpMatch = TextAndroid.findKotlinPresentationSrpMatch(fileFact.content);
      if (semanticSrpMatch) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.android.solid.srp.presentation-mixed-responsibilities.ast',
            code: 'HEURISTICS_ANDROID_SOLID_SRP_PRESENTATION_MIXED_RESPONSIBILITIES_AST',
            message:
              'Semantic Android SRP heuristic detected a presentation type mixing session, networking, persistence and navigation responsibilities.',
            filePath: fileFact.path,
            lines: semanticSrpMatch.lines,
            severity: 'CRITICAL',
            primary_node: semanticSrpMatch.primary_node,
            related_nodes: semanticSrpMatch.related_nodes,
            why: semanticSrpMatch.why,
            impact: semanticSrpMatch.impact,
            expected_fix: semanticSrpMatch.expected_fix,
          })
        );
      }
    }

    if (
      params.detectedPlatforms.android?.detected &&
      isAndroidApplicationOrPresentationPath(fileFact.path) &&
      !isKotlinTestPath(fileFact.path)
    ) {
      const semanticOcpMatch = TextAndroid.findKotlinOpenClosedWhenMatch(fileFact.content);
      if (semanticOcpMatch) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.android.solid.ocp.discriminator-branching.ast',
            code: 'HEURISTICS_ANDROID_SOLID_OCP_DISCRIMINATOR_BRANCHING_AST',
            message:
              'Semantic Android OCP heuristic detected application/presentation code branching on a discriminator instead of extending behavior via abstractions.',
            filePath: fileFact.path,
            lines: semanticOcpMatch.lines,
            severity: 'CRITICAL',
            primary_node: semanticOcpMatch.primary_node,
            related_nodes: semanticOcpMatch.related_nodes,
            why: semanticOcpMatch.why,
            impact: semanticOcpMatch.impact,
            expected_fix: semanticOcpMatch.expected_fix,
          })
        );
      }

      const semanticDipMatch = TextAndroid.findKotlinConcreteDependencyDipMatch(fileFact.content);
      if (semanticDipMatch) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.android.solid.dip.concrete-framework-dependency.ast',
            code: 'HEURISTICS_ANDROID_SOLID_DIP_CONCRETE_FRAMEWORK_DEPENDENCY_AST',
            message:
              'Semantic Android DIP heuristic detected application/presentation code depending on concrete framework services.',
            filePath: fileFact.path,
            lines: semanticDipMatch.lines,
            severity: 'CRITICAL',
            primary_node: semanticDipMatch.primary_node,
            related_nodes: semanticDipMatch.related_nodes,
            why: semanticDipMatch.why,
            impact: semanticDipMatch.impact,
            expected_fix: semanticDipMatch.expected_fix,
          })
        );
      }

      const semanticIspMatch = TextAndroid.findKotlinInterfaceSegregationMatch(fileFact.content);
      if (semanticIspMatch) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.android.solid.isp.fat-interface-dependency.ast',
            code: 'HEURISTICS_ANDROID_SOLID_ISP_FAT_INTERFACE_DEPENDENCY_AST',
            message:
              'Semantic Android ISP heuristic detected application/presentation code depending on an interface broader than the members it actually uses.',
            filePath: fileFact.path,
            lines: semanticIspMatch.lines,
            severity: 'CRITICAL',
            primary_node: semanticIspMatch.primary_node,
            related_nodes: semanticIspMatch.related_nodes,
            why: semanticIspMatch.why,
            impact: semanticIspMatch.impact,
            expected_fix: semanticIspMatch.expected_fix,
          })
        );
      }

      const semanticLspMatch = TextAndroid.findKotlinLiskovSubstitutionMatch(fileFact.content);
      if (semanticLspMatch) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.android.solid.lsp.narrowed-precondition.ast',
            code: 'HEURISTICS_ANDROID_SOLID_LSP_NARROWED_PRECONDITION_AST',
            message:
              'Semantic Android LSP heuristic detected an application/presentation subtype that narrows preconditions and breaks safe substitution.',
            filePath: fileFact.path,
            lines: semanticLspMatch.lines,
            severity: 'CRITICAL',
            primary_node: semanticLspMatch.primary_node,
            related_nodes: semanticLspMatch.related_nodes,
            why: semanticLspMatch.why,
            impact: semanticLspMatch.impact,
            expected_fix: semanticLspMatch.expected_fix,
          })
        );
      }
    }

    // AST-based heuristics
    const hasTypeScriptPlatform =
      params.detectedPlatforms.frontend?.detected ||
      params.detectedPlatforms.backend?.detected ||
      isAllTypeScriptHeuristicScopeEnabled(params);
    const isTypeScriptTestFile = isTestPath(fileFact.path);
    if (!hasTypeScriptPlatform || !isTypeScriptHeuristicTargetPath(fileFact.path, params)) {
      continue;
    }

    try {
      const ast = parse(fileFact.content, {
        sourceType: 'unambiguous',
        plugins: ['decorators-legacy', 'typescript', 'jsx'],
      });

      for (const entry of astDetectorRegistry) {
        if (isTypeScriptTestFile && entry.includeTestPaths !== true) {
          continue;
        }
        if (entry.pathCheck && !entry.pathCheck(fileFact.path)) {
          continue;
        }
        if (entry.detect(ast)) {
          const semanticMatch =
            entry.ruleId === 'heuristics.ts.solid.srp.class-command-query-mix.ast'
              ? TS.findMixedCommandQueryClassMatch(ast)
              : entry.ruleId === 'heuristics.ts.solid.isp.interface-command-query-mix.ast'
                ? TS.findMixedCommandQueryInterfaceMatch(ast)
              : entry.ruleId === 'heuristics.ts.solid.ocp.discriminator-switch.ast'
                ? TS.findTypeDiscriminatorSwitchMatch(ast)
              : entry.ruleId === 'heuristics.ts.solid.lsp.override-not-implemented.ast'
                ? TS.findOverrideMethodThrowingNotImplementedMatch(ast)
              : entry.ruleId === 'heuristics.ts.solid.dip.framework-import.ast'
                ? TS.findFrameworkDependencyImportMatch(ast)
                : entry.ruleId === 'heuristics.ts.solid.dip.concrete-instantiation.ast'
                  ? TS.findConcreteDependencyInstantiationMatch(ast)
                  : undefined;
          const lineLocator = entry.locateLines ?? astDetectorLineLocatorRegistry.get(entry.detect);
          const lines = semanticMatch?.lines ?? lineLocator?.(ast);
          heuristicFacts.push(
            createHeuristicFact({
              ruleId: entry.ruleId,
              code: entry.code,
              message: entry.message,
              filePath: fileFact.path,
              lines,
              primary_node: semanticMatch?.primary_node,
              related_nodes: semanticMatch?.related_nodes,
              why: semanticMatch?.why,
              impact: semanticMatch?.impact,
              expected_fix: semanticMatch?.expected_fix,
            })
          );
        }
      }
    } catch {
      continue;
    }
  }

  heuristicFacts.push(...extractWorkflowHeuristicFacts(params));

  return heuristicFacts;
};
