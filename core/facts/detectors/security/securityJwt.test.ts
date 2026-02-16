import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasJwtDecodeWithoutVerifyCall,
  hasJwtSignWithoutExpirationCall,
  hasJwtVerifyIgnoreExpirationCall,
} from './securityJwt';

test('hasJwtDecodeWithoutVerifyCall detecta jwt.decode y jsonwebtoken.decode', () => {
  const jwtDecodeAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'jwt' },
      property: { type: 'Identifier', name: 'decode' },
    },
    arguments: [{ type: 'Identifier', name: 'token' }],
  };
  const jsonwebtokenDecodeAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'jsonwebtoken' },
      property: { type: 'Identifier', name: 'decode' },
    },
    arguments: [{ type: 'Identifier', name: 'token' }],
  };
  const verifyAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'jwt' },
      property: { type: 'Identifier', name: 'verify' },
    },
    arguments: [{ type: 'Identifier', name: 'token' }],
  };

  assert.equal(hasJwtDecodeWithoutVerifyCall(jwtDecodeAst), true);
  assert.equal(hasJwtDecodeWithoutVerifyCall(jsonwebtokenDecodeAst), true);
  assert.equal(hasJwtDecodeWithoutVerifyCall(verifyAst), false);
});

test('hasJwtVerifyIgnoreExpirationCall detecta verify con ignoreExpiration true', () => {
  const insecureVerifyAst = {
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
  const secureVerifyAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'jsonwebtoken' },
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
  const missingOptionsAst = {
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
    ],
  };

  assert.equal(hasJwtVerifyIgnoreExpirationCall(insecureVerifyAst), true);
  assert.equal(hasJwtVerifyIgnoreExpirationCall(secureVerifyAst), false);
  assert.equal(hasJwtVerifyIgnoreExpirationCall(missingOptionsAst), false);
});

test('hasJwtSignWithoutExpirationCall detecta sign sin exp ni expiresIn', () => {
  const insecureSignAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'jwt' },
      property: { type: 'Identifier', name: 'sign' },
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'sub' },
            value: { type: 'StringLiteral', value: 'user-1' },
          },
        ],
      },
      { type: 'Identifier', name: 'secret' },
    ],
  };
  const payloadWithExpAst = {
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
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'exp' },
            value: { type: 'NumericLiteral', value: 12345678 },
          },
        ],
      },
      { type: 'Identifier', name: 'secret' },
    ],
  };
  const optionsWithExpiresInAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'jwt' },
      property: { type: 'Identifier', name: 'sign' },
    },
    arguments: [
      {
        type: 'ObjectExpression',
        properties: [],
      },
      { type: 'Identifier', name: 'secret' },
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'expiresIn' },
            value: { type: 'StringLiteral', value: '1h' },
          },
        ],
      },
    ],
  };

  assert.equal(hasJwtSignWithoutExpirationCall(insecureSignAst), true);
  assert.equal(hasJwtSignWithoutExpirationCall(payloadWithExpAst), false);
  assert.equal(hasJwtSignWithoutExpirationCall(optionsWithExpiresInAst), false);
});
