import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasBufferAllocUnsafeCall,
  hasBufferAllocUnsafeSlowCall,
  hasHardcodedSecretTokenLiteral,
  hasInsecureTokenGenerationWithDateNow,
  hasInsecureTokenGenerationWithMathRandom,
  hasJwtDecodeWithoutVerifyCall,
  hasJwtSignWithoutExpirationCall,
  hasJwtVerifyIgnoreExpirationCall,
  hasTlsEnvRejectUnauthorizedZeroOverride,
  hasTlsRejectUnauthorizedFalseOption,
  hasWeakCryptoHashCreateHashCall,
  hasWeakTokenGenerationWithCryptoRandomUuid,
} from './index';

test('hasHardcodedSecretTokenLiteral detecta literales fuertes en identificadores sensibles', () => {
  const ast = {
    type: 'VariableDeclarator',
    id: { type: 'Identifier', name: 'apiToken' },
    init: { type: 'StringLiteral', value: 'supersecret1234' },
  };
  const safeAst = {
    type: 'VariableDeclarator',
    id: { type: 'Identifier', name: 'apiToken' },
    init: { type: 'StringLiteral', value: 'short' },
  };

  assert.equal(hasHardcodedSecretTokenLiteral(ast), true);
  assert.equal(hasHardcodedSecretTokenLiteral(safeAst), false);
});

test('hasInsecureTokenGenerationWithMathRandom detecta Math.random en asignacion sensible', () => {
  const ast = {
    type: 'VariableDeclarator',
    id: { type: 'Identifier', name: 'token' },
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
    id: { type: 'Identifier', name: 'value' },
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

  assert.equal(hasInsecureTokenGenerationWithMathRandom(ast), true);
  assert.equal(hasInsecureTokenGenerationWithMathRandom(safeAst), false);
});

test('hasInsecureTokenGenerationWithDateNow detecta Date.now en asignacion sensible', () => {
  const ast = {
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

  assert.equal(hasInsecureTokenGenerationWithDateNow(ast), true);
  assert.equal(hasInsecureTokenGenerationWithDateNow(safeAst), false);
});

test('hasWeakTokenGenerationWithCryptoRandomUuid detecta randomUUID en contexto sensible', () => {
  const ast = {
    type: 'VariableDeclarator',
    id: { type: 'Identifier', name: 'secret' },
    init: {
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
    type: 'VariableDeclarator',
    id: { type: 'Identifier', name: 'id' },
    init: {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: 'randomUUID',
      },
      arguments: [],
    },
  };

  assert.equal(hasWeakTokenGenerationWithCryptoRandomUuid(ast), true);
  assert.equal(hasWeakTokenGenerationWithCryptoRandomUuid(safeAst), false);
});

test('hasWeakCryptoHashCreateHashCall detecta md5 y descarta algoritmos fuertes', () => {
  const weakAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'crypto' },
      property: { type: 'Identifier', name: 'createHash' },
    },
    arguments: [{ type: 'StringLiteral', value: 'md5' }],
  };
  const safeAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'crypto' },
      property: { type: 'Identifier', name: 'createHash' },
    },
    arguments: [{ type: 'StringLiteral', value: 'sha256' }],
  };

  assert.equal(hasWeakCryptoHashCreateHashCall(weakAst), true);
  assert.equal(hasWeakCryptoHashCreateHashCall(safeAst), false);
});

test('hasBufferAllocUnsafeCall detecta Buffer.allocUnsafe', () => {
  const ast = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'Buffer' },
      property: { type: 'Identifier', name: 'allocUnsafe' },
    },
    arguments: [{ type: 'NumericLiteral', value: 16 }],
  };
  const safeAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'Buffer' },
      property: { type: 'Identifier', name: 'alloc' },
    },
    arguments: [{ type: 'NumericLiteral', value: 16 }],
  };

  assert.equal(hasBufferAllocUnsafeCall(ast), true);
  assert.equal(hasBufferAllocUnsafeCall(safeAst), false);
});

test('hasBufferAllocUnsafeSlowCall detecta Buffer.allocUnsafeSlow', () => {
  const ast = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'Buffer' },
      property: { type: 'Identifier', name: 'allocUnsafeSlow' },
    },
    arguments: [{ type: 'NumericLiteral', value: 16 }],
  };
  const safeAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'Buffer' },
      property: { type: 'Identifier', name: 'alloc' },
    },
    arguments: [{ type: 'NumericLiteral', value: 16 }],
  };

  assert.equal(hasBufferAllocUnsafeSlowCall(ast), true);
  assert.equal(hasBufferAllocUnsafeSlowCall(safeAst), false);
});

test('hasJwtDecodeWithoutVerifyCall detecta jwt.decode', () => {
  const ast = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'jwt' },
      property: { type: 'Identifier', name: 'decode' },
    },
    arguments: [{ type: 'Identifier', name: 'token' }],
  };
  const safeAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'jwt' },
      property: { type: 'Identifier', name: 'verify' },
    },
    arguments: [{ type: 'Identifier', name: 'token' }],
  };

  assert.equal(hasJwtDecodeWithoutVerifyCall(ast), true);
  assert.equal(hasJwtDecodeWithoutVerifyCall(safeAst), false);
});

test('hasJwtVerifyIgnoreExpirationCall detecta verify con ignoreExpiration true', () => {
  const ast = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'jwt' },
      property: { type: 'Identifier', name: 'verify' },
    },
    arguments: [
      { type: 'Identifier', name: 'token' },
      { type: 'Identifier', name: 'secret' },
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'ignoreExpiration' },
            value: { type: 'BooleanLiteral', value: true },
          },
        ],
      },
    ],
  };
  const safeAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'jwt' },
      property: { type: 'Identifier', name: 'verify' },
    },
    arguments: [
      { type: 'Identifier', name: 'token' },
      { type: 'Identifier', name: 'secret' },
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'ignoreExpiration' },
            value: { type: 'BooleanLiteral', value: false },
          },
        ],
      },
    ],
  };

  assert.equal(hasJwtVerifyIgnoreExpirationCall(ast), true);
  assert.equal(hasJwtVerifyIgnoreExpirationCall(safeAst), false);
});

test('hasJwtSignWithoutExpirationCall detecta jwt.sign sin expiracion y descarta opciones de expiracion', () => {
  const insecureAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'jsonwebtoken' },
      property: { type: 'Identifier', name: 'sign' },
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [{ type: 'ObjectProperty', key: { type: 'Identifier', name: 'sub' }, value: { type: 'StringLiteral', value: 'u1' } }],
      },
      { type: 'Identifier', name: 'secret' },
    ],
  };
  const safeAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'jsonwebtoken' },
      property: { type: 'Identifier', name: 'sign' },
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [{ type: 'ObjectProperty', key: { type: 'Identifier', name: 'sub' }, value: { type: 'StringLiteral', value: 'u1' } }],
      },
      { type: 'Identifier', name: 'secret' },
      {
        type: 'ObjectExpression',
        properties: [{ type: 'ObjectProperty', key: { type: 'Identifier', name: 'expiresIn' }, value: { type: 'StringLiteral', value: '1h' } }],
      },
    ],
  };

  assert.equal(hasJwtSignWithoutExpirationCall(insecureAst), true);
  assert.equal(hasJwtSignWithoutExpirationCall(safeAst), false);
});

test('hasTlsRejectUnauthorizedFalseOption detecta rejectUnauthorized false', () => {
  const ast = {
    type: 'ObjectProperty',
    key: { type: 'Identifier', name: 'rejectUnauthorized' },
    value: { type: 'BooleanLiteral', value: false },
  };
  const safeAst = {
    type: 'ObjectProperty',
    key: { type: 'Identifier', name: 'rejectUnauthorized' },
    value: { type: 'BooleanLiteral', value: true },
  };

  assert.equal(hasTlsRejectUnauthorizedFalseOption(ast), true);
  assert.equal(hasTlsRejectUnauthorizedFalseOption(safeAst), false);
});

test('hasTlsEnvRejectUnauthorizedZeroOverride detecta override de NODE_TLS_REJECT_UNAUTHORIZED a cero', () => {
  const ast = {
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
  const safeAst = {
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

  assert.equal(hasTlsEnvRejectUnauthorizedZeroOverride(ast), true);
  assert.equal(hasTlsEnvRejectUnauthorizedZeroOverride(safeAst), false);
});
