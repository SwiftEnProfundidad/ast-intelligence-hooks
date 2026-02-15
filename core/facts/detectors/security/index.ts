import { hasNode, isObject } from '../utils/astHelpers';

export const hasHardcodedSecretTokenLiteral = (node: unknown): boolean => {
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

  return hasNode(node, (value) => {
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
  });
};

export const hasWeakCryptoHashCreateHashCall = (node: unknown): boolean => {
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
  });
};

export const hasInsecureTokenGenerationWithMathRandom = (node: unknown): boolean => {
  const sensitiveIdentifierPattern = /(secret|token|password|api[_-]?key)/i;
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

  return hasNode(node, (value) => {
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
  });
};

export const hasInsecureTokenGenerationWithDateNow = (node: unknown): boolean => {
  const sensitiveIdentifierPattern = /(secret|token|password|api[_-]?key)/i;
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

  return hasNode(node, (value) => {
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
  });
};

export const hasWeakTokenGenerationWithCryptoRandomUuid = (node: unknown): boolean => {
  const sensitiveIdentifierPattern = /(secret|token|password|api[_-]?key)/i;
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

  return hasNode(node, (value) => {
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
  });
};

export const hasJwtDecodeWithoutVerifyCall = (node: unknown): boolean => {
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
      (objectNode.name === 'jwt' || objectNode.name === 'jsonwebtoken') &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'decode'
    );
  });
};

export const hasJwtVerifyIgnoreExpirationCall = (node: unknown): boolean => {
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
  });
};

export const hasJwtSignWithoutExpirationCall = (node: unknown): boolean => {
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
  });
};

export const hasTlsRejectUnauthorizedFalseOption = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'ObjectProperty') {
      return false;
    }

    const keyNode = value.key;
    const valueNode = value.value;
    const keyMatches =
      (isObject(keyNode) && keyNode.type === 'Identifier' && keyNode.name === 'rejectUnauthorized') ||
      (isObject(keyNode) && keyNode.type === 'StringLiteral' && keyNode.value === 'rejectUnauthorized');
    return keyMatches && isObject(valueNode) && valueNode.type === 'BooleanLiteral' && valueNode.value === false;
  });
};

export const hasTlsEnvRejectUnauthorizedZeroOverride = (node: unknown): boolean => {
  const isZeroLikeLiteral = (candidate: unknown): boolean => {
    if (!isObject(candidate)) {
      return false;
    }
    if (candidate.type === 'StringLiteral') {
      return candidate.value === '0';
    }
    if (candidate.type === 'NumericLiteral') {
      return candidate.value === 0;
    }
    if (
      candidate.type === 'TemplateLiteral' &&
      Array.isArray(candidate.expressions) &&
      candidate.expressions.length === 0 &&
      Array.isArray(candidate.quasis) &&
      candidate.quasis.length === 1
    ) {
      return candidate.quasis[0]?.value?.cooked === '0';
    }
    return false;
  };

  const isNodeTlsEnvMember = (candidate: unknown): boolean => {
    if (!isObject(candidate) || candidate.type !== 'MemberExpression') {
      return false;
    }

    const envMember = candidate.object;
    const keyNode = candidate.property;
    if (!isObject(envMember) || envMember.type !== 'MemberExpression') {
      return false;
    }

    const processNode = envMember.object;
    const envKeyNode = envMember.property;
    const isProcessEnv =
      isObject(processNode) &&
      processNode.type === 'Identifier' &&
      processNode.name === 'process' &&
      ((envMember.computed === true &&
        isObject(envKeyNode) &&
        envKeyNode.type === 'StringLiteral' &&
        envKeyNode.value === 'env') ||
        (envMember.computed !== true &&
          isObject(envKeyNode) &&
          envKeyNode.type === 'Identifier' &&
          envKeyNode.name === 'env'));
    if (!isProcessEnv) {
      return false;
    }

    return (
      (candidate.computed === true &&
        isObject(keyNode) &&
        keyNode.type === 'StringLiteral' &&
        keyNode.value === 'NODE_TLS_REJECT_UNAUTHORIZED') ||
      (candidate.computed !== true &&
        isObject(keyNode) &&
        keyNode.type === 'Identifier' &&
        keyNode.name === 'NODE_TLS_REJECT_UNAUTHORIZED')
    );
  };

  return hasNode(node, (value) => {
    if (value.type !== 'AssignmentExpression') {
      return false;
    }
    return isNodeTlsEnvMember(value.left) && isZeroLikeLiteral(value.right);
  });
};

export const hasBufferAllocUnsafeCall = (node: unknown): boolean => {
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
      objectNode.name === 'Buffer' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'allocUnsafe'
    );
  });
};

export const hasBufferAllocUnsafeSlowCall = (node: unknown): boolean => {
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
      objectNode.name === 'Buffer' &&
      isObject(propertyNode) &&
      propertyNode.type === 'Identifier' &&
      propertyNode.name === 'allocUnsafeSlow'
    );
  });
};
