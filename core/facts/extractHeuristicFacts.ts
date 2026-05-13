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

const isIOSSwiftPath = (path: string): boolean => {
  return path.endsWith('.swift') && path.startsWith('apps/ios/');
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
  { detect: TS.hasWithStatement, ruleId: 'heuristics.ts.with-statement.ast', code: 'HEURISTICS_WITH_STATEMENT_AST', message: 'AST heuristic detected with-statement usage.' },
  { detect: TS.hasDeleteOperator, ruleId: 'heuristics.ts.delete-operator.ast', code: 'HEURISTICS_DELETE_OPERATOR_AST', message: 'AST heuristic detected delete-operator usage.' },
  { detect: TS.hasDebuggerStatement, ruleId: 'heuristics.ts.debugger.ast', code: 'HEURISTICS_DEBUGGER_AST', message: 'AST heuristic detected debugger statement usage.' },
  { detect: TS.hasMixedCommandQueryClass, ruleId: 'heuristics.ts.solid.srp.class-command-query-mix.ast', code: 'HEURISTICS_SOLID_SRP_CLASS_COMMAND_QUERY_MIX_AST', message: 'AST heuristic detected class-level SRP/CQS mix (commands and queries in the same class).' },
  { detect: TS.hasMixedCommandQueryInterface, ruleId: 'heuristics.ts.solid.isp.interface-command-query-mix.ast', code: 'HEURISTICS_SOLID_ISP_INTERFACE_COMMAND_QUERY_MIX_AST', message: 'AST heuristic detected interface-level ISP/CQS mix (commands and queries in the same contract).' },
  { detect: TS.hasTypeDiscriminatorSwitch, ruleId: 'heuristics.ts.solid.ocp.discriminator-switch.ast', code: 'HEURISTICS_SOLID_OCP_DISCRIMINATOR_SWITCH_AST', message: 'AST heuristic detected OCP risk via discriminator switch branching.' },
  { detect: TS.hasOverrideMethodThrowingNotImplemented, ruleId: 'heuristics.ts.solid.lsp.override-not-implemented.ast', code: 'HEURISTICS_SOLID_LSP_OVERRIDE_NOT_IMPLEMENTED_AST', message: 'AST heuristic detected LSP risk: override throws not-implemented/unsupported.' },
  { detect: TS.hasFrameworkDependencyImport, ruleId: 'heuristics.ts.solid.dip.framework-import.ast', code: 'HEURISTICS_SOLID_DIP_FRAMEWORK_IMPORT_AST', message: 'AST heuristic detected DIP risk: framework dependency imported in domain/application code.', pathCheck: isTypeScriptDomainOrApplicationPath },
  { detect: TS.hasConcreteDependencyInstantiation, ruleId: 'heuristics.ts.solid.dip.concrete-instantiation.ast', code: 'HEURISTICS_SOLID_DIP_CONCRETE_INSTANTIATION_AST', message: 'AST heuristic detected DIP risk: direct instantiation of concrete framework dependency.', pathCheck: isTypeScriptDomainOrApplicationPath },
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
  readonly ruleId: string;
  readonly code: string;
  readonly message: string;
};

const textDetectorRegistry: ReadonlyArray<TextDetectorRegistryEntry> = [
  // iOS
  { platform: 'ios', pathCheck: isIOSPodfilePath, excludePaths: [], detect: detectsTrackedFilePresence, ruleId: 'heuristics.ios.dependencies.cocoapods.ast', code: 'HEURISTICS_IOS_DEPENDENCIES_COCOAPODS_AST', message: 'AST heuristic detected CocoaPods dependency files in an iOS project; Swift Package Manager remains the preferred baseline for new code.' },
  { platform: 'ios', pathCheck: isIOSCartfilePath, excludePaths: [], detect: detectsTrackedFilePresence, ruleId: 'heuristics.ios.dependencies.carthage.ast', code: 'HEURISTICS_IOS_DEPENDENCIES_CARTHAGE_AST', message: 'AST heuristic detected Carthage dependency files in an iOS project; Swift Package Manager remains the preferred baseline for new code.' },
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
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftOnAppearTaskUsage, ruleId: 'heuristics.ios.swiftui.onappear-task.ast', code: 'HEURISTICS_IOS_SWIFTUI_ONAPPEAR_TASK_AST', message: 'AST heuristic detected Task launched from SwiftUI onAppear; .task/.task(id:) provides lifecycle-aware cancellation.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftStrongDelegateReferenceUsage, ruleId: 'heuristics.ios.memory.strong-delegate.ast', code: 'HEURISTICS_IOS_MEMORY_STRONG_DELEGATE_AST', message: 'AST heuristic detected a strong delegate/dataSource reference; weak delegates remain the preferred baseline to avoid retain cycles.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftStrongSelfEscapingClosureUsage, ruleId: 'heuristics.ios.memory.strong-self-escaping-closure.ast', code: 'HEURISTICS_IOS_MEMORY_STRONG_SELF_ESCAPING_CLOSURE_AST', message: 'AST heuristic detected strong self capture in an escaping iOS closure; weak or unowned captures remain the preferred baseline when ownership is not explicit.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftCustomSingletonUsage, ruleId: 'heuristics.ios.architecture.custom-singleton.ast', code: 'HEURISTICS_IOS_ARCHITECTURE_CUSTOM_SINGLETON_AST', message: 'AST heuristic detected a custom static shared singleton in iOS production code; dependency injection remains the preferred baseline for app-owned services.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftSwinjectUsage, ruleId: 'heuristics.ios.architecture.swinject.ast', code: 'HEURISTICS_IOS_ARCHITECTURE_SWINJECT_AST', message: 'AST heuristic detected Swinject usage; manual dependency injection or SwiftUI Environment remain the preferred native baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftMassiveViewControllerResponsibilityUsage, ruleId: 'heuristics.ios.architecture.massive-view-controller.ast', code: 'HEURISTICS_IOS_ARCHITECTURE_MASSIVE_VIEW_CONTROLLER_AST', message: 'AST heuristic detected a UIViewController with direct infrastructure/data access; move data access behind application/domain boundaries.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNonIBOutletImplicitlyUnwrappedOptionalUsage, ruleId: 'heuristics.ios.safety.non-iboutlet-iuo.ast', code: 'HEURISTICS_IOS_SAFETY_NON_IBOUTLET_IUO_AST', message: 'AST heuristic detected an implicitly unwrapped optional outside IBOutlet wiring; explicit optionals or initialization guarantees remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftMagicNumberLayoutUsage, ruleId: 'heuristics.ios.maintainability.magic-number-layout.ast', code: 'HEURISTICS_IOS_MAINTAINABILITY_MAGIC_NUMBER_LAYOUT_AST', message: 'AST heuristic detected SwiftUI layout magic numbers; named constants or design tokens remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftAdHocLoggingUsage, ruleId: 'heuristics.ios.logging.adhoc-print.ast', code: 'HEURISTICS_IOS_LOGGING_ADHOC_PRINT_AST', message: 'AST heuristic detected print/debugPrint/dump/NSLog/os_log usage in iOS production code.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftSensitiveLoggingUsage, ruleId: 'heuristics.ios.logging.sensitive-data.ast', code: 'HEURISTICS_IOS_LOGGING_SENSITIVE_DATA_AST', message: 'AST heuristic detected sensitive data in an iOS logging call.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftHardcodedSensitiveStringUsage, ruleId: 'heuristics.ios.security.hardcoded-sensitive-string.ast', code: 'HEURISTICS_IOS_SECURITY_HARDCODED_SENSITIVE_STRING_AST', message: 'AST heuristic detected hardcoded sensitive Swift string; Keychain, secure config or environment-specific secrets remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftAlamofireUsage, ruleId: 'heuristics.ios.networking.alamofire.ast', code: 'HEURISTICS_IOS_NETWORKING_ALAMOFIRE_AST', message: 'AST heuristic detected Alamofire usage in iOS production code; URLSession remains the preferred baseline for new code.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftJSONSerializationUsage, ruleId: 'heuristics.ios.json.jsonserialization.ast', code: 'HEURISTICS_IOS_JSON_JSONSERIALIZATION_AST', message: 'AST heuristic detected JSONSerialization usage in iOS production code; Codable remains the preferred baseline for new code.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftSensitiveUserDefaultsStorageUsage, ruleId: 'heuristics.ios.security.userdefaults-sensitive-data.ast', code: 'HEURISTICS_IOS_SECURITY_USERDEFAULTS_SENSITIVE_DATA_AST', message: 'AST heuristic detected sensitive data stored in UserDefaults/AppStorage; native Keychain remains the preferred baseline for secrets.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftInsecureTransportUsage, ruleId: 'heuristics.ios.security.insecure-transport.ast', code: 'HEURISTICS_IOS_SECURITY_INSECURE_TRANSPORT_AST', message: 'AST heuristic detected insecure HTTP transport in iOS production code; HTTPS and ATS remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSInfoPlistPath, excludePaths: [], detect: TextIOS.hasSwiftInsecureTransportUsage, ruleId: 'heuristics.ios.security.insecure-transport.ast', code: 'HEURISTICS_IOS_SECURITY_INSECURE_TRANSPORT_AST', message: 'AST heuristic detected permissive App Transport Security configuration; HTTPS and ATS remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSLocalizableStringsPath, excludePaths: [], detect: detectsTrackedFilePresence, ruleId: 'heuristics.ios.localization.localizable-strings.ast', code: 'HEURISTICS_IOS_LOCALIZATION_LOCALIZABLE_STRINGS_AST', message: 'AST heuristic detected Localizable.strings usage; String Catalogs (.xcstrings) remain the preferred baseline for new localization work.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftHardcodedUiStringUsage, ruleId: 'heuristics.ios.localization.hardcoded-ui-string.ast', code: 'HEURISTICS_IOS_LOCALIZATION_HARDCODED_UI_STRING_AST', message: 'AST heuristic detected hardcoded user-facing SwiftUI text; String(localized:) and String Catalogs remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftLooseAssetResourceUsage, ruleId: 'heuristics.ios.assets.loose-resource.ast', code: 'HEURISTICS_IOS_ASSETS_LOOSE_RESOURCE_AST', message: 'AST heuristic detected loose image resource loading in iOS production code; Asset Catalogs remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftFixedFontSizeUsage, ruleId: 'heuristics.ios.accessibility.fixed-font-size.ast', code: 'HEURISTICS_IOS_ACCESSIBILITY_FIXED_FONT_SIZE_AST', message: 'AST heuristic detected fixed font sizing in iOS production code; Dynamic Type semantic text styles remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftPhysicalTextAlignmentUsage, ruleId: 'heuristics.ios.localization.physical-text-alignment.ast', code: 'HEURISTICS_IOS_LOCALIZATION_PHYSICAL_TEXT_ALIGNMENT_AST', message: 'AST heuristic detected physical left/right text alignment in iOS production code; leading/trailing remain the preferred RTL-safe baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftMainThreadBlockingSleepUsage, ruleId: 'heuristics.ios.performance.blocking-sleep.ast', code: 'HEURISTICS_IOS_PERFORMANCE_BLOCKING_SLEEP_AST', message: 'AST heuristic detected blocking sleep usage in iOS production code; async clocks, suspension or cancellable scheduling remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftIconOnlyControlWithoutAccessibilityLabelUsage, ruleId: 'heuristics.ios.accessibility.icon-only-control-label.ast', code: 'HEURISTICS_IOS_ACCESSIBILITY_ICON_ONLY_CONTROL_LABEL_AST', message: 'AST heuristic detected an icon-only SwiftUI control without accessibilityLabel; explicit accessible labels remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUncheckedSendableUsage, ruleId: 'heuristics.ios.unchecked-sendable.ast', code: 'HEURISTICS_IOS_UNCHECKED_SENDABLE_AST', message: 'AST heuristic detected @unchecked Sendable usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftPreconcurrencyUsage, ruleId: 'heuristics.ios.preconcurrency.ast', code: 'HEURISTICS_IOS_PRECONCURRENCY_AST', message: 'AST heuristic detected @preconcurrency usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNonisolatedUnsafeUsage, ruleId: 'heuristics.ios.nonisolated-unsafe.ast', code: 'HEURISTICS_IOS_NONISOLATED_UNSAFE_AST', message: 'AST heuristic detected nonisolated(unsafe) usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftAssumeIsolatedUsage, ruleId: 'heuristics.ios.assume-isolated.ast', code: 'HEURISTICS_IOS_ASSUME_ISOLATED_AST', message: 'AST heuristic detected assumeIsolated usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftObservableObjectUsage, ruleId: 'heuristics.ios.observable-object.ast', code: 'HEURISTICS_IOS_OBSERVABLE_OBJECT_AST', message: 'AST heuristic detected ObservableObject usage.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftLegacySwiftUiObservableWrapperUsage, ruleId: 'heuristics.ios.legacy-swiftui-observable-wrapper.ast', code: 'HEURISTICS_IOS_LEGACY_SWIFTUI_OBSERVABLE_WRAPPER_AST', message: 'AST heuristic detected @StateObject/@ObservedObject usage in a modern SwiftUI path.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNonPrivateStateOwnershipUsage, ruleId: 'heuristics.ios.swiftui.non-private-state-ownership.ast', code: 'HEURISTICS_IOS_SWIFTUI_NON_PRIVATE_STATE_OWNERSHIP_AST', message: 'AST heuristic detected @State/@StateObject without private visibility; SwiftUI owned state should be private.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftPassedValueStateWrapperUsage, ruleId: 'heuristics.ios.passed-value-state-wrapper.ast', code: 'HEURISTICS_IOS_PASSED_VALUE_STATE_WRAPPER_AST', message: 'AST heuristic detected a passed value stored as @State/@StateObject via init wrapper ownership.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftForEachIndicesUsage, ruleId: 'heuristics.ios.foreach-indices.ast', code: 'HEURISTICS_IOS_FOREACH_INDICES_AST', message: 'AST heuristic detected ForEach(...indices...) usage where stable element identity may be preferred.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftInlineForEachTransformUsage, ruleId: 'heuristics.ios.swiftui.inline-foreach-transform.ast', code: 'HEURISTICS_IOS_SWIFTUI_INLINE_FOREACH_TRANSFORM_AST', message: 'AST heuristic detected inline filter/map/sort work inside ForEach; prefiltered or cached collections remain the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUiForEachConditionalViewCountUsage, ruleId: 'heuristics.ios.swiftui.foreach-conditional-view-count.ast', code: 'HEURISTICS_IOS_SWIFTUI_FOREACH_CONDITIONAL_VIEW_COUNT_AST', message: 'AST heuristic detected conditional view count inside ForEach; keep a constant number of views per element by moving branching into row views or modifiers.' },
  { platform: 'ios', pathCheck: isIOSApplicationOrPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftContainsUserFilterUsage, ruleId: 'heuristics.ios.contains-user-filter.ast', code: 'HEURISTICS_IOS_CONTAINS_USER_FILTER_AST', message: 'AST heuristic detected contains() in a user-facing filter where localizedStandardContains() may be preferred.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftGeometryReaderUsage, ruleId: 'heuristics.ios.geometryreader.ast', code: 'HEURISTICS_IOS_GEOMETRYREADER_AST', message: 'AST heuristic detected GeometryReader usage that may be replaceable with modern layout APIs.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftFontWeightBoldUsage, ruleId: 'heuristics.ios.font-weight-bold.ast', code: 'HEURISTICS_IOS_FONT_WEIGHT_BOLD_AST', message: 'AST heuristic detected fontWeight(.bold) usage where bold() may be preferred.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftExplicitColorStaticMemberUsage, ruleId: 'heuristics.ios.swiftui.explicit-color-static-member.ast', code: 'HEURISTICS_IOS_SWIFTUI_EXPLICIT_COLOR_STATIC_MEMBER_AST', message: 'AST heuristic detected Color.* static member usage where SwiftUI static member lookup may be preferred.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftClosureBasedViewBuilderContentUsage, ruleId: 'heuristics.ios.swiftui.closure-based-viewbuilder-content.ast', code: 'HEURISTICS_IOS_SWIFTUI_CLOSURE_BASED_VIEWBUILDER_CONTENT_AST', message: 'AST heuristic detected closure-based content storage; @ViewBuilder let content: Content remains the preferred SwiftUI container baseline.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftRedundantReactiveStateAssignmentUsage, ruleId: 'heuristics.ios.swiftui.redundant-reactive-state-assignment.ast', code: 'HEURISTICS_IOS_SWIFTUI_REDUNDANT_REACTIVE_STATE_ASSIGNMENT_AST', message: 'AST heuristic detected reactive state assignment without a value-change guard; check for value changes before assigning state in hot paths.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNonLazyScrollForEachUsage, ruleId: 'heuristics.ios.swiftui.non-lazy-scroll-foreach.ast', code: 'HEURISTICS_IOS_SWIFTUI_NON_LAZY_SCROLL_FOREACH_AST', message: 'AST heuristic detected ScrollView with a non-lazy stack feeding ForEach; LazyVStack/LazyHStack remain the preferred baseline for large scrollable collections.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftViewBodyObjectCreationUsage, ruleId: 'heuristics.ios.swiftui.body-object-creation.ast', code: 'HEURISTICS_IOS_SWIFTUI_BODY_OBJECT_CREATION_AST', message: 'AST heuristic detected formatter object creation inside SwiftUI body; keep body simple and move expensive objects out of render paths.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUiImageDataDecodingUsage, ruleId: 'heuristics.ios.swiftui.image-data-decoding.ast', code: 'HEURISTICS_IOS_SWIFTUI_IMAGE_DATA_DECODING_AST', message: 'AST heuristic detected UIImage(data:) in SwiftUI presentation; downsample image data before rendering large images.' },
  { platform: 'ios', pathCheck: isIOSPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftUiInlineActionLogicUsage, ruleId: 'heuristics.ios.swiftui.inline-action-logic.ast', code: 'HEURISTICS_IOS_SWIFTUI_INLINE_ACTION_LOGIC_AST', message: 'AST heuristic detected inline logic inside a SwiftUI action handler; action handlers should reference methods and keep view declarations focused.' },
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
  { platform: 'ios', pathCheck: isIOSSwiftTestPath, excludePaths: [], detect: TextIOS.hasSwiftQuickNimbleUsage, ruleId: 'heuristics.ios.testing.quick-nimble.ast', code: 'HEURISTICS_IOS_TESTING_QUICK_NIMBLE_AST', message: 'AST heuristic detected Quick/Nimble usage where native Swift Testing remains the preferred baseline.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNSManagedObjectBoundaryUsage, ruleId: 'heuristics.ios.core-data.nsmanagedobject-boundary.ast', code: 'HEURISTICS_IOS_CORE_DATA_NSMANAGEDOBJECT_BOUNDARY_AST', message: 'AST heuristic detected NSManagedObject in a shared boundary.' },
  { platform: 'ios', pathCheck: isIOSSwiftPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNSManagedObjectAsyncBoundaryUsage, ruleId: 'heuristics.ios.core-data.nsmanagedobject-async-boundary.ast', code: 'HEURISTICS_IOS_CORE_DATA_NSMANAGEDOBJECT_ASYNC_BOUNDARY_AST', message: 'AST heuristic detected NSManagedObject in an async boundary.' },
  { platform: 'ios', pathCheck: isIOSApplicationOrPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftCoreDataLayerLeakUsage, ruleId: 'heuristics.ios.core-data.layer-leak.ast', code: 'HEURISTICS_IOS_CORE_DATA_LAYER_LEAK_AST', message: 'AST heuristic detected Core Data APIs leaking into application/presentation code.' },
  { platform: 'ios', pathCheck: isIOSApplicationOrPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftSwiftDataLayerLeakUsage, ruleId: 'heuristics.ios.swiftdata.layer-leak.ast', code: 'HEURISTICS_IOS_SWIFTDATA_LAYER_LEAK_AST', message: 'AST heuristic detected SwiftData APIs leaking into application/presentation code.' },
  { platform: 'ios', pathCheck: isIOSApplicationOrPresentationPath, excludePaths: [isSwiftTestPath], detect: TextIOS.hasSwiftNSManagedObjectStateLeakUsage, ruleId: 'heuristics.ios.core-data.nsmanagedobject-state-leak.ast', code: 'HEURISTICS_IOS_CORE_DATA_NSMANAGEDOBJECT_STATE_LEAK_AST', message: 'AST heuristic detected NSManagedObject leaking into SwiftUI state or a ViewModel.' },

  // Android
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinThreadSleepCall, ruleId: 'heuristics.android.thread-sleep.ast', code: 'HEURISTICS_ANDROID_THREAD_SLEEP_AST', message: 'AST heuristic detected Thread.sleep usage in production Kotlin code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinGlobalScopeUsage, ruleId: 'heuristics.android.globalscope.ast', code: 'HEURISTICS_ANDROID_GLOBAL_SCOPE_AST', message: 'AST heuristic detected GlobalScope coroutine usage in production Kotlin code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinRunBlockingUsage, ruleId: 'heuristics.android.run-blocking.ast', code: 'HEURISTICS_ANDROID_RUN_BLOCKING_AST', message: 'AST heuristic detected runBlocking usage in production Kotlin code.' },
  { platform: 'android', pathCheck: isAndroidLocalPropertiesPath, excludePaths: [], detect: detectsTrackedFilePresence, ruleId: 'heuristics.android.security.local-properties-tracked.ast', code: 'HEURISTICS_ANDROID_SECURITY_LOCAL_PROPERTIES_TRACKED_AST', message: 'AST heuristic detected tracked Android local.properties file.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinSharedPreferencesUsage, ruleId: 'heuristics.android.persistence.shared-preferences-usage.ast', code: 'HEURISTICS_ANDROID_PERSISTENCE_SHARED_PREFERENCES_USAGE_AST', message: 'AST heuristic detected SharedPreferences usage in Android production Kotlin code.' },
  { platform: 'android', pathCheck: isAndroidKotlinPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinProductionMockUsage, ruleId: 'heuristics.android.testing.production-mock-usage.ast', code: 'HEURISTICS_ANDROID_TESTING_PRODUCTION_MOCK_USAGE_AST', message: 'AST heuristic detected mock or spy usage in Android production Kotlin code.' },
  { platform: 'android', pathCheck: isAndroidKotlinTestPath, excludePaths: [], detect: TextAndroid.hasKotlinJUnit4Usage, ruleId: 'heuristics.android.testing.junit4-usage.ast', code: 'HEURISTICS_ANDROID_TESTING_JUNIT4_USAGE_AST', message: 'AST heuristic detected JUnit4 usage in Android Kotlin tests where JUnit5 is preferred.' },
  { platform: 'android', pathCheck: isAndroidPresentationPath, excludePaths: [isKotlinTestPath], detect: TextAndroid.hasKotlinLiveDataStateExposureUsage, ruleId: 'heuristics.android.flow.livedata-state-exposure.ast', code: 'HEURISTICS_ANDROID_FLOW_LIVEDATA_STATE_EXPOSURE_AST', message: 'AST heuristic detected LiveData state exposure in Android presentation code where StateFlow or SharedFlow should be preferred.' },
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
        plugins: ['typescript', 'jsx'],
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
