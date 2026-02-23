import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findBufferAllocUnsafeCallLines,
  findBufferAllocUnsafeSlowCallLines,
  findWeakCryptoHashCreateHashCallLines,
  hasBufferAllocUnsafeCall,
  hasBufferAllocUnsafeSlowCall,
  hasWeakCryptoHashCreateHashCall,
} from './securityCrypto';

test('hasWeakCryptoHashCreateHashCall detecta md5 y sha1', () => {
  const md5Ast = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'crypto' },
      property: { type: 'Identifier', name: 'createHash' },
    },
    arguments: [{ type: 'StringLiteral', value: 'md5' }],
  };
  const sha1Ast = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'crypto' },
      property: { type: 'Identifier', name: 'createHash' },
    },
    arguments: [{ type: 'StringLiteral', value: 'SHA1' }],
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

  assert.equal(hasWeakCryptoHashCreateHashCall(md5Ast), true);
  assert.equal(hasWeakCryptoHashCreateHashCall(sha1Ast), true);
  assert.equal(hasWeakCryptoHashCreateHashCall(safeAst), false);
});

test('hasWeakCryptoHashCreateHashCall descarta llamadas no compatibles', () => {
  const computedAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: true,
      object: { type: 'Identifier', name: 'crypto' },
      property: { type: 'StringLiteral', value: 'createHash' },
    },
    arguments: [{ type: 'StringLiteral', value: 'md5' }],
  };
  const emptyArgsAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'crypto' },
      property: { type: 'Identifier', name: 'createHash' },
    },
    arguments: [],
  };

  assert.equal(hasWeakCryptoHashCreateHashCall(computedAst), false);
  assert.equal(hasWeakCryptoHashCreateHashCall(emptyArgsAst), false);
});

test('hasBufferAllocUnsafeCall detecta Buffer.allocUnsafe y descarta otras llamadas', () => {
  const unsafeAst = {
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

  assert.equal(hasBufferAllocUnsafeCall(unsafeAst), true);
  assert.equal(hasBufferAllocUnsafeCall(safeAst), false);
});

test('hasBufferAllocUnsafeSlowCall detecta Buffer.allocUnsafeSlow y descarta otras llamadas', () => {
  const unsafeSlowAst = {
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

  assert.equal(hasBufferAllocUnsafeSlowCall(unsafeSlowAst), true);
  assert.equal(hasBufferAllocUnsafeSlowCall(safeAst), false);
});

test('find*Lines de securityCrypto retornan lineas de coincidencia', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'CallExpression',
        loc: { start: { line: 3 } },
        callee: {
          type: 'MemberExpression',
          computed: false,
          object: { type: 'Identifier', name: 'crypto' },
          property: { type: 'Identifier', name: 'createHash' },
        },
        arguments: [{ type: 'StringLiteral', value: 'md5' }],
      },
      {
        type: 'CallExpression',
        loc: { start: { line: 7 } },
        callee: {
          type: 'MemberExpression',
          computed: false,
          object: { type: 'Identifier', name: 'Buffer' },
          property: { type: 'Identifier', name: 'allocUnsafe' },
        },
        arguments: [{ type: 'NumericLiteral', value: 16 }],
      },
      {
        type: 'CallExpression',
        loc: { start: { line: 11 } },
        callee: {
          type: 'MemberExpression',
          computed: false,
          object: { type: 'Identifier', name: 'Buffer' },
          property: { type: 'Identifier', name: 'allocUnsafeSlow' },
        },
        arguments: [{ type: 'NumericLiteral', value: 16 }],
      },
    ],
  };

  assert.deepEqual(findWeakCryptoHashCreateHashCallLines(ast), [3]);
  assert.deepEqual(findBufferAllocUnsafeCallLines(ast), [7]);
  assert.deepEqual(findBufferAllocUnsafeSlowCallLines(ast), [11]);
});
