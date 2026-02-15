import { hasNode, isObject } from '../utils/astHelpers';

export const hasProcessExitCall = (node: unknown): boolean => {
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

export const hasChildProcessImport = (node: unknown): boolean => {
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
    const args = value.arguments as unknown[];
    const firstArg = Array.isArray(args) ? args[0] : undefined;
    return (
      isObject(firstArg) &&
      ((firstArg.type === 'StringLiteral' && firstArg.value === 'child_process') ||
        (firstArg.type === 'Literal' && firstArg.value === 'child_process'))
    );
  });
};

export const hasProcessEnvMutation = (node: unknown): boolean => {
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

export const hasExecSyncCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee)) {
      return false;
    }

    // child_process.execSync() or execSync()
    if (callee.type === 'MemberExpression' && !callee.computed) {
      const property = callee.property;
      return isObject(property) && property.type === 'Identifier' && property.name === 'execSync';
    }

    return callee.type === 'Identifier' && callee.name === 'execSync';
  });
};

export const hasExecCall = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    const callee = value.callee;
    if (!isObject(callee)) {
      return false;
    }

    // child_process.exec() or exec()
    if (callee.type === 'MemberExpression' && !callee.computed) {
      const property = callee.property;
      return isObject(property) && property.type === 'Identifier' && property.name === 'exec';
    }

    return callee.type === 'Identifier' && callee.name === 'exec';
  });
};

