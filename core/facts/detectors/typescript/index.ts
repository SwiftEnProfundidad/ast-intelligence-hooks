import { hasNode, isObject } from '../utils/astHelpers';

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
const GOD_CLASS_MAX_LINES = 500;

const methodNameFromNode = (node: unknown): string | undefined => {
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

const memberExpressionPropertyName = (node: unknown): string | undefined => {
  if (!isObject(node) || node.type !== 'MemberExpression') {
    return undefined;
  }
  return methodNameFromNode(node.property);
};

const literalTextFromNode = (node: unknown): string | undefined => {
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

export const hasEmptyCatchClause = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CatchClause') {
      return false;
    }
    const body = value.body;
    return isObject(body) && Array.isArray(body.body) && body.body.length === 0;
  });
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
