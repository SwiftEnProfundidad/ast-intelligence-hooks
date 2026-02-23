import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findChildProcessImportLines,
  findExecCallLines,
  findExecSyncCallLines,
  findProcessEnvMutationLines,
  findProcessExitCallLines,
  hasChildProcessImport,
  hasExecCall,
  hasExecSyncCall,
  hasProcessEnvMutation,
  hasProcessExitCall,
} from './core';

test('hasProcessExitCall detecta process.exit y descarta otras llamadas', () => {
  const exitAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'process' },
      property: { type: 'Identifier', name: 'exit' },
    },
    arguments: [{ type: 'NumericLiteral', value: 1 }],
  };
  const otherAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'process' },
      property: { type: 'Identifier', name: 'kill' },
    },
    arguments: [{ type: 'Identifier', name: 'pid' }],
  };

  assert.equal(hasProcessExitCall(exitAst), true);
  assert.equal(hasProcessExitCall(otherAst), false);
});

test('hasChildProcessImport detecta import y require de child_process', () => {
  const importAst = {
    type: 'ImportDeclaration',
    source: { type: 'StringLiteral', value: 'child_process' },
  };
  const requireAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'require' },
    arguments: [{ type: 'StringLiteral', value: 'child_process' }],
  };
  const otherImportAst = {
    type: 'ImportDeclaration',
    source: { type: 'StringLiteral', value: 'fs' },
  };

  assert.equal(hasChildProcessImport(importAst), true);
  assert.equal(hasChildProcessImport(requireAst), true);
  assert.equal(hasChildProcessImport(otherImportAst), false);
});

test('hasProcessEnvMutation detecta mutaciones sobre process.env', () => {
  const envMutationAst = {
    type: 'AssignmentExpression',
    operator: '=',
    left: {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'MemberExpression',
        computed: false,
        object: { type: 'Identifier', name: 'process' },
        property: { type: 'Identifier', name: 'env' },
      },
      property: { type: 'Identifier', name: 'NODE_ENV' },
    },
    right: { type: 'StringLiteral', value: 'production' },
  };
  const otherMutationAst = {
    type: 'AssignmentExpression',
    operator: '=',
    left: {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'MemberExpression',
        computed: false,
        object: { type: 'Identifier', name: 'config' },
        property: { type: 'Identifier', name: 'env' },
      },
      property: { type: 'Identifier', name: 'NODE_ENV' },
    },
    right: { type: 'StringLiteral', value: 'production' },
  };

  assert.equal(hasProcessEnvMutation(envMutationAst), true);
  assert.equal(hasProcessEnvMutation(otherMutationAst), false);
});

test('hasExecSyncCall detecta execSync directo y por member expression', () => {
  const identifierAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'execSync' },
    arguments: [{ type: 'StringLiteral', value: 'ls' }],
  };
  const memberAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'childProcess' },
      property: { type: 'Identifier', name: 'execSync' },
    },
    arguments: [{ type: 'StringLiteral', value: 'ls' }],
  };
  const otherAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'execFileSync' },
    arguments: [{ type: 'StringLiteral', value: 'ls' }],
  };

  assert.equal(hasExecSyncCall(identifierAst), true);
  assert.equal(hasExecSyncCall(memberAst), true);
  assert.equal(hasExecSyncCall(otherAst), false);
});

test('hasExecCall detecta exec directo y por member expression', () => {
  const identifierAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'exec' },
    arguments: [{ type: 'StringLiteral', value: 'ls' }],
  };
  const memberAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'childProcess' },
      property: { type: 'Identifier', name: 'exec' },
    },
    arguments: [{ type: 'StringLiteral', value: 'ls' }],
  };
  const otherAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'spawn' },
    arguments: [{ type: 'StringLiteral', value: 'ls' }],
  };

  assert.equal(hasExecCall(identifierAst), true);
  assert.equal(hasExecCall(memberAst), true);
  assert.equal(hasExecCall(otherAst), false);
});

test('find*Lines de core retornan lineas de coincidencia', () => {
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'CallExpression',
        loc: { start: { line: 3 } },
        callee: {
          type: 'MemberExpression',
          computed: false,
          object: { type: 'Identifier', name: 'process' },
          property: { type: 'Identifier', name: 'exit' },
        },
        arguments: [],
      },
      {
        type: 'ImportDeclaration',
        loc: { start: { line: 7 } },
        source: { type: 'StringLiteral', value: 'child_process' },
      },
      {
        type: 'AssignmentExpression',
        loc: { start: { line: 11 } },
        operator: '=',
        left: {
          type: 'MemberExpression',
          computed: false,
          object: {
            type: 'MemberExpression',
            computed: false,
            object: { type: 'Identifier', name: 'process' },
            property: { type: 'Identifier', name: 'env' },
          },
          property: { type: 'Identifier', name: 'NODE_ENV' },
        },
        right: { type: 'StringLiteral', value: 'production' },
      },
      {
        type: 'CallExpression',
        loc: { start: { line: 15 } },
        callee: { type: 'Identifier', name: 'execSync' },
        arguments: [{ type: 'StringLiteral', value: 'ls' }],
      },
      {
        type: 'CallExpression',
        loc: { start: { line: 18 } },
        callee: { type: 'Identifier', name: 'exec' },
        arguments: [{ type: 'StringLiteral', value: 'ls' }],
      },
    ],
  };

  assert.deepEqual(findProcessExitCallLines(ast), [3]);
  assert.deepEqual(findChildProcessImportLines(ast), [7]);
  assert.deepEqual(findProcessEnvMutationLines(ast), [11]);
  assert.deepEqual(findExecSyncCallLines(ast), [15]);
  assert.deepEqual(findExecCallLines(ast), [18]);
});
