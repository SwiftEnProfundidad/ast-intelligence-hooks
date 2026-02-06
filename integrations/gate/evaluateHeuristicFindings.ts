import { parse } from '@babel/parser';
import type { Fact } from '../../core/facts/Fact';
import type { FileContentFact } from '../../core/facts/FileContentFact';
import type { Finding } from '../../core/gate/Finding';

type HeuristicParams = {
  facts: ReadonlyArray<Fact>;
  detectedPlatforms: {
    ios?: { detected: boolean };
    frontend?: { detected: boolean };
  };
};

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

const isFrontendTargetPath = (path: string): boolean => {
  return (
    (path.endsWith('.ts') || path.endsWith('.tsx')) &&
    (path.startsWith('apps/frontend/') || path.startsWith('apps/web/'))
  );
};

const isIOSSwiftPath = (path: string): boolean => {
  return path.endsWith('.swift') && path.startsWith('apps/ios/');
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

const scanSwiftSource = (
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
  return scanSwiftSource(source, ({ source: swiftSource, index, current }) => {
    return current === '!' && isForceUnwrapAt(swiftSource, index);
  });
};

const hasSwiftAnyViewUsage = (source: string): boolean => {
  return scanSwiftSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'A') {
      return false;
    }

    return hasIdentifierAt(swiftSource, index, 'AnyView');
  });
};

const asFileContentFact = (fact: Fact): FileContentFact | undefined => {
  if (fact.kind !== 'FileContent') {
    return undefined;
  }
  return fact;
};

const hasDetectedHeuristicPlatform = (params: HeuristicParams): boolean => {
  return Boolean(params.detectedPlatforms.frontend?.detected || params.detectedPlatforms.ios?.detected);
};

export const evaluateHeuristicFindings = (params: HeuristicParams): Finding[] => {
  if (!hasDetectedHeuristicPlatform(params)) {
    return [];
  }

  const findings: Finding[] = [];

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
      findings.push({
        ruleId: 'heuristics.ios.force-unwrap.ast',
        severity: 'WARN',
        code: 'HEURISTICS_IOS_FORCE_UNWRAP_AST',
        message: 'AST heuristic detected force unwrap usage.',
        filePath: fileFact.path,
      });
    }

    if (
      params.detectedPlatforms.ios?.detected &&
      isIOSSwiftPath(fileFact.path) &&
      !isSwiftTestPath(fileFact.path) &&
      hasSwiftAnyViewUsage(fileFact.content)
    ) {
      findings.push({
        ruleId: 'heuristics.ios.anyview.ast',
        severity: 'WARN',
        code: 'HEURISTICS_IOS_ANYVIEW_AST',
        message: 'AST heuristic detected AnyView usage.',
        filePath: fileFact.path,
      });
    }

    if (
      !params.detectedPlatforms.frontend?.detected ||
      !isFrontendTargetPath(fileFact.path) ||
      isTestPath(fileFact.path)
    ) {
      continue;
    }

    try {
      const ast = parse(fileFact.content, {
        sourceType: 'unambiguous',
        plugins: ['typescript', 'jsx'],
      });

      if (hasEmptyCatchClause(ast)) {
        findings.push({
          ruleId: 'heuristics.ts.empty-catch.ast',
          severity: 'WARN',
          code: 'HEURISTICS_EMPTY_CATCH_AST',
          message: 'AST heuristic detected an empty catch block.',
          filePath: fileFact.path,
        });
      }

      if (hasExplicitAnyType(ast)) {
        findings.push({
          ruleId: 'heuristics.ts.explicit-any.ast',
          severity: 'WARN',
          code: 'HEURISTICS_EXPLICIT_ANY_AST',
          message: 'AST heuristic detected explicit any usage.',
          filePath: fileFact.path,
        });
      }

      if (hasConsoleLogCall(ast)) {
        findings.push({
          ruleId: 'heuristics.ts.console-log.ast',
          severity: 'WARN',
          code: 'HEURISTICS_CONSOLE_LOG_AST',
          message: 'AST heuristic detected console.log usage.',
          filePath: fileFact.path,
        });
      }
    } catch {
      continue;
    }
  }

  return findings;
};
