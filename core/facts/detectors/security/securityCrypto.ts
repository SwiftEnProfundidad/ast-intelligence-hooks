import { collectNodeLineMatches, hasNode, isObject } from '../utils/astHelpers';

const isWeakCryptoHashCreateHashCallNode = (value: Record<string, string | number | boolean | bigint | symbol | null | undefined | Date | object>): boolean => {
  if (value.type !== 'CallExpression') {
    return false;
  }

  const callee = value.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression' || callee.computed === true) {
    return false;
  }

  const objectNode = callee.object;
  const propertyNode = callee.property;
  if (
    !isObject(objectNode) ||
    objectNode.type !== 'Identifier' ||
    objectNode.name !== 'crypto' ||
    !isObject(propertyNode) ||
    propertyNode.type !== 'Identifier' ||
    propertyNode.name !== 'createHash'
  ) {
    return false;
  }

  const args = value.arguments;
  if (!Array.isArray(args) || args.length === 0) {
    return false;
  }

  const firstArg = args[0];
  if (!isObject(firstArg) || firstArg.type !== 'StringLiteral') {
    return false;
  }

  const algorithm = (firstArg.value as string).toLowerCase();
  return algorithm === 'md5' || algorithm === 'sha1';
};

const isBufferAllocUnsafeCallNode = (value: Record<string, string | number | boolean | bigint | symbol | null | undefined | Date | object>): boolean => {
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
    objectNode.name === 'Buffer' &&
    isObject(propertyNode) &&
    propertyNode.type === 'Identifier' &&
    propertyNode.name === 'allocUnsafe'
  );
};

const isBufferAllocUnsafeSlowCallNode = (value: Record<string, string | number | boolean | bigint | symbol | null | undefined | Date | object>): boolean => {
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
    objectNode.name === 'Buffer' &&
    isObject(propertyNode) &&
    propertyNode.type === 'Identifier' &&
    propertyNode.name === 'allocUnsafeSlow'
  );
};

export const hasWeakCryptoHashCreateHashCall = (node: unknown): boolean => {
  return hasNode(node, isWeakCryptoHashCreateHashCallNode);
};

export const findWeakCryptoHashCreateHashCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isWeakCryptoHashCreateHashCallNode);
};

export const hasBufferAllocUnsafeCall = (node: unknown): boolean => {
  return hasNode(node, isBufferAllocUnsafeCallNode);
};

export const findBufferAllocUnsafeCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isBufferAllocUnsafeCallNode);
};

export const hasBufferAllocUnsafeSlowCall = (node: unknown): boolean => {
  return hasNode(node, isBufferAllocUnsafeSlowCallNode);
};

export const findBufferAllocUnsafeSlowCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isBufferAllocUnsafeSlowCallNode);
};
