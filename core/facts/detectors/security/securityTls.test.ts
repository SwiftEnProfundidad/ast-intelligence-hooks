import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasTlsEnvRejectUnauthorizedZeroOverride,
  hasTlsRejectUnauthorizedFalseOption,
} from './securityTls';

test('hasTlsRejectUnauthorizedFalseOption detecta rejectUnauthorized: false', () => {
  const identifierKeyAst = {
    type: 'ObjectProperty',
    key: { type: 'Identifier', name: 'rejectUnauthorized' },
    value: { type: 'BooleanLiteral', value: false },
  };
  const stringKeyAst = {
    type: 'ObjectProperty',
    key: { type: 'StringLiteral', value: 'rejectUnauthorized' },
    value: { type: 'BooleanLiteral', value: false },
  };
  const safeAst = {
    type: 'ObjectProperty',
    key: { type: 'Identifier', name: 'rejectUnauthorized' },
    value: { type: 'BooleanLiteral', value: true },
  };

  assert.equal(hasTlsRejectUnauthorizedFalseOption(identifierKeyAst), true);
  assert.equal(hasTlsRejectUnauthorizedFalseOption(stringKeyAst), true);
  assert.equal(hasTlsRejectUnauthorizedFalseOption(safeAst), false);
});

test('hasTlsEnvRejectUnauthorizedZeroOverride detecta process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0', () => {
  const dotNotationAst = {
    type: 'AssignmentExpression',
    left: {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'MemberExpression',
        computed: false,
        object: { type: 'Identifier', name: 'process' },
        property: { type: 'Identifier', name: 'env' },
      },
      property: { type: 'Identifier', name: 'NODE_TLS_REJECT_UNAUTHORIZED' },
    },
    right: { type: 'StringLiteral', value: '0' },
  };
  const computedNotationAst = {
    type: 'AssignmentExpression',
    left: {
      type: 'MemberExpression',
      computed: true,
      object: {
        type: 'MemberExpression',
        computed: true,
        object: { type: 'Identifier', name: 'process' },
        property: { type: 'StringLiteral', value: 'env' },
      },
      property: { type: 'StringLiteral', value: 'NODE_TLS_REJECT_UNAUTHORIZED' },
    },
    right: { type: 'NumericLiteral', value: 0 },
  };
  const templateLiteralZeroAst = {
    type: 'AssignmentExpression',
    left: {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'MemberExpression',
        computed: false,
        object: { type: 'Identifier', name: 'process' },
        property: { type: 'Identifier', name: 'env' },
      },
      property: { type: 'Identifier', name: 'NODE_TLS_REJECT_UNAUTHORIZED' },
    },
    right: {
      type: 'TemplateLiteral',
      expressions: [],
      quasis: [
        {
          type: 'TemplateElement',
          value: { cooked: '0', raw: '0' },
        },
      ],
    },
  };
  const safeValueAst = {
    type: 'AssignmentExpression',
    left: {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'MemberExpression',
        computed: false,
        object: { type: 'Identifier', name: 'process' },
        property: { type: 'Identifier', name: 'env' },
      },
      property: { type: 'Identifier', name: 'NODE_TLS_REJECT_UNAUTHORIZED' },
    },
    right: { type: 'StringLiteral', value: '1' },
  };
  const otherEnvAst = {
    type: 'AssignmentExpression',
    left: {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'MemberExpression',
        computed: false,
        object: { type: 'Identifier', name: 'config' },
        property: { type: 'Identifier', name: 'env' },
      },
      property: { type: 'Identifier', name: 'NODE_TLS_REJECT_UNAUTHORIZED' },
    },
    right: { type: 'StringLiteral', value: '0' },
  };

  assert.equal(hasTlsEnvRejectUnauthorizedZeroOverride(dotNotationAst), true);
  assert.equal(hasTlsEnvRejectUnauthorizedZeroOverride(computedNotationAst), true);
  assert.equal(hasTlsEnvRejectUnauthorizedZeroOverride(templateLiteralZeroAst), true);
  assert.equal(hasTlsEnvRejectUnauthorizedZeroOverride(safeValueAst), false);
  assert.equal(hasTlsEnvRejectUnauthorizedZeroOverride(otherEnvAst), false);
});
