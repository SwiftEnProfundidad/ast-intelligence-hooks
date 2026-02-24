import { collectNodeLineMatches, hasNode, isObject } from '../utils/astHelpers';

const isInnerHtmlAssignmentNode = (value: Record<string, string | number | boolean | bigint | symbol | null | Date | object>): boolean => {
  if (value.type !== 'AssignmentExpression') {
    return false;
  }
  const left = value.left;
  if (!isObject(left) || left.type !== 'MemberExpression') {
    return false;
  }
  const propertyNode = left.property;
  if (!isObject(propertyNode)) {
    return false;
  }
  if (left.computed === true) {
    return propertyNode.type === 'StringLiteral' && propertyNode.value === 'innerHTML';
  }
  return propertyNode.type === 'Identifier' && propertyNode.name === 'innerHTML';
};

const isDocumentWriteCallNode = (value: Record<string, string | number | boolean | bigint | symbol | null | Date | object>): boolean => {
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
    objectNode.name === 'document' &&
    isObject(propertyNode) &&
    propertyNode.type === 'Identifier' &&
    propertyNode.name === 'write'
  );
};

const isInsertAdjacentHtmlCallNode = (value: Record<string, string | number | boolean | bigint | symbol | null | Date | object>): boolean => {
  if (value.type !== 'CallExpression') {
    return false;
  }

  const callee = value.callee;
  if (!isObject(callee) || callee.type !== 'MemberExpression') {
    return false;
  }

  const propertyNode = callee.property;
  if (!isObject(propertyNode)) {
    return false;
  }
  if (callee.computed === true) {
    return propertyNode.type === 'StringLiteral' && propertyNode.value === 'insertAdjacentHTML';
  }
  return propertyNode.type === 'Identifier' && propertyNode.name === 'insertAdjacentHTML';
};

export const hasInnerHtmlAssignment = (node: unknown): boolean => {
  return hasNode(node, isInnerHtmlAssignmentNode);
};

export const findInnerHtmlAssignmentLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isInnerHtmlAssignmentNode);
};

export const hasDocumentWriteCall = (node: unknown): boolean => {
  return hasNode(node, isDocumentWriteCallNode);
};

export const findDocumentWriteCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isDocumentWriteCallNode);
};

export const hasInsertAdjacentHtmlCall = (node: unknown): boolean => {
  return hasNode(node, isInsertAdjacentHtmlCallNode);
};

export const findInsertAdjacentHtmlCallLines = (node: unknown): readonly number[] => {
  return collectNodeLineMatches(node, isInsertAdjacentHtmlCallNode);
};
