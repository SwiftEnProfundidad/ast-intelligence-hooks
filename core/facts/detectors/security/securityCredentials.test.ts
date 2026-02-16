import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasHardcodedSecretTokenLiteral,
  hasInsecureTokenGenerationWithDateNow,
  hasInsecureTokenGenerationWithMathRandom,
  hasWeakTokenGenerationWithCryptoRandomUuid,
} from './securityCredentials';

test('hasHardcodedSecretTokenLiteral detecta literal largo en identificador sensible', () => {
  const hardcodedSecretAst = {
    type: 'VariableDeclarator',
    id: { type: 'Identifier', name: 'apiKey' },
    init: { type: 'StringLiteral', value: 'super-secret-key-123' },
  };
  const safeLengthAst = {
    type: 'VariableDeclarator',
    id: { type: 'Identifier', name: 'apiKey' },
    init: { type: 'StringLiteral', value: 'short' },
  };
  const nonSensitiveIdentifierAst = {
    type: 'VariableDeclarator',
    id: { type: 'Identifier', name: 'description' },
    init: { type: 'StringLiteral', value: 'super-secret-key-123' },
  };

  assert.equal(hasHardcodedSecretTokenLiteral(hardcodedSecretAst), true);
  assert.equal(hasHardcodedSecretTokenLiteral(safeLengthAst), false);
  assert.equal(hasHardcodedSecretTokenLiteral(nonSensitiveIdentifierAst), false);
});

test('hasHardcodedSecretTokenLiteral detecta template literal estatico sensible', () => {
  const staticTemplateAst = {
    type: 'VariableDeclarator',
    id: { type: 'Identifier', name: 'token' },
    init: {
      type: 'TemplateLiteral',
      expressions: [],
      quasis: [
        {
          type: 'TemplateElement',
          value: { cooked: 'token-value-0001', raw: 'token-value-0001' },
        },
      ],
    },
  };

  assert.equal(hasHardcodedSecretTokenLiteral(staticTemplateAst), true);
});

test('hasInsecureTokenGenerationWithMathRandom detecta Math.random en variable sensible', () => {
  const insecureAst = {
    type: 'VariableDeclarator',
    id: { type: 'Identifier', name: 'secretToken' },
    init: {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        computed: false,
        object: { type: 'Identifier', name: 'Math' },
        property: { type: 'Identifier', name: 'random' },
      },
      arguments: [],
    },
  };
  const safeAst = {
    type: 'VariableDeclarator',
    id: { type: 'Identifier', name: 'counter' },
    init: {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        computed: false,
        object: { type: 'Identifier', name: 'Math' },
        property: { type: 'Identifier', name: 'random' },
      },
      arguments: [],
    },
  };

  assert.equal(hasInsecureTokenGenerationWithMathRandom(insecureAst), true);
  assert.equal(hasInsecureTokenGenerationWithMathRandom(safeAst), false);
});

test('hasInsecureTokenGenerationWithDateNow detecta Date.now en asignacion sensible', () => {
  const insecureAst = {
    type: 'AssignmentExpression',
    left: { type: 'Identifier', name: 'password' },
    right: {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        computed: false,
        object: { type: 'Identifier', name: 'Date' },
        property: { type: 'Identifier', name: 'now' },
      },
      arguments: [],
    },
  };
  const safeAst = {
    type: 'AssignmentExpression',
    left: { type: 'Identifier', name: 'password' },
    right: {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        computed: false,
        object: { type: 'Identifier', name: 'Date' },
        property: { type: 'Identifier', name: 'parse' },
      },
      arguments: [],
    },
  };

  assert.equal(hasInsecureTokenGenerationWithDateNow(insecureAst), true);
  assert.equal(hasInsecureTokenGenerationWithDateNow(safeAst), false);
});

test('hasWeakTokenGenerationWithCryptoRandomUuid detecta randomUUID en contexto sensible', () => {
  const insecureAst = {
    type: 'AssignmentExpression',
    left: { type: 'Identifier', name: 'apiToken' },
    right: {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        computed: false,
        object: { type: 'Identifier', name: 'crypto' },
        property: { type: 'Identifier', name: 'randomUUID' },
      },
      arguments: [],
    },
  };
  const safeAst = {
    type: 'AssignmentExpression',
    left: { type: 'Identifier', name: 'requestId' },
    right: {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: 'randomUUID',
      },
      arguments: [],
    },
  };

  assert.equal(hasWeakTokenGenerationWithCryptoRandomUuid(insecureAst), true);
  assert.equal(hasWeakTokenGenerationWithCryptoRandomUuid(safeAst), false);
});
