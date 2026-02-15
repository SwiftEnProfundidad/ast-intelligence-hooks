import { hasNode, isObject } from '../utils/astHelpers';

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
