import { collectNodeLineMatches, hasNode, isObject } from '../utils/astHelpers';

const sensitiveIdentifierPattern = /(secret|token|password|api[_-]?key)/i;

const hasStrongLiteralValue = (value: unknown): boolean => {
  if (!isObject(value)) {
    return false;
  }
  if (value.type === 'StringLiteral') {
    return typeof value.value === 'string' && value.value.trim().length >= 12;
  }
  if (
    value.type === 'TemplateLiteral' &&
    Array.isArray(value.expressions) &&
    value.expressions.length === 0 &&
    Array.isArray(value.quasis) &&
    value.quasis.length === 1
  ) {
    const cooked = value.quasis[0]?.value?.cooked;
    return typeof cooked === 'string' && cooked.trim().length >= 12;
  }
  return false;
};

const containsMathRandomCall = (candidate: unknown): boolean => {
  return hasNode(candidate, (value) => {
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
      objectNode.name === 'Math' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'random'
    );
  });
};

const containsDateNowCall = (candidate: unknown): boolean => {
  return hasNode(candidate, (value) => {
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
      objectNode.name === 'Date' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'now'
    );
  });
};

const containsCryptoRandomUuidCall = (candidate: unknown): boolean => {
  return hasNode(candidate, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }

    const callee = value.callee;
    if (!isObject(callee)) {
      return false;
    }

    if (callee.type === 'Identifier' && callee.name === 'randomUUID') {
      return true;
    }

    if (callee.type !== 'MemberExpression' || callee.computed === true) {
      return false;
    }

    const objectNode = callee.object;
    const propertyNode = callee.property;
    return (
      isObject(objectNode) &&
      objectNode.type === 'Identifier' &&
      objectNode.name === 'crypto' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'randomUUID'
    );
  });
};

const isHardcodedSecretTokenLiteralNode = (value: Record<string, string | number | boolean | bigint | symbol | null | undefined | Date | object>): boolean => {
  if (value.type !== 'VariableDeclarator') {
    return false;
  }
  const idNode = value.id;
  if (!isObject(idNode) || idNode.type !== 'Identifier') {
    return false;
  }
  if (!sensitiveIdentifierPattern.test(idNode.name as string)) {
    return false;
  }
  return hasStrongLiteralValue(value.init);
};

const isInsecureTokenGenerationWithMathRandomNode = (value: Record<string, string | number | boolean | bigint | symbol | null | undefined | Date | object>): boolean => {
  if (value.type === 'VariableDeclarator') {
    const idNode = value.id;
    if (!isObject(idNode) || idNode.type !== 'Identifier') {
      return false;
    }
    if (!sensitiveIdentifierPattern.test(idNode.name as string)) {
      return false;
    }
    return containsMathRandomCall(value.init);
  }

  if (value.type === 'AssignmentExpression') {
    const left = value.left;
    if (isObject(left) && left.type === 'Identifier' && sensitiveIdentifierPattern.test(left.name as string)) {
      return containsMathRandomCall(value.right);
    }
    return false;
  }

  return false;
};

const isInsecureTokenGenerationWithDateNowNode = (value: Record<string, string | number | boolean | bigint | symbol | null | undefined | Date | object>): boolean => {
  if (value.type === 'VariableDeclarator') {
    const idNode = value.id;
    if (!isObject(idNode) || idNode.type !== 'Identifier') {
      return false;
    }
    if (!sensitiveIdentifierPattern.test(idNode.name as string)) {
      return false;
    }
    return containsDateNowCall(value.init);
  }

  if (value.type === 'AssignmentExpression') {
    const left = value.left;
    if (isObject(left) && left.type === 'Identifier' && sensitiveIdentifierPattern.test(left.name as string)) {
      return containsDateNowCall(value.right);
    }
    return false;
  }

  return false;
};

const isWeakTokenGenerationWithCryptoRandomUuidNode = (value: Record<string, string | number | boolean | bigint | symbol | null | undefined | Date | object>): boolean => {
  if (value.type === 'VariableDeclarator') {
    const idNode = value.id;
    if (!isObject(idNode) || idNode.type !== 'Identifier') {
      return false;
    }
    if (!sensitiveIdentifierPattern.test(idNode.name as string)) {
      return false;
    }
    return containsCryptoRandomUuidCall(value.init);
  }

  if (value.type === 'AssignmentExpression') {
    const left = value.left;
    if (isObject(left) && left.type === 'Identifier' && sensitiveIdentifierPattern.test(left.name as string)) {
      return containsCryptoRandomUuidCall(value.right);
    }
    return false;
  }

  return false;
};

export const hasHardcodedSecretTokenLiteral = (node: unknown): boolean => {
  return hasNode(node, isHardcodedSecretTokenLiteralNode);
};

export const findHardcodedSecretTokenLiteralLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isHardcodedSecretTokenLiteralNode);
};

export const hasInsecureTokenGenerationWithMathRandom = (node: unknown): boolean => {
  return hasNode(node, isInsecureTokenGenerationWithMathRandomNode);
};

export const findInsecureTokenGenerationWithMathRandomLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isInsecureTokenGenerationWithMathRandomNode);
};

export const hasInsecureTokenGenerationWithDateNow = (node: unknown): boolean => {
  return hasNode(node, isInsecureTokenGenerationWithDateNowNode);
};

export const findInsecureTokenGenerationWithDateNowLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isInsecureTokenGenerationWithDateNowNode);
};

export const hasWeakTokenGenerationWithCryptoRandomUuid = (node: unknown): boolean => {
  return hasNode(node, isWeakTokenGenerationWithCryptoRandomUuidNode);
};

export const findWeakTokenGenerationWithCryptoRandomUuidLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isWeakTokenGenerationWithCryptoRandomUuidNode);
};
