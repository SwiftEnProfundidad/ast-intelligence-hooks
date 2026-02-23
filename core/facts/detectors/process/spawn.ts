import { collectNodeLineMatches, hasNode, isObject } from '../utils/astHelpers';

const isCallByName = (value: Record<string, unknown>, expectedName: string): boolean => {
  if (value.type !== 'CallExpression') {
    return false;
  }

  const callee = value.callee;
  if (isObject(callee) && callee.type === 'Identifier') {
    return callee.name === expectedName;
  }
  if (!isObject(callee) || callee.type !== 'MemberExpression') {
    return false;
  }
  const propertyNode = callee.property;
  if (!isObject(propertyNode)) {
    return false;
  }
  if (callee.computed === true) {
    return propertyNode.type === 'StringLiteral' && propertyNode.value === expectedName;
  }
  return propertyNode.type === 'Identifier' && propertyNode.name === expectedName;
};

const isSpawnSyncCallNode = (value: Record<string, unknown>): boolean => {
  return isCallByName(value, 'spawnSync');
};

const isSpawnCallNode = (value: Record<string, unknown>): boolean => {
  return isCallByName(value, 'spawn');
};

const isForkCallNode = (value: Record<string, unknown>): boolean => {
  return isCallByName(value, 'fork');
};

const isExecFileSyncCallNode = (value: Record<string, unknown>): boolean => {
  return isCallByName(value, 'execFileSync');
};

const isExecFileCallNode = (value: Record<string, unknown>): boolean => {
  return isCallByName(value, 'execFile');
};

export const hasSpawnSyncCall = (node: unknown): boolean => {
  return hasNode(node, isSpawnSyncCallNode);
};

export const findSpawnSyncCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isSpawnSyncCallNode);
};

export const hasSpawnCall = (node: unknown): boolean => {
  return hasNode(node, isSpawnCallNode);
};

export const findSpawnCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isSpawnCallNode);
};

export const hasForkCall = (node: unknown): boolean => {
  return hasNode(node, isForkCallNode);
};

export const findForkCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isForkCallNode);
};

export const hasExecFileSyncCall = (node: unknown): boolean => {
  return hasNode(node, isExecFileSyncCallNode);
};

export const findExecFileSyncCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isExecFileSyncCallNode);
};

export const hasExecFileCall = (node: unknown): boolean => {
  return hasNode(node, isExecFileCallNode);
};

export const findExecFileCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isExecFileCallNode);
};
