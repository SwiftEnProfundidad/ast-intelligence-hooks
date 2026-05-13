import {
  hasIdentifierAt,
  isIdentifierCharacter,
  nextNonWhitespaceIndex,
  prevNonWhitespaceIndex,
  readIdentifierBackward,
  scanCodeLikeSource,
} from './utils';
import { getIosSwiftUiModernizationEntry } from './iosSwiftUiModernizationSnapshot';

export type SwiftSemanticNodeMatch = {
  kind: 'class' | 'property' | 'call' | 'member';
  name: string;
  lines: readonly number[];
};

export type SwiftIOSCanary001Match = {
  primary_node: SwiftSemanticNodeMatch;
  related_nodes: readonly SwiftSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type SwiftPresentationSrpMatch = {
  primary_node: SwiftSemanticNodeMatch;
  related_nodes: readonly SwiftSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type SwiftConcreteDependencyDipMatch = {
  primary_node: SwiftSemanticNodeMatch;
  related_nodes: readonly SwiftSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type SwiftOpenClosedSwitchMatch = {
  primary_node: SwiftSemanticNodeMatch;
  related_nodes: readonly SwiftSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type SwiftInterfaceSegregationMatch = {
  primary_node: SwiftSemanticNodeMatch;
  related_nodes: readonly SwiftSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type SwiftLiskovSubstitutionMatch = {
  primary_node: SwiftSemanticNodeMatch;
  related_nodes: readonly SwiftSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

const stripSwiftLineForSemanticScan = (line: string): string => {
  return line
    .replace(/\/\/.*$/, '')
    .replace(/"(?:\\.|[^"\\])*"/g, '""');
};

const collectSwiftRegexLines = (source: string, regex: RegExp): readonly number[] => {
  const matches: number[] = [];
  source.split(/\r?\n/).forEach((line, index) => {
    const sanitized = stripSwiftLineForSemanticScan(line);
    regex.lastIndex = 0;
    if (regex.test(sanitized)) {
      matches.push(index + 1);
    }
  });
  return matches;
};

const sanitizeSwiftSourceForMultilineRegex = (source: string): string => {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, '')
    .replace(/"(?:\\.|[^"\\])*"/g, '""');
};

const hasSwiftSanitizedRegexMatch = (source: string, regex: RegExp): boolean => {
  regex.lastIndex = 0;
  return regex.test(sanitizeSwiftSourceForMultilineRegex(source));
};

const hasSwiftUiModernizationSnapshotMatch = (source: string, entryId: string): boolean => {
  const entry = getIosSwiftUiModernizationEntry(entryId);
  if (!entry) {
    return false;
  }
  return hasSwiftSanitizedRegexMatch(source, new RegExp(entry.match.pattern, 'g'));
};

const sortedUniqueLines = (lines: ReadonlyArray<number>): readonly number[] => {
  return Array.from(new Set(lines.filter((line) => Number.isFinite(line)).map((line) => Math.trunc(line))))
    .sort((left, right) => left - right);
};

const countTokenOccurrences = (line: string, token: string): number => {
  let count = 0;
  let currentIndex = line.indexOf(token);
  while (currentIndex >= 0) {
    count += 1;
    currentIndex = line.indexOf(token, currentIndex + token.length);
  }
  return count;
};

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

type SwiftProtocolMember = {
  name: string;
  line: number;
};

type SwiftProtocolDeclaration = {
  name: string;
  line: number;
  members: readonly SwiftProtocolMember[];
};

type SwiftTypeDeclaration = {
  name: string;
  line: number;
  conformances: readonly string[];
  bodyStartLine: number;
  bodyEndLine: number;
};

type SwiftResponsibilityMatch = {
  key: string;
  node: SwiftSemanticNodeMatch;
};

const swiftQueryMemberNamePattern = /^(get|find|list|fetch|read|load|restore|refresh|is|has|can)/i;
const swiftCommandMemberNamePattern =
  /^(create|update|delete|remove|save|insert|upsert|set|write|persist|clear|reset|sync|store)/i;

const registerSwiftResponsibility = (
  nodes: SwiftResponsibilityMatch[],
  key: string,
  kind: SwiftSemanticNodeMatch['kind'],
  name: string,
  lines: readonly number[]
): void => {
  if (lines.length === 0) {
    return;
  }
  nodes.push({ key, node: { kind, name, lines } });
};

const hasSwiftResponsibilityKeys = (
  nodes: readonly SwiftResponsibilityMatch[],
  keys: readonly string[]
): boolean => {
  const observedKeys = new Set(nodes.map((node) => node.key));
  return keys.every((key) => observedKeys.has(key));
};

const isSwiftQueryMemberName = (name: string): boolean => swiftQueryMemberNamePattern.test(name);
const isSwiftCommandMemberName = (name: string): boolean => swiftCommandMemberNamePattern.test(name);

const parseSwiftProtocolDeclarations = (source: string): readonly SwiftProtocolDeclaration[] => {
  const lines = source.split(/\r?\n/);
  const declarations: SwiftProtocolDeclaration[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const sanitizedLine = stripSwiftLineForSemanticScan(lines[index] ?? '');
    const protocolMatch = sanitizedLine.match(/\bprotocol\s+([A-Za-z_][A-Za-z0-9_]*)\b/);
    if (!protocolMatch) {
      continue;
    }

    const protocolName = protocolMatch[1];
    if (!protocolName) {
      continue;
    }

    let braceDepth =
      countTokenOccurrences(sanitizedLine, '{') - countTokenOccurrences(sanitizedLine, '}');
    const members: SwiftProtocolMember[] = [];

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidateLine = stripSwiftLineForSemanticScan(lines[cursor] ?? '');
      const funcMatches = candidateLine.matchAll(/\bfunc\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g);
      for (const match of funcMatches) {
        const memberName = match[1];
        if (memberName) {
          members.push({ name: memberName, line: cursor + 1 });
        }
      }

      const varMatches = candidateLine.matchAll(/\bvar\s+([A-Za-z_][A-Za-z0-9_]*)\b/g);
      for (const match of varMatches) {
        const memberName = match[1];
        if (memberName) {
          members.push({ name: memberName, line: cursor + 1 });
        }
      }

      braceDepth += countTokenOccurrences(candidateLine, '{');
      braceDepth -= countTokenOccurrences(candidateLine, '}');
      if (braceDepth <= 0) {
        break;
      }
    }

    declarations.push({
      name: protocolName,
      line: index + 1,
      members,
    });
  }

  return declarations;
};

const visitSwiftTopLevelTypeBodyLines = (
  sourceLines: readonly string[],
  typeDeclaration: SwiftTypeDeclaration,
  visitor: (params: { line: string; lineNumber: number }) => boolean
): boolean => {
  const declarationLine = stripSwiftLineForSemanticScan(
    sourceLines[typeDeclaration.bodyStartLine - 1] ?? ''
  );
  let braceDepth =
    countTokenOccurrences(declarationLine, '{') - countTokenOccurrences(declarationLine, '}');

  for (
    let lineIndex = typeDeclaration.bodyStartLine;
    lineIndex < typeDeclaration.bodyEndLine && braceDepth > 0;
    lineIndex += 1
  ) {
    const line = stripSwiftLineForSemanticScan(sourceLines[lineIndex] ?? '');
    if (braceDepth === 1 && visitor({ line, lineNumber: lineIndex + 1 })) {
      return true;
    }

    braceDepth += countTokenOccurrences(line, '{');
    braceDepth -= countTokenOccurrences(line, '}');
  }

  return false;
};

const buildSwiftManagedObjectTypePatternSource = (source: string): string => {
  const patternParts = new Set<string>(['NSManagedObject\\b(?!ID\\b|Context\\b)']);

  for (const typeDeclaration of parseSwiftTypeDeclarations(source)) {
    if (typeDeclaration.conformances.includes('NSManagedObject')) {
      patternParts.add(`${escapeRegex(typeDeclaration.name)}\\b`);
    }
  }

  return Array.from(patternParts).join('|');
};

const parseSwiftTypeDeclarations = (source: string): readonly SwiftTypeDeclaration[] => {
  const lines = source.split(/\r?\n/);
  const declarations: SwiftTypeDeclaration[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const sanitizedLine = stripSwiftLineForSemanticScan(lines[index] ?? '');
    const typeMatch = sanitizedLine.match(
      /\b(?:final\s+)?(?:class|struct)\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([A-Za-z0-9_,\s]+)\s*\{/
    );
    if (!typeMatch) {
      continue;
    }

    const typeName = typeMatch[1];
    const rawConformances = typeMatch[2];
    if (!typeName || !rawConformances) {
      continue;
    }

    let braceDepth =
      countTokenOccurrences(sanitizedLine, '{') - countTokenOccurrences(sanitizedLine, '}');
    let bodyEndLine = index + 1;

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidateLine = stripSwiftLineForSemanticScan(lines[cursor] ?? '');
      braceDepth += countTokenOccurrences(candidateLine, '{');
      braceDepth -= countTokenOccurrences(candidateLine, '}');
      bodyEndLine = cursor + 1;
      if (braceDepth <= 0) {
        break;
      }
    }

    declarations.push({
      name: typeName,
      line: index + 1,
      conformances: rawConformances
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
      bodyStartLine: index + 1,
      bodyEndLine,
    });
  }

  return declarations;
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

export const hasSwiftForceUnwrap = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    return current === '!' && isForceUnwrapAt(swiftSource, index);
  });
};

export const hasSwiftAnyViewUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'A') {
      return false;
    }

    return hasIdentifierAt(swiftSource, index, 'AnyView');
  });
};

export const hasSwiftDispatchQueueUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'D' || !hasIdentifierAt(swiftSource, index, 'DispatchQueue')) {
      return false;
    }

    const dotIndex = nextNonWhitespaceIndex(swiftSource, index + 'DispatchQueue'.length);
    return dotIndex >= 0 && swiftSource[dotIndex] === '.';
  });
};

export const hasSwiftDispatchGroupUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'D') {
      return false;
    }

    return hasIdentifierAt(swiftSource, index, 'DispatchGroup');
  });
};

export const hasSwiftDispatchSemaphoreUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'D') {
      return false;
    }

    return hasIdentifierAt(swiftSource, index, 'DispatchSemaphore');
  });
};

export const hasSwiftOperationQueueUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'O') {
      return false;
    }

    return hasIdentifierAt(swiftSource, index, 'OperationQueue');
  });
};

export const hasSwiftTaskDetachedUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'T' || !hasIdentifierAt(swiftSource, index, 'Task')) {
      return false;
    }

    const dotIndex = nextNonWhitespaceIndex(swiftSource, index + 'Task'.length);
    if (dotIndex < 0 || swiftSource[dotIndex] !== '.') {
      return false;
    }

    const detachedIndex = nextNonWhitespaceIndex(swiftSource, dotIndex + 1);
    return detachedIndex >= 0 && hasIdentifierAt(swiftSource, detachedIndex, 'detached');
  });
};

export const hasSwiftStrongDelegateReferenceUsage = (source: string): boolean => {
  const delegatePropertyPattern =
    /\b(?:var|let)\s+(?:[A-Za-z_][A-Za-z0-9_]*(?:Delegate|DataSource)|delegate|dataSource)\s*:\s*(?:any\s+)?[A-Za-z_][A-Za-z0-9_]*(?:Delegate|DataSource)\b/;

  return source.split(/\r?\n/).some((line) => {
    const sanitizedLine = stripSwiftLineForSemanticScan(line);
    if (!delegatePropertyPattern.test(sanitizedLine)) {
      return false;
    }
    return !/\bweak\s+var\b/.test(sanitizedLine);
  });
};

const swiftStrongSelfEscapingClosurePatterns = [
  /\bTask\s*(?:\([^)]*\))?\s*\{/g,
  /\bDispatchQueue\s*\.\s*[A-Za-z0-9_.]+\s*\.\s*async(?:After)?\s*(?:\([^)]*\))?\s*\{/g,
  /\bTimer\s*\.\s*scheduledTimer\s*\([\s\S]{0,320}?\)\s*\{/g,
  /\bNotificationCenter\s*\.\s*default\s*\.\s*addObserver\s*\([\s\S]{0,420}?\busing\s*:\s*\{/g,
  /\.\s*sink\s*\([\s\S]{0,420}?\b(?:receiveValue|receiveCompletion)\s*:\s*\{/g,
  /\.\s*sink\s*\{/g,
  /\.\s*handleEvents\s*\([\s\S]{0,420}?\b(?:receiveOutput|receiveCompletion|receiveCancel)\s*:\s*\{/g,
];

const findMatchingSwiftBraceIndex = (source: string, openingBraceIndex: number): number => {
  let depth = 0;
  for (let index = openingBraceIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') {
      depth += 1;
      continue;
    }
    if (char !== '}') {
      continue;
    }
    depth -= 1;
    if (depth === 0) {
      return index;
    }
  }
  return -1;
};

const hasWeakOrUnownedSelfCaptureList = (closureBody: string): boolean => {
  const trimmedStart = closureBody.trimStart();
  if (!trimmedStart.startsWith('[')) {
    return false;
  }
  const captureListEndIndex = trimmedStart.indexOf(']');
  if (captureListEndIndex < 0) {
    return false;
  }
  const captureList = trimmedStart.slice(1, captureListEndIndex);
  return /\b(?:weak|unowned)\s+self\b/.test(captureList);
};

export const hasSwiftStrongSelfEscapingClosureUsage = (source: string): boolean => {
  const sanitized = sanitizeSwiftSourceForMultilineRegex(source);
  for (const pattern of swiftStrongSelfEscapingClosurePatterns) {
    pattern.lastIndex = 0;
    for (const match of sanitized.matchAll(pattern)) {
      const matchedSource = match[0] ?? '';
      const openingBraceOffset = matchedSource.lastIndexOf('{');
      if (openingBraceOffset < 0 || match.index === undefined) {
        continue;
      }
      const openingBraceIndex = match.index + openingBraceOffset;
      const closingBraceIndex = findMatchingSwiftBraceIndex(sanitized, openingBraceIndex);
      if (closingBraceIndex < 0) {
        continue;
      }
      const closureBody = sanitized.slice(openingBraceIndex + 1, closingBraceIndex);
      if (hasWeakOrUnownedSelfCaptureList(closureBody)) {
        continue;
      }
      if (/\bself\s*\./.test(closureBody)) {
        return true;
      }
    }
  }
  return false;
};

export const hasSwiftCustomSingletonUsage = (source: string): boolean => {
  const singletonDeclarationPattern =
    /^\s*(?:(?:private|fileprivate|internal|public|open)\s+)?static\s+(?:let|var)\s+shared\b(?:\s*:\s*[A-Za-z_][A-Za-z0-9_.<>]*)?\s*=/;
  return source.split(/\r?\n/).some((line) => {
    const sanitizedLine = stripSwiftLineForSemanticScan(line);
    return singletonDeclarationPattern.test(sanitizedLine);
  });
};

export const hasSwiftSwinjectUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(
    source,
    /\bimport\s+Swinject\b|\b(?:Container|Assembler)\s*\(/
  );
};

export const hasSwiftMassiveViewControllerResponsibilityUsage = (source: string): boolean => {
  const sanitized = sanitizeSwiftSourceForMultilineRegex(source);
  const viewControllerPattern =
    /\bclass\s+[A-Za-z_][A-Za-z0-9_]*\s*:\s*(?:[A-Za-z_][A-Za-z0-9_]*\s*,\s*)*UIViewController\b[\s\S]{0,8000}?\n\}/g;
  const infrastructurePattern =
    /\b(?:URLSession\s*\.\s*shared|JSONSerialization|UserDefaults\s*\.\s*standard|NSManagedObjectContext|NSPersistentContainer|NSFetchRequest|FileManager\s*\.\s*default)\b/;

  for (const match of sanitized.matchAll(viewControllerPattern)) {
    const body = match[0] ?? '';
    if (infrastructurePattern.test(body)) {
      return true;
    }
  }
  return false;
};

export const hasSwiftNonIBOutletImplicitlyUnwrappedOptionalUsage = (source: string): boolean => {
  const lines = source.split(/\r?\n/);
  const implicitlyUnwrappedPropertyPattern =
    /\b(?:var|let)\s+[A-Za-z_][A-Za-z0-9_]*\s*:\s*(?:[A-Za-z_][A-Za-z0-9_.<>?]*\s*)!\s*(?:[=,{]|$)/;

  return lines.some((line, index) => {
    const sanitizedLine = stripSwiftLineForSemanticScan(line);
    if (!implicitlyUnwrappedPropertyPattern.test(sanitizedLine)) {
      return false;
    }
    const previousLine = index > 0 ? stripSwiftLineForSemanticScan(lines[index - 1] ?? '') : '';
    return !/\B@IBOutlet\b/.test(`${previousLine} ${sanitizedLine}`);
  });
};

export const hasSwiftMagicNumberLayoutUsage = (source: string): boolean => {
  const swiftUiLayoutNumberPattern =
    /(?:\b(?:VStack|HStack|ZStack|LazyVStack|LazyHStack)\s*\([^)]*\bspacing\s*:\s*|\.(?:padding|frame|offset|position|shadow|blur)\s*\([^)]*(?:\b(?:width|height|spacing|radius|x|y)\s*:\s*)?)\b(?:[3-9]|[1-9][0-9]+)(?:\.[0-9]+)?\b/;

  return collectSwiftRegexLines(source, swiftUiLayoutNumberPattern).length > 0;
};

export const hasSwiftAdHocLoggingUsage = (source: string): boolean => {
  return collectSwiftRegexLines(
    source,
    /\b(?:print|debugPrint|dump|NSLog|os_log)\s*\(/
  ).length > 0;
};

export const hasSwiftSensitiveLoggingUsage = (source: string): boolean => {
  return source.split(/\r?\n/).some((line) => {
    const sanitized = stripSwiftLineForSemanticScan(line);
    const lineWithoutComments = line.replace(/\/\/.*$/, '');
    const hasLoggingCall =
      /\b(?:print|debugPrint|dump|NSLog|os_log)\s*\(/.test(sanitized) ||
      /\b(?:logger|log)\s*\.\s*(?:debug|info|notice|warning|error|critical|log)\s*\(/i.test(
        sanitized
      );

    if (!hasLoggingCall) {
      return false;
    }

    return /\b(?:accessToken|refreshToken|authToken|token|password|secret|credential|authorization|email|userId)\b/i.test(
      lineWithoutComments
    );
  });
};

export const hasSwiftHardcodedSensitiveStringUsage = (source: string): boolean => {
  return collectSwiftRegexLines(
    source,
    /\b(?:(?:private|fileprivate|internal|public|open|static|class|final|lazy)\s+)*(?:let|var)\s+(?=[A-Za-z_])[A-Za-z0-9_]*(?:token|secret|password|apikey|clientsecret|privatekey|sessionid)[A-Za-z0-9_]*\s*(?::\s*String\s*)?=\s*""/i
  ).length > 0;
};

export const hasSwiftAlamofireUsage = (source: string): boolean => {
  return (
    collectSwiftRegexLines(source, /^\s*import\s+Alamofire\b/).length > 0 ||
    collectSwiftRegexLines(source, /\b(?:AF|Alamofire)\s*\.\s*request\b/).length > 0
  );
};

export const hasSwiftJSONSerializationUsage = (source: string): boolean => {
  return collectSwiftRegexLines(source, /\bJSONSerialization\s*\./).length > 0;
};

export const hasSwiftSensitiveUserDefaultsStorageUsage = (source: string): boolean => {
  return source.split(/\r?\n/).some((line) => {
    const sanitized = stripSwiftLineForSemanticScan(line);
    const lineWithoutComments = line.replace(/\/\/.*$/, '');
    const hasUserDefaultsWrite = /\bUserDefaults\s*\.\s*standard\s*\.\s*set\s*\(/.test(sanitized);
    const hasAppStorage = /@\s*AppStorage\s*\(/.test(sanitized);

    if (!hasUserDefaultsWrite && !hasAppStorage) {
      return false;
    }

    return /\b(?:accessToken|refreshToken|authToken|token|password|secret|credential|authorization|bearer|apiKey|sessionId)\b/i.test(
      lineWithoutComments
    );
  });
};

export const hasSwiftInsecureTransportUsage = (source: string): boolean => {
  const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, '\n');
  const hasHttpUrlLiteral = withoutBlockComments.split(/\r?\n/).some((line) => {
    if (/^\s*\/\//.test(line)) {
      return false;
    }
    return /["']http:\/\/[^"']*["']/.test(line);
  });

  if (hasHttpUrlLiteral) {
    return true;
  }

  return (
    /<key>\s*NSAllowsArbitraryLoads\s*<\/key>\s*<true\s*\/>/i.test(source) ||
    /\bNSAllowsArbitraryLoads\b\s*=\s*(?:true|YES|1)\b/i.test(source)
  );
};

const swiftUiLiteralTextPatterns = [
  /\b(?:Text|Button|Label|TextField|SecureField)\s*\(\s*"((?:\\.|[^"\\])*)"/,
  /\.navigationTitle\s*\(\s*"((?:\\.|[^"\\])*)"/,
  /\.navigationSubtitle\s*\(\s*"((?:\\.|[^"\\])*)"/,
  /\.accessibilityLabel\s*\(\s*"((?:\\.|[^"\\])*)"/,
];

const looksLikeLocalizationKey = (value: string): boolean => {
  return /^[A-Za-z0-9_]+(?:[.-][A-Za-z0-9_]+)+$/.test(value);
};

export const hasSwiftHardcodedUiStringUsage = (source: string): boolean => {
  const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, '\n');
  return withoutBlockComments.split(/\r?\n/).some((line) => {
    if (/^\s*\/\//.test(line)) {
      return false;
    }
    const withoutInlineComment = line.replace(/\/\/.*$/, '');
    return swiftUiLiteralTextPatterns.some((pattern) => {
      const match = withoutInlineComment.match(pattern);
      if (!match) {
        return false;
      }
      const literal = match[1]?.trim() ?? '';
      if (literal.length === 0) {
        return false;
      }
      return !looksLikeLocalizationKey(literal);
    });
  });
};

export const hasSwiftLooseAssetResourceUsage = (source: string): boolean => {
  const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, '\n');
  return withoutBlockComments.split(/\r?\n/).some((line) => {
    if (/^\s*\/\//.test(line)) {
      return false;
    }
    const sanitized = stripSwiftLineForSemanticScan(line);
    return (
      /\bUIImage\s*\(\s*contentsOfFile\s*:/.test(sanitized) ||
      /\bNSImage\s*\(\s*contentsOfFile\s*:/.test(sanitized) ||
      /\bBundle\s*\.\s*main\s*\.\s*(?:path|url)\s*\(\s*forResource\s*:\s*""\s*,\s*withExtension\s*:\s*""/.test(
        sanitized
      )
    );
  });
};

export const hasSwiftFixedFontSizeUsage = (source: string): boolean => {
  const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, '\n');
  return withoutBlockComments.split(/\r?\n/).some((line) => {
    if (/^\s*\/\//.test(line)) {
      return false;
    }
    const sanitized = stripSwiftLineForSemanticScan(line);
    return (
      /\.\s*font\s*\(\s*\.\s*system\s*\(\s*size\s*:/.test(sanitized) ||
      /\bFont\s*\.\s*system\s*\(\s*size\s*:/.test(sanitized) ||
      /\bUIFont\s*\.\s*(?:systemFont|boldSystemFont|italicSystemFont)\s*\(\s*ofSize\s*:/.test(
        sanitized
      )
    );
  });
};

export const hasSwiftPhysicalTextAlignmentUsage = (source: string): boolean => {
  const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, '\n');
  return withoutBlockComments.split(/\r?\n/).some((line) => {
    if (/^\s*\/\//.test(line)) {
      return false;
    }
    const sanitized = stripSwiftLineForSemanticScan(line);
    return (
      /\.\s*multilineTextAlignment\s*\(\s*\.\s*(?:left|right)\s*\)/.test(sanitized) ||
      /\.\s*frame\s*\([^)]*alignment\s*:\s*\.\s*(?:left|right)\b/.test(sanitized) ||
      /\bTextAlignment\s*\.\s*(?:left|right)\b/.test(sanitized) ||
      /\bNSTextAlignment\s*\.\s*(?:left|right)\b/.test(sanitized)
    );
  });
};

export const hasSwiftMainThreadBlockingSleepUsage = (source: string): boolean => {
  const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, '\n');
  return withoutBlockComments.split(/\r?\n/).some((line) => {
    if (/^\s*\/\//.test(line)) {
      return false;
    }
    const sanitized = stripSwiftLineForSemanticScan(line);
    return (
      /\bThread\s*\.\s*sleep\s*\(/.test(sanitized) ||
      /(^|[^\w.])sleep\s*\(/.test(sanitized) ||
      /(^|[^\w.])usleep\s*\(/.test(sanitized)
    );
  });
};

export const hasSwiftIconOnlyControlWithoutAccessibilityLabelUsage = (source: string): boolean => {
  const sanitized = sanitizeSwiftSourceForMultilineRegex(source);
  const iconOnlyButtonPattern =
    /\bButton\s*(?:\([^)]*\))?\s*\{[\s\S]{0,240}?\bImage\s*\(\s*systemName\s*:\s*""\s*\)[\s\S]{0,240}?\}/g;
  for (const match of sanitized.matchAll(iconOnlyButtonPattern)) {
    const segment = match[0] ?? '';
    const following = sanitized.slice(match.index ?? 0, (match.index ?? 0) + segment.length + 160);
    if (!/\.\s*accessibilityLabel\s*\(/.test(following)) {
      return true;
    }
  }
  return false;
};

export const hasSwiftUncheckedSendableUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== '@' || !swiftSource.startsWith('@unchecked', index)) {
      return false;
    }

    const sendableIndex = nextNonWhitespaceIndex(swiftSource, index + '@unchecked'.length);
    return sendableIndex >= 0 && hasIdentifierAt(swiftSource, sendableIndex, 'Sendable');
  });
};

export const hasSwiftPreconcurrencyUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(source, /@\s*preconcurrency\b/);
};

export const hasSwiftNonisolatedUnsafeUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(source, /\bnonisolated\s*\(\s*unsafe\s*\)/);
};

export const hasSwiftAssumeIsolatedUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(source, /\bassumeIsolated\b/);
};

export const hasSwiftObservableObjectUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'O') {
      return false;
    }

    return hasIdentifierAt(swiftSource, index, 'ObservableObject');
  });
};

export const hasSwiftForEachIndicesUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(
    source,
    /\bForEach\s*\(\s*(?:Array\s*\(\s*)?[A-Za-z_][A-Za-z0-9_.]*\.indices\b/g
  );
};

const isUserSearchIdentifier = (value: string): boolean => {
  return /^(?:query|search(?:Text|Term|Query|Value)?|filter(?:Text|Value)?|text|term|input)$/i.test(
    value
  );
};

export const hasSwiftContainsUserFilterUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'c' || !hasIdentifierAt(swiftSource, index, 'contains')) {
      return false;
    }

    const openingParenIndex = nextNonWhitespaceIndex(swiftSource, index + 'contains'.length);
    if (openingParenIndex < 0 || swiftSource[openingParenIndex] !== '(') {
      return false;
    }

    const argumentIndex = nextNonWhitespaceIndex(swiftSource, openingParenIndex + 1);
    if (argumentIndex < 0 || !isIdentifierCharacter(swiftSource[argumentIndex] ?? '')) {
      return false;
    }

    let argumentEnd = argumentIndex;
    while (isIdentifierCharacter(swiftSource[argumentEnd + 1] ?? '')) {
      argumentEnd += 1;
    }

    const argumentIdentifier = swiftSource.slice(argumentIndex, argumentEnd + 1);
    return isUserSearchIdentifier(argumentIdentifier);
  });
};

export const hasSwiftGeometryReaderUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'G') {
      return false;
    }

    return hasIdentifierAt(swiftSource, index, 'GeometryReader');
  });
};

export const hasSwiftFontWeightBoldUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(source, /\.\s*fontWeight\s*\(\s*\.bold\s*\)/g);
};

export const hasSwiftLegacySwiftUiObservableWrapperUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(source, /@\s*(?:StateObject|ObservedObject)\b/);
};

const hasSwiftPassedValueWrapperInitialization = (
  source: string,
  options: {
    wrapperAttribute: 'State' | 'StateObject';
    wrapperFactoryPattern: string;
  }
): boolean => {
  const sanitized = sanitizeSwiftSourceForMultilineRegex(source);
  const propertyPattern = new RegExp(
    `@\\s*${options.wrapperAttribute}\\b[\\s\\S]{0,120}?\\b(?:var|let)\\s+([A-Za-z_][A-Za-z0-9_]*)\\b`,
    'g'
  );

  for (const propertyMatch of sanitized.matchAll(propertyPattern)) {
    const propertyName = propertyMatch[1];
    if (!propertyName) {
      continue;
    }

    const initPattern = new RegExp(
      `\\binit\\s*\\(([^)]*)\\)[\\s\\S]{0,400}?\\b(?:self\\.)?_${propertyName}\\s*=\\s*${options.wrapperFactoryPattern}\\s*([A-Za-z_][A-Za-z0-9_]*)\\b`,
      'g'
    );

    for (const initMatch of sanitized.matchAll(initPattern)) {
      const initParameters = initMatch[1] ?? '';
      const assignedIdentifier = initMatch[2];
      if (!assignedIdentifier) {
        continue;
      }

      const parameterPattern = new RegExp(`\\b${assignedIdentifier}\\s*:`);
      if (parameterPattern.test(initParameters)) {
        return true;
      }
    }
  }

  return false;
};

export const hasSwiftPassedValueStateWrapperUsage = (source: string): boolean => {
  return (
    hasSwiftPassedValueWrapperInitialization(source, {
      wrapperAttribute: 'State',
      wrapperFactoryPattern: 'State\\s*\\(\\s*initialValue\\s*:',
    }) ||
    hasSwiftPassedValueWrapperInitialization(source, {
      wrapperAttribute: 'StateObject',
      wrapperFactoryPattern: 'StateObject\\s*\\(\\s*wrappedValue\\s*:',
    })
  );
};

export const hasSwiftNavigationViewUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'N') {
      return false;
    }

    return hasIdentifierAt(swiftSource, index, 'NavigationView');
  });
};

export const hasSwiftForegroundColorUsage = (source: string): boolean => {
  return hasSwiftUiModernizationSnapshotMatch(source, 'foreground-color');
};

export const hasSwiftCornerRadiusUsage = (source: string): boolean => {
  return hasSwiftUiModernizationSnapshotMatch(source, 'corner-radius');
};

export const hasSwiftTabItemUsage = (source: string): boolean => {
  return hasSwiftUiModernizationSnapshotMatch(source, 'tab-item');
};

export const hasSwiftOnTapGestureUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'o') {
      return false;
    }

    return hasIdentifierAt(swiftSource, index, 'onTapGesture');
  });
};

export const hasSwiftStringFormatUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'S' || !hasIdentifierAt(swiftSource, index, 'String')) {
      return false;
    }

    const openingParenIndex = nextNonWhitespaceIndex(swiftSource, index + 'String'.length);
    if (openingParenIndex < 0 || swiftSource[openingParenIndex] !== '(') {
      return false;
    }

    const formatIndex = nextNonWhitespaceIndex(swiftSource, openingParenIndex + 1);
    if (formatIndex < 0 || !hasIdentifierAt(swiftSource, formatIndex, 'format')) {
      return false;
    }

    const colonIndex = nextNonWhitespaceIndex(swiftSource, formatIndex + 'format'.length);
    return colonIndex >= 0 && swiftSource[colonIndex] === ':';
  });
};

export const hasSwiftUIScreenMainBoundsUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'U' || !hasIdentifierAt(swiftSource, index, 'UIScreen')) {
      return false;
    }

    const dotMainIndex = nextNonWhitespaceIndex(swiftSource, index + 'UIScreen'.length);
    if (dotMainIndex < 0 || swiftSource[dotMainIndex] !== '.') {
      return false;
    }

    const mainIndex = nextNonWhitespaceIndex(swiftSource, dotMainIndex + 1);
    if (mainIndex < 0 || !hasIdentifierAt(swiftSource, mainIndex, 'main')) {
      return false;
    }

    const dotBoundsIndex = nextNonWhitespaceIndex(swiftSource, mainIndex + 'main'.length);
    if (dotBoundsIndex < 0 || swiftSource[dotBoundsIndex] !== '.') {
      return false;
    }

    const boundsIndex = nextNonWhitespaceIndex(swiftSource, dotBoundsIndex + 1);
    return boundsIndex >= 0 && hasIdentifierAt(swiftSource, boundsIndex, 'bounds');
  });
};

export const hasSwiftScrollViewShowsIndicatorsUsage = (source: string): boolean => {
  return hasSwiftUiModernizationSnapshotMatch(source, 'scrollview-shows-indicators');
};

export const hasSwiftSheetIsPresentedUsage = (source: string): boolean => {
  return hasSwiftUiModernizationSnapshotMatch(source, 'sheet-is-presented');
};

export const hasSwiftLegacyOnChangeUsage = (source: string): boolean => {
  return hasSwiftUiModernizationSnapshotMatch(source, 'legacy-onchange');
};

const hasSwiftXCTestImportUsage = (source: string): boolean => {
  return collectSwiftRegexLines(source, /^\s*import\s+XCTest\b/).length > 0;
};

const hasSwiftLegacyXCTestUiOrPerformanceUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(source, /\bXCUIApplication\b|\bXCTMetric\b|\bmeasure\s*(?:\(|\{)/);
};

const hasSwiftTestingImportUsage = (source: string): boolean => {
  return collectSwiftRegexLines(source, /^\s*import\s+Testing\b/).length > 0;
};

const hasSwiftTestingSuiteAttributeUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(source, /\B@(?:Test|Suite)\b/);
};

const hasSwiftXCTestCaseSubclassUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(
    source,
    /\bclass\s+[A-Za-z_][A-Za-z0-9_]*\s*:\s*XCTestCase\b/
  );
};

const hasSwiftLegacyXCTestMethodUsage = (source: string): boolean => {
  return collectSwiftRegexLines(source, /^\s*(?:override\s+)?func\s+test[A-Za-z0-9_]*\s*\(/)
    .length > 0;
};

export const hasSwiftLegacyXCTestImportUsage = (source: string): boolean => {
  if (!hasSwiftXCTestImportUsage(source)) {
    return false;
  }

  if (hasSwiftLegacyXCTestUiOrPerformanceUsage(source)) {
    return false;
  }

  return true;
};

export const hasSwiftModernizableXCTestSuiteUsage = (source: string): boolean => {
  if (!hasSwiftLegacyXCTestImportUsage(source)) {
    return false;
  }

  if (!hasSwiftXCTestCaseSubclassUsage(source) || !hasSwiftLegacyXCTestMethodUsage(source)) {
    return false;
  }

  if (hasSwiftTestingImportUsage(source) || hasSwiftTestingSuiteAttributeUsage(source)) {
    return false;
  }

  return true;
};

export const hasSwiftMixedTestingFrameworksUsage = (source: string): boolean => {
  if (!hasSwiftXCTestImportUsage(source) || !hasSwiftXCTestCaseSubclassUsage(source)) {
    return false;
  }

  return hasSwiftTestingImportUsage(source) || hasSwiftTestingSuiteAttributeUsage(source);
};

export const hasSwiftQuickNimbleUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(
    source,
    /\bimport\s+(?:Quick|Nimble)\b|\bclass\s+[A-Za-z_][A-Za-z0-9_]*\s*:\s*QuickSpec\b/
  );
};

export const hasSwiftXCTestAssertionUsage = (source: string): boolean => {
  return (
    collectSwiftRegexLines(source, /\bXCTAssert[A-Za-z0-9_]*\s*\(/).length > 0 ||
    collectSwiftRegexLines(source, /\bXCTFail\s*\(/).length > 0
  );
};

export const hasSwiftXCTUnwrapUsage = (source: string): boolean => {
  return collectSwiftRegexLines(source, /\bXCTUnwrap\s*\(/).length > 0;
};

const hasSwiftAwaitFulfillmentUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(source, /\bawait\s+fulfillment\s*\(\s*of\s*:/);
};

const hasSwiftConfirmationUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(source, /\bawait\s+confirmation\b/);
};

export const hasSwiftWaitForExpectationsUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(
    source,
    /\bwait\s*\(\s*for\s*:|\bwaitForExpectations\s*\(/
  );
};

export const hasSwiftLegacyExpectationDescriptionUsage = (source: string): boolean => {
  const hasLegacyExpectation = collectSwiftRegexLines(
    source,
    /\bexpectation\s*\(\s*description\s*:/
  ).length > 0;

  if (!hasLegacyExpectation) {
    return false;
  }

  if (hasSwiftAwaitFulfillmentUsage(source) || hasSwiftConfirmationUsage(source)) {
    return false;
  }

  return true;
};

export const hasSwiftNSManagedObjectBoundaryUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(
    source,
    /\bfunc\b[\s\S]{0,240}\([^)]*\bNSManagedObject\b(?!ID\b|Context\b)[^)]*\)|\b(?:var|let)\s+[A-Za-z_][A-Za-z0-9_]*\s*:\s*(?:\[[^\]]*NSManagedObject\b(?!ID\b|Context\b)[^\]]*\]|NSManagedObject\b(?!ID\b|Context\b))/g
  );
};

export const hasSwiftNSManagedObjectAsyncBoundaryUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(
    source,
    /\bfunc\b[\s\S]{0,240}\basync\b[\s\S]{0,200}(?:\([^)]*\bNSManagedObject\b(?!ID\b|Context\b)[^)]*\)|->\s*(?:\[[^\]]*NSManagedObject\b(?!ID\b|Context\b)[^\]]*\]|NSManagedObject\b(?!ID\b|Context\b)))/g
  );
};

export const hasSwiftCoreDataLayerLeakUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(
    source,
    /\bimport\s+CoreData\b|@\s*FetchRequest\b|\b(?:FetchRequest|FetchedResults|NSPersistentContainer|NSManagedObjectContext|NSFetchRequest|NSFetchedResultsController|NSEntityDescription)\b|\.managedObjectContext\b/g
  );
};

export const hasSwiftSwiftDataLayerLeakUsage = (source: string): boolean => {
  return hasSwiftSanitizedRegexMatch(
    source,
    /\bimport\s+SwiftData\b|@\s*Query\b|@\s*Model\b|\b(?:ModelContext|ModelContainer|FetchDescriptor)\b|\.modelContext\b/g
  );
};

export const hasSwiftNSManagedObjectStateLeakUsage = (source: string): boolean => {
  const typeDeclarations = parseSwiftTypeDeclarations(source);
  if (typeDeclarations.length === 0) {
    return false;
  }

  const managedObjectTypePatternSource = buildSwiftManagedObjectTypePatternSource(source);
  const propertyPattern = new RegExp(
    `\\b(?:var|let)\\s+[A-Za-z_][A-Za-z0-9_]*\\s*:\\s*(?:\\[[^\\]]*(?:${managedObjectTypePatternSource})[^\\]]*\\]|(?:${managedObjectTypePatternSource})(?:[?!])?)`
  );
  const stateWrapperPattern =
    /@\s*(?:State|Binding|Bindable|StateObject|ObservedObject|EnvironmentObject|Published)\b/;
  const sourceLines = source.split(/\r?\n/);

  for (const typeDeclaration of typeDeclarations) {
    const isSwiftUIView = typeDeclaration.conformances.includes('View');
    const isViewModel =
      typeDeclaration.name.endsWith('ViewModel') ||
      typeDeclaration.conformances.includes('ObservableObject');

    if (!isSwiftUIView && !isViewModel) {
      continue;
    }

    let pendingStateWrapper = false;
    const hasLeak = visitSwiftTopLevelTypeBodyLines(sourceLines, typeDeclaration, ({ line }) => {
      const isWrapperLine = stateWrapperPattern.test(line);
      const hasManagedObjectProperty = propertyPattern.test(line);

      if (isViewModel && hasManagedObjectProperty) {
        return true;
      }

      if (isSwiftUIView && hasManagedObjectProperty && (pendingStateWrapper || isWrapperLine)) {
        return true;
      }

      if (isWrapperLine && !hasManagedObjectProperty) {
        pendingStateWrapper = true;
        return false;
      }

      pendingStateWrapper = false;
      return false;
    });

    if (hasLeak) {
      return true;
    }
  }

  return false;
};

export const hasSwiftForceTryUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 't' || !hasIdentifierAt(swiftSource, index, 'try')) {
      return false;
    }

    const bangIndex = nextNonWhitespaceIndex(swiftSource, index + 'try'.length);
    return bangIndex >= 0 && swiftSource[bangIndex] === '!';
  });
};

export const hasSwiftForceCastUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'a' || !hasIdentifierAt(swiftSource, index, 'as')) {
      return false;
    }

    const bangIndex = nextNonWhitespaceIndex(swiftSource, index + 'as'.length);
    return bangIndex >= 0 && swiftSource[bangIndex] === '!';
  });
};

export const hasSwiftCallbackStyleSignature = (source: string): boolean => {
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

export const findSwiftIOSCanary001Match = (source: string): SwiftIOSCanary001Match | undefined => {
  const classPattern = /\b(?:final\s+)?class\s+([A-Za-z0-9_]*ViewModel)\b/;
  const classLines = collectSwiftRegexLines(source, classPattern);
  if (classLines.length === 0) {
    return undefined;
  }

  const classLine = source.split(/\r?\n/)[classLines[0] - 1] ?? '';
  const className = classLine.match(classPattern)?.[1];
  if (!className) {
    return undefined;
  }

  const explicitInfraResponsibilities: SwiftResponsibilityMatch[] = [];
  registerSwiftResponsibility(
    explicitInfraResponsibilities,
    'shared-state',
    'property',
    'shared singleton',
    collectSwiftRegexLines(source, /\bstatic\s+let\s+shared\b/)
  );
  registerSwiftResponsibility(
    explicitInfraResponsibilities,
    'networking',
    'call',
    'URLSession.shared',
    collectSwiftRegexLines(source, /\bURLSession\.shared\b/)
  );
  registerSwiftResponsibility(
    explicitInfraResponsibilities,
    'persistence',
    'call',
    'FileManager.default',
    collectSwiftRegexLines(source, /\bFileManager\.default\b/)
  );
  registerSwiftResponsibility(
    explicitInfraResponsibilities,
    'navigation',
    'member',
    'navigation flow',
    collectSwiftRegexLines(
      source,
      /\b(?:router|route|coordinator|navigationPath|navigationDestination)\b|\b(?:navigate|dismiss|present)\s*\(/i
    )
  );

  if (hasSwiftResponsibilityKeys(explicitInfraResponsibilities, ['networking', 'persistence', 'navigation'])) {
    const explicitInfraNodes = explicitInfraResponsibilities.map((entry) => entry.node);
    const relatedNodeNames = explicitInfraNodes.map((node) => node.name).join(', ');
    const allLines = sortedUniqueLines([
      ...classLines,
      ...explicitInfraNodes.flatMap((node) => [...node.lines]),
    ]);

    return {
      primary_node: {
        kind: 'class',
        name: className,
        lines: classLines,
      },
      related_nodes: explicitInfraNodes,
      why: `${className} mezcla ${relatedNodeNames} dentro del mismo ViewModel, rompiendo SRP y el boundary de Clean Architecture en iOS.`,
      impact:
        'Presentation queda acoplada a infraestructura y navegación, se dificulta el aislamiento en tests y aumenta el riesgo de regresiones al cambiar cualquier responsabilidad.',
      expected_fix:
        'Extrae networking, persistencia y navegación a colaboradores separados de application/infrastructure y deja el ViewModel limitado a estado y orquestación por puertos.',
      lines: allLines,
    };
  }

  const appShellResponsibilities: SwiftResponsibilityMatch[] = [];
  registerSwiftResponsibility(
    appShellResponsibilities,
    'session',
    'member',
    'session bootstrap/restoration',
    collectSwiftRegexLines(source, /\b(?:restorePersistedSessionIfNeeded|continueAsGuest|bootstrapAuthenticatedSession)\s*\(/)
  );
  registerSwiftResponsibility(
    appShellResponsibilities,
    'store',
    'member',
    'store selection orchestration',
    collectSwiftRegexLines(source, /\bselectStore\s*\(/)
  );
  registerSwiftResponsibility(
    appShellResponsibilities,
    'shopping-list',
    'member',
    'shopping list synchronization',
    collectSwiftRegexLines(source, /\bsyncShoppingList\s*\(/)
  );
  registerSwiftResponsibility(
    appShellResponsibilities,
    'route',
    'member',
    'route progression',
    collectSwiftRegexLines(source, /\b(?:markNextStopCompleted|scanCheckpoint|rebuildRouteStatus)\s*\(/)
  );
  registerSwiftResponsibility(
    appShellResponsibilities,
    'offline-queue',
    'member',
    'offline queue coordination',
    collectSwiftRegexLines(source, /\b(?:flushOfflineQueue|enqueueOfflineCheckpoint)\s*\(/)
  );
  registerSwiftResponsibility(
    appShellResponsibilities,
    'navigation',
    'member',
    'deep link/navigation flow',
    collectSwiftRegexLines(source, /\bopenDeepLink\s*\(/)
  );

  if (!hasSwiftResponsibilityKeys(appShellResponsibilities, ['session', 'store', 'route', 'navigation'])) {
    return undefined;
  }

  const appShellNodes = appShellResponsibilities.map((entry) => entry.node);
  const relatedNodeNames = appShellNodes.map((node) => node.name).join(', ');
  const allLines = sortedUniqueLines([
    ...classLines,
    ...appShellNodes.flatMap((node) => [...node.lines]),
  ]);

  return {
    primary_node: {
      kind: 'class',
      name: className,
      lines: classLines,
    },
    related_nodes: appShellNodes,
    why: `${className} concentra ${relatedNodeNames} en presentation, mezclando múltiples razones de cambio incompatibles con SRP y Clean Architecture.`,
    impact:
      'El ViewModel queda sobreacoplado a bootstrap de sesión, selección de tienda, sincronización de lista, navegación y cola offline, dificultando aislamiento, testing y evolución segura de la feature.',
    expected_fix:
      'Extrae bootstrap/restauración de sesión, coordinación de tienda/ruta, deep links y cola offline a casos de uso o coordinadores dedicados; deja el ViewModel como orquestador ligero de estado.',
    lines: allLines,
  };
};

export const findSwiftPresentationSrpMatch = (
  source: string
): SwiftPresentationSrpMatch | undefined => {
  const classPattern = /\b(?:final\s+)?class\s+([A-Za-z0-9_]*(?:ViewModel|Presenter))\b/;
  const classLines = collectSwiftRegexLines(source, classPattern);
  if (classLines.length === 0) {
    return undefined;
  }

  const classLine = source.split(/\r?\n/)[classLines[0] - 1] ?? '';
  const className = classLine.match(classPattern)?.[1];
  if (!className) {
    return undefined;
  }

  const responsibilities: SwiftResponsibilityMatch[] = [];
  const registerNode = (
    key: string,
    kind: SwiftSemanticNodeMatch['kind'],
    name: string,
    regex: RegExp
  ): void => {
    registerSwiftResponsibility(responsibilities, key, kind, name, collectSwiftRegexLines(source, regex));
  };

  registerNode(
    'session',
    'member',
    'session/auth flow',
    /\b(?:restore|bootstrap|refresh|resume|signIn|signOut|authenticate|session)\w*\s*\(/
  );
  registerNode(
    'networking',
    'call',
    'remote networking',
    /\b(?:URLSession\.shared|URLRequest\b|dataTask\s*\(|uploadTask\s*\(|downloadTask\s*\()/
  );
  registerNode(
    'persistence',
    'call',
    'local persistence',
    /\b(?:UserDefaults\.standard|FileManager\.default|Keychain|NSPersistentContainer|CoreData)\b/
  );
  registerNode(
    'navigation',
    'member',
    'navigation flow',
    /\b(?:navigationPath|navigationDestination)\b|(?:\.\s*(?:navigate|present|dismiss|push|open)\s*\()/
  );

  if (!hasSwiftResponsibilityKeys(responsibilities, ['session', 'networking', 'persistence', 'navigation'])) {
    return undefined;
  }

  const relatedNodes = responsibilities.map((entry) => entry.node);
  const allLines = sortedUniqueLines([
    ...classLines,
    ...relatedNodes.flatMap((node) => [...node.lines]),
  ]);

  return {
    primary_node: {
      kind: 'class',
      name: className,
      lines: classLines,
    },
    related_nodes: relatedNodes,
    why: `${className} concentra session/auth flow, networking remoto, persistencia local y navegación dentro del mismo tipo de presentation, rompiendo SRP.`,
    impact:
      'Presentation acumula múltiples razones de cambio y queda más frágil ante cambios de sesión, transporte, almacenamiento o navegación.',
    expected_fix:
      'Deja el tipo limitado a estado observable y delegación; extrae sesión, persistencia, networking y navegación a coordinadores o casos de uso dedicados.',
    lines: allLines,
  };
};

export const findSwiftConcreteDependencyDipMatch = (
  source: string
): SwiftConcreteDependencyDipMatch | undefined => {
  const classPattern =
    /\b(?:final\s+)?class\s+([A-Za-z0-9_]*(?:UseCase|Service|ViewModel|Presenter|Controller|Coordinator))\b/;
  const classLines = collectSwiftRegexLines(source, classPattern);
  if (classLines.length === 0) {
    return undefined;
  }

  const classLine = source.split(/\r?\n/)[classLines[0] - 1] ?? '';
  const className = classLine.match(classPattern)?.[1];
  if (!className) {
    return undefined;
  }

  const relatedNodes: SwiftSemanticNodeMatch[] = [];
  const registerNode = (
    kind: SwiftSemanticNodeMatch['kind'],
    name: string,
    regex: RegExp
  ): void => {
    const lines = collectSwiftRegexLines(source, regex);
    if (lines.length === 0) {
      return;
    }
    relatedNodes.push({ kind, name, lines });
  };

  registerNode(
    'property',
    'concrete dependency: URLSession',
    /\b(?:let|var)\s+\w+\s*:\s*URLSession\b/
  );
  registerNode('call', 'URLSession.shared', /\bURLSession\.shared\b/);
  registerNode(
    'property',
    'concrete dependency: UserDefaults',
    /\b(?:let|var)\s+\w+\s*:\s*UserDefaults\b/
  );
  registerNode('call', 'UserDefaults.standard', /\bUserDefaults\.standard\b/);
  registerNode(
    'property',
    'concrete dependency: FileManager',
    /\b(?:let|var)\s+\w+\s*:\s*FileManager\b/
  );
  registerNode('call', 'FileManager.default', /\bFileManager\.default\b/);

  if (relatedNodes.length === 0) {
    return undefined;
  }

  const allLines = sortedUniqueLines([
    ...classLines,
    ...relatedNodes.flatMap((node) => [...node.lines]),
  ]);

  return {
    primary_node: {
      kind: 'class',
      name: className,
      lines: classLines,
    },
    related_nodes: relatedNodes,
    why: `${className} depende directamente de servicios concretos del framework en application/presentation, rompiendo DIP al saltarse puertos o abstracciones.`,
    impact:
      'La capa de alto nivel queda acoplada a detalles de infraestructura concretos, se dificulta el test aislado y aumenta el coste de sustituir transporte o persistencia.',
    expected_fix:
      'Introduce puertos para networking o preferencias y adapta URLSession/UserDefaults/FileManager detrás de implementaciones de infrastructure inyectadas.',
    lines: allLines,
  };
};

export const findSwiftOpenClosedSwitchMatch = (
  source: string
): SwiftOpenClosedSwitchMatch | undefined => {
  const typePattern =
    /\b(?:final\s+)?(?:class|struct)\s+([A-Za-z0-9_]*(?:UseCase|ViewModel|Presenter|Controller|Coordinator|Service|Factory))\b/;
  const typeLines = collectSwiftRegexLines(source, typePattern);
  if (typeLines.length === 0) {
    return undefined;
  }

  const typeLine = source.split(/\r?\n/)[typeLines[0] - 1] ?? '';
  const typeName = typeLine.match(typePattern)?.[1];
  if (!typeName) {
    return undefined;
  }

  const lines = source.split(/\r?\n/);
  const discriminatorPattern = /\b(?:kind|type|mode|channel|variant|provider|route|flow|source|experience)\b/i;
  const switchPattern = /\bswitch\s+([A-Za-z_][A-Za-z0-9_\.]*)\s*\{/;

  for (let index = 0; index < lines.length; index += 1) {
    const sanitizedLine = stripSwiftLineForSemanticScan(lines[index] ?? '');
    const switchMatch = sanitizedLine.match(switchPattern);
    if (!switchMatch) {
      continue;
    }

    const discriminatorPath = switchMatch[1] ?? '';
    const discriminatorName = discriminatorPath.split('.').pop() ?? discriminatorPath;
    if (!discriminatorPattern.test(discriminatorName)) {
      continue;
    }

    let braceDepth =
      countTokenOccurrences(sanitizedLine, '{') - countTokenOccurrences(sanitizedLine, '}');
    const caseNodes: SwiftSemanticNodeMatch[] = [];

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidateLine = stripSwiftLineForSemanticScan(lines[cursor] ?? '');
      const caseMatch = candidateLine.match(/\bcase\s+([^:]+):/);
      if (caseMatch) {
        const rawLabel = (caseMatch[1] ?? '').trim();
        const semanticCaseLabel = rawLabel.match(/\.[A-Za-z_][A-Za-z0-9_]*/)?.[0]
          ?? rawLabel.split(',')[0]?.trim()
          ?? rawLabel;
        if (!/^default\b/.test(rawLabel) && semanticCaseLabel.length > 0) {
          caseNodes.push({
            kind: 'member',
            name: `case ${semanticCaseLabel}`,
            lines: [cursor + 1],
          });
        }
      }

      braceDepth += countTokenOccurrences(candidateLine, '{');
      braceDepth -= countTokenOccurrences(candidateLine, '}');
      if (braceDepth <= 0) {
        break;
      }
    }

    const [firstCaseNode, secondCaseNode] = caseNodes;
    if (!firstCaseNode || !secondCaseNode) {
      continue;
    }

    const relatedNodes = [
      {
        kind: 'member' as const,
        name: `discriminator switch: ${discriminatorName}`,
        lines: [index + 1],
      },
      ...caseNodes,
    ];

    const allLines = sortedUniqueLines([
      ...typeLines,
      index + 1,
      ...caseNodes.flatMap((node) => [...node.lines]),
    ]);
    const caseSummary = caseNodes
      .map((node) => node.name.replace(/^case\s+/, ''))
      .join(', ');

    return {
      primary_node: {
        kind: 'class',
        name: typeName,
        lines: typeLines,
      },
      related_nodes: relatedNodes,
      why:
        `${typeName} resuelve comportamiento con un switch sobre ${discriminatorName} ` +
        `(${caseSummary}), obligando a modificar el mismo tipo para soportar un nuevo caso y rompiendo OCP.`,
      impact:
        'Cada nuevo caso o comportamiento obliga a editar y revalidar el tipo de alto nivel, aumentando regresiones y dificultando extender la feature por composición.',
      expected_fix:
        'Extrae una estrategia, protocolo o registry de handlers por caso y deja el tipo de application/presentation abierto a extensión y cerrado a modificación.',
      lines: allLines,
    };
  }

  return undefined;
};

export const findSwiftInterfaceSegregationMatch = (
  source: string
): SwiftInterfaceSegregationMatch | undefined => {
  const typePattern =
    /\b(?:final\s+)?(?:class|struct)\s+([A-Za-z0-9_]*(?:UseCase|ViewModel|Presenter|Controller|Coordinator|Service))\b/;
  const typeLines = collectSwiftRegexLines(source, typePattern);
  if (typeLines.length === 0) {
    return undefined;
  }

  const typeLine = source.split(/\r?\n/)[typeLines[0] - 1] ?? '';
  const typeName = typeLine.match(typePattern)?.[1];
  if (!typeName) {
    return undefined;
  }

  const protocolDeclarations = parseSwiftProtocolDeclarations(source);
  if (protocolDeclarations.length === 0) {
    return undefined;
  }

  const sourceLines = source.split(/\r?\n/);

  for (const protocolDeclaration of protocolDeclarations) {
    const queryMembers = protocolDeclaration.members.filter((member) =>
      isSwiftQueryMemberName(member.name)
    );
    const commandMembers = protocolDeclaration.members.filter((member) =>
      isSwiftCommandMemberName(member.name)
    );
    if (queryMembers.length === 0 || commandMembers.length === 0) {
      continue;
    }

    const propertyPattern = new RegExp(
      `\\b(?:let|var)\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*:\\s*${protocolDeclaration.name}\\b`
    );
    const propertyLines = collectSwiftRegexLines(source, propertyPattern);
    if (propertyLines.length === 0) {
      continue;
    }

    const propertyLine = sourceLines[propertyLines[0] - 1] ?? '';
    const propertyName = propertyLine.match(propertyPattern)?.[1];
    if (!propertyName) {
      continue;
    }

    const usedMembers = new Map<string, number[]>();
    const memberUsagePattern = new RegExp(
      `\\b${propertyName}\\.([A-Za-z_][A-Za-z0-9_]*)\\s*\\(`,
      'g'
    );
    sourceLines.forEach((line, index) => {
      const sanitizedLine = stripSwiftLineForSemanticScan(line);
      for (const match of sanitizedLine.matchAll(memberUsagePattern)) {
        const memberName = match[1];
        if (!memberName) {
          continue;
        }

        const existingLines = usedMembers.get(memberName) ?? [];
        existingLines.push(index + 1);
        usedMembers.set(memberName, existingLines);
      }
    });

    const usedMemberNames = [...usedMembers.keys()];
    if (usedMemberNames.length === 0) {
      continue;
    }

    const usesQueryContract = usedMemberNames.some(isSwiftQueryMemberName);
    const usesCommandContract = usedMemberNames.some(isSwiftCommandMemberName);
    if (usesQueryContract === usesCommandContract) {
      continue;
    }

    const oppositeFamilyMembers = usesQueryContract ? commandMembers : queryMembers;
    const unusedMembers = oppositeFamilyMembers.filter((member) => !usedMembers.has(member.name));
    const firstUnusedMember = unusedMembers[0];
    if (!firstUnusedMember) {
      continue;
    }

    const firstUsedMember = [...usedMembers.entries()][0];
    if (!firstUsedMember) {
      continue;
    }

    const [usedMemberName, usedMemberLines] = firstUsedMember;
    const relatedNodes: SwiftSemanticNodeMatch[] = [
      {
        kind: 'member',
        name: `fat protocol: ${protocolDeclaration.name}`,
        lines: [protocolDeclaration.line],
      },
      {
        kind: 'call',
        name: `used member: ${usedMemberName}`,
        lines: sortedUniqueLines(usedMemberLines),
      },
      ...unusedMembers.map((member) => ({
        kind: 'member' as const,
        name: `unused contract member: ${member.name}`,
        lines: [member.line],
      })),
    ];

    const allLines = sortedUniqueLines([
      ...typeLines,
      protocolDeclaration.line,
      ...usedMemberLines,
      ...unusedMembers.map((member) => member.line),
    ]);

    return {
      primary_node: {
        kind: 'class',
        name: typeName,
        lines: typeLines,
      },
      related_nodes: relatedNodes,
      why:
        `${typeName} depende de ${protocolDeclaration.name}, un protocolo demasiado ancho para el ` +
        `uso real del consumidor, y rompe ISP al acoplarlo a miembros que no necesita.`,
      impact:
        'El consumidor queda expuesto a cambios ajenos de un contrato demasiado ancho, aumenta el coste de mocks/dobles y se erosiona el aislamiento semántico del caso de uso o presenter.',
      expected_fix:
        'Segrega el protocolo en contratos más pequeños y haz que el consumidor dependa solo del puerto mínimo que realmente utiliza.',
      lines: allLines,
    };
  }

  return undefined;
};

export const findSwiftLiskovSubstitutionMatch = (
  source: string
): SwiftLiskovSubstitutionMatch | undefined => {
  const protocolDeclarations = parseSwiftProtocolDeclarations(source);
  if (protocolDeclarations.length === 0) {
    return undefined;
  }

  const typeDeclarations = parseSwiftTypeDeclarations(source);

  const sourceLines = source.split(/\r?\n/);

  for (const protocolDeclaration of protocolDeclarations) {
    const memberNames = protocolDeclaration.members.map((member) => member.name);
    if (memberNames.length === 0) {
      continue;
    }

    const conformingTypes = typeDeclarations.filter((typeDeclaration) =>
      typeDeclaration.conformances.includes(protocolDeclaration.name)
    );

    for (const memberName of memberNames) {
      let safeType: SwiftTypeDeclaration | undefined;
      let unsafeType:
        | (SwiftTypeDeclaration & {
            narrowedPreconditionLine: number;
            failureLine: number;
          })
        | undefined;

      for (const typeDeclaration of conformingTypes) {
        const methodPattern = new RegExp(`\\bfunc\\s+${memberName}\\s*\\(`);
        let methodLine = -1;

        for (
          let lineIndex = typeDeclaration.bodyStartLine - 1;
          lineIndex < typeDeclaration.bodyEndLine;
          lineIndex += 1
        ) {
          const candidateLine = stripSwiftLineForSemanticScan(sourceLines[lineIndex] ?? '');
          if (methodPattern.test(candidateLine)) {
            methodLine = lineIndex + 1;
            break;
          }
        }

        if (methodLine < 0) {
          continue;
        }

        let methodBraceDepth =
          countTokenOccurrences(stripSwiftLineForSemanticScan(sourceLines[methodLine - 1] ?? ''), '{')
          - countTokenOccurrences(stripSwiftLineForSemanticScan(sourceLines[methodLine - 1] ?? ''), '}');
        let narrowedPreconditionLine: number | undefined;
        let failureLine: number | undefined;

        for (
          let lineIndex = methodLine;
          lineIndex < typeDeclaration.bodyEndLine && methodBraceDepth > 0;
          lineIndex += 1
        ) {
          const candidateLine = stripSwiftLineForSemanticScan(sourceLines[lineIndex] ?? '');
          if (narrowedPreconditionLine === undefined && /\bguard\b/.test(candidateLine)) {
            narrowedPreconditionLine = lineIndex + 1;
          }
          if (
            failureLine === undefined &&
            /\b(?:fatalError|preconditionFailure|precondition)\s*\(/.test(candidateLine)
          ) {
            failureLine = lineIndex + 1;
          }
          methodBraceDepth += countTokenOccurrences(candidateLine, '{');
          methodBraceDepth -= countTokenOccurrences(candidateLine, '}');
        }

        if (narrowedPreconditionLine !== undefined && failureLine !== undefined) {
          unsafeType = {
            ...typeDeclaration,
            narrowedPreconditionLine,
            failureLine,
          };
        } else if (!safeType) {
          safeType = typeDeclaration;
        }
      }

      if (!safeType || !unsafeType) {
        continue;
      }

      const allLines = sortedUniqueLines([
        protocolDeclaration.line,
        safeType.line,
        unsafeType.line,
        unsafeType.narrowedPreconditionLine,
        unsafeType.failureLine,
      ]);

      return {
        primary_node: {
          kind: 'class',
          name: unsafeType.name,
          lines: [unsafeType.line],
        },
        related_nodes: [
          {
            kind: 'member',
            name: `base contract: ${protocolDeclaration.name}`,
            lines: [protocolDeclaration.line],
          },
          {
            kind: 'member',
            name: `safe substitute: ${safeType.name}`,
            lines: [safeType.line],
          },
          {
            kind: 'member',
            name: `narrowed precondition: ${memberName}`,
            lines: [unsafeType.narrowedPreconditionLine],
          },
          {
            kind: 'call',
            name: 'fatalError',
            lines: [unsafeType.failureLine],
          },
        ],
        why:
          `${unsafeType.name} endurece la precondición del contrato ${protocolDeclaration.name} ` +
          `y deja de ser sustituible por un consumidor que espera el comportamiento base, rompiendo LSP.`,
        impact:
          'La sustitución deja de ser segura, aparecen regresiones cuando se inyecta el subtipo en lugar del contrato base y se vuelven frágiles los tests y flujos de aplicación.',
        expected_fix:
          'Mantén precondiciones y postcondiciones compatibles con el contrato base o extrae un contrato/estrategia separado para el comportamiento especializado.',
        lines: allLines,
      };
    }
  }

  return undefined;
};
