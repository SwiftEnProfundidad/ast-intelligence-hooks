import { collectNodeLineMatches, hasNode, isObject } from '../utils/astHelpers';

const commandNamePattern =
  /^(create|update|delete|remove|save|insert|upsert|set|write|patch|post|put)/i;
const queryNamePattern = /^(get|find|list|fetch|read|query|search|count|exists|load)/i;
const solidDiscriminatorPattern = /^(type|kind|status|role|action|event)$/i;
const notImplementedPattern =
  /(not\s+implemented|unsupported|must\s+be\s+implemented|abstract)/i;
const frameworkDependencyPattern =
  /^(@nestjs\/|@prisma\/client$|typeorm$|mongoose$|sequelize$|knex$|axios$|express$|fastify$|@apollo\/client$)/;
const concreteDependencyNames = new Set<string>([
  'PrismaClient',
  'DataSource',
  'MongoClient',
  'Sequelize',
  'Knex',
  'NestFactory',
  'MikroORM',
  'ApolloClient',
  'Axios',
]);
const networkCallCalleePattern = /^(fetch|axios|get|post|put|patch|delete|request)$/i;
type AstNode = Record<string, string | number | boolean | bigint | symbol | null | Date | object>;
type TypeScriptSemanticNode = {
  kind: 'class' | 'property' | 'call' | 'member';
  name: string;
  lines?: readonly number[];
};

export type TypeScriptSolidSrpClassMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptSolidDipMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptSolidOcpMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptSolidIspMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptSolidLspMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptCallbackHellMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptMagicNumberMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptHardcodedValueMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptConsoleLogMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptSensitiveLogMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptErrorLoggingMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptCorrelationIdsMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptCorsConfiguredMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptValidationPipeGlobalMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptValidationConfigMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptApiVersioningMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptInputValidationMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptNestedValidationMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptDtoDecoratorMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptDtoBoundaryMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptSeparatedDtoMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptTransactionMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptPrometheusMetricsMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptPasswordHashingMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptRateLimitingThrottlerMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptWinstonStructuredLoggerMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptExplicitAnyMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptCleanArchitectureMatch = TypeScriptSolidDipMatch;

export type TypeScriptProductionMockMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptExceptionFilterMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptGuardMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptInterceptorMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptEmptyCatchMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptEnvDefaultFallbackMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

export type TypeScriptLargeClassMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

type AstNodeWithAncestors = {
  node: AstNode;
  ancestors: readonly AstNode[];
};

const toPositiveLine = (node: AstNode): number | null => {
  const loc = node.loc;
  if (!isObject(loc)) {
    return null;
  }
  const start = loc.start;
  if (!isObject(start) || typeof start.line !== 'number' || !Number.isFinite(start.line)) {
    return null;
  }
  const line = Math.trunc(start.line);
  return line > 0 ? line : null;
};

const sortedUniqueLines = (lines: ReadonlyArray<number>): readonly number[] => {
  return Array.from(
    new Set(lines.filter((line) => Number.isFinite(line)).map((line) => Math.trunc(line)))
  )
    .filter((line) => line > 0)
    .sort((left, right) => left - right);
};

const containsNode = (root: unknown, target: AstNode): boolean => {
  if (!isObject(root)) {
    return false;
  }
  if (root === target) {
    return true;
  }
  for (const child of Object.values(root)) {
    if (Array.isArray(child)) {
      for (const entry of child) {
        if (containsNode(entry, target)) {
          return true;
        }
      }
      continue;
    }
    if (containsNode(child, target)) {
      return true;
    }
  }
  return false;
};

const collectLineMatchesWithAncestors = (
  node: unknown,
  predicate: (value: AstNode, ancestors: ReadonlyArray<AstNode>) => boolean,
  options?: { max?: number }
): readonly number[] => {
  const max = Math.max(1, Math.trunc(options?.max ?? 8));
  const matches: number[] = [];

  const walk = (value: unknown, ancestors: ReadonlyArray<AstNode>): void => {
    if (!isObject(value) || matches.length >= max) {
      return;
    }

    if (predicate(value, ancestors)) {
      const line = toPositiveLine(value);
      if (typeof line === 'number') {
        matches.push(line);
      }
    }

    const nextAncestors = [...ancestors, value];
    for (const child of Object.values(value)) {
      if (matches.length >= max) {
        return;
      }
      if (Array.isArray(child)) {
        for (const entry of child) {
          if (matches.length >= max) {
            return;
          }
          walk(entry, nextAncestors);
        }
        continue;
      }
      walk(child, nextAncestors);
    }
  };

  walk(node, []);
  return sortedUniqueLines(matches);
};

const hasNodeWithAncestors = (
  node: unknown,
  predicate: (value: AstNode, ancestors: ReadonlyArray<AstNode>) => boolean
): boolean => {
  let matched = false;

  const walk = (value: unknown, ancestors: ReadonlyArray<AstNode>): void => {
    if (!isObject(value) || matched) {
      return;
    }

    if (predicate(value, ancestors)) {
      matched = true;
      return;
    }

    const nextAncestors = [...ancestors, value];
    for (const child of Object.values(value)) {
      if (matched) {
        return;
      }
      if (Array.isArray(child)) {
        for (const entry of child) {
          if (matched) {
            return;
          }
          walk(entry, nextAncestors);
        }
        continue;
      }
      walk(child, nextAncestors);
    }
  };

  walk(node, []);
  return matched;
};

const methodNameFromNode = (node: unknown) => {
  if (!isObject(node)) {
    return undefined;
  }

  if (node.type === 'Identifier') {
    return typeof node.name === 'string' ? node.name : undefined;
  }

  if (node.type === 'StringLiteral') {
    return typeof node.value === 'string' ? node.value : undefined;
  }

  if (node.type === 'PrivateName') {
    const idNode = node.id;
    if (isObject(idNode) && idNode.type === 'Identifier' && typeof idNode.name === 'string') {
      return idNode.name;
    }
  }

  return undefined;
};

const memberExpressionPropertyName = (node: unknown) => {
  if (!isObject(node) || node.type !== 'MemberExpression') {
    return undefined;
  }
  return methodNameFromNode(node.property);
};

const findFirstNode = (
  node: unknown,
  predicate: (value: AstNode) => boolean
): AstNode | undefined => {
  let matched: AstNode | undefined;

  const walk = (value: unknown): void => {
    if (!isObject(value) || matched) {
      return;
    }

    if (predicate(value)) {
      matched = value;
      return;
    }

    for (const child of Object.values(value)) {
      if (matched) {
        return;
      }
      if (Array.isArray(child)) {
        for (const entry of child) {
          if (matched) {
            return;
          }
          walk(entry);
        }
        continue;
      }
      walk(child);
    }
  };

  walk(node);
  return matched;
};

const findFirstNodeWithAncestors = (
  node: unknown,
  predicate: (value: AstNode, ancestors: ReadonlyArray<AstNode>) => boolean
): AstNodeWithAncestors | undefined => {
  let matched: AstNodeWithAncestors | undefined;

  const walk = (value: unknown, ancestors: ReadonlyArray<AstNode>): void => {
    if (!isObject(value) || matched) {
      return;
    }

    if (predicate(value, ancestors)) {
      matched = {
        node: value,
        ancestors,
      };
      return;
    }

    const nextAncestors = [...ancestors, value];
    for (const child of Object.values(value)) {
      if (matched) {
        return;
      }
      if (Array.isArray(child)) {
        for (const entry of child) {
          if (matched) {
            return;
          }
          walk(entry, nextAncestors);
        }
        continue;
      }
      walk(child, nextAncestors);
    }
  };

  walk(node, []);
  return matched;
};

const literalTextFromNode = (node: unknown) => {
  if (!isObject(node)) {
    return undefined;
  }

  if (node.type === 'StringLiteral') {
    return typeof node.value === 'string' ? node.value : undefined;
  }

  if (node.type === 'TemplateLiteral') {
    if (!Array.isArray(node.expressions) || node.expressions.length > 0) {
      return undefined;
    }
    if (!Array.isArray(node.quasis) || node.quasis.length === 0) {
      return undefined;
    }
    return node.quasis
      .map((quasi) => {
        if (!isObject(quasi) || !isObject(quasi.value)) {
          return '';
        }
        return typeof quasi.value.cooked === 'string' ? quasi.value.cooked : '';
      })
      .join('');
  }

  return undefined;
};

const hasMixedCommandAndQueryNames = (methodNames: ReadonlyArray<string>): boolean => {
  let hasCommand = false;
  let hasQuery = false;

  for (const name of methodNames) {
    if (commandNamePattern.test(name)) {
      hasCommand = true;
    }
    if (queryNamePattern.test(name)) {
      hasQuery = true;
    }
    if (hasCommand && hasQuery) {
      return true;
    }
  }

  return false;
};

type ClassMethodDescriptor = {
  name: string;
  line: number | null;
};

type InterfaceMethodDescriptor = {
  name: string;
  line: number | null;
};

const classNameFromNode = (node: AstNode): string => {
  const idNode = node.id;
  if (isObject(idNode) && idNode.type === 'Identifier' && typeof idNode.name === 'string') {
    return idNode.name;
  }
  return 'AnonymousClass';
};

const collectClassMethodDescriptors = (classNode: AstNode): readonly ClassMethodDescriptor[] => {
  const classBody = classNode.body;
  if (!isObject(classBody) || !Array.isArray(classBody.body)) {
    return [];
  }

  const descriptors: ClassMethodDescriptor[] = [];
  for (const member of classBody.body) {
    if (!isObject(member)) {
      continue;
    }
    if (
      member.type !== 'ClassMethod' &&
      member.type !== 'ClassPrivateMethod' &&
      member.type !== 'ObjectMethod'
    ) {
      continue;
    }
    const name = methodNameFromNode(member.key);
    if (typeof name !== 'string' || name.length === 0) {
      continue;
    }
    descriptors.push({
      name,
      line: toPositiveLine(member),
    });
  }

  return descriptors;
};

const interfaceNameFromNode = (node: AstNode): string => {
  const idNode = node.id;
  if (isObject(idNode) && idNode.type === 'Identifier' && typeof idNode.name === 'string') {
    return idNode.name;
  }
  return 'AnonymousInterface';
};

const collectInterfaceMethodDescriptors = (
  interfaceNode: AstNode
): readonly InterfaceMethodDescriptor[] => {
  const interfaceBody = interfaceNode.body;
  if (!isObject(interfaceBody) || !Array.isArray(interfaceBody.body)) {
    return [];
  }

  const descriptors: InterfaceMethodDescriptor[] = [];
  for (const member of interfaceBody.body) {
    if (!isObject(member)) {
      continue;
    }

    if (member.type === 'TSMethodSignature') {
      const name = methodNameFromNode(member.key);
      if (typeof name === 'string' && name.length > 0) {
        descriptors.push({
          name,
          line: toPositiveLine(member),
        });
      }
      continue;
    }

    if (member.type === 'TSPropertySignature') {
      const name = methodNameFromNode(member.key);
      const memberType = member.typeAnnotation;
      if (
        typeof name === 'string' &&
        name.length > 0 &&
        isObject(memberType) &&
        isObject(memberType.typeAnnotation) &&
        memberType.typeAnnotation.type === 'TSFunctionType'
      ) {
        descriptors.push({
          name,
          line: toPositiveLine(member),
        });
      }
    }
  }

  return descriptors;
};

const toSemanticMemberNode = (
  role: 'query' | 'command',
  descriptor: ClassMethodDescriptor
): TypeScriptSemanticNode => {
  return {
    kind: 'member',
    name: `${role}:${descriptor.name}`,
    lines: typeof descriptor.line === 'number' ? [descriptor.line] : undefined,
  };
};

const toSingleLineArray = (line: number | null): readonly number[] | undefined => {
  return typeof line === 'number' ? [line] : undefined;
};

const dedupeSemanticNodes = (
  nodes: ReadonlyArray<TypeScriptSemanticNode>
): readonly TypeScriptSemanticNode[] => {
  const unique = new Map<string, TypeScriptSemanticNode>();
  for (const node of nodes) {
    const key = `${node.kind}:${node.name}:${(node.lines ?? []).join(',')}`;
    if (!unique.has(key)) {
      unique.set(key, node);
    }
  }
  return [...unique.values()];
};

const semanticClassOwnerFromAncestors = (
  ancestors: ReadonlyArray<AstNode>
): TypeScriptSemanticNode | undefined => {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (ancestor.type === 'ClassDeclaration' || ancestor.type === 'ClassExpression') {
      return {
        kind: 'class',
        name: classNameFromNode(ancestor),
        lines: toSingleLineArray(toPositiveLine(ancestor)),
      };
    }
  }
  return undefined;
};

const semanticOwnerFromAncestors = (
  ancestors: ReadonlyArray<AstNode>
): TypeScriptSemanticNode | undefined => {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (ancestor.type === 'ClassDeclaration' || ancestor.type === 'ClassExpression') {
      return {
        kind: 'class',
        name: classNameFromNode(ancestor),
        lines: toSingleLineArray(toPositiveLine(ancestor)),
      };
    }
    if (
      ancestor.type === 'ClassMethod' ||
      ancestor.type === 'ClassPrivateMethod' ||
      ancestor.type === 'ObjectMethod'
    ) {
      const memberName = methodNameFromNode(ancestor.key);
      if (typeof memberName === 'string' && memberName.length > 0) {
        return {
          kind: 'member',
          name: memberName,
          lines: toSingleLineArray(toPositiveLine(ancestor)),
        };
      }
    }
    if (ancestor.type === 'FunctionDeclaration') {
      const functionName = methodNameFromNode(ancestor.id);
      if (typeof functionName === 'string' && functionName.length > 0) {
        return {
          kind: 'member',
          name: functionName,
          lines: toSingleLineArray(toPositiveLine(ancestor)),
        };
      }
    }
    if (ancestor.type === 'VariableDeclarator') {
      const variableName = methodNameFromNode(ancestor.id);
      if (typeof variableName === 'string' && variableName.length > 0) {
        return {
          kind: 'member',
          name: variableName,
          lines: toSingleLineArray(toPositiveLine(ancestor)),
        };
      }
    }
  }
  return undefined;
};

type FrameworkDependencyImportInfo = {
  source: string;
  line: number | null;
  ancestors: readonly AstNode[];
};

type ConcreteDependencyInstantiationInfo = {
  dependencyName: string;
  line: number | null;
  ancestors: readonly AstNode[];
};

type TypeDiscriminatorSwitchInfo = {
  discriminatorName: string;
  switchLine: number | null;
  caseNodes: readonly TypeScriptSemanticNode[];
  ancestors: readonly AstNode[];
};

type ClassInterfaceDependency = {
  classNode: AstNode;
  memberName: string;
};

type OverrideNotImplementedInfo = {
  classNode: AstNode;
  methodNode: AstNode;
  methodName: string;
  throwLine: number | null;
  baseContractName?: string;
  baseContractLine: number | null;
  safeSubstituteClassName?: string;
  safeSubstituteLine: number | null;
};

const frameworkDependencyImportSourceFromNode = (node: AstNode): string | undefined => {
  if (node.type === 'ImportDeclaration') {
    const sourceNode = node.source;
    if (
      isObject(sourceNode) &&
      sourceNode.type === 'StringLiteral' &&
      typeof sourceNode.value === 'string' &&
      frameworkDependencyPattern.test(sourceNode.value)
    ) {
      return sourceNode.value;
    }
  }

  if (node.type !== 'CallExpression') {
    return undefined;
  }

  const callee = node.callee;
  if (!isObject(callee) || callee.type !== 'Identifier' || callee.name !== 'require') {
    return undefined;
  }
  if (!Array.isArray(node.arguments) || node.arguments.length === 0) {
    return undefined;
  }
  const firstArg = node.arguments[0];
  if (
    isObject(firstArg) &&
    firstArg.type === 'StringLiteral' &&
    typeof firstArg.value === 'string' &&
    frameworkDependencyPattern.test(firstArg.value)
  ) {
    return firstArg.value;
  }

  return undefined;
};

const concreteDependencyNameFromNode = (node: AstNode): string | undefined => {
  if (node.type !== 'NewExpression') {
    return undefined;
  }
  const calleeName = methodNameFromNode(node.callee) ?? memberExpressionPropertyName(node.callee);
  if (typeof calleeName !== 'string' || !concreteDependencyNames.has(calleeName)) {
    return undefined;
  }
  return calleeName;
};

const switchCaseLabelFromNode = (node: unknown): string | undefined => {
  if (!isObject(node)) {
    return undefined;
  }

  if (
    node.type === 'StringLiteral' ||
    node.type === 'NumericLiteral' ||
    node.type === 'BooleanLiteral'
  ) {
    return String(node.value);
  }

  if (node.type === 'Identifier') {
    return typeof node.name === 'string' ? node.name : undefined;
  }

  if (node.type === 'MemberExpression') {
    const propertyName = memberExpressionPropertyName(node);
    return typeof propertyName === 'string' && propertyName.length > 0
      ? propertyName
      : undefined;
  }

  return literalTextFromNode(node);
};

const typeReferenceNameFromNode = (node: unknown): string | undefined => {
  if (!isObject(node)) {
    return undefined;
  }

  if (node.type === 'TSTypeAnnotation') {
    return typeReferenceNameFromNode(node.typeAnnotation);
  }

  if (node.type === 'TSTypeReference') {
    return typeReferenceNameFromNode(node.typeName);
  }

  if (node.type === 'Identifier') {
    return typeof node.name === 'string' ? node.name : undefined;
  }

  if (node.type === 'TSQualifiedName') {
    return typeReferenceNameFromNode(node.right);
  }

  return undefined;
};

const superclassNameFromNode = (node: AstNode): string | undefined => {
  return methodNameFromNode(node.superClass) ?? memberExpressionPropertyName(node.superClass);
};

const findThrowNotImplementedLine = (methodNode: AstNode): number | null => {
  if (methodNode.type !== 'ClassMethod') {
    return null;
  }

  const body = methodNode.body;
  if (!isObject(body) || !Array.isArray(body.body)) {
    return null;
  }

  const throwNode = findFirstNode(body, (nested) => {
    if (nested.type !== 'ThrowStatement') {
      return false;
    }

    const argumentNode = nested.argument;
    if (!isObject(argumentNode)) {
      return false;
    }

    if (argumentNode.type === 'NewExpression') {
      const calleeName = methodNameFromNode(argumentNode.callee);
      if (calleeName !== 'Error' || !Array.isArray(argumentNode.arguments)) {
        return false;
      }
      const firstArg = argumentNode.arguments[0];
      const text = literalTextFromNode(firstArg);
      return typeof text === 'string' && notImplementedPattern.test(text);
    }

    const throwText = literalTextFromNode(argumentNode);
    return typeof throwText === 'string' && notImplementedPattern.test(throwText);
  });

  return throwNode ? toPositiveLine(throwNode) : null;
};

const findClassMethodByName = (classNode: AstNode, methodName: string): AstNode | undefined => {
  const classBody = classNode.body;
  if (!isObject(classBody) || !Array.isArray(classBody.body)) {
    return undefined;
  }

  return classBody.body.find((member): member is AstNode => {
    return (
      isObject(member) &&
      member.type === 'ClassMethod' &&
      methodNameFromNode(member.key) === methodName
    );
  });
};

const findClassByName = (node: unknown, className: string): AstNode | undefined => {
  return findFirstNode(node, (value) => {
    return (
      (value.type === 'ClassDeclaration' || value.type === 'ClassExpression') &&
      classNameFromNode(value) === className
    );
  });
};

const findSafeSubstituteClass = (params: {
  node: unknown;
  baseContractName?: string;
  excludedClassNode: AstNode;
  methodName: string;
}): AstNode | undefined => {
  if (!params.baseContractName) {
    return undefined;
  }

  return findFirstNode(params.node, (value) => {
    if (
      (value.type !== 'ClassDeclaration' && value.type !== 'ClassExpression') ||
      value === params.excludedClassNode ||
      superclassNameFromNode(value) !== params.baseContractName
    ) {
      return false;
    }

    const methodNode = findClassMethodByName(value, params.methodName);
    if (!methodNode) {
      return false;
    }

    return findThrowNotImplementedLine(methodNode) === null;
  });
};

const findOverrideNotImplementedInfo = (node: unknown): OverrideNotImplementedInfo | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    if (value.type !== 'ClassMethod' || value.override !== true) {
      return false;
    }

    if (findThrowNotImplementedLine(value) === null) {
      return false;
    }

    return ancestors.some(
      (ancestor) => ancestor.type === 'ClassDeclaration' || ancestor.type === 'ClassExpression'
    );
  });

  if (!match) {
    return undefined;
  }

  const methodNode = match.node;
  const classNode = [...match.ancestors]
    .reverse()
    .find((ancestor) => ancestor.type === 'ClassDeclaration' || ancestor.type === 'ClassExpression');
  const methodName = methodNameFromNode(methodNode.key);
  if (!classNode || typeof methodName !== 'string' || methodName.length === 0) {
    return undefined;
  }

  const baseContractName = superclassNameFromNode(classNode);
  const baseContractNode =
    typeof baseContractName === 'string' ? findClassByName(node, baseContractName) : undefined;
  const safeSubstituteNode = findSafeSubstituteClass({
    node,
    baseContractName,
    excludedClassNode: classNode,
    methodName,
  });

  return {
    classNode,
    methodNode,
    methodName,
    throwLine: findThrowNotImplementedLine(methodNode),
    baseContractName,
    baseContractLine: baseContractNode
      ? toPositiveLine(baseContractNode)
      : isObject(classNode.superClass)
        ? toPositiveLine(classNode.superClass)
        : null,
    safeSubstituteClassName: safeSubstituteNode ? classNameFromNode(safeSubstituteNode) : undefined,
    safeSubstituteLine: safeSubstituteNode ? toPositiveLine(safeSubstituteNode) : null,
  };
};

const findFrameworkDependencyImportInfo = (
  node: unknown
): FrameworkDependencyImportInfo | undefined => {
  const match = findFirstNodeWithAncestors(node, (value) => {
    return typeof frameworkDependencyImportSourceFromNode(value) === 'string';
  });
  if (!match) {
    return undefined;
  }
  const source = frameworkDependencyImportSourceFromNode(match.node);
  if (typeof source !== 'string') {
    return undefined;
  }
  return {
    source,
    line: toPositiveLine(match.node),
    ancestors: match.ancestors,
  };
};

const findConcreteDependencyInstantiationInfo = (
  node: unknown
): ConcreteDependencyInstantiationInfo | undefined => {
  const match = findFirstNodeWithAncestors(node, (value) => {
    return typeof concreteDependencyNameFromNode(value) === 'string';
  });
  if (!match) {
    return undefined;
  }
  const dependencyName = concreteDependencyNameFromNode(match.node);
  if (typeof dependencyName !== 'string') {
    return undefined;
  }
  const line =
    toPositiveLine(match.node) ??
    [...match.ancestors]
      .reverse()
      .map((ancestor) => toPositiveLine(ancestor))
      .find((ancestorLine): ancestorLine is number => typeof ancestorLine === 'number') ??
    null;
  return {
    dependencyName,
    line,
    ancestors: match.ancestors,
  };
};

const findTypeDiscriminatorSwitchInfo = (
  node: unknown
): TypeDiscriminatorSwitchInfo | undefined => {
  const match = findFirstNodeWithAncestors(node, (value) => {
    if (value.type !== 'SwitchStatement') {
      return false;
    }

    const discriminatorName =
      methodNameFromNode(value.discriminant) ?? memberExpressionPropertyName(value.discriminant);
    if (!discriminatorName || !solidDiscriminatorPattern.test(discriminatorName)) {
      return false;
    }

    if (!Array.isArray(value.cases)) {
      return false;
    }

    const typedCases = value.cases.filter((entry) => {
      if (!isObject(entry) || entry.type !== 'SwitchCase' || !isObject(entry.test)) {
        return false;
      }
      return typeof switchCaseLabelFromNode(entry.test) === 'string';
    });

    const [firstTypedCase, secondTypedCase] = typedCases;
    return firstTypedCase !== undefined && secondTypedCase !== undefined;
  });

  if (!match) {
    return undefined;
  }

  const switchNode = match.node;
  const discriminatorName =
    methodNameFromNode(switchNode.discriminant) ??
    memberExpressionPropertyName(switchNode.discriminant);
  if (typeof discriminatorName !== 'string' || discriminatorName.length === 0) {
    return undefined;
  }

  const caseNodes: TypeScriptSemanticNode[] = Array.isArray(switchNode.cases)
    ? switchNode.cases.flatMap((entry): TypeScriptSemanticNode[] => {
        if (!isObject(entry) || entry.type !== 'SwitchCase' || !isObject(entry.test)) {
          return [];
        }
        const label = switchCaseLabelFromNode(entry.test);
        if (typeof label !== 'string' || label.length === 0) {
          return [];
        }
        return [
          {
            kind: 'member',
            name: `case:${label}`,
            lines: toSingleLineArray(toPositiveLine(entry)),
          },
        ];
      })
    : [];

  const [firstCaseNode, secondCaseNode] = caseNodes;
  if (!firstCaseNode || !secondCaseNode) {
    return undefined;
  }

  return {
    discriminatorName,
    switchLine: toPositiveLine(switchNode),
    caseNodes,
    ancestors: match.ancestors,
  };
};

const findClassInterfaceDependency = (
  node: unknown,
  interfaceName: string
): ClassInterfaceDependency | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    if (value.type !== 'ClassProperty' && value.type !== 'ClassPrivateProperty') {
      return false;
    }

    const propertyName = methodNameFromNode(value.key);
    const typeName = typeReferenceNameFromNode(value.typeAnnotation);
    if (propertyName !== undefined && typeName === interfaceName) {
      return ancestors.some(
        (ancestor) => ancestor.type === 'ClassDeclaration' || ancestor.type === 'ClassExpression'
      );
    }

    return false;
  });

  if (!match) {
    return undefined;
  }

  const propertyNode = match.node;
  const classNode = [...match.ancestors]
    .reverse()
    .find((ancestor) => ancestor.type === 'ClassDeclaration' || ancestor.type === 'ClassExpression');
  const memberName = methodNameFromNode(propertyNode.key);
  if (!classNode || typeof memberName !== 'string' || memberName.length === 0) {
    return undefined;
  }

  return {
    classNode,
    memberName,
  };
};

const collectClassInterfaceMethodCalls = (params: {
  classNode: AstNode;
  memberName: string;
  contractMethodNames: ReadonlySet<string>;
}): readonly InterfaceMethodDescriptor[] => {
  const matches: InterfaceMethodDescriptor[] = [];

  const walk = (value: unknown): void => {
    if (!isObject(value)) {
      return;
    }

    if (value.type === 'CallExpression' && isObject(value.callee)) {
      const callee = value.callee;
      if (callee.type === 'MemberExpression' && callee.computed !== true && isObject(callee.object)) {
        const objectNode = callee.object;
        const targetName =
          objectNode.type === 'Identifier'
            ? objectNode.name
            : objectNode.type === 'MemberExpression' &&
                objectNode.computed !== true &&
                isObject(objectNode.object) &&
                objectNode.object.type === 'ThisExpression'
              ? methodNameFromNode(objectNode.property)
              : undefined;
        const methodName = methodNameFromNode(callee.property);
        if (
          targetName === params.memberName &&
          typeof methodName === 'string' &&
          params.contractMethodNames.has(methodName)
        ) {
          matches.push({
            name: methodName,
            line: toPositiveLine(value),
          });
        }
      }
    }

    for (const child of Object.values(value)) {
      if (Array.isArray(child)) {
        for (const entry of child) {
          walk(entry);
        }
        continue;
      }
      walk(child);
    }
  };

  walk(params.classNode);
  return matches;
};

const buildSolidDipMatch = (
  node: unknown,
  trigger: 'framework-import' | 'concrete-instantiation'
): TypeScriptSolidDipMatch | undefined => {
  const frameworkImport = findFrameworkDependencyImportInfo(node);
  const concreteInstantiation = findConcreteDependencyInstantiationInfo(node);

  if (trigger === 'framework-import' && !frameworkImport) {
    return undefined;
  }
  if (trigger === 'concrete-instantiation' && !concreteInstantiation) {
    return undefined;
  }

  const owner =
    semanticOwnerFromAncestors(concreteInstantiation?.ancestors ?? []) ??
    semanticOwnerFromAncestors(frameworkImport?.ancestors ?? []);

  const primaryNode =
    owner ??
    (concreteInstantiation
      ? {
        kind: 'call',
        name: `new ${concreteInstantiation.dependencyName}`,
        lines: toSingleLineArray(concreteInstantiation.line),
      }
      : frameworkImport
        ? {
          kind: 'member',
          name: `import:${frameworkImport.source}`,
          lines: toSingleLineArray(frameworkImport.line),
        }
        : undefined);

  if (!primaryNode) {
    return undefined;
  }

  const relatedNodeCandidates: Array<TypeScriptSemanticNode | undefined> = [
    frameworkImport
      ? {
        kind: 'member',
        name: `import:${frameworkImport.source}`,
        lines: toSingleLineArray(frameworkImport.line),
      }
      : undefined,
    concreteInstantiation
      ? {
        kind: 'call',
        name: `new ${concreteInstantiation.dependencyName}`,
        lines: toSingleLineArray(concreteInstantiation.line),
      }
      : undefined,
  ];
  const relatedNodes = dedupeSemanticNodes(
    relatedNodeCandidates.filter(
      (entry): entry is TypeScriptSemanticNode => entry !== undefined
    )
  );

  const lines = sortedUniqueLines([
    ...(primaryNode.lines ?? []),
    ...(frameworkImport && typeof frameworkImport.line === 'number' ? [frameworkImport.line] : []),
    ...(concreteInstantiation && typeof concreteInstantiation.line === 'number'
      ? [concreteInstantiation.line]
      : []),
  ]);
  const primaryLabel =
    primaryNode.kind === 'class'
      ? `La clase ${primaryNode.name}`
      : primaryNode.kind === 'member'
        ? `El miembro ${primaryNode.name}`
        : `La llamada ${primaryNode.name}`;
  const dependencyActions = [
    frameworkImport ? `importa ${frameworkImport.source}` : undefined,
    concreteInstantiation ? `instancia ${concreteInstantiation.dependencyName}` : undefined,
  ].filter((entry): entry is string => typeof entry === 'string');
  const dependencySummary =
    dependencyActions.length > 1
      ? `${dependencyActions[0]} y ${dependencyActions[1]}`
      : dependencyActions[0] ?? 'depende de una implementación concreta';

  return {
    lines,
    primary_node: primaryNode,
    related_nodes: relatedNodes,
    why:
      `${primaryLabel} ${dependencySummary} directamente desde una capa de alto nivel, ` +
      'acoplando política a infraestructura concreta y rompiendo DIP.',
    impact:
      'La lógica de aplicación queda atada a infraestructura concreta, dificulta sustituir el framework o adapter y complica tests aislados.',
    expected_fix:
      'Introduce un puerto o abstracción en domain/application e inyecta el adapter concreto desde infrastructure o composition root.',
  };
};

const buildSolidOcpMatch = (node: unknown): TypeScriptSolidOcpMatch | undefined => {
  const switchInfo = findTypeDiscriminatorSwitchInfo(node);
  if (!switchInfo) {
    return undefined;
  }

  const primaryNode =
    semanticClassOwnerFromAncestors(switchInfo.ancestors) ??
    semanticOwnerFromAncestors(switchInfo.ancestors) ?? {
      kind: 'member' as const,
      name: `discriminator switch: ${switchInfo.discriminatorName}`,
      lines: toSingleLineArray(switchInfo.switchLine),
    };

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'member',
      name: `discriminator switch: ${switchInfo.discriminatorName}`,
      lines: toSingleLineArray(switchInfo.switchLine),
    },
    ...switchInfo.caseNodes,
  ]);
  const lines = sortedUniqueLines([
    ...(primaryNode.lines ?? []),
    ...(typeof switchInfo.switchLine === 'number' ? [switchInfo.switchLine] : []),
    ...switchInfo.caseNodes.flatMap((entry) => entry.lines ?? []),
  ]);
  const caseSummary = switchInfo.caseNodes.map((entry) => entry.name.replace(/^case:/, '')).join(', ');
  const primaryLabel =
    primaryNode.kind === 'class'
      ? `La clase ${primaryNode.name}`
      : `El miembro ${primaryNode.name}`;

  return {
    lines,
    primary_node: primaryNode,
    related_nodes: relatedNodes,
    why:
      `${primaryLabel} resuelve comportamiento con un switch sobre ${switchInfo.discriminatorName} ` +
      `(${caseSummary}), obligando a modificar la misma unidad para soportar nuevos casos y rompiendo OCP.`,
    impact:
      'Cada nuevo caso exige tocar lógica existente, aumenta el riesgo de regresiones y dificulta extender el comportamiento mediante composición o polimorfismo.',
    expected_fix:
      'Extrae el comportamiento a estrategias, handlers o un mapa de resolutores basado en abstracciones para añadir nuevos casos sin modificar la lógica existente.',
  };
};

const buildSolidIspMatch = (node: unknown): TypeScriptSolidIspMatch | undefined => {
  const interfaceNode = findFirstNode(node, (value) => {
    if (value.type !== 'TSInterfaceDeclaration') {
      return false;
    }
    const methodNames = collectInterfaceMethodDescriptors(value).map((descriptor) => descriptor.name);
    return hasMixedCommandAndQueryNames(methodNames);
  });

  if (!interfaceNode) {
    return undefined;
  }

  const interfaceName = interfaceNameFromNode(interfaceNode);
  const methodDescriptors = collectInterfaceMethodDescriptors(interfaceNode);
  const queryMembers = methodDescriptors.filter((descriptor) => queryNamePattern.test(descriptor.name));
  const commandMembers = methodDescriptors.filter((descriptor) => commandNamePattern.test(descriptor.name));
  if (queryMembers.length === 0 || commandMembers.length === 0) {
    return undefined;
  }

  const dependency = findClassInterfaceDependency(node, interfaceName);
  if (!dependency) {
    return undefined;
  }

  const usedMembers = collectClassInterfaceMethodCalls({
    classNode: dependency.classNode,
    memberName: dependency.memberName,
    contractMethodNames: new Set(methodDescriptors.map((descriptor) => descriptor.name)),
  });
  if (usedMembers.length === 0) {
    return undefined;
  }

  const usesQuery = usedMembers.some((descriptor) => queryNamePattern.test(descriptor.name));
  const usesCommand = usedMembers.some((descriptor) => commandNamePattern.test(descriptor.name));
  if (usesQuery === usesCommand) {
    return undefined;
  }

  const usedDescriptor = usedMembers[0]!;
  const unusedDescriptor = (usesQuery ? commandMembers[0] : queryMembers[0])!;
  const classLine = toPositiveLine(dependency.classNode);
  const lines = sortedUniqueLines([
    ...(typeof classLine === 'number' ? [classLine] : []),
    ...usedMembers
      .map((descriptor) => descriptor.line)
      .filter((line): line is number => typeof line === 'number'),
    ...(typeof unusedDescriptor.line === 'number' ? [unusedDescriptor.line] : []),
    ...(typeof toPositiveLine(interfaceNode) === 'number' ? [toPositiveLine(interfaceNode)!] : []),
  ]);

  return {
    lines,
    primary_node: {
      kind: 'class',
      name: classNameFromNode(dependency.classNode),
      lines: typeof classLine === 'number' ? [classLine] : lines,
    },
    related_nodes: [
      {
        kind: 'member',
        name: `fat interface: ${interfaceName}`,
        lines: toSingleLineArray(toPositiveLine(interfaceNode)),
      },
      {
        kind: 'member',
        name: `used member: ${usedDescriptor.name}`,
        lines: toSingleLineArray(usedDescriptor.line),
      },
      {
        kind: 'member',
        name: `unused contract member: ${unusedDescriptor.name}`,
        lines: toSingleLineArray(unusedDescriptor.line),
      },
    ],
    why:
      `${classNameFromNode(dependency.classNode)} depende de ${interfaceName}, un contrato que mezcla ` +
      `queries y commands, pero solo usa ${usedDescriptor.name}; eso rompe ISP al acoplar al consumidor a miembros que no necesita.`,
    impact:
      'El consumidor queda acoplado a un contrato demasiado ancho, aumenta el coste de tests y fuerza cambios coordinados cuando evoluciona una parte no usada del puerto.',
    expected_fix:
      'Separa el contrato en puertos mas pequeños orientados a capacidad o divide lectura y escritura para que cada consumidor dependa solo de lo que realmente usa.',
  };
};

const buildSolidLspMatch = (node: unknown): TypeScriptSolidLspMatch | undefined => {
  const overrideInfo = findOverrideNotImplementedInfo(node);
  if (!overrideInfo) {
    return undefined;
  }

  const classLine = toPositiveLine(overrideInfo.classNode);
  const methodLine = toPositiveLine(overrideInfo.methodNode);
  const lines = sortedUniqueLines([
    ...(typeof overrideInfo.baseContractLine === 'number' ? [overrideInfo.baseContractLine] : []),
    ...(typeof overrideInfo.safeSubstituteLine === 'number' ? [overrideInfo.safeSubstituteLine] : []),
    ...(typeof classLine === 'number' ? [classLine] : []),
    ...(typeof methodLine === 'number' ? [methodLine] : []),
    ...(typeof overrideInfo.throwLine === 'number' ? [overrideInfo.throwLine] : []),
  ]);

  const relatedNodeCandidates: Array<TypeScriptSemanticNode | undefined> = [
    overrideInfo.baseContractName
      ? {
          kind: 'member' as const,
          name: `base contract: ${overrideInfo.baseContractName}`,
          lines: toSingleLineArray(overrideInfo.baseContractLine),
        }
      : undefined,
    overrideInfo.safeSubstituteClassName
      ? {
          kind: 'member' as const,
          name: `safe substitute: ${overrideInfo.safeSubstituteClassName}`,
          lines: toSingleLineArray(overrideInfo.safeSubstituteLine),
        }
      : undefined,
    {
      kind: 'member' as const,
      name: `unsafe override: ${overrideInfo.methodName}`,
      lines: toSingleLineArray(methodLine),
    },
    {
      kind: 'call' as const,
      name: 'throw not implemented',
      lines: toSingleLineArray(overrideInfo.throwLine),
    },
  ];
  const relatedNodes = dedupeSemanticNodes(
    relatedNodeCandidates.filter(
      (entry): entry is TypeScriptSemanticNode => entry !== undefined
    )
  );

  const subclassName = classNameFromNode(overrideInfo.classNode);
  const contractName = overrideInfo.baseContractName ?? 'su contrato base';

  return {
    lines,
    primary_node: {
      kind: 'class',
      name: subclassName,
      lines: typeof classLine === 'number' ? [classLine] : lines,
    },
    related_nodes: relatedNodes,
    why:
      `${subclassName} sobreescribe ${overrideInfo.methodName} de ${contractName} ` +
      'pero lanza una ruta "not implemented", rompiendo LSP porque el subtipo deja de ser un sustituto seguro del contrato base.',
    impact:
      'Los consumidores del contrato base pueden fallar en runtime o introducir comprobaciones especiales para esquivar el subtipo, aumentando regresiones y acoplamiento.',
    expected_fix:
      'Haz que el subtipo respete el contrato base sin rutas no soportadas o separa el comportamiento incompatible en otra estrategia o abstracción para mantener la sustitución segura.',
  };
};

const buildMixedCommandQueryClassMatch = (
  classNode: AstNode
): TypeScriptSolidSrpClassMatch | undefined => {
  const descriptors = collectClassMethodDescriptors(classNode);
  if (descriptors.length === 0) {
    return undefined;
  }

  const queryMembers = descriptors.filter((descriptor) => queryNamePattern.test(descriptor.name));
  const commandMembers = descriptors.filter((descriptor) => commandNamePattern.test(descriptor.name));
  if (queryMembers.length === 0 || commandMembers.length === 0) {
    return undefined;
  }

  const className = classNameFromNode(classNode);
  const firstQuery = queryMembers[0]!;
  const firstCommand = commandMembers[0]!;
  const classLine = toPositiveLine(classNode);
  const lines = sortedUniqueLines([
    ...(typeof classLine === 'number' ? [classLine] : []),
    ...queryMembers
      .map((descriptor) => descriptor.line)
      .filter((line): line is number => typeof line === 'number'),
    ...commandMembers
      .map((descriptor) => descriptor.line)
      .filter((line): line is number => typeof line === 'number'),
  ]);

  return {
    lines,
    primary_node: {
      kind: 'class',
      name: className,
      lines: typeof classLine === 'number' ? [classLine] : lines,
    },
    related_nodes: [
      toSemanticMemberNode('query', firstQuery),
      toSemanticMemberNode('command', firstCommand),
    ],
    why:
      `${className} mezcla consultas (${firstQuery.name}) y comandos (${firstCommand.name}) ` +
      'en la misma clase, rompiendo SRP y Command-Query Separation.',
    impact:
      'La clase acumula múltiples razones de cambio, dificulta el testeo aislado y acopla la evolución de lecturas y escrituras.',
    expected_fix:
      'Separa lectura y escritura en colaboradores dedicados o casos de uso distintos, dejando cada clase con una sola responsabilidad.',
  };
};

const isEmptyCatchClauseNode = (value: Record<string, string | number | boolean | bigint | symbol | null | Date | object>): boolean => {
  if (value.type !== 'CatchClause') {
    return false;
  }
  const body = value.body;
  return isObject(body) && Array.isArray(body.body) && body.body.length === 0;
};

export const hasEmptyCatchClause = (node: unknown): boolean => {
  return hasNode(node, isEmptyCatchClauseNode);
};

export const findEmptyCatchClauseLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isEmptyCatchClauseNode);
};

const buildEmptyCatchMatch = (node: unknown): TypeScriptEmptyCatchMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value) => isEmptyCatchClauseNode(value));

  if (!match) {
    return undefined;
  }

  const catchNode = match.node;
  const catchLine = toPositiveLine(catchNode);
  const primaryNode =
    semanticOwnerFromAncestors(match.ancestors) ?? {
      kind: 'member',
      name: 'empty catch',
      lines: toSingleLineArray(catchLine),
    };

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'member',
      name: 'empty catch',
      lines: toSingleLineArray(catchLine),
    },
  ]);

  const ownerLabel =
    primaryNode.kind === 'class'
      ? `La clase ${primaryNode.name}`
      : primaryNode.kind === 'member'
        ? `El miembro ${primaryNode.name}`
        : `La llamada ${primaryNode.name}`;

  const lines = sortedUniqueLines([
    ...(primaryNode.lines ?? []),
    ...(typeof catchLine === 'number' ? [catchLine] : []),
  ]);

  return {
    lines,
    primary_node: primaryNode,
    related_nodes: relatedNodes,
    why:
      `${ownerLabel} deja un catch vacío, ocultando fallos reales y tragándose errores sin manejo ni observabilidad.`,
    impact:
      'Los fallos desaparecen sin rastro, los tests no pueden validar la ruta de error y la producción queda ciega ante excepciones reales.',
    expected_fix:
      'Registra, transforma o propaga el error. Si es intencional, documenta el caso y conserva una acción observable.',
  };
};

export const findEmptyCatchClauseMatch = (node: unknown): TypeScriptEmptyCatchMatch | undefined => {
  return buildEmptyCatchMatch(node);
};

export const hasExplicitAnyType = (node: unknown): boolean => {
  return hasNode(node, (value) => value.type === 'TSAnyKeyword');
};

const buildExplicitAnyMatch = (node: unknown): TypeScriptExplicitAnyMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    return value.type === 'TSAnyKeyword' && ancestors.every((ancestor) => ancestor.type !== 'TSTypeParameter');
  });

  if (!match) {
    return undefined;
  }

  const anyNode = match.node;
  const anyLine = toPositiveLine(anyNode);
  const primaryNode =
    semanticOwnerFromAncestors(match.ancestors) ?? {
      kind: 'member',
      name: 'explicit any',
      lines: toSingleLineArray(anyLine),
    };

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'member',
      name: 'explicit any',
      lines: toSingleLineArray(anyLine),
    },
  ]);

  const ownerLabel =
    primaryNode.kind === 'class'
      ? `La clase ${primaryNode.name}`
      : primaryNode.kind === 'member'
        ? `El miembro ${primaryNode.name}`
        : `La llamada ${primaryNode.name}`;

  const lines = sortedUniqueLines([
    ...(primaryNode.lines ?? []),
    ...(typeof anyLine === 'number' ? [anyLine] : []),
  ]);

  return {
    lines,
    primary_node: primaryNode,
    related_nodes: relatedNodes,
    why:
      `${ownerLabel} declara explícitamente any, anulando la comprobación de tipos y ocultando la forma real del dato.`,
    impact:
      'La superficie tipada pierde precisión, se abren regresiones silenciosas y se complica la evolución segura del código.',
    expected_fix:
      'Sustituye any por unknown, un tipo concreto o un genérico acotado con guardas explícitas.',
  };
};

export const findExplicitAnyTypeMatch = (node: unknown): TypeScriptExplicitAnyMatch | undefined => {
  return buildExplicitAnyMatch(node);
};

export const hasConsoleLogCall = (node: unknown): boolean => {
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

const buildConsoleLogMatch = (node: unknown): TypeScriptConsoleLogMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
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
      propertyNode.name === 'log' &&
      ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration')
    );
  });

  if (!match) {
    return undefined;
  }

  const callNode = match.node;
  const callLine = toPositiveLine(callNode);
  const primaryNode =
    semanticOwnerFromAncestors(match.ancestors) ?? {
      kind: 'call',
      name: 'console.log',
      lines: toSingleLineArray(callLine),
    };

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'call',
      name: 'console.log',
      lines: toSingleLineArray(callLine),
    },
  ]);

  const ownerLabel =
    primaryNode.kind === 'class'
      ? `La clase ${primaryNode.name}`
      : primaryNode.kind === 'member'
        ? `El miembro ${primaryNode.name}`
        : `La llamada ${primaryNode.name}`;

  const lines = sortedUniqueLines([
    ...(primaryNode.lines ?? []),
    ...(typeof callLine === 'number' ? [callLine] : []),
  ]);

  return {
    lines,
    primary_node: primaryNode,
    related_nodes: relatedNodes,
    why:
      `${ownerLabel} utiliza console.log directamente, dejando trazas de depuración en runtime ` +
      'y rompiendo la salida controlada.',
    impact:
      'Las trazas quedan acopladas al runtime, ensucian logs de producción y complican redirigir la salida a un logger estructurado o desactivarla por entorno.',
    expected_fix:
      'Sustituye console.log por un logger inyectado o elimina la traza en código productivo.',
  };
};

export const findConsoleLogCallMatch = (node: unknown): TypeScriptConsoleLogMatch | undefined => {
  return buildConsoleLogMatch(node);
};

const loggingMethodNames = new Set(['log', 'info', 'warn', 'error', 'debug', 'verbose', 'trace']);
const loggingObjectNamePattern = /(console|logger|log|winston|audit|tracer)/i;
const sensitiveLogNameTokens = [
  'password',
  'passwd',
  'pwd',
  'token',
  'secret',
  'pii',
  'email',
  'phone',
  'ssn',
  'credential',
  'bearer',
  'apikey',
  'clientsecret',
  'clientid',
  'authorization',
];

const normalizeSensitiveLogName = (value: string): string => {
  return value.replace(/[^a-z0-9]+/gi, '').toLowerCase();
};

const isSensitiveLogName = (value: string): boolean => {
  const normalized = normalizeSensitiveLogName(value);
  return sensitiveLogNameTokens.some((token) => normalized.includes(token));
};

const sensitiveLogNameFromNode = (node: unknown): string | undefined => {
  if (!isObject(node)) {
    return undefined;
  }

  if (node.type === 'Identifier' && typeof node.name === 'string') {
    return node.name;
  }

  if (node.type === 'MemberExpression') {
    return memberExpressionPropertyName(node);
  }

  if (
    node.type === 'ObjectProperty' ||
    node.type === 'ClassProperty' ||
    node.type === 'ClassPrivateProperty' ||
    node.type === 'TSPropertySignature' ||
    node.type === 'ObjectMethod'
  ) {
    return methodNameFromNode(node.key);
  }

  if (node.type === 'AssignmentPattern') {
    return sensitiveLogNameFromNode(node.left);
  }

  if (node.type === 'RestElement') {
    return sensitiveLogNameFromNode(node.argument);
  }

  return undefined;
};

const isSensitiveLogArgumentNode = (node: AstNode): boolean => {
  const sensitiveName = sensitiveLogNameFromNode(node);
  return typeof sensitiveName === 'string' && isSensitiveLogName(sensitiveName);
};

const isSensitiveLoggingCallExpression = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callee = node.callee;
  if (!isObject(callee)) {
    return false;
  }

  if (callee.type === 'Identifier') {
    return typeof callee.name === 'string' && loggingMethodNames.has(callee.name.toLowerCase());
  }

  if (callee.type !== 'MemberExpression' || callee.computed === true) {
    return false;
  }

  const methodName = methodNameFromNode(callee.property)?.toLowerCase();
  if (!methodName || !loggingMethodNames.has(methodName)) {
    return false;
  }

  const objectName = methodNameFromNode(callee.object) ?? memberExpressionPropertyName(callee.object);
  return typeof objectName === 'string' && loggingObjectNamePattern.test(objectName);
};

const findSensitiveLogArgumentNode = (callNode: AstNode): AstNode | undefined => {
  if (!Array.isArray(callNode.arguments) || callNode.arguments.length === 0) {
    return undefined;
  }

  for (const argument of callNode.arguments) {
    const sensitiveNode = findFirstNode(argument, (value) => isSensitiveLogArgumentNode(value));
    if (typeof sensitiveNode !== 'undefined') {
      return sensitiveNode;
    }
  }

  return undefined;
};

const buildSensitiveLogMatch = (node: unknown): TypeScriptSensitiveLogMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    return isSensitiveLoggingCallExpression(value) && ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration');
  });

  if (!match) {
    return undefined;
  }

  const callNode = match.node;
  const sensitiveArgumentNode = findSensitiveLogArgumentNode(callNode);
  if (typeof sensitiveArgumentNode === 'undefined') {
    return undefined;
  }

  const callLine = toPositiveLine(callNode);
  const sensitiveLine = toPositiveLine(sensitiveArgumentNode);
  const sensitiveName = sensitiveLogNameFromNode(sensitiveArgumentNode) ?? 'sensitive data';
  const primaryNode =
    semanticOwnerFromAncestors(match.ancestors) ?? {
      kind: 'call',
      name: 'logger',
      lines: toSingleLineArray(callLine),
    };

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'call',
      name: 'logging',
      lines: toSingleLineArray(callLine),
    },
    {
      kind: 'member',
      name: sensitiveName,
      lines: toSingleLineArray(sensitiveLine),
    },
  ]);

  const ownerLabel =
    primaryNode.kind === 'class'
      ? `La clase ${primaryNode.name}`
      : primaryNode.kind === 'member'
        ? `El miembro ${primaryNode.name}`
        : `La llamada ${primaryNode.name}`;

  const lines = sortedUniqueLines([
    ...(primaryNode.lines ?? []),
    ...(typeof callLine === 'number' ? [callLine] : []),
    ...(typeof sensitiveLine === 'number' ? [sensitiveLine] : []),
  ]);

  return {
    lines,
    primary_node: primaryNode,
    related_nodes: relatedNodes,
    why:
      `${ownerLabel} registra ${sensitiveName} en un log, exponiendo datos sensibles en la salida operativa.`,
    impact:
      'Passwords, tokens y PII pueden quedar persistidos en observabilidad y trazas, elevando el riesgo de fuga y cumplimiento.',
    expected_fix:
      'Elimina el dato sensible del log, redáctalo o pásalo por un logger con mascarado antes de emitirlo.',
  };
};

export const hasSensitiveLogCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (!isSensitiveLoggingCallExpression(value)) {
      return false;
    }
    return findSensitiveLogArgumentNode(value) !== undefined;
  });
};

export const findSensitiveLogCallMatch = (node: unknown): TypeScriptSensitiveLogMatch | undefined => {
  return buildSensitiveLogMatch(node);
};

const errorLoggingContextFieldNames = new Set([
  'context',
  'requestid',
  'traceid',
  'userid',
  'correlationid',
  'operation',
  'module',
]);

const isContextEnrichedErrorLoggingObject = (node: AstNode): boolean => {
  if (node.type !== 'ObjectExpression' || !Array.isArray(node.properties)) {
    return false;
  }

  return node.properties.some((property) => {
    if (!isObject(property) || property.type !== 'ObjectProperty') {
      return false;
    }

    const keyName = methodNameFromNode(property.key)?.toLowerCase();
    return typeof keyName === 'string' && errorLoggingContextFieldNames.has(keyName);
  });
};

const isErrorLoggingCallExpression = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callee = node.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression' || callee.computed === true) {
    return false;
  }

  const objectName = methodNameFromNode(callee.object) ?? memberExpressionPropertyName(callee.object);
  const propertyName = methodNameFromNode(callee.property)?.toLowerCase();
  return (
    typeof objectName === 'string' &&
    /logger$/i.test(objectName) &&
    propertyName === 'error'
  );
};

const errorLoggingContextObjectFromCall = (callNode: AstNode): AstNode | undefined => {
  if (!Array.isArray(callNode.arguments)) {
    return undefined;
  }

  return callNode.arguments.find(
    (argument) => isObject(argument) && isContextEnrichedErrorLoggingObject(argument)
  ) as AstNode | undefined;
};

const buildErrorLoggingContextMatch = (node: unknown): TypeScriptErrorLoggingMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    return isErrorLoggingCallExpression(value) && ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration');
  });

  if (!match) {
    return undefined;
  }

  const callNode = match.node;
  if (errorLoggingContextObjectFromCall(callNode)) {
    return undefined;
  }

  const callLine = toPositiveLine(callNode);
  const callee = isObject(callNode) ? callNode.callee : undefined;
  const calleeName =
    isObject(callee) && callee.type === 'MemberExpression'
      ? `${methodNameFromNode(callee.object) ?? memberExpressionPropertyName(callee.object) ?? 'logger'}.${methodNameFromNode(callee.property) ?? 'error'}`
      : 'logger.error';
  const ownerNode =
    semanticOwnerFromAncestors(match.ancestors) ?? {
      kind: 'member',
      name: calleeName,
      lines: toSingleLineArray(callLine),
    };

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'call',
      name: calleeName,
      lines: toSingleLineArray(callLine),
    },
    {
      kind: 'member',
      name: 'missing context',
      lines: toSingleLineArray(callLine),
    },
  ]);

  const lines = sortedUniqueLines([
    ...(ownerNode.lines ?? []),
    ...(typeof callLine === 'number' ? [callLine] : []),
  ]);

  const ownerLabel =
    ownerNode.kind === 'class'
      ? `La clase ${ownerNode.name}`
      : ownerNode.kind === 'member'
        ? `El miembro ${ownerNode.name}`
        : `La llamada ${ownerNode.name}`;

  return {
    lines,
    primary_node: ownerNode,
    related_nodes: relatedNodes,
    why: `${ownerLabel} registra errores sin contexto completo, dificultando la correlación operativa.`,
    impact:
      'Sin requestId, traceId o userId el incidente pierde trazabilidad y cuesta reconstruir el flujo real en observabilidad.',
    expected_fix:
      'Añade un objeto de contexto con requestId, traceId o userId junto al error y conserva el error original en logger.error.',
  };
};

export const hasErrorLoggingFullContextPattern = (node: unknown): boolean => {
  return typeof buildErrorLoggingContextMatch(node) !== 'undefined';
};

export const findErrorLoggingFullContextMatch = (
  node: unknown
): TypeScriptErrorLoggingMatch | undefined => {
  return buildErrorLoggingContextMatch(node);
};

const isCorrelationIdsLoggingCallExpression = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callee = node.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression' || callee.computed === true) {
    return false;
  }

  const objectName = methodNameFromNode(callee.object) ?? memberExpressionPropertyName(callee.object);
  const propertyName = methodNameFromNode(callee.property);
  return (
    typeof objectName === 'string' &&
    /logger$/i.test(objectName) &&
    typeof propertyName === 'string' &&
    propertyName.length > 0
  );
};

const buildCorrelationIdsMatch = (node: unknown): TypeScriptCorrelationIdsMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    return (
      isCorrelationIdsLoggingCallExpression(value) &&
      errorLoggingContextObjectFromCall(value) !== undefined &&
      ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration')
    );
  });

  if (!match) {
    return undefined;
  }

  const callNode = match.node;
  const contextObject = errorLoggingContextObjectFromCall(callNode);

  const callLine = toPositiveLine(callNode);
  const callee = isObject(callNode) ? callNode.callee : undefined;
  const calleeName =
    isObject(callee) && callee.type === 'MemberExpression'
      ? `${methodNameFromNode(callee.object) ?? memberExpressionPropertyName(callee.object) ?? 'logger'}.${methodNameFromNode(callee.property) ?? 'log'}`
      : 'logger.log';
  const ownerNode =
    semanticOwnerFromAncestors(match.ancestors) ?? {
      kind: 'member',
      name: calleeName,
      lines: toSingleLineArray(callLine),
    };

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'call',
      name: calleeName,
      lines: toSingleLineArray(callLine),
    },
    {
      kind: 'member',
      name: 'correlation context',
      lines: toSingleLineArray(callLine),
    },
  ]);

  const lines = sortedUniqueLines([
    ...(ownerNode.lines ?? []),
    ...(typeof callLine === 'number' ? [callLine] : []),
  ]);

  const ownerLabel =
    ownerNode.kind === 'class'
      ? `La clase ${ownerNode.name}`
      : ownerNode.kind === 'member'
        ? `El miembro ${ownerNode.name}`
        : `La llamada ${ownerNode.name}`;

  return {
    lines,
    primary_node: ownerNode,
    related_nodes: relatedNodes,
    why: `${ownerLabel} propaga correlation IDs para conservar la trazabilidad distribuida.`,
    impact:
      'La petición conserva requestId, traceId, correlationId o userId para correlacionar logs, trazas y eventos.',
    expected_fix:
      'Propaga requestId, traceId o correlationId en el contexto del logger o middleware y mantenlo consistente en toda la request.',
  };
};

export const hasCorrelationIdsPattern = (node: unknown): boolean => {
  return typeof buildCorrelationIdsMatch(node) !== 'undefined';
};

export const findCorrelationIdsMatch = (
  node: unknown
): TypeScriptCorrelationIdsMatch | undefined => {
  return buildCorrelationIdsMatch(node);
};

const isCorsEnableCallExpression = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callee = node.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression' || callee.computed === true) {
    return false;
  }

  const objectName = methodNameFromNode(callee.object) ?? memberExpressionPropertyName(callee.object);
  const propertyName = methodNameFromNode(callee.property);
  return (
    typeof objectName === 'string' &&
    objectName.length > 0 &&
    typeof propertyName === 'string' &&
    propertyName.toLowerCase() === 'enablecors'
  );
};

const isConfiguredCorsOriginValue = (value: unknown): boolean => {
  if (!isObject(value)) {
    return false;
  }

  if (value.type === 'StringLiteral') {
    return typeof value.value === 'string' && value.value.trim().length > 0 && value.value !== '*';
  }

  if (value.type === 'BooleanLiteral') {
    return false;
  }

  if (value.type === 'ArrayExpression') {
    const elements = Array.isArray(value.elements) ? value.elements : [];
    return elements.some((element) => {
      if (!isObject(element)) {
        return true;
      }
      if (element.type === 'StringLiteral') {
        return typeof element.value === 'string' && element.value.trim().length > 0 && element.value !== '*';
      }
      return true;
    });
  }

  return true;
};

const corsAllowedOriginsFromCall = (node: AstNode): unknown => {
  if (!isCorsEnableCallExpression(node)) {
    return undefined;
  }

  const optionsArgument = Array.isArray(node.arguments)
    ? node.arguments.find((argument) => isObject(argument) && argument.type === 'ObjectExpression')
    : undefined;
  if (!isObject(optionsArgument) || !Array.isArray(optionsArgument.properties)) {
    return undefined;
  }

  for (const member of optionsArgument.properties) {
    if (!isObject(member) || member.type !== 'ObjectProperty') {
      continue;
    }
    const keyName = methodNameFromNode(member.key);
    if (typeof keyName !== 'string' || keyName.toLowerCase() !== 'origin') {
      continue;
    }
    return isConfiguredCorsOriginValue(member.value) ? member.value : undefined;
  }

  return undefined;
};

const buildCorsConfiguredMatch = (node: unknown): TypeScriptCorsConfiguredMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    return (
      isCorsEnableCallExpression(value) &&
      corsAllowedOriginsFromCall(value) !== undefined &&
      ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration')
    );
  });

  if (!match) {
    return undefined;
  }

  const callNode = match.node;
  const callLine = toPositiveLine(callNode);
  const callee = isObject(callNode) ? callNode.callee : undefined;
  const calleeName =
    isObject(callee) && callee.type === 'MemberExpression'
      ? `${methodNameFromNode(callee.object) ?? memberExpressionPropertyName(callee.object) ?? 'app'}.${methodNameFromNode(callee.property) ?? 'enableCors'}`
      : 'app.enableCors';
  const ownerNode =
    semanticOwnerFromAncestors(match.ancestors) ?? {
      kind: 'member',
      name: calleeName,
      lines: toSingleLineArray(callLine),
    };

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'call',
      name: calleeName,
      lines: toSingleLineArray(callLine),
    },
    {
      kind: 'member',
      name: 'allowed origins',
      lines: toSingleLineArray(callLine),
    },
  ]);

  const lines = sortedUniqueLines([
    ...(ownerNode.lines ?? []),
    ...(typeof callLine === 'number' ? [callLine] : []),
  ]);

  const ownerLabel =
    ownerNode.kind === 'class'
      ? `La clase ${ownerNode.name}`
      : ownerNode.kind === 'member'
        ? `El miembro ${ownerNode.name}`
        : `La llamada ${ownerNode.name}`;

  return {
    lines,
    primary_node: ownerNode,
    related_nodes: relatedNodes,
    why: `${ownerLabel} configura CORS con orígenes permitidos, evitando exposición amplia innecesaria.`,
    impact:
      'Sin orígenes permitidos explícitos, el backend puede aceptar solicitudes cross-origin demasiado amplias y perder control sobre la superficie expuesta.',
    expected_fix:
      'Configura app.enableCors({ origin: [...] }) con orígenes explícitos y evita comodines globales.',
  };
};

export const hasCorsConfiguredPattern = (node: unknown): boolean => {
  return typeof buildCorsConfiguredMatch(node) !== 'undefined';
};

export const findCorsConfiguredMatch = (
  node: unknown
): TypeScriptCorsConfiguredMatch | undefined => {
  return buildCorsConfiguredMatch(node);
};

const isValidationPipeGlobalCallExpression = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callee = node.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression' || callee.computed === true) {
    return false;
  }

  const objectName = methodNameFromNode(callee.object) ?? memberExpressionPropertyName(callee.object);
  const propertyName = methodNameFromNode(callee.property);
  return (
    typeof objectName === 'string' &&
    objectName.length > 0 &&
    typeof propertyName === 'string' &&
    propertyName === 'useGlobalPipes'
  );
};

const isValidationPipeWhitelistNewExpression = (node: unknown): boolean => {
  if (!isObject(node) || node.type !== 'NewExpression') {
    return false;
  }

  const calleeName = methodNameFromNode(node.callee) ?? memberExpressionPropertyName(node.callee);
  if (calleeName !== 'ValidationPipe') {
    return false;
  }

  const optionsArgument = Array.isArray(node.arguments)
    ? node.arguments.find((argument) => isObject(argument) && argument.type === 'ObjectExpression')
    : undefined;
  if (!isObject(optionsArgument) || !Array.isArray(optionsArgument.properties)) {
    return false;
  }

  return optionsArgument.properties.some((member) => {
    if (!isObject(member) || member.type !== 'ObjectProperty') {
      return false;
    }
    const keyName = methodNameFromNode(member.key);
    if (typeof keyName !== 'string' || keyName.toLowerCase() !== 'whitelist') {
      return false;
    }
    return (
      isObject(member.value) &&
      member.value.type === 'BooleanLiteral' &&
      member.value.value === true
    );
  });
};

const buildValidationPipeGlobalMatch = (
  node: unknown
): TypeScriptValidationPipeGlobalMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    return (
      isValidationPipeGlobalCallExpression(value) &&
      Array.isArray(value.arguments) &&
      value.arguments.some((argument) => isValidationPipeWhitelistNewExpression(argument)) &&
      ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration')
    );
  });

  if (!match) {
    return undefined;
  }

  const callNode = match.node;
  const callLine = toPositiveLine(callNode);
  const callee = isObject(callNode) ? callNode.callee : undefined;
  const calleeName =
    isObject(callee) && callee.type === 'MemberExpression'
      ? `${methodNameFromNode(callee.object) ?? memberExpressionPropertyName(callee.object) ?? 'app'}.${methodNameFromNode(callee.property) ?? 'useGlobalPipes'}`
      : 'app.useGlobalPipes';
  const ownerNode =
    semanticOwnerFromAncestors(match.ancestors) ?? {
      kind: 'member',
      name: calleeName,
      lines: toSingleLineArray(callLine),
    };

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'call',
      name: calleeName,
      lines: toSingleLineArray(callLine),
    },
    {
      kind: 'member',
      name: 'whitelist: true',
      lines: toSingleLineArray(callLine),
    },
  ]);

  const lines = sortedUniqueLines([
    ...(ownerNode.lines ?? []),
    ...(typeof callLine === 'number' ? [callLine] : []),
  ]);

  const ownerLabel =
    ownerNode.kind === 'class'
      ? `La clase ${ownerNode.name}`
      : ownerNode.kind === 'member'
        ? `El miembro ${ownerNode.name}`
        : `La llamada ${ownerNode.name}`;

  return {
    lines,
    primary_node: ownerNode,
    related_nodes: relatedNodes,
    why: `${ownerLabel} registra ValidationPipe global con whitelist true en main.ts, endureciendo la validación de entrada.`,
    impact:
      'Sin whitelist true, el backend puede aceptar propiedades extra y la validación deja pasar datos no esperados.',
    expected_fix:
      'Configura app.useGlobalPipes(new ValidationPipe({ whitelist: true })) en main.ts.',
  };
};

export const hasValidationPipeGlobalPattern = (node: unknown): boolean => {
  return typeof buildValidationPipeGlobalMatch(node) !== 'undefined';
};

export const findValidationPipeGlobalMatch = (
  node: unknown
): TypeScriptValidationPipeGlobalMatch | undefined => {
  return buildValidationPipeGlobalMatch(node);
};

const isValidationConfigModuleCallExpression = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callee = node.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression' || callee.computed === true) {
    return false;
  }

  const objectName = methodNameFromNode(callee.object) ?? memberExpressionPropertyName(callee.object);
  const propertyName = methodNameFromNode(callee.property);
  return objectName === 'ConfigModule' && (propertyName === 'forRoot' || propertyName === 'forRootAsync');
};

const isValidationConfigOptionProperty = (node: unknown): boolean => {
  if (!isObject(node) || node.type !== 'ObjectProperty') {
    return false;
  }

  const keyName = methodNameFromNode(node.key);
  return typeof keyName === 'string' && (keyName === 'validationSchema' || keyName === 'validate');
};

const buildValidationConfigMatch = (node: unknown): TypeScriptValidationConfigMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    return (
      isValidationConfigModuleCallExpression(value) &&
      Array.isArray(value.arguments) &&
      value.arguments.some((argument) => {
        if (!isObject(argument) || argument.type !== 'ObjectExpression') {
          return false;
        }
        return Array.isArray(argument.properties)
          ? argument.properties.some((property) => isValidationConfigOptionProperty(property))
          : false;
      }) &&
      ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration')
    );
  });

  if (!match) {
    return undefined;
  }

  const callNode = match.node;
  const callLine = toPositiveLine(callNode);
  const callee = isObject(callNode) ? callNode.callee : undefined;
  const calleeName =
    isObject(callee) && callee.type === 'MemberExpression'
      ? `${methodNameFromNode(callee.object) ?? memberExpressionPropertyName(callee.object) ?? 'ConfigModule'}.${methodNameFromNode(callee.property) ?? 'forRoot'}`
      : 'ConfigModule.forRoot';
  const ownerNode =
    semanticOwnerFromAncestors(match.ancestors) ?? {
      kind: 'member',
      name: calleeName,
      lines: toSingleLineArray(callLine),
    };

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'call',
      name: calleeName,
      lines: toSingleLineArray(callLine),
    },
    {
      kind: 'member',
      name: 'validationSchema / validate',
      lines: toSingleLineArray(callLine),
    },
  ]);

  const lines = sortedUniqueLines([
    ...(ownerNode.lines ?? []),
    ...(typeof callLine === 'number' ? [callLine] : []),
  ]);

  const ownerLabel =
    ownerNode.kind === 'class'
      ? `La clase ${ownerNode.name}`
      : ownerNode.kind === 'member'
        ? `El miembro ${ownerNode.name}`
        : `La llamada ${ownerNode.name}`;

  return {
    lines,
    primary_node: ownerNode,
    related_nodes: relatedNodes,
    why: `${ownerLabel} valida explícitamente la configuración de entorno en ConfigModule, evitando arrancar con .env inconsistente o incompleto.`,
    impact:
      'Sin validationSchema o validate, la app puede arrancar con variables inválidas o faltantes y diferir el fallo a runtime.',
    expected_fix:
      'Configura ConfigModule.forRoot({ validationSchema: ... }) o validate: (...) para validar .env al arrancar.',
  };
};

const inputValidationParameterDecoratorNames = new Set(['body', 'query', 'param']);

const decoratorNameFromNode = (node: unknown): string | undefined => {
  if (!isObject(node) || node.type !== 'Decorator') {
    return undefined;
  }

  const expression = node.expression;
  if (!isObject(expression)) {
    return undefined;
  }

  if (expression.type === 'CallExpression') {
    return methodNameFromNode(expression.callee) ?? memberExpressionPropertyName(expression.callee);
  }

  return methodNameFromNode(expression) ?? memberExpressionPropertyName(expression);
};

const buildInputValidationMatch = (
  node: unknown
): TypeScriptInputValidationMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    if (value.type !== 'Identifier' || !Array.isArray(value.decorators) || value.decorators.length === 0) {
      return false;
    }

    const decoratorNames = value.decorators
      .map((decorator) => decoratorNameFromNode(decorator))
      .filter((name): name is string => typeof name === 'string' && name.length > 0);
    if (!decoratorNames.some((decoratorName) => inputValidationParameterDecoratorNames.has(decoratorName.toLowerCase()))) {
      return false;
    }

    const typeName = typeReferenceNameFromNode(value.typeAnnotation);
    if (typeof typeName !== 'string' || !/Dto$/i.test(typeName)) {
      return false;
    }

    const classOwner = semanticClassOwnerFromAncestors(ancestors);
    if (!classOwner || !/Controller$/i.test(classOwner.name)) {
      return false;
    }

    const methodAncestor = [...ancestors].reverse().find((ancestor) => {
      return ancestor.type === 'ClassMethod' || ancestor.type === 'ClassPrivateMethod' || ancestor.type === 'ObjectMethod';
    });
    if (!methodAncestor) {
      return false;
    }

    return ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration');
  });

  if (!match) {
    return undefined;
  }

  const parameterNode = match.node;
  const parameterName = methodNameFromNode(parameterNode);
  const parameterLine = toPositiveLine(parameterNode);
  const classOwner = semanticClassOwnerFromAncestors(match.ancestors);
  if (!classOwner || !/Controller$/i.test(classOwner.name)) {
    return undefined;
  }

  const methodAncestor = [...match.ancestors].reverse().find((ancestor) => {
    return ancestor.type === 'ClassMethod' || ancestor.type === 'ClassPrivateMethod' || ancestor.type === 'ObjectMethod';
  });
  const methodName =
    methodAncestor && isObject(methodAncestor) ? methodNameFromNode(methodAncestor.key) : undefined;
  const methodLine = methodAncestor ? toPositiveLine(methodAncestor) : undefined;
  const decoratorNode = Array.isArray(parameterNode.decorators)
    ? parameterNode.decorators.find((decorator) => {
        const decoratorName = decoratorNameFromNode(decorator);
        return (
          typeof decoratorName === 'string' &&
          inputValidationParameterDecoratorNames.has(decoratorName.toLowerCase())
        );
      })
    : undefined;
  const decoratorName = decoratorNameFromNode(decoratorNode);
  const decoratorLine = decoratorNode ? toPositiveLine(decoratorNode) : undefined;
  const typeName = typeReferenceNameFromNode(parameterNode.typeAnnotation);

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'member',
      name: methodName ?? 'controller-method',
      lines: toSingleLineArray(methodLine),
    },
    {
      kind: 'member',
      name: parameterName ?? 'dto-parameter',
      lines: toSingleLineArray(parameterLine),
    },
    {
      kind: 'member',
      name: `@${decoratorName ?? 'Body'}`,
      lines: toSingleLineArray(decoratorLine),
    },
    {
      kind: 'member',
      name: typeName ?? 'Dto',
      lines: toSingleLineArray(parameterLine),
    },
  ]);

  const lines = sortedUniqueLines([
    ...(typeof classOwner.lines?.[0] === 'number' ? [classOwner.lines[0]] : []),
    ...(typeof methodLine === 'number' ? [methodLine] : []),
    ...(typeof parameterLine === 'number' ? [parameterLine] : []),
    ...(typeof decoratorLine === 'number' ? [decoratorLine] : []),
    ...relatedNodes.flatMap((entry) => entry.lines ?? []),
  ]);

  return {
    lines,
    primary_node: classOwner,
    related_nodes: relatedNodes,
    why: `${classOwner.name} recibe ${typeName ?? 'un DTO'} a través de un parámetro de entrada tipado, manteniendo la validación en el borde del controller.`,
    impact:
      'Sin DTOs de entrada, el controller acepta payloads crudos y la validación/transformación queda repartida o directamente ausente.',
    expected_fix:
      'Tipa el parámetro con un DTO de entrada y conserva ValidationPipe + class-validator en el borde del controller.',
  };
};

const apiVersionDecoratorNames = new Set(['controller', 'version']);

const normalizeApiVersionLabel = (value: string): string | undefined => {
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) {
    return undefined;
  }

  const pathMatch = normalized.match(/(?:^|\/)v(\d+)(?:$|\/)/i);
  if (pathMatch) {
    return `v${pathMatch[1]}`;
  }

  const directMatch = normalized.match(/^v?(\d+)$/i);
  if (directMatch) {
    return `v${directMatch[1]}`;
  }

  return undefined;
};

const apiVersionLabelFromNode = (node: unknown): string | undefined => {
  if (!isObject(node)) {
    return undefined;
  }

  if (
    node.type === 'StringLiteral' ||
    node.type === 'NumericLiteral' ||
    node.type === 'BooleanLiteral'
  ) {
    const rawValue = hardcodedValueNameFromNode(node);
    return typeof rawValue === 'string' ? normalizeApiVersionLabel(rawValue) : undefined;
  }

  if (node.type === 'TemplateLiteral') {
    const quasis = Array.isArray(node.quasis) ? node.quasis : [];
    if (quasis.length === 1) {
      const cooked = quasis[0]?.value?.cooked;
      return typeof cooked === 'string' ? normalizeApiVersionLabel(cooked) : undefined;
    }
    return undefined;
  }

  if (node.type === 'ArrayExpression') {
    const elements = Array.isArray(node.elements) ? node.elements : [];
    for (const element of elements) {
      const label = apiVersionLabelFromNode(element);
      if (typeof label === 'string') {
        return label;
      }
    }
    return undefined;
  }

  if (node.type === 'ObjectExpression' && Array.isArray(node.properties)) {
    for (const property of node.properties) {
      if (!isObject(property) || property.type !== 'ObjectProperty') {
        continue;
      }

      const keyName = methodNameFromNode(property.key);
      if (
        typeof keyName !== 'string' ||
        !['version', 'path', 'prefix'].includes(keyName.toLowerCase())
      ) {
        continue;
      }

      const label = apiVersionLabelFromNode(property.value);
      if (typeof label === 'string') {
        return label;
      }
    }
  }

  return undefined;
};

const buildApiVersioningMatch = (node: unknown): TypeScriptApiVersioningMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    if (value.type !== 'Decorator') {
      return false;
    }

    const expression = value.expression;
    if (!isObject(expression) || expression.type !== 'CallExpression') {
      return false;
    }

    const decoratorName = methodNameFromNode(expression.callee) ?? memberExpressionPropertyName(expression.callee);
    if (
      typeof decoratorName !== 'string' ||
      !apiVersionDecoratorNames.has(decoratorName.toLowerCase())
    ) {
      return false;
    }

    const versionLabel = Array.isArray(expression.arguments)
      ? apiVersionLabelFromNode(expression.arguments[0])
      : undefined;
    if (typeof versionLabel !== 'string') {
      return false;
    }

    const classOwner = semanticClassOwnerFromAncestors(ancestors);
    if (!classOwner || !/Controller$/i.test(classOwner.name)) {
      return false;
    }

    return ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration');
  });

  if (!match) {
    return undefined;
  }

  const decoratorNode = match.node;
  const expression = isObject(decoratorNode) ? decoratorNode.expression : undefined;
  if (!isObject(expression) || expression.type !== 'CallExpression') {
    return undefined;
  }

  const decoratorName = methodNameFromNode(expression.callee) ?? memberExpressionPropertyName(expression.callee);
  const versionLabel = Array.isArray(expression.arguments)
    ? apiVersionLabelFromNode(expression.arguments[0])
    : undefined;
  const classOwner = semanticClassOwnerFromAncestors(match.ancestors);
  if (!classOwner || !/Controller$/i.test(classOwner.name)) {
    return undefined;
  }

  const methodAncestor = [...match.ancestors].reverse().find((ancestor) => {
    return ancestor.type === 'ClassMethod' || ancestor.type === 'ClassPrivateMethod' || ancestor.type === 'ObjectMethod';
  });
  const methodName =
    methodAncestor && isObject(methodAncestor) ? methodNameFromNode(methodAncestor.key) : undefined;
  const methodLine = methodAncestor ? toPositiveLine(methodAncestor) : undefined;
  const decoratorLine = toPositiveLine(decoratorNode);

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'member',
      name: methodName ?? 'controller-endpoint',
      lines: toSingleLineArray(methodLine ?? decoratorLine),
    },
    {
      kind: 'member',
      name: `@${decoratorName ?? 'Controller'}`,
      lines: toSingleLineArray(decoratorLine),
    },
    {
      kind: 'member',
      name: versionLabel ?? 'v1',
      lines: toSingleLineArray(decoratorLine),
    },
  ]);

  const lines = sortedUniqueLines([
    ...(typeof classOwner.lines?.[0] === 'number' ? [classOwner.lines[0]] : []),
    ...(typeof methodLine === 'number' ? [methodLine] : []),
    ...(typeof decoratorLine === 'number' ? [decoratorLine] : []),
    ...relatedNodes.flatMap((entry) => entry.lines ?? []),
  ]);

  return {
    lines,
    primary_node: classOwner,
    related_nodes: relatedNodes,
    why:
      `${classOwner.name} expone rutas versionadas con ${versionLabel ?? 'una versión'} en el contrato HTTP, preservando compatibilidad entre v1 y v2.`,
    impact:
      'Sin versionado explícito, el backend mezcla contratos de API en la misma superficie y rompe a consumidores cuando evoluciona el endpoint.',
    expected_fix:
      'Añade @Version("1") o version: "1" en el controller, o usa /api/v1 y /api/v2 cuando el contrato requiera compatibilidad por versión.',
  };
};

export const hasValidationConfigPattern = (node: unknown): boolean => {
  return typeof buildValidationConfigMatch(node) !== 'undefined';
};

export const findValidationConfigMatch = (
  node: unknown
): TypeScriptValidationConfigMatch | undefined => {
  return buildValidationConfigMatch(node);
};

export const hasApiVersioningPattern = (node: unknown): boolean => {
  return typeof buildApiVersioningMatch(node) !== 'undefined';
};

export const findApiVersioningMatch = (
  node: unknown
): TypeScriptApiVersioningMatch | undefined => {
  return buildApiVersioningMatch(node);
};

export const hasInputValidationPattern = (node: unknown): boolean => {
  return typeof buildInputValidationMatch(node) !== 'undefined';
};

export const findInputValidationMatch = (
  node: unknown
): TypeScriptInputValidationMatch | undefined => {
  return buildInputValidationMatch(node);
};

const buildNestedValidationMatch = (
  node: unknown
): TypeScriptNestedValidationMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    if (value.type !== 'ClassProperty' && value.type !== 'ClassPrivateProperty' && value.type !== 'TSPropertySignature') {
      return false;
    }

    if (!Array.isArray(value.decorators) || value.decorators.length === 0) {
      return false;
    }

    const decoratorNames = value.decorators
      .map((decorator) => decoratorNameFromNode(decorator))
      .filter((name): name is string => typeof name === 'string' && name.length > 0)
      .map((name) => name.toLowerCase());
    if (!decoratorNames.includes('validatenested') || !decoratorNames.includes('type')) {
      return false;
    }

    const classOwner = semanticClassOwnerFromAncestors(ancestors);
    if (!classOwner || !/Dto$/i.test(classOwner.name)) {
      return false;
    }

    return ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration');
  });

  if (!match) {
    return undefined;
  }

  const propertyNode = match.node;
  const propertyName = methodNameFromNode(propertyNode.key);
  const propertyLine = toPositiveLine(propertyNode);
  const classOwner = semanticClassOwnerFromAncestors(match.ancestors);
  if (!classOwner || !/Dto$/i.test(classOwner.name)) {
    return undefined;
  }

  const decoratorNames = Array.isArray(propertyNode.decorators)
    ? propertyNode.decorators
        .map((decorator) => decoratorNameFromNode(decorator))
        .filter((name): name is string => typeof name === 'string' && name.length > 0)
    : [];
  const validateNestedDecorator = Array.isArray(propertyNode.decorators)
    ? propertyNode.decorators.find((decorator) => {
        const decoratorName = decoratorNameFromNode(decorator);
        return typeof decoratorName === 'string' && decoratorName.toLowerCase() === 'validatenested';
      })
    : undefined;
  const typeDecorator = Array.isArray(propertyNode.decorators)
    ? propertyNode.decorators.find((decorator) => {
        const decoratorName = decoratorNameFromNode(decorator);
        return typeof decoratorName === 'string' && decoratorName.toLowerCase() === 'type';
      })
    : undefined;
  const validateNestedLine = validateNestedDecorator ? toPositiveLine(validateNestedDecorator) : undefined;
  const typeDecoratorLine = typeDecorator ? toPositiveLine(typeDecorator) : undefined;
  const typeName = typeReferenceNameFromNode(propertyNode.typeAnnotation);

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'member',
      name: propertyName ?? 'nested-dto-property',
      lines: toSingleLineArray(propertyLine),
    },
    {
      kind: 'member',
      name: `@${decoratorNames.find((name) => name.toLowerCase() === 'validatenested') ?? 'ValidateNested'}`,
      lines: toSingleLineArray(validateNestedLine),
    },
    {
      kind: 'member',
      name: `@${decoratorNames.find((name) => name.toLowerCase() === 'type') ?? 'Type'}`,
      lines: toSingleLineArray(typeDecoratorLine),
    },
    {
      kind: 'member',
      name: typeName ?? 'NestedDto',
      lines: toSingleLineArray(propertyLine),
    },
  ]);

  const lines = sortedUniqueLines([
    ...(typeof classOwner.lines?.[0] === 'number' ? [classOwner.lines[0]] : []),
    ...(typeof propertyLine === 'number' ? [propertyLine] : []),
    ...(typeof validateNestedLine === 'number' ? [validateNestedLine] : []),
    ...(typeof typeDecoratorLine === 'number' ? [typeDecoratorLine] : []),
    ...relatedNodes.flatMap((entry) => entry.lines ?? []),
  ]);

  return {
    lines,
    primary_node: classOwner,
    related_nodes: relatedNodes,
    why:
      `${classOwner.name} valida una propiedad anidada con @ValidateNested() y @Type(), manteniendo la validación profunda en el DTO.`,
    impact:
      'Sin validación anidada, el DTO acepta objetos hijos sin transformar ni validar y deja escapar payloads inválidos a capas posteriores.',
    expected_fix:
      'Añade @ValidateNested() y @Type(() => ChildDto) a la propiedad anidada del DTO que deba validarse recursivamente.',
  };
};

export const hasNestedValidationPattern = (node: unknown): boolean => {
  return typeof buildNestedValidationMatch(node) !== 'undefined';
};

export const findNestedValidationMatch = (
  node: unknown
): TypeScriptNestedValidationMatch | undefined => {
  return buildNestedValidationMatch(node);
};

const dtoDecoratorNameMatches = (
  decoratorName: string | undefined,
  expectedNames: ReadonlySet<string>
): boolean => {
  if (typeof decoratorName !== 'string' || decoratorName.length === 0) {
    return false;
  }
  return expectedNames.has(decoratorName.toLowerCase());
};

const findClassDtoPropertyDecoratorMatch = (
  node: unknown,
  params: {
    ruleName: string;
    decoratorNames: ReadonlySet<string>;
    why: (className: string, memberName: string) => string;
    impact: string;
    expectedFix: string;
  }
): TypeScriptDtoDecoratorMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    if (value.type !== 'Decorator') {
      return false;
    }

    const expression = value.expression;
    if (!isObject(expression)) {
      return false;
    }

    const decoratorName =
      expression.type === 'CallExpression'
        ? methodNameFromNode(expression.callee)
        : methodNameFromNode(expression);
    if (!dtoDecoratorNameMatches(decoratorName, params.decoratorNames)) {
      return false;
    }

    const hasClassPropertyAncestor = ancestors.some((ancestor) => {
      return (
        ancestor.type === 'ClassProperty' ||
        ancestor.type === 'ClassPrivateProperty' ||
        ancestor.type === 'TSPropertySignature'
      );
    });
    if (!hasClassPropertyAncestor) {
      return false;
    }

    return ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration');
  });

  if (!match) {
    return undefined;
  }

  const decoratorNode = match.node;
  const expression = isObject(decoratorNode) ? decoratorNode.expression : undefined;
  if (!isObject(expression)) {
    return undefined;
  }

  const decoratorName =
    expression.type === 'CallExpression'
      ? methodNameFromNode(expression.callee)
      : methodNameFromNode(expression);
  if (!dtoDecoratorNameMatches(decoratorName, params.decoratorNames)) {
    return undefined;
  }

  const classOwner = semanticClassOwnerFromAncestors(match.ancestors);
  if (!classOwner) {
    return undefined;
  }

  const propertyAncestor = [...match.ancestors].reverse().find((ancestor) => {
    return (
      ancestor.type === 'ClassProperty' ||
      ancestor.type === 'ClassPrivateProperty' ||
      ancestor.type === 'TSPropertySignature'
    );
  });
  const propertyName =
    propertyAncestor && isObject(propertyAncestor)
      ? methodNameFromNode(propertyAncestor.key)
      : undefined;
  const propertyLine = propertyAncestor ? toPositiveLine(propertyAncestor) : undefined;
  const decoratorLine = toPositiveLine(decoratorNode);
  const classLine = typeof classOwner.lines?.[0] === 'number' ? classOwner.lines[0] : undefined;

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'member',
      name: propertyName ?? 'dto-property',
      lines: toSingleLineArray(propertyLine ?? decoratorLine),
    },
    {
      kind: 'member',
      name: `@${decoratorName ?? params.ruleName}`,
      lines: toSingleLineArray(decoratorLine),
    },
  ]);

  const lines = sortedUniqueLines([
    ...(typeof classLine === 'number' ? [classLine] : []),
    ...(typeof propertyLine === 'number' ? [propertyLine] : []),
    ...(typeof decoratorLine === 'number' ? [decoratorLine] : []),
    ...relatedNodes.flatMap((entry) => entry.lines ?? []),
  ]);

  return {
    lines,
    primary_node: classOwner,
    related_nodes: relatedNodes,
    why: params.why(classOwner.name, propertyName ?? 'propiedad'),
    impact: params.impact,
    expected_fix: params.expectedFix,
  };
};

const classValidatorDecoratorNames = new Set(['isstring', 'isemail', 'min', 'max']);
const classTransformerDecoratorNames = new Set(['transform', 'exclude', 'expose']);

const buildClassValidatorDecoratorsMatch = (
  node: unknown
): TypeScriptDtoDecoratorMatch | undefined => {
  return findClassDtoPropertyDecoratorMatch(node, {
    ruleName: 'class-validator',
    decoratorNames: classValidatorDecoratorNames,
    why: (className, propertyName) =>
      `${className} valida ${propertyName} con decoradores de class-validator en el DTO, manteniendo la validación en el borde de entrada.`,
    impact:
      'Sin decoradores de class-validator, el DTO no expresa restricciones de tipo, formato o rango y los datos inválidos avanzan hacia runtime.',
    expectedFix:
      'Añade @IsString(), @IsEmail(), @Min() o @Max() a los campos del DTO que deban validarse.',
  });
};

const buildClassTransformerDecoratorsMatch = (
  node: unknown
): TypeScriptDtoDecoratorMatch | undefined => {
  return findClassDtoPropertyDecoratorMatch(node, {
    ruleName: 'class-transformer',
    decoratorNames: classTransformerDecoratorNames,
    why: (className, propertyName) =>
      `${className} transforma o expone ${propertyName} con decoradores de class-transformer en el DTO, controlando serialización y forma de salida.`,
    impact:
      'Sin decoradores de class-transformer, la transformación y exposición de campos queda implícita y puede filtrar propiedades no deseadas.',
    expectedFix:
      'Añade @Transform(), @Exclude() o @Expose() donde el contrato del DTO necesite ajustar serialización o visibilidad.',
  });
};

export const hasClassValidatorDecoratorsPattern = (node: unknown): boolean => {
  return typeof buildClassValidatorDecoratorsMatch(node) !== 'undefined';
};

export const findClassValidatorDecoratorsMatch = (
  node: unknown
): TypeScriptDtoDecoratorMatch | undefined => {
  return buildClassValidatorDecoratorsMatch(node);
};

export const hasClassTransformerDecoratorsPattern = (node: unknown): boolean => {
  return typeof buildClassTransformerDecoratorsMatch(node) !== 'undefined';
};

export const findClassTransformerDecoratorsMatch = (
  node: unknown
): TypeScriptDtoDecoratorMatch | undefined => {
  return buildClassTransformerDecoratorsMatch(node);
};

const buildDtoBoundaryMatch = (node: unknown): TypeScriptDtoBoundaryMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    if (value.type !== 'ClassDeclaration') {
      return false;
    }

    const className = methodNameFromNode(value.id);
    if (typeof className !== 'string' || !/dto$/i.test(className)) {
      return false;
    }

    const classBody = isObject(value.body) && value.body.type === 'ClassBody' ? value.body.body : [];
    if (!Array.isArray(classBody) || classBody.length === 0) {
      return false;
    }

    const hasClassProperty = classBody.some((member) => {
      return (
        isObject(member) &&
        (member.type === 'ClassProperty' ||
          member.type === 'ClassPrivateProperty' ||
          member.type === 'TSPropertySignature')
      );
    });
    if (!hasClassProperty) {
      return false;
    }

    const hasMemberDecorators = classBody.some((member) => {
      return (
        isObject(member) &&
        Array.isArray(member.decorators) &&
        member.decorators.some((decorator) => isObject(decorator) && decorator.type === 'Decorator')
      );
    });
    if (hasMemberDecorators) {
      return false;
    }

    return ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration');
  });

  if (!match) {
    return undefined;
  }

  const classNode = match.node;
  const className = methodNameFromNode(classNode.id);
  const classBody = isObject(classNode.body) && classNode.body.type === 'ClassBody' ? classNode.body.body : [];
  const classLine = toPositiveLine(classNode);

  const propertyEntries = classBody.filter((member) => {
    return (
      isObject(member) &&
      (member.type === 'ClassProperty' ||
        member.type === 'ClassPrivateProperty' ||
        member.type === 'TSPropertySignature')
    );
  });

  const relatedNodes = dedupeSemanticNodes(
    propertyEntries.map((member) => {
      const propertyName = isObject(member) ? methodNameFromNode(member.key) : undefined;
      const propertyLine = toPositiveLine(member);
      return {
        kind: 'member' as const,
        name: propertyName ?? 'dto-field',
        lines: toSingleLineArray(propertyLine),
      };
    })
  );

  const lines = sortedUniqueLines([
    ...(typeof classLine === 'number' ? [classLine] : []),
    ...propertyEntries.flatMap((member) => {
      return [toPositiveLine(member)].filter((line): line is number => typeof line === 'number');
    }),
    ...relatedNodes.flatMap((entry) => entry.lines ?? []),
  ]);

  return {
    lines,
    primary_node: {
      kind: 'class',
      name: className ?? 'Dto',
      lines: toSingleLineArray(classLine),
    },
    related_nodes: relatedNodes,
    why:
      `${className ?? 'Dto'} mantiene el boundary de entrada/salida del backend como DTO explícito en lugar de mezclar entidades o payloads ad hoc.`,
    impact:
      'Sin DTOs en boundaries, controladores y servicios acaban compartiendo contratos ambiguos y la validación/serialización se dispersa.',
    expected_fix:
      'Define DTOs explícitos para entrada y salida y úsalos como contrato en el borde del backend.',
  };
};

export const hasDtoBoundaryPattern = (node: unknown): boolean => {
  return typeof buildDtoBoundaryMatch(node) !== 'undefined';
};

export const findDtoBoundaryMatch = (
  node: unknown
): TypeScriptDtoBoundaryMatch | undefined => {
  return buildDtoBoundaryMatch(node);
};

const separatedDtoNamePattern = {
  create: /^Create([A-Z]\w*)Dto$/,
  update: /^Update([A-Z]\w*)Dto$/,
  response: /^([A-Z]\w*)ResponseDto$/,
} as const;

const buildSeparatedDtoMatch = (node: unknown): TypeScriptSeparatedDtoMatch | undefined => {
  const classDeclarations: AstNode[] = [];

  const walk = (value: unknown): void => {
    if (!isObject(value)) {
      return;
    }

    if (value.type === 'ClassDeclaration') {
      classDeclarations.push(value);
    }

    for (const child of Object.values(value)) {
      if (Array.isArray(child)) {
        for (const entry of child) {
          walk(entry);
        }
        continue;
      }
      walk(child);
    }
  };

  walk(node);
  if (classDeclarations.length < 3) {
    return undefined;
  }

  const groupedByBase = new Map<
    string,
    {
      create?: AstNode;
      update?: AstNode;
      response?: AstNode;
    }
  >();

  for (const classDeclaration of classDeclarations) {
    const className = methodNameFromNode(classDeclaration.id);
    if (typeof className !== 'string') {
      continue;
    }

    const createMatch = separatedDtoNamePattern.create.exec(className);
    const updateMatch = separatedDtoNamePattern.update.exec(className);
    const responseMatch = separatedDtoNamePattern.response.exec(className);
    const baseName = createMatch?.[1] ?? updateMatch?.[1] ?? responseMatch?.[1];
    if (typeof baseName !== 'string' || baseName.length === 0) {
      continue;
    }

    const bucket = groupedByBase.get(baseName) ?? {};
    if (createMatch) {
      bucket.create = classDeclaration;
    }
    if (updateMatch) {
      bucket.update = classDeclaration;
    }
    if (responseMatch) {
      bucket.response = classDeclaration;
    }
    groupedByBase.set(baseName, bucket);
  }

  const entry = [...groupedByBase.entries()].find(([, bucket]) => {
    return Boolean(bucket.create && bucket.update && bucket.response);
  });
  if (!entry) {
    return undefined;
  }

  const [baseName, bucket] = entry;
  const createClass = bucket.create as AstNode;
  const updateClass = bucket.update as AstNode;
  const responseClass = bucket.response as AstNode;
  const createName = methodNameFromNode(createClass.id);
  const updateName = methodNameFromNode(updateClass.id);
  const responseName = methodNameFromNode(responseClass.id);
  const createLine = toPositiveLine(createClass);
  const updateLine = toPositiveLine(updateClass);
  const responseLine = toPositiveLine(responseClass);

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'class',
      name: updateName ?? `${baseName}Dto`,
      lines: toSingleLineArray(updateLine),
    },
    {
      kind: 'class',
      name: responseName ?? `${baseName}ResponseDto`,
      lines: toSingleLineArray(responseLine),
    },
  ]);

  const lines = sortedUniqueLines([
    ...(typeof createLine === 'number' ? [createLine] : []),
    ...(typeof updateLine === 'number' ? [updateLine] : []),
    ...(typeof responseLine === 'number' ? [responseLine] : []),
    ...relatedNodes.flatMap((entry) => entry.lines ?? []),
  ]);

  return {
    lines,
    primary_node: {
      kind: 'class',
      name: createName ?? `Create${baseName}Dto`,
      lines: toSingleLineArray(createLine),
    },
    related_nodes: relatedNodes,
    why:
      `Los DTOs de ${baseName} separan creación, actualización y respuesta en contratos distintos, evitando mezclar entrada y salida en una sola clase.`,
    impact:
      'Sin DTOs separados, el backend mezcla contratos de creación, actualización y respuesta y acopla validación y serialización en una misma clase.',
    expected_fix:
      'Separa los contratos en Create, Update y Response DTOs y usa cada uno en su boundary correspondiente.',
  };
};

export const hasSeparatedDtoPattern = (node: unknown): boolean => {
  return typeof buildSeparatedDtoMatch(node) !== 'undefined';
};

export const findSeparatedDtoMatch = (
  node: unknown
): TypeScriptSeparatedDtoMatch | undefined => {
  return buildSeparatedDtoMatch(node);
};

const backendEntityTypePattern = /entity$/i;
const backendDtoTypePattern = /dto$/i;

const isBackendEntityTypeName = (name: string): boolean => {
  return backendEntityTypePattern.test(name) && !backendDtoTypePattern.test(name);
};

const isBackendReturnDtoExposureNode = (
  value: Record<string, string | number | boolean | bigint | symbol | null | Date | object>
): boolean => {
  if (
    value.type !== 'ClassMethod' &&
    value.type !== 'ClassPrivateMethod' &&
    value.type !== 'ObjectMethod' &&
    value.type !== 'FunctionDeclaration' &&
    value.type !== 'ArrowFunctionExpression' &&
    value.type !== 'ReturnStatement'
  ) {
    return false;
  }

  if (
    value.type === 'ClassMethod' ||
    value.type === 'ClassPrivateMethod' ||
    value.type === 'ObjectMethod' ||
    value.type === 'FunctionDeclaration' ||
    value.type === 'ArrowFunctionExpression'
  ) {
    return collectTypeReferenceNames(value.returnType).some(isBackendEntityTypeName);
  }

  const returnArgument = value.argument;
  if (!isObject(returnArgument)) {
    return false;
  }

  const returnNames = [
    methodNameFromNode(returnArgument),
    memberExpressionPropertyName(returnArgument),
    ...collectTypeReferenceNames(returnArgument),
  ].filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);

  return returnNames.some(isBackendEntityTypeName);
};

export const hasBackendReturnDtosExposureUsage = (node: unknown): boolean => {
  return hasNode(node, isBackendReturnDtoExposureNode);
};

export const findBackendReturnDtosExposureLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isBackendReturnDtoExposureNode);
};

const transactionBoundaryObjectNamePattern =
  /^(dataSource|manager|queryRunner|entityManager|connection)$/i;
const transactionBoundaryMethodNamePattern = /^(transaction|startTransaction|commitTransaction|rollbackTransaction)$/i;
const transactionWriteMethodNamePattern = /^(save|update|insert|upsert|delete|remove)$/i;

const isBackendTransactionBoundaryCall = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callee = node.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression' || callee.computed === true) {
    return false;
  }

  const objectName =
    methodNameFromNode(callee.object) ?? memberExpressionPropertyName(callee.object);
  const methodName = methodNameFromNode(callee.property);

  return (
    typeof objectName === 'string' &&
    transactionBoundaryObjectNamePattern.test(objectName) &&
    typeof methodName === 'string' &&
    transactionBoundaryMethodNamePattern.test(methodName)
  );
};

const isBackendTransactionWriteCall = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callee = node.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression' || callee.computed === true) {
    return false;
  }

  const methodName = methodNameFromNode(callee.property);
  return typeof methodName === 'string' && transactionWriteMethodNamePattern.test(methodName);
};

const collectBackendTransactionWriteCalls = (
  node: unknown
): ReadonlyArray<{ name: string; line: number }> => {
  const matches: Array<{ name: string; line: number }> = [];

  const walk = (value: unknown): void => {
    if (!isObject(value)) {
      return;
    }

    if (value.type === 'CallExpression' && isBackendTransactionWriteCall(value)) {
      const callee = value.callee;
      if (isObject(callee) && callee.type === 'MemberExpression') {
        const objectName =
          methodNameFromNode(callee.object) ?? memberExpressionPropertyName(callee.object);
        const methodName = methodNameFromNode(callee.property);
        const line = toPositiveLine(value);
        if (typeof methodName === 'string' && typeof line === 'number') {
          matches.push({
            name:
              typeof objectName === 'string' && objectName.length > 0
                ? `${objectName}.${methodName}`
                : methodName,
            line,
          });
        }
      }
    }

    for (const child of Object.values(value)) {
      if (Array.isArray(child)) {
        for (const entry of child) {
          walk(entry);
        }
        continue;
      }
      walk(child);
    }
  };

  walk(node);
  return matches;
};

const buildBackendTransactionsMatch = (
  node: unknown,
  mode: 'critical' | 'multi-table'
): TypeScriptTransactionMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    return isBackendTransactionBoundaryCall(value) && ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration');
  });

  if (!match) {
    return undefined;
  }

  const callNode = match.node;
  if (!isObject(callNode) || callNode.type !== 'CallExpression') {
    return undefined;
  }

  const callee = callNode.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression') {
    return undefined;
  }

  const boundaryName = methodNameFromNode(callee.property) ?? 'transaction';
  const boundaryObjectName =
    methodNameFromNode(callee.object) ?? memberExpressionPropertyName(callee.object) ?? 'transaction';
  const callLine = toPositiveLine(callNode);
  const callbackNode =
    Array.isArray(callNode.arguments) && callNode.arguments.length > 0
      ? callNode.arguments[0]
      : undefined;
  const writeCalls = collectBackendTransactionWriteCalls(callbackNode);
  if (mode === 'multi-table' && writeCalls.length < 2) {
    return undefined;
  }

  const ownerNode = semanticOwnerFromAncestors(match.ancestors) ?? {
    kind: 'member',
    name: `${boundaryObjectName}.${boundaryName}`,
    lines: toSingleLineArray(callLine),
  };
  const primaryNode =
    ownerNode.kind === 'class' || ownerNode.kind === 'member'
      ? ownerNode
      : {
          kind: 'member',
          name: `${boundaryObjectName}.${boundaryName}`,
          lines: toSingleLineArray(callLine),
        };

  const writeRelatedNodes = dedupeSemanticNodes(
    writeCalls.map((entry) => ({
      kind: 'call' as const,
      name: entry.name,
      lines: toSingleLineArray(entry.line),
    }))
  );

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'call',
      name: `${boundaryObjectName}.${boundaryName}`,
      lines: toSingleLineArray(callLine),
    },
    ...writeRelatedNodes,
  ]);

  const lines = sortedUniqueLines([
    ...(typeof callLine === 'number' ? [callLine] : []),
    ...relatedNodes.flatMap((entry) => entry.lines ?? []),
  ]);

  const writeCount = writeCalls.length;
  const ownerLabel =
    primaryNode.kind === 'class'
      ? `La clase ${primaryNode.name}`
      : primaryNode.kind === 'member'
        ? `El miembro ${primaryNode.name}`
        : `La llamada ${primaryNode.name}`;

  return {
    lines,
    primary_node: primaryNode,
    related_nodes: relatedNodes,
    why:
      mode === 'multi-table'
        ? `${ownerLabel} abre una transacción con ${writeCount} escrituras sobre distintas tablas/repositorios, dejando explícita la coordinación multi-tabla.`
        : `${ownerLabel} usa ${boundaryObjectName}.${boundaryName} para proteger una operación crítica con transacción explícita.`,
    impact:
      mode === 'multi-table'
        ? 'La operación mantiene atomicidad entre varias escrituras y evita estados intermedios inconsistentes en producción.'
        : 'La aplicación protege una operación crítica con atomicidad explícita y reduce el riesgo de dejar datos parciales si falla un paso intermedio.',
    expected_fix:
      mode === 'multi-table'
        ? 'Envuelve las escrituras relacionadas en una transacción explícita y conserva el commit/rollback centralizado.'
        : 'Mantén la transacción explícita alrededor de la operación crítica y evita dividirla en pasos sueltos fuera del contexto atómico.',
  };
};

export const hasBackendCriticalTransactionsUsage = (node: unknown): boolean => {
  return typeof buildBackendTransactionsMatch(node, 'critical') !== 'undefined';
};

export const findBackendCriticalTransactionsLines = (node: unknown): readonly number[] => {
  const match = buildBackendTransactionsMatch(node, 'critical');
  return match?.lines ?? [];
};

export const findBackendCriticalTransactionsMatch = (
  node: unknown
): TypeScriptTransactionMatch | undefined => {
  return buildBackendTransactionsMatch(node, 'critical');
};

export const hasBackendMultiTableTransactionsUsage = (node: unknown): boolean => {
  return typeof buildBackendTransactionsMatch(node, 'multi-table') !== 'undefined';
};

export const findBackendMultiTableTransactionsLines = (node: unknown): readonly number[] => {
  const match = buildBackendTransactionsMatch(node, 'multi-table');
  return match?.lines ?? [];
};

export const findBackendMultiTableTransactionsMatch = (
  node: unknown
): TypeScriptTransactionMatch | undefined => {
  return buildBackendTransactionsMatch(node, 'multi-table');
};

const prometheusMetricsDependencyPattern = /^prom-client(?:\/.*)?$/i;

type PrometheusMetricsImportInfo = {
  source: string;
  line: number | null;
  ancestors: ReadonlyArray<AstNode>;
};

const prometheusMetricsImportInfoFromNode = (
  node: AstNode
): PrometheusMetricsImportInfo | undefined => {
  if (node.type === 'ImportDeclaration') {
    const sourceNode = node.source;
    if (
      isObject(sourceNode) &&
      sourceNode.type === 'StringLiteral' &&
      typeof sourceNode.value === 'string' &&
      prometheusMetricsDependencyPattern.test(sourceNode.value)
    ) {
      return {
        source: sourceNode.value,
        line: toPositiveLine(node),
        ancestors: [],
      };
    }
  }

  if (node.type !== 'CallExpression') {
    return undefined;
  }

  const callee = node.callee;
  if (!isObject(callee) || callee.type !== 'Identifier' || callee.name !== 'require') {
    return undefined;
  }
  if (!Array.isArray(node.arguments) || node.arguments.length === 0) {
    return undefined;
  }
  const firstArg = node.arguments[0];
  if (
    isObject(firstArg) &&
    firstArg.type === 'StringLiteral' &&
    typeof firstArg.value === 'string' &&
    prometheusMetricsDependencyPattern.test(firstArg.value)
  ) {
    return {
      source: firstArg.value,
      line: toPositiveLine(node),
      ancestors: [],
    };
  }

  return undefined;
};

const buildPrometheusMetricsMatch = (
  node: unknown
): TypeScriptPrometheusMetricsMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    return typeof prometheusMetricsImportInfoFromNode(value) !== 'undefined' && ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration');
  });

  if (!match) {
    return undefined;
  }

  const importInfo = prometheusMetricsImportInfoFromNode(match.node);
  if (!importInfo) {
    return undefined;
  }

  const primaryNode =
    semanticOwnerFromAncestors(match.ancestors) ??
    semanticClassOwnerFromAncestors(match.ancestors) ?? {
      kind: 'member' as const,
      name: 'Prometheus metrics',
      lines: toSingleLineArray(importInfo.line),
    };

  const lines = sortedUniqueLines([
    ...(primaryNode.lines ?? []),
    ...(typeof importInfo.line === 'number' ? [importInfo.line] : []),
  ]);

  return {
    lines,
    primary_node: primaryNode,
    related_nodes: [
      {
        kind: 'member',
        name: `import:${importInfo.source}`,
        lines: toSingleLineArray(importInfo.line),
      },
    ],
    why:
      `${primaryNode.kind === 'class' ? `La clase ${primaryNode.name}` : `El miembro ${primaryNode.name}`} ` +
      `usa ${importInfo.source} para métricas Prometheus en backend, dejando explícita la instrumentación observables.`,
    impact:
      'Sin prom-client la aplicación pierde métricas operativas y se dificulta observar latencia, errores y saturación en producción.',
    expected_fix:
      'Importa prom-client en backend para exponer métricas Prometheus y centraliza la instrumentación en un punto reutilizable.',
  };
};

export const hasPrometheusMetricsPattern = (node: unknown): boolean => {
  return typeof buildPrometheusMetricsMatch(node) !== 'undefined';
};

export const findPrometheusMetricsMatch = (
  node: unknown
): TypeScriptPrometheusMetricsMatch | undefined => {
  return buildPrometheusMetricsMatch(node);
};

const bcryptLibraryPattern = /^(bcrypt|bcryptjs)$/i;
const bcryptHashMethodNames = new Set(['hash', 'hashsync', 'gensalt', 'gensaltsync']);

const isPasswordHashingCallExpression = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callee = node.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression' || callee.computed === true) {
    return false;
  }

  const methodName = methodNameFromNode(callee.property)?.toLowerCase();
  if (!methodName || !bcryptHashMethodNames.has(methodName)) {
    return false;
  }

  const objectName = methodNameFromNode(callee.object);
  return typeof objectName === 'string' && bcryptLibraryPattern.test(objectName);
};

const passwordHashingRoundLiteralFromCall = (
  callNode: AstNode,
  methodName: string
): AstNode | undefined => {
  if (!Array.isArray(callNode.arguments) || callNode.arguments.length === 0) {
    return undefined;
  }

  const roundsArgument =
    methodName.startsWith('hash') || methodName.startsWith('gensalt')
      ? callNode.arguments[methodName.startsWith('hash') ? 1 : 0]
      : undefined;

  if (!isObject(roundsArgument) || roundsArgument.type !== 'NumericLiteral') {
    return undefined;
  }

  return roundsArgument;
};

const buildPasswordHashingMatch = (node: unknown): TypeScriptPasswordHashingMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    if (!isPasswordHashingCallExpression(value)) {
      return false;
    }
    return ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration');
  });

  if (!match) {
    return undefined;
  }

  const callNode = match.node;
  const callee = isObject(callNode) ? callNode.callee : undefined;
  if (!isObject(callee) || callee.type !== 'MemberExpression') {
    return undefined;
  }

  const rawMethodName = methodNameFromNode(callee.property);
  const methodName = rawMethodName?.toLowerCase();
  const libraryName = methodNameFromNode(callee.object);
  if (
    typeof methodName !== 'string' ||
    typeof libraryName !== 'string' ||
    !bcryptLibraryPattern.test(libraryName)
  ) {
    return undefined;
  }

  const roundsNode = passwordHashingRoundLiteralFromCall(callNode, methodName);
  if (!roundsNode || typeof roundsNode.value !== 'number' || roundsNode.value >= 10) {
    return undefined;
  }

  const roundsValue = Math.trunc(roundsNode.value);
  const callLine = toPositiveLine(callNode);
  const roundsLine = toPositiveLine(roundsNode);
  const primaryNode =
    semanticOwnerFromAncestors(match.ancestors) ?? {
      kind: 'call',
      name: `${libraryName}.${rawMethodName ?? methodName}`,
      lines: toSingleLineArray(callLine),
    };

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'call',
      name: `${libraryName}.${rawMethodName ?? methodName}`,
      lines: toSingleLineArray(callLine),
    },
    {
      kind: 'member',
      name: `salt rounds: ${roundsValue}`,
      lines: toSingleLineArray(roundsLine),
    },
  ]);

  const lines = sortedUniqueLines([
    ...(primaryNode.lines ?? []),
    ...(typeof callLine === 'number' ? [callLine] : []),
    ...(typeof roundsLine === 'number' ? [roundsLine] : []),
  ]);

  return {
    lines,
    primary_node: primaryNode,
    related_nodes: relatedNodes,
    why:
      `${primaryNode.kind === 'class' ? `La clase ${primaryNode.name}` : `El miembro ${primaryNode.name}`} ` +
      `usa ${libraryName}.${rawMethodName ?? methodName} con salt rounds ${roundsValue}, por debajo del mínimo seguro de 10.`,
    impact:
      'El hash de contraseñas pierde resistencia frente a fuerza bruta y ataques offline, elevando el riesgo de compromisos si la base de datos se ve expuesta.',
    expected_fix:
      'Sube bcrypt salt rounds a 10 o más y centraliza el valor en una constante o configuración explícita compartida.',
  };
};

export const hasPasswordHashingPattern = (node: unknown): boolean => {
  return typeof findPasswordHashingPatternMatch(node) !== 'undefined';
};

export const findPasswordHashingPatternMatch = (
  node: unknown
): TypeScriptPasswordHashingMatch | undefined => {
  return buildPasswordHashingMatch(node);
};

const throttlerSetupMethodNames = new Set(['forroot', 'forrootasync']);

const isNestJsThrottlerSetupCall = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callee = node.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression' || callee.computed === true) {
    return false;
  }

  const methodName = methodNameFromNode(callee.property)?.toLowerCase();
  if (!methodName || !throttlerSetupMethodNames.has(methodName)) {
    return false;
  }

  const objectName = methodNameFromNode(callee.object);
  return objectName === 'ThrottlerModule';
};

const isNestJsThrottleDecoratorCall = (node: AstNode): boolean => {
  if (node.type !== 'Decorator') {
    return false;
  }

  const expression = node.expression;
  if (!isObject(expression) || expression.type !== 'CallExpression') {
    return false;
  }

  const calleeName = methodNameFromNode(expression.callee);
  if (calleeName === 'Throttle') {
    return true;
  }

  if (calleeName !== 'UseGuards' || !Array.isArray(expression.arguments)) {
    return false;
  }

  return expression.arguments.some((argument) => methodNameFromNode(argument) === 'ThrottlerGuard');
};

const buildRateLimitingThrottlerMatch = (
  node: unknown
): TypeScriptRateLimitingThrottlerMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    if (value.type === 'Decorator') {
      return isNestJsThrottleDecoratorCall(value) && ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration');
    }
    if (value.type === 'CallExpression') {
      return isNestJsThrottlerSetupCall(value) && ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration');
    }
    return false;
  });

  if (!match) {
    return undefined;
  }

  const matchedNode = match.node;
  const decoratorExpression =
    matchedNode.type === 'Decorator' && isObject(matchedNode.expression)
      ? matchedNode.expression
      : undefined;
  const callExpression =
    matchedNode.type === 'CallExpression' ? matchedNode : decoratorExpression;
  if (!callExpression) {
    return undefined;
  }

  const calleeName = methodNameFromNode(isObject(callExpression) ? callExpression.callee : undefined);
  const ownerNode =
    semanticOwnerFromAncestors(match.ancestors) ?? {
      kind: 'member',
      name: calleeName ?? 'Throttler',
      lines: toSingleLineArray(toPositiveLine(matchedNode)),
    };

  const callLine = toPositiveLine(matchedNode);
  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'call',
      name: calleeName ?? 'Throttler',
      lines: toSingleLineArray(callLine),
    },
    ...(calleeName === 'Throttle'
      ? [
          {
            kind: 'member',
            name: '@nestjs/throttler',
            lines: toSingleLineArray(callLine),
          },
        ]
      : []),
    ...(calleeName === 'UseGuards'
      ? [
          {
            kind: 'member',
            name: 'ThrottlerGuard',
            lines: toSingleLineArray(callLine),
          },
        ]
      : []),
    ...(calleeName === 'forRoot' || calleeName === 'forRootAsync'
      ? [
          {
            kind: 'member',
            name: 'ThrottlerModule',
            lines: toSingleLineArray(callLine),
          },
        ]
      : []),
  ]);

  const lines = sortedUniqueLines([
    ...(ownerNode.lines ?? []),
    ...(typeof callLine === 'number' ? [callLine] : []),
    ...relatedNodes.flatMap((entry) => entry.lines ?? []),
  ]);

  const ownerLabel =
    ownerNode.kind === 'class'
      ? `La clase ${ownerNode.name}`
      : ownerNode.kind === 'member'
        ? `El miembro ${ownerNode.name}`
        : `La llamada ${ownerNode.name}`;

  return {
    lines,
    primary_node: ownerNode,
    related_nodes: relatedNodes,
    why:
      `${ownerLabel} aplica rate limiting con @nestjs/throttler para limitar intentos y frenar abuso o fuerza bruta.`,
    impact:
      'La aplicación mantiene visible el perímetro de protección y reduce el riesgo de brute force, abuso de endpoints y saturación de tráfico.',
    expected_fix:
      'Mantén ThrottlerModule, @Throttle o ThrottlerGuard configurados explícitamente para los endpoints públicos o sensibles.',
  };
};

export const hasRateLimitingThrottlerPattern = (node: unknown): boolean => {
  return typeof buildRateLimitingThrottlerMatch(node) !== 'undefined';
};

export const findRateLimitingThrottlerMatch = (
  node: unknown
): TypeScriptRateLimitingThrottlerMatch | undefined => {
  return buildRateLimitingThrottlerMatch(node);
};

const isWinstonStructuredLoggerCall = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callee = node.callee;
  if (!isObject(callee)) {
    return false;
  }

  if (callee.type === 'Identifier') {
    return callee.name === 'createLogger';
  }

  if (callee.type !== 'MemberExpression' || callee.computed === true) {
    return false;
  }

  const methodName = methodNameFromNode(callee.property);
  if (methodName !== 'createLogger') {
    return false;
  }

  const objectName = methodNameFromNode(callee.object) ?? memberExpressionPropertyName(callee.object);
  return objectName === 'winston';
};

const isWinstonJsonFormatCall = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callee = node.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression' || callee.computed === true) {
    return false;
  }

  if (methodNameFromNode(callee.property) !== 'json') {
    return false;
  }

  const objectName = methodNameFromNode(callee.object) ?? memberExpressionPropertyName(callee.object);
  return objectName === 'format';
};

const buildWinstonStructuredLoggerMatch = (
  node: unknown
): TypeScriptWinstonStructuredLoggerMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    return isWinstonStructuredLoggerCall(value) && ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration');
  });

  if (!match) {
    return undefined;
  }

  const callNode = match.node;
  const jsonFormatNode = findFirstNode(callNode, (value) => isWinstonJsonFormatCall(value));
  if (!jsonFormatNode) {
    return undefined;
  }

  const callLine = toPositiveLine(callNode);
  const jsonLine = toPositiveLine(jsonFormatNode);
  const callee = callNode.callee;
  const calleeName =
    isObject(callee) && callee.type === 'MemberExpression'
      ? `${methodNameFromNode(callee.object) ?? 'winston'}.${methodNameFromNode(callee.property) ?? 'createLogger'}`
      : 'createLogger';
  const ownerNode =
    semanticOwnerFromAncestors(match.ancestors) ?? {
      kind: 'member',
      name: calleeName,
      lines: toSingleLineArray(callLine),
    };

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'call',
      name: calleeName,
      lines: toSingleLineArray(callLine),
    },
    {
      kind: 'member',
      name: 'format.json',
      lines: toSingleLineArray(jsonLine),
    },
  ]);

  const lines = sortedUniqueLines([
    ...(ownerNode.lines ?? []),
    ...(typeof callLine === 'number' ? [callLine] : []),
    ...(typeof jsonLine === 'number' ? [jsonLine] : []),
    ...relatedNodes.flatMap((entry) => entry.lines ?? []),
  ]);

  const ownerLabel =
    ownerNode.kind === 'class'
      ? `La clase ${ownerNode.name}`
      : ownerNode.kind === 'member'
        ? `El miembro ${ownerNode.name}`
        : `La llamada ${ownerNode.name}`;

  return {
    lines,
    primary_node: ownerNode,
    related_nodes: relatedNodes,
    why: `${ownerLabel} configura Winston con JSON logs estructurados para emitir trazas parseables.`,
    impact:
      'Los logs quedan estructurados para agregadores, facilitan correlation IDs y reducen parsing frágil de texto plano.',
    expected_fix:
      'Mantén createLogger con format.json() o un formato estructurado equivalente y evita logs de texto plano en backend.',
  };
};

export const hasWinstonStructuredLoggerPattern = (node: unknown): boolean => {
  return typeof buildWinstonStructuredLoggerMatch(node) !== 'undefined';
};

export const findWinstonStructuredLoggerMatch = (
  node: unknown
): TypeScriptWinstonStructuredLoggerMatch | undefined => {
  return buildWinstonStructuredLoggerMatch(node);
};

export const hasConsoleErrorCall = (node: unknown): boolean => {
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

export const hasEvalCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    return isObject(callee) && callee.type === 'Identifier' && callee.name === 'eval';
  });
};

export const hasFunctionConstructorUsage = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'NewExpression') {
      return false;
    }
    const callee = value.callee;
    return isObject(callee) && callee.type === 'Identifier' && callee.name === 'Function';
  });
};

export const hasSetTimeoutStringCallback = (node: unknown): boolean => {
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

export const hasSetIntervalStringCallback = (node: unknown): boolean => {
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

export const hasAsyncPromiseExecutor = (node: unknown): boolean => {
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

const callbackHellMemberNames = new Set(['then', 'catch', 'finally']);

const isCallbackFunctionNode = (node: unknown): node is AstNode => {
  return (
    isObject(node) &&
    (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression')
  );
};

const callbackHellCallMemberName = (node: AstNode): string | undefined => {
  if (node.type !== 'CallExpression') {
    return undefined;
  }

  const callee = node.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression' || callee.computed === true) {
    return undefined;
  }

  const memberName = memberExpressionPropertyName(callee);
  return typeof memberName === 'string' && memberName.length > 0 ? memberName : undefined;
};

const callbackHellCallbackArgument = (node: AstNode): AstNode | undefined => {
  if (node.type !== 'CallExpression' || !Array.isArray(node.arguments)) {
    return undefined;
  }

  return node.arguments.find(isCallbackFunctionNode);
};

const callExpressionIsPromiseCallbackCall = (node: AstNode): boolean => {
  const memberName = callbackHellCallMemberName(node);
  if (!memberName || !callbackHellMemberNames.has(memberName)) {
    return false;
  }

  const callbackArgument = callbackHellCallbackArgument(node);
  return typeof callbackArgument !== 'undefined';
};

const callExpressionHasCallbackHellPattern = (node: AstNode): boolean => {
  if (!callExpressionIsPromiseCallbackCall(node)) {
    return false;
  }

  const callbackArgument = callbackHellCallbackArgument(node);
  if (!callbackArgument) {
    return false;
  }

  return hasNode(callbackArgument.body, (nested) => {
    return nested.type === 'CallExpression' && callExpressionIsPromiseCallbackCall(nested);
  });
};

const buildCallbackHellPatternMatch = (
  node: unknown
): TypeScriptCallbackHellMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value) => {
    return value.type === 'CallExpression' && callExpressionHasCallbackHellPattern(value);
  });

  if (!match) {
    return undefined;
  }

  const outerCall = match.node;
  const callbackArgument = callbackHellCallbackArgument(outerCall);
  if (!callbackArgument) {
    return undefined;
  }

  const nestedCall = findFirstNode(callbackArgument.body, (value) => {
    return value.type === 'CallExpression' && callExpressionIsPromiseCallbackCall(value);
  });

  const outerCallName = callbackHellCallMemberName(outerCall) ?? 'callback';
  const nestedCallName =
    nestedCall && callbackHellCallMemberName(nestedCall)
      ? callbackHellCallMemberName(nestedCall)
      : 'callback';
  const primaryNode =
    semanticOwnerFromAncestors(match.ancestors) ?? {
      kind: 'call',
      name: `${outerCallName} callback chain`,
      lines: toSingleLineArray(toPositiveLine(outerCall)),
    };
  const relatedNodes = dedupeSemanticNodes(
    [
      {
        kind: 'call',
        name: `${outerCallName} callback`,
        lines: toSingleLineArray(toPositiveLine(outerCall)),
      },
      nestedCall
        ? {
            kind: 'call',
            name: `${nestedCallName} nested callback`,
            lines: toSingleLineArray(toPositiveLine(nestedCall)),
          }
        : undefined,
    ].filter((entry): entry is TypeScriptSemanticNode => entry !== undefined)
  );
  const lines = sortedUniqueLines([
    ...(primaryNode.lines ?? []),
    ...(typeof toPositiveLine(outerCall) === 'number' ? [toPositiveLine(outerCall)!] : []),
    ...(typeof toPositiveLine(callbackArgument) === 'number'
      ? [toPositiveLine(callbackArgument)!]
      : []),
    ...(typeof nestedCall !== 'undefined' && typeof toPositiveLine(nestedCall) === 'number'
      ? [toPositiveLine(nestedCall)!]
      : []),
  ]);

  return {
    lines,
    primary_node: primaryNode,
    related_nodes: relatedNodes,
    why:
      `${primaryNode.kind === 'class' ? `La clase ${primaryNode.name}` : `El miembro ${primaryNode.name}`} ` +
      'encadena callbacks anidados con Promise.then/catch/finally en lugar de aplanar el flujo con async/await.',
    impact:
      'El flujo asíncrono se vuelve difícil de leer, de testear y de extender, con callbacks anidados que multiplican la complejidad accidental.',
    expected_fix:
      'Convierte la cadena a async/await o separa la secuencia en pasos lineales para eliminar la anidación de callbacks.',
  };
};

const buildMagicNumberPatternMatch = (
  node: unknown
): TypeScriptMagicNumberMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    if (value.type !== 'NumericLiteral' || typeof value.value !== 'number') {
      return false;
    }

    return !ancestors.some((ancestor) => {
      return (
        ancestor.type === 'TSEnumMember' ||
        ancestor.type === 'TSLiteralType' ||
        ancestor.type === 'ImportDeclaration' ||
        ancestor.type === 'ExportNamedDeclaration' ||
        ancestor.type === 'ExportDefaultDeclaration' ||
        ancestor.type === 'ExportAllDeclaration'
      );
    });
  });

  if (!match) {
    return undefined;
  }

  const literalNode = match.node;
  const literalValue = typeof literalNode.value === 'number' ? literalNode.value : undefined;
  const literalLine = toPositiveLine(literalNode);
  const primaryNode =
    semanticOwnerFromAncestors(match.ancestors) ?? {
      kind: 'member',
      name: `magic number: ${literalValue ?? 'unknown'}`,
      lines: toSingleLineArray(literalLine),
    };

  const lines = sortedUniqueLines([
    ...(primaryNode.lines ?? []),
    ...(typeof literalLine === 'number' ? [literalLine] : []),
  ]);

  return {
    lines,
    primary_node: primaryNode,
    related_nodes: [
      {
        kind: 'member',
        name: `numeric literal: ${literalValue ?? 'unknown'}`,
        lines: toSingleLineArray(literalLine),
      },
    ],
    why:
      `${primaryNode.kind === 'class' ? `La clase ${primaryNode.name}` : `El miembro ${primaryNode.name}`} ` +
      `usa el literal numérico ${literalValue ?? 'unknown'} sin una constante con nombre descriptivo.`,
    impact:
      'El valor pierde contexto de dominio, dificulta la lectura y vuelve más costoso cambiar la intención del código sin romper comportamiento.',
    expected_fix:
      'Extrae el valor a una constante o enum con nombre descriptivo y úsalo desde ahí para documentar su intención.',
  };
};

const hardcodedConfigNameTokens = [
  'api',
  'base',
  'config',
  'endpoint',
  'env',
  'feature',
  'host',
  'key',
  'locale',
  'mode',
  'password',
  'port',
  'region',
  'secret',
  'timeout',
  'token',
  'url',
  'currency',
  'clientid',
  'clientsecret',
  'retry',
  'retries',
  'limit',
  'offset',
];

const normalizeIdentifierName = (value: string): string => {
  return value.replace(/[^a-z0-9]+/gi, '').toLowerCase();
};

const hardcodedValueNameFromNode = (node: unknown): string | undefined => {
  if (!isObject(node)) {
    return undefined;
  }

  if (node.type === 'Identifier' && typeof node.name === 'string') {
    return node.name;
  }

  if (node.type === 'StringLiteral' && typeof node.value === 'string') {
    return node.value;
  }

  if (node.type === 'NumericLiteral' && typeof node.value === 'number') {
    return String(node.value);
  }

  if (node.type === 'BooleanLiteral' && typeof node.value === 'boolean') {
    return String(node.value);
  }

  return undefined;
};

const hardcodedValueAssignmentContextFromAncestors = (
  ancestors: ReadonlyArray<AstNode>
): { ownerName?: string; ownerKind: TypeScriptSemanticNode['kind']; ownerLine: number | null } | undefined => {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];

    if (ancestor.type === 'VariableDeclarator') {
      const ownerName = hardcodedValueNameFromNode(ancestor.id);
      if (typeof ownerName === 'string' && ownerName.length > 0) {
        return {
          ownerName,
          ownerKind: 'member',
          ownerLine: toPositiveLine(ancestor),
        };
      }
    }

    if (ancestor.type === 'ObjectProperty' || ancestor.type === 'ClassProperty') {
      const ownerName = hardcodedValueNameFromNode(ancestor.key);
      if (typeof ownerName === 'string' && ownerName.length > 0) {
        return {
          ownerName,
          ownerKind: 'member',
          ownerLine: toPositiveLine(ancestor),
        };
      }
    }

    if (ancestor.type === 'AssignmentExpression') {
      const ownerName = hardcodedValueNameFromNode(ancestor.left);
      if (typeof ownerName === 'string' && ownerName.length > 0) {
        return {
          ownerName,
          ownerKind: 'member',
          ownerLine: toPositiveLine(ancestor),
        };
      }
    }
  }

  return undefined;
};

const isProcessEnvBaseAccess = (node: unknown): boolean => {
  if (!isObject(node) || node.type !== 'MemberExpression') {
    return false;
  }

  const object = node.object;
  const property = node.property;

  if (
    !isObject(object) ||
    object.type !== 'Identifier' ||
    object.name !== 'process' ||
    !isObject(property) ||
    property.type !== 'Identifier' ||
    property.name !== 'env'
  ) {
    return false;
  }

  return true;
};

const processEnvFallbackContextFromAncestors = (
  value: AstNode,
  ancestors: ReadonlyArray<AstNode>
): { ownerName?: string; ownerKind: TypeScriptSemanticNode['kind']; ownerLine: number | null } | undefined => {
  if (!ancestors.some((ancestor) => ancestor.type === 'ObjectPattern')) {
    return undefined;
  }

  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (ancestor.type !== 'VariableDeclarator' || !isProcessEnvBaseAccess(ancestor.init)) {
      continue;
    }

    const ownerName = hardcodedValueNameFromNode(value.left);
    if (typeof ownerName !== 'string' || ownerName.length === 0) {
      continue;
    }

    return {
      ownerName,
      ownerKind: 'member',
      ownerLine: toPositiveLine(value),
    };
  }

  return undefined;
};

const buildEnvDefaultFallbackPatternMatch = (
  node: unknown
): TypeScriptEnvDefaultFallbackMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    if (value.type === 'LogicalExpression') {
      if (value.operator !== '||' && value.operator !== '??') {
        return false;
      }
      return typeof memberExpressionPropertyName(value.left) === 'string' && isProcessEnvBaseAccess(value.left.object);
    }

    if (value.type !== 'AssignmentPattern') {
      return false;
    }

    return typeof processEnvFallbackContextFromAncestors(value, ancestors) !== 'undefined';
  });

  if (!match) {
    return undefined;
  }

  const fallbackNode = match.node;
  const fallbackLine = toPositiveLine(fallbackNode);
  const fallbackContext =
    fallbackNode.type === 'AssignmentPattern'
      ? processEnvFallbackContextFromAncestors(fallbackNode, match.ancestors)
      : undefined;
  const ownerName =
    fallbackNode.type === 'LogicalExpression'
      ? memberExpressionPropertyName(fallbackNode.left)
      : fallbackContext?.ownerName;

  if (typeof ownerName !== 'string' || ownerName.length === 0) {
    return undefined;
  }

  const primaryNode: TypeScriptSemanticNode = {
    kind: fallbackContext?.ownerKind ?? 'member',
    name: ownerName,
    lines: toSingleLineArray(fallbackContext?.ownerLine ?? fallbackLine),
  };

  const fallbackLiteral = (() => {
    if (fallbackNode.type === 'LogicalExpression') {
      return hardcodedValueNameFromNode(fallbackNode.right);
    }
    if (fallbackNode.type === 'AssignmentPattern') {
      return hardcodedValueNameFromNode(fallbackNode.right);
    }
    return undefined;
  })();

  const lines = sortedUniqueLines([
    ...(primaryNode.lines ?? []),
    ...(typeof fallbackLine === 'number' ? [fallbackLine] : []),
  ]);

  return {
    lines,
    primary_node: primaryNode,
    related_nodes: [
      {
        kind: 'member',
        name: `fallback value: ${String(fallbackLiteral ?? 'unknown')}`,
        lines: toSingleLineArray(fallbackLine),
      },
    ],
    why:
      `La variable de entorno ${ownerName} usa un fallback implícito en lugar de fallar de forma explícita ` +
      'cuando falta configuración crítica en producción.',
    impact:
      'El proceso puede arrancar con defaults silenciosos, ocultar errores de despliegue y desalinear el comportamiento entre entornos.',
    expected_fix:
      'Valida la configuración al arrancar y falla de forma explícita si falta en producción; usa defaults solo en desarrollo si la política lo permite.',
  };
};

const buildHardcodedValuePatternMatch = (
  node: unknown
): TypeScriptHardcodedValueMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    if (
      value.type !== 'StringLiteral' &&
      value.type !== 'NumericLiteral' &&
      value.type !== 'BooleanLiteral'
    ) {
      return false;
    }

    const context = hardcodedValueAssignmentContextFromAncestors(ancestors);
    if (!context?.ownerName) {
      return false;
    }

    const normalizedOwner = normalizeIdentifierName(context.ownerName);
    return hardcodedConfigNameTokens.some((token) => normalizedOwner.includes(token));
  });

  if (!match) {
    return undefined;
  }

  const literalNode = match.node;
  const literalLine = toPositiveLine(literalNode);
  const literalValue = isObject(literalNode)
    ? literalNode.type === 'StringLiteral' || literalNode.type === 'NumericLiteral' || literalNode.type === 'BooleanLiteral'
      ? literalNode.value
      : undefined
    : undefined;
  const context = hardcodedValueAssignmentContextFromAncestors(match.ancestors);
  const ownerName = context?.ownerName ?? 'config value';
  const primaryNode: TypeScriptSemanticNode =
    semanticOwnerFromAncestors(match.ancestors) ?? {
      kind: context?.ownerKind ?? 'member',
      name: ownerName,
      lines: toSingleLineArray(context?.ownerLine ?? literalLine),
    };

  const lines = sortedUniqueLines([
    ...(primaryNode.lines ?? []),
    ...(typeof literalLine === 'number' ? [literalLine] : []),
    ...(typeof context?.ownerLine === 'number' ? [context.ownerLine] : []),
  ]);

  return {
    lines,
    primary_node: primaryNode,
    related_nodes: [
      {
        kind: 'member',
        name: `hardcoded value: ${String(literalValue ?? 'unknown')}`,
        lines: toSingleLineArray(literalLine),
      },
    ],
    why:
      `${primaryNode.kind === 'class' ? `La clase ${primaryNode.name}` : `El miembro ${primaryNode.name}`} ` +
      'embebe un valor de configuración como literal en lugar de resolverlo desde variables de entorno o una fuente de configuración explícita.',
    impact:
      'La configuración queda acoplada al código, se complica su promoción entre entornos y se vuelve más costoso rotar valores sensibles o cambiar defaults.',
    expected_fix:
      'Extrae el valor a variables de entorno o a una fuente de configuración explícita y deja el código libre de literales de configuración.',
  };
};

export const hasCallbackHellPattern = (node: unknown): boolean => {
  return hasNode(node, (value) => value.type === 'CallExpression' && callExpressionHasCallbackHellPattern(value));
};

export const findCallbackHellPatternMatch = (
  node: unknown
): TypeScriptCallbackHellMatch | undefined => {
  return buildCallbackHellPatternMatch(node);
};

export const hasMagicNumberPattern = (node: unknown): boolean => {
  return hasNode(node, (value) => value.type === 'NumericLiteral' && typeof value.value === 'number');
};

export const findMagicNumberPatternMatch = (
  node: unknown
): TypeScriptMagicNumberMatch | undefined => {
  return buildMagicNumberPatternMatch(node);
};

export const hasHardcodedValuePattern = (node: unknown): boolean => {
  return buildHardcodedValuePatternMatch(node) !== undefined;
};

export const findHardcodedValuePatternMatch = (
  node: unknown
): TypeScriptHardcodedValueMatch | undefined => {
  return buildHardcodedValuePatternMatch(node);
};

export const hasEnvDefaultFallbackPattern = (node: unknown): boolean => {
  return typeof findEnvDefaultFallbackPatternMatch(node) !== 'undefined';
};

export const findEnvDefaultFallbackPatternMatch = (
  node: unknown
): TypeScriptEnvDefaultFallbackMatch | undefined => {
  return buildEnvDefaultFallbackPatternMatch(node);
};

export const hasWithStatement = (node: unknown): boolean => {
  return hasNode(node, (value) => value.type === 'WithStatement');
};

export const hasDeleteOperator = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    return value.type === 'UnaryExpression' && value.operator === 'delete';
  });
};

export const hasDebuggerStatement = (node: unknown): boolean => {
  return hasNode(node, (value) => value.type === 'DebuggerStatement');
};

export const hasMixedCommandQueryClass = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'ClassDeclaration' && value.type !== 'ClassExpression') {
      return false;
    }

    const methodNames = collectClassMethodDescriptors(value).map((descriptor) => descriptor.name);
    return hasMixedCommandAndQueryNames(methodNames);
  });
};

export const findMixedCommandQueryClassMatch = (
  node: unknown
): TypeScriptSolidSrpClassMatch | undefined => {
  const classNode = findFirstNode(node, (value) => {
    if (value.type !== 'ClassDeclaration' && value.type !== 'ClassExpression') {
      return false;
    }
    const methodNames = collectClassMethodDescriptors(value).map((descriptor) => descriptor.name);
    return hasMixedCommandAndQueryNames(methodNames);
  });

  return classNode ? buildMixedCommandQueryClassMatch(classNode) : undefined;
};

export const findMixedCommandQueryClassLines = (
  node: unknown
): readonly number[] => {
  return findMixedCommandQueryClassMatch(node)?.lines ?? [];
};

export const hasMixedCommandQueryInterface = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'TSInterfaceDeclaration') {
      return false;
    }

    const interfaceBody = value.body;
    if (!isObject(interfaceBody) || !Array.isArray(interfaceBody.body)) {
      return false;
    }

    const methodNames: string[] = [];
    for (const member of interfaceBody.body) {
      if (!isObject(member)) {
        continue;
      }

      if (member.type === 'TSMethodSignature') {
        const name = methodNameFromNode(member.key);
        if (typeof name === 'string' && name.length > 0) {
          methodNames.push(name);
        }
        continue;
      }

      if (member.type === 'TSPropertySignature') {
        const name = methodNameFromNode(member.key);
        const memberType = member.typeAnnotation;
        if (
          typeof name === 'string' &&
          name.length > 0 &&
          isObject(memberType) &&
          isObject(memberType.typeAnnotation) &&
          memberType.typeAnnotation.type === 'TSFunctionType'
        ) {
          methodNames.push(name);
        }
      }
    }

    return hasMixedCommandAndQueryNames(methodNames);
  });
};

export const findMixedCommandQueryInterfaceMatch = (
  node: unknown
): TypeScriptSolidIspMatch | undefined => {
  return buildSolidIspMatch(node);
};

export const hasTypeDiscriminatorSwitch = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'SwitchStatement') {
      return false;
    }

    const discriminator = value.discriminant;
    const discriminatorName =
      methodNameFromNode(discriminator) ?? memberExpressionPropertyName(discriminator);
    if (!discriminatorName || !solidDiscriminatorPattern.test(discriminatorName)) {
      return false;
    }

    if (!Array.isArray(value.cases)) {
      return false;
    }

    const typedCases = value.cases.filter((entry) => {
      if (!isObject(entry) || entry.type !== 'SwitchCase' || !isObject(entry.test)) {
        return false;
      }
      const testNode = entry.test;
      return (
        testNode.type === 'StringLiteral' ||
        testNode.type === 'NumericLiteral' ||
        testNode.type === 'BooleanLiteral'
      );
    });

    const [firstTypedCase, secondTypedCase] = typedCases;
    return firstTypedCase !== undefined && secondTypedCase !== undefined;
  });
};

export const findTypeDiscriminatorSwitchMatch = (
  node: unknown
): TypeScriptSolidOcpMatch | undefined => {
  return buildSolidOcpMatch(node);
};

export const hasOverrideMethodThrowingNotImplemented = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'ClassMethod' || value.override !== true) {
      return false;
    }

    const body = value.body;
    if (!isObject(body) || !Array.isArray(body.body)) {
      return false;
    }

    return hasNode(body, (nested) => {
      if (nested.type !== 'ThrowStatement') {
        return false;
      }

      const argumentNode = nested.argument;
      if (!isObject(argumentNode)) {
        return false;
      }

      if (argumentNode.type === 'NewExpression') {
        const calleeName = methodNameFromNode(argumentNode.callee);
        if (calleeName !== 'Error' || !Array.isArray(argumentNode.arguments)) {
          return false;
        }
        const firstArg = argumentNode.arguments[0];
        const text = literalTextFromNode(firstArg);
        return typeof text === 'string' && notImplementedPattern.test(text);
      }

      const throwText = literalTextFromNode(argumentNode);
      return typeof throwText === 'string' && notImplementedPattern.test(throwText);
    });
  });
};

export const findOverrideMethodThrowingNotImplementedMatch = (
  node: unknown
): TypeScriptSolidLspMatch | undefined => {
  return buildSolidLspMatch(node);
};

export const hasFrameworkDependencyImport = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    return typeof frameworkDependencyImportSourceFromNode(value) === 'string';
  });
};

export const findFrameworkDependencyImportMatch = (
  node: unknown
): TypeScriptSolidDipMatch | undefined => {
  return buildSolidDipMatch(node, 'framework-import');
};

export const hasConcreteDependencyInstantiation = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    return typeof concreteDependencyNameFromNode(value) === 'string';
  });
};

export const findConcreteDependencyInstantiationMatch = (
  node: unknown
): TypeScriptSolidDipMatch | undefined => {
  return buildSolidDipMatch(node, 'concrete-instantiation');
};

const buildCleanArchitectureMatch = (
  node: unknown
): TypeScriptCleanArchitectureMatch | undefined => {
  const dipMatch = buildSolidDipMatch(node, 'framework-import') ?? buildSolidDipMatch(node, 'concrete-instantiation');
  if (!dipMatch) {
    return undefined;
  }

  const primaryLabel =
    dipMatch.primary_node.kind === 'class'
      ? `La clase ${dipMatch.primary_node.name}`
      : dipMatch.primary_node.kind === 'member'
        ? `El miembro ${dipMatch.primary_node.name}`
        : `La llamada ${dipMatch.primary_node.name}`;

  const dependencySummary = dipMatch.related_nodes
    .map((entry) => entry.name)
    .join(' y ');

  return {
    ...dipMatch,
    why:
      `${primaryLabel} cruza la frontera de Clean Architecture al depender de ${dependencySummary}, ` +
      'mezclando capas y empujando la infraestructura hacia el centro del dominio.',
    impact:
      'La dirección de dependencias deja de apuntar hacia dentro, las capas se mezclan y el código de alto nivel queda acoplado a detalles concretos.',
    expected_fix:
      'Introduce un puerto o abstracción en domain/application y mueve la dependencia concreta al composition root o a infrastructure.',
  };
};

export const findCleanArchitectureMatch = (
  node: unknown
): TypeScriptCleanArchitectureMatch | undefined => {
  return buildCleanArchitectureMatch(node);
};

const productionMockLibraryPattern = /^(jest|vi)$/;

const buildProductionMockMatch = (
  node: unknown
): TypeScriptProductionMockMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
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
      productionMockLibraryPattern.test(objectNode.name) &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'mock' &&
      ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration')
    );
  });

  if (!match) {
    return undefined;
  }

  const callNode = match.node;
  const callLine = toPositiveLine(callNode);
  const callee = isObject(callNode) ? callNode.callee : undefined;
  const libraryName =
    isObject(callee) && isObject(callee.object) && callee.object.type === 'Identifier'
      ? callee.object.name
      : undefined;
  const callName =
    typeof libraryName === 'string' && productionMockLibraryPattern.test(libraryName)
      ? `${libraryName}.mock`
      : 'mock';
  const primaryNode =
    semanticOwnerFromAncestors(match.ancestors) ?? {
      kind: 'call',
      name: callName,
      lines: toSingleLineArray(callLine),
    };
  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'call',
      name: callName,
      lines: toSingleLineArray(callLine),
    },
  ]);
  const ownerLabel =
    primaryNode.kind === 'class'
      ? `La clase ${primaryNode.name}`
      : primaryNode.kind === 'member'
        ? `El miembro ${primaryNode.name}`
        : `La llamada ${primaryNode.name}`;

  const lines = sortedUniqueLines([
    ...(primaryNode.lines ?? []),
    ...(typeof callLine === 'number' ? [callLine] : []),
  ]);

  return {
    lines,
    primary_node: primaryNode,
    related_nodes: relatedNodes,
    why:
      `${ownerLabel} usa ${callName} en código de producción, sustituyendo dependencias reales por dobles y ocultando el comportamiento productivo.`,
    impact:
      'La lógica deja de ejecutarse contra datos y servicios reales, lo que puede enmascarar errores de integración y degradar la observabilidad del flujo productivo.',
    expected_fix:
      'Mueve el mocking a tests o fixtures controlados. En producción conserva implementaciones reales y dobles solo donde el contrato lo requiera explícitamente.',
  };
};

export const hasProductionMockCall = (node: unknown): boolean => {
  return typeof buildProductionMockMatch(node) !== 'undefined';
};

export const findProductionMockCallMatch = (
  node: unknown
): TypeScriptProductionMockMatch | undefined => {
  return buildProductionMockMatch(node);
};

const buildExceptionFilterMatch = (
  node: unknown
): TypeScriptExceptionFilterMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    if (value.type !== 'ClassDeclaration' && value.type !== 'ClassExpression') {
      return false;
    }

    const className = classNameFromNode(value);
    if (!className) {
      return false;
    }

    const classBody = value.body;
    if (!isObject(classBody) || !Array.isArray(classBody.body)) {
      return false;
    }

    const hasCatchMethod = classBody.body.some((member) => {
      if (!isObject(member) || member.type !== 'ClassMethod') {
        return false;
      }
      const keyName = methodNameFromNode(member.key);
      return keyName === 'catch';
    });

    const implementsExceptionFilter = Array.isArray(value.implements)
      ? value.implements.some((entry) => {
          return (
            isObject(entry) &&
            typeof entry.expression === 'string' &&
            /ExceptionFilter$/u.test(entry.expression)
          );
        })
      : false;

    const hasCatchDecorator = hasNode(value, (nested) => {
      if (nested.type !== 'Decorator') {
        return false;
      }
      const expression = nested.expression;
      if (!isObject(expression)) {
        return false;
      }
      if (expression.type === 'CallExpression') {
        const calleeName = methodNameFromNode(expression.callee);
        return calleeName === 'Catch';
      }
      return methodNameFromNode(expression) === 'Catch';
    });

    return (implementsExceptionFilter || hasCatchDecorator) && hasCatchMethod && ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration');
  });

  if (!match) {
    return undefined;
  }

  const classNode = match.node;
  const className = classNameFromNode(classNode);
  if (!className) {
    return undefined;
  }

  const classLine = toPositiveLine(classNode);
  const catchMethod = isObject(classNode.body) && Array.isArray(classNode.body.body)
    ? classNode.body.body.find((member) => {
        return isObject(member) && member.type === 'ClassMethod' && methodNameFromNode(member.key) === 'catch';
      })
    : undefined;
  const catchLine = catchMethod ? toPositiveLine(catchMethod) : undefined;
  const hasCatchDecorator = hasNode(classNode, (nested) => {
    if (nested.type !== 'Decorator') {
      return false;
    }
    const expression = nested.expression;
    if (!isObject(expression)) {
      return false;
    }
    if (expression.type === 'CallExpression') {
      return methodNameFromNode(expression.callee) === 'Catch';
    }
    return methodNameFromNode(expression) === 'Catch';
  });

  const primaryNode = {
    kind: 'class',
    name: className,
    lines: typeof classLine === 'number' ? [classLine] : [],
  };

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'member',
      name: 'catch',
      lines: typeof catchLine === 'number' ? [catchLine] : [],
    },
    ...(hasCatchDecorator
      ? [
          {
            kind: 'member',
            name: '@Catch',
            lines: typeof classLine === 'number' ? [classLine] : [],
          },
        ]
      : []),
  ]);

  const lines = sortedUniqueLines([
    ...(primaryNode.lines ?? []),
    ...(typeof catchLine === 'number' ? [catchLine] : []),
    ...relatedNodes.flatMap((entry) => entry.lines ?? []),
  ]);

  return {
    lines,
    primary_node: primaryNode,
    related_nodes: relatedNodes,
    why:
      `${className} actúa como filtro global de excepciones en producción, centralizando el manejo de errores y evitando que las rutas críticas propaguen fallos sin control.`,
    impact:
      'El manejo de errores queda estandarizado en un punto de extensión del framework, lo que mejora la trazabilidad y reduce respuestas inconsistentes.',
    expected_fix:
      'Mantén el filtro como clase dedicada, con @Catch y catch(), y limita su alcance a la infraestructura de borde sin mezclarlo con lógica de dominio.',
  };
};

export const hasExceptionFilterClass = (node: unknown): boolean => {
  return typeof buildExceptionFilterMatch(node) !== 'undefined';
};

export const findExceptionFilterClassMatch = (
  node: unknown
): TypeScriptExceptionFilterMatch | undefined => {
  return buildExceptionFilterMatch(node);
};

const buildGuardMatch = (node: unknown): TypeScriptGuardMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    if (value.type !== 'Decorator') {
      return false;
    }
    const expression = value.expression;
    if (!isObject(expression) || expression.type !== 'CallExpression') {
      return false;
    }
    const calleeName = methodNameFromNode(expression.callee);
    if (calleeName !== 'UseGuards') {
      return false;
    }
    if (!Array.isArray(expression.arguments) || expression.arguments.length === 0) {
      return false;
    }
    const hasJwtAuthGuard = expression.arguments.some((argument) => {
      const guardName = methodNameFromNode(argument);
      return guardName === 'JwtAuthGuard';
    });
    return hasJwtAuthGuard && ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration');
  });

  if (!match) {
    return undefined;
  }

  const decoratorNode = match.node;
  const expression = isObject(decoratorNode) ? decoratorNode.expression : undefined;
  if (!isObject(expression) || expression.type !== 'CallExpression') {
    return undefined;
  }
  const classOrMemberNode =
    semanticOwnerFromAncestors(match.ancestors) ?? undefined;
  const ownerLine =
    typeof classOrMemberNode?.lines?.[0] === 'number'
      ? classOrMemberNode.lines[0]
      : toPositiveLine(classOrMemberNode ?? decoratorNode);
  const decoratorLine = toPositiveLine(decoratorNode);
  const guardArgument = expression.arguments.find((argument) => methodNameFromNode(argument) === 'JwtAuthGuard');
  const guardLine = toPositiveLine(guardArgument) ?? decoratorLine;
  const ownerName =
    classOrMemberNode?.kind === 'class' || classOrMemberNode?.kind === 'member'
      ? classOrMemberNode.name
      : 'guard';
  const primaryNode =
    classOrMemberNode ?? {
      kind: 'member',
      name: 'UseGuards',
      lines: toSingleLineArray(decoratorLine),
    };
  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'call',
      name: 'UseGuards',
      lines: toSingleLineArray(decoratorLine),
    },
    {
      kind: 'member',
      name: 'JwtAuthGuard',
      lines: toSingleLineArray(guardLine),
    },
  ]);
  const lines = sortedUniqueLines([
    ...(typeof ownerLine === 'number' ? [ownerLine] : []),
    ...(typeof decoratorLine === 'number' ? [decoratorLine] : []),
    ...(typeof guardLine === 'number' ? [guardLine] : []),
    ...relatedNodes.flatMap((entry) => entry.lines ?? []),
  ]);

  return {
    lines,
    primary_node: primaryNode,
    related_nodes: relatedNodes,
    why:
      `${ownerName} aplica @UseGuards(JwtAuthGuard), declarando la protección de la ruta con un guard dedicado para autenticación/autorización.`,
    impact:
      'La ruta depende de un guard explícito del framework, lo que hace visible el perímetro protegido y evita dejar endpoints sensibles sin control.',
    expected_fix:
      'Mantén el guard en el controlador o método protegido y conserva JwtAuthGuard como barrera de entrada concreta.',
  };
};

export const hasGuardUseGuardsJwtAuthGuard = (node: unknown): boolean => {
  return typeof buildGuardMatch(node) !== 'undefined';
};

export const findGuardUseGuardsJwtAuthGuardMatch = (
  node: unknown
): TypeScriptGuardMatch | undefined => {
  return buildGuardMatch(node);
};

const interceptorNameFromNode = (node: unknown): string | undefined => {
  if (!isObject(node)) {
    return undefined;
  }
  if (node.type === 'NewExpression') {
    return methodNameFromNode(node.callee);
  }
  return methodNameFromNode(node);
};

const buildInterceptorMatch = (node: unknown): TypeScriptInterceptorMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    if (value.type !== 'Decorator') {
      return false;
    }
    const expression = value.expression;
    if (!isObject(expression) || expression.type !== 'CallExpression') {
      return false;
    }
    const calleeName = methodNameFromNode(expression.callee);
    if (calleeName !== 'UseInterceptors') {
      return false;
    }
    if (!Array.isArray(expression.arguments) || expression.arguments.length === 0) {
      return false;
    }
    return (
      expression.arguments.some((argument) => {
        const name = interceptorNameFromNode(argument);
        return typeof name === 'string' && /Interceptor$/u.test(name);
      }) &&
      ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration')
    );
  });

  if (!match) {
    return undefined;
  }

  const decoratorNode = match.node;
  const expression = isObject(decoratorNode) ? decoratorNode.expression : undefined;
  if (!isObject(expression) || expression.type !== 'CallExpression') {
    return undefined;
  }

  const classOrMemberNode = semanticOwnerFromAncestors(match.ancestors) ?? undefined;
  const ownerLine =
    typeof classOrMemberNode?.lines?.[0] === 'number'
      ? classOrMemberNode.lines[0]
      : toPositiveLine(classOrMemberNode ?? decoratorNode);
  const decoratorLine = toPositiveLine(decoratorNode);
  const interceptorArgument = expression.arguments.find((argument) => {
    const name = interceptorNameFromNode(argument);
    return typeof name === 'string' && /Interceptor$/u.test(name);
  });
  const interceptorName = interceptorNameFromNode(interceptorArgument) ?? 'Interceptor';
  const interceptorLine = toPositiveLine(interceptorArgument) ?? decoratorLine;
  const ownerName =
    classOrMemberNode?.kind === 'class' || classOrMemberNode?.kind === 'member'
      ? classOrMemberNode.name
      : 'endpoint';
  const primaryNode =
    classOrMemberNode ?? {
      kind: 'member',
      name: 'UseInterceptors',
      lines: toSingleLineArray(decoratorLine),
    };
  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'call',
      name: 'UseInterceptors',
      lines: toSingleLineArray(decoratorLine),
    },
    {
      kind: 'member',
      name: interceptorName,
      lines: toSingleLineArray(interceptorLine),
    },
  ]);
  const lines = sortedUniqueLines([
    ...(typeof ownerLine === 'number' ? [ownerLine] : []),
    ...(typeof decoratorLine === 'number' ? [decoratorLine] : []),
    ...(typeof interceptorLine === 'number' ? [interceptorLine] : []),
    ...relatedNodes.flatMap((entry) => entry.lines ?? []),
  ]);

  return {
    lines,
    primary_node: primaryNode,
    related_nodes: relatedNodes,
    why:
      `${ownerName} aplica @UseInterceptors(${interceptorName}), centralizando logging/transformación en un punto reutilizable en lugar de repetirlo en cada endpoint.`,
    impact:
      'El endpoint depende de un interceptor del framework para logging o transformación, lo que mueve el cross-cutting concern fuera del handler y mejora la consistencia.',
    expected_fix:
      'Mantén el interceptor como componente reutilizable o global y evita copiar @UseInterceptors en cada endpoint si el objetivo es cross-cutting.',
  };
};

export const hasUseInterceptorsLoggingTransform = (node: unknown): boolean => {
  return typeof buildInterceptorMatch(node) !== 'undefined';
};

export const findUseInterceptorsLoggingTransformMatch = (
  node: unknown
): TypeScriptInterceptorMatch | undefined => {
  return buildInterceptorMatch(node);
};

const hasSemanticGodClassResponsibilities = (classNode: AstNode): boolean => {
  const mixesCommandsAndQueries = typeof buildMixedCommandQueryClassMatch(classNode) !== 'undefined';
  const ownsConcreteInfrastructure = hasConcreteDependencyInstantiation(classNode);
  const ownsTypeBranching = hasTypeDiscriminatorSwitch(classNode);
  const weakensBaseContract = hasOverrideMethodThrowingNotImplemented(classNode);

  return (
    (mixesCommandsAndQueries && ownsConcreteInfrastructure) ||
    (mixesCommandsAndQueries && ownsTypeBranching) ||
    (mixesCommandsAndQueries && weakensBaseContract) ||
    (ownsConcreteInfrastructure && ownsTypeBranching) ||
    (ownsConcreteInfrastructure && weakensBaseContract)
  );
};

const buildLargeClassDeclarationMatch = (classNode: AstNode): TypeScriptLargeClassMatch | undefined => {
  if (classNode.type !== 'ClassDeclaration' && classNode.type !== 'ClassExpression') {
    return undefined;
  }

  const commandQueryMatch = buildMixedCommandQueryClassMatch(classNode);
  const concreteDependencyMatch = buildSolidDipMatch(classNode, 'concrete-instantiation');
  const typeBranchingMatch = buildSolidOcpMatch(classNode);
  const weakensBaseContractMatch = buildSolidLspMatch(classNode);

  if (
    !commandQueryMatch &&
    !concreteDependencyMatch &&
    !typeBranchingMatch &&
    !weakensBaseContractMatch
  ) {
    return undefined;
  }

  const mixesCommandsAndQueries = typeof commandQueryMatch !== 'undefined';
  const ownsConcreteInfrastructure = typeof concreteDependencyMatch !== 'undefined';
  const ownsTypeBranching = typeof typeBranchingMatch !== 'undefined';
  const weakensBaseContract = typeof weakensBaseContractMatch !== 'undefined';
  const isGodClass =
    (mixesCommandsAndQueries && ownsConcreteInfrastructure) ||
    (mixesCommandsAndQueries && ownsTypeBranching) ||
    (mixesCommandsAndQueries && weakensBaseContract) ||
    (ownsConcreteInfrastructure && ownsTypeBranching) ||
    (ownsConcreteInfrastructure && weakensBaseContract);

  if (!isGodClass) {
    return undefined;
  }

  const className = classNameFromNode(classNode);
  const classLine = toPositiveLine(classNode);
  const relatedNodes = dedupeSemanticNodes(
    [
      ...(commandQueryMatch?.related_nodes ?? []),
      ...(concreteDependencyMatch?.related_nodes ?? []),
      ...(typeBranchingMatch?.related_nodes ?? []),
      ...(weakensBaseContractMatch?.related_nodes ?? []),
    ].filter((entry): entry is TypeScriptSemanticNode => entry !== undefined)
  );

  const lines = sortedUniqueLines([
    ...(typeof classLine === 'number' ? [classLine] : []),
    ...(commandQueryMatch?.lines ?? []),
    ...(concreteDependencyMatch?.lines ?? []),
    ...(typeBranchingMatch?.lines ?? []),
    ...(weakensBaseContractMatch?.lines ?? []),
    ...relatedNodes.flatMap((entry) => entry.lines ?? []),
  ]);

  const responsibilityLabels = [
    mixesCommandsAndQueries ? 'consultas y comandos' : undefined,
    ownsConcreteInfrastructure ? 'dependencia concreta' : undefined,
    ownsTypeBranching ? 'branching por tipo/kind' : undefined,
    weakensBaseContract ? 'override no implementado' : undefined,
  ].filter((entry): entry is string => typeof entry === 'string');

  return {
    lines,
    primary_node: {
      kind: 'class',
      name: className,
      lines: typeof classLine === 'number' ? [classLine] : lines,
    },
    related_nodes: relatedNodes,
    why:
      `${className} mezcla ${responsibilityLabels.join(', ')} en una sola unidad, ` +
      'rompiendo SRP y convirtiéndose en una candidata a God Class.',
    impact:
      'La clase acumula múltiples razones de cambio, complica tests aislados y hace más costoso separar dominio, aplicación e infraestructura.',
    expected_fix:
      'Divide la clase en colaboradores o casos de uso dedicados; conserva cada clase con una sola responsabilidad y mueve la infraestructura a un adapter o puerto.',
  };
};

export const hasLargeClassDeclaration = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'ClassDeclaration' && value.type !== 'ClassExpression') {
      return false;
    }
    return hasSemanticGodClassResponsibilities(value);
  });
};

export const findLargeClassDeclarationMatch = (
  node: unknown
): TypeScriptLargeClassMatch | undefined => {
  const largeClassNode = findFirstNode(node, (value) => {
    return (
      (value.type === 'ClassDeclaration' || value.type === 'ClassExpression') &&
      hasSemanticGodClassResponsibilities(value)
    );
  });

  return typeof largeClassNode !== 'undefined'
    ? buildLargeClassDeclarationMatch(largeClassNode)
    : undefined;
};

type ReactImportInfo = {
  namespaceAliases: ReadonlySet<string>;
  componentAliases: ReadonlySet<string>;
  importLines: readonly number[];
};

type TypeScriptReactClassComponentMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

const reactImportSourcePattern = /^react$/i;
const reactClassComponentNamePattern = /^(component|purecomponent)$/i;

const collectReactImportInfo = (node: unknown): ReactImportInfo => {
  const namespaceAliases = new Set<string>();
  const componentAliases = new Set<string>();
  const importLines: number[] = [];

  const walk = (value: unknown): void => {
    if (!isObject(value)) {
      return;
    }

    if (value.type === 'ImportDeclaration') {
      const sourceNode = value.source;
      if (
        isObject(sourceNode) &&
        sourceNode.type === 'StringLiteral' &&
        typeof sourceNode.value === 'string' &&
        reactImportSourcePattern.test(sourceNode.value.trim())
      ) {
        const importLine = toPositiveLine(value);
        if (typeof importLine === 'number') {
          importLines.push(importLine);
        }

        if (Array.isArray(value.specifiers)) {
          for (const specifier of value.specifiers) {
            if (!isObject(specifier)) {
              continue;
            }
            const localName = methodNameFromNode(specifier.local);
            if (typeof localName !== 'string' || localName.length === 0) {
              continue;
            }

            if (specifier.type === 'ImportDefaultSpecifier' || specifier.type === 'ImportNamespaceSpecifier') {
              namespaceAliases.add(localName);
              continue;
            }

            if (specifier.type === 'ImportSpecifier') {
              const importedName = methodNameFromNode(specifier.imported);
              if (
                typeof importedName === 'string' &&
                reactClassComponentNamePattern.test(importedName)
              ) {
                componentAliases.add(localName);
              }
            }
          }
        }
      }
    }

    for (const child of Object.values(value)) {
      if (Array.isArray(child)) {
        for (const entry of child) {
          walk(entry);
        }
        continue;
      }
      walk(child);
    }
  };

  walk(node);

  return {
    namespaceAliases,
    componentAliases,
    importLines: sortedUniqueLines(importLines),
  };
};

const isReactClassComponentSuperClass = (
  superClass: unknown,
  reactImportInfo: ReactImportInfo
): boolean => {
  if (!isObject(superClass)) {
    return false;
  }

  if (superClass.type === 'MemberExpression' && superClass.computed !== true) {
    const objectName = methodNameFromNode(superClass.object);
    const propertyName = memberExpressionPropertyName(superClass);
    return (
      typeof objectName === 'string' &&
      reactImportInfo.namespaceAliases.has(objectName) &&
      typeof propertyName === 'string' &&
      reactClassComponentNamePattern.test(propertyName)
    );
  }

  if (superClass.type === 'Identifier' && typeof superClass.name === 'string') {
    return reactImportInfo.componentAliases.has(superClass.name);
  }

  return false;
};

const buildReactClassComponentMatch = (
  classNode: AstNode,
  reactImportInfo: ReactImportInfo
): TypeScriptReactClassComponentMatch | undefined => {
  if (classNode.type !== 'ClassDeclaration' && classNode.type !== 'ClassExpression') {
    return undefined;
  }

  if (!isReactClassComponentSuperClass(classNode.superClass, reactImportInfo)) {
    return undefined;
  }

  const classLine = toPositiveLine(classNode);
  const superClass = classNode.superClass;
  const superClassLine = toPositiveLine(superClass);
  const className = classNameFromNode(classNode);
  const primaryName = className === 'AnonymousClass' ? 'ReactClassComponent' : className;
  const superClassName =
    isObject(superClass) && superClass.type === 'MemberExpression'
      ? `${methodNameFromNode(superClass.object) ?? 'React'}.${
          memberExpressionPropertyName(superClass) ?? 'Component'
        }`
      : methodNameFromNode(superClass) ?? 'React.Component';

  const relatedNodes = dedupeSemanticNodes([
    {
      kind: 'member',
      name: `extends ${superClassName}`,
      lines: toSingleLineArray(superClassLine ?? classLine),
    },
    reactImportInfo.importLines.length > 0
      ? {
          kind: 'member',
          name: 'import from react',
          lines: toSingleLineArray(reactImportInfo.importLines[0]),
        }
      : undefined,
  ].filter((entry): entry is TypeScriptSemanticNode => entry !== undefined));

  const lines = sortedUniqueLines([
    ...(typeof classLine === 'number' ? [classLine] : []),
    ...(typeof superClassLine === 'number' ? [superClassLine] : []),
    ...relatedNodes.flatMap((entry) => entry.lines ?? []),
  ]);

  return {
    lines,
    primary_node: {
      kind: 'class',
      name: primaryName,
      lines: toSingleLineArray(classLine),
    },
    related_nodes: relatedNodes,
    why:
      `${primaryName} extiende ${superClassName} en lugar de usar un componente funcional, ` +
      'manteniendo un patrón de React de clase incompatible con el baseline frontend moderno.',
    impact:
      'Las class components complican el uso de hooks, la composición de lógica reutilizable y la consistencia arquitectónica del frontend.',
    expected_fix:
      'Convierte la clase en un functional component y mueve estado, efectos y lógica compartida a hooks o custom hooks.',
  };
};

export const hasReactClassComponentUsage = (node: unknown): boolean => {
  return typeof findReactClassComponentMatch(node) !== 'undefined';
};

export const findReactClassComponentLines = (node: unknown): readonly number[] => {
  const reactImportInfo = collectReactImportInfo(node);
  return collectNodeLineMatches(node, (value) => {
    return (
      (value.type === 'ClassDeclaration' || value.type === 'ClassExpression') &&
      isReactClassComponentSuperClass(value.superClass, reactImportInfo)
    );
  });
};

export const findReactClassComponentMatch = (
  node: unknown
): TypeScriptReactClassComponentMatch | undefined => {
  const reactImportInfo = collectReactImportInfo(node);
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    if (value.type !== 'ClassDeclaration' && value.type !== 'ClassExpression') {
      return false;
    }
    if (!isReactClassComponentSuperClass(value.superClass, reactImportInfo)) {
      return false;
    }
    return ancestors.every((ancestor) => ancestor.type !== 'TSInterfaceDeclaration');
  });

  if (!match) {
    return undefined;
  }

  return buildReactClassComponentMatch(match.node, reactImportInfo);
};

type TypeScriptSingletonPatternMatch = {
  lines: readonly number[];
  primary_node: TypeScriptSemanticNode;
  related_nodes: readonly TypeScriptSemanticNode[];
  why: string;
  impact: string;
  expected_fix: string;
};

const singletonInstanceMemberNames = new Set(['instance', '_instance', 'singleton', '_singleton']);
const singletonFactoryMethodNames = new Set(['getinstance', 'getsingleton']);

const isClassStaticMember = (member: AstNode): boolean => member.static === true;

const classMemberName = (member: AstNode): string | undefined => methodNameFromNode(member.key);

const isPrivateConstructorMember = (member: AstNode): boolean => {
  if (member.type !== 'ClassMethod' && member.type !== 'ClassPrivateMethod') {
    return false;
  }
  if (member.kind !== 'constructor' && classMemberName(member) !== 'constructor') {
    return false;
  }
  return member.accessibility === 'private' || member.access === 'private';
};

const isSingletonInstanceProperty = (member: AstNode, className: string): boolean => {
  if (!isClassStaticMember(member)) {
    return false;
  }
  if (member.type !== 'ClassProperty' && member.type !== 'ClassPrivateProperty') {
    return false;
  }

  const memberName = classMemberName(member)?.toLowerCase();
  if (!memberName || !singletonInstanceMemberNames.has(memberName)) {
    return false;
  }

  const value = member.value;
  return (
    isObject(value) &&
    value.type === 'NewExpression' &&
    methodNameFromNode(value.callee) === className
  );
};

const hasSingletonStaticReference = (node: unknown, className: string): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'MemberExpression' || value.computed === true) {
      return false;
    }

    const memberName = memberExpressionPropertyName(value)?.toLowerCase();
    if (!memberName || !singletonInstanceMemberNames.has(memberName)) {
      return false;
    }

    const objectNode = value.object;
    return (
      (isObject(objectNode) && objectNode.type === 'ThisExpression') ||
      (isObject(objectNode) && objectNode.type === 'Identifier' && objectNode.name === className)
    );
  });
};

const hasSingletonFactoryMethod = (member: AstNode, className: string): boolean => {
  if (!isClassStaticMember(member)) {
    return false;
  }
  if (member.type !== 'ClassMethod' && member.type !== 'ClassPrivateMethod') {
    return false;
  }

  const memberName = classMemberName(member)?.toLowerCase();
  if (!memberName || !singletonFactoryMethodNames.has(memberName)) {
    return false;
  }

  const body = member.body;
  return hasSingletonStaticReference(body, className);
};

const buildSingletonPatternMatch = (
  classNode: AstNode
): TypeScriptSingletonPatternMatch | undefined => {
  const classBody = classNode.body;
  if (!isObject(classBody) || !Array.isArray(classBody.body)) {
    return undefined;
  }

  const className = classNameFromNode(classNode);
  const privateConstructorMember = classBody.body.find(
    (member): member is AstNode => isObject(member) && isPrivateConstructorMember(member)
  );
  if (!privateConstructorMember) {
    return undefined;
  }

  const singletonInstancePropertyMember = classBody.body.find(
    (member): member is AstNode => isObject(member) && isSingletonInstanceProperty(member, className)
  );

  const singletonFactoryMethodMember = classBody.body.find(
    (member): member is AstNode => isObject(member) && hasSingletonFactoryMethod(member, className)
  );

  if (!singletonInstancePropertyMember && !singletonFactoryMethodMember) {
    return undefined;
  }

  const relatedNodes = dedupeSemanticNodes(
    [
      {
        kind: 'member' as const,
        name: 'private constructor',
        lines: toSingleLineArray(toPositiveLine(privateConstructorMember)),
      },
      singletonInstancePropertyMember
        ? {
            kind: 'member' as const,
            name: `static ${classMemberName(singletonInstancePropertyMember)}`,
            lines: toSingleLineArray(toPositiveLine(singletonInstancePropertyMember)),
          }
        : undefined,
      singletonFactoryMethodMember
        ? {
            kind: 'member' as const,
            name: `static ${classMemberName(singletonFactoryMethodMember)}`,
            lines: toSingleLineArray(toPositiveLine(singletonFactoryMethodMember)),
          }
        : undefined,
    ].filter((entry): entry is TypeScriptSemanticNode => entry !== undefined)
  );

  const lines = sortedUniqueLines([
    ...(typeof toPositiveLine(classNode) === 'number' ? [toPositiveLine(classNode)!] : []),
    ...relatedNodes.flatMap((entry) => entry.lines ?? []),
  ]);

  return {
    lines,
    primary_node: {
      kind: 'class',
      name: className,
      lines: typeof toPositiveLine(classNode) === 'number' ? [toPositiveLine(classNode)!] : lines,
    },
    related_nodes: relatedNodes,
    why:
      `${className} implementa un singleton con constructor privado y acceso estático a una instancia compartida, ` +
      'centralizando estado global y evitando que la dependencia se inyecte de forma explícita.',
    impact:
      'El singleton oculta dependencias reales, complica el test aislado y vuelve más frágil la sustitución por mocks o dobles de colaboración.',
    expected_fix:
      'Sustituye la instancia global por inyección de dependencias del contenedor NestJS o por providers/context explícitos según la plataforma.',
  };
};

export const hasSingletonPattern = (node: unknown): boolean => {
  return typeof findSingletonPatternMatch(node) !== 'undefined';
};

export const findSingletonPatternMatch = (
  node: unknown
): TypeScriptSingletonPatternMatch | undefined => {
  const match = findFirstNodeWithAncestors(node, (value, ancestors) => {
    if (value.type !== 'ClassDeclaration' && value.type !== 'ClassExpression') {
      return false;
    }
    return typeof buildSingletonPatternMatch(value) !== 'undefined';
  });

  if (!match) {
    return undefined;
  }

  return buildSingletonPatternMatch(match.node);
};

const isRecordTypeName = (node: unknown): boolean => {
  return (
    isObject(node) &&
    node.type === 'Identifier' &&
    typeof node.name === 'string' &&
    node.name === 'Record'
  );
};

const typeReferenceParams = (node: unknown): ReadonlyArray<unknown> => {
  if (!isObject(node) || !isObject(node.typeParameters) || !Array.isArray(node.typeParameters.params)) {
    return [];
  }
  return node.typeParameters.params;
};

const collectTypeReferenceNames = (node: unknown): readonly string[] => {
  const names = new Set<string>();

  const walk = (value: unknown): void => {
    if (!isObject(value)) {
      return;
    }

    if (value.type === 'TSTypeAnnotation') {
      walk(value.typeAnnotation);
      return;
    }

    if (value.type === 'TSTypeReference') {
      const typeName = typeReferenceNameFromNode(value.typeName);
      if (typeof typeName === 'string' && typeName.length > 0) {
        names.add(typeName);
      }

      for (const param of typeReferenceParams(value)) {
        walk(param);
      }
      return;
    }

    if (value.type === 'TSQualifiedName') {
      const typeName = typeReferenceNameFromNode(value);
      if (typeof typeName === 'string' && typeName.length > 0) {
        names.add(typeName);
      }
      return;
    }

    if (value.type === 'Identifier') {
      if (typeof value.name === 'string' && value.name.length > 0) {
        names.add(value.name);
      }
      return;
    }

    if (value.type === 'TSUnionType' || value.type === 'TSIntersectionType') {
      if (Array.isArray(value.types)) {
        for (const entry of value.types) {
          walk(entry);
        }
      }
      return;
    }

    if (value.type === 'TSArrayType') {
      walk(value.elementType);
      return;
    }
  };

  walk(node);
  return [...names];
};

const isRecordStringUnknownTypeNode = (value: Record<string, string | number | boolean | bigint | symbol | null | Date | object>): boolean => {
  if (value.type !== 'TSTypeReference') {
    return false;
  }
  if (!isRecordTypeName(value.typeName)) {
    return false;
  }
  const params = typeReferenceParams(value);
  if (params.length !== 2) {
    return false;
  }
  const keyType = params[0];
  const valueType = params[1];
  if (!isObject(keyType) || !isObject(valueType)) {
    return false;
  }
  const isStringKey =
    keyType.type === 'TSStringKeyword' ||
    (keyType.type === 'TSLiteralType' &&
      isObject(keyType.literal) &&
      keyType.literal.type === 'StringLiteral');
  return isStringKey && valueType.type === 'TSUnknownKeyword';
};

export const hasRecordStringUnknownType = (node: unknown): boolean => {
  return hasNode(node, isRecordStringUnknownTypeNode);
};

export const findRecordStringUnknownTypeLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isRecordStringUnknownTypeNode);
};

const isUnknownTypeAssertionNode = (value: Record<string, string | number | boolean | bigint | symbol | null | Date | object>): boolean => {
  if (value.type !== 'TSAsExpression' && value.type !== 'TSTypeAssertion') {
    return false;
  }
  return isObject(value.typeAnnotation) && value.typeAnnotation.type === 'TSUnknownKeyword';
};

export const hasUnknownTypeAssertion = (node: unknown): boolean => {
  return hasNode(node, isUnknownTypeAssertionNode);
};

export const findUnknownTypeAssertionLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isUnknownTypeAssertionNode);
};

const isUnknownKeywordNode = (value: Record<string, string | number | boolean | bigint | symbol | null | Date | object>): boolean => {
  return value.type === 'TSUnknownKeyword';
};

const isRecordUnknownValueTypeNode = (unknownNode: AstNode, ancestors: ReadonlyArray<AstNode>): boolean => {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (ancestor.type !== 'TSTypeReference' || !isRecordTypeName(ancestor.typeName)) {
      continue;
    }
    const params = typeReferenceParams(ancestor);
    if (params.length !== 2) {
      continue;
    }
    const valueType = params[1];
    if (containsNode(valueType, unknownNode)) {
      return true;
    }
  }
  return false;
};

const isUnknownWithoutGuardNode = (
  value: AstNode,
  ancestors: ReadonlyArray<AstNode>
): boolean => {
  if (isUnknownTypeAssertionNode(value)) {
    return true;
  }
  if (!isUnknownKeywordNode(value)) {
    return false;
  }
  return !isRecordUnknownValueTypeNode(value, ancestors);
};

export const hasUnknownWithoutGuard = (node: unknown): boolean => {
  return hasNodeWithAncestors(node, isUnknownWithoutGuardNode);
};

export const findUnknownWithoutGuardLines = (node: unknown): readonly number[] => {
  return collectLineMatchesWithAncestors(node, isUnknownWithoutGuardNode);
};

const hasUndefinedUnionMember = (members: ReadonlyArray<unknown>): boolean => {
  return members.some(
    (member) => isObject(member) && member.type === 'TSUndefinedKeyword'
  );
};

const hasBaseScalarUnionMember = (members: ReadonlyArray<unknown>): boolean => {
  return members.some((member) => {
    return (
      isObject(member) &&
      (member.type === 'TSStringKeyword' ||
        member.type === 'TSNumberKeyword' ||
        member.type === 'TSBooleanKeyword' ||
        member.type === 'TSObjectKeyword')
    );
  });
};

const isUndefinedInBaseTypeUnionNode = (value: Record<string, string | number | boolean | bigint | symbol | null | Date | object>): boolean => {
  if (value.type !== 'TSUnionType' || !Array.isArray(value.types)) {
    return false;
  }
  return hasUndefinedUnionMember(value.types) && hasBaseScalarUnionMember(value.types);
};

export const hasUndefinedInBaseTypeUnion = (node: unknown): boolean => {
  return hasNode(node, isUndefinedInBaseTypeUnionNode);
};

export const findUndefinedInBaseTypeUnionLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isUndefinedInBaseTypeUnionNode);
};

const isNetworkCallExpressionNode = (value: Record<string, string | number | boolean | bigint | symbol | null | Date | object>): boolean => {
  if (value.type !== 'CallExpression') {
    return false;
  }
  const callee = value.callee;
  const identifierName = methodNameFromNode(callee);
  if (identifierName && networkCallCalleePattern.test(identifierName)) {
    return true;
  }
  if (!isObject(callee) || callee.type !== 'MemberExpression') {
    return false;
  }
  const propertyName = methodNameFromNode(callee.property);
  if (!propertyName || !networkCallCalleePattern.test(propertyName)) {
    return false;
  }
  const objectName = methodNameFromNode(callee.object);
  if (
    objectName &&
    (objectName.toLowerCase() === 'http' || objectName.toLowerCase() === 'axios')
  ) {
    return true;
  }
  if (
    isObject(callee.object) &&
    callee.object.type === 'MemberExpression' &&
    methodNameFromNode(callee.object.property)?.toLowerCase() === 'http'
  ) {
    return true;
  }
  return propertyName.toLowerCase() === 'fetch';
};

const hasNetworkCallExpression = (node: unknown): boolean => {
  return hasNode(node, isNetworkCallExpressionNode);
};

const isNetworkCallHandledInsideTryCatch = (ancestors: ReadonlyArray<AstNode>): boolean => {
  for (let index = 0; index < ancestors.length; index += 1) {
    const ancestor = ancestors[index];
    if (ancestor.type !== 'TryStatement') {
      continue;
    }
    const nextNode = ancestors[index + 1];
    if (!isObject(ancestor.block) || !isObject(ancestor.handler)) {
      continue;
    }
    if (nextNode === ancestor.block) {
      return true;
    }
  }
  return false;
};

const isCatchCallForNetworkNode = (
  node: AstNode,
  ancestors: ReadonlyArray<AstNode>
): boolean => {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (ancestor.type !== 'CallExpression') {
      continue;
    }
    const callee = ancestor.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      continue;
    }
    const property = methodNameFromNode(callee.property)?.toLowerCase();
    if (property !== 'catch') {
      continue;
    }
    if (containsNode(callee.object, node)) {
      return true;
    }
  }
  return false;
};

export const hasNetworkCallWithoutErrorHandling = (node: unknown): boolean => {
  return hasNodeWithAncestors(node, (value, ancestors) => {
    if (!isNetworkCallExpressionNode(value)) {
      return false;
    }
    if (isNetworkCallHandledInsideTryCatch(ancestors)) {
      return false;
    }
    if (isCatchCallForNetworkNode(value, ancestors)) {
      return false;
    }
    return true;
  });
};

export const findNetworkCallWithoutErrorHandlingLines = (node: unknown): readonly number[] => {
  if (!hasNetworkCallExpression(node)) {
    return [];
  }
  return collectLineMatchesWithAncestors(node, (value, ancestors) => {
    if (!isNetworkCallExpressionNode(value)) {
      return false;
    }
    if (isNetworkCallHandledInsideTryCatch(ancestors)) {
      return false;
    }
    if (isCatchCallForNetworkNode(value, ancestors)) {
      return false;
    }
    return true;
  });
};
