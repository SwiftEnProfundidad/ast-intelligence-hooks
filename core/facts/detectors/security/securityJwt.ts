import { collectNodeLineMatches, hasNode, isObject } from '../utils/astHelpers';

const hasIgnoreExpirationTrueOption = (candidate: unknown): boolean => {
  return hasNode(candidate, (value) => {
    if (value.type !== 'ObjectProperty') {
      return false;
    }

    const keyNode = value.key;
    const valueNode = value.value;
    const keyMatches =
      (isObject(keyNode) && keyNode.type === 'Identifier' && keyNode.name === 'ignoreExpiration') ||
      (isObject(keyNode) && keyNode.type === 'StringLiteral' && keyNode.value === 'ignoreExpiration');
    return keyMatches && isObject(valueNode) && valueNode.type === 'BooleanLiteral' && valueNode.value === true;
  });
};

const hasExpClaim = (candidate: unknown): boolean => {
  return hasNode(candidate, (value) => {
    if (value.type !== 'ObjectProperty') {
      return false;
    }
    const keyNode = value.key;
    return (
      (isObject(keyNode) && keyNode.type === 'Identifier' && keyNode.name === 'exp') ||
      (isObject(keyNode) && keyNode.type === 'StringLiteral' && keyNode.value === 'exp')
    );
  });
};

const hasExpiresInOption = (candidate: unknown): boolean => {
  return hasNode(candidate, (value) => {
    if (value.type !== 'ObjectProperty') {
      return false;
    }
    const keyNode = value.key;
    return (
      (isObject(keyNode) && keyNode.type === 'Identifier' && keyNode.name === 'expiresIn') ||
      (isObject(keyNode) && keyNode.type === 'StringLiteral' && keyNode.value === 'expiresIn')
    );
  });
};

const isJwtDecodeWithoutVerifyCallNode = (value: Record<string, string | number | boolean | bigint | symbol | null | undefined | Date | object>): boolean => {
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
    (objectNode.name === 'jwt' || objectNode.name === 'jsonwebtoken') &&
    isObject(propertyNode) &&
    propertyNode.type === 'Identifier' &&
    propertyNode.name === 'decode'
  );
};

const isJwtVerifyIgnoreExpirationCallNode = (value: Record<string, string | number | boolean | bigint | symbol | null | undefined | Date | object>): boolean => {
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
    (objectNode.name !== 'jwt' && objectNode.name !== 'jsonwebtoken') ||
    !isObject(propertyNode) ||
    propertyNode.type !== 'Identifier' ||
    propertyNode.name !== 'verify'
  ) {
    return false;
  }

  const args = value.arguments;
  if (!Array.isArray(args) || args.length < 3) {
    return false;
  }

  return hasIgnoreExpirationTrueOption(args[2]);
};

const isJwtSignWithoutExpirationCallNode = (value: Record<string, string | number | boolean | bigint | symbol | null | undefined | Date | object>): boolean => {
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
    (objectNode.name !== 'jwt' && objectNode.name !== 'jsonwebtoken') ||
    !isObject(propertyNode) ||
    propertyNode.type !== 'Identifier' ||
    propertyNode.name !== 'sign'
  ) {
    return false;
  }

  const args = value.arguments;
  if (!Array.isArray(args) || args.length < 2) {
    return false;
  }

  const payloadArg = args[0];
  const optionsArg = args[2];
  return !hasExpClaim(payloadArg) && !hasExpiresInOption(optionsArg);
};

export const hasJwtDecodeWithoutVerifyCall = (node: unknown): boolean => {
  return hasNode(node, isJwtDecodeWithoutVerifyCallNode);
};

export const findJwtDecodeWithoutVerifyCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isJwtDecodeWithoutVerifyCallNode);
};

export const hasJwtVerifyIgnoreExpirationCall = (node: unknown): boolean => {
  return hasNode(node, isJwtVerifyIgnoreExpirationCallNode);
};

export const findJwtVerifyIgnoreExpirationCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isJwtVerifyIgnoreExpirationCallNode);
};

export const hasJwtSignWithoutExpirationCall = (node: unknown): boolean => {
  return hasNode(node, isJwtSignWithoutExpirationCallNode);
};

export const findJwtSignWithoutExpirationCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isJwtSignWithoutExpirationCallNode);
};
