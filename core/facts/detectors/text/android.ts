import { hasIdentifierAt, scanCodeLikeSource } from './utils';

export type KotlinSemanticNodeMatch = {
  kind: 'class' | 'property' | 'call' | 'member';
  name: string;
  lines: readonly number[];
};

export type KotlinPresentationSrpMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinConcreteDependencyDipMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinOpenClosedOcpMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinInterfaceSegregationMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinLiskovSubstitutionMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidComposeShellMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidNavigationArgumentsMatch = KotlinAndroidComposeShellMatch;

export type KotlinAndroidCallbackAsyncMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidStateFlowMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidSingleSourceOfTruthMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidFlowBuilderMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidSharedFlowMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidFlowCollectMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidCollectAsStateMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidRememberMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidDerivedStateOfMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidLaunchedEffectMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidLaunchedEffectKeysMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidDisposableEffectMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidPreviewMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidAdaptiveLayoutsMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidExistingStructureMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidThemeMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidRecompositionMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidSkipRecompositionMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidStabilityMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidUiStateMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidUseCaseMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidRepositoryPatternMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidStateHoistingMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidViewModelMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidViewModelScopeMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidSupervisorScopeMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidAppStartupMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidAnalyticsMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidProfilerMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidBaselineProfilesMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

type KotlinInterfaceMemberDeclaration = {
  name: string;
  line: number;
};

type KotlinInterfaceDeclaration = {
  name: string;
  line: number;
  bodyStartLine: number;
  bodyEndLine: number;
  members: readonly KotlinInterfaceMemberDeclaration[];
};

type KotlinTypeDeclaration = {
  name: string;
  line: number;
  conformances: readonly string[];
  bodyStartLine: number;
  bodyEndLine: number;
};

type KotlinResponsibilityMatch = {
  key: string;
  node: KotlinSemanticNodeMatch;
};

const kotlinQueryMemberNamePattern = /^(get|find|list|fetch|read|load|restore|refresh|is|has|can)/i;
const kotlinCommandMemberNamePattern =
  /^(create|update|delete|remove|save|insert|upsert|set|write|persist|clear|reset|sync|store)/i;

const registerKotlinResponsibility = (
  nodes: KotlinResponsibilityMatch[],
  key: string,
  kind: KotlinSemanticNodeMatch['kind'],
  name: string,
  lines: readonly number[]
): void => {
  if (lines.length === 0) {
    return;
  }
  nodes.push({ key, node: { kind, name, lines } });
};

const hasKotlinResponsibilityKeys = (
  nodes: readonly KotlinResponsibilityMatch[],
  keys: readonly string[]
): boolean => {
  const observedKeys = new Set(nodes.map((node) => node.key));
  return keys.every((key) => observedKeys.has(key));
};

const isKotlinQueryMemberName = (name: string): boolean => kotlinQueryMemberNamePattern.test(name);
const isKotlinCommandMemberName = (name: string): boolean =>
  kotlinCommandMemberNamePattern.test(name);

const stripKotlinLineForSemanticScan = (line: string): string => {
  return line
    .replace(/\/\/.*$/, '')
    .replace(/"(?:\\.|[^"\\])*"/g, '""');
};

const stripTomlLineForSemanticScan = (line: string): string => {
  return line
    .replace(/#.*$/, '')
    .replace(/"(?:\\.|[^"\\])*"/g, '""');
};

const collectKotlinRegexLines = (source: string, regex: RegExp): readonly number[] => {
  const matches: number[] = [];
  source.split(/\r?\n/).forEach((line, index) => {
    const sanitized = stripKotlinLineForSemanticScan(line);
    if (sanitized.trimStart().startsWith('import ')) {
      return;
    }
    regex.lastIndex = 0;
    if (regex.test(sanitized)) {
      matches.push(index + 1);
    }
  });
  return matches;
};

const collectKotlinRegexLinesInRange = (
  source: string,
  regex: RegExp,
  startLine: number,
  endLine: number
): readonly number[] => {
  const lines = source.split(/\r?\n/);
  const matches: number[] = [];
  const normalizedStart = Math.max(1, Math.trunc(startLine));
  const normalizedEnd = Math.max(normalizedStart, Math.min(lines.length, Math.trunc(endLine)));

  for (let index = normalizedStart - 1; index < normalizedEnd; index += 1) {
    const sanitized = stripKotlinLineForSemanticScan(lines[index] ?? '');
    if (sanitized.trimStart().startsWith('import ')) {
      continue;
    }
    regex.lastIndex = 0;
    if (regex.test(sanitized)) {
      matches.push(index + 1);
    }
  }

  return sortedUniqueLines(matches);
};

const collectAndroidTestMarkerLines = (source: string): readonly number[] => {
  const markers = [
    /AndroidJUnit4/,
    /InstrumentationRegistry/,
    /ActivityScenario/,
    /Espresso/,
    /onView/,
    /createAndroidComposeRule/,
    /createComposeRule/,
    /androidx\.test/,
  ];

  const matches: number[] = [];
  source.split(/\r?\n/).forEach((line, index) => {
    const sanitized = stripKotlinLineForSemanticScan(line);
    if (markers.some((marker) => marker.test(sanitized))) {
      matches.push(index + 1);
    }
  });

  return sortedUniqueLines(matches);
};

const collectAndroidTestFunctionDeclarations = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const lines = source.split(/\r?\n/);
  const declarations: KotlinSemanticNodeMatch[] = [];
  const functionPattern =
    /^\s*(?:public\s+|private\s+|internal\s+|protected\s+)?(?:inline\s+)?(?:suspend\s+)?fun\s+([A-Za-z_][A-Za-z0-9_]*)\b/;

  for (let index = 0; index < lines.length; index += 1) {
    const sanitizedLine = stripKotlinLineForSemanticScan(lines[index] ?? '');
    if (!/@Test\b/.test(sanitizedLine)) {
      continue;
    }

    const sanitizedFunctionLine = sanitizedLine.replace(/^(?:@\w+(?:\([^)]*\))?\s*)+/, '');
    const sameLineMatch = sanitizedFunctionLine.match(functionPattern);
    if (sameLineMatch?.[1]) {
      declarations.push({
        kind: 'member',
        name: `@Test fun ${sameLineMatch[1]}`,
        lines: [index + 1],
      });
      continue;
    }

    for (let cursor = index + 1; cursor < Math.min(lines.length, index + 4); cursor += 1) {
      const candidateLine = stripKotlinLineForSemanticScan(lines[cursor] ?? '');
      const candidateFunctionLine = candidateLine.replace(/^(?:@\w+(?:\([^)]*\))?\s*)+/, '');
      const functionMatch = candidateFunctionLine.match(functionPattern);
      if (functionMatch?.[1]) {
        declarations.push({
          kind: 'member',
          name: `@Test fun ${functionMatch[1]}`,
          lines: [cursor + 1],
        });
        break;
      }
      if (candidateLine.trim().length > 0 && !candidateLine.trim().startsWith('@')) {
        break;
      }
    }
  }

  return declarations;
};

const collectAndroidTestStructureMarkerLines = (
  source: string,
  markerPatterns: ReadonlyArray<RegExp>
): readonly number[] => {
  const matches: number[] = [];

  source.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (markerPatterns.some((marker) => marker.test(trimmed))) {
      matches.push(index + 1);
    }
  });

  return sortedUniqueLines(matches);
};

const buildAndroidTestStructureMatch = (params: {
  source: string;
  markerPatterns: ReadonlyArray<RegExp>;
  relatedLabel: string;
  why: string;
  impact: string;
  expectedFix: string;
}): KotlinAndroidTestStructureMatch | undefined => {
  const testFunctions = collectAndroidTestFunctionDeclarations(params.source);
  const markerLines = collectAndroidTestStructureMarkerLines(params.source, params.markerPatterns);

  if (testFunctions.length === 0 || markerLines.length === 0) {
    return undefined;
  }

  const [primaryNode, ...relatedFunctions] = testFunctions;
  if (!primaryNode) {
    return undefined;
  }

  return {
    primary_node: {
      kind: 'member',
      name: primaryNode.name,
      lines: primaryNode.lines,
    },
    related_nodes: [
      ...relatedFunctions,
      ...markerLines.map((line) => ({
        kind: 'member' as const,
        name: params.relatedLabel,
        lines: [line],
      })),
    ],
    why: params.why,
    impact: params.impact,
    expected_fix: params.expectedFix,
    lines: sortedUniqueLines([
      ...testFunctions.flatMap((node) => [...node.lines]),
      ...markerLines,
    ]),
  };
};

const buildAndroidJvmUnitTestMatch = (
  source: string
): KotlinAndroidTestStructureMatch | undefined => {
  const testFunctions = collectAndroidTestFunctionDeclarations(source);
  const [primaryNode, ...relatedNodes] = testFunctions;

  if (!primaryNode) {
    return undefined;
  }

  return {
    primary_node: {
      kind: 'member',
      name: primaryNode.name,
      lines: primaryNode.lines,
    },
    related_nodes: relatedNodes,
    why:
      'test/ agrupa unit tests JVM que deben ejecutarse rápido en la máquina local y mantenerse separadas de las pruebas instrumentadas.',
    impact:
      'Las pruebas JVM quedan aisladas de androidTest, son más rápidas de ejecutar y validan la lógica local sin depender de emulador o dispositivo.',
    expected_fix:
      'Mantén las pruebas de unidad en src/test con JUnit y mueve las comprobaciones de UI o framework Android a androidTest.',
    lines: sortedUniqueLines(testFunctions.flatMap((node) => [...node.lines])),
  };
};

const sortedUniqueLines = (lines: ReadonlyArray<number>): readonly number[] => {
  return Array.from(new Set(lines.filter((line) => Number.isFinite(line)).map((line) => Math.trunc(line))))
    .sort((left, right) => left - right);
};

const countTokenOccurrences = (line: string, token: string): number => {
  return line.split(token).length - 1;
};

const normalizeKotlinWhenBranchName = (rawLabel: string): string => {
  const normalized = rawLabel.split(',')[0]?.trim() ?? rawLabel.trim();
  const withoutGuard = normalized.split(/\s+if\s+/)[0]?.trim() ?? normalized;
  return withoutGuard.match(/([A-Za-z_][A-Za-z0-9_]*)$/)?.[1] ?? withoutGuard;
};

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const parseKotlinInterfaceDeclarations = (source: string): readonly KotlinInterfaceDeclaration[] => {
  const lines = source.split(/\r?\n/);
  const declarations: KotlinInterfaceDeclaration[] = [];
  const interfacePattern = /^\s*(?:fun\s+)?interface\s+([A-Za-z_][A-Za-z0-9_]*)\b/;
  const functionPattern = /^\s*fun\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/;
  const suspendFunctionPattern = /^\s*suspend\s+fun\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/;
  const propertyPattern = /^\s*(?:val|var)\s+([A-Za-z_][A-Za-z0-9_]*)\b/;

  for (let index = 0; index < lines.length; index += 1) {
    const sanitizedLine = stripKotlinLineForSemanticScan(lines[index] ?? '');
    const interfaceMatch = sanitizedLine.match(interfacePattern);
    if (!interfaceMatch) {
      continue;
    }

    const interfaceName = interfaceMatch[1];
    if (!interfaceName) {
      continue;
    }

    const members: KotlinInterfaceMemberDeclaration[] = [];
    let braceDepth =
      countTokenOccurrences(sanitizedLine, '{') - countTokenOccurrences(sanitizedLine, '}');
    const bodyStartLine = index + 1;
    let bodyEndLine = index + 1;

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidateLine = stripKotlinLineForSemanticScan(lines[cursor] ?? '');
      const functionMatch =
        candidateLine.match(suspendFunctionPattern) ?? candidateLine.match(functionPattern);
      if (functionMatch?.[1]) {
        members.push({
          name: functionMatch[1],
          line: cursor + 1,
        });
      } else {
        const propertyMatch = candidateLine.match(propertyPattern);
        if (propertyMatch?.[1]) {
          members.push({
            name: propertyMatch[1],
            line: cursor + 1,
          });
        }
      }

      braceDepth += countTokenOccurrences(candidateLine, '{');
      braceDepth -= countTokenOccurrences(candidateLine, '}');
      bodyEndLine = cursor + 1;
      if (braceDepth <= 0) {
        break;
      }
    }

    declarations.push({
      name: interfaceName,
      line: index + 1,
      bodyStartLine,
      bodyEndLine,
      members,
    });
  }

  return declarations;
};

const parseKotlinTypeDeclarations = (source: string): readonly KotlinTypeDeclaration[] => {
  const lines = source.split(/\r?\n/);
  const declarations: KotlinTypeDeclaration[] = [];
  const classPattern =
    /^\s*(?:internal\s+|private\s+|public\s+)?(?:abstract\s+|open\s+|sealed\s+|data\s+|final\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)\b([^{]*)/;

  for (let index = 0; index < lines.length; index += 1) {
    const sanitizedLine = stripKotlinLineForSemanticScan(lines[index] ?? '');
    const classMatch = sanitizedLine.match(classPattern);
    if (!classMatch) {
      continue;
    }

    const typeName = classMatch[1];
    const tail = classMatch[2] ?? '';
    if (!typeName) {
      continue;
    }

    const conformanceSection = tail.includes(':') ? tail.split(':').slice(1).join(':') : '';
    const conformances = conformanceSection
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .map((entry) => entry.replace(/\(.*$/, '').trim())
      .map((entry) => entry.match(/([A-Za-z_][A-Za-z0-9_]*)$/)?.[1] ?? entry)
      .filter((entry) => entry.length > 0);

    let braceDepth =
      countTokenOccurrences(sanitizedLine, '{') - countTokenOccurrences(sanitizedLine, '}');
    const bodyStartLine = index + 1;
    let bodyEndLine = index + 1;

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidateLine = stripKotlinLineForSemanticScan(lines[cursor] ?? '');
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
      conformances,
      bodyStartLine,
      bodyEndLine,
    });
  }

  return declarations;
};

type KotlinRepositoryDeclaration = {
  name: string;
  line: number;
  bodyStartLine: number;
  bodyEndLine: number;
  conformances: readonly string[];
  members: readonly KotlinInterfaceMemberDeclaration[];
};

const repositoryDeclarationNamePattern = /(?:Repository(?:Impl)?|OrdersRep)$/;

const parseAndroidRepositoryDeclarations = (
  source: string
): readonly KotlinRepositoryDeclaration[] => {
  const classDeclarations = parseKotlinTypeDeclarations(source)
    .filter((declaration) => repositoryDeclarationNamePattern.test(declaration.name))
    .map(
      (declaration): KotlinRepositoryDeclaration => ({
        name: declaration.name,
        line: declaration.line,
        bodyStartLine: declaration.bodyStartLine,
        bodyEndLine: declaration.bodyEndLine,
        conformances: declaration.conformances,
        members: [],
      })
    );

  const interfaceDeclarations = parseKotlinInterfaceDeclarations(source)
    .filter((declaration) => repositoryDeclarationNamePattern.test(declaration.name))
    .map(
      (declaration): KotlinRepositoryDeclaration => ({
        name: declaration.name,
        line: declaration.line,
        bodyStartLine: declaration.bodyStartLine,
        bodyEndLine: declaration.bodyEndLine,
        conformances: [],
        members: declaration.members,
      })
    );

  return [...classDeclarations, ...interfaceDeclarations].sort(
    (left, right) => left.line - right.line || left.name.localeCompare(right.name)
  );
};

const androidActivityConformancePattern =
  /^(?:Activity|ComponentActivity|AppCompatActivity|FragmentActivity)$/;

const isAndroidActivityTypeConformance = (conformance: string): boolean => {
  return androidActivityConformancePattern.test(conformance);
};

const parseAndroidActivityDeclarations = (source: string): readonly KotlinTypeDeclaration[] => {
  return parseKotlinTypeDeclarations(source).filter((declaration) =>
    declaration.conformances.some(isAndroidActivityTypeConformance)
  );
};

const collectAndroidComposableFunctionDeclarations = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const lines = source.split(/\r?\n/);
  const declarations: KotlinSemanticNodeMatch[] = [];
  const functionPattern =
    /^\s*(?:public\s+|private\s+|internal\s+|protected\s+)?(?:inline\s+)?(?:suspend\s+)?fun\s+([A-Za-z_][A-Za-z0-9_]*)\b/;

  for (let index = 0; index < lines.length; index += 1) {
    const sanitizedLine = stripKotlinLineForSemanticScan(lines[index] ?? '');
    if (!/@Composable\b/.test(sanitizedLine)) {
      continue;
    }

    const sanitizedFunctionLine = sanitizedLine.replace(
      /^(?:@\w+(?:\([^)]*\))?\s*)+/,
      ''
    );
    const sameLineMatch = sanitizedFunctionLine.match(functionPattern);
    if (sameLineMatch?.[1]) {
      declarations.push({
        kind: 'member',
        name: `@Composable fun ${sameLineMatch[1]}`,
        lines: [index + 1],
      });
      continue;
    }

    for (let cursor = index + 1; cursor < Math.min(lines.length, index + 4); cursor += 1) {
      const candidateLine = stripKotlinLineForSemanticScan(lines[cursor] ?? '');
      const candidateFunctionLine = candidateLine.replace(
        /^(?:@\w+(?:\([^)]*\))?\s*)+/,
        ''
      );
      const functionMatch = candidateFunctionLine.match(functionPattern);
      if (functionMatch?.[1]) {
        declarations.push({
          kind: 'member',
          name: `@Composable fun ${functionMatch[1]}`,
          lines: [cursor + 1],
        });
        break;
      }
      if (candidateLine.trim().length > 0 && !candidateLine.trim().startsWith('@')) {
        break;
      }
    }
  }

  return declarations;
};

const collectAndroidActivityShellNodes = (
  source: string,
  bodyStartLine: number,
  bodyEndLine: number
): readonly KotlinSemanticNodeMatch[] => {
  const nodes: KotlinSemanticNodeMatch[] = [];
  const patterns: ReadonlyArray<{ name: string; regex: RegExp }> = [
    { name: 'setContent', regex: /\bsetContent\s*\{/ },
    { name: 'rememberNavController', regex: /\brememberNavController\b/ },
    { name: 'NavHost', regex: /\bNavHost\b/ },
  ];

  for (const pattern of patterns) {
    const lines = collectKotlinRegexLinesInRange(source, pattern.regex, bodyStartLine, bodyEndLine);
    if (lines.length === 0) {
      continue;
    }
    nodes.push({
      kind: 'call',
      name: pattern.name,
      lines,
    });
  }

  return nodes;
};

const collectAndroidActivityComposableNodes = (
  source: string,
  _bodyStartLine: number,
  _bodyEndLine: number
): readonly KotlinSemanticNodeMatch[] => {
  return collectAndroidComposableFunctionDeclarations(source);
};

const findAndroidActivityDeclaration = (
  source: string
): KotlinTypeDeclaration | undefined => {
  return parseAndroidActivityDeclarations(source)[0];
};

const buildAndroidActivityComposeShellMatch = (
  source: string
): KotlinAndroidComposeShellMatch | undefined => {
  const activity = findAndroidActivityDeclaration(source);
  if (!activity) {
    return undefined;
  }

  const relatedNodes = collectAndroidActivityShellNodes(
    source,
    activity.bodyStartLine,
    activity.bodyEndLine
  );
  if (relatedNodes.length === 0) {
    return undefined;
  }

  const composableNodes = collectAndroidActivityComposableNodes(
    source,
    activity.bodyStartLine,
    activity.bodyEndLine
  );
  if (composableNodes.length > 0) {
    return undefined;
  }

  return {
    primary_node: {
      kind: 'class',
      name: activity.name,
      lines: [activity.line],
    },
    related_nodes: relatedNodes,
    why: `${activity.name} funciona como Activity shell de Compose con navegación explícita en lugar de distribuir la UI entre múltiples Activities.`,
    impact:
      'La pantalla principal queda centralizada en una sola Activity y la navegación Compose mantiene la entrada de la app más simple y predecible.',
    expected_fix:
      'Mantén una única Activity contenedora y delega la UI en composables y navegación Compose en vez de crear Activities adicionales.',
    lines: sortedUniqueLines([
      activity.line,
      ...relatedNodes.flatMap((node) => [...node.lines]),
    ]),
  };
};

const buildAndroidGodActivityMatch = (
  source: string
): KotlinAndroidComposeShellMatch | undefined => {
  const activity = findAndroidActivityDeclaration(source);
  if (!activity) {
    return undefined;
  }

  const shellNodes = collectAndroidActivityShellNodes(source, activity.bodyStartLine, activity.bodyEndLine);
  const composableNodes = collectAndroidActivityComposableNodes(
    source,
    activity.bodyStartLine,
    activity.bodyEndLine
  );

  if (shellNodes.length === 0 || composableNodes.length === 0) {
    return undefined;
  }

  return {
    primary_node: {
      kind: 'class',
      name: activity.name,
      lines: [activity.line],
    },
    related_nodes: [...shellNodes, ...composableNodes],
    why: `${activity.name} mezcla la Activity shell con declaraciones @Composable en el mismo archivo, concentrando demasiadas responsabilidades en una sola clase.`,
    impact:
      'La Activity deja de ser un contenedor fino, el archivo crece como punto único de cambio y la UI Compose queda demasiado acoplada a la orquestación de pantalla.',
    expected_fix:
      'Extrae los composables a archivos dedicados y conserva la Activity como una shell mínima de navegación y arranque.',
    lines: sortedUniqueLines([
      activity.line,
      ...shellNodes.flatMap((node) => [...node.lines]),
      ...composableNodes.flatMap((node) => [...node.lines]),
    ]),
  };
};

export const findAndroidComposableFunctionMatch = (
  source: string
): KotlinAndroidComposeShellMatch | undefined => {
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const [primaryNode, ...relatedNodes] = composableNodes;
  if (!primaryNode) {
    return undefined;
  }

  return {
    primary_node: primaryNode,
    related_nodes: relatedNodes,
    why: `${primaryNode.name} está declarada como @Composable para UI declarativa en Android.`,
    impact:
      'La interfaz se expresa como funciones composables, lo que favorece la composición y la reutilización en la capa de presentación.',
    expected_fix:
      'Mantén la UI en funciones composables pequeñas y declarativas, elevando el estado y dejando la lógica de negocio fuera.',
    lines: sortedUniqueLines(composableNodes.flatMap((node) => [...node.lines])),
  };
};

export const hasAndroidComposableFunctionUsage = (source: string): boolean => {
  return findAndroidComposableFunctionMatch(source) !== undefined;
};

export const findAndroidArgumentsMatch = (
  source: string
): KotlinAndroidNavigationArgumentsMatch | undefined => {
  const lines = source.split(/\r?\n/);
  const classPattern =
    /^\s*(?:internal\s+|private\s+|public\s+)?(?:abstract\s+|open\s+|sealed\s+|data\s+|final\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)\b/;
  const classLines = collectKotlinRegexLines(source, classPattern);
  const navHostLines = collectKotlinRegexLines(source, /\bNavHost\b/);
  const composableRouteLines = collectKotlinRegexLines(source, /\bcomposable\s*\(/);
  const navArgumentLines = collectKotlinRegexLines(source, /\bnavArgument\s*\(/);
  const savedStateHandleLines = collectKotlinRegexLines(source, /\bSavedStateHandle\b/);
  const navigateCallLines = collectKotlinRegexLines(source, /\bnavigate\s*\(/);

  if (
    (navArgumentLines.length === 0 && savedStateHandleLines.length === 0) ||
    navigateCallLines.length === 0 ||
    (navHostLines.length === 0 &&
      composableRouteLines.length === 0 &&
      savedStateHandleLines.length === 0)
  ) {
    return undefined;
  }

  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const classLine = classLines[0] ? lines[classLines[0] - 1] ?? '' : '';
  const className = classLine.match(classPattern)?.[1];
  const primaryNode =
    composableNodes[0] ??
    (classLines[0] && className
      ? {
          kind: 'class' as const,
          name: className,
          lines: [classLines[0]],
        }
      : undefined);

  if (!primaryNode) {
    return undefined;
  }

  const relatedNodes: KotlinSemanticNodeMatch[] = [
    {
      kind: 'call',
      name: 'NavHost',
      lines: navHostLines,
    },
    {
      kind: 'call',
      name: 'composable',
      lines: composableRouteLines,
    },
    ...(navArgumentLines.length > 0
      ? [
          {
            kind: 'call' as const,
            name: 'navArgument',
            lines: navArgumentLines,
          },
        ]
      : []),
    ...(savedStateHandleLines.length > 0
      ? [
          {
            kind: 'property' as const,
            name: 'SavedStateHandle',
            lines: savedStateHandleLines,
          },
        ]
      : []),
    {
      kind: 'call',
      name: 'navigate with arguments',
      lines: navigateCallLines,
    },
  ];

  const evidenceLines = sortedUniqueLines([
    ...primaryNode.lines,
    ...relatedNodes.flatMap((node) => [...node.lines]),
  ]);

  return {
    primary_node: primaryNode,
    related_nodes: relatedNodes,
    why:
      'La navegación entre pantallas pasa argumentos de ruta y los recupera de forma explícita en el destino, evitando dependencias implícitas o estados globales.',
    impact:
      'El contrato entre pantallas queda tipado y visible: la fuente de navegación, el argumento y la lectura del destino se mantienen en la misma frontera de UI.',
    expected_fix:
      'Pasa los datos por la ruta o SavedStateHandle con argumentos explícitos y deja la navegación sin estado oculto ni singletons compartidos.',
    lines: evidenceLines,
  };
};

export const hasAndroidArgumentsUsage = (source: string): boolean => {
  return findAndroidArgumentsMatch(source) !== undefined;
};

export const findAndroidSingleActivityComposeShellMatch = (
  source: string
): KotlinAndroidComposeShellMatch | undefined => {
  return buildAndroidActivityComposeShellMatch(source);
};

export const hasAndroidSingleActivityComposeShellUsage = (source: string): boolean => {
  return findAndroidSingleActivityComposeShellMatch(source) !== undefined;
};

export const findAndroidGodActivityMatch = (
  source: string
): KotlinAndroidComposeShellMatch | undefined => {
  return buildAndroidGodActivityMatch(source);
};

export const hasAndroidGodActivityUsage = (source: string): boolean => {
  return findAndroidGodActivityMatch(source) !== undefined;
};

export const hasKotlinThreadSleepCall = (source: string): boolean => {
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

export const hasKotlinGlobalScopeUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: kotlinSource, index, current }) => {
    if (current !== 'G' || !hasIdentifierAt(kotlinSource, index, 'GlobalScope')) {
      return false;
    }

    const start = index + 'GlobalScope'.length;
    const tail = kotlinSource.slice(start, start + 32);
    return /^\s*\.(launch|async|produce|actor)\b/.test(tail);
  });
};

export const hasKotlinRunBlockingUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: kotlinSource, index, current }) => {
    if (current !== 'r' || !hasIdentifierAt(kotlinSource, index, 'runBlocking')) {
      return false;
    }

    const start = index + 'runBlocking'.length;
    const tail = kotlinSource.slice(start, start + 48);
    return /^\s*(<[^>\n]+>\s*)?(\(|\{)/.test(tail);
  });
};

export const hasKotlinForceUnwrapUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: kotlinSource, index, current }) => {
    if (current !== '!' || kotlinSource[index + 1] !== '!') {
      return false;
    }

    return kotlinSource[index + 2] !== '=';
  });
};

export const findAndroidStateFlowMatch = (
  source: string
): KotlinAndroidStateFlowMatch | undefined => {
  const declarations = parseKotlinTypeDeclarations(source).filter((declaration) =>
    declaration.conformances.some((conformance) => conformance === 'ViewModel')
  );

  for (const declaration of declarations) {
    const stateFlowLines = collectKotlinRegexLinesInRange(
      source,
      /\b(?:MutableStateFlow|StateFlow|asStateFlow)\b/,
      declaration.bodyStartLine,
      declaration.bodyEndLine
    );

    if (stateFlowLines.length === 0) {
      continue;
    }

    const lines = source.split(/\r?\n/);
    const relatedNodes: KotlinSemanticNodeMatch[] = [];

    for (const lineNumber of stateFlowLines) {
      const sanitizedLine = stripKotlinLineForSemanticScan(lines[lineNumber - 1] ?? '');
      if (/\bMutableStateFlow\b/.test(sanitizedLine)) {
        relatedNodes.push({
          kind: 'property',
          name: 'MutableStateFlow',
          lines: [lineNumber],
        });
      }
      if (/\bStateFlow\b/.test(sanitizedLine)) {
        relatedNodes.push({
          kind: 'property',
          name: 'StateFlow',
          lines: [lineNumber],
        });
      }
      if (/\basStateFlow\b/.test(sanitizedLine)) {
        relatedNodes.push({
          kind: 'call',
          name: 'asStateFlow',
          lines: [lineNumber],
        });
      }
    }

    return {
      primary_node: {
        kind: 'class',
        name: declaration.name,
        lines: [declaration.line],
      },
      related_nodes: relatedNodes,
      why: `${declaration.name} expone estado observable con StateFlow en lugar de mantenerlo como estado opaco dentro del ViewModel.`,
      impact:
        'El estado de UI deja de depender de observadores ad-hoc y pasa a un flujo observable y predecible que Compose puede consumir de forma segura.',
      expected_fix:
        'Mantén un MutableStateFlow privado, expón StateFlow inmutable para la UI y actualiza el estado desde el ViewModel con una sola fuente de verdad.',
      lines: sortedUniqueLines([
        declaration.line,
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidStateFlowUsage = (source: string): boolean => {
  return findAndroidStateFlowMatch(source) !== undefined;
};

export const findAndroidSingleSourceOfTruthMatch = (
  source: string
): KotlinAndroidSingleSourceOfTruthMatch | undefined => {
  const declarations = parseKotlinTypeDeclarations(source).filter((declaration) =>
    declaration.conformances.some((conformance) => conformance === 'ViewModel')
  );

  for (const declaration of declarations) {
    const stateFlowLines = collectKotlinRegexLinesInRange(
      source,
      /\b(?:MutableStateFlow|StateFlow|asStateFlow)\b/,
      declaration.bodyStartLine,
      declaration.bodyEndLine
    );

    if (stateFlowLines.length === 0) {
      continue;
    }

    const lines = source.split(/\r?\n/);
    const relatedNodes: KotlinSemanticNodeMatch[] = [];
    let hasMutableState = false;
    let hasExposedState = false;

    for (const lineNumber of stateFlowLines) {
      const sanitizedLine = stripKotlinLineForSemanticScan(lines[lineNumber - 1] ?? '');
      if (/\bMutableStateFlow\b/.test(sanitizedLine)) {
        relatedNodes.push({
          kind: 'property',
          name: 'MutableStateFlow',
          lines: [lineNumber],
        });
        hasMutableState = true;
      }
      if (/\bStateFlow\b/.test(sanitizedLine)) {
        relatedNodes.push({
          kind: 'property',
          name: 'StateFlow',
          lines: [lineNumber],
        });
        hasExposedState = true;
      }
      if (/\basStateFlow\b/.test(sanitizedLine)) {
        relatedNodes.push({
          kind: 'call',
          name: 'asStateFlow',
          lines: [lineNumber],
        });
        hasExposedState = true;
      }
    }

    if (!hasMutableState || !hasExposedState) {
      continue;
    }

    return {
      primary_node: {
        kind: 'class',
        name: declaration.name,
        lines: [declaration.line],
      },
      related_nodes: relatedNodes,
      why: `${declaration.name} mantiene una sola fuente de verdad en el ViewModel y expone el estado mutable como StateFlow inmutable para la UI.`,
      impact:
        'La UI observa un estado único, estable y predecible en lugar de duplicar estado o mezclar orígenes distintos de verdad.',
      expected_fix:
        'Mantén un MutableStateFlow privado, expón StateFlow inmutable y actualiza el estado únicamente desde el ViewModel.',
      lines: sortedUniqueLines([
        declaration.line,
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidSingleSourceOfTruthUsage = (source: string): boolean => {
  return findAndroidSingleSourceOfTruthMatch(source) !== undefined;
};

export const findAndroidSkipRecompositionMatch = (
  source: string
): KotlinAndroidSkipRecompositionMatch | undefined => {
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const stableMarkerPattern =
    /(?:@Stable\b|@Immutable\b|\bImmutable(?:List|Set|Map)\b|\bPersistent(?:List|Set|Map)\b|\bkotlinx\.collections\.immutable\b)/;
  const lines = source.split(/\r?\n/);

  for (const composableNode of composableNodes) {
    const startLine = composableNode.lines[0] ?? 1;
    const endLine = Math.min(lines.length, startLine + 5);
    const markerLines = collectKotlinRegexLinesInRange(source, stableMarkerPattern, startLine, endLine);

    if (markerLines.length === 0) {
      continue;
    }

    const relatedNodes = markerLines.map((lineNumber) => {
      const sanitizedLine = stripKotlinLineForSemanticScan(lines[lineNumber - 1] ?? '');
      const markerName =
        sanitizedLine.match(/@Stable\b/)?.[0] ??
        sanitizedLine.match(/@Immutable\b/)?.[0] ??
        sanitizedLine.match(/\bImmutable(?:List|Set|Map)\b/)?.[0] ??
        sanitizedLine.match(/\bPersistent(?:List|Set|Map)\b/)?.[0] ??
        sanitizedLine.match(/\bkotlinx\.collections\.immutable\b/)?.[0] ??
        'stable';

      return {
        kind: 'member' as const,
        name: markerName,
        lines: [lineNumber],
      };
    });

    return {
      primary_node: composableNode,
      related_nodes: relatedNodes,
      why:
        `${composableNode.name} usa parámetros inmutables o estables para permitir que Compose salte recomposiciones innecesarias.`,
      impact:
        'La UI evita trabajo repetido cuando los parámetros son estables y Compose puede reutilizar el árbol sin recalcular todo el composable.',
      expected_fix:
        'Define parámetros estables o inmutables para los composables, usa colecciones inmutables y marca modelos con @Stable o @Immutable cuando corresponda.',
      lines: sortedUniqueLines([
        ...composableNode.lines,
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidSkipRecompositionUsage = (source: string): boolean => {
  return findAndroidSkipRecompositionMatch(source) !== undefined;
};

type KotlinAndroidStabilityTypeDeclaration = {
  name: string;
  line: number;
};

const collectAndroidStabilityTypeDeclarations = (
  source: string
): readonly KotlinAndroidStabilityTypeDeclaration[] => {
  const lines = source.split(/\r?\n/);
  const declarations: KotlinAndroidStabilityTypeDeclaration[] = [];
  const seen = new Set<string>();
  const annotationPattern = /@(Stable|Immutable)\b/;
  const typePattern =
    /^\s*(?:internal\s+|private\s+|public\s+)?(?:data\s+|sealed\s+|open\s+|abstract\s+)?(?:class|object)\s+([A-Za-z_][A-Za-z0-9_]*)\b/;

  for (let index = 0; index < lines.length; index += 1) {
    const sanitizedLine = stripKotlinLineForSemanticScan(lines[index] ?? '');
    if (!annotationPattern.test(sanitizedLine)) {
      continue;
    }

    for (let cursor = index; cursor < Math.min(lines.length, index + 5); cursor += 1) {
      const candidateLine = stripKotlinLineForSemanticScan(lines[cursor] ?? '');
      const candidateTypeLine = candidateLine.replace(/^(?:@\w+(?:\([^)]*\))?\s*)+/, '');
      const typeMatch = candidateTypeLine.match(typePattern);
      if (!typeMatch?.[1]) {
        continue;
      }

      const key = `${typeMatch[1]}:${cursor + 1}`;
      if (seen.has(key)) {
        break;
      }

      seen.add(key);
      declarations.push({
        name: typeMatch[1],
        line: cursor + 1,
      });
      break;
    }
  }

  return declarations;
};

export const findAndroidStabilityMatch = (
  source: string
): KotlinAndroidStabilityMatch | undefined => {
  const stableTypeDeclarations = collectAndroidStabilityTypeDeclarations(source);
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const lines = source.split(/\r?\n/);

  for (const composableNode of composableNodes) {
    const startLine = composableNode.lines[0] ?? 1;
    const endLine = Math.min(lines.length, startLine + 5);
    const relatedNodes: KotlinSemanticNodeMatch[] = [];

    for (const stableTypeDeclaration of stableTypeDeclarations) {
      const stableTypeLines = collectKotlinRegexLinesInRange(
        source,
        new RegExp(`\\b${escapeRegex(stableTypeDeclaration.name)}\\b`),
        startLine,
        endLine
      );

      if (stableTypeLines.length === 0) {
        continue;
      }

      relatedNodes.push({
        kind: 'class',
        name: stableTypeDeclaration.name,
        lines: [stableTypeDeclaration.line],
      });
    }

    if (relatedNodes.length === 0) {
      continue;
    }

    return {
      primary_node: composableNode,
      related_nodes: relatedNodes,
      why:
        `${composableNode.name} recibe tipos marcados como estables o inmutables y Compose puede tratar sus parámetros como una entrada más estable para recomponer menos.`,
      impact:
        'La UI reduce recomposiciones evitables cuando los modelos de entrada ya comunican estabilidad a Compose.',
      expected_fix:
        'Marca los modelos de UI como @Stable o @Immutable cuando su semántica lo permita y pásalos como parámetros del composable.',
      lines: sortedUniqueLines([
        ...composableNode.lines,
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidStabilityUsage = (source: string): boolean => {
  return findAndroidStabilityMatch(source) !== undefined;
};

const collectAndroidSharedFlowNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const sharedFlowPatterns: ReadonlyArray<{ name: string; regex: RegExp }> = [
    { name: 'MutableSharedFlow', regex: /\bMutableSharedFlow\b/ },
    { name: 'SharedFlow', regex: /\bSharedFlow\b/ },
    { name: 'asSharedFlow', regex: /\basSharedFlow\b/ },
    { name: 'tryEmit', regex: /\btryEmit\b/ },
  ];

  const nodes: KotlinSemanticNodeMatch[] = [];
  for (const sharedFlowPattern of sharedFlowPatterns) {
    const lines = collectKotlinRegexLines(source, sharedFlowPattern.regex);
    if (lines.length === 0) {
      continue;
    }
    nodes.push({
      kind: 'call',
      name: sharedFlowPattern.name,
      lines: [lines[0] ?? 1],
    });
  }

  return nodes;
};

export const findAndroidSharedFlowMatch = (
  source: string
): KotlinAndroidSharedFlowMatch | undefined => {
  const relatedNodes = collectAndroidSharedFlowNodes(source);
  const [primaryNode, ...restNodes] = relatedNodes;

  if (!primaryNode) {
    return undefined;
  }

  return {
    primary_node: primaryNode,
    related_nodes: restNodes,
    why:
      `${primaryNode.name} modela un SharedFlow para eventos en lugar de reemitir estado estable dentro de la UI.`,
    impact:
      'Los eventos quedan como un stream explícito que puede observarse desde ViewModel o Compose sin depender de callbacks sueltos.',
    expected_fix:
      'Usa MutableSharedFlow/SharedFlow para eventos efímeros y expón el stream de forma inmutable cuando corresponda.',
    lines: sortedUniqueLines(relatedNodes.flatMap((node) => [...node.lines])),
  };
};

export const hasAndroidSharedFlowUsage = (source: string): boolean => {
  return findAndroidSharedFlowMatch(source) !== undefined;
};

const collectAndroidFlowBuilderNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const builderPatterns: ReadonlyArray<{ name: string; regex: RegExp }> = [
    { name: 'flow { emit() }', regex: /\bflow\s*\{/ },
    { name: 'flowOf', regex: /\bflowOf\s*\(/ },
    { name: 'asFlow', regex: /\basFlow\s*\(/ },
  ];

  const nodes: KotlinSemanticNodeMatch[] = [];
  for (const builderPattern of builderPatterns) {
    const lines = collectKotlinRegexLines(source, builderPattern.regex);
    if (lines.length === 0) {
      continue;
    }
    nodes.push({
      kind: 'call',
      name: builderPattern.name,
      lines: [lines[0] ?? 1],
    });
  }

  return nodes;
};

export const findAndroidFlowBuilderMatch = (
  source: string
): KotlinAndroidFlowBuilderMatch | undefined => {
  const relatedNodes = collectAndroidFlowBuilderNodes(source);
  const [primaryNode, ...restNodes] = relatedNodes;

  if (!primaryNode) {
    return undefined;
  }

  return {
    primary_node: primaryNode,
    related_nodes: restNodes,
    why:
      `${primaryNode.name} construye un Flow en lugar de materializar datos de forma imperativa dentro de la capa Android.`,
    impact:
      'El flujo queda modelado de forma declarativa, más fácil de componer, testear y observar desde la UI o el ViewModel.',
    expected_fix:
      'Usa builders de Flow como flow { emit(...) }, flowOf(...) o asFlow() para exponer streams explícitos y testeables.',
    lines: sortedUniqueLines(relatedNodes.flatMap((node) => [...node.lines])),
  };
};

export const hasAndroidFlowBuilderUsage = (source: string): boolean => {
  return findAndroidFlowBuilderMatch(source) !== undefined;
};

const collectAndroidFlowCollectNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const collectPatterns: ReadonlyArray<{ name: string; regex: RegExp }> = [
    { name: 'collect', regex: /\bcollect\s*(?:<[^>\n]+>\s*)?\{/ },
    { name: 'collectLatest', regex: /\bcollectLatest\s*(?:<[^>\n]+>\s*)?\{/ },
    { name: 'launchIn', regex: /\blaunchIn\s*\(/ },
  ];

  const sourceLines = source.split(/\r?\n/);
  const nodes: KotlinSemanticNodeMatch[] = [];

  for (const collectPattern of collectPatterns) {
    const lines = collectKotlinRegexLines(source, collectPattern.regex);
    if (lines.length === 0) {
      continue;
    }

    const matchedLine = lines.find((lineNumber) => {
      const sanitizedLine = stripKotlinLineForSemanticScan(sourceLines[lineNumber - 1] ?? '');
      return collectPattern.regex.test(sanitizedLine);
    });

    if (!matchedLine) {
      continue;
    }

    nodes.push({
      kind: 'call',
      name: collectPattern.name,
      lines: [matchedLine],
    });
  }

  return nodes;
};

export const findAndroidFlowCollectMatch = (
  source: string
): KotlinAndroidFlowCollectMatch | undefined => {
  const relatedNodes = collectAndroidFlowCollectNodes(source);
  const [primaryNode, ...restNodes] = relatedNodes;

  if (!primaryNode) {
    return undefined;
  }

  return {
    primary_node: primaryNode,
    related_nodes: restNodes,
    why:
      `${primaryNode.name} consume un Flow en lugar de dejarlo como stream no observado dentro de la capa Android.`,
    impact:
      'El flujo pasa a tener un consumidor terminal explícito, lo que evita streams huérfanos y hace visible el punto de observación.',
    expected_fix:
      'Consume el Flow con collect, collectLatest o launchIn desde la capa adecuada y mantén el terminal operator cerca del owner correcto.',
    lines: sortedUniqueLines(relatedNodes.flatMap((node) => [...node.lines])),
  };
};

export const hasAndroidFlowCollectUsage = (source: string): boolean => {
  return findAndroidFlowCollectMatch(source) !== undefined;
};

const collectAndroidCollectAsStateNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const collectPatterns: ReadonlyArray<{ name: string; regex: RegExp }> = [
    { name: 'collectAsState', regex: /\bcollectAsState\s*\(/ },
    { name: 'collectAsStateWithLifecycle', regex: /\bcollectAsStateWithLifecycle\s*\(/ },
  ];

  const nodes: KotlinSemanticNodeMatch[] = [];
  for (const collectPattern of collectPatterns) {
    const lines = collectKotlinRegexLines(source, collectPattern.regex);
    if (lines.length === 0) {
      continue;
    }
    nodes.push({
      kind: 'call',
      name: collectPattern.name,
      lines: [lines[0] ?? 1],
    });
  }

  return nodes;
};

export const findAndroidCollectAsStateMatch = (
  source: string
): KotlinAndroidCollectAsStateMatch | undefined => {
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const lines = source.split(/\r?\n/);

  for (const composableNode of composableNodes) {
    const startLine = composableNode.lines[0] ?? 1;
    const endLine = Math.min(lines.length, startLine + 80);
    const relatedNodes = collectAndroidCollectAsStateNodes(source).filter((node) =>
      node.lines.some((lineNumber) => lineNumber >= startLine && lineNumber <= endLine)
    );

    if (relatedNodes.length === 0) {
      continue;
    }

    return {
      primary_node: composableNode,
      related_nodes: relatedNodes,
      why: `${composableNode.name} consume un Flow con collectAsState dentro de Compose para mantener la UI observando estado reactivo explícito.`,
      impact:
        'La UI Compose obtiene una representación estable del Flow y el estado deja de depender de callbacks o de observación manual fuera del composable.',
      expected_fix:
        'Usa collectAsState o collectAsStateWithLifecycle dentro del composable adecuado para convertir el Flow en estado observable de UI.',
      lines: sortedUniqueLines([
        ...(composableNode.lines ?? []),
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidCollectAsStateUsage = (source: string): boolean => {
  return findAndroidCollectAsStateMatch(source) !== undefined;
};

const collectAndroidRememberNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const lines = collectKotlinRegexLines(source, /\bremember\s*(?:\(|\{)/);

  return lines.map((lineNumber) => ({
    kind: 'call',
    name: 'remember',
    lines: [lineNumber],
  }));
};

export const findAndroidRememberMatch = (
  source: string
): KotlinAndroidRememberMatch | undefined => {
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const lines = source.split(/\r?\n/);

  for (const composableNode of composableNodes) {
    const startLine = composableNode.lines[0] ?? 1;
    const endLine = Math.min(lines.length, startLine + 80);
    const relatedNodes = collectAndroidRememberNodes(source).filter((node) =>
      node.lines.some((lineNumber) => lineNumber >= startLine && lineNumber <= endLine)
    );

    if (relatedNodes.length === 0) {
      continue;
    }

    return {
      primary_node: composableNode,
      related_nodes: relatedNodes,
      why: `${composableNode.name} usa remember para evitar recrear objetos o valores en cada recomposición de Compose.`,
      impact:
        'La UI mantiene instancias estables y reduce trabajo repetido al recomponer la pantalla.',
      expected_fix:
        'Usa remember para memoizar objetos o valores costosos dentro del composable y evita reconstruirlos en cada recomposición.',
      lines: sortedUniqueLines([
        ...(composableNode.lines ?? []),
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidRememberUsage = (source: string): boolean => {
  return findAndroidRememberMatch(source) !== undefined;
};

const collectAndroidDerivedStateOfNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const lines = collectKotlinRegexLines(source, /\bderivedStateOf\s*(?:\(|\{)/);

  return lines.map((lineNumber) => ({
    kind: 'call',
    name: 'derivedStateOf',
    lines: [lineNumber],
  }));
};

export const findAndroidDerivedStateOfMatch = (
  source: string
): KotlinAndroidDerivedStateOfMatch | undefined => {
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const lines = source.split(/\r?\n/);

  for (const composableNode of composableNodes) {
    const startLine = composableNode.lines[0] ?? 1;
    const endLine = Math.min(lines.length, startLine + 80);
    const relatedNodes = collectAndroidDerivedStateOfNodes(source).filter((node) =>
      node.lines.some((lineNumber) => lineNumber >= startLine && lineNumber <= endLine)
    );

    if (relatedNodes.length === 0) {
      continue;
    }

    return {
      primary_node: composableNode,
      related_nodes: relatedNodes,
      why: `${composableNode.name} usa derivedStateOf para recalcular un valor caro solo cuando cambia la entrada observada.`,
      impact:
        'La UI Compose evita recomputaciones innecesarias y mantiene el cálculo derivado sincronizado con el estado de origen.',
      expected_fix:
        'Usa derivedStateOf dentro del composable adecuado para derivar estados costosos a partir de la entrada que realmente cambia.',
      lines: sortedUniqueLines([
        ...(composableNode.lines ?? []),
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidDerivedStateOfUsage = (source: string): boolean => {
  return findAndroidDerivedStateOfMatch(source) !== undefined;
};

const collectAndroidLaunchedEffectNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const lines = collectKotlinRegexLines(source, /\bLaunchedEffect\s*\([^,\n)]*\)/);

  return lines.map((lineNumber) => ({
    kind: 'call',
    name: 'LaunchedEffect',
    lines: [lineNumber],
  }));
};

export const findAndroidLaunchedEffectMatch = (
  source: string
): KotlinAndroidLaunchedEffectMatch | undefined => {
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const lines = source.split(/\r?\n/);

  for (const composableNode of composableNodes) {
    const startLine = composableNode.lines[0] ?? 1;
    const endLine = Math.min(lines.length, startLine + 80);
    const relatedNodes = collectAndroidLaunchedEffectNodes(source).filter((node) =>
      node.lines.some((lineNumber) => lineNumber >= startLine && lineNumber <= endLine)
    );

    if (relatedNodes.length === 0) {
      continue;
    }

    return {
      primary_node: composableNode,
      related_nodes: relatedNodes,
      why: `${composableNode.name} usa LaunchedEffect para ejecutar side effects acotados al lifecycle de Compose con claves explícitas.`,
      impact:
        'El efecto queda cancelado y relanzado por Compose de forma controlada, evitando trabajo de UI fuera del árbol de composición.',
      expected_fix:
        'Usa LaunchedEffect dentro del composable adecuado para ejecutar side effects ligados al lifecycle y a claves estables.',
      lines: sortedUniqueLines([
        ...(composableNode.lines ?? []),
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidLaunchedEffectUsage = (source: string): boolean => {
  return findAndroidLaunchedEffectMatch(source) !== undefined;
};

const collectAndroidLaunchedEffectKeysNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const lines = collectKotlinRegexLines(source, /\bLaunchedEffect\s*\([^)\n]*,[^)\n]*\)/);

  return lines.map((lineNumber) => ({
    kind: 'call',
    name: 'LaunchedEffect keys',
    lines: [lineNumber],
  }));
};

export const findAndroidLaunchedEffectKeysMatch = (
  source: string
): KotlinAndroidLaunchedEffectKeysMatch | undefined => {
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const lines = source.split(/\r?\n/);

  for (const composableNode of composableNodes) {
    const startLine = composableNode.lines[0] ?? 1;
    const endLine = Math.min(lines.length, startLine + 80);
    const relatedNodes = collectAndroidLaunchedEffectKeysNodes(source).filter((node) =>
      node.lines.some((lineNumber) => lineNumber >= startLine && lineNumber <= endLine)
    );

    if (relatedNodes.length === 0) {
      continue;
    }

    return {
      primary_node: composableNode,
      related_nodes: relatedNodes,
      why: `${composableNode.name} usa LaunchedEffect con keys para controlar cuándo se relanza el efecto en Compose.`,
      impact:
        'Las keys determinan el ciclo de relanzado del efecto y evitan ejecuciones inesperadas cuando cambia el input correcto.',
      expected_fix:
        'Usa claves estables y explícitas en LaunchedEffect para relanzar el side effect solo cuando cambie la entrada esperada.',
      lines: sortedUniqueLines([
        ...(composableNode.lines ?? []),
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidLaunchedEffectKeysUsage = (source: string): boolean => {
  return findAndroidLaunchedEffectKeysMatch(source) !== undefined;
};

const collectAndroidDisposableEffectNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const lines = collectKotlinRegexLines(source, /\bDisposableEffect\s*\([^)\n]*\)/);

  return lines.map((lineNumber) => ({
    kind: 'call',
    name: 'DisposableEffect',
    lines: [lineNumber],
  }));
};

export const findAndroidDisposableEffectMatch = (
  source: string
): KotlinAndroidDisposableEffectMatch | undefined => {
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const lines = source.split(/\r?\n/);

  for (const composableNode of composableNodes) {
    const startLine = composableNode.lines[0] ?? 1;
    const endLine = Math.min(lines.length, startLine + 80);
    const relatedNodes = collectAndroidDisposableEffectNodes(source).filter((node) =>
      node.lines.some((lineNumber) => lineNumber >= startLine && lineNumber <= endLine)
    );

    if (relatedNodes.length === 0) {
      continue;
    }

    return {
      primary_node: composableNode,
      related_nodes: relatedNodes,
      why: `${composableNode.name} usa DisposableEffect para limpiar recursos y observadores cuando sale de composición.`,
      impact:
        'El efecto libera sus recursos al abandonar el árbol de Compose y evita fugas de suscripciones o listeners.',
      expected_fix:
        'Usa DisposableEffect dentro del composable adecuado para registrar y limpiar recursos ligados al lifecycle de Compose.',
      lines: sortedUniqueLines([
        ...(composableNode.lines ?? []),
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidDisposableEffectUsage = (source: string): boolean => {
  return findAndroidDisposableEffectMatch(source) !== undefined;
};

const collectAndroidPreviewNodes = (
  source: string,
  startLine: number,
  endLine: number
): readonly KotlinSemanticNodeMatch[] => {
  const lines = collectKotlinRegexLinesInRange(source, /@Preview\b/, startLine, endLine);

  return lines.map((lineNumber) => ({
    kind: 'call',
    name: '@Preview',
    lines: [lineNumber],
  }));
};

export const findAndroidPreviewMatch = (
  source: string
): KotlinAndroidPreviewMatch | undefined => {
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const lines = source.split(/\r?\n/);

  for (const composableNode of composableNodes) {
    const startLine = composableNode.lines[0] ?? 1;
    const windowStart = Math.max(1, startLine - 3);
    const endLine = Math.min(lines.length, startLine + 80);
    const relatedNodes = collectAndroidPreviewNodes(source, windowStart, endLine).filter((node) =>
      node.lines.some((lineNumber) => lineNumber >= windowStart && lineNumber <= endLine)
    );

    if (relatedNodes.length === 0) {
      continue;
    }

    return {
      primary_node: composableNode,
      related_nodes: relatedNodes,
      why: `${composableNode.name} expone una vista previa con @Preview para inspeccionar la UI sin ejecutar la app.`,
      impact:
        'La pantalla puede renderizarse en Android Studio y validar el layout de Compose sin levantar el runtime completo.',
      expected_fix:
        'Anota un composable representativo con @Preview para revisar la UI en el editor o extrae un wrapper preview dedicado.',
      lines: sortedUniqueLines([
        ...(composableNode.lines ?? []),
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidPreviewUsage = (source: string): boolean => {
  return findAndroidPreviewMatch(source) !== undefined;
};

const collectAndroidAdaptiveLayoutNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const patterns: ReadonlyArray<{ kind: KotlinSemanticNodeMatch['kind']; name: string; regex: RegExp }> = [
    { kind: 'call', name: 'calculateWindowSizeClass', regex: /\bcalculateWindowSizeClass\s*\(/ },
    { kind: 'member', name: 'WindowSizeClass', regex: /\bWindowSizeClass\b/ },
    { kind: 'member', name: 'WindowWidthSizeClass', regex: /\bWindowWidthSizeClass\b/ },
    { kind: 'member', name: 'WindowHeightSizeClass', regex: /\bWindowHeightSizeClass\b/ },
  ];

  const nodes: KotlinSemanticNodeMatch[] = [];

  for (const pattern of patterns) {
    const lines = collectKotlinRegexLines(source, pattern.regex);
    if (lines.length === 0) {
      continue;
    }

    nodes.push({
      kind: pattern.kind,
      name: pattern.name,
      lines,
    });
  }

  return nodes;
};

export const findAndroidAdaptiveLayoutsMatch = (
  source: string
): KotlinAndroidAdaptiveLayoutsMatch | undefined => {
  const adaptiveLayoutNodes = collectAndroidAdaptiveLayoutNodes(source);
  const hasWindowSizeClassContext = adaptiveLayoutNodes.some((node) =>
    node.name === 'calculateWindowSizeClass' || node.name === 'WindowSizeClass'
  );
  const hasResponsiveBranches = adaptiveLayoutNodes.some(
    (node) => node.name === 'WindowWidthSizeClass' || node.name === 'WindowHeightSizeClass'
  );

  if (!hasWindowSizeClassContext || !hasResponsiveBranches) {
    return undefined;
  }

  const [primaryNode, ...relatedNodes] = adaptiveLayoutNodes;
  if (!primaryNode) {
    return undefined;
  }

  return {
    primary_node: primaryNode,
    related_nodes: relatedNodes,
    why:
      'La UI usa WindowSizeClass para adaptar el layout a tamaños compact, medium y expanded en lugar de fijar una sola composición.',
    impact:
      'La interfaz responde al tamaño disponible y evita layouts rígidos que se rompen en pantallas grandes o pequeñas.',
    expected_fix:
      'Usa calculateWindowSizeClass junto con WindowWidthSizeClass o WindowHeightSizeClass para adaptar la composición al tamaño disponible.',
    lines: sortedUniqueLines(adaptiveLayoutNodes.flatMap((node) => [...node.lines])),
  };
};

export const hasAndroidAdaptiveLayoutsUsage = (source: string): boolean => {
  return findAndroidAdaptiveLayoutsMatch(source) !== undefined;
};

const collectAndroidGradleDependencyLines = (source: string): readonly number[] => {
  const lines = source.split(/\r?\n/);
  const matches: number[] = [];
  let insideDependenciesBlock = false;
  let braceDepth = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const sanitizedLine = stripKotlinLineForSemanticScan(lines[index] ?? '').trim();
    if (sanitizedLine.length === 0) {
      continue;
    }

    if (!insideDependenciesBlock && /\bdependencies\s*\{/.test(sanitizedLine)) {
      insideDependenciesBlock = true;
      braceDepth = countTokenOccurrences(sanitizedLine, '{') - countTokenOccurrences(sanitizedLine, '}');
      matches.push(index + 1);
      continue;
    }

    if (!insideDependenciesBlock) {
      continue;
    }

    if (
      /^(?:implementation|api|kapt|compileOnly|runtimeOnly|debugImplementation|releaseImplementation|testImplementation|androidTestImplementation)\b/.test(
        sanitizedLine
      )
    ) {
      matches.push(index + 1);
    }

    braceDepth += countTokenOccurrences(sanitizedLine, '{');
    braceDepth -= countTokenOccurrences(sanitizedLine, '}');
    if (braceDepth <= 0) {
      break;
    }
  }

  return sortedUniqueLines(matches);
};

export const findAndroidExistingStructureMatch = (
  source: string
): KotlinAndroidExistingStructureMatch | undefined => {
  const gradleDependencyLines = collectAndroidGradleDependencyLines(source);
  if (gradleDependencyLines.length > 0) {
    const [primaryLine, ...dependencyLines] = gradleDependencyLines;
    if (!primaryLine) {
      return undefined;
    }

    const relatedNodes: KotlinSemanticNodeMatch[] = [
      {
        kind: 'member',
        name: 'dependencies block',
        lines: [primaryLine],
      },
      ...dependencyLines.map((line) => ({
        kind: 'member' as const,
        name: 'dependency declaration',
        lines: [line],
      })),
    ];

    return {
      primary_node: relatedNodes[0] ?? {
        kind: 'member',
        name: 'dependencies block',
        lines: [primaryLine],
      },
      related_nodes: relatedNodes.slice(1),
      why:
        'El build Gradle expone la estructura real de dependencias del proyecto Android y conviene revisarla antes de introducir cambios arquitectónicos.',
      impact:
        'Si se ignora la estructura de dependencias, se duplican configuraciones, se rompen boundaries y se vuelve más difícil alinear los módulos existentes.',
      expected_fix:
        'Revisa primero el bloque dependencies y el catálogo Gradle para entender qué módulos y dependencias ya existen antes de añadir nuevas piezas.',
      lines: gradleDependencyLines,
    };
  }

  const interfaceDeclarations = parseKotlinInterfaceDeclarations(source);
  const moduleAnnotationLines = collectKotlinRegexLines(source, /@(Module|InstallIn)\b/);
  if (interfaceDeclarations.length === 0 || moduleAnnotationLines.length === 0) {
    return undefined;
  }

  const [primaryDeclaration, ...otherDeclarations] = interfaceDeclarations;
  if (!primaryDeclaration) {
    return undefined;
  }

  const relatedNodes: KotlinSemanticNodeMatch[] = [
    {
      kind: 'member',
      name: `interface declaration: ${primaryDeclaration.name}`,
      lines: [primaryDeclaration.line],
    },
    ...otherDeclarations.map((declaration) => ({
      kind: 'member' as const,
      name: `interface declaration: ${declaration.name}`,
      lines: [declaration.line],
    })),
    ...moduleAnnotationLines.map((line) => ({
      kind: 'member' as const,
      name: 'module annotation',
      lines: [line],
    })),
  ];

  return {
    primary_node: relatedNodes[0] ?? {
      kind: 'member',
      name: `interface declaration: ${primaryDeclaration.name}`,
      lines: [primaryDeclaration.line],
    },
    related_nodes: relatedNodes.slice(1),
    why:
      'El código Android combina contratos de interfaz, módulos Hilt y dependencias explícitas, así que conviene inspeccionar la estructura existente antes de cambiarla.',
    impact:
      'Si no se revisan módulos, interfaces y dependencias existentes, es fácil duplicar contratos, acoplar capas o introducir cambios que rompan Gradle o DI.',
    expected_fix:
      'Antes de añadir código nuevo, revisa los módulos, interfaces y dependencias Gradle ya presentes y alinea el cambio con la estructura actual del proyecto.',
    lines: sortedUniqueLines([
      primaryDeclaration.line,
      ...otherDeclarations.map((declaration) => declaration.line),
      ...moduleAnnotationLines,
    ]),
  };
};

export const hasAndroidExistingStructureUsage = (source: string): boolean => {
  return findAndroidExistingStructureMatch(source) !== undefined;
};

export const findAndroidThemeMatch = (
  source: string
): KotlinAndroidThemeMatch | undefined => {
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const lines = source.split(/\r?\n/);

  for (const composableNode of composableNodes) {
    const startLine = composableNode.lines[0] ?? 1;
    const endLine = Math.min(lines.length, startLine + 80);
    const materialThemeLines = collectKotlinRegexLinesInRange(
      source,
      /\bMaterialTheme\s*\(/,
      startLine,
      endLine
    );
    if (materialThemeLines.length === 0) {
      continue;
    }

    const scanStartLine = materialThemeLines[0] ?? startLine;
    const colorSchemeLines = collectKotlinRegexLinesInRange(
      source,
      /\bcolorScheme\b/,
      scanStartLine,
      Math.min(lines.length, scanStartLine + 20)
    );
    const typographyLines = collectKotlinRegexLinesInRange(
      source,
      /\btypography\b/,
      scanStartLine,
      Math.min(lines.length, scanStartLine + 20)
    );
    const shapesLines = collectKotlinRegexLinesInRange(
      source,
      /\bshapes\b/,
      scanStartLine,
      Math.min(lines.length, scanStartLine + 20)
    );

    if (colorSchemeLines.length === 0 || typographyLines.length === 0 || shapesLines.length === 0) {
      continue;
    }

    const relatedNodes: KotlinSemanticNodeMatch[] = [
      {
        kind: 'call',
        name: 'MaterialTheme',
        lines: materialThemeLines,
      },
      {
        kind: 'property',
        name: 'colorScheme',
        lines: colorSchemeLines,
      },
      {
        kind: 'property',
        name: 'typography',
        lines: typographyLines,
      },
      {
        kind: 'property',
        name: 'shapes',
        lines: shapesLines,
      },
    ];

    return {
      primary_node: composableNode,
      related_nodes: relatedNodes,
      why: `${composableNode.name} materializa el tema visual con colorScheme, typography y shapes explícitos en Compose.`,
      impact:
        'El esquema visual queda implícito o repartido y la UI pierde un contrato claro de coherencia y escalabilidad.',
      expected_fix:
        'Centraliza la configuración del tema en un composable dedicado y pasa colorScheme, typography y shapes de forma explícita.',
      lines: sortedUniqueLines([
        ...(composableNode.lines ?? []),
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidThemeUsage = (source: string): boolean => {
  return findAndroidThemeMatch(source) !== undefined;
};

export type KotlinAndroidDarkThemeMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidAccessibilityMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidContentDescriptionMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export const findAndroidDarkThemeMatch = (
  source: string
): KotlinAndroidDarkThemeMatch | undefined => {
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const lines = source.split(/\r?\n/);

  for (const composableNode of composableNodes) {
    const startLine = composableNode.lines[0] ?? 1;
    const endLine = Math.min(lines.length, startLine + 80);
    const darkThemeLines = collectKotlinRegexLinesInRange(
      source,
      /\bisSystemInDarkTheme\s*\(/,
      startLine,
      endLine
    );
    if (darkThemeLines.length === 0) {
      continue;
    }

    const scanStartLine = darkThemeLines[0] ?? startLine;
    const darkColorSchemeLines = collectKotlinRegexLinesInRange(
      source,
      /\bdarkColorScheme\s*\(/,
      scanStartLine,
      Math.min(lines.length, scanStartLine + 20)
    );
    const lightColorSchemeLines = collectKotlinRegexLinesInRange(
      source,
      /\blightColorScheme\s*\(/,
      scanStartLine,
      Math.min(lines.length, scanStartLine + 20)
    );
    const materialThemeLines = collectKotlinRegexLinesInRange(
      source,
      /\bMaterialTheme\s*\(/,
      scanStartLine,
      Math.min(lines.length, scanStartLine + 20)
    );

    if (
      darkColorSchemeLines.length === 0 ||
      lightColorSchemeLines.length === 0 ||
      materialThemeLines.length === 0
    ) {
      continue;
    }

    const relatedNodes: KotlinSemanticNodeMatch[] = [
      { kind: 'call', name: 'isSystemInDarkTheme', lines: darkThemeLines },
      { kind: 'call', name: 'darkColorScheme', lines: darkColorSchemeLines },
      { kind: 'call', name: 'lightColorScheme', lines: lightColorSchemeLines },
      { kind: 'call', name: 'MaterialTheme', lines: materialThemeLines },
    ];

    return {
      primary_node: composableNode,
      related_nodes: relatedNodes,
      why: `${composableNode.name} soporta tema oscuro desde el primer día al bifurcar color schemes según isSystemInDarkTheme().`,
      impact:
        'La UI se adapta al sistema desde el primer día y evita una experiencia rota para usuarios con tema oscuro activo.',
      expected_fix:
        'Usa isSystemInDarkTheme() para elegir darkColorScheme() o lightColorScheme() dentro de un composable de tema dedicado.',
      lines: sortedUniqueLines([
        ...(composableNode.lines ?? []),
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidDarkThemeUsage = (source: string): boolean => {
  return findAndroidDarkThemeMatch(source) !== undefined;
};

const collectAndroidAccessibilityNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const patterns: ReadonlyArray<{ name: string; regex: RegExp }> = [
    { name: 'contentDescription', regex: /\bcontentDescription\s*=/ },
    { name: 'semantics', regex: /\b(?:Modifier\s*\.\s*)?semantics\s*(?:\(|\{)/ },
  ];

  const sourceLines = source.split(/\r?\n/);
  const nodes: KotlinSemanticNodeMatch[] = [];

  for (const pattern of patterns) {
    const lines = collectKotlinRegexLines(source, pattern.regex);
    if (lines.length === 0) {
      continue;
    }

    const matchedLine = lines.find((lineNumber) => {
      const sanitizedLine = stripKotlinLineForSemanticScan(sourceLines[lineNumber - 1] ?? '');
      return pattern.regex.test(sanitizedLine);
    });

    if (!matchedLine) {
      continue;
    }

    nodes.push({
      kind: pattern.name === 'contentDescription' ? 'property' : 'call',
      name: pattern.name,
      lines: [matchedLine],
    });
  }

  return nodes;
};

export const findAndroidAccessibilityMatch = (
  source: string
): KotlinAndroidAccessibilityMatch | undefined => {
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const lines = source.split(/\r?\n/);

  for (const composableNode of composableNodes) {
    const startLine = composableNode.lines[0] ?? 1;
    const endLine = Math.min(lines.length, startLine + 80);
    const relatedNodes = collectAndroidAccessibilityNodes(source).filter((node) =>
      node.lines.some((lineNumber) => lineNumber >= startLine && lineNumber <= endLine)
    );

    if (relatedNodes.length === 0) {
      continue;
    }

    return {
      primary_node: composableNode,
      related_nodes: relatedNodes,
      why: `${composableNode.name} expone accesibilidad explícita con contentDescription o semantics en Compose.`,
      impact:
        'La UI proporciona una experiencia accesible para lectores de pantalla y tecnologías de asistencia sin depender de defaults implícitos.',
      expected_fix:
        'Usa contentDescription y/o semantics dentro del composable adecuado para describir la interfaz de forma accesible.',
      lines: sortedUniqueLines([
        ...(composableNode.lines ?? []),
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidAccessibilityUsage = (source: string): boolean => {
  return findAndroidAccessibilityMatch(source) !== undefined;
};

export type KotlinAndroidTalkBackMatch = KotlinAndroidAccessibilityMatch;

export const findAndroidTalkBackMatch = (
  source: string
): KotlinAndroidTalkBackMatch | undefined => {
  return findAndroidAccessibilityMatch(source);
};

export const hasAndroidTalkBackUsage = (source: string): boolean => {
  return findAndroidTalkBackMatch(source) !== undefined;
};

export type KotlinAndroidTextScalingMatch = KotlinAndroidAccessibilityMatch;

const collectAndroidTextScalingNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const patterns: ReadonlyArray<{ name: string; kind: KotlinSemanticNodeMatch['kind']; regex: RegExp }> = [
    { name: 'fontScale', kind: 'property', regex: /\bfontScale\b/ },
    {
      name: 'fontSize',
      kind: 'property',
      regex: /\bfontSize\s*=\s*[^,\n]*\.sp\b/,
    },
    { name: 'TextUnit.Sp', kind: 'property', regex: /\bTextUnit\.Sp\b/ },
  ];

  const sourceLines = source.split(/\r?\n/);
  const nodes: KotlinSemanticNodeMatch[] = [];

  for (const pattern of patterns) {
    const lines = collectKotlinRegexLines(source, pattern.regex);
    if (lines.length === 0) {
      continue;
    }

    const matchedLine = lines.find((lineNumber) => {
      const sanitizedLine = stripKotlinLineForSemanticScan(sourceLines[lineNumber - 1] ?? '');
      return pattern.regex.test(sanitizedLine);
    });

    if (!matchedLine) {
      continue;
    }

    nodes.push({
      kind: pattern.kind,
      name: pattern.name,
      lines: [matchedLine],
    });
  }

  return nodes;
};

export const findAndroidTextScalingMatch = (
  source: string
): KotlinAndroidTextScalingMatch | undefined => {
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const lines = source.split(/\r?\n/);

  for (const composableNode of composableNodes) {
    const startLine = composableNode.lines[0] ?? 1;
    const endLine = Math.min(lines.length, startLine + 80);
    const relatedNodes = collectAndroidTextScalingNodes(source).filter((node) =>
      node.lines.some((lineNumber) => lineNumber >= startLine && lineNumber <= endLine)
    );

    if (relatedNodes.length === 0) {
      continue;
    }

    const hasFontScale = relatedNodes.some((node) => node.name === 'fontScale');
    const hasFontSizeSp = relatedNodes.some(
      (node) => node.name === 'fontSize' || node.name === 'TextUnit.Sp'
    );

    if (!hasFontScale || !hasFontSizeSp) {
      continue;
    }

    return {
      primary_node: composableNode,
      related_nodes: relatedNodes,
      why: `${composableNode.name} respeta el font scaling del sistema al leer fontScale y dimensionar el texto con sp en Compose.`,
      impact:
        'La UI conserva legibilidad con tamaños de fuente accesibles y no rompe la experiencia de usuarios que aumentan el texto del sistema.',
      expected_fix:
        'Lee LocalDensity.current.fontScale cuando necesites ajustar la tipografía y usa sp o TextUnit.Sp para que Compose respete el escalado del sistema.',
      lines: sortedUniqueLines([
        ...(composableNode.lines ?? []),
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidTextScalingUsage = (source: string): boolean => {
  return findAndroidTextScalingMatch(source) !== undefined;
};

export type KotlinAndroidTouchTargetsMatch = KotlinAndroidAccessibilityMatch;

const collectAndroidTouchTargetNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const patterns: ReadonlyArray<{ name: string; kind: KotlinSemanticNodeMatch['kind']; regex: RegExp }> = [
    {
      name: 'minimumInteractiveComponentSize',
      kind: 'call',
      regex: /\bminimumInteractiveComponentSize\s*\(/,
    },
    {
      name: 'minimumTouchTargetSize',
      kind: 'call',
      regex: /\bminimumTouchTargetSize\s*\(/,
    },
    {
      name: 'sizeIn48dp',
      kind: 'call',
      regex: /\b(?:sizeIn|requiredSizeIn)\s*\([^)\n]*(?:minWidth|minHeight)\s*=\s*48\.dp/,
    },
  ];

  const sourceLines = source.split(/\r?\n/);
  const nodes: KotlinSemanticNodeMatch[] = [];

  for (const pattern of patterns) {
    const lines = collectKotlinRegexLines(source, pattern.regex);
    if (lines.length === 0) {
      continue;
    }

    const matchedLine = lines.find((lineNumber) => {
      const sanitizedLine = stripKotlinLineForSemanticScan(sourceLines[lineNumber - 1] ?? '');
      return pattern.regex.test(sanitizedLine);
    });

    if (!matchedLine) {
      continue;
    }

    nodes.push({
      kind: pattern.kind,
      name: pattern.name,
      lines: [matchedLine],
    });
  }

  return nodes;
};

export const findAndroidTouchTargetsMatch = (
  source: string
): KotlinAndroidTouchTargetsMatch | undefined => {
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const lines = source.split(/\r?\n/);

  for (const composableNode of composableNodes) {
    const startLine = composableNode.lines[0] ?? 1;
    const endLine = Math.min(lines.length, startLine + 80);
    const relatedNodes = collectAndroidTouchTargetNodes(source).filter((node) =>
      node.lines.some((lineNumber) => lineNumber >= startLine && lineNumber <= endLine)
    );

    if (relatedNodes.length === 0) {
      continue;
    }

    return {
      primary_node: composableNode,
      related_nodes: relatedNodes,
      why: `${composableNode.name} asegura touch targets de al menos 48dp en Compose para controles interactivos.`,
      impact:
        'Los elementos interactivos mantienen un área de toque suficiente y evitan interacciones demasiado pequeñas o imprecisas.',
      expected_fix:
        'Usa Modifier.minimumInteractiveComponentSize() o sizeIn(minWidth = 48.dp, minHeight = 48.dp) para garantizar un touch target accesible.',
      lines: sortedUniqueLines([
        ...(composableNode.lines ?? []),
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidTouchTargetsUsage = (source: string): boolean => {
  return findAndroidTouchTargetsMatch(source) !== undefined;
};

export type KotlinAndroidStringsXmlMatch = KotlinAndroidAccessibilityMatch;
export type KotlinAndroidPluralsXmlMatch = KotlinAndroidAccessibilityMatch;
export type KotlinAndroidStringFormattingXmlMatch = KotlinAndroidAccessibilityMatch;

const stripAndroidXmlLineForSemanticScan = (line: string): string => {
  return line.replace(/<!--.*?-->/g, '');
};

const collectAndroidStringsXmlNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const patterns: ReadonlyArray<{ name: string; regex: RegExp }> = [
    { name: 'string', regex: /<string\b/ },
    { name: 'plurals', regex: /<plurals\b/ },
    { name: 'string-array', regex: /<string-array\b/ },
  ];

  const sourceLines = source.split(/\r?\n/);
  const nodes: KotlinSemanticNodeMatch[] = [];

  for (const pattern of patterns) {
    const matchedLine = sourceLines.findIndex((line) =>
      pattern.regex.test(stripAndroidXmlLineForSemanticScan(line))
    );

    if (matchedLine === -1) {
      continue;
    }

    nodes.push({
      kind: 'property',
      name: pattern.name,
      lines: [matchedLine + 1],
    });
  }

  return nodes;
};

const collectAndroidStringFormattingXmlNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const sourceLines = source.split(/\r?\n/);
  const formattedStringPattern = /<string\b[^>]*>[^<]*%\d+\$[sdif][^<]*<\/string>/;
  const nodes: KotlinSemanticNodeMatch[] = [];

  sourceLines.forEach((line, index) => {
    if (!formattedStringPattern.test(stripAndroidXmlLineForSemanticScan(line))) {
      return;
    }

    nodes.push({
      kind: 'property',
      name: 'formatted string',
      lines: [index + 1],
    });
  });

  return nodes;
};

export const findAndroidStringsXmlMatch = (
  source: string
): KotlinAndroidStringsXmlMatch | undefined => {
  const relatedNodes = collectAndroidStringsXmlNodes(source);
  if (relatedNodes.length === 0) {
    return undefined;
  }

  const lines = source.split(/\r?\n/);
  const firstNodeLine = relatedNodes[0]?.lines[0] ?? 1;
  const resourcesLine = lines.findIndex((line) =>
    /<resources\b/.test(stripAndroidXmlLineForSemanticScan(line))
  );
  const primaryLine = resourcesLine >= 0 ? resourcesLine + 1 : firstNodeLine;

  return {
    primary_node: {
      kind: 'member',
      name: 'strings.xml',
      lines: [primaryLine],
    },
    related_nodes: relatedNodes,
    why: 'strings.xml organiza recursos localizados por idioma para que la UI use textos externos al código en Compose y el resto de Android.',
    impact:
      'La aplicación mantiene traducciones y recursos de texto separados del código, facilitando internacionalización y mantenimiento.',
    expected_fix:
      'Define los textos en values-*/strings.xml y referencia los recursos desde el código con R.string en lugar de literals embebidos.',
    lines: sortedUniqueLines([primaryLine, ...relatedNodes.flatMap((node) => [...node.lines])]),
  };
};

export const hasAndroidStringsXmlUsage = (source: string): boolean => {
  return findAndroidStringsXmlMatch(source) !== undefined;
};

export const findAndroidStringFormattingMatch = (
  source: string
): KotlinAndroidStringFormattingXmlMatch | undefined => {
  const relatedNodes = collectAndroidStringFormattingXmlNodes(source);
  if (relatedNodes.length === 0) {
    return undefined;
  }

  const lines = source.split(/\r?\n/);
  const firstNodeLine = relatedNodes[0]?.lines[0] ?? 1;
  const resourcesLine = lines.findIndex((line) =>
    /<resources\b/.test(stripAndroidXmlLineForSemanticScan(line))
  );
  const primaryLine = resourcesLine >= 0 ? resourcesLine + 1 : firstNodeLine;

  return {
    primary_node: {
      kind: 'member',
      name: 'strings.xml',
      lines: [primaryLine],
    },
    related_nodes: relatedNodes,
    why:
      'strings.xml usa placeholders posicionales para mantener el orden de argumentos estable entre idiomas y evitar concatenaciones frágiles.',
    impact:
      'La UI conserva el mapeo correcto entre argumentos y traducciones aunque el orden de las palabras cambie según el locale.',
    expected_fix:
      'Usa placeholders posicionales como %1$s y %2$d en strings.xml y pasa los argumentos en el mismo orden desde el código.',
    lines: sortedUniqueLines([primaryLine, ...relatedNodes.flatMap((node) => [...node.lines])]),
  };
};

export const hasAndroidStringFormattingUsage = (source: string): boolean => {
  return findAndroidStringFormattingMatch(source) !== undefined;
};

const collectAndroidPluralsXmlNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const patterns: ReadonlyArray<{ name: string; regex: RegExp }> = [
    { name: 'plurals', regex: /<plurals\b/ },
    { name: 'plural item', regex: /<item\b[^>]*\bquantity\s*=/ },
  ];

  const sourceLines = source.split(/\r?\n/);
  const nodes: KotlinSemanticNodeMatch[] = [];

  for (const pattern of patterns) {
    const matchedLine = sourceLines.findIndex((line) =>
      pattern.regex.test(stripAndroidXmlLineForSemanticScan(line))
    );

    if (matchedLine === -1) {
      continue;
    }

    nodes.push({
      kind: 'property',
      name: pattern.name,
      lines: [matchedLine + 1],
    });
  }

  return nodes;
};

export const findAndroidPluralsXmlMatch = (
  source: string
): KotlinAndroidPluralsXmlMatch | undefined => {
  const relatedNodes = collectAndroidPluralsXmlNodes(source);
  if (relatedNodes.length < 2) {
    return undefined;
  }

  const lines = source.split(/\r?\n/);
  const firstNodeLine = relatedNodes[0]?.lines[0] ?? 1;
  const resourcesLine = lines.findIndex((line) =>
    /<resources\b/.test(stripAndroidXmlLineForSemanticScan(line))
  );
  const primaryLine = resourcesLine >= 0 ? resourcesLine + 1 : firstNodeLine;

  return {
    primary_node: {
      kind: 'member',
      name: 'plurals.xml',
      lines: [primaryLine],
    },
    related_nodes: relatedNodes,
    why: 'plurals.xml centraliza variantes gramaticales por cantidad para que Android seleccione el texto correcto según el quantity.',
    impact:
      'La UI mantiene pluralización correcta por idioma y evita lógica de cantidades hardcodeada en el código.',
    expected_fix:
      'Define <plurals> con item quantity en values-*/plurals.xml y consume el recurso desde R.plurals en lugar de concatenar textos en código.',
    lines: sortedUniqueLines([primaryLine, ...relatedNodes.flatMap((node) => [...node.lines])]),
  };
};

export const hasAndroidPluralsXmlUsage = (source: string): boolean => {
  return findAndroidPluralsXmlMatch(source) !== undefined;
};

const collectAndroidContentDescriptionNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  return collectAndroidAccessibilityNodes(source).filter((node) => node.name === 'contentDescription');
};

export const findAndroidContentDescriptionMatch = (
  source: string
): KotlinAndroidContentDescriptionMatch | undefined => {
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const lines = source.split(/\r?\n/);

  for (const composableNode of composableNodes) {
    const startLine = composableNode.lines[0] ?? 1;
    const endLine = Math.min(lines.length, startLine + 80);
    const relatedNodes = collectAndroidContentDescriptionNodes(source).filter((node) =>
      node.lines.some((lineNumber) => lineNumber >= startLine && lineNumber <= endLine)
    );

    if (relatedNodes.length === 0) {
      continue;
    }

    return {
      primary_node: composableNode,
      related_nodes: relatedNodes,
      why: `${composableNode.name} define contentDescription explícito para imágenes o botones en Compose.`,
      impact:
        'Los elementos interactivos o gráficos quedan descritos para lectores de pantalla y tecnologías de asistencia.',
      expected_fix:
        'Usa contentDescription dentro del composable adecuado para describir imágenes, iconos y botones de forma accesible.',
      lines: sortedUniqueLines([
        ...(composableNode.lines ?? []),
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidContentDescriptionUsage = (source: string): boolean => {
  return findAndroidContentDescriptionMatch(source) !== undefined;
};

const collectAndroidRecompositionNodes = (
  source: string
): readonly KotlinSemanticNodeMatch[] => {
  const patterns: ReadonlyArray<[string, RegExp]> = [
    ['println', /\bprintln\s*\(/],
    ['log', /\bLog\.[A-Z]+\s*\(/],
    ['toast', /\bToast\.makeText\b/],
    ['state mutation', /\b[A-Za-z_][A-Za-z0-9_]*\.value\s*=/],
    ['mutable increment', /\+\+|--/],
    ['side effect launch', /\b(?:launch|async|withContext)\s*\(/],
  ];

  const nodes: KotlinSemanticNodeMatch[] = [];
  for (const [name, regex] of patterns) {
    const lines = collectKotlinRegexLines(source, regex);
    for (const lineNumber of lines) {
      nodes.push({
        kind: 'call',
        name,
        lines: [lineNumber],
      });
    }
  }

  return nodes;
};

export const findAndroidRecompositionMatch = (
  source: string
): KotlinAndroidRecompositionMatch | undefined => {
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const lines = source.split(/\r?\n/);

  for (const composableNode of composableNodes) {
    const startLine = composableNode.lines[0] ?? 1;
    const endLine = Math.min(lines.length, startLine + 80);
    const relatedNodes = collectAndroidRecompositionNodes(source).filter((node) =>
      node.lines.some((lineNumber) => lineNumber >= startLine && lineNumber <= endLine)
    );

    if (relatedNodes.length === 0) {
      continue;
    }

    return {
      primary_node: composableNode,
      related_nodes: relatedNodes,
      why: `${composableNode.name} ejecuta efectos o mutaciones directas que rompen la idempotencia durante la recomposición de Compose.`,
      impact:
        'La UI puede repetir efectos secundarios o mutaciones cada vez que Compose recomputa el composable.',
      expected_fix:
        'Mantén el cuerpo del composable libre de mutaciones y side effects, y mueve la lógica imperativa a efectos o al ViewModel.',
      lines: sortedUniqueLines([
        ...(composableNode.lines ?? []),
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidRecompositionUsage = (source: string): boolean => {
  return findAndroidRecompositionMatch(source) !== undefined;
};

const collectAndroidUiStateVariantNodes = (
  source: string,
  bodyStartLine: number,
  bodyEndLine: number
): readonly KotlinSemanticNodeMatch[] => {
  const variantPatterns: ReadonlyArray<{ name: string; regex: RegExp }> = [
    { name: 'Loading', regex: /\b(?:data\s+object|object|data\s+class|class)\s+Loading\b/ },
    { name: 'Success', regex: /\b(?:data\s+object|object|data\s+class|class)\s+Success\b/ },
    { name: 'Error', regex: /\b(?:data\s+object|object|data\s+class|class)\s+Error\b/ },
  ];

  const nodes: KotlinSemanticNodeMatch[] = [];
  for (const variantPattern of variantPatterns) {
    const lines = collectKotlinRegexLinesInRange(
      source,
      variantPattern.regex,
      bodyStartLine,
      bodyEndLine
    );
    if (lines.length === 0) {
      return [];
    }
    nodes.push({
      kind: 'member',
      name: variantPattern.name,
      lines: [lines[0] ?? bodyStartLine],
    });
  }

  return nodes;
};

const buildAndroidUiStateMatch = (
  source: string
): KotlinAndroidUiStateMatch | undefined => {
  const lines = source.split(/\r?\n/);
  const declarations = parseKotlinTypeDeclarations(source).filter((declaration) =>
    declaration.name.endsWith('UiState')
  );

  for (const declaration of declarations) {
    const declarationLine = stripKotlinLineForSemanticScan(lines[declaration.line - 1] ?? '');
    if (!/\bsealed\s+class\b/.test(declarationLine)) {
      continue;
    }

    const relatedNodes = collectAndroidUiStateVariantNodes(
      source,
      declaration.bodyStartLine,
      declaration.bodyEndLine
    );
    if (relatedNodes.length === 0) {
      continue;
    }

    return {
      primary_node: {
        kind: 'class',
        name: declaration.name,
        lines: [declaration.line],
      },
      related_nodes: relatedNodes,
      why: `${declaration.name} modela Loading, Success y Error como estados cerrados de UI en Android.`,
      impact:
        'La UI trabaja con un estado tipado y cerrado, lo que evita banderas sueltas y branches dispersos para cada render.',
      expected_fix:
        'Mantén un sealed class UiState con Loading, Success y Error y expónlo desde la capa de presentación o el ViewModel.',
      lines: sortedUniqueLines([
        declaration.line,
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const findAndroidUiStateMatch = (
  source: string
): KotlinAndroidUiStateMatch | undefined => {
  return buildAndroidUiStateMatch(source);
};

export const hasAndroidUiStateUsage = (source: string): boolean => {
  return findAndroidUiStateMatch(source) !== undefined;
};

const buildAndroidUseCaseMatch = (
  source: string
): KotlinAndroidUseCaseMatch | undefined => {
  const sourceLines = source.split(/\r?\n/);
  const declarations = parseKotlinTypeDeclarations(source).filter((declaration) =>
    declaration.name.endsWith('UseCase')
  );

  for (let declarationIndex = 0; declarationIndex < declarations.length; declarationIndex += 1) {
    const declaration = declarations[declarationIndex];
    const relatedNodes: KotlinSemanticNodeMatch[] = [];
    const nextDeclarationLine =
      declarations[declarationIndex + 1]?.line ?? sourceLines.length + 1;

    const dependencyLines = collectKotlinRegexLines(
      source,
      /\b(?:private|internal|public)?\s*val\s+[A-Za-z_][A-Za-z0-9_]*\s*:\s*[A-Za-z_][A-Za-z0-9_]*(?:Repository|Port|Gateway|Service|DataSource|Fetcher)\b/,
    ).filter((line) => line >= declaration.line && line < nextDeclarationLine);
    if (dependencyLines.length > 0) {
      relatedNodes.push({
        kind: 'property',
        name: 'use case dependency',
        lines: dependencyLines,
      });
    }

    const executeLines: number[] = [];
    for (let lineIndex = declaration.line - 1; lineIndex < nextDeclarationLine - 1; lineIndex += 1) {
      const sanitizedLine = stripKotlinLineForSemanticScan(sourceLines[lineIndex] ?? '');
      if (/\b(?:suspend\s+)?(?:operator\s+)?fun\s+(invoke|execute)\b/.test(sanitizedLine)) {
        executeLines.push(lineIndex + 1);
      }
    }
    const executeLinesInScope = executeLines.filter(
      (line) => line >= declaration.line && line < nextDeclarationLine
    );
    if (executeLinesInScope.length > 0) {
      relatedNodes.push({
        kind: 'member',
        name: 'use case operation',
        lines: executeLinesInScope,
      });
    }

    if (executeLinesInScope.length === 0) {
      continue;
    }

    return {
      primary_node: {
        kind: 'class',
        name: declaration.name,
        lines: [declaration.line],
      },
      related_nodes: relatedNodes,
      why: `${declaration.name} encapsula lógica de negocio en una única operación de aplicación en lugar de dispersarla por presentation.`,
      impact:
        'La lógica queda concentrada en un punto de entrada estable, más fácil de testear y de reutilizar desde ViewModel o coordinadores.',
      expected_fix:
        'Mantén un UseCase pequeño con una operación pública clara, dependencias inyectadas y sin mezclar orquestación de UI.',
      lines: sortedUniqueLines([
        declaration.line,
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const findAndroidUseCaseMatch = (
  source: string
): KotlinAndroidUseCaseMatch | undefined => {
  return buildAndroidUseCaseMatch(source);
};

export const hasAndroidUseCaseUsage = (source: string): boolean => {
  return findAndroidUseCaseMatch(source) !== undefined;
};

const collectAndroidRepositoryRelatedNodes = (
  source: string,
  startLine: number,
  endLine: number
): readonly KotlinSemanticNodeMatch[] => {
  const relatedNodes: KotlinSemanticNodeMatch[] = [];
  const dependencyLines = collectKotlinRegexLinesInRange(
    source,
    /\b(?:private|internal|public)?\s*val\s+[A-Za-z_][A-Za-z0-9_]*\s*:\s*[A-Za-z_][A-Za-z0-9_]*(?:Api|Dao|DataSource|Service|Client|Remote|Local|Store)\b/,
    startLine,
    endLine
  );
  if (dependencyLines.length > 0) {
    relatedNodes.push({
      kind: 'property',
      name: 'repository dependency',
      lines: dependencyLines,
    });
  }

  const operationLines = collectKotlinRegexLinesInRange(
    source,
    /\b(?:override\s+)?(?:suspend\s+)?fun\s+(?:load|fetch|get|save|observe|sync|refresh|update|delete|insert|find|create|clear|add|remove)[A-Za-z0-9_]*\b/,
    startLine,
    endLine
  );
  if (operationLines.length > 0) {
    relatedNodes.push({
      kind: 'member',
      name: 'repository operation',
      lines: operationLines,
    });
  }

  const contractLines = collectKotlinRegexLinesInRange(
    source,
    /:\s*[A-Za-z_][A-Za-z0-9_]*(?:Repository(?:Impl)?|OrdersRep)\b/,
    startLine,
    endLine
  );
  if (contractLines.length > 0) {
    relatedNodes.push({
      kind: 'member',
      name: 'repository contract',
      lines: contractLines,
    });
  }

  return relatedNodes;
};

const buildAndroidRepositoryPatternMatch = (
  source: string,
  namePredicate: (name: string) => boolean,
  why: string,
  impact: string,
  expectedFix: string
): KotlinAndroidRepositoryPatternMatch | undefined => {
  const repositoryDeclarations = parseAndroidRepositoryDeclarations(source).filter((declaration) =>
    namePredicate(declaration.name)
  );

  for (const declaration of repositoryDeclarations) {
    const relatedNodes = [...declaration.members.map(
      (member): KotlinSemanticNodeMatch => ({
        kind: 'member',
        name: member.name,
        lines: [member.line],
      })
    ), ...collectAndroidRepositoryRelatedNodes(
      source,
      declaration.line,
      source.split(/\r?\n/).length
    )];

    const uniqueRelatedNodes: KotlinSemanticNodeMatch[] = [];
    const seenRelatedNodes = new Set<string>();
    for (const relatedNode of relatedNodes) {
      const signature = `${relatedNode.kind}|${relatedNode.name}|${relatedNode.lines.join(',')}`;
      if (seenRelatedNodes.has(signature)) {
        continue;
      }
      seenRelatedNodes.add(signature);
      uniqueRelatedNodes.push(relatedNode);
    }

    if (uniqueRelatedNodes.length === 0) {
      continue;
    }

    return {
      primary_node: {
        kind: 'class',
        name: declaration.name,
        lines: [declaration.line],
      },
      related_nodes: uniqueRelatedNodes,
      why,
      impact,
      expected_fix: expectedFix,
      lines: sortedUniqueLines([
        declaration.line,
        ...uniqueRelatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const findAndroidRepositoryPatternMatch = (
  source: string
): KotlinAndroidRepositoryPatternMatch | undefined => {
  return buildAndroidRepositoryPatternMatch(
    source,
    (name) => name.endsWith('Repository') || name.endsWith('RepositoryImpl') || name === 'OrdersRep',
    'El repository abstrae el acceso a datos detrás de una frontera estable en lugar de mezclar APIs, DAOs o DataSources con la capa de presentación.',
    'La capa consumidora depende de un contrato de datos estable y no de los detalles de red o persistencia.',
    'Mantén el Repository como una abstracción pequeña, inyectada y delegando a fuentes de datos concretas desde la capa data.'
  );
};

export const hasAndroidRepositoryPatternUsage = (source: string): boolean => {
  return findAndroidRepositoryPatternMatch(source) !== undefined;
};

export const findAndroidOrdersRepMatch = (
  source: string
): KotlinAndroidRepositoryPatternMatch | undefined => {
  return buildAndroidRepositoryPatternMatch(
    source,
    (name) => name === 'OrdersRep',
    'OrdersRep formaliza el acceso a datos del flujo de pedidos detrás de una abstracción estable.',
    'La UI y el dominio consumen un contrato de pedidos uniforme en lugar de dispersar llamadas a fuentes locales o remotas.',
    'Mantén OrdersRep como fachada de acceso a datos de pedidos y delega la persistencia o red a dependencias inyectadas.'
  );
};

export const hasAndroidOrdersRepUsage = (source: string): boolean => {
  return findAndroidOrdersRepMatch(source) !== undefined;
};

export const findAndroidStateHoistingMatch = (
  source: string
): KotlinAndroidStateHoistingMatch | undefined => {
  const composableNodes = collectAndroidComposableFunctionDeclarations(source);
  const primaryNode = composableNodes[0];
  if (!primaryNode) {
    return undefined;
  }

  const stateLines = collectKotlinRegexLinesInRange(
    source,
    /\b(?:rememberSaveable|mutableStateOf)\b/,
    primaryNode.lines[0] ?? 1,
    (primaryNode.lines[0] ?? 1) + 80
  );
  if (stateLines.length === 0) {
    return undefined;
  }

  const lines = source.split(/\r?\n/);
  const relatedNodes: KotlinSemanticNodeMatch[] = [];

  for (const lineNumber of stateLines) {
    const sanitizedLine = stripKotlinLineForSemanticScan(lines[lineNumber - 1] ?? '');
    if (/\brememberSaveable\b/.test(sanitizedLine)) {
      relatedNodes.push({
        kind: 'call',
        name: 'rememberSaveable',
        lines: [lineNumber],
      });
    }
    if (/\bmutableStateOf\b/.test(sanitizedLine)) {
      relatedNodes.push({
        kind: 'call',
        name: 'mutableStateOf',
        lines: [lineNumber],
      });
    }
  }

  return {
    primary_node: primaryNode,
    related_nodes: relatedNodes,
    why: `${primaryNode.name} concentra estado de UI local en lugar de elevarlo al nivel apropiado para compartirlo con la pantalla o el ViewModel.`,
    impact:
      'El estado queda acoplado al composable concreto y la jerarquía de UI pierde una única fuente clara para observar y reutilizar ese valor.',
    expected_fix:
      'Eleva el estado al padre o al ViewModel y deja el composable como una función que recibe valor y callbacks explícitos.',
    lines: sortedUniqueLines([
      ...(primaryNode.lines ?? []),
      ...relatedNodes.flatMap((node) => [...node.lines]),
    ]),
  };
};

export const hasAndroidStateHoistingUsage = (source: string): boolean => {
  return findAndroidStateHoistingMatch(source) !== undefined;
};

export const findAndroidViewModelMatch = (
  source: string
): KotlinAndroidViewModelMatch | undefined => {
  const declarations = parseKotlinTypeDeclarations(source).filter((declaration) =>
    declaration.conformances.some((conformance) => conformance === 'ViewModel')
  );

  for (const declaration of declarations) {
    const lines = source.split(/\r?\n/);
    const relatedNodes: KotlinSemanticNodeMatch[] = [
      {
        kind: 'member',
        name: 'androidx.lifecycle.ViewModel',
        lines: [declaration.line],
      },
    ];

    const savedStateHandleLines = collectKotlinRegexLinesInRange(
      source,
      /\bSavedStateHandle\b/,
      declaration.bodyStartLine,
      declaration.bodyEndLine
    );
    if (savedStateHandleLines.length > 0) {
      relatedNodes.push({
        kind: 'property',
        name: 'SavedStateHandle',
        lines: savedStateHandleLines,
      });
    }

    const stateFlowLines = collectKotlinRegexLinesInRange(
      source,
      /\b(?:MutableStateFlow|StateFlow|asStateFlow)\b/,
      declaration.bodyStartLine,
      declaration.bodyEndLine
    );
    if (stateFlowLines.length > 0) {
      relatedNodes.push({
        kind: 'property',
        name: 'StateFlow',
        lines: stateFlowLines,
      });
    }

    return {
      primary_node: {
        kind: 'class',
        name: declaration.name,
        lines: [declaration.line],
      },
      related_nodes: relatedNodes,
      why: `${declaration.name} usa AndroidX ViewModel para encapsular estado y lógica que deben sobrevivir a cambios de configuración.`,
      impact:
        'El estado deja de vivir en la Activity o Fragment y pasa a una capa explícita que Compose y el resto de la UI pueden observar sin recrearlo en cada rotación.',
      expected_fix:
        'Mantén el estado observable y la coordinación de la pantalla dentro de un ViewModel de AndroidX, no en la Activity ni en objetos efímeros.',
      lines: sortedUniqueLines([
        declaration.line,
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidViewModelUsage = (source: string): boolean => {
  return findAndroidViewModelMatch(source) !== undefined;
};

export const findAndroidViewModelScopeMatch = (
  source: string
): KotlinAndroidViewModelScopeMatch | undefined => {
  const scopeLines = collectKotlinRegexLines(source, /\bviewModelScope\b/);
  if (scopeLines.length === 0) {
    return undefined;
  }

  const lines = source.split(/\r?\n/);
  const relatedNodes: KotlinSemanticNodeMatch[] = [];
  const coroutineLaunchLines = scopeLines.filter((lineNumber) => {
    const sanitizedLine = stripKotlinLineForSemanticScan(lines[lineNumber - 1] ?? '');
    return /\bviewModelScope\s*\.\s*(launch|async)\b/.test(sanitizedLine);
  });

  if (coroutineLaunchLines.length > 0) {
    relatedNodes.push({
      kind: 'call',
      name: 'launch/async',
      lines: coroutineLaunchLines,
    });
  }

  return {
    primary_node: {
      kind: 'member',
      name: 'viewModelScope',
      lines: scopeLines,
    },
    related_nodes: relatedNodes,
    why: 'viewModelScope crea un scope ligado al ViewModel que se cancela automáticamente cuando el ViewModel se destruye.',
    impact:
      'La coordinación asíncrona queda atada al ciclo de vida correcto y no necesita limpieza manual en Activity o Fragment.',
    expected_fix:
      'Usa viewModelScope para lanzar trabajo asincrónico de pantalla y delega la lógica al ViewModel en lugar de mantener scopes manuales.',
    lines: sortedUniqueLines([
      ...scopeLines,
      ...relatedNodes.flatMap((node) => [...node.lines]),
    ]),
  };
};

export const hasAndroidViewModelScopeUsage = (source: string): boolean => {
  return findAndroidViewModelScopeMatch(source) !== undefined;
};

export const findAndroidAppStartupMatch = (
  source: string
): KotlinAndroidAppStartupMatch | undefined => {
  const initializerPattern =
    /\b(?:class|object)\s+([A-Za-z_][A-Za-z0-9_]*)\b[^\n]*\bInitializer\s*</;
  const initializerLines = collectKotlinRegexLines(source, initializerPattern);
  if (initializerLines.length === 0) {
    return undefined;
  }

  const classLine = source.split(/\r?\n/)[initializerLines[0] - 1] ?? '';
  const className = classLine.match(initializerPattern)?.[1];
  if (!className) {
    return undefined;
  }

  return {
    primary_node: {
      kind: 'class',
      name: className,
      lines: initializerLines,
    },
    related_nodes: [
      {
        kind: 'member',
        name: 'androidx.startup.Initializer',
        lines: initializerLines,
      },
    ],
    why: `${className} usa androidx.startup.Initializer para resolver dependencias de arranque de forma perezosa y explícita.`,
    impact:
      'La inicialización de dependencias pasa a un contrato de arranque controlado en lugar de ejecutarse de forma ad hoc en Application o en singletons manuales.',
    expected_fix:
      'Mantén la inicialización de arranque en androidx.startup y limita el trabajo eager para que la app cargue dependencias solo cuando haga falta.',
    lines: sortedUniqueLines([...initializerLines]),
  };
};

export const hasAndroidAppStartupUsage = (source: string): boolean => {
  return findAndroidAppStartupMatch(source) !== undefined;
};

export const findAndroidAnalyticsMatch = (
  source: string
): KotlinAndroidAnalyticsMatch | undefined => {
  const declarations = parseKotlinTypeDeclarations(source);
  const analyticsCallPattern = /\b(?:logEvent|trackEvent|logScreenView|setUserProperty)\s*\(/;
  const analyticsMarkerPattern = /\b(?:FirebaseAnalytics|logEvent|trackEvent|logScreenView|setUserProperty)\b/;

  for (const declaration of declarations) {
    const analyticsLines = collectKotlinRegexLinesInRange(
      source,
      analyticsMarkerPattern,
      declaration.bodyStartLine,
      declaration.bodyEndLine
    );
    if (analyticsLines.length === 0) {
      continue;
    }

    const firebaseLines = collectKotlinRegexLinesInRange(
      source,
      /\bFirebaseAnalytics\b/,
      declaration.bodyStartLine,
      declaration.bodyEndLine
    );
    const analyticsCallLines = collectKotlinRegexLinesInRange(
      source,
      analyticsCallPattern,
      declaration.bodyStartLine,
      declaration.bodyEndLine
    );

    if (firebaseLines.length === 0 && analyticsCallLines.length === 0) {
      continue;
    }

    const relatedNodes: KotlinSemanticNodeMatch[] = [];
    if (firebaseLines.length > 0) {
      relatedNodes.push({
        kind: 'property',
        name: 'FirebaseAnalytics',
        lines: firebaseLines,
      });
    }
    if (analyticsCallLines.length > 0) {
      relatedNodes.push({
        kind: 'call',
        name: 'analytics event',
        lines: analyticsCallLines,
      });
    }

    return {
      primary_node: {
        kind: 'class',
        name: declaration.name,
        lines: [declaration.line],
      },
      related_nodes: relatedNodes,
      why: `${declaration.name} centraliza instrumentation de analytics en un punto estable en lugar de dispersar eventos por la app.`,
      impact:
        'Las mediciones de comportamiento quedan encapsuladas detrás de un contrato claro y no se confunden con lógica de UI o dominio.',
      expected_fix:
        'Mantén el tracking de analytics en una clase dedicada o wrapper del SDK y delega desde la UI solo eventos explícitos.',
      lines: sortedUniqueLines([
        declaration.line,
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidAnalyticsUsage = (source: string): boolean => {
  return findAndroidAnalyticsMatch(source) !== undefined;
};

export const findAndroidProfilerMatch = (
  source: string
): KotlinAndroidProfilerMatch | undefined => {
  const declarations = parseKotlinTypeDeclarations(source);
  const profilerCallPattern =
    /\b(?:Trace\.beginSection|Trace\.beginAsyncSection|Trace\.setCounter|TraceKt\.trace|Debug\.startMethodTracing(?:Sampling)?|Debug\.stopMethodTracing|Debug\.startAllocCounting|Debug\.stopAllocCounting|Debug\.startNativeTracing|Debug\.stopNativeTracing|Debug\.getMemoryInfo|Debug\.threadCpuTimeNanos)\s*\(/;
  const profilerMarkerPattern =
    /\b(?:androidx\.tracing\.Trace|android\.os\.Trace|android\.os\.Debug|Debug\.MemoryInfo|TraceKt\.trace|startMethodTracing|stopMethodTracing|beginSection|beginAsyncSection|setCounter|startAllocCounting|stopAllocCounting|startNativeTracing|stopNativeTracing|getMemoryInfo|threadCpuTimeNanos)\b/;

  for (const declaration of declarations) {
    const profilerLines = collectKotlinRegexLinesInRange(
      source,
      profilerMarkerPattern,
      declaration.bodyStartLine,
      declaration.bodyEndLine
    );
    if (profilerLines.length === 0) {
      continue;
    }

    const traceLines = collectKotlinRegexLinesInRange(
      source,
      /\b(?:Trace\.beginSection|Trace\.beginAsyncSection|Trace\.setCounter|TraceKt\.trace)\b/,
      declaration.bodyStartLine,
      declaration.bodyEndLine
    );
    const debugTracingLines = collectKotlinRegexLinesInRange(
      source,
      /\b(?:Debug\.startMethodTracing(?:Sampling)?|Debug\.stopMethodTracing|Debug\.startAllocCounting|Debug\.stopAllocCounting|Debug\.startNativeTracing|Debug\.stopNativeTracing|Debug\.getMemoryInfo|Debug\.threadCpuTimeNanos)\b/,
      declaration.bodyStartLine,
      declaration.bodyEndLine
    );

    if (traceLines.length === 0 && debugTracingLines.length === 0) {
      continue;
    }

    const relatedNodes: KotlinSemanticNodeMatch[] = [];
    if (traceLines.length > 0) {
      relatedNodes.push({
        kind: 'call',
        name: 'Trace',
        lines: traceLines,
      });
    }
    if (debugTracingLines.length > 0) {
      relatedNodes.push({
        kind: 'call',
        name: 'Debug tracing',
        lines: debugTracingLines,
      });
    }

    return {
      primary_node: {
        kind: 'class',
        name: declaration.name,
        lines: [declaration.line],
      },
      related_nodes: relatedNodes,
      why: `${declaration.name} centraliza instrumentación de profiling en un punto estable en lugar de dispersar trazas y mediciones por la app.`,
      impact:
        'La captura de CPU, memoria o trazas de ejecución queda explícita y no se mezcla con lógica de dominio o presentación.',
      expected_fix:
        'Mantén el profiling en una clase dedicada o helper de observabilidad y usa Trace o Debug de forma controlada.',
      lines: sortedUniqueLines([
        declaration.line,
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidProfilerUsage = (source: string): boolean => {
  return findAndroidProfilerMatch(source) !== undefined;
};

export const findAndroidBaselineProfilesMatch = (
  source: string
): KotlinAndroidBaselineProfilesMatch | undefined => {
  const ruleLines = collectKotlinRegexLines(source, /\bBaselineProfileRule\b/);
  if (ruleLines.length === 0) {
    return undefined;
  }

  const collectLines = collectKotlinRegexLines(source, /\bcollect\s*\(/);
  const packageNameLines = collectKotlinRegexLines(source, /\bpackageName\s*=/);
  const relatedNodes: KotlinSemanticNodeMatch[] = [];

  if (collectLines.length > 0) {
    relatedNodes.push({
      kind: 'call',
      name: 'collect',
      lines: collectLines,
    });
  }

  if (packageNameLines.length > 0) {
    relatedNodes.push({
      kind: 'member',
      name: 'packageName',
      lines: packageNameLines,
    });
  }

  return {
    primary_node: {
      kind: 'member',
      name: 'BaselineProfileRule',
      lines: ruleLines,
    },
    related_nodes: relatedNodes,
    why:
      'BaselineProfileRule captura perfiles de compilación para que el arranque de Android use un baseline profile explícito y medible.',
    impact:
      'La app puede precalentar rutas críticas de arranque sin hacer eager work manual en producción.',
    expected_fix:
      'Mantén los baseline profiles en pruebas de benchmark/instrumented tests y registra rutas críticas con BaselineProfileRule.collect.',
    lines: sortedUniqueLines([...ruleLines, ...collectLines, ...packageNameLines]),
  };
};

export const hasAndroidBaselineProfilesUsage = (source: string): boolean => {
  return findAndroidBaselineProfilesMatch(source) !== undefined;
};

const workManagerWorkerConformancePattern = /(?:Worker|CoroutineWorker|ListenableWorker)$/;

const collectWorkManagerWorkerDeclarations = (
  lines: readonly string[]
): readonly KotlinTypeDeclaration[] => {
  const declarations: KotlinTypeDeclaration[] = [];
  const classPattern =
    /(?:internal\s+|private\s+|public\s+)?(?:abstract\s+|open\s+|sealed\s+|data\s+|final\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)\b/;

  for (let index = 0; index < lines.length; index += 1) {
    const declarationWindow = lines
      .slice(index, Math.min(lines.length, index + 6))
      .map((line) => stripKotlinLineForSemanticScan(line ?? ''))
      .join(' ');
    const classMatch = declarationWindow.match(classPattern);
    if (!classMatch) {
      continue;
    }

    const typeName = classMatch[1];
    const conformanceName =
      declarationWindow.match(/\)\s*:\s*(?:[A-Za-z_][A-Za-z0-9_.]*\.)?([A-Za-z_][A-Za-z0-9_]*)\b/)?.[1] ??
      declarationWindow.match(
        /class\s+[A-Za-z_][A-Za-z0-9_]*\s*:\s*(?:[A-Za-z_][A-Za-z0-9_.]*\.)?([A-Za-z_][A-Za-z0-9_]*)\b/
      )?.[1];
    if (!conformanceName || !workManagerWorkerConformancePattern.test(conformanceName)) {
      continue;
    }

    const sanitizedLine = stripKotlinLineForSemanticScan(lines[index] ?? '');

    let braceDepth =
      countTokenOccurrences(sanitizedLine, '{') - countTokenOccurrences(sanitizedLine, '}');
    const bodyStartLine = index + 1;
    let bodyEndLine = index + 1;

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidateLine = stripKotlinLineForSemanticScan(lines[cursor] ?? '');
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
      conformances: [conformanceName],
      bodyStartLine,
      bodyEndLine,
    });
  }

  return declarations;
};

export const findAndroidWorkManagerBackgroundTaskMatch = (
  source: string
): KotlinAndroidWorkManagerBackgroundTaskMatch | undefined => {
  const lines = source.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const sanitizedLine = stripKotlinLineForSemanticScan(lines[index] ?? '');
    if (!/\bclass\b/.test(sanitizedLine)) {
      continue;
    }

    const declarationWindow = lines.slice(index, Math.min(lines.length, index + 8)).join('\n');
    const classMatch = declarationWindow.match(
      /class\s+([A-Za-z_][A-Za-z0-9_]*)[\s\S]{0,240}?\)\s*:\s*(?:[A-Za-z_][A-Za-z0-9_.]*\.)?([A-Za-z_][A-Za-z0-9_]*)\b/
    );
    const conformanceMatch = classMatch?.[2] ?? '';
    if (!classMatch || !workManagerWorkerConformancePattern.test(conformanceMatch)) {
      continue;
    }

    const doWorkMatch = declarationWindow.match(/\boverride\s+(?:suspend\s+)?fun\s+doWork\s*\(/);
    if (!doWorkMatch || typeof doWorkMatch.index !== 'number') {
      continue;
    }

    const doWorkLine = index + declarationWindow.slice(0, doWorkMatch.index).split(/\r?\n/).length;
    return {
      primary_node: {
        kind: 'class',
        name: classMatch[1],
        lines: [index + 1],
      },
      related_nodes: [
        {
          kind: 'member',
          name: conformanceMatch,
          lines: [index + 1],
        },
        {
          kind: 'call',
          name: 'doWork',
          lines: [doWorkLine],
        },
      ],
      why: `${classMatch[1]} implementa una tarea de WorkManager en segundo plano en lugar de ejecutar trabajo largo desde el hilo UI.`,
      impact:
        'El trabajo diferido queda encapsulado en un Worker explícito que WorkManager puede reintentar y orquestar según las restricciones del sistema.',
      expected_fix:
        'Usa Worker, CoroutineWorker o ListenableWorker con doWork() explícito para expresar el trabajo en background.',
      lines: sortedUniqueLines([index + 1, doWorkLine]),
    };
  }

  return undefined;
};

export const hasAndroidWorkManagerBackgroundTaskUsage = (source: string): boolean => {
  return findAndroidWorkManagerBackgroundTaskMatch(source) !== undefined;
};

export type KotlinAndroidSuspendApiServiceMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidSuspendFunctionsAsyncMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidAsyncAwaitParallelismMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidVersionCatalogMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidTransactionMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidWorkManagerDependencyMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidWorkManagerBackgroundTaskMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidInstrumentedTestMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export type KotlinAndroidTestStructureMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

export const findAndroidSuspendFunctionsApiServiceMatch = (
  source: string
): KotlinAndroidSuspendApiServiceMatch | undefined => {
  const declarations = parseKotlinInterfaceDeclarations(source).filter((declaration) =>
    /(?:Api)?Service$/.test(declaration.name)
  );

  for (const declaration of declarations) {
    const suspendFunctionLines = collectKotlinRegexLinesInRange(
      source,
      /\bsuspend\s+fun\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/,
      declaration.bodyStartLine,
      declaration.bodyEndLine
    );
    if (suspendFunctionLines.length === 0) {
      continue;
    }

    const lines = source.split(/\r?\n/);
    const relatedNodes: KotlinSemanticNodeMatch[] = [
      {
        kind: 'member',
        name: `API service: ${declaration.name}`,
        lines: [declaration.line],
      },
    ];

    for (const lineNumber of suspendFunctionLines) {
      const sanitizedLine = stripKotlinLineForSemanticScan(lines[lineNumber - 1] ?? '');
      const functionName = sanitizedLine.match(/\bsuspend\s+fun\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/)?.[1];
      if (!functionName) {
        continue;
      }
      relatedNodes.push({
        kind: 'member',
        name: `suspend fun ${functionName}`,
        lines: [lineNumber],
      });
    }

    const annotationLines = collectKotlinRegexLinesInRange(
      source,
      /\b(?:@GET|@POST|@PUT|@DELETE|@PATCH|@HEAD|@HTTP)\b/,
      declaration.bodyStartLine,
      declaration.bodyEndLine
    );
    if (annotationLines.length > 0) {
      relatedNodes.push({
        kind: 'member',
        name: 'Retrofit HTTP annotations',
        lines: annotationLines,
      });
    }

    return {
      primary_node: {
        kind: 'class',
        name: declaration.name,
        lines: [declaration.line],
      },
      related_nodes: relatedNodes,
      why: `${declaration.name} define un contrato de API con suspend functions para operaciones remotas en lugar de callbacks o bloqueos.`,
      impact:
        'La capa de red expone una API lineal, más fácil de orquestar desde coroutines y más simple de testear sin anidar callbacks.',
      expected_fix:
        'Mantén los métodos del API service como suspend functions y resuelve la coordinación asíncrona en el caso de uso o ViewModel.',
      lines: sortedUniqueLines([
        declaration.line,
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidSuspendFunctionsApiServiceUsage = (source: string): boolean => {
  return findAndroidSuspendFunctionsApiServiceMatch(source) !== undefined;
};

export type KotlinAndroidDaoSuspendFunctionsMatch = {
  primary_node: KotlinSemanticNodeMatch;
  related_nodes: readonly KotlinSemanticNodeMatch[];
  why: string;
  impact: string;
  expected_fix: string;
  lines: readonly number[];
};

const findKotlinDaoAnnotationLine = (sourceLines: readonly string[], declarationLine: number): number => {
  const start = Math.max(0, declarationLine - 4);
  for (let index = declarationLine - 2; index >= start; index -= 1) {
    const sanitizedLine = stripKotlinLineForSemanticScan(sourceLines[index] ?? '');
    if (/@Dao\b/.test(sanitizedLine)) {
      return index + 1;
    }
  }
  return declarationLine;
};

const findKotlinTransactionAnnotationLine = (
  sourceLines: readonly string[],
  declarationLine: number,
  memberLine: number
): number | undefined => {
  const start = Math.max(0, memberLine - 4);
  for (let index = memberLine - 2; index >= start; index -= 1) {
    const sanitizedLine = stripKotlinLineForSemanticScan(sourceLines[index] ?? '');
    if (/@Transaction\b/.test(sanitizedLine)) {
      return index + 1;
    }
  }

  return undefined;
};

export const findAndroidTransactionMatch = (
  source: string
): KotlinAndroidTransactionMatch | undefined => {
  const declarations = parseKotlinInterfaceDeclarations(source).filter((declaration) =>
    /Dao$/.test(declaration.name)
  );

  const sourceLines = source.split(/\r?\n/);
  for (const declaration of declarations) {
    const daoAnnotationLine = findKotlinDaoAnnotationLine(sourceLines, declaration.line);
    const transactionFunctions: KotlinSemanticNodeMatch[] = [];

    for (const member of declaration.members) {
      const transactionAnnotationLine = findKotlinTransactionAnnotationLine(
        sourceLines,
        declaration.line,
        member.line
      );
      if (!transactionAnnotationLine) {
        continue;
      }

      const memberLine = sourceLines[member.line - 1] ?? '';
      if (!/\bfun\b/.test(stripKotlinLineForSemanticScan(memberLine))) {
        continue;
      }

      transactionFunctions.push({
        kind: 'member',
        name: `@Transaction fun ${member.name}`,
        lines: [transactionAnnotationLine, member.line],
      });
    }

    if (transactionFunctions.length === 0) {
      continue;
    }

    const [primaryFunction, ...otherFunctions] = transactionFunctions;
    const relatedNodes: KotlinSemanticNodeMatch[] = [
      {
        kind: 'member',
        name: '@Dao',
        lines: [daoAnnotationLine],
      },
      primaryFunction,
      ...otherFunctions,
    ];

    return {
      primary_node: {
        kind: 'class',
        name: declaration.name,
        lines: [declaration.line],
      },
      related_nodes: relatedNodes,
      why: `${declaration.name} marca operaciones multi-query con @Transaction para que Room ejecute la secuencia de lectura/escritura de forma atómica.`,
      impact:
        'Las consultas múltiples quedan dentro de una transacción explícita y evitan estados intermedios inconsistentes o parciales durante la persistencia.',
      expected_fix:
        'Anota con @Transaction los métodos DAO que coordinan varias queries o escrituras relacionadas para que Room las trate como una unidad atómica.',
      lines: sortedUniqueLines([
        daoAnnotationLine,
        declaration.line,
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const findAndroidDaoSuspendFunctionsMatch = (
  source: string
): KotlinAndroidDaoSuspendFunctionsMatch | undefined => {
  const declarations = parseKotlinInterfaceDeclarations(source).filter((declaration) =>
    /Dao$/.test(declaration.name)
  );

  const sourceLines = source.split(/\r?\n/);
  for (const declaration of declarations) {
    const suspendFunctionLines = collectKotlinRegexLinesInRange(
      source,
      /\bsuspend\s+fun\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/,
      declaration.bodyStartLine,
      declaration.bodyEndLine
    );

    if (suspendFunctionLines.length === 0) {
      continue;
    }

    const daoAnnotationLine = findKotlinDaoAnnotationLine(sourceLines, declaration.line);
    const relatedNodes: KotlinSemanticNodeMatch[] = [
      {
        kind: 'member',
        name: '@Dao',
        lines: [daoAnnotationLine],
      },
    ];

    for (const lineNumber of suspendFunctionLines) {
      const sanitizedLine = stripKotlinLineForSemanticScan(sourceLines[lineNumber - 1] ?? '');
      const functionName = sanitizedLine.match(/\bsuspend\s+fun\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/)?.[1];
      if (!functionName) {
        continue;
      }
      relatedNodes.push({
        kind: 'member',
        name: `suspend fun ${functionName}`,
        lines: [lineNumber],
      });
    }

    if (relatedNodes.length <= 1) {
      continue;
    }

    return {
      primary_node: {
        kind: 'class',
        name: declaration.name,
        lines: [declaration.line],
      },
      related_nodes: relatedNodes,
      why: `${declaration.name} concentra consultas y mutaciones de Room con suspend functions en la capa DAO en lugar de delegar a APIs lineales o contratos asíncronos más explícitos.`,
      impact:
        'La capa de persistencia expone un contrato de acceso a datos asincrónico que resulta más fácil de componer desde coroutines y más claro de testear.',
      expected_fix:
        'Mantén los métodos del DAO como suspend functions y deja la coordinación de flujo en repositorios o casos de uso.',
      lines: sortedUniqueLines([
        daoAnnotationLine,
        declaration.line,
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidDaoSuspendFunctionsUsage = (source: string): boolean => {
  return findAndroidDaoSuspendFunctionsMatch(source) !== undefined;
};

export const findAndroidSuspendFunctionsAsyncMatch = (
  source: string
): KotlinAndroidSuspendFunctionsAsyncMatch | undefined => {
  const declarations = [
    ...parseKotlinTypeDeclarations(source),
    ...parseKotlinInterfaceDeclarations(source),
  ].filter((declaration) => !/(?:Api)?Service$/.test(declaration.name) && !/Dao$/.test(declaration.name));

  for (const declaration of declarations) {
    const suspendFunctionLines = collectKotlinRegexLinesInRange(
      source,
      /\bsuspend\s+fun\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/,
      declaration.bodyStartLine,
      declaration.bodyEndLine
    );
    if (suspendFunctionLines.length === 0) {
      continue;
    }

    const lines = source.split(/\r?\n/);
    const relatedNodes: KotlinSemanticNodeMatch[] = [
      {
        kind: 'member',
        name: declaration.name,
        lines: [declaration.line],
      },
    ];

    for (const lineNumber of suspendFunctionLines) {
      const sanitizedLine = stripKotlinLineForSemanticScan(lines[lineNumber - 1] ?? '');
      const functionName = sanitizedLine.match(/\bsuspend\s+fun\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/)?.[1];
      if (!functionName) {
        continue;
      }
      relatedNodes.push({
        kind: 'member',
        name: `suspend fun ${functionName}`,
        lines: [lineNumber],
      });
    }

    if (relatedNodes.length <= 1) {
      continue;
    }

    return {
      primary_node: {
        kind: 'class',
        name: declaration.name,
        lines: [declaration.line],
      },
      related_nodes: relatedNodes,
      why: `${declaration.name} encapsula operaciones async con suspend functions en una frontera Kotlin explicita en lugar de dispersar callbacks o bloqueos.`,
      impact:
        'La coordinación asíncrona queda expresada como API lineal, más fácil de componer desde coroutines y más simple de testear.',
      expected_fix:
        'Mantén suspend functions para operaciones async en clases o interfaces de dominio, repositorio o coordinación y deja los callbacks fuera de la frontera Kotlin.',
      lines: sortedUniqueLines([
        declaration.line,
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidSuspendFunctionsAsyncUsage = (source: string): boolean => {
  return findAndroidSuspendFunctionsAsyncMatch(source) !== undefined;
};

export const findAndroidAsyncAwaitParallelismMatch = (
  source: string
): KotlinAndroidAsyncAwaitParallelismMatch | undefined => {
  const declarations = parseKotlinTypeDeclarations(source).filter((declaration) => {
    return !/(?:Api)?Service$/.test(declaration.name) && !/Dao$/.test(declaration.name);
  });

  for (const declaration of declarations) {
    const asyncCallLines = collectKotlinRegexLinesInRange(
      source,
      /\basync\b.*\{/,
      declaration.bodyStartLine,
      declaration.bodyEndLine
    );
    const awaitLines = collectKotlinRegexLinesInRange(
      source,
      /\bawait(?:All)?\s*\(/,
      declaration.bodyStartLine,
      declaration.bodyEndLine
    );

    if (asyncCallLines.length === 0 || awaitLines.length === 0) {
      continue;
    }

    const lines = source.split(/\r?\n/);
    const relatedNodes: KotlinSemanticNodeMatch[] = [
      {
        kind: 'member',
        name: declaration.name,
        lines: [declaration.line],
      },
      {
        kind: 'call',
        name: 'async',
        lines: asyncCallLines,
      },
      {
        kind: 'call',
        name: awaitLines.some((lineNumber) => /\bawaitAll\s*\(/.test(lines[lineNumber - 1] ?? ''))
          ? 'awaitAll'
          : 'await',
        lines: awaitLines,
      },
    ];

    return {
      primary_node: {
        kind: 'class',
        name: declaration.name,
        lines: [declaration.line],
      },
      related_nodes: relatedNodes,
      why: `${declaration.name} usa async/await para ejecutar trabajo paralelo en coroutines en lugar de secuenciar operaciones independientes.`,
      impact:
        'Las tareas independientes pueden completarse en paralelo y luego coordinarse con await/awaitAll sin bloquear el hilo de llamada.',
      expected_fix:
        'Usa async/await dentro de una coroutineScope cuando varias tareas independientes puedan ejecutarse en paralelo y luego combinarse.',
      lines: sortedUniqueLines([
        declaration.line,
        ...relatedNodes.flatMap((node) => [...node.lines]),
      ]),
    };
  }

  return undefined;
};

export const hasAndroidAsyncAwaitParallelismUsage = (source: string): boolean => {
  return findAndroidAsyncAwaitParallelismMatch(source) !== undefined;
};

export const hasAndroidTransactionUsage = (source: string): boolean => {
  return findAndroidTransactionMatch(source) !== undefined;
};

export const hasAndroidJavaSourceCode = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: javaSource, index, current }) => {
    if (!/[a-zA-Z_]/.test(current)) {
      return false;
    }

    const tail = javaSource.slice(index, index + 32);
    return /^(package|import|class|interface|enum|record)\b/.test(tail);
  });
};

export const hasAndroidAsyncTaskUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: androidSource, index, current }) => {
    if (current !== 'A') {
      return false;
    }

    return hasIdentifierAt(androidSource, index, 'AsyncTask');
  });
};

export const hasAndroidFindViewByIdUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: androidSource, index, current }) => {
    if (current !== 'f') {
      return false;
    }

    return hasIdentifierAt(androidSource, index, 'findViewById');
  });
};

export const hasAndroidRxJavaUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: androidSource, index, current }) => {
    if (current === 'i' && androidSource.startsWith('io.reactivex', index)) {
      return true;
    }

    if (current === 'r' && androidSource.startsWith('rx.', index)) {
      return true;
    }

    const rxJavaIdentifiers = [
      'Observable',
      'Flowable',
      'Single',
      'Maybe',
      'Completable',
      'Disposable',
      'CompositeDisposable',
      'Subject',
      'PublishSubject',
      'BehaviorSubject',
      'ReplaySubject',
      'ConnectableObservable',
    ];

    return rxJavaIdentifiers.some((identifier) => {
      return current === identifier[0] && hasIdentifierAt(androidSource, index, identifier);
    });
  });
};

export const hasAndroidDispatcherUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: androidSource, index, current }) => {
    if (current !== 'D' || !hasIdentifierAt(androidSource, index, 'Dispatchers')) {
      return false;
    }

    const start = index + 'Dispatchers'.length;
    const tail = androidSource.slice(start, start + 32);
    return /^\s*\.(Main|IO|Default)\b/.test(tail);
  });
};

export const hasAndroidWithContextUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: androidSource, index, current }) => {
    if (current !== 'w' || !hasIdentifierAt(androidSource, index, 'withContext')) {
      return false;
    }

    const start = index + 'withContext'.length;
    const tail = androidSource.slice(start, start + 48);
    return /^\s*(<[^>\n]+>\s*)?\(/.test(tail);
  });
};

export const hasAndroidCoroutineTryCatchUsage = (source: string): boolean => {
  const hasCoroutineContextHint = scanCodeLikeSource(source, ({ source: androidSource, index, current }) => {
    if (current === 'w' && hasIdentifierAt(androidSource, index, 'withContext')) {
      return true;
    }

    if (current === 'D' && hasIdentifierAt(androidSource, index, 'Dispatchers')) {
      return true;
    }

    if (current === 'v' && hasIdentifierAt(androidSource, index, 'viewModelScope')) {
      return true;
    }

    if (current === 'l' && hasIdentifierAt(androidSource, index, 'lifecycleScope')) {
      return true;
    }

    if (current === 'c' && hasIdentifierAt(androidSource, index, 'coroutineScope')) {
      return true;
    }

    if (current === 's' && hasIdentifierAt(androidSource, index, 'supervisorScope')) {
      return true;
    }

    if (current === 'l' && hasIdentifierAt(androidSource, index, 'launch')) {
      return true;
    }

    if (current === 'a' && hasIdentifierAt(androidSource, index, 'async')) {
      return true;
    }

    if (current === 's' && hasIdentifierAt(androidSource, index, 'suspend')) {
      const tail = androidSource.slice(index + 'suspend'.length, index + 'suspend'.length + 16);
      return /^\s+fun\b/.test(tail);
    }

    return false;
  });

  if (!hasCoroutineContextHint) {
    return false;
  }

  return scanCodeLikeSource(source, ({ source: androidSource, index, current }) => {
    if (current !== 't' || !hasIdentifierAt(androidSource, index, 'try')) {
      return false;
    }

    const tail = androidSource.slice(index + 'try'.length, index + 'try'.length + 192);
    return /\bcatch\b/.test(tail);
  });
};

export const findAndroidSupervisorScopeMatch = (
  source: string
): KotlinAndroidSupervisorScopeMatch | undefined => {
  const lines = source.split(/\r?\n/);
  const scopeLines = collectKotlinRegexLines(source, /\bsupervisorScope\b/).filter((lineNumber) => {
    const sanitizedLine = stripKotlinLineForSemanticScan(lines[lineNumber - 1] ?? '');
    return /\bsupervisorScope\b\s*(?:<[^>\n]+>\s*)?\{/.test(sanitizedLine);
  });

  if (scopeLines.length === 0) {
    return undefined;
  }

  const relatedNodes: KotlinSemanticNodeMatch[] = [];
  const childCoroutineLines = collectKotlinRegexLines(source, /\b(?:launch|async)\b/).filter(
    (lineNumber) => lineNumber > scopeLines[0] && lineNumber <= scopeLines[scopeLines.length - 1] + 12
  );

  if (childCoroutineLines.length > 0) {
    relatedNodes.push({
      kind: 'call',
      name: 'launch/async',
      lines: childCoroutineLines,
    });
  }

  return {
    primary_node: {
      kind: 'member',
      name: 'supervisorScope',
      lines: scopeLines,
    },
    related_nodes: relatedNodes,
    why:
      'supervisorScope crea un ámbito supervisor donde el fallo de un job no cancela a los jobs hermanos.',
    impact:
      'La coordinación concurrente mantiene aislada la propagación de errores y evita que una tarea secundaria tumbe el trabajo paralelo.',
    expected_fix:
      'Usa supervisorScope cuando varios jobs deban progresar de forma independiente y reserva try/catch para el manejo explícito del error de cada rama.',
    lines: sortedUniqueLines([
      ...scopeLines,
      ...relatedNodes.flatMap((node) => [...node.lines]),
    ]),
  };
};

export const hasAndroidSupervisorScopeUsage = (source: string): boolean => {
  return findAndroidSupervisorScopeMatch(source) !== undefined;
};

const hasAndroidCallbackAsyncCallInLine = (line: string): boolean => {
  return /\b(?:enqueue|addOnSuccessListener|addOnFailureListener|addOnCompleteListener|addOnCanceledListener|setCallback|setCompletionListener)\s*(?:\(|\{)/.test(
    line
  );
};

export const findAndroidCoroutineCallbackMatch = (
  source: string
): KotlinAndroidCallbackAsyncMatch | undefined => {
  const lines = source.split(/\r?\n/);
  const relatedNodes: KotlinSemanticNodeMatch[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const sanitizedLine = stripKotlinLineForSemanticScan(lines[index] ?? '');
    if (sanitizedLine.trimStart().startsWith('import ')) {
      continue;
    }
    if (!hasAndroidCallbackAsyncCallInLine(sanitizedLine)) {
      continue;
    }

    const callMatch =
      sanitizedLine.match(/\b(enqueue|addOnSuccessListener|addOnFailureListener|addOnCompleteListener|addOnCanceledListener|setCallback|setCompletionListener)\s*(?:\(|\{)/) ??
      sanitizedLine.match(/\b(enqueue|addOnSuccessListener|addOnFailureListener|addOnCompleteListener|addOnCanceledListener|setCallback|setCompletionListener)\b/);
    const callName = callMatch?.[1] ?? 'callback async API';
    relatedNodes.push({
      kind: 'call',
      name: callName,
      lines: [index + 1],
    });
  }

  const [primaryNode, ...restNodes] = relatedNodes;
  if (!primaryNode) {
    return undefined;
  }

  return {
    primary_node: primaryNode,
    related_nodes: restNodes,
    why:
      `${primaryNode.name} sigue un patrón callback-based para trabajo asíncrono en Android en lugar de ` +
      'usar coroutines/Flow con un flujo lineal de control.',
    impact:
      'El flujo asíncrono queda dividido en callbacks dispersos, aumenta la complejidad de manejo de errores y hace más difícil razonar sobre cancelación y composición.',
    expected_fix:
      'Reemplaza callbacks por suspend functions, coroutines o Flow y encapsula la coordinación asíncrona detrás de APIs lineales y testeables.',
    lines: sortedUniqueLines(relatedNodes.flatMap((node) => [...node.lines])),
  };
};

export const hasAndroidCoroutineCallbackUsage = (source: string): boolean => {
  return findAndroidCoroutineCallbackMatch(source) !== undefined;
};

const isAndroidDebugLogGuardWindow = (lines: readonly string[], lineIndex: number): boolean => {
  const guardPattern = /\bif\s*\(\s*BuildConfig\.DEBUG\s*\)/;
  const windowStart = Math.max(0, lineIndex - 2);
  const window = lines
    .slice(windowStart, lineIndex + 1)
    .map((line) => stripKotlinLineForSemanticScan(line ?? ''))
    .join(' ');
  return guardPattern.test(window);
};

const hasAndroidLogCallInLine = (line: string): boolean => {
  return /\bLog\s*\.\s*(?:v|d|i|w|e)\s*\(/.test(line);
};

const hasAndroidTimberCallInLine = (line: string): boolean => {
  return /\bTimber\s*\.\s*(?:v|d|i|w|e)\s*\(/.test(line);
};

export const hasAndroidNoConsoleLogUsage = (source: string): boolean => {
  const lines = source.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const sanitizedLine = stripKotlinLineForSemanticScan(lines[index] ?? '');
    if (sanitizedLine.trimStart().startsWith('import ')) {
      continue;
    }
    if (!hasAndroidLogCallInLine(sanitizedLine)) {
      continue;
    }
    if (isAndroidDebugLogGuardWindow(lines, index)) {
      continue;
    }
    return true;
  }

  return false;
};

export const hasAndroidTimberUsage = (source: string): boolean => {
  const lines = source.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const sanitizedLine = stripKotlinLineForSemanticScan(lines[index] ?? '');
    if (sanitizedLine.trimStart().startsWith('import ')) {
      continue;
    }
    if (!hasAndroidTimberCallInLine(sanitizedLine)) {
      continue;
    }
    if (isAndroidDebugLogGuardWindow(lines, index)) {
      continue;
    }
    return true;
  }

  return false;
};

export const hasAndroidBuildConfigConstantUsage = (source: string): boolean => {
  const lines = source.split(/\r?\n/);
  const buildConfigPattern = /\bBuildConfig\s*\.\s*(?!DEBUG\b)[A-Z_][A-Z0-9_]*/;

  for (const line of lines) {
    const sanitizedLine = stripKotlinLineForSemanticScan(line);
    if (sanitizedLine.trimStart().startsWith('import ')) {
      continue;
    }
    if (buildConfigPattern.test(sanitizedLine)) {
      return true;
    }
  }

  return false;
};

export const hasAndroidHardcodedStringUsage = (source: string): boolean => {
  let inLineComment = false;
  let inBlockComment = 0;
  let inString = false;
  let inMultilineString = false;
  let stringStartIndex = -1;
  let lastNonWhitespace = '';

  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1];
    const nextTwo = source[index + 2];

    if (inLineComment) {
      if (current === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment > 0) {
      if (current === '/' && next === '*') {
        inBlockComment += 1;
        index += 1;
        continue;
      }
      if (current === '*' && next === '/') {
        inBlockComment -= 1;
        index += 1;
        continue;
      }
      continue;
    }

    if (inMultilineString) {
      if (current === '"' && next === '"' && nextTwo === '"') {
        return true;
      }
      continue;
    }

    if (inString) {
      if (current === '\\') {
        index += 1;
        continue;
      }
      if (current === '"') {
        const previousChar = lastNonWhitespace;
        const isInterpolationOrResource = previousChar === '.' || previousChar === ')';
        if (!isInterpolationOrResource) {
          return true;
        }
        inString = false;
        stringStartIndex = -1;
      }
      continue;
    }

    if (current === '/' && next === '/') {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (current === '/' && next === '*') {
      inBlockComment = 1;
      index += 1;
      continue;
    }

    if (current === '"' && next === '"' && nextTwo === '"') {
      inMultilineString = true;
      stringStartIndex = index;
      return true;
    }

    if (current === '"') {
      const tail = source.slice(Math.max(0, index - 24), index + 1);
      if (/\bR\.(?:string|plurals|array)\s*\.\s*[A-Za-z_]/.test(tail)) {
        inString = false;
        stringStartIndex = -1;
        continue;
      }
      inString = true;
      stringStartIndex = index;
    }

    if (!/\s/.test(current)) {
      lastNonWhitespace = current;
    }
  }

  return false;
};

const hasAndroidSingletonModuleAnnotation = (window: string): boolean => {
  return /@(Module|InstallIn|EntryPoint)\b/.test(window);
};

const hasAndroidSingletonCompanionPattern = (block: string): boolean => {
  return (
    /\b(?:getInstance|INSTANCE|instance)\b/.test(block) ||
    /@Volatile\b/.test(block) ||
    /\bprivate\s+(?:val|var)\s+(?:INSTANCE|instance)\b/.test(block)
  );
};

const hasAndroidAnnotationUsage = (source: string, annotation: string): boolean => {
  return scanCodeLikeSource(source, ({ source: androidSource, index, current }) => {
    if (current !== '@') {
      return false;
    }

    return androidSource.startsWith(annotation, index + 1);
  });
};

const hasAndroidHiltDependencyLine = (source: string): boolean => {
  return /(?:com\.google\.dagger:hilt-android|com\.google\.dagger\.hilt\.android|dagger\.hilt\.android\.plugin)\b/.test(
    source
  );
};

export const hasAndroidHiltFrameworkUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: androidSource, index, current }) => {
    if (current === '@') {
      return (
        androidSource.startsWith('HiltAndroidApp', index + 1) ||
        androidSource.startsWith('AndroidEntryPoint', index + 1) ||
        androidSource.startsWith('HiltViewModel', index + 1) ||
        androidSource.startsWith('Module', index + 1) ||
        androidSource.startsWith('InstallIn', index + 1) ||
        androidSource.startsWith('ViewModelScoped', index + 1)
      );
    }

    if (current === 'j' && androidSource.startsWith('javax.inject.Inject', index)) {
      return true;
    }

    return current === 'd' && androidSource.startsWith('dagger.hilt', index);
  });
};

export const hasAndroidHiltDependencyUsage = (source: string): boolean => {
  return source.split(/\r?\n/).some((line) => {
    const sanitizedLine = (line ?? '').replace(/\/\/.*$/, '').replace(/#.*$/, '').trim();
    return hasAndroidHiltDependencyLine(sanitizedLine);
  });
};

const hasAndroidWorkManagerDependencyLine = (line: string): boolean => {
  return /(?:androidx\.work:work-runtime-ktx\b|androidx\.work:work-runtime\b|work-runtime-ktx\b)/.test(
    line
  );
};

export const findAndroidWorkManagerDependencyMatch = (
  source: string
): KotlinAndroidWorkManagerDependencyMatch | undefined => {
  const lines = source.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const sanitizedLine = (lines[index] ?? '').replace(/\/\/.*$/, '').replace(/#.*$/, '').trim();
    if (!hasAndroidWorkManagerDependencyLine(sanitizedLine)) {
      continue;
    }

    return {
      primary_node: {
        kind: 'member',
        name: 'WorkManager dependency',
        lines: [index + 1],
      },
      related_nodes: [
        {
          kind: 'member',
          name: 'androidx.work:work-runtime-ktx',
          lines: [index + 1],
        },
      ],
      why:
        'El build declara WorkManager como dependencia Jetpack para programar tareas diferidas y persistentes en Android.',
      impact:
        'La app puede orquestar trabajo en background con una API soportada en lugar de depender de jobs o callbacks manuales.',
      expected_fix:
        'Mantén androidx.work:work-runtime-ktx en el catálogo o build script para expresar el contrato de WorkManager de forma explícita.',
      lines: [index + 1],
    };
  }

  return undefined;
};

export const hasAndroidWorkManagerDependencyUsage = (source: string): boolean => {
  return findAndroidWorkManagerDependencyMatch(source) !== undefined;
};

export const findAndroidVersionCatalogMatch = (
  source: string
): KotlinAndroidVersionCatalogMatch | undefined => {
  const lines = source.split(/\r?\n/);
  const relatedNodes: KotlinSemanticNodeMatch[] = [];
  let currentSection = '';
  let versionSectionLine = 0;
  let librariesSectionLine = 0;
  let versionAliasLine = 0;
  let libraryAliasLine = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const sanitizedLine = stripTomlLineForSemanticScan(lines[index] ?? '').trim();
    if (sanitizedLine.length === 0) {
      continue;
    }

    const sectionMatch = sanitizedLine.match(/^\[([A-Za-z0-9_.-]+)\]$/);
    if (sectionMatch?.[1]) {
      currentSection = sectionMatch[1].trim().toLowerCase();
      if (currentSection === 'versions' && versionSectionLine === 0) {
        versionSectionLine = index + 1;
        relatedNodes.push({
          kind: 'member',
          name: 'versions section',
          lines: [versionSectionLine],
        });
      }
      if (currentSection === 'libraries' && librariesSectionLine === 0) {
        librariesSectionLine = index + 1;
        relatedNodes.push({
          kind: 'member',
          name: 'libraries section',
          lines: [librariesSectionLine],
        });
      }
      continue;
    }

    if (currentSection === 'versions') {
      const versionMatch = sanitizedLine.match(/^([A-Za-z0-9_.-]+)\s*=\s*.+$/);
      if (versionMatch?.[1]) {
        versionAliasLine = versionAliasLine || index + 1;
        relatedNodes.push({
          kind: 'member',
          name: `version alias: ${versionMatch[1]}`,
          lines: [index + 1],
        });
      }
      continue;
    }

    if (currentSection !== 'libraries') {
      continue;
    }

    const inlineLibraryMatch = sanitizedLine.match(/^([A-Za-z0-9_.-]+)\s*=\s*\{(.+)\}$/);
    if (inlineLibraryMatch?.[1]) {
      const inlineBody = inlineLibraryMatch[2] ?? '';
      if (/\b(?:module|group)\s*=/.test(inlineBody) && /\bversion(?:\.ref)?\s*=/.test(inlineBody)) {
        libraryAliasLine = libraryAliasLine || index + 1;
        relatedNodes.push({
          kind: 'member',
          name: `library alias: ${inlineLibraryMatch[1]}`,
          lines: [index + 1],
        });
      }
      continue;
    }

    if (
      /^(?:[A-Za-z0-9_.-]+)\s*=\s*\{$/.test(sanitizedLine) ||
      /^\s*(?:[A-Za-z0-9_.-]+)\s*=\s*\{$/.test(sanitizedLine)
    ) {
      const aliasName = sanitizedLine.match(/^([A-Za-z0-9_.-]+)\s*=\s*\{$/)?.[1];
      if (aliasName) {
        const blockLines = [index + 1];
        let braceDepth = 1;
        let hasModuleOrGroup = false;
        let hasVersionReference = false;
        for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
          const candidateLine = stripTomlLineForSemanticScan(lines[cursor] ?? '').trim();
          blockLines.push(cursor + 1);
          braceDepth += (candidateLine.match(/\{/g) ?? []).length;
          braceDepth -= (candidateLine.match(/\}/g) ?? []).length;
          if (/^(?:module|group)\s*=/.test(candidateLine)) {
            hasModuleOrGroup = true;
          }
          if (/^version(?:\.ref)?\s*=/.test(candidateLine)) {
            hasVersionReference = true;
          }
          if (braceDepth <= 0) {
            if (hasModuleOrGroup && hasVersionReference) {
              libraryAliasLine = libraryAliasLine || index + 1;
              relatedNodes.push({
                kind: 'member',
                name: `library alias: ${aliasName}`,
                lines: [index + 1],
              });
              relatedNodes.push({
                kind: 'member',
                name: 'library block',
                lines: blockLines,
              });
            }
            break;
          }
        }
      }
    }
  }

  if (versionSectionLine === 0 || librariesSectionLine === 0 || versionAliasLine === 0) {
    return undefined;
  }

  if (libraryAliasLine === 0) {
    return undefined;
  }

  return {
    primary_node: {
      kind: 'member',
      name: 'libs.versions.toml',
      lines: [versionSectionLine],
    },
    related_nodes: relatedNodes,
    why:
      'libs.versions.toml centraliza versiones y aliases de dependencias Android en un catálogo tipado en lugar de dispersarlos por build scripts.',
    impact:
      'Las versiones y aliases quedan centralizados, más fáciles de revisar y consumibles desde Gradle mediante accessors consistentes.',
    expected_fix:
      'Mantén versiones, bibliotecas y plugins en libs.versions.toml y consume las dependencias desde los accessors del catálogo.',
    lines: sortedUniqueLines([
      versionSectionLine,
      librariesSectionLine,
      versionAliasLine,
      libraryAliasLine,
      ...relatedNodes.flatMap((node) => [...node.lines]),
    ]),
  };
};

export const hasAndroidVersionCatalogUsage = (source: string): boolean => {
  return findAndroidVersionCatalogMatch(source) !== undefined;
};

export const findAndroidInstrumentedTestMatch = (
  source: string
): KotlinAndroidInstrumentedTestMatch | undefined => {
  const markerLines = collectAndroidTestMarkerLines(source);
  if (markerLines.length === 0) {
    return undefined;
  }

  return {
    primary_node: {
      kind: 'member',
      name: 'androidTest/',
      lines: [markerLines[0]],
    },
    related_nodes: markerLines.map((line) => ({
      kind: 'member',
      name: 'androidTest marker',
      lines: [line],
    })),
    why:
      'androidTest agrupa pruebas instrumentadas Android que deben ejecutarse en dispositivo o emulador con soporte del framework Android.',
    impact:
      'Las pruebas instrumentadas quedan aisladas de los unit tests JVM y pueden validar UI, ActivityScenario y APIs Android reales.',
    expected_fix:
      'Mantén las pruebas instrumentadas en androidTest con AndroidJUnit4, ActivityScenario, Espresso o Compose testing sobre dispositivo o emulador.',
    lines: markerLines,
  };
};

export const hasAndroidInstrumentedTestUsage = (source: string): boolean => {
  return findAndroidInstrumentedTestMatch(source) !== undefined;
};

export const findAndroidAaaPatternMatch = (
  source: string
): KotlinAndroidTestStructureMatch | undefined => {
  return buildAndroidTestStructureMatch({
    source,
    markerPatterns: [
      /^\s*(?:\/\/|\/\*|\*)?\s*Arrange\b/i,
      /^\s*(?:\/\/|\/\*|\*)?\s*Act\b/i,
      /^\s*(?:\/\/|\/\*|\*)?\s*Assert\b/i,
    ],
    relatedLabel: 'AAA marker',
    why:
      'La estructura AAA mantiene cada test Kotlin dividido en Arrange, Act y Assert para que el escenario sea fácil de leer y revisar.',
    impact:
      'Las pruebas ganan intención explícita, menos ambigüedad y una separación clara entre preparación, acción y verificación.',
    expectedFix:
      'Mantén los tests de Android con bloques Arrange, Act y Assert bien separados y evita mezclar preparación, acción y aserciones en una sola masa de código.',
  });
};

export const hasAndroidAaaPatternUsage = (source: string): boolean => {
  return findAndroidAaaPatternMatch(source) !== undefined;
};

export const findAndroidGivenWhenThenMatch = (
  source: string
): KotlinAndroidTestStructureMatch | undefined => {
  return buildAndroidTestStructureMatch({
    source,
    markerPatterns: [
      /^\s*(?:\/\/|\/\*|\*)?\s*Given\b/i,
      /^\s*(?:\/\/|\/\*|\*)?\s*When\b/i,
      /^\s*(?:\/\/|\/\*|\*)?\s*Then\b/i,
    ],
    relatedLabel: 'BDD marker',
    why:
      'La estructura Given-When-Then mantiene cada test Kotlin expresado como una historia de comportamiento legible para quien revisa la suite.',
    impact:
      'Los escenarios de prueba quedan más cercanos al lenguaje de producto y más fáciles de mantener cuando cambia el comportamiento.',
    expectedFix:
      'Mantén los tests de Android escritos con Given, When y Then bien separados para que cada escenario se lea como una especificación de comportamiento.',
  });
};

export const hasAndroidGivenWhenThenUsage = (source: string): boolean => {
  return findAndroidGivenWhenThenMatch(source) !== undefined;
};

export const findAndroidJvmUnitTestMatch = (
  source: string
): KotlinAndroidTestStructureMatch | undefined => {
  return buildAndroidJvmUnitTestMatch(source);
};

export const hasAndroidJvmUnitTestUsage = (source: string): boolean => {
  return findAndroidJvmUnitTestMatch(source) !== undefined;
};

export const hasAndroidHiltAndroidAppUsage = (source: string): boolean => {
  return hasAndroidAnnotationUsage(source, 'HiltAndroidApp');
};

export const hasAndroidAndroidEntryPointUsage = (source: string): boolean => {
  return hasAndroidAnnotationUsage(source, 'AndroidEntryPoint');
};

export const hasAndroidInjectConstructorUsage = (source: string): boolean => {
  return source.split(/\r?\n/).some((line) => {
    const sanitizedLine = stripKotlinLineForSemanticScan(line ?? '');
    if (!/@Inject\b/.test(sanitizedLine)) {
      return false;
    }

    const tail = sanitizedLine.slice(sanitizedLine.indexOf('@Inject') + '@Inject'.length);
    return /^\s*(?:<[^>\n]+>\s*)?constructor\b/.test(tail);
  });
};

export const hasAndroidModuleInstallInUsage = (source: string): boolean => {
  return hasAndroidAnnotationUsage(source, 'Module') && hasAndroidAnnotationUsage(source, 'InstallIn');
};

export const hasAndroidBindsUsage = (source: string): boolean => {
  return hasAndroidAnnotationUsage(source, 'Binds') && hasAndroidModuleInstallInUsage(source);
};

export const hasAndroidProvidesUsage = (source: string): boolean => {
  return hasAndroidAnnotationUsage(source, 'Provides') && hasAndroidModuleInstallInUsage(source);
};

export const hasAndroidViewModelScopedUsage = (source: string): boolean => {
  return hasAndroidAnnotationUsage(source, 'ViewModelScoped');
};

export const hasAndroidSingletonUsage = (source: string): boolean => {
  const lines = source.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const sanitizedLine = stripKotlinLineForSemanticScan(lines[index] ?? '');
    if (sanitizedLine.trimStart().startsWith('import ')) {
      continue;
    }

    const namedObjectMatch = sanitizedLine.match(
      /^\s*(?:internal\s+|private\s+|public\s+)?(?:data\s+)?object\s+([A-Za-z_][A-Za-z0-9_]*)\b/
    );
    if (namedObjectMatch?.[1]) {
      const annotationWindow = lines
        .slice(Math.max(0, index - 3), index + 1)
        .map((line) => stripKotlinLineForSemanticScan(line ?? ''))
        .join(' ');
      if (!hasAndroidSingletonModuleAnnotation(annotationWindow)) {
        return true;
      }
    }

    if (!/\bcompanion\s+object\b/.test(sanitizedLine)) {
      continue;
    }

    let braceDepth =
      countTokenOccurrences(sanitizedLine, '{') - countTokenOccurrences(sanitizedLine, '}');
    const blockLines = [sanitizedLine];

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidateLine = stripKotlinLineForSemanticScan(lines[cursor] ?? '');
      blockLines.push(candidateLine);
      braceDepth += countTokenOccurrences(candidateLine, '{');
      braceDepth -= countTokenOccurrences(candidateLine, '}');
      if (braceDepth <= 0) {
        break;
      }
    }

    if (hasAndroidSingletonCompanionPattern(blockLines.join(' '))) {
      return true;
    }
  }

  return false;
};

export const findKotlinPresentationSrpMatch = (
  source: string
): KotlinPresentationSrpMatch | undefined => {
  const classPattern =
    /\b(?:internal\s+|private\s+|public\s+)?(?:sealed\s+|data\s+)?class\s+([A-Za-z0-9_]*(?:ViewModel|Presenter))\b/;
  const classLines = collectKotlinRegexLines(source, classPattern);
  if (classLines.length === 0) {
    return undefined;
  }

  const classLine = source.split(/\r?\n/)[classLines[0] - 1] ?? '';
  const className = classLine.match(classPattern)?.[1];
  if (!className) {
    return undefined;
  }

  const responsibilities: KotlinResponsibilityMatch[] = [];
  const registerNode = (
    key: string,
    kind: KotlinSemanticNodeMatch['kind'],
    name: string,
    regex: RegExp
  ): void => {
    registerKotlinResponsibility(responsibilities, key, kind, name, collectKotlinRegexLines(source, regex));
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
    /\b(?:OkHttpClient\s*\(|Retrofit\.Builder\s*\(|HttpURLConnection\b)/
  );
  registerNode(
    'persistence',
    'call',
    'local persistence',
    /\b(?:SharedPreferences\b.*\)|PreferenceDataStoreFactory\.create|preferencesDataStore|DataStore<|RoomDatabase\b)/
  );
  registerNode(
    'navigation',
    'member',
    'navigation flow',
    /\b(?:findNavController\s*\(|\.\s*navigate\s*\()/
  );

  if (!hasKotlinResponsibilityKeys(responsibilities, ['session', 'networking', 'persistence', 'navigation'])) {
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
    why: `${className} concentra session/auth flow, networking remoto, persistencia local y navegación dentro del mismo tipo de presentation Android, rompiendo SRP.`,
    impact:
      'Presentation acumula múltiples razones de cambio y queda más frágil ante cambios de sesión, transporte, almacenamiento o navegación.',
    expected_fix:
      'Deja el tipo limitado a estado observable y delegación; extrae sesión, persistencia, networking y navegación a casos de uso o coordinadores dedicados.',
    lines: allLines,
  };
};

export const findKotlinConcreteDependencyDipMatch = (
  source: string
): KotlinConcreteDependencyDipMatch | undefined => {
  const classPattern =
    /\b(?:internal\s+|private\s+|public\s+)?(?:sealed\s+|data\s+)?class\s+([A-Za-z0-9_]*(?:UseCase|Service|ViewModel|Presenter|Controller|Coordinator))\b/;
  const classLines = collectKotlinRegexLines(source, classPattern);
  if (classLines.length === 0) {
    return undefined;
  }

  const classLine = source.split(/\r?\n/)[classLines[0] - 1] ?? '';
  const className = classLine.match(classPattern)?.[1];
  if (!className) {
    return undefined;
  }

  const relatedNodes: KotlinSemanticNodeMatch[] = [];
  const registerNode = (
    kind: KotlinSemanticNodeMatch['kind'],
    name: string,
    regex: RegExp
  ): void => {
    const lines = collectKotlinRegexLines(source, regex);
    if (lines.length === 0) {
      return;
    }
    relatedNodes.push({ kind, name, lines });
  };

  registerNode(
    'property',
    'concrete dependency: SharedPreferences',
    /\b(?:private|internal|public)?\s*val\s+\w+\s*:\s*SharedPreferences\b/
  );
  registerNode(
    'property',
    'concrete dependency: OkHttpClient',
    /\b(?:private|internal|public)?\s*val\s+\w+\s*:\s*OkHttpClient\b/
  );
  registerNode(
    'property',
    'concrete dependency: Retrofit',
    /\b(?:private|internal|public)?\s*val\s+\w+\s*:\s*Retrofit\b/
  );
  registerNode(
    'property',
    'concrete dependency: DataStore',
    /\b(?:private|internal|public)?\s*val\s+\w+\s*:\s*DataStore(?:<|$)/
  );
  registerNode(
    'property',
    'concrete dependency: RoomDatabase',
    /\b(?:private|internal|public)?\s*val\s+\w+\s*:\s*\w*RoomDatabase\b/
  );
  registerNode('call', 'OkHttpClient()', /\bOkHttpClient\s*\(/);
  registerNode('call', 'Retrofit.Builder()', /\bRetrofit\.Builder\s*\(/);
  registerNode(
    'call',
    'PreferenceDataStoreFactory.create',
    /\bPreferenceDataStoreFactory\.create(?:WithPath)?\s*\(/
  );
  registerNode('call', 'Room.databaseBuilder', /\bRoom\.databaseBuilder\s*\(/);

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
    why: `${className} depende directamente de servicios concretos del framework o infraestructura en application/presentation Android, rompiendo DIP al saltarse puertos o abstracciones.`,
    impact:
      'La capa de alto nivel queda acoplada a detalles concretos de transporte o persistencia, dificulta el test aislado y aumenta el coste de sustituir infraestructura.',
    expected_fix:
      'Introduce puertos o gateways en application/domain e inyecta adaptadores concretos desde infrastructure, evitando depender directamente de clientes o stores del framework.',
    lines: allLines,
  };
};

export const findKotlinOpenClosedWhenMatch = (
  source: string
): KotlinOpenClosedOcpMatch | undefined => {
  const classPattern =
    /^\s*(?:internal\s+|private\s+|public\s+)?(?:sealed\s+|data\s+)?class\s+([A-Za-z0-9_]*(?:UseCase|Service|ViewModel|Presenter|Controller|Coordinator))\b/;
  const lines = source.split(/\r?\n/);
  const classLines = collectKotlinRegexLines(source, classPattern);
  if (classLines.length === 0) {
    return undefined;
  }

  const classLine = lines[classLines[0] - 1] ?? '';
  const className = classLine.match(classPattern)?.[1];
  if (!className) {
    return undefined;
  }

  for (let index = 0; index < lines.length; index += 1) {
    const sanitizedLine = stripKotlinLineForSemanticScan(lines[index] ?? '');
    const whenMatch = sanitizedLine.match(
      /\bwhen\s*\(\s*(?:[A-Za-z_][A-Za-z0-9_]*\s*\.\s*)*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*\{/
    );
    if (!whenMatch) {
      continue;
    }

    const discriminatorName = whenMatch[1];
    let braceDepth =
      countTokenOccurrences(sanitizedLine, '{') - countTokenOccurrences(sanitizedLine, '}');
    const branchNodes: KotlinSemanticNodeMatch[] = [];

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidateLine = stripKotlinLineForSemanticScan(lines[cursor] ?? '');
      const branchMatch = candidateLine.match(/^\s*(?!else\b)([A-Za-z0-9_.,\s]+?)\s*->/);
      if (branchMatch) {
        const branchName = normalizeKotlinWhenBranchName(branchMatch[1] ?? '');
        if (branchName.length > 0) {
          branchNodes.push({
            kind: 'member',
            name: `branch ${branchName}`,
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

    const [firstBranchNode, secondBranchNode] = branchNodes;
    if (!firstBranchNode || !secondBranchNode) {
      continue;
    }

    const relatedNodes = [
      {
        kind: 'member' as const,
        name: `discriminator switch: ${discriminatorName}`,
        lines: [index + 1],
      },
      ...branchNodes,
    ];

    const allLines = sortedUniqueLines([
      ...classLines,
      index + 1,
      ...branchNodes.flatMap((node) => [...node.lines]),
    ]);
    const branchSummary = branchNodes
      .map((node) => node.name.replace(/^branch /, ''))
      .join(', ');

    return {
      primary_node: {
        kind: 'class',
        name: className,
        lines: classLines,
      },
      related_nodes: relatedNodes,
      why:
        `${className} resuelve comportamiento con un when sobre ${discriminatorName} ` +
        `(${branchSummary}), obligando a modificar el mismo tipo para soportar un nuevo caso y rompiendo OCP.`,
      impact:
        'Cada nuevo caso exige editar la lógica existente, aumenta el riesgo de regresiones y dificulta extender el comportamiento mediante composición o polimorfismo.',
      expected_fix:
        'Extrae una estrategia, interfaz o registry de handlers por caso para añadir nuevos comportamientos sin modificar la lógica existente.',
      lines: allLines,
    };
  }

  return undefined;
};

export const findKotlinInterfaceSegregationMatch = (
  source: string
): KotlinInterfaceSegregationMatch | undefined => {
  const typePattern =
    /^\s*(?:internal\s+|private\s+|public\s+)?(?:sealed\s+|data\s+)?class\s+([A-Za-z0-9_]*(?:UseCase|ViewModel|Presenter|Controller|Coordinator|Service))\b/;
  const typeLines = collectKotlinRegexLines(source, typePattern);
  if (typeLines.length === 0) {
    return undefined;
  }

  const typeLine = source.split(/\r?\n/)[typeLines[0] - 1] ?? '';
  const typeName = typeLine.match(typePattern)?.[1];
  if (!typeName) {
    return undefined;
  }

  const interfaceDeclarations = parseKotlinInterfaceDeclarations(source);
  if (interfaceDeclarations.length === 0) {
    return undefined;
  }

  const sourceLines = source.split(/\r?\n/);

  for (const interfaceDeclaration of interfaceDeclarations) {
    const queryMembers = interfaceDeclaration.members.filter((member) =>
      isKotlinQueryMemberName(member.name)
    );
    const commandMembers = interfaceDeclaration.members.filter((member) =>
      isKotlinCommandMemberName(member.name)
    );
    if (queryMembers.length === 0 || commandMembers.length === 0) {
      continue;
    }

    const propertyPattern = new RegExp(
      `\\b(?:private|internal|public)?\\s*val\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*:\\s*${interfaceDeclaration.name}\\b`
    );
    const propertyLines = collectKotlinRegexLines(source, propertyPattern);
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
      `\\b${propertyName}\\.([A-Za-z_][A-Za-z0-9_]*)\\s*(?:\\(|\\b)`,
      'g'
    );

    sourceLines.forEach((line, index) => {
      const sanitizedLine = stripKotlinLineForSemanticScan(line);
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

    const usesQueryContract = usedMemberNames.some(isKotlinQueryMemberName);
    const usesCommandContract = usedMemberNames.some(isKotlinCommandMemberName);
    if (usesQueryContract === usesCommandContract) {
      continue;
    }

    const oppositeFamilyMembers = usesQueryContract ? commandMembers : queryMembers;
    const unusedMembers = oppositeFamilyMembers.filter((member) => !usedMembers.has(member.name));
    const firstUnusedMember = unusedMembers[0];
    if (!firstUnusedMember) {
      continue;
    }

    const usedDescriptors = Array.from(usedMembers.entries()).map(([name, lines]) => ({
      kind: 'call' as const,
      name: `used member: ${name}`,
      lines: sortedUniqueLines(lines),
    }));

    const relatedNodes: KotlinSemanticNodeMatch[] = [
      {
        kind: 'member',
        name: `fat interface: ${interfaceDeclaration.name}`,
        lines: [interfaceDeclaration.line],
      },
      ...usedDescriptors,
      ...unusedMembers.map((member) => ({
        kind: 'member' as const,
        name: `unused contract member: ${member.name}`,
        lines: [member.line],
      })),
    ];

    const usedMemberSummary = usedDescriptors.map((member) => member.name.replace('used member: ', ''));
    const unusedSummary = unusedMembers.map((member) => member.name);
    const allLines = sortedUniqueLines([
      ...typeLines,
      interfaceDeclaration.line,
      ...relatedNodes.flatMap((node) => [...node.lines]),
    ]);

    return {
      primary_node: {
        kind: 'class',
        name: typeName,
        lines: typeLines,
      },
      related_nodes: relatedNodes,
      why:
        `${typeName} depende de ${interfaceDeclaration.name}, un contrato demasiado ancho para su ` +
        `uso real del consumidor, y rompe ISP al acoplarlo a miembros que no necesita.`,
      impact:
        `El consumidor queda acoplado a cambios ajenos del contrato (${unusedSummary.join(', ')}), ` +
        'lo que eleva el coste de mantenimiento y dificulta tests y evolución independiente.',
      expected_fix:
        `Extrae interfaces pequeñas orientadas a capacidades concretas (${usedMemberSummary.join(', ')}) ` +
        'o inyecta un puerto mínimo que exponga solo los miembros realmente necesarios.',
      lines: allLines,
    };
  }

  return undefined;
};

export const findKotlinLiskovSubstitutionMatch = (
  source: string
): KotlinLiskovSubstitutionMatch | undefined => {
  const interfaceDeclarations = parseKotlinInterfaceDeclarations(source);
  if (interfaceDeclarations.length === 0) {
    return undefined;
  }

  const typeDeclarations = parseKotlinTypeDeclarations(source);

  const sourceLines = source.split(/\r?\n/);

  for (const interfaceDeclaration of interfaceDeclarations) {
    const memberNames = interfaceDeclaration.members.map((member) => member.name);
    if (memberNames.length === 0) {
      continue;
    }

    const conformingTypes = typeDeclarations.filter((typeDeclaration) =>
      typeDeclaration.conformances.includes(interfaceDeclaration.name)
    );

    for (const memberName of memberNames) {
      let safeType: KotlinTypeDeclaration | undefined;
      let unsafeType:
        | (KotlinTypeDeclaration & {
            narrowedPreconditionLine: number;
            failureLine: number;
            failureName: string;
          })
        | undefined;

      for (const typeDeclaration of conformingTypes) {
        const methodPattern = new RegExp(`\\boverride\\s+fun\\s+${memberName}\\s*\\(`);
        let methodLine = -1;

        for (
          let lineIndex = typeDeclaration.bodyStartLine - 1;
          lineIndex < typeDeclaration.bodyEndLine;
          lineIndex += 1
        ) {
          const candidateLine = stripKotlinLineForSemanticScan(sourceLines[lineIndex] ?? '');
          if (methodPattern.test(candidateLine)) {
            methodLine = lineIndex + 1;
            break;
          }
        }

        if (methodLine < 0) {
          continue;
        }

        let methodBraceDepth =
          countTokenOccurrences(stripKotlinLineForSemanticScan(sourceLines[methodLine - 1] ?? ''), '{')
          - countTokenOccurrences(stripKotlinLineForSemanticScan(sourceLines[methodLine - 1] ?? ''), '}');
        let narrowedPreconditionLine: number | undefined;
        let failureLine: number | undefined;
        let failureName: string | undefined;

        for (
          let lineIndex = methodLine;
          lineIndex < typeDeclaration.bodyEndLine && methodBraceDepth > 0;
          lineIndex += 1
        ) {
          const candidateLine = stripKotlinLineForSemanticScan(sourceLines[lineIndex] ?? '');
          if (
            narrowedPreconditionLine === undefined &&
            /\b(?:require|check)\s*\(/.test(candidateLine)
          ) {
            narrowedPreconditionLine = lineIndex + 1;
          }
          if (failureLine === undefined) {
            const failureMatch = candidateLine.match(
              /\b(error|TODO)\s*\(|\bthrow\s+(UnsupportedOperationException|NotImplementedError|IllegalStateException)\b/
            );
            if (failureMatch) {
              failureLine = lineIndex + 1;
              failureName = failureMatch[1] ?? failureMatch[2] ?? 'throw';
            }
          }
          methodBraceDepth += countTokenOccurrences(candidateLine, '{');
          methodBraceDepth -= countTokenOccurrences(candidateLine, '}');
        }

        if (
          narrowedPreconditionLine !== undefined &&
          failureLine !== undefined &&
          failureName !== undefined
        ) {
          unsafeType = {
            ...typeDeclaration,
            narrowedPreconditionLine,
            failureLine,
            failureName,
          };
        } else if (!safeType) {
          safeType = typeDeclaration;
        }
      }

      if (!safeType || !unsafeType) {
        continue;
      }

      const allLines = sortedUniqueLines([
        interfaceDeclaration.line,
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
            name: `base contract: ${interfaceDeclaration.name}`,
            lines: [interfaceDeclaration.line],
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
            name: unsafeType.failureName,
            lines: [unsafeType.failureLine],
          },
        ],
        why:
          `${unsafeType.name} endurece la precondición de ${memberName} y añade una ruta no segura ` +
          `frente al contrato ${interfaceDeclaration.name}, rompiendo LSP porque deja de ser sustituible por el subtipo base.`,
        impact:
          'Los consumidores del contrato base pueden romperse en runtime, introducir ramas especiales o sufrir regresiones cuando reciben el subtipo inseguro.',
        expected_fix:
          'Haz que el subtipo respete el contrato base sin endurecer precondiciones ni rutas no soportadas, o separa el comportamiento incompatible en otra estrategia o abstracción.',
        lines: allLines,
      };
    }
  }

  const daoAnnotationIndex = sourceLines.findIndex((line) =>
    /@Dao\b/.test(stripKotlinLineForSemanticScan(line ?? ''))
  );
  if (daoAnnotationIndex >= 0) {
    let declarationLine = -1;
    let declarationName = '';
    for (let cursor = daoAnnotationIndex + 1; cursor < Math.min(sourceLines.length, daoAnnotationIndex + 6); cursor += 1) {
      const candidateLine = stripKotlinLineForSemanticScan(sourceLines[cursor] ?? '');
      const declarationMatch = candidateLine.match(
        /^\s*(?:abstract\s+)?(?:interface|class)\s+([A-Za-z_][A-Za-z0-9_]*)\b/
      );
      if (!declarationMatch?.[1]) {
        continue;
      }
      declarationLine = cursor + 1;
      declarationName = declarationMatch[1];
      break;
    }

    if (declarationLine >= 0 && declarationName.length > 0) {
      const suspendFunctionLines = sourceLines
        .map((line, index) => ({ line, index }))
        .filter(({ index }) => index + 1 > declarationLine)
        .filter(({ line }) =>
          /\bsuspend\s+fun\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/.test(
            stripKotlinLineForSemanticScan(line ?? '')
          )
        )
        .map(({ index, line }) => ({
          lineNumber: index + 1,
          name:
            stripKotlinLineForSemanticScan(line ?? '')
              .match(/\bsuspend\s+fun\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/)?.[1] ?? '',
        }))
        .filter((entry) => entry.name.length > 0);

      if (suspendFunctionLines.length > 0) {
        return {
          primary_node: {
            kind: 'class',
            name: declarationName,
            lines: [declarationLine],
          },
          related_nodes: [
            {
              kind: 'member',
              name: '@Dao',
              lines: [daoAnnotationIndex + 1],
            },
            ...suspendFunctionLines.map((entry) => ({
              kind: 'member' as const,
              name: `suspend fun ${entry.name}`,
              lines: [entry.lineNumber],
            })),
          ],
          why: `${declarationName} concentra consultas y mutaciones de Room con suspend functions en la capa DAO en lugar de delegar a APIs lineales o contratos asíncronos más explícitos.`,
          impact:
            'La capa de persistencia expone un contrato de acceso a datos asincrónico que resulta más fácil de componer desde coroutines y más claro de testear.',
          expected_fix:
            'Mantén los métodos del DAO como suspend functions y deja la coordinación de flujo en repositorios o casos de uso.',
          lines: sortedUniqueLines([
            daoAnnotationIndex + 1,
            declarationLine,
            ...suspendFunctionLines.flatMap((entry) => [entry.lineNumber]),
          ]),
        };
      }
    }
  }

  return undefined;
};
