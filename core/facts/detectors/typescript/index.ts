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
const GOD_CLASS_MAX_LINES = 300;
const networkCallCalleePattern = /^(fetch|axios|get|post|put|patch|delete|request)$/i;
const ignoredMagicNumberValues = new Set<number>([0, 1]);
const runtimeTestDoubleLibraryPattern = /^(sinon|testdouble|ts-mockito|jest-mock|vitest)$/i;
const runtimeTestDoublePathPattern = /(^|\/)(__mocks__|mocks|fakes|spies|stubs)(\/|$)|\.(mock|fake|spy|stub)$/i;
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

    const typedCaseCount = value.cases.filter((entry) => {
      if (!isObject(entry) || entry.type !== 'SwitchCase' || !isObject(entry.test)) {
        return false;
      }
      return typeof switchCaseLabelFromNode(entry.test) === 'string';
    }).length;

    return typedCaseCount >= 2;
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

  if (caseNodes.length < 2) {
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

export const hasMagicNumberLiteral = (node: unknown): boolean => {
  return [...collectMagicNumberOccurrences(node).values()].some(
    (occurrence) => occurrence.count >= 2
  );
};

export const findMagicNumberLiteralLines = (node: unknown): readonly number[] => {
  return collectRepeatedMagicNumberLines(node);
};

const runtimeTestDoubleSpecifier = (node: unknown): string | undefined => {
  if (!isObject(node) || node.type !== 'StringLiteral' || typeof node.value !== 'string') {
    return undefined;
  }
  return node.value;
};

const matchesRuntimeTestDoubleImport = (specifier: string): boolean => {
  return (
    runtimeTestDoubleLibraryPattern.test(specifier) ||
    runtimeTestDoublePathPattern.test(specifier)
  );
};

const isRuntimeTestDoubleImportNode = (value: AstNode): boolean => {
  if (value.type === 'ImportDeclaration') {
    const specifier = runtimeTestDoubleSpecifier(value.source);
    return typeof specifier === 'string' && matchesRuntimeTestDoubleImport(specifier);
  }

  if (
    value.type === 'CallExpression' &&
    isObject(value.callee) &&
    value.callee.type === 'Identifier' &&
    value.callee.name === 'require' &&
    Array.isArray(value.arguments)
  ) {
    return value.arguments.some((argument) => {
      const specifier = runtimeTestDoubleSpecifier(argument);
      return typeof specifier === 'string' && matchesRuntimeTestDoubleImport(specifier);
    });
  }

  return false;
};

export const hasProductionMockArtifactUsage = (node: unknown): boolean => {
  return hasNode(node, (value) => isRuntimeTestDoubleImportNode(value));
};

export const findProductionMockArtifactUsageLines = (node: unknown): readonly number[] => {
  return collectLineMatchesWithAncestors(node, (value) => isRuntimeTestDoubleImportNode(value), {
    max: 8,
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

    const typedCaseCount = value.cases.filter((entry) => {
      if (!isObject(entry) || entry.type !== 'SwitchCase' || !isObject(entry.test)) {
        return false;
      }
      const testNode = entry.test;
      return (
        testNode.type === 'StringLiteral' ||
        testNode.type === 'NumericLiteral' ||
        testNode.type === 'BooleanLiteral'
      );
    }).length;

    return typedCaseCount >= 2;
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

const nodeLineSpan = (node: unknown): number => {
  if (!isObject(node) || !isObject(node.loc)) {
    return 0;
  }
  const start = isObject(node.loc.start) ? node.loc.start.line : undefined;
  const end = isObject(node.loc.end) ? node.loc.end.line : undefined;
  if (typeof start !== 'number' || typeof end !== 'number') {
    return 0;
  }
  return Math.max(0, end - start + 1);
};

type MagicNumberOccurrence = {
  count: number;
  lines: number[];
};

const magicNumberValueFromNode = (node: unknown): number | undefined => {
  if (!isObject(node) || node.type !== 'NumericLiteral' || typeof node.value !== 'number') {
    return undefined;
  }
  if (!Number.isFinite(node.value) || ignoredMagicNumberValues.has(node.value)) {
    return undefined;
  }
  return node.value;
};

const isExecutableMagicNumberContext = (
  value: AstNode,
  ancestors: ReadonlyArray<AstNode>
): boolean => {
  const parent = ancestors[ancestors.length - 1];
  if (!isObject(parent)) {
    return false;
  }
  if (parent.type === 'BinaryExpression') {
    return parent.left === value || parent.right === value;
  }
  if (parent.type === 'CallExpression' || parent.type === 'NewExpression') {
    return Array.isArray(parent.arguments) && parent.arguments.includes(value);
  }
  if (parent.type === 'AssignmentExpression') {
    return parent.right === value;
  }
  if (parent.type === 'ReturnStatement') {
    return parent.argument === value;
  }
  if (parent.type === 'SwitchCase') {
    return parent.test === value;
  }
  return false;
};

const collectMagicNumberOccurrences = (
  node: unknown
): ReadonlyMap<number, MagicNumberOccurrence> => {
  const occurrences = new Map<number, MagicNumberOccurrence>();

  const walk = (value: unknown, ancestors: ReadonlyArray<AstNode>): void => {
    if (!isObject(value)) {
      return;
    }

    const numericValue = magicNumberValueFromNode(value);
    if (typeof numericValue === 'number' && isExecutableMagicNumberContext(value, ancestors)) {
      const current = occurrences.get(numericValue) ?? { count: 0, lines: [] };
      current.count += 1;
      const line = toPositiveLine(value);
      if (typeof line === 'number') {
        current.lines.push(line);
      }
      occurrences.set(numericValue, current);
    }

    const nextAncestors = [...ancestors, value];
    for (const child of Object.values(value)) {
      if (Array.isArray(child)) {
        for (const entry of child) {
          walk(entry, nextAncestors);
        }
        continue;
      }
      walk(child, nextAncestors);
    }
  };

  walk(node, []);
  return occurrences;
};

const collectRepeatedMagicNumberLines = (node: unknown): readonly number[] => {
  return sortedUniqueLines(
    [...collectMagicNumberOccurrences(node).values()]
      .filter((occurrence) => occurrence.count >= 2)
      .flatMap((occurrence) => occurrence.lines)
  );
};

export const hasLargeClassDeclaration = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'ClassDeclaration' && value.type !== 'ClassExpression') {
      return false;
    }
    return nodeLineSpan(value) >= GOD_CLASS_MAX_LINES;
  });
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
