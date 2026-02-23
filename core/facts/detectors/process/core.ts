import { collectNodeLineMatches, hasNode, isObject } from '../utils/astHelpers';

const isProcessExitCallNode = (value: Record<string, unknown>): boolean => {
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
};

const isChildProcessImportNode = (value: Record<string, unknown>): boolean => {
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
};

const isProcessEnvMutationNode = (value: Record<string, unknown>): boolean => {
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
};

const isExecSyncCallNode = (value: Record<string, unknown>): boolean => {
  if (value.type !== 'CallExpression') {
    return false;
  }
  const callee = value.callee;
  if (!isObject(callee)) {
    return false;
  }

  if (callee.type === 'MemberExpression' && !callee.computed) {
    const property = callee.property;
    return isObject(property) && property.type === 'Identifier' && property.name === 'execSync';
  }

  return callee.type === 'Identifier' && callee.name === 'execSync';
};

const isExecCallNode = (value: Record<string, unknown>): boolean => {
  if (value.type !== 'CallExpression') {
    return false;
  }
  const callee = value.callee;
  if (!isObject(callee)) {
    return false;
  }

  if (callee.type === 'MemberExpression' && !callee.computed) {
    const property = callee.property;
    return isObject(property) && property.type === 'Identifier' && property.name === 'exec';
  }

  return callee.type === 'Identifier' && callee.name === 'exec';
};

export const hasProcessExitCall = (node: unknown): boolean => {
  return hasNode(node, isProcessExitCallNode);
};

export const findProcessExitCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isProcessExitCallNode);
};

export const hasChildProcessImport = (node: unknown): boolean => {
  return hasNode(node, isChildProcessImportNode);
};

export const findChildProcessImportLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isChildProcessImportNode);
};

export const hasProcessEnvMutation = (node: unknown): boolean => {
  return hasNode(node, isProcessEnvMutationNode);
};

export const findProcessEnvMutationLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isProcessEnvMutationNode);
};

export const hasExecSyncCall = (node: unknown): boolean => {
  return hasNode(node, isExecSyncCallNode);
};

export const findExecSyncCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isExecSyncCallNode);
};

export const hasExecCall = (node: unknown): boolean => {
  return hasNode(node, isExecCallNode);
};

export const findExecCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isExecCallNode);
};
