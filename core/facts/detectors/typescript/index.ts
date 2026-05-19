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
const unsafeSqlCallNames = new Set<string>([
  'query',
  'raw',
  'execute',
  '$queryRawUnsafe',
  '$executeRawUnsafe',
]);
const urlSensitiveQueryParamPattern =
  /[?&](?:access_token|auth_token|api[_-]?key|client_secret|id_token|jwt|password|secret|session[_-]?token|token)=/i;
const sensitiveIdentifierPattern =
  /(accessToken|authToken|authorization|bearer|clientSecret|credential|email|idToken|jwt|password|pii|refreshToken|secret|sessionToken|ssn|token)/i;
const loggingMethodNames = new Set([
  'debug',
  'error',
  'fatal',
  'info',
  'log',
  'trace',
  'verbose',
  'warn',
]);
const backendLogContextKeys = new Set(['correlationId', 'requestId', 'traceId', 'userId']);
const backendLogSignalKeys = new Set(['err', 'error', 'exception', 'message']);
const mockOrSpyMethodNames = new Set([
  'fn',
  'mock',
  'mockImplementation',
  'mockRejectedValue',
  'mockResolvedValue',
  'spy',
  'spyOn',
  'stub',
]);
const httpResponseObjectNames = new Set(['ctx', 'reply', 'res', 'response']);
const httpResponseMethodNames = new Set(['json', 'send']);
const backendErrorResponseRequiredKeys = new Set(['message', 'path', 'statusCode', 'timestamp']);
const backendErrorResponseSignalKeys = new Set(['error', 'message', 'path', 'statusCode', 'timestamp']);
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

const isFunctionExpressionNode = (node: unknown): node is AstNode => {
  return (
    isObject(node) &&
    (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression')
  );
};

const isCallbackArgument = (
  node: AstNode,
  ancestors: ReadonlyArray<AstNode>
): boolean => {
  const parent = ancestors[ancestors.length - 1];
  return (
    isFunctionExpressionNode(node) &&
    isObject(parent) &&
    parent.type === 'CallExpression' &&
    Array.isArray(parent.arguments) &&
    parent.arguments.includes(node)
  );
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

const memberExpressionObjectName = (node: unknown) => {
  if (!isObject(node) || node.type !== 'MemberExpression') {
    return undefined;
  }
  const objectNode = node.object;
  if (!isObject(objectNode) || objectNode.type !== 'Identifier') {
    return undefined;
  }
  return typeof objectNode.name === 'string' ? objectNode.name : undefined;
};

const numericLiteralValue = (node: unknown): number | undefined => {
  if (!isObject(node)) {
    return undefined;
  }
  if (node.type === 'NumericLiteral' && typeof node.value === 'number') {
    return node.value;
  }
  if (node.type === 'Literal' && typeof node.value === 'number') {
    return node.value;
  }
  return undefined;
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

const stringFragmentsFromNode = (node: unknown): readonly string[] => {
  if (!isObject(node)) {
    return [];
  }
  if (node.type === 'StringLiteral' && typeof node.value === 'string') {
    return [node.value];
  }
  if (node.type === 'TemplateLiteral' && Array.isArray(node.quasis)) {
    return node.quasis
      .map((quasi) => {
        if (!isObject(quasi) || !isObject(quasi.value)) {
          return '';
        }
        if (typeof quasi.value.cooked === 'string') {
          return quasi.value.cooked;
        }
        return typeof quasi.value.raw === 'string' ? quasi.value.raw : '';
      })
      .filter((fragment) => fragment.length > 0);
  }
  return [];
};

const hasSensitiveQueryParam = (node: unknown): boolean =>
  stringFragmentsFromNode(node).some((fragment) => urlSensitiveQueryParamPattern.test(fragment));

const jsxElementName = (node: unknown): string | undefined => {
  if (!isObject(node)) {
    return undefined;
  }
  if (node.type === 'JSXIdentifier') {
    return typeof node.name === 'string' ? node.name : undefined;
  }
  return undefined;
};

const jsxAttributeName = (node: unknown): string | undefined => {
  if (!isObject(node) || node.type !== 'JSXAttribute') {
    return undefined;
  }
  return jsxElementName(node.name);
};

const hasJsxAttribute = (node: AstNode, names: ReadonlySet<string>): boolean => {
  if (!Array.isArray(node.attributes)) {
    return false;
  }
  return node.attributes.some((attribute) => {
    const name = jsxAttributeName(attribute);
    return typeof name === 'string' && names.has(name);
  });
};

const jsxAttributeLiteralValue = (node: unknown): string | undefined => {
  if (!isObject(node)) {
    return undefined;
  }
  if (node.type === 'StringLiteral' || node.type === 'Literal') {
    return typeof node.value === 'string' ? node.value : undefined;
  }
  if (node.type !== 'JSXExpressionContainer') {
    return undefined;
  }
  const expression = node.expression;
  if (!isObject(expression)) {
    return undefined;
  }
  if (expression.type === 'StringLiteral' || expression.type === 'Literal') {
    return typeof expression.value === 'string' ? expression.value : undefined;
  }
  return undefined;
};

const jsxAttributeValue = (node: AstNode, name: string): string | undefined => {
  if (!Array.isArray(node.attributes)) {
    return undefined;
  }
  for (const attribute of node.attributes) {
    if (!isObject(attribute) || jsxAttributeName(attribute) !== name) {
      continue;
    }
    return jsxAttributeLiteralValue(attribute.value);
  }
  return undefined;
};

const hasDescendantNode = (
  node: unknown,
  predicate: (value: AstNode) => boolean
): boolean => {
  let matched = false;

  const walk = (value: unknown): void => {
    if (!isObject(value) || matched) {
      return;
    }
    if (predicate(value)) {
      matched = true;
      return;
    }
    for (const child of Object.values(value)) {
      if (matched) {
        return;
      }
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
  return matched;
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

const collectClassPropertyNames = (classNode: AstNode): readonly string[] => {
  const classBody = classNode.body;
  if (!isObject(classBody) || !Array.isArray(classBody.body)) {
    return [];
  }

  const properties: string[] = [];
  for (const member of classBody.body) {
    if (!isObject(member)) {
      continue;
    }
    if (
      member.type !== 'ClassProperty' &&
      member.type !== 'ClassPrivateProperty' &&
      member.type !== 'PropertyDefinition' &&
      member.type !== 'TSAbstractPropertyDefinition'
    ) {
      continue;
    }
    const name = methodNameFromNode(member.key);
    if (typeof name === 'string' && name.length > 0) {
      properties.push(name);
    }
  }

  return properties;
};

const isAccessorLikeMethodName = (name: string): boolean => {
  return /^(get|set)[A-Z_]/.test(name);
};

const isAccessorLikeClassMethod = (method: ClassMethodDescriptor): boolean => {
  return method.name === 'constructor' || isAccessorLikeMethodName(method.name);
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
  return {
    dependencyName,
    line: toPositiveLine(match.node),
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

export const hasExplicitAnyType = (node: unknown): boolean => {
  return hasNode(node, (value) => value.type === 'TSAnyKeyword');
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

const identifierNameFromNode = (node: unknown): string | undefined => {
  if (!isObject(node)) {
    return undefined;
  }
  if (node.type === 'Identifier' && typeof node.name === 'string') {
    return node.name;
  }
  if (node.type === 'StringLiteral' && typeof node.value === 'string') {
    return node.value;
  }
  if (node.type === 'MemberExpression' && isObject(node.property)) {
    return identifierNameFromNode(node.property);
  }
  return undefined;
};

const hasSensitiveIdentifierReference = (node: unknown): boolean => {
  if (!isObject(node)) {
    return false;
  }
  if (node.type === 'Identifier' && typeof node.name === 'string') {
    return sensitiveIdentifierPattern.test(node.name);
  }
  if (node.type === 'MemberExpression') {
    return (
      hasSensitiveIdentifierReference(node.object) ||
      hasSensitiveIdentifierReference(node.property)
    );
  }
  if (node.type === 'ObjectProperty' || node.type === 'Property') {
    return hasSensitiveIdentifierReference(node.key) || hasSensitiveIdentifierReference(node.value);
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      if (value.some(hasSensitiveIdentifierReference)) {
        return true;
      }
      continue;
    }
    if (isObject(value) && hasSensitiveIdentifierReference(value)) {
      return true;
    }
  }
  return false;
};

const isConstVariableDeclaratorAncestor = (
  ancestors: ReadonlyArray<AstNode>
): boolean => {
  const parent = ancestors.at(-1);
  const grandparent = ancestors.at(-2);
  return (
    isObject(parent) &&
    parent.type === 'VariableDeclarator' &&
    isObject(grandparent) &&
    grandparent.type === 'VariableDeclaration' &&
    grandparent.kind === 'const'
  );
};

const isBcryptSaltRoundsArgument = (
  node: AstNode,
  ancestors: ReadonlyArray<AstNode>
): boolean => {
  const parent = ancestors.at(-1);
  if (!isObject(parent) || parent.type !== 'CallExpression') {
    return false;
  }
  const calleeName = methodNameFromNode(parent.callee) ?? memberExpressionPropertyName(parent.callee);
  if (calleeName !== 'hash' && calleeName !== 'hashSync') {
    return false;
  }
  return Array.isArray(parent.arguments) && parent.arguments[1] === node;
};

const isMagicNumberLiteralValue = (value: number): boolean => {
  if (!Number.isFinite(value)) {
    return false;
  }
  return ![-1, 0, 1].includes(value);
};

export const hasBackendMagicNumberLiteral = (node: unknown): boolean => {
  return hasNodeWithAncestors(node, (value, ancestors) => {
    const numericValue = numericLiteralValue(value);
    if (numericValue === undefined || !isMagicNumberLiteralValue(numericValue)) {
      return false;
    }
    return (
      !isConstVariableDeclaratorAncestor(ancestors) &&
      !isBcryptSaltRoundsArgument(value, ancestors)
    );
  });
};

export const hasBackendGenericErrorThrow = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'ThrowStatement' || !isObject(value.argument)) {
      return false;
    }
    const argument = value.argument;
    if (argument.type !== 'NewExpression' || !isObject(argument.callee)) {
      return false;
    }
    return argument.callee.type === 'Identifier' && argument.callee.name === 'Error';
  });
};

const isBackendRawThrowExpression = (node: AstNode): boolean => {
  if (node.type !== 'ThrowStatement' || !isObject(node.argument)) {
    return false;
  }
  const argument = node.argument;
  return (
    argument.type === 'StringLiteral' ||
    argument.type === 'NumericLiteral' ||
    argument.type === 'BooleanLiteral' ||
    argument.type === 'ObjectExpression' ||
    argument.type === 'Identifier'
  );
};

export const findBackendRawThrowExpressionLines = (ast: unknown): readonly number[] => {
  return collectLineMatchesWithAncestors(ast, (node) => isBackendRawThrowExpression(node));
};

export const hasBackendRawThrowExpression = (ast: unknown): boolean =>
  findBackendRawThrowExpressionLines(ast).length > 0;

export const hasBackendProductionMockOrSpy = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression' || !isObject(value.callee)) {
      return false;
    }
    const callee = value.callee;
    const propertyName = memberExpressionPropertyName(callee);
    const objectName = memberExpressionObjectName(callee);
    if (propertyName !== undefined) {
      return (
        mockOrSpyMethodNames.has(propertyName) &&
        (objectName === 'jest' ||
          objectName === 'vi' ||
          objectName === 'sinon' ||
          propertyName.startsWith('mock'))
      );
    }
    const calleeName = methodNameFromNode(callee);
    return calleeName !== undefined && mockOrSpyMethodNames.has(calleeName);
  });
};

const isStackTraceNode = (node: unknown): boolean => {
  if (!isObject(node)) {
    return false;
  }
  if (node.type === 'MemberExpression') {
    return memberExpressionPropertyName(node) === 'stack';
  }
  if (
    (node.type === 'ObjectProperty' || node.type === 'Property') &&
    methodNameFromNode(node.key) === 'stack'
  ) {
    return true;
  }
  return false;
};

const containsStackTraceNode = (node: unknown): boolean => hasNode(node, isStackTraceNode);

export const hasBackendErrorStackInHttpResponse = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression' || !isObject(value.callee)) {
      return false;
    }
    const callee = value.callee;
    const methodName = memberExpressionPropertyName(callee);
    const objectName = memberExpressionObjectName(callee);
    if (
      methodName === undefined ||
      !httpResponseMethodNames.has(methodName) ||
      (methodName !== 'json' && (objectName === undefined || !httpResponseObjectNames.has(objectName)))
    ) {
      return false;
    }
    const args = Array.isArray(value.arguments) ? value.arguments : [];
    return args.some(containsStackTraceNode);
  });
};

const backendObjectPropertyName = (property: unknown): string | null => {
  if (!isObject(property)) {
    return null;
  }
  const key = property.key;
  if (!isObject(key)) {
    return null;
  }
  if (typeof key.name === 'string') {
    return key.name;
  }
  if (typeof key.value === 'string') {
    return key.value;
  }
  return null;
};

const objectExpressionPropertyNames = (node: AstNode): Set<string> => {
  if (!Array.isArray(node.properties)) {
    return new Set();
  }
  return new Set(
    node.properties
      .map((property) => backendObjectPropertyName(property))
      .filter((name): name is string => typeof name === 'string')
  );
};

const hasPropertyMatching = (propertyNames: ReadonlySet<string>, pattern: RegExp): boolean => {
  for (const propertyName of propertyNames) {
    if (pattern.test(propertyName)) {
      return true;
    }
  }
  return false;
};

const backendAccessTokenPropertyPattern = /^(accessToken|access_token)$/;
const backendRefreshTokenPropertyPattern = /^(refreshToken|refresh_token)$/;

const isBackendAuthResponseObjectWithoutRefreshToken = (node: AstNode): boolean => {
  if (node.type !== 'ObjectExpression') {
    return false;
  }
  const propertyNames = objectExpressionPropertyNames(node);
  return (
    hasPropertyMatching(propertyNames, backendAccessTokenPropertyPattern) &&
    !hasPropertyMatching(propertyNames, backendRefreshTokenPropertyPattern)
  );
};

export const findBackendAuthResponseWithoutRefreshTokenLines = (ast: unknown): readonly number[] => {
  return collectLineMatchesWithAncestors(ast, (node, ancestors) => {
    if (!isBackendAuthResponseObjectWithoutRefreshToken(node)) {
      return false;
    }
    const parent = ancestors[ancestors.length - 1];
    if (isObject(parent) && parent.type === 'ReturnStatement' && parent.argument === node) {
      return true;
    }
    return ancestors.some((ancestor) => {
      if (ancestor.type !== 'CallExpression' || !Array.isArray(ancestor.arguments)) {
        return false;
      }
      if (!ancestor.arguments.includes(node) || !isObject(ancestor.callee)) {
        return false;
      }
      const methodName = memberExpressionPropertyName(ancestor.callee);
      return methodName !== undefined && httpResponseMethodNames.has(methodName);
    });
  });
};

export const hasBackendAuthResponseWithoutRefreshToken = (ast: unknown): boolean =>
  findBackendAuthResponseWithoutRefreshTokenLines(ast).length > 0;

const isProcessEnvMemberExpression = (node: unknown): boolean => {
  if (!isObject(node) || node.type !== 'MemberExpression') {
    return false;
  }
  const propertyName = memberExpressionPropertyName(node);
  if (typeof propertyName !== 'string' || propertyName.length === 0) {
    return false;
  }
  const objectNode = node.object;
  return (
    isObject(objectNode) &&
    objectNode.type === 'MemberExpression' &&
    memberExpressionObjectName(objectNode) === 'process' &&
    memberExpressionPropertyName(objectNode) === 'env'
  );
};

const isLiteralConfigFallback = (node: unknown): boolean => {
  if (!isObject(node)) {
    return false;
  }
  return (
    node.type === 'StringLiteral' ||
    node.type === 'NumericLiteral' ||
    node.type === 'BooleanLiteral' ||
    (node.type === 'TemplateLiteral' &&
      Array.isArray(node.expressions) &&
      node.expressions.length === 0)
  );
};

const isBackendProcessEnvDefaultFallback = (node: AstNode): boolean => {
  return (
    node.type === 'LogicalExpression' &&
    (node.operator === '||' || node.operator === '??') &&
    isProcessEnvMemberExpression(node.left) &&
    isLiteralConfigFallback(node.right)
  );
};

export const findBackendProcessEnvDefaultFallbackLines = (ast: unknown): readonly number[] =>
  collectLineMatchesWithAncestors(ast, (node) => isBackendProcessEnvDefaultFallback(node), {
    max: 12,
  });

export const hasBackendProcessEnvDefaultFallback = (ast: unknown): boolean =>
  findBackendProcessEnvDefaultFallbackLines(ast).length > 0;

export const findBackendDirectProcessEnvReadLines = (ast: unknown): readonly number[] =>
  collectLineMatchesWithAncestors(ast, (node) => isProcessEnvMemberExpression(node), {
    max: 12,
  });

export const hasBackendDirectProcessEnvRead = (ast: unknown): boolean =>
  findBackendDirectProcessEnvReadLines(ast).length > 0;

const isConfigModuleForRootCall = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression' || !isObject(node.callee)) {
    return false;
  }
  const callee = node.callee;
  return (
    callee.type === 'MemberExpression' &&
    memberExpressionObjectName(callee) === 'ConfigModule' &&
    memberExpressionPropertyName(callee) === 'forRoot'
  );
};

const hasConfigValidationOption = (node: unknown): boolean => {
  if (!isObject(node) || node.type !== 'ObjectExpression') {
    return false;
  }
  const propertyNames = objectExpressionPropertyNames(node);
  return propertyNames.has('validationSchema') || propertyNames.has('validate');
};

const isBackendConfigModuleForRootWithoutValidation = (node: AstNode): boolean => {
  if (!isConfigModuleForRootCall(node)) {
    return false;
  }
  const args = Array.isArray(node.arguments) ? node.arguments : [];
  const options = args.find((argument) => isObject(argument) && argument.type === 'ObjectExpression');
  return !hasConfigValidationOption(options);
};

export const findBackendConfigModuleWithoutValidationLines = (ast: unknown): readonly number[] =>
  collectLineMatchesWithAncestors(
    ast,
    (node) => isBackendConfigModuleForRootWithoutValidation(node),
    { max: 12 }
  );

export const hasBackendConfigModuleWithoutValidation = (ast: unknown): boolean =>
  findBackendConfigModuleWithoutValidationLines(ast).length > 0;

const isErrorStatusCallExpression = (node: unknown): boolean => {
  if (!isObject(node) || node.type !== 'CallExpression') {
    return false;
  }
  const callee = node.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression') {
    return false;
  }
  if (memberExpressionPropertyName(callee) !== 'status') {
    return false;
  }
  const [statusArgument] = Array.isArray(node.arguments) ? node.arguments : [];
  return (
    isObject(statusArgument) &&
    statusArgument.type === 'NumericLiteral' &&
    typeof statusArgument.value === 'number' &&
    statusArgument.value >= 400
  );
};

const isSuccessStatusCallExpression = (node: unknown): boolean => {
  if (!isObject(node) || node.type !== 'CallExpression') {
    return false;
  }
  const callee = node.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression') {
    return false;
  }
  if (memberExpressionPropertyName(callee) !== 'status') {
    return false;
  }
  const [statusArgument] = Array.isArray(node.arguments) ? node.arguments : [];
  return (
    isObject(statusArgument) &&
    statusArgument.type === 'NumericLiteral' &&
    typeof statusArgument.value === 'number' &&
    statusArgument.value >= 200 &&
    statusArgument.value < 400
  );
};

const hasCatchClauseAncestor = (ancestors: ReadonlyArray<AstNode>): boolean => {
  return ancestors.some((ancestor) => ancestor.type === 'CatchClause');
};

const isHttpErrorResponseCallContext = (
  node: AstNode,
  ancestors: ReadonlyArray<AstNode>
): boolean => {
  const callee = node.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression') {
    return false;
  }
  const methodName = memberExpressionPropertyName(callee);
  if (!methodName || !httpResponseMethodNames.has(methodName)) {
    return false;
  }
  if (isErrorStatusCallExpression(callee.object)) {
    return true;
  }
  return hasCatchClauseAncestor(ancestors);
};

const isBackendInconsistentErrorResponseCall = (
  node: AstNode,
  ancestors: ReadonlyArray<AstNode>
): boolean => {
  if (node.type !== 'CallExpression' || !isHttpErrorResponseCallContext(node, ancestors)) {
    return false;
  }
  const [payload] = Array.isArray(node.arguments) ? node.arguments : [];
  if (!isObject(payload) || payload.type !== 'ObjectExpression') {
    return false;
  }
  const propertyNames = objectExpressionPropertyNames(payload);
  const hasErrorSignal = Array.from(backendErrorResponseSignalKeys).some((key) =>
    propertyNames.has(key)
  );
  if (!hasErrorSignal) {
    return false;
  }
  return Array.from(backendErrorResponseRequiredKeys).some((key) => !propertyNames.has(key));
};

export const findBackendInconsistentErrorResponseLines = (
  node: unknown
): readonly number[] => {
  return collectLineMatchesWithAncestors(node, isBackendInconsistentErrorResponseCall);
};

export const hasBackendInconsistentErrorResponse = (node: unknown): boolean => {
  return hasNodeWithAncestors(node, isBackendInconsistentErrorResponseCall);
};

const isBackendErrorPayloadObject = (node: unknown): node is AstNode => {
  if (!isObject(node) || node.type !== 'ObjectExpression') {
    return false;
  }
  const propertyNames = objectExpressionPropertyNames(node);
  return Array.from(backendErrorResponseSignalKeys).some((key) => propertyNames.has(key));
};

const isBackendErrorPayloadWithSuccessStatusCall = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression') {
    return false;
  }
  const callee = node.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression') {
    return false;
  }
  const methodName = memberExpressionPropertyName(callee);
  if (!methodName || !httpResponseMethodNames.has(methodName)) {
    return false;
  }
  if (!isSuccessStatusCallExpression(callee.object)) {
    return false;
  }
  const [payload] = Array.isArray(node.arguments) ? node.arguments : [];
  return isBackendErrorPayloadObject(payload);
};

export const findBackendErrorPayloadWithSuccessStatusLines = (
  node: unknown
): readonly number[] => {
  return collectLineMatchesWithAncestors(node, (value) =>
    isBackendErrorPayloadWithSuccessStatusCall(value)
  );
};

export const hasBackendErrorPayloadWithSuccessStatus = (node: unknown): boolean => {
  return hasNodeWithAncestors(node, (value) => isBackendErrorPayloadWithSuccessStatusCall(value));
};

const typeNameFromTypeReference = (node: unknown): string | null => {
  if (!isObject(node)) {
    return null;
  }
  const typeName = node.typeName;
  if (!isObject(typeName)) {
    return null;
  }
  if (typeof typeName.name === 'string') {
    return typeName.name;
  }
  if (typeName.type === 'TSQualifiedName' && isObject(typeName.right)) {
    return typeof typeName.right.name === 'string' ? typeName.right.name : null;
  }
  return null;
};

const isEntityTypeName = (name: string | null | undefined): boolean => {
  return typeof name === 'string' && /(Entity|Model)$/.test(name);
};

const typeNodeContainsEntityType = (node: unknown): boolean => {
  if (!isObject(node)) {
    return false;
  }
  if (node.type === 'TSTypeReference') {
    if (isEntityTypeName(typeNameFromTypeReference(node))) {
      return true;
    }
    if (isObject(node.typeParameters) && Array.isArray(node.typeParameters.params)) {
      return node.typeParameters.params.some(typeNodeContainsEntityType);
    }
    if (isObject(node.typeArguments) && Array.isArray(node.typeArguments.params)) {
      return node.typeArguments.params.some(typeNodeContainsEntityType);
    }
  }
  if (node.type === 'TSArrayType') {
    return typeNodeContainsEntityType(node.elementType);
  }
  if (node.type === 'TSUnionType' && Array.isArray(node.types)) {
    return node.types.some(typeNodeContainsEntityType);
  }
  return false;
};

const hasEntityReturnTypeAnnotation = (node: AstNode): boolean => {
  if (!isObject(node.returnType)) {
    return false;
  }
  const returnType = node.returnType;
  return isObject(returnType.typeAnnotation) && typeNodeContainsEntityType(returnType.typeAnnotation);
};

const isNewEntityExpression = (node: unknown): boolean => {
  if (!isObject(node) || node.type !== 'NewExpression') {
    return false;
  }
  return isEntityTypeName(methodNameFromNode(node.callee));
};

const isBackendControllerEntityResponseNode = (node: AstNode): boolean => {
  if (
    (node.type === 'ClassMethod' ||
      node.type === 'ClassPrivateMethod' ||
      node.type === 'ObjectMethod') &&
    hasEntityReturnTypeAnnotation(node)
  ) {
    return true;
  }
  return node.type === 'ReturnStatement' && isNewEntityExpression(node.argument);
};

export const findBackendControllerEntityResponseLines = (
  node: unknown
): readonly number[] => {
  return collectLineMatchesWithAncestors(node, (value) =>
    isBackendControllerEntityResponseNode(value)
  );
};

export const hasBackendControllerEntityResponse = (node: unknown): boolean => {
  return hasNodeWithAncestors(node, (value) => isBackendControllerEntityResponseNode(value));
};

export const hasBackendAnemicDomainModel = (node: unknown): boolean => {
  const match = findFirstNode(node, (value) => {
    if (value.type !== 'ClassDeclaration' && value.type !== 'ClassExpression') {
      return false;
    }
    const className = classNameFromNode(value);
    if (!/(Entity|Aggregate|Model)$/.test(className)) {
      return false;
    }
    const properties = collectClassPropertyNames(value);
    if (properties.length < 2) {
      return false;
    }
    const methods = collectClassMethodDescriptors(value);
    const nonAccessorMethods = methods.filter((method) => !isAccessorLikeClassMethod(method));
    return nonAccessorMethods.length === 0;
  });

  return match !== undefined;
};

const isCorsPermissiveValue = (node: unknown): boolean => {
  return (
    (isObject(node) && node.type === 'StringLiteral' && node.value === '*') ||
    (isObject(node) && node.type === 'BooleanLiteral' && node.value === true)
  );
};

const validationPipeObjectPropertyName = (node: unknown): string | undefined => {
  if (!isObject(node) || (node.type !== 'ObjectProperty' && node.type !== 'Property')) {
    return undefined;
  }
  return methodNameFromNode(node.key);
};

const objectExpressionHasPermissiveCorsProperty = (node: unknown): boolean => {
  if (!isObject(node) || node.type !== 'ObjectExpression' || !Array.isArray(node.properties)) {
    return false;
  }
  return node.properties.some((property) => {
    if (!isObject(property)) {
      return false;
    }
    const propertyName = objectPropertyName(property);
    return (
      (propertyName === 'origin' || propertyName === 'cors') &&
      isCorsPermissiveValue(property.value)
    );
  });
};

const isNestFactoryCreateCall = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression' || !isObject(node.callee)) {
    return false;
  }
  const objectName = memberExpressionObjectName(node.callee);
  const propertyName = memberExpressionPropertyName(node.callee);
  return objectName === 'NestFactory' && propertyName === 'create';
};

const isEnableCorsCall = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression' || !isObject(node.callee)) {
    return false;
  }
  return memberExpressionPropertyName(node.callee) === 'enableCors';
};

const isCorsMiddlewareCall = (node: AstNode): boolean => {
  return (
    node.type === 'CallExpression' &&
    isObject(node.callee) &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'cors'
  );
};

const isBackendPermissiveCorsConfigurationCall = (node: AstNode): boolean => {
  if (!Array.isArray(node.arguments)) {
    return false;
  }
  if (isEnableCorsCall(node) || isCorsMiddlewareCall(node)) {
    return (
      node.arguments.length === 0 ||
      node.arguments.some(objectExpressionHasPermissiveCorsProperty)
    );
  }
  return (
    isNestFactoryCreateCall(node) &&
    node.arguments.some(objectExpressionHasPermissiveCorsProperty)
  );
};

export const findBackendPermissiveCorsConfigurationLines = (
  ast: unknown
): readonly number[] => {
  return collectLineMatchesWithAncestors(ast, (node) =>
    isBackendPermissiveCorsConfigurationCall(node)
  );
};

export const hasBackendPermissiveCorsConfiguration = (ast: unknown): boolean =>
  findBackendPermissiveCorsConfigurationLines(ast).length > 0;

const isStringLiteralTypeNode = (node: unknown): boolean => {
  return (
    isObject(node) &&
    node.type === 'TSLiteralType' &&
    isObject(node.literal) &&
    node.literal.type === 'StringLiteral' &&
    typeof node.literal.value === 'string'
  );
};

const isBackendStringLiteralUnionTypeNode = (node: AstNode): boolean => {
  if (node.type !== 'TSUnionType' || !Array.isArray(node.types)) {
    return false;
  }
  const stringLiteralTypes = node.types.filter(isStringLiteralTypeNode);
  return stringLiteralTypes.length >= 2 && stringLiteralTypes.length === node.types.length;
};

export const findBackendStringLiteralUnionEnumCandidateLines = (
  ast: unknown
): readonly number[] => {
  return collectLineMatchesWithAncestors(ast, (node) =>
    isBackendStringLiteralUnionTypeNode(node)
  );
};

export const hasBackendStringLiteralUnionEnumCandidate = (ast: unknown): boolean =>
  findBackendStringLiteralUnionEnumCandidateLines(ast).length > 0;

const backendCacheWriteMethodNames = new Set(['hset', 'mset', 'set', 'setex']);
const backendCacheObjectPattern = /(cache|cacheManager|redis)/i;

const isBackendSensitiveCacheWriteCall = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression' || !isObject(node.callee)) {
    return false;
  }
  const callee = node.callee;
  const methodName = memberExpressionPropertyName(callee);
  if (methodName === undefined || !backendCacheWriteMethodNames.has(methodName)) {
    return false;
  }
  const objectName =
    callee.type === 'MemberExpression' ? identifierNameFromNode(callee.object) : undefined;
  if (objectName === undefined || !backendCacheObjectPattern.test(objectName)) {
    return false;
  }
  const args = Array.isArray(node.arguments) ? node.arguments : [];
  return args.some(hasSensitiveIdentifierReference);
};

export const findBackendSensitiveCacheWriteLines = (ast: unknown): readonly number[] => {
  return collectLineMatchesWithAncestors(ast, (node) => isBackendSensitiveCacheWriteCall(node));
};

export const hasBackendSensitiveCacheWrite = (ast: unknown): boolean =>
  findBackendSensitiveCacheWriteLines(ast).length > 0;

const isLoggingCall = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression' || !isObject(node.callee)) {
    return false;
  }
  const methodName = identifierNameFromNode(node.callee);
  if (methodName === undefined || !loggingMethodNames.has(methodName)) {
    return false;
  }
  if (node.callee.type !== 'MemberExpression') {
    return false;
  }
  const objectName = identifierNameFromNode(node.callee.object);
  return (
    objectName === 'console' ||
    objectName === 'logger' ||
    objectName === 'log' ||
    objectName === 'pino' ||
    objectName === 'winston' ||
    objectName === 'Logger'
  );
};

export const hasSensitiveDataLoggingCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (!isLoggingCall(value)) {
      return false;
    }
    const args = Array.isArray(value.arguments) ? value.arguments : [];
    return args.some(hasSensitiveIdentifierReference);
  });
};

const hasBackendLogContextObject = (node: unknown): boolean => {
  if (!isObject(node) || node.type !== 'ObjectExpression') {
    return false;
  }
  for (const propertyName of objectExpressionPropertyNames(node)) {
    if (backendLogContextKeys.has(propertyName)) {
      return true;
    }
  }
  return false;
};

const hasBackendLogSignal = (node: unknown): boolean => {
  if (!isObject(node)) {
    return false;
  }
  const identifierName = identifierNameFromNode(node);
  if (identifierName !== undefined && backendLogSignalKeys.has(identifierName)) {
    return true;
  }
  if (node.type === 'StringLiteral') {
    return typeof node.value === 'string' && node.value.trim().length > 0;
  }
  if (node.type === 'ObjectExpression') {
    for (const propertyName of objectExpressionPropertyNames(node)) {
      if (backendLogSignalKeys.has(propertyName)) {
        return true;
      }
    }
    return false;
  }
  if (node.type === 'MemberExpression') {
    const propertyName = identifierNameFromNode(node.property);
    return propertyName !== undefined && backendLogSignalKeys.has(propertyName);
  }
  return false;
};

const isBackendLogWithoutContextCall = (node: AstNode): boolean => {
  if (!isLoggingCall(node)) {
    return false;
  }
  const args = Array.isArray(node.arguments) ? node.arguments : [];
  if (!args.some(hasBackendLogSignal)) {
    return false;
  }
  return !args.some(hasBackendLogContextObject);
};

export const findBackendLogWithoutContextLines = (ast: unknown): readonly number[] => {
  return collectLineMatchesWithAncestors(ast, (node) => isBackendLogWithoutContextCall(node));
};

export const hasBackendLogWithoutContext = (ast: unknown): boolean =>
  findBackendLogWithoutContextLines(ast).length > 0;

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

export const hasWeakBcryptSaltRounds = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression' || !Array.isArray(value.arguments)) {
      return false;
    }
    const callee = value.callee;
    const objectName = memberExpressionObjectName(callee);
    const propertyName = memberExpressionPropertyName(callee);
    if (objectName !== 'bcrypt' || (propertyName !== 'hash' && propertyName !== 'hashSync')) {
      return false;
    }
    const saltRounds = numericLiteralValue(value.arguments[1]);
    return typeof saltRounds === 'number' && saltRounds < 10;
  });
};

export const hasInterpolatedUnsafeSqlCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression' || !Array.isArray(value.arguments)) {
      return false;
    }
    const calleeName = methodNameFromNode(value.callee) ?? memberExpressionPropertyName(value.callee);
    if (typeof calleeName !== 'string' || !unsafeSqlCallNames.has(calleeName)) {
      return false;
    }
    const firstArg = value.arguments[0];
    return (
      isObject(firstArg) &&
      firstArg.type === 'TemplateLiteral' &&
      Array.isArray(firstArg.expressions) &&
      firstArg.expressions.length > 0
    );
  });
};

export const hasSensitiveTokenInUrl = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression' || !Array.isArray(value.arguments)) {
      return false;
    }
    const calleeName = methodNameFromNode(value.callee) ?? memberExpressionPropertyName(value.callee);
    if (typeof calleeName !== 'string' || !networkCallCalleePattern.test(calleeName)) {
      return false;
    }
    return hasSensitiveQueryParam(value.arguments[0]);
  });
};

export const hasNestedCallbackUsage = (node: unknown): boolean => {
  return hasNodeWithAncestors(node, (value, ancestors) => {
    if (!isCallbackArgument(value, ancestors)) {
      return false;
    }
    return ancestors.some((ancestor, index) =>
      isCallbackArgument(ancestor, ancestors.slice(0, index))
    );
  });
};

export const hasNestedIfElseStatement = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'IfStatement' || !isObject(value.alternate)) {
      return false;
    }
    if (value.alternate.type === 'IfStatement') {
      return true;
    }
    return (
      hasDescendantNode(value.consequent, (nested) => nested !== value && nested.type === 'IfStatement') ||
      hasDescendantNode(value.alternate, (nested) => nested !== value && nested.type === 'IfStatement')
    );
  });
};

export const hasDefaultExportedApiRouteHandler = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'ExportDefaultDeclaration') {
      return false;
    }
    const declaration = value.declaration;
    if (!isObject(declaration)) {
      return false;
    }
    return (
      declaration.type === 'FunctionDeclaration' ||
      declaration.type === 'ArrowFunctionExpression' ||
      declaration.type === 'FunctionExpression' ||
      declaration.type === 'Identifier'
    );
  });
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

export const hasLargeClassDeclaration = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'ClassDeclaration' && value.type !== 'ClassExpression') {
      return false;
    }
    return hasSemanticGodClassResponsibilities(value);
  });
};

const nestJsClassDecoratorNames = new Set([
  'Catch',
  'Controller',
  'Injectable',
  'Module',
  'Processor',
  'Resolver',
  'WebSocketGateway',
]);
const nestJsRouteDecoratorNames = new Set(['Delete', 'Get', 'Head', 'Options', 'Patch', 'Post', 'Put']);
const nestJsUseGuardsDecoratorNames = new Set(['UseGuards']);
const nestJsRolesDecoratorNames = new Set(['Roles']);
const nestJsOnEventDecoratorNames = new Set(['OnEvent']);
const nestJsThrottleDecoratorNames = new Set(['Throttle']);
const backendEventHandlerNamePattern = /(^handle[A-Z].*Event$|EventHandler$|EventsHandler$)/;
const backendAuthRouteNamePattern =
  /(forgot|login|password|refresh|register|reset|signin|sign-in|signup|sign-up|token)/i;

const decoratorExpressionName = (node: unknown): string | undefined => {
  if (!isObject(node)) {
    return undefined;
  }
  if (node.type === 'Identifier' && typeof node.name === 'string') {
    return node.name;
  }
  if (node.type === 'CallExpression') {
    return decoratorExpressionName(node.callee);
  }
  if (node.type === 'MemberExpression' && isObject(node.property)) {
    if (node.property.type === 'Identifier' && typeof node.property.name === 'string') {
      return node.property.name;
    }
    if (node.property.type === 'StringLiteral' && typeof node.property.value === 'string') {
      return node.property.value;
    }
  }
  return undefined;
};

const hasDecoratorFrom = (node: AstNode, allowedNames: ReadonlySet<string>): boolean => {
  if (!Array.isArray(node.decorators)) {
    return false;
  }
  return node.decorators.some((decorator) => {
    if (!isObject(decorator)) {
      return false;
    }
    const name = decoratorExpressionName(decorator.expression);
    return name !== undefined && allowedNames.has(name);
  });
};

const decoratorCallArguments = (decorator: AstNode): readonly unknown[] => {
  const expression = decorator.expression;
  if (!isObject(expression) || expression.type !== 'CallExpression') {
    return [];
  }
  return Array.isArray(expression.arguments) ? expression.arguments : [];
};

const hasNestJsRouteDecorator = (node: AstNode): boolean =>
  hasDecoratorFrom(node, nestJsRouteDecoratorNames);

const hasNestJsUseGuardsDecorator = (node: AstNode): boolean =>
  hasDecoratorFrom(node, nestJsUseGuardsDecoratorNames);

const isRolesSetMetadataDecorator = (decorator: AstNode): boolean => {
  const name = decoratorExpressionName(decorator.expression);
  if (name !== 'SetMetadata') {
    return false;
  }
  const [metadataKey] = decoratorCallArguments(decorator);
  return isObject(metadataKey) && metadataKey.type === 'StringLiteral' && metadataKey.value === 'roles';
};

const hasNestJsRolesDecorator = (node: AstNode): boolean => {
  if (!Array.isArray(node.decorators)) {
    return false;
  }
  return node.decorators.some((decorator) => {
    if (!isObject(decorator)) {
      return false;
    }
    const name = decoratorExpressionName(decorator.expression);
    return (name !== undefined && nestJsRolesDecoratorNames.has(name)) || isRolesSetMetadataDecorator(decorator);
  });
};

const isClassLikeNode = (node: unknown): node is AstNode =>
  isObject(node) && (node.type === 'ClassDeclaration' || node.type === 'ClassExpression');

const isClassMethodLikeNode = (node: unknown): node is AstNode =>
  isObject(node) &&
  (node.type === 'ClassMethod' || node.type === 'ClassPrivateMethod' || node.type === 'ObjectMethod');

const unwrapParameterProperty = (node: unknown): unknown => {
  if (!isObject(node) || node.type !== 'TSParameterProperty') {
    return node;
  }
  return node.parameter;
};

const nodeContainsTypeReference = (node: unknown): boolean => {
  if (!isObject(node)) {
    return false;
  }
  if (node.type === 'TSTypeReference') {
    return true;
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      if (value.some(nodeContainsTypeReference)) {
        return true;
      }
      continue;
    }
    if (isObject(value) && nodeContainsTypeReference(value)) {
      return true;
    }
  }
  return false;
};

const hasConstructorDependencyParameter = (node: AstNode): boolean => {
  const rawParameters = Array.isArray(node.params) ? node.params : [];
  return rawParameters.some((rawParameter) => {
    const parameter = unwrapParameterProperty(rawParameter);
    if (!isObject(parameter)) {
      return false;
    }
    if (hasDecoratorFrom(parameter, new Set(['Inject']))) {
      return true;
    }
    return nodeContainsTypeReference(parameter.typeAnnotation);
  });
};

export type TypeScriptNestJsConstructorDiMatch = {
  lines: readonly number[];
  primary_node: string;
  related_nodes: readonly string[];
  why: string;
  impact: string;
  expected_fix: string;
};

export const findNestJsConstructorDependencyWithoutDecoratorMatch = (
  ast: unknown
): TypeScriptNestJsConstructorDiMatch | undefined => {
  const match = findFirstNodeWithAncestors(ast, (node) => {
    if (node.type !== 'ClassDeclaration' || hasDecoratorFrom(node, nestJsClassDecoratorNames)) {
      return false;
    }
    const body = isObject(node.body) && Array.isArray(node.body.body) ? node.body.body : [];
    return body.some(
      (member) =>
        isObject(member) &&
        member.type === 'ClassMethod' &&
        methodNameFromNode(member.key) === 'constructor' &&
        hasConstructorDependencyParameter(member)
    );
  });

  if (match === undefined) {
    return undefined;
  }

  const className = classNameFromNode(match.node) ?? 'AnonymousClass';
  const location = isObject(match.node.loc) ? (match.node.loc as AstNode) : undefined;
  const line =
    (location === undefined ? undefined : toPositiveLine(location)) ??
    (location !== undefined &&
    isObject(location.start) &&
    typeof location.start.line === 'number'
      ? location.start.line
      : undefined);
  return {
    lines: line === undefined ? [] : sortedUniqueLines([line]),
    primary_node: className,
    related_nodes: ['constructor'],
    why: `La clase ${className} recibe dependencias por constructor sin declararse como provider/controlador NestJS.`,
    impact:
      'El contenedor DI de NestJS no puede gobernar el ciclo de vida ni validar wiring de dependencias de forma explicita.',
    expected_fix:
      'Declara el rol de la clase con @Injectable(), @Controller(), @Resolver() o el decorador NestJS equivalente y registra el provider en su modulo.',
  };
};

export const hasNestJsConstructorDependencyWithoutDecorator = (ast: unknown): boolean =>
  findNestJsConstructorDependencyWithoutDecoratorMatch(ast) !== undefined;

export const findBackendControllerRouteWithoutGuardLines = (ast: unknown): readonly number[] => {
  return collectLineMatchesWithAncestors(ast, (node, ancestors) => {
    if (!isClassMethodLikeNode(node) || !hasNestJsRouteDecorator(node)) {
      return false;
    }
    if (hasNestJsUseGuardsDecorator(node)) {
      return false;
    }
    const ownerClass = [...ancestors].reverse().find(isClassLikeNode);
    return ownerClass === undefined || !hasNestJsUseGuardsDecorator(ownerClass);
  });
};

export const hasBackendControllerRouteWithoutGuard = (ast: unknown): boolean =>
  findBackendControllerRouteWithoutGuardLines(ast).length > 0;

export const findBackendControllerRouteWithoutRolesLines = (ast: unknown): readonly number[] => {
  return collectLineMatchesWithAncestors(ast, (node, ancestors) => {
    if (!isClassMethodLikeNode(node) || !hasNestJsRouteDecorator(node)) {
      return false;
    }
    const ownerClass = [...ancestors].reverse().find(isClassLikeNode);
    const hasGuard = hasNestJsUseGuardsDecorator(node) || (ownerClass !== undefined && hasNestJsUseGuardsDecorator(ownerClass));
    if (!hasGuard) {
      return false;
    }
    return !hasNestJsRolesDecorator(node) && (ownerClass === undefined || !hasNestJsRolesDecorator(ownerClass));
  });
};

export const hasBackendControllerRouteWithoutRoles = (ast: unknown): boolean =>
  findBackendControllerRouteWithoutRolesLines(ast).length > 0;

const isBackendEventHandlerClassOrMethod = (node: AstNode): boolean => {
  if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
    return backendEventHandlerNamePattern.test(classNameFromNode(node));
  }
  if (!isClassMethodLikeNode(node)) {
    return false;
  }
  const methodName = methodNameFromNode(node.key);
  return typeof methodName === 'string' && backendEventHandlerNamePattern.test(methodName);
};

const hasOnEventDecoratedClassMember = (node: AstNode): boolean => {
  if (node.type !== 'ClassDeclaration' && node.type !== 'ClassExpression') {
    return false;
  }
  const members = isObject(node.body) && Array.isArray(node.body.body) ? node.body.body : [];
  return members.some((member) => isObject(member) && hasDecoratorFrom(member, nestJsOnEventDecoratorNames));
};

export const findBackendEventHandlerWithoutOnEventLines = (ast: unknown): readonly number[] => {
  return collectLineMatchesWithAncestors(ast, (node, ancestors) => {
    if (!isBackendEventHandlerClassOrMethod(node)) {
      return false;
    }
    if (hasDecoratorFrom(node, nestJsOnEventDecoratorNames)) {
      return false;
    }
    if (isClassLikeNode(node) && hasOnEventDecoratedClassMember(node)) {
      return false;
    }
    const ownerClass = [...ancestors].reverse().find(isClassLikeNode);
    return ownerClass === undefined || !hasDecoratorFrom(ownerClass, nestJsOnEventDecoratorNames);
  });
};

export const hasBackendEventHandlerWithoutOnEvent = (ast: unknown): boolean =>
  findBackendEventHandlerWithoutOnEventLines(ast).length > 0;

const isBackendAuthRouteMethod = (node: AstNode): boolean => {
  if (!isClassMethodLikeNode(node) || !hasNestJsRouteDecorator(node)) {
    return false;
  }
  const methodName = methodNameFromNode(node.key);
  if (methodName !== undefined && backendAuthRouteNamePattern.test(methodName)) {
    return true;
  }
  if (!Array.isArray(node.decorators)) {
    return false;
  }
  return node.decorators.some((decorator) => {
    if (!isObject(decorator)) {
      return false;
    }
    const decoratorName = decoratorExpressionName(decorator.expression);
    if (decoratorName === undefined || !nestJsRouteDecoratorNames.has(decoratorName)) {
      return false;
    }
    const [firstArgument] = decoratorCallArguments(decorator);
    const routePath = literalTextFromNode(firstArgument);
    return routePath !== undefined && backendAuthRouteNamePattern.test(routePath);
  });
};

export const findBackendAuthRouteWithoutThrottleLines = (ast: unknown): readonly number[] => {
  return collectLineMatchesWithAncestors(ast, (node, ancestors) => {
    if (!isBackendAuthRouteMethod(node)) {
      return false;
    }
    if (hasDecoratorFrom(node, nestJsThrottleDecoratorNames)) {
      return false;
    }
    const ownerClass = [...ancestors].reverse().find(isClassLikeNode);
    return ownerClass === undefined || !hasDecoratorFrom(ownerClass, nestJsThrottleDecoratorNames);
  });
};

export const hasBackendAuthRouteWithoutThrottle = (ast: unknown): boolean =>
  findBackendAuthRouteWithoutThrottleLines(ast).length > 0;

const persistenceMutationNames = new Set([
  'create',
  'delete',
  'deleteMany',
  'insert',
  'insertMany',
  'remove',
  'save',
  'softDelete',
  'update',
  'updateMany',
  'upsert',
]);

const auditEventNames = new Set([
  'append',
  'appendEvent',
  'audit',
  'auditLog',
  'emit',
  'emitAsync',
  'publish',
  'record',
  'recordEvent',
]);

const auditEventObjectPattern = /(audit|event|eventStore|eventBus|publisher|emitter)/i;
const persistenceObjectPattern = /(repo|repository|prisma|manager|model|dao|store|db|database|client)/i;

const callExpressionMemberName = (node: AstNode): string | undefined => {
  if (node.type !== 'CallExpression' || !isObject(node.callee)) {
    return undefined;
  }
  if (node.callee.type === 'MemberExpression' && isObject(node.callee.property)) {
    return methodNameFromNode(node.callee.property);
  }
  if (node.callee.type === 'Identifier') {
    return typeof node.callee.name === 'string' ? node.callee.name : undefined;
  }
  return undefined;
};

const callExpressionObjectName = (node: AstNode): string | undefined => {
  if (node.type !== 'CallExpression' || !isObject(node.callee)) {
    return undefined;
  }
  if (node.callee.type !== 'MemberExpression' || !isObject(node.callee.object)) {
    return undefined;
  }
  if (node.callee.object.type === 'Identifier' && typeof node.callee.object.name === 'string') {
    return node.callee.object.name;
  }
  if (node.callee.object.type === 'MemberExpression' && isObject(node.callee.object.property)) {
    return methodNameFromNode(node.callee.object.property);
  }
  return undefined;
};

const isPersistenceMutationCall = (node: AstNode): boolean => {
  const memberName = callExpressionMemberName(node);
  const objectName = callExpressionObjectName(node);
  return (
    memberName !== undefined &&
    persistenceMutationNames.has(memberName) &&
    objectName !== undefined &&
    persistenceObjectPattern.test(objectName)
  );
};

const isAuditEventCall = (node: AstNode): boolean => {
  const memberName = callExpressionMemberName(node);
  const objectName = callExpressionObjectName(node);
  return (
    (memberName !== undefined && auditEventNames.has(memberName)) ||
    (objectName !== undefined && auditEventObjectPattern.test(objectName))
  );
};

export type TypeScriptPersistenceMutationWithoutAuditEventMatch = {
  lines: readonly number[];
  primary_node: string;
  related_nodes: readonly string[];
  why: string;
  impact: string;
  expected_fix: string;
};

export const findPersistenceMutationWithoutAuditEventMatch = (
  ast: unknown
): TypeScriptPersistenceMutationWithoutAuditEventMatch | undefined => {
  const match = findFirstNodeWithAncestors(ast, (node) => {
    if (
      node.type !== 'FunctionDeclaration' &&
      node.type !== 'FunctionExpression' &&
      node.type !== 'ArrowFunctionExpression' &&
      node.type !== 'ClassMethod' &&
      node.type !== 'ObjectMethod'
    ) {
      return false;
    }
    const hasMutation = hasDescendantNode(node, (nested) => isPersistenceMutationCall(nested));
    if (!hasMutation) {
      return false;
    }
    return !hasDescendantNode(node, (nested) => isAuditEventCall(nested));
  });

  if (match === undefined) {
    return undefined;
  }

  const functionName =
    methodNameFromNode(match.node.id) ?? methodNameFromNode(match.node.key) ?? 'anonymous mutation';
  const location = isObject(match.node.loc) ? (match.node.loc as AstNode) : undefined;
  const line =
    (location === undefined ? undefined : toPositiveLine(location)) ??
    (location !== undefined &&
    isObject(location.start) &&
    typeof location.start.line === 'number'
      ? location.start.line
      : undefined);

  return {
    lines: line === undefined ? [] : sortedUniqueLines([line]),
    primary_node: functionName,
    related_nodes: ['persistence mutation'],
    why: `La operacion ${functionName} persiste o muta estado sin emitir evento de dominio ni registrar auditoria en el mismo nodo ejecutable.`,
    impact:
      'Las mutaciones quedan sin trazabilidad funcional para auditoria, event sourcing o reconstruccion de decisiones de negocio.',
    expected_fix:
      'Emite un evento de dominio o registra audit log/event store junto a la mutacion, por ejemplo eventBus.emit(...), eventStore.append(...) o auditLog.record(...).',
  };
};

export const hasPersistenceMutationWithoutAuditEvent = (ast: unknown): boolean =>
  findPersistenceMutationWithoutAuditEventMatch(ast) !== undefined;

const hardDeleteMethodNames = new Set(['delete', 'deleteMany', 'hardDelete', 'remove']);

const memberExpressionRootObjectName = (node: unknown): string | undefined => {
  if (!isObject(node)) {
    return undefined;
  }
  if (node.type === 'Identifier' && typeof node.name === 'string') {
    return node.name;
  }
  if (node.type === 'MemberExpression') {
    return memberExpressionRootObjectName(node.object);
  }
  return undefined;
};

const isBackendHardDeleteCall = (node: AstNode): boolean => {
  const memberName = callExpressionMemberName(node);
  const objectName = callExpressionObjectName(node);
  const rootObjectName =
    node.type === 'CallExpression' && isObject(node.callee)
      ? memberExpressionRootObjectName(node.callee)
      : undefined;
  return (
    memberName !== undefined &&
    hardDeleteMethodNames.has(memberName) &&
    ((objectName !== undefined && persistenceObjectPattern.test(objectName)) ||
      (rootObjectName !== undefined && persistenceObjectPattern.test(rootObjectName)))
  );
};

export const findBackendHardDeleteWithoutSoftDeleteLines = (
  ast: unknown
): readonly number[] => {
  return collectLineMatchesWithAncestors(ast, (node) => isBackendHardDeleteCall(node));
};

export const hasBackendHardDeleteWithoutSoftDelete = (ast: unknown): boolean =>
  findBackendHardDeleteWithoutSoftDeleteLines(ast).length > 0;

const classValidatorDecoratorPattern =
  /^(Array|Is|Validate|Min|Max|Length|Matches|Contains|Equals|NotEquals|Allow|Expose|Exclude|Transform|Type)/;
const dtoNestedDecoratorNames = new Set(['Type', 'ValidateNested']);
const primitiveTypeNames = new Set(['String', 'Number', 'Boolean', 'Date', 'Array', 'Record']);

const isDtoClassName = (name: string | undefined): boolean =>
  name !== undefined && /Dto$/i.test(name);

const isDtoPropertyNode = (node: AstNode): boolean =>
  node.type === 'ClassProperty' ||
  node.type === 'PropertyDefinition' ||
  node.type === 'ClassPrivateProperty';

const hasClassValidatorDecorator = (node: AstNode): boolean => {
  if (!Array.isArray(node.decorators)) {
    return false;
  }
  return node.decorators.some((decorator) => {
    if (!isObject(decorator)) {
      return false;
    }
    const name = decoratorExpressionName(decorator.expression);
    return name !== undefined && classValidatorDecoratorPattern.test(name);
  });
};

const hasApiPropertyDecorator = (node: AstNode): boolean => {
  if (!Array.isArray(node.decorators)) {
    return false;
  }
  return node.decorators.some((decorator) => {
    if (!isObject(decorator)) {
      return false;
    }
    const name = decoratorExpressionName(decorator.expression);
    return name === 'ApiProperty' || name === 'ApiPropertyOptional';
  });
};

const hasDtoNestedValidationDecorator = (node: AstNode): boolean => {
  if (!Array.isArray(node.decorators)) {
    return false;
  }
  const names = node.decorators
    .map((decorator) =>
      isObject(decorator) ? decoratorExpressionName(decorator.expression) : undefined
    )
    .filter((name): name is string => name !== undefined);
  return names.some((name) => dtoNestedDecoratorNames.has(name));
};

const isNestedDtoTypeAnnotation = (node: unknown): boolean => {
  if (!isObject(node)) {
    return false;
  }
  if (node.type === 'TSTypeAnnotation') {
    return isNestedDtoTypeAnnotation(node.typeAnnotation);
  }
  if (node.type === 'TSArrayType') {
    return isNestedDtoTypeAnnotation(node.elementType);
  }
  if (node.type === 'TSTypeReference') {
    const name = typeReferenceNameFromNode(node);
    if (name !== undefined && !primitiveTypeNames.has(name) && /Dto$/i.test(name)) {
      return true;
    }
    return typeReferenceParams(node).some(isNestedDtoTypeAnnotation);
  }
  return false;
};

export type TypeScriptDtoPropertyWithoutValidationMatch = {
  lines: readonly number[];
  primary_node: string;
  related_nodes: readonly string[];
  why: string;
  impact: string;
  expected_fix: string;
};

export const findDtoPropertyWithoutValidationMatch = (
  ast: unknown
): TypeScriptDtoPropertyWithoutValidationMatch | undefined => {
  const match = findFirstNodeWithAncestors(ast, (node) => {
    if (node.type !== 'ClassDeclaration' || !isDtoClassName(classNameFromNode(node))) {
      return false;
    }
    const body = isObject(node.body) && Array.isArray(node.body.body) ? node.body.body : [];
    return body.some(
      (member) => isObject(member) && isDtoPropertyNode(member) && !hasClassValidatorDecorator(member)
    );
  });

  if (match === undefined) {
    return undefined;
  }

  const className = classNameFromNode(match.node) ?? 'AnonymousDto';
  const members =
    isObject(match.node.body) && Array.isArray(match.node.body.body)
      ? match.node.body.body
      : [];
  const firstInvalidProperty = members.find(
    (member) => isObject(member) && isDtoPropertyNode(member) && !hasClassValidatorDecorator(member)
  );
  const propertyName =
    isObject(firstInvalidProperty) && isObject(firstInvalidProperty.key)
      ? methodNameFromNode(firstInvalidProperty.key)
      : undefined;
  const location =
    isObject(firstInvalidProperty) && isObject(firstInvalidProperty.loc)
      ? (firstInvalidProperty.loc as AstNode)
      : isObject(match.node.loc)
        ? (match.node.loc as AstNode)
        : undefined;
  const line =
    (location === undefined ? undefined : toPositiveLine(location)) ??
    (location !== undefined &&
    isObject(location.start) &&
    typeof location.start.line === 'number'
      ? location.start.line
      : undefined);

  return {
    lines: line === undefined ? [] : sortedUniqueLines([line]),
    primary_node: className,
    related_nodes: propertyName === undefined ? ['DTO property'] : [propertyName],
    why: `El DTO ${className} declara propiedades de entrada sin decoradores de validacion/transformacion.`,
    impact:
      'La frontera HTTP acepta datos sin contrato runtime verificable, debilitando validacion, seguridad y mensajes de error consistentes.',
    expected_fix:
      'Anade decoradores class-validator/class-transformer apropiados, por ejemplo @IsString(), @IsEmail(), @Min(), @ValidateNested() o @Type(...).',
  };
};

export const hasDtoPropertyWithoutValidation = (ast: unknown): boolean =>
  findDtoPropertyWithoutValidationMatch(ast) !== undefined;

export const findDtoPropertyWithoutApiPropertyLines = (ast: unknown): readonly number[] =>
  collectLineMatchesWithAncestors(ast, (node, ancestors) => {
    if (!isDtoPropertyNode(node) || hasApiPropertyDecorator(node)) {
      return false;
    }
    return ancestors.some(
      (ancestor) => ancestor.type === 'ClassDeclaration' && isDtoClassName(classNameFromNode(ancestor))
    );
  }, { max: 12 });

export const hasDtoPropertyWithoutApiProperty = (ast: unknown): boolean =>
  findDtoPropertyWithoutApiPropertyLines(ast).length > 0;

export type TypeScriptDtoNestedPropertyWithoutNestedValidationMatch = {
  lines: readonly number[];
  primary_node: string;
  related_nodes: readonly string[];
  why: string;
  impact: string;
  expected_fix: string;
};

export const findDtoNestedPropertyWithoutNestedValidationMatch = (
  ast: unknown
): TypeScriptDtoNestedPropertyWithoutNestedValidationMatch | undefined => {
  const match = findFirstNodeWithAncestors(ast, (node) => {
    if (node.type !== 'ClassDeclaration' || !isDtoClassName(classNameFromNode(node))) {
      return false;
    }
    const body = isObject(node.body) && Array.isArray(node.body.body) ? node.body.body : [];
    return body.some(
      (member) =>
        isObject(member) &&
        isDtoPropertyNode(member) &&
        isNestedDtoTypeAnnotation(member.typeAnnotation) &&
        !hasDtoNestedValidationDecorator(member)
    );
  });

  if (match === undefined) {
    return undefined;
  }

  const className = classNameFromNode(match.node) ?? 'AnonymousDto';
  const members =
    isObject(match.node.body) && Array.isArray(match.node.body.body)
      ? match.node.body.body
      : [];
  const firstInvalidProperty = members.find(
    (member) =>
      isObject(member) &&
      isDtoPropertyNode(member) &&
      isNestedDtoTypeAnnotation(member.typeAnnotation) &&
      !hasDtoNestedValidationDecorator(member)
  );
  const propertyName =
    isObject(firstInvalidProperty) && isObject(firstInvalidProperty.key)
      ? methodNameFromNode(firstInvalidProperty.key)
      : undefined;
  const line = isObject(firstInvalidProperty) ? toPositiveLine(firstInvalidProperty) : null;

  return {
    lines: line === null ? [] : sortedUniqueLines([line]),
    primary_node: className,
    related_nodes: propertyName === undefined ? ['nested DTO property'] : [propertyName],
    why: `El DTO ${className} declara una propiedad DTO anidada sin @ValidateNested/@Type.`,
    impact:
      'La validacion runtime no materializa correctamente objetos anidados y puede aceptar payloads incompletos o mal tipados.',
    expected_fix:
      'Anade @ValidateNested() y @Type(() => NestedDto) en propiedades DTO anidadas.',
  };
};

export const hasDtoNestedPropertyWithoutNestedValidation = (ast: unknown): boolean =>
  findDtoNestedPropertyWithoutNestedValidationMatch(ast) !== undefined;

const isValidationPipeCallee = (node: unknown): boolean => {
  return isObject(node) && node.type === 'Identifier' && node.name === 'ValidationPipe';
};

const objectPropertyName = (node: unknown): string | undefined => {
  if (!isObject(node)) {
    return undefined;
  }
  if (isObject(node.key)) {
    return methodNameFromNode(node.key);
  }
  return undefined;
};

const isBooleanTrueLiteral = (node: unknown): boolean => {
  return isObject(node) && node.type === 'BooleanLiteral' && node.value === true;
};

const validationPipeOptionsEnableWhitelist = (node: unknown): boolean => {
  if (!isObject(node) || node.type !== 'ObjectExpression' || !Array.isArray(node.properties)) {
    return false;
  }
  return node.properties.some((property) => {
    return (
      isObject(property) &&
      validationPipeObjectPropertyName(property) === 'whitelist' &&
      isBooleanTrueLiteral(property.value)
    );
  });
};

const isStrictValidationPipeExpression = (node: unknown): boolean => {
  if (!isObject(node)) {
    return false;
  }
  if (node.type !== 'NewExpression' && node.type !== 'CallExpression') {
    return false;
  }
  if (!isValidationPipeCallee(node.callee)) {
    return false;
  }
  const args = Array.isArray(node.arguments) ? node.arguments : [];
  return args.some(validationPipeOptionsEnableWhitelist);
};

const isUseGlobalPipesCall = (node: AstNode): boolean => {
  return node.type === 'CallExpression' && callExpressionMemberName(node) === 'useGlobalPipes';
};

const isStrictUseGlobalPipesCall = (node: AstNode): boolean => {
  if (!isUseGlobalPipesCall(node)) {
    return false;
  }
  const args = Array.isArray(node.arguments) ? node.arguments : [];
  return args.some(isStrictValidationPipeExpression);
};

const isBackendValidationNestFactoryCreateCall = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression') {
    return false;
  }
  const memberName = callExpressionMemberName(node);
  const objectName = callExpressionObjectName(node);
  return memberName === 'create' && objectName === 'NestFactory';
};

export const findBackendMissingGlobalValidationPipeLines = (ast: unknown): readonly number[] => {
  const unsafeUseGlobalPipesLines = collectLineMatchesWithAncestors(
    ast,
    (node) => isUseGlobalPipesCall(node) && !isStrictUseGlobalPipesCall(node)
  );
  if (unsafeUseGlobalPipesLines.length > 0) {
    return unsafeUseGlobalPipesLines;
  }

  if (!hasNode(ast, isBackendValidationNestFactoryCreateCall)) {
    return [];
  }
  if (hasNode(ast, isStrictUseGlobalPipesCall)) {
    return [];
  }
  return collectLineMatchesWithAncestors(ast, isBackendValidationNestFactoryCreateCall, { max: 1 });
};

export const hasBackendMissingGlobalValidationPipe = (ast: unknown): boolean =>
  findBackendMissingGlobalValidationPipeLines(ast).length > 0;

const isHelmetCallee = (node: unknown): boolean => {
  return isObject(node) && node.type === 'Identifier' && node.name === 'helmet';
};

const isHelmetCallExpression = (node: unknown): boolean => {
  return isObject(node) && node.type === 'CallExpression' && isHelmetCallee(node.callee);
};

const isAppUseHelmetCall = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression' || callExpressionMemberName(node) !== 'use') {
    return false;
  }
  const args = Array.isArray(node.arguments) ? node.arguments : [];
  return args.some(isHelmetCallExpression);
};

export const findBackendMissingHelmetSecurityHeadersLines = (ast: unknown): readonly number[] => {
  if (!hasNode(ast, isBackendValidationNestFactoryCreateCall)) {
    return [];
  }
  if (hasNode(ast, isAppUseHelmetCall)) {
    return [];
  }
  return collectLineMatchesWithAncestors(ast, isBackendValidationNestFactoryCreateCall, { max: 1 });
};

export const hasBackendMissingHelmetSecurityHeaders = (ast: unknown): boolean =>
  findBackendMissingHelmetSecurityHeadersLines(ast).length > 0;

const isCompressionCallee = (node: unknown): boolean => {
  return isObject(node) && node.type === 'Identifier' && node.name === 'compression';
};

const isCompressionCallExpression = (node: unknown): boolean => {
  return isObject(node) && node.type === 'CallExpression' && isCompressionCallee(node.callee);
};

const isAppUseCompressionCall = (node: AstNode): boolean => {
  if (node.type !== 'CallExpression' || callExpressionMemberName(node) !== 'use') {
    return false;
  }
  const args = Array.isArray(node.arguments) ? node.arguments : [];
  return args.some(isCompressionCallExpression);
};

export const findBackendMissingCompressionMiddlewareLines = (
  ast: unknown
): readonly number[] => {
  if (!hasNode(ast, isBackendValidationNestFactoryCreateCall)) {
    return [];
  }
  if (hasNode(ast, isAppUseCompressionCall)) {
    return [];
  }
  return collectLineMatchesWithAncestors(ast, isBackendValidationNestFactoryCreateCall, { max: 1 });
};

export const hasBackendMissingCompressionMiddleware = (ast: unknown): boolean =>
  findBackendMissingCompressionMiddlewareLines(ast).length > 0;

const backendRouteDecoratorNames = new Set([
  'All',
  'Delete',
  'Get',
  'Head',
  'Options',
  'Patch',
  'Post',
  'Put',
]);

const backendControllerBusinessLogicNodeTypes = new Set([
  'DoWhileStatement',
  'ForInStatement',
  'ForOfStatement',
  'ForStatement',
  'IfStatement',
  'SwitchStatement',
  'WhileStatement',
]);

const hasBackendRouteDecorator = (node: AstNode): boolean => {
  if (!Array.isArray(node.decorators)) {
    return false;
  }
  return node.decorators.some((decorator) => {
    if (!isObject(decorator)) {
      return false;
    }
    const name = decoratorExpressionName(decorator.expression);
    return name !== undefined && backendRouteDecoratorNames.has(name);
  });
};

const isBackendControllerRouteMethod = (node: AstNode): boolean => {
  return (
    (node.type === 'ClassMethod' ||
      node.type === 'ClassPrivateMethod' ||
      node.type === 'ObjectMethod') &&
    hasBackendRouteDecorator(node)
  );
};

const isBackendControllerBusinessLogicNode = (node: AstNode): boolean => {
  if (typeof node.type === 'string' && backendControllerBusinessLogicNodeTypes.has(node.type)) {
    return true;
  }
  if (isPersistenceMutationCall(node)) {
    return true;
  }
  const objectName = callExpressionObjectName(node);
  const rootObjectName =
    node.type === 'CallExpression' && isObject(node.callee)
      ? memberExpressionRootObjectName(node.callee)
      : undefined;
  return (
    (objectName !== undefined && /(?:repository|repo|prisma|supabase|model|collection)$/i.test(objectName)) ||
    (rootObjectName !== undefined && /(?:repository|repo|prisma|supabase|model|collection)$/i.test(rootObjectName))
  );
};

export type TypeScriptBackendControllerBusinessLogicMatch = {
  lines: readonly number[];
  primary_node: string;
  related_nodes: readonly string[];
  why: string;
  impact: string;
  expected_fix: string;
};

export const findBackendControllerBusinessLogicMatch = (
  ast: unknown
): TypeScriptBackendControllerBusinessLogicMatch | undefined => {
  const match = findFirstNodeWithAncestors(ast, (node) => {
    if (!isBackendControllerRouteMethod(node)) {
      return false;
    }
    return hasDescendantNode(
      node,
      (nested) => nested !== node && isBackendControllerBusinessLogicNode(nested)
    );
  });

  if (match === undefined) {
    return undefined;
  }

  const methodName = methodNameFromNode(match.node.key) ?? 'anonymous controller route';
  const line = toPositiveLine(match.node);

  return {
    lines: line === null ? [] : sortedUniqueLines([line]),
    primary_node: methodName,
    related_nodes: ['NestJS route handler', 'business logic in controller'],
    why: `El handler ${methodName} contiene logica de negocio o acceso a persistencia dentro del controller.`,
    impact:
      'El controller deja de ser una frontera HTTP delgada, mezcla routing con dominio/aplicacion y dificulta testabilidad y reutilizacion.',
    expected_fix:
      'Mueve la logica a un service/use case inyectado y deja el controller solo con routing, validacion de entrada y delegacion.',
  };
};

export const findBackendControllerBusinessLogicLines = (ast: unknown): readonly number[] =>
  findBackendControllerBusinessLogicMatch(ast)?.lines ?? [];

export const hasBackendControllerBusinessLogic = (ast: unknown): boolean =>
  findBackendControllerBusinessLogicMatch(ast) !== undefined;

const isBackendRepositoryClassName = (name: string | undefined): boolean =>
  name !== undefined && /(?:Repository|Repo)$/i.test(name);

const isBackendRepositoryBusinessLogicMethod = (node: AstNode): boolean => {
  if (
    node.type !== 'ClassMethod' &&
    node.type !== 'ClassPrivateMethod' &&
    node.type !== 'ObjectMethod'
  ) {
    return false;
  }
  return hasDescendantNode(node, (nested) => {
    return (
      nested !== node &&
      typeof nested.type === 'string' &&
      backendControllerBusinessLogicNodeTypes.has(nested.type)
    );
  });
};

export type TypeScriptBackendRepositoryBusinessLogicMatch = {
  lines: readonly number[];
  primary_node: string;
  related_nodes: readonly string[];
  why: string;
  impact: string;
  expected_fix: string;
};

export const findBackendRepositoryBusinessLogicMatch = (
  ast: unknown
): TypeScriptBackendRepositoryBusinessLogicMatch | undefined => {
  const match = findFirstNodeWithAncestors(ast, (node) => {
    if (node.type !== 'ClassDeclaration' || !isBackendRepositoryClassName(classNameFromNode(node))) {
      return false;
    }
    const body = isObject(node.body) && Array.isArray(node.body.body) ? node.body.body : [];
    return body.some((member) => isObject(member) && isBackendRepositoryBusinessLogicMethod(member));
  });

  if (match === undefined) {
    return undefined;
  }

  const className = classNameFromNode(match.node) ?? 'Repository';
  const body = isObject(match.node.body) && Array.isArray(match.node.body.body) ? match.node.body.body : [];
  const method = body.find((member) => isObject(member) && isBackendRepositoryBusinessLogicMethod(member));
  const methodName = isObject(method) ? methodNameFromNode(method.key) : undefined;
  const line = isObject(method) ? toPositiveLine(method) : toPositiveLine(match.node);

  return {
    lines: line === null ? [] : sortedUniqueLines([line]),
    primary_node: className,
    related_nodes: methodName === undefined ? ['repository method'] : [methodName],
    why: `El repositorio ${className} contiene ramas de decision dentro de un metodo de persistencia.`,
    impact:
      'El repositorio mezcla reglas de negocio con acceso a datos, rompiendo Clean Architecture y dificultando pruebas de casos de uso.',
    expected_fix:
      'Mueve la decision de negocio a un use case/service y deja el repositorio limitado a CRUD, queries expresivas y mapeo de datos.',
  };
};

export const findBackendRepositoryBusinessLogicLines = (ast: unknown): readonly number[] =>
  findBackendRepositoryBusinessLogicMatch(ast)?.lines ?? [];

export const hasBackendRepositoryBusinessLogic = (ast: unknown): boolean =>
  findBackendRepositoryBusinessLogicMatch(ast) !== undefined;

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

export const hasDirectNetworkCall = (node: unknown): boolean => {
  return hasNetworkCallExpression(node);
};

export const hasNonSemanticClickableJsx = (node: unknown): boolean => {
  const nonSemanticClickableElements = new Set(['div', 'span', 'section', 'article', 'li']);
  const clickAttributes = new Set(['onClick', 'onMouseDown', 'onPointerDown']);
  const keyboardAttributes = new Set(['onKeyDown', 'onKeyUp', 'tabIndex', 'role']);

  return hasNode(node, (value) => {
    if (value.type !== 'JSXOpeningElement') {
      return false;
    }
    const name = jsxElementName(value.name);
    if (typeof name !== 'string' || !nonSemanticClickableElements.has(name)) {
      return false;
    }
    return hasJsxAttribute(value, clickAttributes) && !hasJsxAttribute(value, keyboardAttributes);
  });
};

export const hasRedundantAriaRoleOnSemanticJsx = (node: unknown): boolean => {
  const semanticRoleByElement = new Map([
    ['button', 'button'],
    ['nav', 'navigation'],
    ['main', 'main'],
    ['form', 'form'],
    ['section', 'region'],
    ['article', 'article'],
    ['aside', 'complementary'],
    ['header', 'banner'],
    ['footer', 'contentinfo'],
    ['ul', 'list'],
    ['ol', 'list'],
  ]);

  return hasNode(node, (value) => {
    if (value.type !== 'JSXOpeningElement') {
      return false;
    }
    const name = jsxElementName(value.name);
    if (typeof name !== 'string') {
      return false;
    }
    const expectedRole = semanticRoleByElement.get(name);
    if (typeof expectedRole !== 'string') {
      return false;
    }
    return jsxAttributeValue(value, 'role') === expectedRole;
  });
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
