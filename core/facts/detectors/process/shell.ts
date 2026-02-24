import { collectNodeLineMatches, hasNode, isObject } from '../utils/astHelpers';

const targetChildProcessCalls = new Set(['spawn', 'spawnSync', 'execFile', 'execFileSync']);

const isDynamicCommandArgument = (candidate: unknown): boolean => {
  if (!isObject(candidate)) {
    return true;
  }
  if (candidate.type === 'StringLiteral') {
    return false;
  }
  if (
    candidate.type === 'TemplateLiteral' &&
    Array.isArray(candidate.expressions) &&
    candidate.expressions.length === 0
  ) {
    return false;
  }
  return true;
};

const isStaticStringLike = (candidate: unknown): boolean => {
  if (!isObject(candidate)) {
    return false;
  }
  if (candidate.type === 'StringLiteral') {
    return true;
  }
  if (
    candidate.type === 'TemplateLiteral' &&
    Array.isArray(candidate.expressions) &&
    candidate.expressions.length === 0
  ) {
    return true;
  }
  return false;
};

const hasShellTrueOption = (candidate: unknown): boolean => {
  return hasNode(candidate, (value) => {
    if (value.type !== 'ObjectProperty') {
      return false;
    }
    const keyNode = value.key;
    const valueNode = value.value;
    const keyMatches =
      (isObject(keyNode) && keyNode.type === 'Identifier' && keyNode.name === 'shell') ||
      (isObject(keyNode) && keyNode.type === 'StringLiteral' && keyNode.value === 'shell');
    return keyMatches && isObject(valueNode) && valueNode.type === 'BooleanLiteral' && valueNode.value === true;
  });
};

const isTargetChildProcessCall = (callee: unknown): boolean => {
  if (isObject(callee) && callee.type === 'Identifier') {
    return targetChildProcessCalls.has(callee.name as string);
  }
  if (!isObject(callee) || callee.type !== 'MemberExpression') {
    return false;
  }
  const propertyNode = callee.property;
  if (!isObject(propertyNode)) {
    return false;
  }
  if (callee.computed === true) {
    return propertyNode.type === 'StringLiteral' && targetChildProcessCalls.has(propertyNode.value as string);
  }
  return propertyNode.type === 'Identifier' && targetChildProcessCalls.has(propertyNode.name as string);
};

const isExecLikeCall = (callee: unknown): boolean => {
  if (isObject(callee) && callee.type === 'Identifier') {
    return callee.name === 'exec' || callee.name === 'execSync';
  }
  if (!isObject(callee) || callee.type !== 'MemberExpression') {
    return false;
  }
  const propertyNode = callee.property;
  if (!isObject(propertyNode)) {
    return false;
  }
  if (callee.computed === true) {
    return propertyNode.type === 'StringLiteral' && (propertyNode.value === 'exec' || propertyNode.value === 'execSync');
  }
  return propertyNode.type === 'Identifier' && (propertyNode.name === 'exec' || propertyNode.name === 'execSync');
};

const isExecFileCall = (callee: unknown): boolean => {
  if (isObject(callee) && callee.type === 'Identifier') {
    return callee.name === 'execFile' || callee.name === 'execFileSync';
  }
  if (!isObject(callee) || callee.type !== 'MemberExpression') {
    return false;
  }
  const propertyNode = callee.property;
  if (!isObject(propertyNode)) {
    return false;
  }
  if (callee.computed === true) {
    return propertyNode.type === 'StringLiteral' && (propertyNode.value === 'execFile' || propertyNode.value === 'execFileSync');
  }
  return propertyNode.type === 'Identifier' && (propertyNode.name === 'execFile' || propertyNode.name === 'execFileSync');
};

const isTrustedArgsArrayLiteral = (candidate: unknown): boolean => {
  if (!isObject(candidate) || candidate.type !== 'ArrayExpression' || !Array.isArray(candidate.elements)) {
    return false;
  }
  return candidate.elements.every((element) => isStaticStringLike(element));
};

const isDynamicShellInvocationCallNode = (value: Record<string, string | number | boolean | bigint | symbol | null | undefined | Date | object>): boolean => {
  if (value.type !== 'CallExpression') {
    return false;
  }

  if (!isExecLikeCall(value.callee)) {
    return false;
  }

  const args = value.arguments;
  if (!Array.isArray(args) || args.length === 0) {
    return false;
  }
  return isDynamicCommandArgument(args[0]);
};

const isChildProcessShellTrueCallNode = (value: Record<string, string | number | boolean | bigint | symbol | null | undefined | Date | object>): boolean => {
  if (value.type !== 'CallExpression') {
    return false;
  }
  if (!isTargetChildProcessCall(value.callee)) {
    return false;
  }
  const args = value.arguments;
  if (!Array.isArray(args) || args.length === 0) {
    return false;
  }
  return args.some((arg) => hasShellTrueOption(arg));
};

const isExecFileUntrustedArgsCallNode = (value: Record<string, string | number | boolean | bigint | symbol | null | undefined | Date | object>): boolean => {
  if (value.type !== 'CallExpression') {
    return false;
  }

  if (!isExecFileCall(value.callee)) {
    return false;
  }

  const args = value.arguments;
  if (!Array.isArray(args) || args.length < 2) {
    return false;
  }
  const fileArg = args[0];
  const commandArgs = args[1];
  if (!isStaticStringLike(fileArg)) {
    return false;
  }
  return !isTrustedArgsArrayLiteral(commandArgs);
};

export const hasDynamicShellInvocationCall = (node: unknown): boolean => {
  return hasNode(node, isDynamicShellInvocationCallNode);
};

export const findDynamicShellInvocationCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isDynamicShellInvocationCallNode);
};

export const hasChildProcessShellTrueCall = (node: unknown): boolean => {
  return hasNode(node, isChildProcessShellTrueCallNode);
};

export const findChildProcessShellTrueCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isChildProcessShellTrueCallNode);
};

export const hasExecFileUntrustedArgsCall = (node: unknown): boolean => {
  return hasNode(node, isExecFileUntrustedArgsCallNode);
};

export const findExecFileUntrustedArgsCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isExecFileUntrustedArgsCallNode);
};
