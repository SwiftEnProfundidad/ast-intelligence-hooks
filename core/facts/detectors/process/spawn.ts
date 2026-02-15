import { hasNode, isObject } from '../utils/astHelpers';

export const hasSpawnSyncCall = (node: unknown): boolean => {
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

export const hasSpawnCall = (node: unknown): boolean => {
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

export const hasForkCall = (node: unknown): boolean => {
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

export const hasExecFileSyncCall = (node: unknown): boolean => {
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

export const hasExecFileCall = (node: unknown): boolean => {
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
