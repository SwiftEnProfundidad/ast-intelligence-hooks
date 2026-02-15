import { hasNode, isObject } from '../utils/astHelpers';

export const hasFsReadlinkSyncCall = (node: unknown): boolean => {
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
      propertyNode.name === 'readlinkSync'
    );
  });
};

export const hasFsSymlinkSyncCall = (node: unknown): boolean => {
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
      propertyNode.name === 'symlinkSync'
    );
  });
};

export const hasFsLinkSyncCall = (node: unknown): boolean => {
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
      propertyNode.name === 'linkSync'
    );
  });
};
