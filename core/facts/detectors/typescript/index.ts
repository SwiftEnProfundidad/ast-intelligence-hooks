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
type AstNode = Record<string, string | number | boolean | bigint | symbol | null | Date | object>;

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

    const classBody = value.body;
    if (!isObject(classBody) || !Array.isArray(classBody.body)) {
      return false;
    }

    const methodNames: string[] = [];
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
      if (typeof name === 'string' && name.length > 0) {
        methodNames.push(name);
      }
    }

    return hasMixedCommandAndQueryNames(methodNames);
  });
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

export const hasFrameworkDependencyImport = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type === 'ImportDeclaration') {
      const sourceNode = value.source;
      return (
        isObject(sourceNode) &&
        sourceNode.type === 'StringLiteral' &&
        typeof sourceNode.value === 'string' &&
        frameworkDependencyPattern.test(sourceNode.value)
      );
    }

    if (value.type !== 'CallExpression') {
      return false;
    }

    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'Identifier' || callee.name !== 'require') {
      return false;
    }
    if (!Array.isArray(value.arguments) || value.arguments.length === 0) {
      return false;
    }
    const firstArg = value.arguments[0];
    return (
      isObject(firstArg) &&
      firstArg.type === 'StringLiteral' &&
      typeof firstArg.value === 'string' &&
      frameworkDependencyPattern.test(firstArg.value)
    );
  });
};

export const hasConcreteDependencyInstantiation = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'NewExpression') {
      return false;
    }
    const calleeName = methodNameFromNode(value.callee) ?? memberExpressionPropertyName(value.callee);
    return typeof calleeName === 'string' && concreteDependencyNames.has(calleeName);
  });
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
