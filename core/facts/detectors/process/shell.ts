import { hasNode, isObject } from '../utils/astHelpers';

export const hasDynamicShellInvocationCall = (node: unknown): boolean => {
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

  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }

    const callee = value.callee;
    let isExecLikeCall = false;
    if (isObject(callee) && callee.type === 'Identifier') {
      isExecLikeCall = callee.name === 'exec' || callee.name === 'execSync';
    } else if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      if (isObject(propertyNode)) {
        if (callee.computed === true) {
          isExecLikeCall =
            propertyNode.type === 'StringLiteral' &&
            (propertyNode.value === 'exec' || propertyNode.value === 'execSync');
        } else {
          isExecLikeCall =
            propertyNode.type === 'Identifier' &&
            (propertyNode.name === 'exec' || propertyNode.name === 'execSync');
        }
      }
    }

    if (!isExecLikeCall) {
      return false;
    }

    const args = value.arguments;
    if (!Array.isArray(args) || args.length === 0) {
      return false;
    }
    return isDynamicCommandArgument(args[0]);
  });
};

export const hasChildProcessShellTrueCall = (node: unknown): boolean => {
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

  const isTargetCall = (callee: unknown): boolean => {
    const targetNames = new Set(['spawn', 'spawnSync', 'execFile', 'execFileSync']);
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
  };

  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }
    if (!isTargetCall(value.callee)) {
      return false;
    }
    const args = value.arguments;
    if (!Array.isArray(args) || args.length === 0) {
      return false;
    }
    return args.some((arg) => hasShellTrueOption(arg));
  });
};

export const hasExecFileUntrustedArgsCall = (node: unknown): boolean => {
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

  const isTrustedArgsArrayLiteral = (candidate: unknown): boolean => {
    if (!isObject(candidate) || candidate.type !== 'ArrayExpression' || !Array.isArray(candidate.elements)) {
      return false;
    }
    return candidate.elements.every((element) => isStaticStringLike(element));
  };

  return hasNode(node, (value) => {
    if (value.type !== 'CallExpression') {
      return false;
    }

    const callee = value.callee;
    let isExecFileCall = false;
    if (isObject(callee) && callee.type === 'Identifier') {
      isExecFileCall = callee.name === 'execFile' || callee.name === 'execFileSync';
    } else if (isObject(callee) && callee.type === 'MemberExpression') {
      const propertyNode = callee.property;
      if (isObject(propertyNode)) {
        if (callee.computed === true) {
          isExecFileCall =
            propertyNode.type === 'StringLiteral' &&
            (propertyNode.value === 'execFile' || propertyNode.value === 'execFileSync');
        } else {
          isExecFileCall =
            propertyNode.type === 'Identifier' &&
            (propertyNode.name === 'execFile' || propertyNode.name === 'execFileSync');
        }
      }
    }

    if (!isExecFileCall) {
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
  });
};

