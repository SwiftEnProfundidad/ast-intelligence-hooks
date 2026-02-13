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

const hasProcessExitCall = (node: unknown): boolean => {
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
      objectNode.name === 'process' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'exit'
    );
  });
};

const hasDeleteOperator = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    return value.type === 'UnaryExpression' && value.operator === 'delete';
  });
};

const hasInnerHtmlAssignment = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'AssignmentExpression') {
      return false;
    }
    const left = value.left;
    if (!isObject(left) || left.type !== 'MemberExpression') {
      return false;
    }
    const propertyNode = left.property;
    if (!isObject(propertyNode)) {
      return false;
    }
    if (left.computed === true) {
      return propertyNode.type === 'StringLiteral' && propertyNode.value === 'innerHTML';
    }
    return propertyNode.type === 'Identifier' && propertyNode.name === 'innerHTML';
  });
};

const hasDocumentWriteCall = (node: unknown): boolean => {
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
      objectNode.name === 'document' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'write'
    );
  });
};

const hasInsertAdjacentHtmlCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }

    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    if (!isObject(propertyNode)) {
      return false;
    }
    if (callee.computed === true) {
      return propertyNode.type === 'StringLiteral' && propertyNode.value === 'insertAdjacentHTML';
    }
    return propertyNode.type === 'Identifier' && propertyNode.name === 'insertAdjacentHTML';
  });
};

const hasChildProcessImport = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type === 'ImportDeclaration') {
      const source = value.source;
      return (
        isObject(source) &&
        ((source.type === 'StringLiteral' && source.value === 'child_process') ||
          (source.type === 'Literal' && source.value === 'child_process'))
      );
    }

    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'Identifier' || callee.name !== 'require') {
      return false;
    }
    const firstArg = value.arguments[0];
    return (
      isObject(firstArg) &&
      ((firstArg.type === 'StringLiteral' && firstArg.value === 'child_process') ||
        (firstArg.type === 'Literal' && firstArg.value === 'child_process'))
    );
  });
};

const hasProcessEnvMutation = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'AssignmentExpression') {
      return false;
    }
    const left = value.left;
    if (!isObject(left) || left.type !== 'MemberExpression') {
      return false;
    }
    const outerObjectNode = left.object;
    if (!isObject(outerObjectNode) || outerObjectNode.type !== 'MemberExpression') {
      return false;
    }
    const processNode = outerObjectNode.object;
    const envNode = outerObjectNode.property;
    return (
      isObject(processNode) &&
      processNode.type === 'Identifier' &&
      processNode.name === 'process' &&
      isObject(envNode) &&
      envNode.type === 'Identifier' &&
      envNode.name === 'env'
    );
  });
};

const hasFsWriteFileSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'writeFileSync'
    );
  });
};

const hasFsRmSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'rmSync'
    );
  });
};

const hasFsMkdirSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'mkdirSync'
    );
  });
};

const hasFsReaddirSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'readdirSync'
    );
  });
};

const hasFsReadFileSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'readFileSync'
    );
  });
};

const hasFsStatSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'statSync'
    );
  });
};

const hasFsRealpathSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'realpathSync'
    );
  });
};

const hasFsLstatSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'lstatSync'
    );
  });
};

const hasFsExistsSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'existsSync'
    );
  });
};

const hasFsChmodSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'chmodSync'
    );
  });
};

const hasFsChownSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'chownSync'
    );
  });
};

const hasFsFchownSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'fchownSync'
    );
  });
};

const hasFsFchmodSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'fchmodSync'
    );
  });
};

const hasFsFstatSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'fstatSync'
    );
  });
};

const hasFsFtruncateSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'ftruncateSync'
    );
  });
};

const hasFsFutimesSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'futimesSync'
    );
  });
};

const hasFsLutimesSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'lutimesSync'
    );
  });
};

const hasFsReadvSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'readvSync'
    );
  });
};

const hasFsWritevSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'writevSync'
    );
  });
};

const hasFsWriteSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'writeSync'
    );
  });
};

const hasFsFsyncSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'fsyncSync'
    );
  });
};

const hasFsFdatasyncSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'fdatasyncSync'
    );
  });
};

const hasFsCloseSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'closeSync'
    );
  });
};

const hasExecSyncCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }

    const callee = value.callee;
    if (isObject(callee) && callee.type === 'Identifier') {
      return callee.name === 'execSync';
    }
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }
    const propertyNode = callee.property;
    if (!isObject(propertyNode)) {
      return false;
    }
    if (callee.computed === true) {
      return propertyNode.type === 'StringLiteral' && propertyNode.value === 'execSync';
    }
    return propertyNode.type === 'Identifier' && propertyNode.name === 'execSync';
  });
};

const hasExecCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }

    const callee = value.callee;
    if (isObject(callee) && callee.type === 'Identifier') {
      return callee.name === 'exec';
    }
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }
    const propertyNode = callee.property;
    if (!isObject(propertyNode)) {
      return false;
    }
    if (callee.computed === true) {
      return propertyNode.type === 'StringLiteral' && propertyNode.value === 'exec';
    }
    return propertyNode.type === 'Identifier' && propertyNode.name === 'exec';
  });
};

const hasSpawnSyncCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }

    const callee = value.callee;
    if (isObject(callee) && callee.type === 'Identifier') {
      return callee.name === 'spawnSync';
    }
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }
    const propertyNode = callee.property;
    if (!isObject(propertyNode)) {
      return false;
    }
    if (callee.computed === true) {
      return propertyNode.type === 'StringLiteral' && propertyNode.value === 'spawnSync';
    }
    return propertyNode.type === 'Identifier' && propertyNode.name === 'spawnSync';
  });
};

const hasSpawnCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }

    const callee = value.callee;
    if (isObject(callee) && callee.type === 'Identifier') {
      return callee.name === 'spawn';
    }
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }
    const propertyNode = callee.property;
    if (!isObject(propertyNode)) {
      return false;
    }
    if (callee.computed === true) {
      return propertyNode.type === 'StringLiteral' && propertyNode.value === 'spawn';
    }
    return propertyNode.type === 'Identifier' && propertyNode.name === 'spawn';
  });
};

const hasForkCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }

    const callee = value.callee;
    if (isObject(callee) && callee.type === 'Identifier') {
      return callee.name === 'fork';
    }
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }
    const propertyNode = callee.property;
    if (!isObject(propertyNode)) {
      return false;
    }
    if (callee.computed === true) {
      return propertyNode.type === 'StringLiteral' && propertyNode.value === 'fork';
    }
    return propertyNode.type === 'Identifier' && propertyNode.name === 'fork';
  });
};

const hasExecFileSyncCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }

    const callee = value.callee;
    if (isObject(callee) && callee.type === 'Identifier') {
      return callee.name === 'execFileSync';
    }
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }
    const propertyNode = callee.property;
    if (!isObject(propertyNode)) {
      return false;
    }
    if (callee.computed === true) {
      return propertyNode.type === 'StringLiteral' && propertyNode.value === 'execFileSync';
    }
    return propertyNode.type === 'Identifier' && propertyNode.name === 'execFileSync';
  });
};

const hasFsAppendFileSyncCall = (node: unknown): boolean => {
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
      objectNode.name === 'fs' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'appendFileSync'
    );
  });
};

const hasFsPromisesWriteFileCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isWriteFileProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'writeFile') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'writeFile');
    if (!isWriteFileProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesAppendFileCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isAppendFileProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'appendFile') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'appendFile');
    if (!isAppendFileProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesRmCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isRmProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'rm') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'rm');
    if (!isRmProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesUnlinkCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isUnlinkProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'unlink') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'unlink');
    if (!isUnlinkProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesReadFileCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isReadFileProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'readFile') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'readFile');
    if (!isReadFileProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesReaddirCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isReaddirProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'readdir') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'readdir');
    if (!isReaddirProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesMkdirCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isMkdirProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'mkdir') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'mkdir');
    if (!isMkdirProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesStatCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isStatProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'stat') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'stat');
    if (!isStatProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesCopyFileCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isCopyFileProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'copyFile') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'copyFile');
    if (!isCopyFileProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesRenameCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isRenameProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'rename') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'rename');
    if (!isRenameProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesAccessCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isAccessProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'access') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'access');
    if (!isAccessProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesChmodCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isChmodProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'chmod') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'chmod');
    if (!isChmodProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesChownCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isChownProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'chown') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'chown');
    if (!isChownProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesUtimesCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isUtimesProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'utimes') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'utimes');
    if (!isUtimesProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesLstatCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isLstatProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'lstat') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'lstat');
    if (!isLstatProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesRealpathCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isRealpathProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'realpath') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'realpath');
    if (!isRealpathProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesSymlinkCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isSymlinkProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'symlink') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'symlink');
    if (!isSymlinkProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesLinkCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isLinkProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'link') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'link');
    if (!isLinkProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesReadlinkCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isReadlinkProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'readlink') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'readlink');
    if (!isReadlinkProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesOpenCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isOpenProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'open') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'open');
    if (!isOpenProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesOpendirCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isOpendirProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'opendir') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'opendir');
    if (!isOpendirProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesCpCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isCpProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'cp') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'cp');
    if (!isCpProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsPromisesMkdtempCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }

    const propertyNode = callee.property;
    const isMkdtempProperty =
      (callee.computed === true &&
        isObject(propertyNode) &&
        propertyNode.type === 'StringLiteral' &&
        propertyNode.value === 'mkdtemp') ||
      (callee.computed !== true &&
        isObject(propertyNode) &&
        propertyNode.type === 'Identifier' &&
        propertyNode.name === 'mkdtemp');
    if (!isMkdtempProperty) {
      return false;
    }

    const objectNode = callee.object;
    if (!isObject(objectNode) || objectNode.type !== 'MemberExpression') {
      return false;
    }

    const promisesProperty = objectNode.property;
    const isPromisesProperty =
      (objectNode.computed === true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'StringLiteral' &&
        promisesProperty.value === 'promises') ||
      (objectNode.computed !== true &&
        isObject(promisesProperty) &&
        promisesProperty.type === 'Identifier' &&
        promisesProperty.name === 'promises');
    if (!isPromisesProperty) {
      return false;
    }

    const fsNode = objectNode.object;
    return isObject(fsNode) && fsNode.type === 'Identifier' && fsNode.name === 'fs';
  });
};

const hasFsUtimesCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isUtimesProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'utimes') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'utimes');
      if (!isUtimesProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return isObject(argument) && (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression');
      });
    }

    return false;
  });
};

const hasFsWatchCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isWatchProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'watch') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'watch');
      if (!isWatchProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return isObject(argument) && (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression');
      });
    }

    return false;
  });
};

const hasFsWatchFileCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isWatchFileProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'watchFile') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'watchFile');
      if (!isWatchFileProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsUnwatchFileCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isUnwatchFileProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'unwatchFile') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'unwatchFile');
      if (!isUnwatchFileProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsReadFileCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isReadFileProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'readFile') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'readFile');
      if (!isReadFileProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsExistsCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isExistsProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'exists') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'exists');
      if (!isExistsProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsWriteFileCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isWriteFileProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'writeFile') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'writeFile');
      if (!isWriteFileProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsAppendFileCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isAppendFileProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'appendFile') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'appendFile');
      if (!isAppendFileProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsReaddirCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isReaddirProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'readdir') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'readdir');
      if (!isReaddirProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsMkdirCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isMkdirProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'mkdir') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'mkdir');
      if (!isMkdirProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsRmdirCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isRmdirProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'rmdir') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'rmdir');
      if (!isRmdirProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsRmCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isRmProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'rm') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'rm');
      if (!isRmProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsRenameCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isRenameProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'rename') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'rename');
      if (!isRenameProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsCopyFileCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isCopyFileProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'copyFile') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'copyFile');
      if (!isCopyFileProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsStatCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isStatProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'stat') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'stat');
      if (!isStatProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsStatfsCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isStatfsProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'statfs') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'statfs');
      if (!isStatfsProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsLstatCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isLstatProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'lstat') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'lstat');
      if (!isLstatProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsRealpathCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isRealpathProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'realpath') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'realpath');
      if (!isRealpathProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsAccessCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isAccessProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'access') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'access');
      if (!isAccessProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsChmodCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isChmodProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'chmod') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'chmod');
      if (!isChmodProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsChownCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isChownProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'chown') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'chown');
      if (!isChownProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsLchownCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isLchownProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'lchown') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'lchown');
      if (!isLchownProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsLchmodCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isLchmodProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'lchmod') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'lchmod');
      if (!isLchmodProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsUnlinkCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isUnlinkProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'unlink') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'unlink');
      if (!isUnlinkProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsReadlinkCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isReadlinkProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'readlink') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'readlink');
      if (!isReadlinkProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsSymlinkCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isSymlinkProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'symlink') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'symlink');
      if (!isSymlinkProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsLinkCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isLinkProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'link') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'link');
      if (!isLinkProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsMkdtempCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isMkdtempProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'mkdtemp') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'mkdtemp');
      if (!isMkdtempProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsOpendirCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isOpendirProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'opendir') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'opendir');
      if (!isOpendirProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsOpenCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isOpenProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'open') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'open');
      if (!isOpenProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsCpCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isCpProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'cp') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'cp');
      if (!isCpProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsCloseCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isCloseProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'close') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'close');
      if (!isCloseProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsReadCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isReadProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'read') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'read');
      if (!isReadProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsWriteCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isWriteProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'write') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'write');
      if (!isWriteProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsFsyncCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isFsyncProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'fsync') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'fsync');
      if (!isFsyncProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsFdatasyncCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isFdatasyncProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'fdatasync') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'fdatasync');
      if (!isFdatasyncProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsFtruncateCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isFtruncateProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'ftruncate') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'ftruncate');
      if (!isFtruncateProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsTruncateCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isTruncateProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'truncate') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'truncate');
      if (!isTruncateProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsFutimesCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isFutimesProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'futimes') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'futimes');
      if (!isFutimesProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsLutimesCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isLutimesProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'lutimes') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'lutimes');
      if (!isLutimesProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsFchownCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isFchownProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'fchown') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'fchown');
      if (!isFchownProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsFchmodCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isFchmodProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'fchmod') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'fchmod');
      if (!isFchmodProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsFstatCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isFstatProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'fstat') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'fstat');
      if (!isFstatProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsReadvCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isReadvProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'readv') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'readv');
      if (!isReadvProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasFsWritevCallbackCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;

    if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      const isWritevProperty =
        (callee.computed === true &&
          isObject(propertyNode) &&
          propertyNode.type === 'StringLiteral' &&
          propertyNode.value === 'writev') ||
        (callee.computed !== true &&
          isObject(propertyNode) &&
          propertyNode.type === 'Identifier' &&
          propertyNode.name === 'writev');
      if (!isWritevProperty) {
        return false;
      }

      const objectNode = callee.object;
      const isFsObject =
        isObject(objectNode) &&
        objectNode.type === 'Identifier' &&
        objectNode.name === 'fs';
      if (!isFsObject) {
        return false;
      }

      return value.arguments.some((argument) => {
        return (
          isObject(argument) &&
          (argument.type === 'ArrowFunctionExpression' || argument.type === 'FunctionExpression')
        );
      });
    }

    return false;
  });
};

const hasExecFileCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }

    const callee = value.callee;
    if (isObject(callee) && callee.type === 'Identifier') {
      return callee.name === 'execFile';
    }
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }
    const propertyNode = callee.property;
    if (!isObject(propertyNode)) {
      return false;
    }
    if (callee.computed === true) {
      return propertyNode.type === 'StringLiteral' && propertyNode.value === 'execFile';
    }
    return propertyNode.type === 'Identifier' && propertyNode.name === 'execFile';
  });
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

      if (hasProcessExitCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.process-exit.ast',
            code: 'HEURISTICS_PROCESS_EXIT_AST',
            message: 'AST heuristic detected process.exit usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasDeleteOperator(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.delete-operator.ast',
            code: 'HEURISTICS_DELETE_OPERATOR_AST',
            message: 'AST heuristic detected delete-operator usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasInnerHtmlAssignment(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.inner-html.ast',
            code: 'HEURISTICS_INNER_HTML_AST',
            message: 'AST heuristic detected innerHTML assignment.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasDocumentWriteCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.document-write.ast',
            code: 'HEURISTICS_DOCUMENT_WRITE_AST',
            message: 'AST heuristic detected document.write usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasInsertAdjacentHtmlCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.insert-adjacent-html.ast',
            code: 'HEURISTICS_INSERT_ADJACENT_HTML_AST',
            message: 'AST heuristic detected insertAdjacentHTML usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasChildProcessImport(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.child-process-import.ast',
            code: 'HEURISTICS_CHILD_PROCESS_IMPORT_AST',
            message: 'AST heuristic detected child_process import/require usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasProcessEnvMutation(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.process-env-mutation.ast',
            code: 'HEURISTICS_PROCESS_ENV_MUTATION_AST',
            message: 'AST heuristic detected process.env mutation.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsWriteFileSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-write-file-sync.ast',
            code: 'HEURISTICS_FS_WRITE_FILE_SYNC_AST',
            message: 'AST heuristic detected fs.writeFileSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsRmSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-rm-sync.ast',
            code: 'HEURISTICS_FS_RM_SYNC_AST',
            message: 'AST heuristic detected fs.rmSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsMkdirSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-mkdir-sync.ast',
            code: 'HEURISTICS_FS_MKDIR_SYNC_AST',
            message: 'AST heuristic detected fs.mkdirSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsReaddirSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-readdir-sync.ast',
            code: 'HEURISTICS_FS_READDIR_SYNC_AST',
            message: 'AST heuristic detected fs.readdirSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsReadFileSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-read-file-sync.ast',
            code: 'HEURISTICS_FS_READ_FILE_SYNC_AST',
            message: 'AST heuristic detected fs.readFileSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsStatSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-stat-sync.ast',
            code: 'HEURISTICS_FS_STAT_SYNC_AST',
            message: 'AST heuristic detected fs.statSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsRealpathSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-realpath-sync.ast',
            code: 'HEURISTICS_FS_REALPATH_SYNC_AST',
            message: 'AST heuristic detected fs.realpathSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsLstatSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-lstat-sync.ast',
            code: 'HEURISTICS_FS_LSTAT_SYNC_AST',
            message: 'AST heuristic detected fs.lstatSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsExistsSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-exists-sync.ast',
            code: 'HEURISTICS_FS_EXISTS_SYNC_AST',
            message: 'AST heuristic detected fs.existsSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsChmodSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-chmod-sync.ast',
            code: 'HEURISTICS_FS_CHMOD_SYNC_AST',
            message: 'AST heuristic detected fs.chmodSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsChownSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-chown-sync.ast',
            code: 'HEURISTICS_FS_CHOWN_SYNC_AST',
            message: 'AST heuristic detected fs.chownSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsFchownSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-fchown-sync.ast',
            code: 'HEURISTICS_FS_FCHOWN_SYNC_AST',
            message: 'AST heuristic detected fs.fchownSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsFchmodSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-fchmod-sync.ast',
            code: 'HEURISTICS_FS_FCHMOD_SYNC_AST',
            message: 'AST heuristic detected fs.fchmodSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsFstatSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-fstat-sync.ast',
            code: 'HEURISTICS_FS_FSTAT_SYNC_AST',
            message: 'AST heuristic detected fs.fstatSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsFtruncateSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-ftruncate-sync.ast',
            code: 'HEURISTICS_FS_FTRUNCATE_SYNC_AST',
            message: 'AST heuristic detected fs.ftruncateSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsFutimesSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-futimes-sync.ast',
            code: 'HEURISTICS_FS_FUTIMES_SYNC_AST',
            message: 'AST heuristic detected fs.futimesSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsLutimesSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-lutimes-sync.ast',
            code: 'HEURISTICS_FS_LUTIMES_SYNC_AST',
            message: 'AST heuristic detected fs.lutimesSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsReadvSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-readv-sync.ast',
            code: 'HEURISTICS_FS_READV_SYNC_AST',
            message: 'AST heuristic detected fs.readvSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsWritevSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-writev-sync.ast',
            code: 'HEURISTICS_FS_WRITEV_SYNC_AST',
            message: 'AST heuristic detected fs.writevSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsWriteSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-write-sync.ast',
            code: 'HEURISTICS_FS_WRITE_SYNC_AST',
            message: 'AST heuristic detected fs.writeSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsFsyncSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-fsync-sync.ast',
            code: 'HEURISTICS_FS_FSYNC_SYNC_AST',
            message: 'AST heuristic detected fs.fsyncSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsFdatasyncSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-fdatasync-sync.ast',
            code: 'HEURISTICS_FS_FDATASYNC_SYNC_AST',
            message: 'AST heuristic detected fs.fdatasyncSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsCloseSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-close-sync.ast',
            code: 'HEURISTICS_FS_CLOSE_SYNC_AST',
            message: 'AST heuristic detected fs.closeSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasExecSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.child-process-exec-sync.ast',
            code: 'HEURISTICS_CHILD_PROCESS_EXEC_SYNC_AST',
            message: 'AST heuristic detected execSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasExecCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.child-process-exec.ast',
            code: 'HEURISTICS_CHILD_PROCESS_EXEC_AST',
            message: 'AST heuristic detected exec usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasSpawnSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.child-process-spawn-sync.ast',
            code: 'HEURISTICS_CHILD_PROCESS_SPAWN_SYNC_AST',
            message: 'AST heuristic detected spawnSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasSpawnCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.child-process-spawn.ast',
            code: 'HEURISTICS_CHILD_PROCESS_SPAWN_AST',
            message: 'AST heuristic detected spawn usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasForkCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.child-process-fork.ast',
            code: 'HEURISTICS_CHILD_PROCESS_FORK_AST',
            message: 'AST heuristic detected fork usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasExecFileSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.child-process-exec-file-sync.ast',
            code: 'HEURISTICS_CHILD_PROCESS_EXEC_FILE_SYNC_AST',
            message: 'AST heuristic detected execFileSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsAppendFileSyncCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-append-file-sync.ast',
            code: 'HEURISTICS_FS_APPEND_FILE_SYNC_AST',
            message: 'AST heuristic detected fs.appendFileSync usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesWriteFileCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-write-file.ast',
            code: 'HEURISTICS_FS_PROMISES_WRITE_FILE_AST',
            message: 'AST heuristic detected fs.promises.writeFile usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesAppendFileCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-append-file.ast',
            code: 'HEURISTICS_FS_PROMISES_APPEND_FILE_AST',
            message: 'AST heuristic detected fs.promises.appendFile usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesRmCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-rm.ast',
            code: 'HEURISTICS_FS_PROMISES_RM_AST',
            message: 'AST heuristic detected fs.promises.rm usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesUnlinkCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-unlink.ast',
            code: 'HEURISTICS_FS_PROMISES_UNLINK_AST',
            message: 'AST heuristic detected fs.promises.unlink usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesReadFileCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-read-file.ast',
            code: 'HEURISTICS_FS_PROMISES_READ_FILE_AST',
            message: 'AST heuristic detected fs.promises.readFile usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesReaddirCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-readdir.ast',
            code: 'HEURISTICS_FS_PROMISES_READDIR_AST',
            message: 'AST heuristic detected fs.promises.readdir usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesMkdirCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-mkdir.ast',
            code: 'HEURISTICS_FS_PROMISES_MKDIR_AST',
            message: 'AST heuristic detected fs.promises.mkdir usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesStatCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-stat.ast',
            code: 'HEURISTICS_FS_PROMISES_STAT_AST',
            message: 'AST heuristic detected fs.promises.stat usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesCopyFileCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-copy-file.ast',
            code: 'HEURISTICS_FS_PROMISES_COPY_FILE_AST',
            message: 'AST heuristic detected fs.promises.copyFile usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesRenameCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-rename.ast',
            code: 'HEURISTICS_FS_PROMISES_RENAME_AST',
            message: 'AST heuristic detected fs.promises.rename usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesAccessCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-access.ast',
            code: 'HEURISTICS_FS_PROMISES_ACCESS_AST',
            message: 'AST heuristic detected fs.promises.access usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesChmodCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-chmod.ast',
            code: 'HEURISTICS_FS_PROMISES_CHMOD_AST',
            message: 'AST heuristic detected fs.promises.chmod usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesChownCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-chown.ast',
            code: 'HEURISTICS_FS_PROMISES_CHOWN_AST',
            message: 'AST heuristic detected fs.promises.chown usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesUtimesCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-utimes.ast',
            code: 'HEURISTICS_FS_PROMISES_UTIMES_AST',
            message: 'AST heuristic detected fs.promises.utimes usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesLstatCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-lstat.ast',
            code: 'HEURISTICS_FS_PROMISES_LSTAT_AST',
            message: 'AST heuristic detected fs.promises.lstat usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesRealpathCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-realpath.ast',
            code: 'HEURISTICS_FS_PROMISES_REALPATH_AST',
            message: 'AST heuristic detected fs.promises.realpath usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesSymlinkCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-symlink.ast',
            code: 'HEURISTICS_FS_PROMISES_SYMLINK_AST',
            message: 'AST heuristic detected fs.promises.symlink usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesLinkCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-link.ast',
            code: 'HEURISTICS_FS_PROMISES_LINK_AST',
            message: 'AST heuristic detected fs.promises.link usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesReadlinkCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-readlink.ast',
            code: 'HEURISTICS_FS_PROMISES_READLINK_AST',
            message: 'AST heuristic detected fs.promises.readlink usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesOpenCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-open.ast',
            code: 'HEURISTICS_FS_PROMISES_OPEN_AST',
            message: 'AST heuristic detected fs.promises.open usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesOpendirCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-opendir.ast',
            code: 'HEURISTICS_FS_PROMISES_OPENDIR_AST',
            message: 'AST heuristic detected fs.promises.opendir usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesCpCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-cp.ast',
            code: 'HEURISTICS_FS_PROMISES_CP_AST',
            message: 'AST heuristic detected fs.promises.cp usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsPromisesMkdtempCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-promises-mkdtemp.ast',
            code: 'HEURISTICS_FS_PROMISES_MKDTEMP_AST',
            message: 'AST heuristic detected fs.promises.mkdtemp usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsUtimesCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-utimes-callback.ast',
            code: 'HEURISTICS_FS_UTIMES_CALLBACK_AST',
            message: 'AST heuristic detected fs.utimes callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsWatchCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-watch-callback.ast',
            code: 'HEURISTICS_FS_WATCH_CALLBACK_AST',
            message: 'AST heuristic detected fs.watch callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsWatchFileCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-watch-file-callback.ast',
            code: 'HEURISTICS_FS_WATCH_FILE_CALLBACK_AST',
            message: 'AST heuristic detected fs.watchFile callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsUnwatchFileCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-unwatch-file-callback.ast',
            code: 'HEURISTICS_FS_UNWATCH_FILE_CALLBACK_AST',
            message: 'AST heuristic detected fs.unwatchFile callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsReadFileCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-read-file-callback.ast',
            code: 'HEURISTICS_FS_READ_FILE_CALLBACK_AST',
            message: 'AST heuristic detected fs.readFile callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsExistsCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-exists-callback.ast',
            code: 'HEURISTICS_FS_EXISTS_CALLBACK_AST',
            message: 'AST heuristic detected fs.exists callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsWriteFileCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-write-file-callback.ast',
            code: 'HEURISTICS_FS_WRITE_FILE_CALLBACK_AST',
            message: 'AST heuristic detected fs.writeFile callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsAppendFileCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-append-file-callback.ast',
            code: 'HEURISTICS_FS_APPEND_FILE_CALLBACK_AST',
            message: 'AST heuristic detected fs.appendFile callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsReaddirCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-readdir-callback.ast',
            code: 'HEURISTICS_FS_READDIR_CALLBACK_AST',
            message: 'AST heuristic detected fs.readdir callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsMkdirCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-mkdir-callback.ast',
            code: 'HEURISTICS_FS_MKDIR_CALLBACK_AST',
            message: 'AST heuristic detected fs.mkdir callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsRmdirCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-rmdir-callback.ast',
            code: 'HEURISTICS_FS_RMDIR_CALLBACK_AST',
            message: 'AST heuristic detected fs.rmdir callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsRmCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-rm-callback.ast',
            code: 'HEURISTICS_FS_RM_CALLBACK_AST',
            message: 'AST heuristic detected fs.rm callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsRenameCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-rename-callback.ast',
            code: 'HEURISTICS_FS_RENAME_CALLBACK_AST',
            message: 'AST heuristic detected fs.rename callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsCopyFileCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-copy-file-callback.ast',
            code: 'HEURISTICS_FS_COPY_FILE_CALLBACK_AST',
            message: 'AST heuristic detected fs.copyFile callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsStatCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-stat-callback.ast',
            code: 'HEURISTICS_FS_STAT_CALLBACK_AST',
            message: 'AST heuristic detected fs.stat callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsStatfsCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-statfs-callback.ast',
            code: 'HEURISTICS_FS_STATFS_CALLBACK_AST',
            message: 'AST heuristic detected fs.statfs callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsLstatCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-lstat-callback.ast',
            code: 'HEURISTICS_FS_LSTAT_CALLBACK_AST',
            message: 'AST heuristic detected fs.lstat callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsRealpathCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-realpath-callback.ast',
            code: 'HEURISTICS_FS_REALPATH_CALLBACK_AST',
            message: 'AST heuristic detected fs.realpath callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsAccessCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-access-callback.ast',
            code: 'HEURISTICS_FS_ACCESS_CALLBACK_AST',
            message: 'AST heuristic detected fs.access callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsChmodCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-chmod-callback.ast',
            code: 'HEURISTICS_FS_CHMOD_CALLBACK_AST',
            message: 'AST heuristic detected fs.chmod callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsChownCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-chown-callback.ast',
            code: 'HEURISTICS_FS_CHOWN_CALLBACK_AST',
            message: 'AST heuristic detected fs.chown callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsLchownCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-lchown-callback.ast',
            code: 'HEURISTICS_FS_LCHOWN_CALLBACK_AST',
            message: 'AST heuristic detected fs.lchown callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsLchmodCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-lchmod-callback.ast',
            code: 'HEURISTICS_FS_LCHMOD_CALLBACK_AST',
            message: 'AST heuristic detected fs.lchmod callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsUnlinkCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-unlink-callback.ast',
            code: 'HEURISTICS_FS_UNLINK_CALLBACK_AST',
            message: 'AST heuristic detected fs.unlink callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsReadlinkCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-readlink-callback.ast',
            code: 'HEURISTICS_FS_READLINK_CALLBACK_AST',
            message: 'AST heuristic detected fs.readlink callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsSymlinkCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-symlink-callback.ast',
            code: 'HEURISTICS_FS_SYMLINK_CALLBACK_AST',
            message: 'AST heuristic detected fs.symlink callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsLinkCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-link-callback.ast',
            code: 'HEURISTICS_FS_LINK_CALLBACK_AST',
            message: 'AST heuristic detected fs.link callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsMkdtempCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-mkdtemp-callback.ast',
            code: 'HEURISTICS_FS_MKDTEMP_CALLBACK_AST',
            message: 'AST heuristic detected fs.mkdtemp callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsOpendirCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-opendir-callback.ast',
            code: 'HEURISTICS_FS_OPENDIR_CALLBACK_AST',
            message: 'AST heuristic detected fs.opendir callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsOpenCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-open-callback.ast',
            code: 'HEURISTICS_FS_OPEN_CALLBACK_AST',
            message: 'AST heuristic detected fs.open callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsCpCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-cp-callback.ast',
            code: 'HEURISTICS_FS_CP_CALLBACK_AST',
            message: 'AST heuristic detected fs.cp callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsCloseCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-close-callback.ast',
            code: 'HEURISTICS_FS_CLOSE_CALLBACK_AST',
            message: 'AST heuristic detected fs.close callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsReadCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-read-callback.ast',
            code: 'HEURISTICS_FS_READ_CALLBACK_AST',
            message: 'AST heuristic detected fs.read callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsReadvCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-readv-callback.ast',
            code: 'HEURISTICS_FS_READV_CALLBACK_AST',
            message: 'AST heuristic detected fs.readv callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsWritevCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-writev-callback.ast',
            code: 'HEURISTICS_FS_WRITEV_CALLBACK_AST',
            message: 'AST heuristic detected fs.writev callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsWriteCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-write-callback.ast',
            code: 'HEURISTICS_FS_WRITE_CALLBACK_AST',
            message: 'AST heuristic detected fs.write callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsFsyncCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-fsync-callback.ast',
            code: 'HEURISTICS_FS_FSYNC_CALLBACK_AST',
            message: 'AST heuristic detected fs.fsync callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsFdatasyncCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-fdatasync-callback.ast',
            code: 'HEURISTICS_FS_FDATASYNC_CALLBACK_AST',
            message: 'AST heuristic detected fs.fdatasync callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsFchownCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-fchown-callback.ast',
            code: 'HEURISTICS_FS_FCHOWN_CALLBACK_AST',
            message: 'AST heuristic detected fs.fchown callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsFchmodCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-fchmod-callback.ast',
            code: 'HEURISTICS_FS_FCHMOD_CALLBACK_AST',
            message: 'AST heuristic detected fs.fchmod callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsFstatCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-fstat-callback.ast',
            code: 'HEURISTICS_FS_FSTAT_CALLBACK_AST',
            message: 'AST heuristic detected fs.fstat callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsFtruncateCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-ftruncate-callback.ast',
            code: 'HEURISTICS_FS_FTRUNCATE_CALLBACK_AST',
            message: 'AST heuristic detected fs.ftruncate callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsTruncateCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-truncate-callback.ast',
            code: 'HEURISTICS_FS_TRUNCATE_CALLBACK_AST',
            message: 'AST heuristic detected fs.truncate callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsFutimesCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-futimes-callback.ast',
            code: 'HEURISTICS_FS_FUTIMES_CALLBACK_AST',
            message: 'AST heuristic detected fs.futimes callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasFsLutimesCallbackCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.fs-lutimes-callback.ast',
            code: 'HEURISTICS_FS_LUTIMES_CALLBACK_AST',
            message: 'AST heuristic detected fs.lutimes callback usage.',
            filePath: fileFact.path,
          })
        );
      }

      if (hasExecFileCall(ast)) {
        heuristicFacts.push(
          createHeuristicFact({
            ruleId: 'heuristics.ts.child-process-exec-file.ast',
            code: 'HEURISTICS_CHILD_PROCESS_EXEC_FILE_AST',
            message: 'AST heuristic detected execFile usage.',
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
