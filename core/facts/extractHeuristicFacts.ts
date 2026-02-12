import { parse } from '@babel/parser';
import type { Fact } from './Fact';
import type { FileContentFact } from './FileContentFact';
import type { HeuristicFact } from './HeuristicFact';

export type HeuristicExtractionParams = {
  facts: ReadonlyArray<Fact>;
  detectedPlatforms: {
    ios?: { detected: boolean };
    android?: { detected: boolean };
    frontend?: { detected: boolean };
    backend?: { detected: boolean };
  };
};

export type ExtractedHeuristicFact = HeuristicFact & { source: string };

const HEURISTIC_SOURCE = 'heuristics:ast';

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const hasNode = (
  node: unknown,
  predicate: (value: Record<string, unknown>) => boolean
): boolean => {
  if (!isObject(node)) {
    return false;
  }

  if (predicate(node)) {
    return true;
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (hasNode(item, predicate)) {
          return true;
        }
      }
      continue;
    }

    if (isObject(value) && hasNode(value, predicate)) {
      return true;
    }
  }

  return false;
};

const hasEmptyCatchClause = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CatchClause') {
      return false;
    }
    const body = value.body;
    return isObject(body) && Array.isArray(body.body) && body.body.length === 0;
  });
};

const hasExplicitAnyType = (node: unknown): boolean => {
  return hasNode(node, (value) => value.type === 'TSAnyKeyword');
};

const hasConsoleLogCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }

    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression' || callee.computed === true) {
      return false;
    }

    const objectNode = callee.object;
    const propertyNode = callee.property;
    return (
      isObject(objectNode) &&
      objectNode.type === 'Identifier' &&
      objectNode.name === 'console' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'log'
    );
  });
};

const hasConsoleErrorCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }

    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression' || callee.computed === true) {
      return false;
    }

    const objectNode = callee.object;
    const propertyNode = callee.property;
    return (
      isObject(objectNode) &&
      objectNode.type === 'Identifier' &&
      objectNode.name === 'console' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'error'
    );
  });
};

const hasEvalCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    return isObject(callee) && callee.type === 'Identifier' && callee.name === 'eval';
  });
};

const hasFunctionConstructorUsage = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'NewExpression') {
      return false;
    }
    const callee = value.callee;
    return isObject(callee) && callee.type === 'Identifier' && callee.name === 'Function';
  });
};

const hasSetTimeoutStringCallback = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'Identifier' || callee.name !== 'setTimeout') {
      return false;
    }
    const args = value.arguments;
    if (!Array.isArray(args) || args.length === 0) {
      return false;
    }
    const firstArg = args[0];
    return (
      (isObject(firstArg) && firstArg.type === 'StringLiteral') ||
      (isObject(firstArg) &&
        firstArg.type === 'TemplateLiteral' &&
        Array.isArray(firstArg.expressions) &&
        firstArg.expressions.length === 0)
    );
  });
};

const hasSetIntervalStringCallback = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'Identifier' || callee.name !== 'setInterval') {
      return false;
    }
    const args = value.arguments;
    if (!Array.isArray(args) || args.length === 0) {
      return false;
    }
    const firstArg = args[0];
    return (
      (isObject(firstArg) && firstArg.type === 'StringLiteral') ||
      (isObject(firstArg) &&
        firstArg.type === 'TemplateLiteral' &&
        Array.isArray(firstArg.expressions) &&
        firstArg.expressions.length === 0)
    );
  });
};

const hasAsyncPromiseExecutor = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'NewExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'Identifier' || callee.name !== 'Promise') {
      return false;
    }
    const args = value.arguments;
    if (!Array.isArray(args) || args.length === 0) {
      return false;
    }
    const firstArg = args[0];
    return (
      isObject(firstArg) &&
      (firstArg.type === 'ArrowFunctionExpression' || firstArg.type === 'FunctionExpression') &&
      firstArg.async === true
    );
  });
};

const hasWithStatement = (node: unknown): boolean => {
  return hasNode(node, (value) => value.type === 'WithStatement');
};

const hasDebuggerStatement = (node: unknown): boolean => {
  return hasNode(node, (value) => value.type === 'DebuggerStatement');
};

const isTypeScriptHeuristicTargetPath = (path: string): boolean => {
  return (
    (path.endsWith('.ts') || path.endsWith('.tsx')) &&
    (path.startsWith('apps/frontend/') ||
      path.startsWith('apps/web/') ||
      path.startsWith('apps/backend/'))
  );
};

const isIOSSwiftPath = (path: string): boolean => {
  return path.endsWith('.swift') && path.startsWith('apps/ios/');
};

const isAndroidKotlinPath = (path: string): boolean => {
  return (path.endsWith('.kt') || path.endsWith('.kts')) && path.startsWith('apps/android/');
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

const isKotlinTestPath = (path: string): boolean => {
  const normalized = path.toLowerCase();
  return (
    normalized.includes('/test/') ||
    normalized.includes('/androidtest/') ||
    normalized.endsWith('test.kt') ||
    normalized.endsWith('tests.kt')
  );
};

const isIdentifierCharacter = (value: string): boolean => {
  return /^[A-Za-z0-9_]$/.test(value);
};

const prevNonWhitespaceIndex = (source: string, start: number): number => {
  for (let index = start; index >= 0; index -= 1) {
    if (!/\s/.test(source[index])) {
      return index;
    }
  }
  return -1;
};

const nextNonWhitespaceIndex = (source: string, start: number): number => {
  for (let index = start; index < source.length; index += 1) {
    if (!/\s/.test(source[index])) {
      return index;
    }
  }
  return -1;
};

const readIdentifierBackward = (
  source: string,
  endIndex: number
): { value: string; start: number } => {
  if (!isIdentifierCharacter(source[endIndex])) {
    return { value: '', start: -1 };
  }

  let start = endIndex;
  while (start > 0 && isIdentifierCharacter(source[start - 1])) {
    start -= 1;
  }

  return {
    value: source.slice(start, endIndex + 1),
    start,
  };
};

const isLikelySwiftTypeAnnotation = (source: string, identifierStart: number): boolean => {
  if (identifierStart <= 0) {
    return false;
  }

  const before = prevNonWhitespaceIndex(source, identifierStart - 1);
  return before >= 0 && source[before] === ':';
};

const isForceUnwrapAt = (source: string, index: number): boolean => {
  const previousIndex = prevNonWhitespaceIndex(source, index - 1);
  if (previousIndex < 0) {
    return false;
  }

  const nextIndex = nextNonWhitespaceIndex(source, index + 1);
  if (nextIndex >= 0 && (source[nextIndex] === '=' || source[nextIndex] === '!')) {
    return false;
  }

  const previousChar = source[previousIndex];
  const previousIdentifier = readIdentifierBackward(source, previousIndex);
  if (previousIdentifier.value === 'as') {
    return false;
  }
  if (
    previousIdentifier.start >= 0 &&
    isLikelySwiftTypeAnnotation(source, previousIdentifier.start)
  ) {
    return false;
  }

  const isPostfixToken =
    isIdentifierCharacter(previousChar) ||
    previousChar === ')' ||
    previousChar === ']' ||
    previousChar === '}';
  if (!isPostfixToken) {
    return false;
  }

  return true;
};

const hasIdentifierAt = (source: string, index: number, identifier: string): boolean => {
  if (!source.startsWith(identifier, index)) {
    return false;
  }

  const before = source[index - 1];
  const after = source[index + identifier.length];
  const validBefore = typeof before === 'undefined' || !isIdentifierCharacter(before);
  const validAfter = typeof after === 'undefined' || !isIdentifierCharacter(after);
  return validBefore && validAfter;
};

const scanCodeLikeSource = (
  source: string,
  matcher: (params: { source: string; index: number; current: string }) => boolean
): boolean => {
  let index = 0;
  let inLineComment = false;
  let blockCommentDepth = 0;
  let inString = false;
  let inMultilineString = false;

  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1];
    const nextTwo = source[index + 2];

    if (inLineComment) {
      if (current === '\n') {
        inLineComment = false;
      }
      index += 1;
      continue;
    }

    if (blockCommentDepth > 0) {
      if (current === '/' && next === '*') {
        blockCommentDepth += 1;
        index += 2;
        continue;
      }
      if (current === '*' && next === '/') {
        blockCommentDepth -= 1;
        index += 2;
        continue;
      }
      index += 1;
      continue;
    }

    if (inMultilineString) {
      if (current === '"' && next === '"' && nextTwo === '"') {
        inMultilineString = false;
        index += 3;
        continue;
      }
      index += 1;
      continue;
    }

    if (inString) {
      if (current === '\\') {
        index += 2;
        continue;
      }
      if (current === '"') {
        inString = false;
      }
      index += 1;
      continue;
    }

    if (current === '/' && next === '/') {
      inLineComment = true;
      index += 2;
      continue;
    }

    if (current === '/' && next === '*') {
      blockCommentDepth = 1;
      index += 2;
      continue;
    }

    if (current === '"' && next === '"' && nextTwo === '"') {
      inMultilineString = true;
      index += 3;
      continue;
    }

    if (current === '"') {
      inString = true;
      index += 1;
      continue;
    }

    if (matcher({ source, index, current })) {
      return true;
    }

    index += 1;
  }

  return false;
};

const hasSwiftForceUnwrap = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    return current === '!' && isForceUnwrapAt(swiftSource, index);
  });
};

const hasSwiftAnyViewUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'A') {
      return false;
    }

    return hasIdentifierAt(swiftSource, index, 'AnyView');
  });
};

const hasSwiftForceTryUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 't' || !hasIdentifierAt(swiftSource, index, 'try')) {
      return false;
    }

    const bangIndex = nextNonWhitespaceIndex(swiftSource, index + 'try'.length);
    return bangIndex >= 0 && swiftSource[bangIndex] === '!';
  });
};

const hasSwiftForceCastUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'a' || !hasIdentifierAt(swiftSource, index, 'as')) {
      return false;
    }

    const bangIndex = nextNonWhitespaceIndex(swiftSource, index + 'as'.length);
    return bangIndex >= 0 && swiftSource[bangIndex] === '!';
  });
};

const hasSwiftCallbackStyleSignature = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== '@' || !swiftSource.startsWith('@escaping', index)) {
      return false;
    }

    const segmentStart = Math.max(0, index - 180);
    const segmentEnd = Math.min(swiftSource.length, index + 260);
    const segment = swiftSource.slice(segmentStart, segmentEnd);

    return (
      /\b(?:completion|handler|callback)\s*:\s*(?:@[A-Za-z0-9_]+\s+)?@escaping\b/.test(
        segment
      ) || /\bfunc\b[\s\S]{0,180}@escaping[\s\S]{0,120}->\s*Void\b/.test(segment)
    );
  });
};

const hasKotlinThreadSleepCall = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: kotlinSource, index, current }) => {
    if (current !== 'T') {
      return false;
    }

    return (
      hasIdentifierAt(kotlinSource, index, 'Thread') &&
      kotlinSource.startsWith('.sleep', index + 'Thread'.length)
    );
  });
};

const hasKotlinGlobalScopeUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: kotlinSource, index, current }) => {
    if (current !== 'G' || !hasIdentifierAt(kotlinSource, index, 'GlobalScope')) {
      return false;
    }

    const start = index + 'GlobalScope'.length;
    const tail = kotlinSource.slice(start, start + 32);
    return /^\s*\.(launch|async|produce|actor)\b/.test(tail);
  });
};

const hasKotlinRunBlockingUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: kotlinSource, index, current }) => {
    if (current !== 'r' || !hasIdentifierAt(kotlinSource, index, 'runBlocking')) {
      return false;
    }

    const start = index + 'runBlocking'.length;
    const tail = kotlinSource.slice(start, start + 48);
    return /^\s*(<[^>\n]+>\s*)?(\(|\{)/.test(tail);
  });
};

const asFileContentFact = (fact: Fact): FileContentFact | undefined => {
  if (fact.kind !== 'FileContent') {
    return undefined;
  }
  return fact;
};

const hasDetectedHeuristicPlatform = (params: HeuristicExtractionParams): boolean => {
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
  severity?: HeuristicFact['severity'];
}): ExtractedHeuristicFact => {
  return {
    kind: 'Heuristic',
    source: HEURISTIC_SOURCE,
    ruleId: params.ruleId,
    severity: params.severity ?? 'WARN',
    code: params.code,
    message: params.message,
    filePath: params.filePath,
  };
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

    if (
      params.detectedPlatforms.ios?.detected &&
      isIOSSwiftPath(fileFact.path) &&
      !isSwiftTestPath(fileFact.path) &&
      hasSwiftForceUnwrap(fileFact.content)
    ) {
      heuristicFacts.push(
        createHeuristicFact({
          ruleId: 'heuristics.ios.force-unwrap.ast',
          code: 'HEURISTICS_IOS_FORCE_UNWRAP_AST',
          message: 'AST heuristic detected force unwrap usage.',
          filePath: fileFact.path,
        })
      );
    }

    if (
      params.detectedPlatforms.ios?.detected &&
      isIOSSwiftPath(fileFact.path) &&
      !isSwiftTestPath(fileFact.path) &&
      hasSwiftAnyViewUsage(fileFact.content)
    ) {
      heuristicFacts.push(
        createHeuristicFact({
          ruleId: 'heuristics.ios.anyview.ast',
          code: 'HEURISTICS_IOS_ANYVIEW_AST',
          message: 'AST heuristic detected AnyView usage.',
          filePath: fileFact.path,
        })
      );
    }

    if (
      params.detectedPlatforms.ios?.detected &&
      isIOSSwiftPath(fileFact.path) &&
      !isSwiftTestPath(fileFact.path) &&
      hasSwiftForceTryUsage(fileFact.content)
    ) {
      heuristicFacts.push(
        createHeuristicFact({
          ruleId: 'heuristics.ios.force-try.ast',
          code: 'HEURISTICS_IOS_FORCE_TRY_AST',
          message: 'AST heuristic detected force try usage.',
          filePath: fileFact.path,
        })
      );
    }

    if (
      params.detectedPlatforms.ios?.detected &&
      isIOSSwiftPath(fileFact.path) &&
      !isSwiftTestPath(fileFact.path) &&
      hasSwiftForceCastUsage(fileFact.content)
    ) {
      heuristicFacts.push(
        createHeuristicFact({
          ruleId: 'heuristics.ios.force-cast.ast',
          code: 'HEURISTICS_IOS_FORCE_CAST_AST',
          message: 'AST heuristic detected force cast usage.',
          filePath: fileFact.path,
        })
      );
    }

    if (
      params.detectedPlatforms.ios?.detected &&
      isIOSSwiftPath(fileFact.path) &&
      !isSwiftTestPath(fileFact.path) &&
      !isApprovedIOSBridgePath(fileFact.path) &&
      hasSwiftCallbackStyleSignature(fileFact.content)
    ) {
      heuristicFacts.push(
        createHeuristicFact({
          ruleId: 'heuristics.ios.callback-style.ast',
          code: 'HEURISTICS_IOS_CALLBACK_STYLE_AST',
          message: 'AST heuristic detected callback-style API signature outside bridge layers.',
          filePath: fileFact.path,
        })
      );
    }

    if (
      params.detectedPlatforms.android?.detected &&
      isAndroidKotlinPath(fileFact.path) &&
      !isKotlinTestPath(fileFact.path) &&
      hasKotlinThreadSleepCall(fileFact.content)
    ) {
      heuristicFacts.push(
        createHeuristicFact({
          ruleId: 'heuristics.android.thread-sleep.ast',
          code: 'HEURISTICS_ANDROID_THREAD_SLEEP_AST',
          message: 'AST heuristic detected Thread.sleep usage in production Kotlin code.',
          filePath: fileFact.path,
        })
      );
    }

    if (
      params.detectedPlatforms.android?.detected &&
      isAndroidKotlinPath(fileFact.path) &&
      !isKotlinTestPath(fileFact.path) &&
      hasKotlinGlobalScopeUsage(fileFact.content)
    ) {
      heuristicFacts.push(
        createHeuristicFact({
          ruleId: 'heuristics.android.globalscope.ast',
          code: 'HEURISTICS_ANDROID_GLOBAL_SCOPE_AST',
          message: 'AST heuristic detected GlobalScope coroutine usage in production Kotlin code.',
          filePath: fileFact.path,
        })
      );
    }

    if (
      params.detectedPlatforms.android?.detected &&
      isAndroidKotlinPath(fileFact.path) &&
      !isKotlinTestPath(fileFact.path) &&
      hasKotlinRunBlockingUsage(fileFact.content)
    ) {
      heuristicFacts.push(
        createHeuristicFact({
          ruleId: 'heuristics.android.run-blocking.ast',
          code: 'HEURISTICS_ANDROID_RUN_BLOCKING_AST',
          message: 'AST heuristic detected runBlocking usage in production Kotlin code.',
          filePath: fileFact.path,
        })
      );
    }

    const hasTypeScriptPlatform =
      params.detectedPlatforms.frontend?.detected || params.detectedPlatforms.backend?.detected;
    if (!hasTypeScriptPlatform || !isTypeScriptHeuristicTargetPath(fileFact.path) || isTestPath(fileFact.path)) {
      continue;
    }

    try {
      const ast = parse(fileFact.content, {
        sourceType: 'unambiguous',
        plugins: ['typescript', 'jsx'],
      });

      if (hasEmptyCatchClause(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.empty-catch.ast',
            code: 'HEURISTICS_EMPTY_CATCH_AST',
            message: 'AST heuristic detected an empty catch block.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasExplicitAnyType(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.explicit-any.ast',
            code: 'HEURISTICS_EXPLICIT_ANY_AST',
            message: 'AST heuristic detected explicit any usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasConsoleLogCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.console-log.ast',
            code: 'HEURISTICS_CONSOLE_LOG_AST',
            message: 'AST heuristic detected console.log usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasConsoleErrorCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.console-error.ast',
            code: 'HEURISTICS_CONSOLE_ERROR_AST',
            message: 'AST heuristic detected console.error usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasEvalCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.eval.ast',
            code: 'HEURISTICS_EVAL_AST',
            message: 'AST heuristic detected eval usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFunctionConstructorUsage(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.function-constructor.ast',
            code: 'HEURISTICS_FUNCTION_CONSTRUCTOR_AST',
            message: 'AST heuristic detected Function constructor usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasSetTimeoutStringCallback(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.set-timeout-string.ast',
            code: 'HEURISTICS_SET_TIMEOUT_STRING_AST',
            message: 'AST heuristic detected setTimeout with a string callback.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasSetIntervalStringCallback(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.set-interval-string.ast',
            code: 'HEURISTICS_SET_INTERVAL_STRING_AST',
            message: 'AST heuristic detected setInterval with a string callback.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasAsyncPromiseExecutor(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.new-promise-async.ast',
            code: 'HEURISTICS_NEW_PROMISE_ASYNC_AST',
            message: 'AST heuristic detected async Promise executor usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasWithStatement(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.with-statement.ast',
            code: 'HEURISTICS_WITH_STATEMENT_AST',
            message: 'AST heuristic detected with-statement usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasDebuggerStatement(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.debugger.ast',
            code: 'HEURISTICS_DEBUGGER_AST',
            message: 'AST heuristic detected debugger statement usage.',
            filePath: fileFact.path,
          })
        );
      }
    } catch {
      continue;
    }
  }

  return heuristicFacts;
};
