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

const isTypeScriptFrontendPath = (path: string): boolean => {
  if (!isTypeScriptHeuristicTargetPath(path)) {
    return false;
  }
  return path.startsWith('apps/frontend/') || path.startsWith('apps/web/');
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

const isIOSSwiftPath = (path: string): boolean => {
  return path.endsWith('.swift') && path.startsWith('apps/ios/');
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

const isAndroidJavaPath = (path: string): boolean => {
  return path.endsWith('.java') && path.startsWith('apps/android/');
};

const isAndroidSourcePath = (path: string): boolean => {
  return isAndroidKotlinPath(path) || isAndroidJavaPath(path);
};

const isAndroidGradlePath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  if (!normalized.startsWith('apps/android/')) {
    return false;
  }

  return (
    normalized.endsWith('/build.gradle') ||
    normalized.endsWith('/build.gradle.kts') ||
    normalized.endsWith('.gradle') ||
    normalized.endsWith('.gradle.kts')
  );
};

const isAndroidVersionCatalogPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  return normalized.startsWith('apps/android/') && normalized.endsWith('libs.versions.toml');
};

const isAndroidLocalizedStringsXmlPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  return (
    normalized.startsWith('apps/android/') &&
    /\/res\/values-[^/]+\/strings\.xml$/.test(normalized)
  );
};

const isAndroidLocalizedPluralsXmlPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  return (
    normalized.startsWith('apps/android/') &&
    /\/res\/values-[^/]+\/plurals\.xml$/.test(normalized)
  );
};

const isAndroidInstrumentedTestPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  return normalized.startsWith('apps/android/') && normalized.includes('/androidtest/');
};

const isAndroidJvmTestPath = (path: string): boolean => {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  return (
    normalized.startsWith('apps/android/') &&
    normalized.includes('/test/') &&
    !normalized.includes('/androidtest/')
  );
};

const isAndroidPresentationPath = (path: string): boolean => {
  return isAndroidKotlinPath(path) && path.includes('/presentation/');
};

const isAndroidApplicationOrPresentationPath = (path: string): boolean => {
  return isAndroidKotlinPath(path) && (path.includes('/application/') || path.includes('/presentation/'));
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

const isJavaTestPath = (path: string): boolean => {
  const normalized = path.toLowerCase();
  return (
    normalized.includes('/test/') ||
    normalized.includes('/androidtest/') ||
    normalized.endsWith('test.java') ||
    normalized.endsWith('tests.java')
  );
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
  { detect: TS.hasEvalCall, ruleId: 'heuristics.ts.eval.ast', code: 'HEURISTICS_EVAL_AST', message: 'AST heuristic detected eval usage.' },
  { detect: TS.hasFunctionConstructorUsage, ruleId: 'heuristics.ts.function-constructor.ast', code: 'HEURISTICS_FUNCTION_CONSTRUCTOR_AST', message: 'AST heuristic detected Function constructor usage.' },
  { detect: TS.hasSetTimeoutStringCallback, ruleId: 'heuristics.ts.set-timeout-string.ast', code: 'HEURISTICS_SET_TIMEOUT_STRING_AST', message: 'AST heuristic detected setTimeout with a string callback.' },
  { detect: TS.hasSetIntervalStringCallback, ruleId: 'heuristics.ts.set-interval-string.ast', code: 'HEURISTICS_SET_INTERVAL_STRING_AST', message: 'AST heuristic detected setInterval with a string callback.' },
  { detect: TS.hasAsyncPromiseExecutor, ruleId: 'heuristics.ts.new-promise-async.ast', code: 'HEURISTICS_NEW_PROMISE_ASYNC_AST', message: 'AST heuristic detected async Promise executor usage.' },
  { detect: TS.hasCallbackHellPattern, ruleId: 'heuristics.ts.callback-hell.ast', code: 'HEURISTICS_CALLBACK_HELL_AST', message: 'AST heuristic detected callback hell / nested promise callback usage.' },
  { detect: TS.hasMagicNumberPattern, ruleId: 'heuristics.ts.magic-numbers.ast', code: 'HEURISTICS_MAGIC_NUMBERS_AST', message: 'AST heuristic detected magic number usage.' },
  { detect: TS.hasHardcodedValuePattern, ruleId: 'heuristics.ts.hardcoded-values.ast', code: 'HEURISTICS_HARDCODED_VALUES_AST', message: 'AST heuristic detected hardcoded config value usage.' },
  { detect: TS.hasEnvDefaultFallbackPattern, ruleId: 'heuristics.ts.env-default-fallback.ast', code: 'HEURISTICS_ENV_DEFAULT_FALLBACK_AST', message: 'AST heuristic detected environment default fallback usage.' },
  { detect: TS.hasWithStatement, ruleId: 'heuristics.ts.with-statement.ast', code: 'HEURISTICS_WITH_STATEMENT_AST', message: 'AST heuristic detected with-statement usage.' },
  { detect: TS.hasDeleteOperator, ruleId: 'heuristics.ts.delete-operator.ast', code: 'HEURISTICS_DELETE_OPERATOR_AST', message: 'AST heuristic detected delete-operator usage.' },
  { detect: TS.hasDebuggerStatement, ruleId: 'heuristics.ts.debugger.ast', code: 'HEURISTICS_DEBUGGER_AST', message: 'AST heuristic detected debugger statement usage.' },
  { detect: TS.hasMixedCommandQueryClass, ruleId: 'heuristics.ts.solid.srp.class-command-query-mix.ast', code: 'HEURISTICS_SOLID_SRP_CLASS_COMMAND_QUERY_MIX_AST', message: 'AST heuristic detected class-level SRP/CQS mix (commands and queries in the same class).' },
  { detect: TS.hasMixedCommandQueryInterface, ruleId: 'heuristics.ts.solid.isp.interface-command-query-mix.ast', code: 'HEURISTICS_SOLID_ISP_INTERFACE_COMMAND_QUERY_MIX_AST', message: 'AST heuristic detected interface-level ISP/CQS mix (commands and queries in the same contract).' },
  { detect: TS.hasTypeDiscriminatorSwitch, ruleId: 'heuristics.ts.solid.ocp.discriminator-switch.ast', code: 'HEURISTICS_SOLID_OCP_DISCRIMINATOR_SWITCH_AST', message: 'AST heuristic detected OCP risk via discriminator switch branching.' },
  { detect: TS.hasOverrideMethodThrowingNotImplemented, ruleId: 'heuristics.ts.solid.lsp.override-not-implemented.ast', code: 'HEURISTICS_SOLID_LSP_OVERRIDE_NOT_IMPLEMENTED_AST', message: 'AST heuristic detected LSP risk: override throws not-implemented/unsupported.' },
  { detect: TS.hasFrameworkDependencyImport, ruleId: 'heuristics.ts.solid.dip.framework-import.ast', code: 'HEURISTICS_SOLID_DIP_FRAMEWORK_IMPORT_AST', message: 'AST heuristic detected DIP risk: framework dependency imported in domain/application code.', pathCheck: isTypeScriptDomainOrApplicationPath },
  { detect: TS.hasConcreteDependencyInstantiation, ruleId: 'heuristics.ts.solid.dip.concrete-instantiation.ast', code: 'HEURISTICS_SOLID_DIP_CONCRETE_INSTANTIATION_AST', message: 'AST heuristic detected DIP risk: direct instantiation of concrete framework dependency.', pathCheck: isTypeScriptDomainOrApplicationPath },
  { detect: (ast) => TS.findCleanArchitectureMatch(ast) !== undefined, ruleId: 'heuristics.ts.clean-architecture.ast', code: 'HEURISTICS_CLEAN_ARCHITECTURE_AST', message: 'AST heuristic detected clean architecture dependency direction risk in domain/application code.', pathCheck: isTypeScriptDomainOrApplicationPath },
  { detect: TS.hasProductionMockCall, ruleId: 'heuristics.ts.production-mock.ast', code: 'HEURISTICS_PRODUCTION_MOCK_AST', message: 'AST heuristic detected production mock usage in backend runtime code.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasExceptionFilterClass, ruleId: 'heuristics.ts.exception-filter.ast', code: 'HEURISTICS_EXCEPTION_FILTER_AST', message: 'AST heuristic detected global exception filter usage in backend runtime code.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasGuardUseGuardsJwtAuthGuard, ruleId: 'heuristics.ts.guards-useguards-jwtauthguard.ast', code: 'HEURISTICS_GUARDS_USEGUARDS_JWTAUTHGUARD_AST', message: 'AST heuristic detected @UseGuards(JwtAuthGuard) usage in backend runtime code.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasUseInterceptorsLoggingTransform, ruleId: 'heuristics.ts.interceptors-useinterceptors-logging-transform.ast', code: 'HEURISTICS_INTERCEPTORS_USEINTERCEPTORS_LOGGING_TRANSFORM_AST', message: 'AST heuristic detected @UseInterceptors logging/transform usage in backend runtime code.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasSensitiveLogCall, ruleId: 'heuristics.ts.no-sensitive-log.ast', code: 'HEURISTICS_NO_SENSITIVE_LOG_AST', message: 'AST heuristic detected sensitive data emitted to backend logs.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasCorrelationIdsPattern, ruleId: 'heuristics.ts.correlation-ids.ast', code: 'HEURISTICS_CORRELATION_IDS_AST', message: 'AST heuristic detected correlation IDs propagation in backend runtime code.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasCorsConfiguredPattern, ruleId: 'heuristics.ts.cors-configured.ast', code: 'HEURISTICS_CORS_CONFIGURED_AST', message: 'AST heuristic detected backend CORS configuration with allowed origins.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasValidationPipeGlobalPattern, ruleId: 'heuristics.ts.validationpipe-global.ast', code: 'HEURISTICS_VALIDATIONPIPE_GLOBAL_AST', message: 'AST heuristic detected global ValidationPipe configuration with whitelist enabled.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasApiVersioningPattern, ruleId: 'heuristics.ts.versionado-api-v1-api-v2.ast', code: 'HEURISTICS_VERSIONADO_API_V1_API_V2_AST', message: 'AST heuristic detected backend API versioning through versioned NestJS controllers.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasValidationConfigPattern, ruleId: 'heuristics.ts.validation-config.ast', code: 'HEURISTICS_VALIDATION_CONFIG_AST', message: 'AST heuristic detected backend config validation in ConfigModule.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasClassValidatorDecoratorsPattern, ruleId: 'heuristics.ts.class-validator-decorators.ast', code: 'HEURISTICS_CLASS_VALIDATOR_DECORATORS_AST', message: 'AST heuristic detected class-validator decorator usage in backend DTOs.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasClassTransformerDecoratorsPattern, ruleId: 'heuristics.ts.class-transformer-decorators.ast', code: 'HEURISTICS_CLASS_TRANSFORMER_DECORATORS_AST', message: 'AST heuristic detected class-transformer decorator usage in backend DTOs.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasInputValidationPattern, ruleId: 'heuristics.ts.input-validation-siempre-validar-con-dtos.ast', code: 'HEURISTICS_INPUT_VALIDATION_SIEMPRE_VALIDAR_CON_DTOS_AST', message: 'AST heuristic detected backend controller input DTO validation through typed NestJS route parameters.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasNestedValidationPattern, ruleId: 'heuristics.ts.nested-validation-validatenested-type.ast', code: 'HEURISTICS_NESTED_VALIDATION_VALIDATENESTED_TYPE_AST', message: 'AST heuristic detected backend nested DTO validation through @ValidateNested() and @Type().', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasDtoBoundaryPattern, ruleId: 'heuristics.ts.dtos-en-boundaries-validacio-n-en-entrada-salida.ast', code: 'HEURISTICS_DTOS_EN_BOUNDARIES_VALIDACIO_N_EN_ENTRADA_SALIDA_AST', message: 'AST heuristic detected backend DTO boundary classes with explicit contract boundaries.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasSeparatedDtoPattern, ruleId: 'heuristics.ts.dtos-separados-createorderdto-updateorderdto-orderresponsedto.ast', code: 'HEURISTICS_DTOS_SEPARADOS_CREATEORDERDTO_UPDATEORDERDTO_ORDERRESPONSEDTO_AST', message: 'AST heuristic detected backend DTO classes split into create, update and response contracts.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasBackendReturnDtosExposureUsage, locateLines: TS.findBackendReturnDtosExposureLines, ruleId: 'heuristics.ts.return-dtos-no-exponer-entidades-directamente.ast', code: 'HEURISTICS_TS_RETURN_DTOS_NO_EXPONER_ENTIDADES_DIRECTAMENTE_AST', message: 'AST heuristic detected backend code returning entities directly instead of DTOs.', pathCheck: (path) => path.startsWith('apps/backend/'), excludePaths: [isTestPath] },
  { detect: TS.hasBackendCriticalTransactionsUsage, locateLines: TS.findBackendCriticalTransactionsLines, ruleId: 'heuristics.ts.transacciones-para-operaciones-cri-ticas.ast', code: 'HEURISTICS_TS_TRANSACCIONES_PARA_OPERACIONES_CRI_TICAS_AST', message: 'AST heuristic detected backend transaction usage for critical operations.', pathCheck: (path) => path.startsWith('apps/backend/'), excludePaths: [isTestPath] },
  { detect: TS.hasBackendMultiTableTransactionsUsage, locateLines: TS.findBackendMultiTableTransactionsLines, ruleId: 'heuristics.ts.transacciones-para-operaciones-multi-tabla.ast', code: 'HEURISTICS_TS_TRANSACCIONES_PARA_OPERACIONES_MULTI_TABLA_AST', message: 'AST heuristic detected backend transaction usage for multi-table operations.', pathCheck: (path) => path.startsWith('apps/backend/'), excludePaths: [isTestPath] },
  { detect: TS.hasPrometheusMetricsPattern, ruleId: 'heuristics.ts.prometheus-prom-client.ast', code: 'HEURISTICS_PROMETHEUS_PROM_CLIENT_AST', message: 'AST heuristic detected Prometheus metrics instrumentation via prom-client.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasPasswordHashingPattern, ruleId: 'heuristics.ts.password-hashing-bcrypt-salt-rounds-10.ast', code: 'HEURISTICS_PASSWORD_HASHING_BCRYPT_SALT_ROUNDS_10_AST', message: 'AST heuristic detected weak bcrypt salt rounds.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasRateLimitingThrottlerPattern, ruleId: 'heuristics.ts.rate-limiting-throttler.ast', code: 'HEURISTICS_RATE_LIMITING_THROTTLER_AST', message: 'AST heuristic detected NestJS throttler rate limiting.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasWinstonStructuredLoggerPattern, ruleId: 'heuristics.ts.winston-structured-json-logger.ast', code: 'HEURISTICS_WINSTON_STRUCTURED_JSON_LOGGER_AST', message: 'AST heuristic detected Winston structured JSON logger usage.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasErrorLoggingFullContextPattern, ruleId: 'heuristics.ts.error-logging-full-context.ast', code: 'HEURISTICS_ERROR_LOGGING_FULL_CONTEXT_AST', message: 'AST heuristic detected backend error logging without full context.', pathCheck: (path) => path.startsWith('apps/backend/') },
  { detect: TS.hasLargeClassDeclaration, ruleId: 'heuristics.ts.god-class-large-class.ast', code: 'HEURISTICS_GOD_CLASS_LARGE_CLASS_AST', message: 'AST heuristic detected God Class candidate by mixed responsibility nodes in a single class declaration.' },
  { detect: TS.hasReactClassComponentUsage, locateLines: TS.findReactClassComponentLines, ruleId: 'heuristics.ts.react-class-component.ast', code: 'HEURISTICS_TS_REACT_CLASS_COMPONENT_AST', message: 'AST heuristic detected React class component usage in frontend production code where functional components are required.', pathCheck: isTypeScriptFrontendPath },
  { detect: TS.hasSingletonPattern, ruleId: 'heuristics.ts.singleton-pattern.ast', code: 'HEURISTICS_SINGLETON_PATTERN_AST', message: 'AST heuristic detected singleton pattern usage in a class declaration.' },
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
  readonly ruleId: string;
  readonly code: string;
  readonly message: string;
};

const textDetectorRegistry: ReadonlyArray<TextDetectorRegistryEntry> = [
  // iOS
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftForceUnwrap, ruleId: 'heuristics.ios.force-unwrap.ast', code: 'HEURISTICS_IOS_FORCE_UNWRAP_AST', message: 'AST heuristic detected force unwrap usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftAnyViewUsage, ruleId: 'heuristics.ios.anyview.ast', code: 'HEURISTICS_IOS_ANYVIEW_AST', message: 'AST heuristic detected AnyView usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftForceTryUsage, ruleId: 'heuristics.ios.force-try.ast', code: 'HEURISTICS_IOS_FORCE_TRY_AST', message: 'AST heuristic detected force try usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftForceCastUsage, ruleId: 'heuristics.ios.force-cast.ast', code: 'HEURISTICS_IOS_FORCE_CAST_AST', message: 'AST heuristic detected force cast usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath, isApprovedIOSBridgePath], detect: TextIOS.hasSwiftCallbackStyleSignature, ruleId: 'heuristics.ios.callback-style.ast', code: 'HEURISTICS_IOS_CALLBACK_STYLE_AST', message: 'AST heuristic detected callback-style API signature outside bridge layers.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftDispatchQueueUsage, ruleId: 'heuristics.ios.dispatchqueue.ast', code: 'HEURISTICS_IOS_DISPATCHQUEUE_AST', message: 'AST heuristic detected DispatchQueue usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftDispatchGroupUsage, ruleId: 'heuristics.ios.dispatchgroup.ast', code: 'HEURISTICS_IOS_DISPATCHGROUP_AST', message: 'AST heuristic detected DispatchGroup usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftDispatchSemaphoreUsage, ruleId: 'heuristics.ios.dispatchsemaphore.ast', code: 'HEURISTICS_IOS_DISPATCHSEMAPHORE_AST', message: 'AST heuristic detected DispatchSemaphore usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftOperationQueueUsage, ruleId: 'heuristics.ios.operation-queue.ast', code: 'HEURISTICS_IOS_OPERATION_QUEUE_AST', message: 'AST heuristic detected OperationQueue usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftTaskDetachedUsage, ruleId: 'heuristics.ios.task-detached.ast', code: 'HEURISTICS_IOS_TASK_DETACHED_AST', message: 'AST heuristic detected Task.detached usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUncheckedSendableUsage, ruleId: 'heuristics.ios.unchecked-sendable.ast', code: 'HEURISTICS_IOS_UNCHECKED_SENDABLE_AST', message: 'AST heuristic detected @unchecked Sendable usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftPreconcurrencyUsage, ruleId: 'heuristics.ios.preconcurrency.ast', code: 'HEURISTICS_IOS_PRECONCURRENCY_AST', message: 'AST heuristic detected @preconcurrency usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNonisolatedUnsafeUsage, ruleId: 'heuristics.ios.nonisolated-unsafe.ast', code: 'HEURISTICS_IOS_NONISOLATED_UNSAFE_AST', message: 'AST heuristic detected nonisolated(unsafe) usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftAssumeIsolatedUsage, ruleId: 'heuristics.ios.assume-isolated.ast', code: 'HEURISTICS_IOS_ASSUME_ISOLATED_AST', message: 'AST heuristic detected assumeIsolated usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftObservableObjectUsage, ruleId: 'heuristics.ios.observable-object.ast', code: 'HEURISTICS_IOS_OBSERVABLE_OBJECT_AST', message: 'AST heuristic detected ObservableObject usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftLegacySwiftUiObservableWrapperUsage, ruleId: 'heuristics.ios.legacy-swiftui-observable-wrapper.ast', code: 'HEURISTICS_IOS_LEGACY_SWIFTUI_OBSERVABLE_WRAPPER_AST', message: 'AST heuristic detected @StateObject/@ObservedObject usage in a modern SwiftUI path.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftPassedValueStateWrapperUsage, ruleId: 'heuristics.ios.passed-value-state-wrapper.ast', code: 'HEURISTICS_IOS_PASSED_VALUE_STATE_WRAPPER_AST', message: 'AST heuristic detected a passed value stored as @State/@StateObject via init wrapper ownership.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftStateWrapperWithoutPrivateUsage, ruleId: 'heuristics.ios.swiftui.state-wrapper-private.ast', code: 'HEURISTICS_IOS_SWIFTUI_STATE_WRAPPER_PRIVATE_AST', message: 'AST heuristic detected @State/@StateObject usage in a SwiftUI View without private visibility.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftForEachIndicesUsage, ruleId: 'heuristics.ios.foreach-indices.ast', code: 'HEURISTICS_IOS_FOREACH_INDICES_AST', message: 'AST heuristic detected ForEach(...indices...) usage where stable element identity may be preferred.' },
  { platform: 'ios', pathCheck: isIOSApplicationOrPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftContainsUserFilterUsage, ruleId: 'heuristics.ios.contains-user-filter.ast', code: 'HEURISTICS_IOS_CONTAINS_USER_FILTER_AST', message: 'AST heuristic detected contains() in a user-facing filter where localizedStandardContains() may be preferred.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftGeometryReaderUsage, ruleId: 'heuristics.ios.geometryreader.ast', code: 'HEURISTICS_IOS_GEOMETRYREADER_AST', message: 'AST heuristic detected GeometryReader usage that may be replaceable with modern layout APIs.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftFontWeightBoldUsage, ruleId: 'heuristics.ios.font-weight-bold.ast', code: 'HEURISTICS_IOS_FONT_WEIGHT_BOLD_AST', message: 'AST heuristic detected fontWeight(.bold) usage where bold() may be preferred.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNavigationViewUsage, ruleId: 'heuristics.ios.navigation-view.ast', code: 'HEURISTICS_IOS_NAVIGATION_VIEW_AST', message: 'AST heuristic detected NavigationView usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftForegroundColorUsage, ruleId: 'heuristics.ios.foreground-color.ast', code: 'HEURISTICS_IOS_FOREGROUND_COLOR_AST', message: 'AST heuristic detected foregroundColor usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftCornerRadiusUsage, ruleId: 'heuristics.ios.corner-radius.ast', code: 'HEURISTICS_IOS_CORNER_RADIUS_AST', message: 'AST heuristic detected cornerRadius usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftTabItemUsage, ruleId: 'heuristics.ios.tab-item.ast', code: 'HEURISTICS_IOS_TAB_ITEM_AST', message: 'AST heuristic detected tabItem usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftOnTapGestureUsage, ruleId: 'heuristics.ios.on-tap-gesture.ast', code: 'HEURISTICS_IOS_ON_TAP_GESTURE_AST', message: 'AST heuristic detected onTapGesture usage where Button may be preferred.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftStringFormatUsage, ruleId: 'heuristics.ios.string-format.ast', code: 'HEURISTICS_IOS_STRING_FORMAT_AST', message: 'AST heuristic detected String(format:) usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftScrollViewShowsIndicatorsUsage, ruleId: 'heuristics.ios.scrollview-shows-indicators.ast', code: 'HEURISTICS_IOS_SCROLLVIEW_SHOWS_INDICATORS_AST', message: 'AST heuristic detected ScrollView(showsIndicators: false) usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftSheetIsPresentedUsage, ruleId: 'heuristics.ios.sheet-is-presented.ast', code: 'HEURISTICS_IOS_SHEET_IS_PRESENTED_AST', message: 'AST heuristic detected .sheet(isPresented:) usage where .sheet(item:) may be preferred.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftLegacyOnChangeUsage, ruleId: 'heuristics.ios.legacy-onchange.ast', code: 'HEURISTICS_IOS_LEGACY_ONCHANGE_AST', message: 'AST heuristic detected legacy onChange usage where modern overloads may be preferred.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUIScreenMainBoundsUsage, ruleId: 'heuristics.ios.uiscreen-main-bounds.ast', code: 'HEURISTICS_IOS_UISCREEN_MAIN_BOUNDS_AST', message: 'AST heuristic detected UIScreen.main.bounds usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftLegacyXCTestImportUsage, ruleId: 'heuristics.ios.testing.xctest-import.ast', code: 'HEURISTICS_IOS_TESTING_XCTEST_IMPORT_AST', message: 'AST heuristic detected XCTest-only test usage where Swift Testing may be preferred.' },
  { platform: 'ios', pathCheck: isIOSSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftModernizableXCTestSuiteUsage, ruleId: 'heuristics.ios.testing.xctest-suite-modernizable.ast', code: 'HEURISTICS_IOS_TESTING_XCTEST_SUITE_MODERNIZABLE_AST', message: 'AST heuristic detected XCTestCase/test... suite that may be modernizable to Swift Testing with import Testing and @Test.' },
  { platform: 'ios', pathCheck: isIOSSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftXCTestAssertionUsage, ruleId: 'heuristics.ios.testing.xctassert.ast', code: 'HEURISTICS_IOS_TESTING_XCTASSERT_AST', message: 'AST heuristic detected XCTest assertion usage where #expect may be preferred.' },
  { platform: 'ios', pathCheck: isIOSSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftXCTUnwrapUsage, ruleId: 'heuristics.ios.testing.xctunwrap.ast', code: 'HEURISTICS_IOS_TESTING_XCTUNWRAP_AST', message: 'AST heuristic detected XCTUnwrap usage where #require may be preferred.' },
  { platform: 'ios', pathCheck: isIOSSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftWaitForExpectationsUsage, ruleId: 'heuristics.ios.testing.wait-for-expectations.ast', code: 'HEURISTICS_IOS_TESTING_WAIT_FOR_EXPECTATIONS_AST', message: 'AST heuristic detected wait(for:)/waitForExpectations usage where await fulfillment(of:) may be preferred.' },
  { platform: 'ios', pathCheck: isIOSSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftLegacyExpectationDescriptionUsage, ruleId: 'heuristics.ios.testing.legacy-expectation-description.ast', code: 'HEURISTICS_IOS_TESTING_LEGACY_EXPECTATION_DESCRIPTION_AST', message: 'AST heuristic detected expectation(description:) usage without modern fulfillment/confirmation flow.' },
  { platform: 'ios', pathCheck: isIOSSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftMixedTestingFrameworksUsage, ruleId: 'heuristics.ios.testing.mixed-frameworks.ast', code: 'HEURISTICS_IOS_TESTING_MIXED_FRAMEWORKS_AST', message: 'AST heuristic detected XCTestCase and Swift Testing markers mixed in the same test file without explicit compatibility reason.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNSManagedObjectBoundaryUsage, ruleId: 'heuristics.ios.core-data.nsmanagedobject-boundary.ast', code: 'HEURISTICS_IOS_CORE_DATA_NSMANAGEDOBJECT_BOUNDARY_AST', message: 'AST heuristic detected NSManagedObject in a shared boundary.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNSManagedObjectAsyncBoundaryUsage, ruleId: 'heuristics.ios.core-data.nsmanagedobject-async-boundary.ast', code: 'HEURISTICS_IOS_CORE_DATA_NSMANAGEDOBJECT_ASYNC_BOUNDARY_AST', message: 'AST heuristic detected NSManagedObject in an async boundary.' },
  { platform: 'ios', pathCheck: isIOSApplicationOrPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftCoreDataLayerLeakUsage, ruleId: 'heuristics.ios.core-data.layer-leak.ast', code: 'HEURISTICS_IOS_CORE_DATA_LAYER_LEAK_AST', message: 'AST heuristic detected Core Data APIs leaking into application/presentation code.' },
  { platform: 'ios', pathCheck: isIOSApplicationOrPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNSManagedObjectStateLeakUsage, ruleId: 'heuristics.ios.core-data.nsmanagedobject-state-leak.ast', code: 'HEURISTICS_IOS_CORE_DATA_NSMANAGEDOBJECT_STATE_LEAK_AST', message: 'AST heuristic detected NSManagedObject leaking into SwiftUI state or a ViewModel.' },

  // Android
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinThreadSleepCall, ruleId: 'heuristics.android.thread-sleep.ast', code: 'HEURISTICS_ANDROID_THREAD_SLEEP_AST', message: 'AST heuristic detected Thread.sleep usage in production Kotlin code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinGlobalScopeUsage, ruleId: 'heuristics.android.globalscope.ast', code: 'HEURISTICS_ANDROID_GLOBAL_SCOPE_AST', message: 'AST heuristic detected GlobalScope coroutine usage in production Kotlin code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinRunBlockingUsage, ruleId: 'heuristics.android.run-blocking.ast', code: 'HEURISTICS_ANDROID_RUN_BLOCKING_AST', message: 'AST heuristic detected runBlocking usage in production Kotlin code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidCoroutineCallbackUsage, ruleId: 'heuristics.android.coroutines-async-await-no-callbacks.ast', code: 'HEURISTICS_ANDROID_COROUTINES_ASYNC_AWAIT_NO_CALLBACKS_AST', message: 'AST heuristic detected callback-based asynchronous work in Android production code where coroutines or Flow should be used.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidAsyncAwaitParallelismUsage, ruleId: 'heuristics.android.async-await-paralelismo.ast', code: 'HEURISTICS_ANDROID_ASYNC_AWAIT_PARALELISMO_AST', message: 'AST heuristic detected async/await parallelism in Android production code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidSuspendFunctionsApiServiceUsage, ruleId: 'heuristics.android.suspend-functions-en-api-service.ast', code: 'HEURISTICS_ANDROID_SUSPEND_FUNCTIONS_EN_API_SERVICE_AST', message: 'AST heuristic detected suspend functions in Android API service production code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidSuspendFunctionsAsyncUsage, ruleId: 'heuristics.android.suspend-functions-para-operaciones-async.ast', code: 'HEURISTICS_ANDROID_SUSPEND_FUNCTIONS_PARA_OPERACIONES_ASYNC_AST', message: 'AST heuristic detected suspend functions in Android production code where async operations should remain explicit.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidDaoSuspendFunctionsUsage, ruleId: 'heuristics.android.dao-data-access-objects-con-suspend-functions.ast', code: 'HEURISTICS_ANDROID_DAO_DATA_ACCESS_OBJECTS_CON_SUSPEND_FUNCTIONS_AST', message: 'AST heuristic detected suspend functions in Android DAO production code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidTransactionUsage, ruleId: 'heuristics.android.transaction-para-operaciones-multi-query.ast', code: 'HEURISTICS_ANDROID_TRANSACTION_PARA_OPERACIONES_MULTI_QUERY_AST', message: 'AST heuristic detected @Transaction usage in Android DAO production code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidStateFlowUsage, ruleId: 'heuristics.android.stateflow-estado-mutable-observable.ast', code: 'HEURISTICS_ANDROID_STATEFLOW_ESTADO_MUTABLE_OBSERVABLE_AST', message: 'AST heuristic detected StateFlow usage in Android ViewModel production code where observable state should remain explicit.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidSingleSourceOfTruthUsage, ruleId: 'heuristics.android.single-source-of-truth-viewmodel-es-la-fuente.ast', code: 'HEURISTICS_ANDROID_SINGLE_SOURCE_OF_TRUTH_VIEWMODEL_ES_LA_FUENTE_AST', message: 'AST heuristic detected single source of truth state exposure in Android ViewModel production code where observable state should remain explicit and owned by one ViewModel.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidSharedFlowUsage, ruleId: 'heuristics.android.sharedflow-hot-stream-puede-no-tener-valor-para-eventos.ast', code: 'HEURISTICS_ANDROID_SHAREDFLOW_HOT_STREAM_PUEDE_NO_TENER_VALOR_PARA_EVENTOS_AST', message: 'AST heuristic detected SharedFlow usage in Android production code where events should remain explicit.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidFlowBuilderUsage, ruleId: 'heuristics.android.flow-builders-flow-emit-flowof-asflow.ast', code: 'HEURISTICS_ANDROID_FLOW_BUILDERS_FLOW_EMIT_FLOWOF_ASFLOW_AST', message: 'AST heuristic detected Flow builder usage in Android production code where reactive streams should remain explicit.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidFlowCollectUsage, ruleId: 'heuristics.android.collect-terminal-operator-para-consumir-flow.ast', code: 'HEURISTICS_ANDROID_COLLECT_TERMINAL_OPERATOR_PARA_CONSUMIR_FLOW_AST', message: 'AST heuristic detected Flow terminal operator usage in Android production code where streams should be consumed explicitly.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidCollectAsStateUsage, ruleId: 'heuristics.android.collect-as-state-consumir-flow-en-compose.ast', code: 'HEURISTICS_ANDROID_COLLECT_AS_STATE_CONSUMIR_FLOW_EN_COMPOSE_AST', message: 'AST heuristic detected collectAsState usage in Android Compose production code where Flow should be observed as UI state.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidRememberUsage, ruleId: 'heuristics.android.remember-evitar-recrear-objetos.ast', code: 'HEURISTICS_ANDROID_REMEMBER_EVITAR_RECREAR_OBJETOS_AST', message: 'AST heuristic detected remember usage in Android Compose production code where objects or values should not be recreated on every recomposition.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidRememberUsage, ruleId: 'heuristics.android.remember-para-mantener-estado-entre-recomposiciones.ast', code: 'HEURISTICS_ANDROID_REMEMBER_PARA_MANTENER_ESTADO_ENTRE_RECOMPOSICIONES_AST', message: 'AST heuristic detected remember usage in Android Compose production code where state should remain stable across recompositions.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidRepositoryPatternUsage, ruleId: 'heuristics.android.repository-pattern-abstraer-acceso-a-datos.ast', code: 'HEURISTICS_ANDROID_REPOSITORY_PATTERN_ABSTRAER_ACCESO_A_DATOS_AST', message: 'AST heuristic detected repository abstraction in Android production code where data access should remain behind a stable boundary.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidDerivedStateOfUsage, ruleId: 'heuristics.android.derivedstateof-ca-lculos-caros-solo-cuando-cambia-input.ast', code: 'HEURISTICS_ANDROID_DERIVEDSTATEOF_CALCULOS_CAROS_SOLO_CUANDO_CAMBIA_INPUT_AST', message: 'AST heuristic detected derivedStateOf usage in Android Compose production code where expensive derived values should only recompute when input changes.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidDerivedStateOfUsage, ruleId: 'heuristics.android.derivedstateof-ca-lculos-derivados-de-state.ast', code: 'HEURISTICS_ANDROID_DERIVEDSTATEOF_CALCULOS_DERIVADOS_DE_STATE_AST', message: 'AST heuristic detected derivedStateOf usage in Android Compose production code where state-derived values should stay explicit and local to Compose.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidLaunchedEffectUsage, ruleId: 'heuristics.android.launchedeffect-side-effects-con-lifecycle.ast', code: 'HEURISTICS_ANDROID_LAUNCHEDEFFECT_SIDE_EFFECTS_CON_LIFECYCLE_AST', message: 'AST heuristic detected LaunchedEffect usage in Android Compose production code where lifecycle-bound side effects should remain explicit.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidLaunchedEffectKeysUsage, ruleId: 'heuristics.android.launchedeffect-keys-controlar-cuando-se-relanza-effect.ast', code: 'HEURISTICS_ANDROID_LAUNCHEDEFFECT_KEYS_CONTROLAR_CUANDO_SE_RELANZA_EFFECT_AST', message: 'AST heuristic detected LaunchedEffect keys usage in Android Compose production code where relaunch keys should remain explicit and stable.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidDisposableEffectUsage, ruleId: 'heuristics.android.disposableeffect-cleanup-cuando-composable-sale-de-composicio-n.ast', code: 'HEURISTICS_ANDROID_DISPOSABLE_EFFECT_CLEANUP_CUANDO_COMPOSABLE_SALE_DE_COMPOSICIO_N_AST', message: 'AST heuristic detected DisposableEffect usage in Android Compose production code where cleanup should run when the composable leaves composition.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidPreviewUsage, ruleId: 'heuristics.android.preview-preview-para-ver-ui-sin-correr-app.ast', code: 'HEURISTICS_ANDROID_PREVIEW_PREVIEW_PARA_VER_UI_SIN_CORRER_APP_AST', message: 'AST heuristic detected @Preview usage in Android Compose production code where UI should be inspectable without running the app.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidAdaptiveLayoutsUsage, ruleId: 'heuristics.android.adaptive-layouts-responsive-design-windowsizeclass.ast', code: 'HEURISTICS_ANDROID_ADAPTIVE_LAYOUTS_RESPONSIVE_DESIGN_WINDOW_SIZE_CLASS_AST', message: 'AST heuristic detected WindowSizeClass usage in Android Compose production code where the layout should adapt to the available window size.' },
  { platform: 'android', pathCheck: isAndroidSourcePath, excludePaths: [isKotlinTestPath, isJavaTestPath], detect: TextAndroid.hasAndroidExistingStructureUsage, ruleId: 'heuristics.android.analizar-estructura-existente-mo-dulos-interfaces-dependencias-gradle.ast', code: 'HEURISTICS_ANDROID_ANALIZAR_ESTRUCTURA_EXISTENTE_MO_DULOS_INTERFACES_DEPENDENCIAS_GRADLE_AST', message: 'AST heuristic detected Android structure usage where existing modules, interfaces and dependencies should be reviewed before introducing changes.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidThemeUsage, ruleId: 'heuristics.android.theme-color-scheme-typography-shapes.ast', code: 'HEURISTICS_ANDROID_THEME_COLOR_SCHEME_TYPOGRAPHY_SHAPES_AST', message: 'AST heuristic detected MaterialTheme usage in Android Compose production code where theme configuration should remain explicit.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidDarkThemeUsage, ruleId: 'heuristics.android.dark-theme-soportar-desde-di-a-1-issystemindarktheme.ast', code: 'HEURISTICS_ANDROID_DARK_THEME_SOPORTAR_DESDE_DI_A_1_ISSYSTEMINDARKTHEME_AST', message: 'AST heuristic detected explicit dark theme support in Android Compose production code where the UI should respect the system color scheme from day one.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidTextScalingUsage, ruleId: 'heuristics.android.text-scaling-soportar-font-scaling-del-sistema.ast', code: 'HEURISTICS_ANDROID_TEXT_SCALING_SOPORTAR_FONT_SCALING_DEL_SISTEMA_AST', message: 'AST heuristic detected text scaling support in Android Compose production code where the UI should respect the system font scale and remain readable with accessibility settings.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidAccessibilityUsage, ruleId: 'heuristics.android.accessibility-semantics-contentdescription.ast', code: 'HEURISTICS_ANDROID_ACCESSIBILITY_SEMANTICS_CONTENTDESCRIPTION_AST', message: 'AST heuristic detected accessibility semantics/contentDescription usage in Android Compose production code where the UI should remain accessible to screen readers and assistive technologies.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidContentDescriptionUsage, ruleId: 'heuristics.android.contentdescription-para-ima-genes-y-botones.ast', code: 'HEURISTICS_ANDROID_CONTENTDESCRIPTION_PARA_IMAGENES_Y_BOTONES_AST', message: 'AST heuristic detected contentDescription usage in Android Compose production code where images and buttons should remain accessible to screen readers and assistive technologies.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidTalkBackUsage, ruleId: 'heuristics.android.talkback-screen-reader-de-android.ast', code: 'HEURISTICS_ANDROID_TALKBACK_SCREEN_READER_DE_ANDROID_AST', message: 'AST heuristic detected TalkBack-related accessibility usage in Android Compose production code where the UI should remain accessible to screen readers.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidRecompositionUsage, ruleId: 'heuristics.android.recomposition-composables-deben-ser-idempotentes.ast', code: 'HEURISTICS_ANDROID_RECOMPOSITION_COMPOSABLES_DEBEN_SER_IDEMPOTENTES_AST', message: 'AST heuristic detected non-idempotent Compose recomposition behavior in Android production code where composables should remain pure during recomposition.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidUiStateUsage, ruleId: 'heuristics.android.uistate-sealed-class-loading-success-error-states.ast', code: 'HEURISTICS_ANDROID_UISTATE_SEALED_CLASS_LOADING_SUCCESS_ERROR_STATES_AST', message: 'AST heuristic detected UiState sealed class usage in Android production code where loading, success, and error states should stay explicit.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidUseCaseUsage, ruleId: 'heuristics.android.use-cases-lo-gica-de-negocio-encapsulada.ast', code: 'HEURISTICS_ANDROID_USE_CASES_LOGICA_DE_NEGOCIO_ENCAPSULADA_AST', message: 'AST heuristic detected Android UseCase usage in production code where business logic should stay encapsulated.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidStateHoistingUsage, ruleId: 'heuristics.android.state-hoisting-elevar-estado-al-nivel-apropiado.ast', code: 'HEURISTICS_ANDROID_STATE_HOISTING_ELEVAR_ESTADO_AL_NIVEL_APROPIADO_AST', message: 'AST heuristic detected state hoisting issues in Android Compose production code where UI state should be elevated to the appropriate owner.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidViewModelUsage, ruleId: 'heuristics.android.viewmodel-androidx-lifecycle-viewmodel.ast', code: 'HEURISTICS_ANDROID_VIEWMODEL_ANDROIDX_LIFECYCLE_VIEWMODEL_AST', message: 'AST heuristic detected AndroidX ViewModel usage in Android production code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidViewModelUsage, ruleId: 'heuristics.android.viewmodel-sobrevive-configuration-changes.ast', code: 'HEURISTICS_ANDROID_VIEWMODEL_SOBREVIVE_CONFIGURATION_CHANGES_AST', message: 'AST heuristic detected AndroidX ViewModel usage in Android production code that should survive configuration changes.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinForceUnwrapUsage, ruleId: 'heuristics.android.force-unwrap.ast', code: 'HEURISTICS_ANDROID_FORCE_UNWRAP_AST', message: 'AST heuristic detected Kotlin force unwrap (!!) usage in production code.' },
  { platform: 'android', pathCheck: isAndroidJavaPath, excludePaths: [isJavaTestPath], detect: TextAndroid.hasAndroidJavaSourceCode, ruleId: 'heuristics.android.java-source.ast', code: 'HEURISTICS_ANDROID_JAVA_SOURCE_AST', message: 'AST heuristic detected Java source in Android production code where Kotlin is required for new code.' },
  { platform: 'android', pathCheck: isAndroidSourcePath, excludePaths: [isKotlinTestPath, isJavaTestPath], detect: TextAndroid.hasAndroidAsyncTaskUsage, ruleId: 'heuristics.android.asynctask-deprecated.ast', code: 'HEURISTICS_ANDROID_ASYNCTASK_DEPRECATED_AST', message: 'AST heuristic detected AsyncTask usage in Android production code where Coroutines are required.' },
  { platform: 'android', pathCheck: isAndroidSourcePath, excludePaths: [isKotlinTestPath, isJavaTestPath], detect: TextAndroid.hasAndroidFindViewByIdUsage, ruleId: 'heuristics.android.findviewbyid.ast', code: 'HEURISTICS_ANDROID_FINDVIEWBYID_AST', message: 'AST heuristic detected findViewById usage in Android production code where View Binding or Compose is required.' },
  { platform: 'android', pathCheck: isAndroidSourcePath, excludePaths: [isKotlinTestPath, isJavaTestPath], detect: TextAndroid.hasAndroidRxJavaUsage, ruleId: 'heuristics.android.rxjava-new-code.ast', code: 'HEURISTICS_ANDROID_RXJAVA_NEW_CODE_AST', message: 'AST heuristic detected RxJava usage in Android production code where Flow is required for new code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidDispatcherUsage, ruleId: 'heuristics.android.dispatchers-main-ui-io-network-disk-default-cpu.ast', code: 'HEURISTICS_ANDROID_DISPATCHERS_MAIN_UI_IO_NETWORK_DISK_DEFAULT_CPU_AST', message: 'AST heuristic detected explicit Dispatchers.Main/IO/Default usage in Android production code where dispatcher selection must remain intentional.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidWithContextUsage, ruleId: 'heuristics.android.withcontext-change-dispatcher.ast', code: 'HEURISTICS_ANDROID_WITHCONTEXT_CHANGE_DISPATCHER_AST', message: 'AST heuristic detected withContext usage in Android production code where dispatcher switching is intentional.' },
  { platform: 'android', pathCheck: isAndroidSourcePath, excludePaths: [isKotlinTestPath, isJavaTestPath], detect: TextAndroid.hasAndroidNoConsoleLogUsage, ruleId: 'heuristics.android.no-console-log.ast', code: 'HEURISTICS_ANDROID_NO_CONSOLE_LOG_AST', message: 'AST heuristic detected Android logging usage in production code without a debug-only guard.' },
  { platform: 'android', pathCheck: isAndroidSourcePath, excludePaths: [isKotlinTestPath, isJavaTestPath], detect: TextAndroid.hasAndroidTimberUsage, ruleId: 'heuristics.android.timber-logging-library.ast', code: 'HEURISTICS_ANDROID_TIMBER_LOGGING_LIBRARY_AST', message: 'AST heuristic detected Timber logging usage in Android production code.' },
  { platform: 'android', pathCheck: isAndroidSourcePath, excludePaths: [isKotlinTestPath, isJavaTestPath], detect: TextAndroid.hasAndroidTouchTargetsUsage, ruleId: 'heuristics.android.touch-targets-mi-nimo-48dp.ast', code: 'HEURISTICS_ANDROID_TOUCH_TARGETS_MI_NIMO_48DP_AST', message: 'AST heuristic detected minimum touch target usage in Android production Compose code.' },
  { platform: 'android', pathCheck: isAndroidSourcePath, excludePaths: [isKotlinTestPath, isJavaTestPath], detect: TextAndroid.hasAndroidBuildConfigConstantUsage, ruleId: 'heuristics.android.buildconfig-constantes-en-tiempo-de-compilacio-n.ast', code: 'HEURISTICS_ANDROID_BUILDCONFIG_CONSTANTES_EN_TIEMPO_DE_COMPILACION_AST', message: 'AST heuristic detected Android BuildConfig constant usage in production code.' },
  { platform: 'android', pathCheck: isAndroidSourcePath, excludePaths: [isKotlinTestPath, isJavaTestPath], detect: TextAndroid.hasAndroidHardcodedStringUsage, ruleId: 'heuristics.android.hardcoded-strings.ast', code: 'HEURISTICS_ANDROID_HARDCODED_STRINGS_AST', message: 'AST heuristic detected hardcoded string literal usage in Android production code where strings.xml should be used.' },
  { platform: 'android', pathCheck: isAndroidLocalizedStringsXmlPath, excludePaths: [], detect: TextAndroid.hasAndroidStringsXmlUsage, ruleId: 'heuristics.android.localization-strings-xml-por-idioma-values-es-values-en.ast', code: 'HEURISTICS_ANDROID_LOCALIZATION_STRINGS_XML_POR_IDIOMA_VALUES_ES_VALUES_EN_AST', message: 'AST heuristic detected localized strings.xml resources in Android production code where language-specific text should remain in values-*/strings.xml.' },
  { platform: 'android', pathCheck: isAndroidLocalizedStringsXmlPath, excludePaths: [], detect: TextAndroid.hasAndroidStringFormattingUsage, ruleId: 'heuristics.android.string-formatting-1-s-2-d-para-argumentos.ast', code: 'HEURISTICS_ANDROID_STRING_FORMATTING_1_S_2_D_PARA_ARGUMENTOS_AST', message: 'AST heuristic detected positional string formatting placeholders in Android strings.xml resources where argument order should remain explicit and translation-safe.' },
  { platform: 'android', pathCheck: isAndroidLocalizedPluralsXmlPath, excludePaths: [], detect: TextAndroid.hasAndroidPluralsXmlUsage, ruleId: 'heuristics.android.plurals-values-plurals-xml.ast', code: 'HEURISTICS_ANDROID_PLURALS_VALUES_PLURALS_XML_AST', message: 'AST heuristic detected plurals.xml resources in Android production code where quantity strings should remain explicit.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidSingletonUsage, ruleId: 'heuristics.android.no-singleton.ast', code: 'HEURISTICS_ANDROID_NO_SINGLETON_AST', message: 'AST heuristic detected Kotlin singleton object or companion singleton holder usage in Android production code where Hilt or Dagger DI should be used.' },
  { platform: 'android', pathCheck: isAndroidGradlePath, excludePaths: [], detect: TextAndroid.hasAndroidHiltDependencyUsage, ruleId: 'heuristics.android.hilt-com-google-dagger-hilt-android.ast', code: 'HEURISTICS_ANDROID_HILT_COM_GOOGLE_DAGGER_HILT_ANDROID_AST', message: 'AST heuristic detected Hilt Gradle dependency usage in Android build files.' },
  { platform: 'android', pathCheck: isAndroidInstrumentedTestPath, excludePaths: [], detect: TextAndroid.hasAndroidInstrumentedTestUsage, ruleId: 'heuristics.android.androidtest-instrumented-tests-device-emulator.ast', code: 'HEURISTICS_ANDROID_ANDROIDTEST_INSTRUMENTED_TESTS_DEVICE_EMULATOR_AST', message: 'AST heuristic detected Android instrumented tests in androidTest/ where device/emulator coverage should remain explicit.' },
  { platform: 'android', pathCheck: isKotlinTestPath, excludePaths: [], detect: TextAndroid.hasAndroidAaaPatternUsage, ruleId: 'heuristics.android.aaa-pattern-arrange-act-assert.ast', code: 'HEURISTICS_ANDROID_AAA_PATTERN_ARRANGE_ACT_ASSERT_AST', message: 'AST heuristic detected AAA test structure in Android tests where Arrange, Act, and Assert should remain explicit.' },
  { platform: 'android', pathCheck: isKotlinTestPath, excludePaths: [], detect: TextAndroid.hasAndroidGivenWhenThenUsage, ruleId: 'heuristics.android.given-when-then-bdd-style.ast', code: 'HEURISTICS_ANDROID_GIVEN_WHEN_THEN_BDD_STYLE_AST', message: 'AST heuristic detected Given-When-Then test structure in Android tests where behavior should remain explicit.' },
  { platform: 'android', pathCheck: isAndroidJvmTestPath, excludePaths: [], detect: TextAndroid.hasAndroidJvmUnitTestUsage, ruleId: 'heuristics.android.test-unit-tests-jvm.ast', code: 'HEURISTICS_ANDROID_TEST_UNIT_TESTS_JVM_AST', message: 'AST heuristic detected JVM unit tests in Android test/ source set where local unit tests should remain explicit.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidHiltFrameworkUsage, ruleId: 'heuristics.android.hilt-di-framework-no-manual-factories.ast', code: 'HEURISTICS_ANDROID_HILT_DI_FRAMEWORK_NO_MANUAL_FACTORIES_AST', message: 'AST heuristic detected Hilt DI framework usage instead of manual factories in Android production code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidHiltAndroidAppUsage, ruleId: 'heuristics.android.hiltandroidapp-application-class.ast', code: 'HEURISTICS_ANDROID_HILTANDROIDAPP_APPLICATION_CLASS_AST', message: 'AST heuristic detected @HiltAndroidApp usage in Android production code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidAndroidEntryPointUsage, ruleId: 'heuristics.android.androidentrypoint-activity-fragment-viewmodel.ast', code: 'HEURISTICS_ANDROID_ANDROIDENTRYPOINT_ACTIVITY_FRAGMENT_VIEWMODEL_AST', message: 'AST heuristic detected @AndroidEntryPoint usage in Android production code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidInjectConstructorUsage, ruleId: 'heuristics.android.inject-constructor-constructor-injection.ast', code: 'HEURISTICS_ANDROID_INJECT_CONSTRUCTOR_CONSTRUCTOR_INJECTION_AST', message: 'AST heuristic detected @Inject constructor usage in Android production code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidModuleInstallInUsage, ruleId: 'heuristics.android.module-installin-provide-dependencies.ast', code: 'HEURISTICS_ANDROID_MODULE_INSTALLIN_PROVIDE_DEPENDENCIES_AST', message: 'AST heuristic detected @Module + @InstallIn usage in Android production code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidBindsUsage, ruleId: 'heuristics.android.binds-para-implementaciones-de-interfaces-ma-s-eficiente.ast', code: 'HEURISTICS_ANDROID_BINDS_PARA_IMPLEMENTACIONES_DE_INTERFACES_MA_S_EFICIENTE_AST', message: 'AST heuristic detected @Binds usage in Android production code where interface bindings should remain explicit and efficient.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidProvidesUsage, ruleId: 'heuristics.android.provides-para-interfaces-o-third-party.ast', code: 'HEURISTICS_ANDROID_PROVIDES_PARA_INTERFACES_O_THIRD_PARTY_AST', message: 'AST heuristic detected @Provides usage in Android production code where interfaces or third-party bindings should remain explicit.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidViewModelScopeUsage, ruleId: 'heuristics.android.viewmodelscope-scope-de-viewmodel-cancelado-automa-ticamente.ast', code: 'HEURISTICS_ANDROID_VIEWMODELSCOPE_SCOPE_DE_VIEWMODEL_CANCELADO_AUTOMATICAMENTE_AST', message: 'AST heuristic detected viewModelScope usage in Android production code where coroutine work should remain tied to the ViewModel lifecycle.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidAnalyticsUsage, ruleId: 'heuristics.android.analytics-firebase-analytics-o-custom.ast', code: 'HEURISTICS_ANDROID_ANALYTICS_FIREBASE_ANALYTICS_O_CUSTOM_AST', message: 'AST heuristic detected analytics tracking usage in Android production code where app instrumentation should remain explicit.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidProfilerUsage, ruleId: 'heuristics.android.android-profiler-cpu-memory-network-profiling.ast', code: 'HEURISTICS_ANDROID_ANDROID_PROFILER_CPU_MEMORY_NETWORK_PROFILING_AST', message: 'AST heuristic detected Android profiling instrumentation in production code where CPU, memory, and trace capture should remain explicit.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidAppStartupUsage, ruleId: 'heuristics.android.app-startup-androidx-startup-para-lazy-init.ast', code: 'HEURISTICS_ANDROID_APP_STARTUP_ANDROIDX_STARTUP_PARA_LAZY_INIT_AST', message: 'AST heuristic detected androidx.startup Initializer usage in Android production code where app initialization should remain lazy and explicit.' },
  { platform: 'android', pathCheck: isAndroidInstrumentedTestPath, excludePaths: [], detect: TextAndroid.hasAndroidBaselineProfilesUsage, ruleId: 'heuristics.android.baseline-profiles-optimizacio-n-de-startup.ast', code: 'HEURISTICS_ANDROID_BASELINE_PROFILES_OPTIMIZACION_DE_STARTUP_AST', message: 'AST heuristic detected BaselineProfileRule usage in Android benchmark or instrumented test code where startup optimization should remain explicit.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidSkipRecompositionUsage, ruleId: 'heuristics.android.skip-recomposition-para-metros-inmutables-o-estables.ast', code: 'HEURISTICS_ANDROID_SKIP_RECOMPOSITION_PARA_METROS_INMUTABLES_O_ESTABLES_AST', message: 'AST heuristic detected stable or immutable Compose parameters in Android production code where recomposition should be skippable.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidStabilityUsage, ruleId: 'heuristics.android.stability-composables-estables-recomponen-menos.ast', code: 'HEURISTICS_ANDROID_STABILITY_COMPOSABLES_ESTABLES_RECOMPONEN_MENOS_AST', message: 'AST heuristic detected stable or immutable Compose model usage in Android production code where Compose recomposition should remain predictable.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidViewModelScopedUsage, ruleId: 'heuristics.android.viewmodelscoped-para-dependencias-de-viewmodel.ast', code: 'HEURISTICS_ANDROID_VIEWMODELSCOPED_PARA_DEPENDENCIAS_DE_VIEWMODEL_AST', message: 'AST heuristic detected @ViewModelScoped usage in Android production code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidCoroutineTryCatchUsage, ruleId: 'heuristics.android.try-catch-manejo-de-errores-en-coroutines.ast', code: 'HEURISTICS_ANDROID_TRY_CATCH_MANEJO_DE_ERRORES_EN_COROUTINES_AST', message: 'AST heuristic detected try/catch usage in Android coroutine code where error handling must remain explicit.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidSupervisorScopeUsage, ruleId: 'heuristics.android.supervisorscope-errores-no-cancelan-otros-jobs.ast', code: 'HEURISTICS_ANDROID_SUPERVISORSCOPE_ERRORES_NO_CANCELAN_OTROS_JOBS_AST', message: 'AST heuristic detected supervisorScope usage in Android coroutine code where sibling jobs should remain isolated.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasAndroidWorkManagerBackgroundTaskUsage, ruleId: 'heuristics.android.workmanager-background-tasks.ast', code: 'HEURISTICS_ANDROID_WORKMANAGER_BACKGROUND_TASKS_AST', message: 'AST heuristic detected WorkManager worker usage in Android production code where background tasks should remain explicit.' },
  { platform: 'android', pathCheck: isAndroidVersionCatalogPath, excludePaths: [], detect: TextAndroid.hasAndroidVersionCatalogUsage, ruleId: 'heuristics.android.version-catalogs-libs-versions-toml-para-dependencias.ast', code: 'HEURISTICS_ANDROID_VERSION_CATALOGS_LIBS_VERSIONS_TOML_PARA_DEPENDENCIAS_AST', message: 'AST heuristic detected Android libs.versions.toml usage in dependency management files where version catalogs should remain explicit.' },
  { platform: 'android', pathCheck: isAndroidGradlePath, excludePaths: [], detect: TextAndroid.hasAndroidWorkManagerDependencyUsage, ruleId: 'heuristics.android.workmanager-androidx-work-work-runtime-ktx.ast', code: 'HEURISTICS_ANDROID_WORKMANAGER_ANDROIDX_WORK_WORK_RUNTIME_KTX_AST', message: 'AST heuristic detected WorkManager Gradle dependency usage in Android build files.' },
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
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: entry.ruleId,
            code: entry.code,
            message: entry.message,
            filePath: fileFact.path,
          })
        );
      }
    }

    if (params.detectedPlatforms.ios?.detected && isIOSSwiftPath(fileFact.path)) {
      if (isSwiftTestPath(fileFact.path)) {
        const semanticTestSrpMatch = TextIOS.findSwiftXCTestSrpMatch(fileFact.content);
        if (semanticTestSrpMatch) {
          heuristicFacts.push(
            createHeuristicFact({
              ruleId: 'heuristics.ios.solid.srp.presentation-mixed-responsibilities.ast',
              code: 'HEURISTICS_IOS_SOLID_SRP_XCTEST_MIXED_RESPONSIBILITIES_AST',
              message:
                'Semantic iOS SRP heuristic detected an XCTestCase suite mixing multiple responsibilities.',
              filePath: fileFact.path,
              lines: semanticTestSrpMatch.lines,
              severity: 'CRITICAL',
              primary_node: semanticTestSrpMatch.primary_node,
              related_nodes: semanticTestSrpMatch.related_nodes,
              why: semanticTestSrpMatch.why,
              impact: semanticTestSrpMatch.impact,
              expected_fix: semanticTestSrpMatch.expected_fix,
            })
          );
        }
      }

      if (!isSwiftTestPath(fileFact.path)) {
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
      isAndroidKotlinPath(fileFact.path) &&
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

      const semanticComposableMatch = TextAndroid.findAndroidComposableFunctionMatch(fileFact.content);
      if (semanticComposableMatch) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.android.composable-functions-composable-para-ui.ast',
            code: 'HEURISTICS_ANDROID_COMPOSABLE_FUNCTIONS_COMPOSABLE_PARA_UI_AST',
            message:
              'Semantic Android Compose heuristic detected @Composable UI functions in production code.',
            filePath: fileFact.path,
            lines: semanticComposableMatch.lines,
            severity: 'WARN',
            primary_node: semanticComposableMatch.primary_node,
            related_nodes: semanticComposableMatch.related_nodes,
            why: semanticComposableMatch.why,
            impact: semanticComposableMatch.impact,
            expected_fix: semanticComposableMatch.expected_fix,
          })
        );
      }

      const semanticArgumentsMatch = TextAndroid.findAndroidArgumentsMatch(fileFact.content);
      if (semanticArgumentsMatch) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.android.arguments-pasar-datos-entre-pantallas.ast',
            code: 'HEURISTICS_ANDROID_ARGUMENTS_PASAR_DATOS_ENTRE_PANTALLAS_AST',
            message:
              'Semantic Android navigation heuristic detected explicit arguments passed between screens.',
            filePath: fileFact.path,
            lines: semanticArgumentsMatch.lines,
            severity: 'WARN',
            primary_node: semanticArgumentsMatch.primary_node,
            related_nodes: semanticArgumentsMatch.related_nodes,
            why: semanticArgumentsMatch.why,
            impact: semanticArgumentsMatch.impact,
            expected_fix: semanticArgumentsMatch.expected_fix,
          })
        );
      }

      const semanticSingleActivityMatch = TextAndroid.findAndroidSingleActivityComposeShellMatch(
        fileFact.content
      );
      if (semanticSingleActivityMatch) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.android.single-activity-multiples-composables-fragments-no-activities.ast',
            code: 'HEURISTICS_ANDROID_SINGLE_ACTIVITY_MULTIPLES_COMPOSABLES_FRAGMENTS_NO_ACTIVITIES_AST',
            message:
              'Semantic Android Compose heuristic detected a single Activity compose shell in production code.',
            filePath: fileFact.path,
            lines: semanticSingleActivityMatch.lines,
            severity: 'WARN',
            primary_node: semanticSingleActivityMatch.primary_node,
            related_nodes: semanticSingleActivityMatch.related_nodes,
            why: semanticSingleActivityMatch.why,
            impact: semanticSingleActivityMatch.impact,
            expected_fix: semanticSingleActivityMatch.expected_fix,
          })
        );
      }

      const semanticGodActivityMatch = TextAndroid.findAndroidGodActivityMatch(fileFact.content);
      if (semanticGodActivityMatch) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.android.god-activities-single-activity-composables.ast',
            code: 'HEURISTICS_ANDROID_GOD_ACTIVITIES_SINGLE_ACTIVITY_COMPOSABLES_AST',
            message:
              'Semantic Android Compose heuristic detected an Activity that concentrates Compose shell and composables in the same file.',
            filePath: fileFact.path,
            lines: semanticGodActivityMatch.lines,
            severity: 'ERROR',
            primary_node: semanticGodActivityMatch.primary_node,
            related_nodes: semanticGodActivityMatch.related_nodes,
            why: semanticGodActivityMatch.why,
            impact: semanticGodActivityMatch.impact,
            expected_fix: semanticGodActivityMatch.expected_fix,
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
        plugins: ['typescript', 'jsx', 'decorators-legacy'],
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
            entry.ruleId === 'heuristics.ts.console-log.ast'
              ? TS.findConsoleLogCallMatch(ast)
              : entry.ruleId === 'heuristics.ts.explicit-any.ast'
                ? TS.findExplicitAnyTypeMatch(ast)
              : entry.ruleId === 'heuristics.ts.clean-architecture.ast'
                ? TS.findCleanArchitectureMatch(ast)
              : entry.ruleId === 'heuristics.ts.production-mock.ast'
                ? TS.findProductionMockCallMatch(ast)
              : entry.ruleId === 'heuristics.ts.exception-filter.ast'
                ? TS.findExceptionFilterClassMatch(ast)
              : entry.ruleId === 'heuristics.ts.guards-useguards-jwtauthguard.ast'
                ? TS.findGuardUseGuardsJwtAuthGuardMatch(ast)
              : entry.ruleId === 'heuristics.ts.interceptors-useinterceptors-logging-transform.ast'
                ? TS.findUseInterceptorsLoggingTransformMatch(ast)
              : entry.ruleId === 'heuristics.ts.no-sensitive-log.ast'
                ? TS.findSensitiveLogCallMatch(ast)
              : entry.ruleId === 'heuristics.ts.empty-catch.ast' ||
                  entry.ruleId === 'common.error.empty_catch'
                ? TS.findEmptyCatchClauseMatch(ast)
              : entry.ruleId === 'heuristics.ts.solid.srp.class-command-query-mix.ast'
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
              : entry.ruleId === 'heuristics.ts.singleton-pattern.ast'
                ? TS.findSingletonPatternMatch(ast)
              : entry.ruleId === 'heuristics.ts.callback-hell.ast'
                ? TS.findCallbackHellPatternMatch(ast)
              : entry.ruleId === 'heuristics.ts.magic-numbers.ast'
                ? TS.findMagicNumberPatternMatch(ast)
              : entry.ruleId === 'heuristics.ts.hardcoded-values.ast'
                ? TS.findHardcodedValuePatternMatch(ast)
              : entry.ruleId === 'heuristics.ts.env-default-fallback.ast'
                ? TS.findEnvDefaultFallbackPatternMatch(ast)
              : entry.ruleId === 'heuristics.ts.god-class-large-class.ast'
                ? TS.findLargeClassDeclarationMatch(ast)
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
