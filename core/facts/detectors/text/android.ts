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

type KotlinInterfaceMemberDeclaration = {
  name: string;
  line: number;
};

type KotlinInterfaceDeclaration = {
  name: string;
  line: number;
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
      if (braceDepth <= 0) {
        break;
      }
    }

    declarations.push({
      name: interfaceName,
      line: index + 1,
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
  if (typeDeclarations.length < 2) {
    return undefined;
  }

  const sourceLines = source.split(/\r?\n/);

  for (const interfaceDeclaration of interfaceDeclarations) {
    const memberNames = interfaceDeclaration.members.map((member) => member.name);
    if (memberNames.length === 0) {
      continue;
    }

    const conformingTypes = typeDeclarations.filter((typeDeclaration) =>
      typeDeclaration.conformances.includes(interfaceDeclaration.name)
    );
    if (conformingTypes.length < 2) {
      continue;
    }

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

  return undefined;
};
