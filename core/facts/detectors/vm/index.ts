import { hasNode, isObject } from '../utils/astHelpers';

export const hasVmDynamicCodeExecutionCall = (node: unknown): boolean => {
  const targetNames = new Set(['runInNewContext', 'runInThisContext']);

  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }

    const callee = value.callee;
    if (isObject(callee) && callee.type === 'Identifier') {
      return targetNames.has(callee.name as string);
    }
    if (!isObject(callee) || callee.type !== 'MemberExpression') {
      return false;
    }
    const propertyNode = callee.property;
    if (!isObject(propertyNode)) {
      return false;
    }
    if (callee.computed === true) {
      return propertyNode.type === 'StringLiteral' && targetNames.has(propertyNode.value as string);
    }
    return propertyNode.type === 'Identifier' && targetNames.has(propertyNode.name as string);
  });
};
