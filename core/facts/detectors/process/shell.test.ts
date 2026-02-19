import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasChildProcessShellTrueCall,
  hasDynamicShellInvocationCall,
  hasExecFileUntrustedArgsCall,
} from './shell';

test('hasDynamicShellInvocationCall detecta exec/execSync con comando dinamico', () => {
  const identifierAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'exec' },
    arguments: [{ type: 'Identifier', name: 'cmd' }],
  };
  const memberAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'childProcess' },
      property: { type: 'Identifier', name: 'execSync' },
    },
    arguments: [{ type: 'Identifier', name: 'cmd' }],
  };
  const staticAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'exec' },
    arguments: [{ type: 'StringLiteral', value: 'ls -la' }],
  };

  assert.equal(hasDynamicShellInvocationCall(identifierAst), true);
  assert.equal(hasDynamicShellInvocationCall(memberAst), true);
  assert.equal(hasDynamicShellInvocationCall(staticAst), false);
});

test('hasChildProcessShellTrueCall detecta opciones shell: true en spawn/execFile', () => {
  const spawnAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'spawn' },
    arguments: [
      { type: 'StringLiteral', value: 'node' },
      { type: 'ArrayExpression', elements: [] },
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'shell' },
            value: { type: 'BooleanLiteral', value: true },
          },
        ],
      },
    ],
  };
  const computedAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: true,
      object: { type: 'Identifier', name: 'cp' },
      property: { type: 'StringLiteral', value: 'execFileSync' },
    },
    arguments: [
      { type: 'StringLiteral', value: 'node' },
      { type: 'ArrayExpression', elements: [] },
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'StringLiteral', value: 'shell' },
            value: { type: 'BooleanLiteral', value: true },
          },
        ],
      },
    ],
  };
  const safeAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'spawn' },
    arguments: [
      { type: 'StringLiteral', value: 'node' },
      { type: 'ArrayExpression', elements: [] },
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ObjectProperty',
            key: { type: 'Identifier', name: 'shell' },
            value: { type: 'BooleanLiteral', value: false },
          },
        ],
      },
    ],
  };

  assert.equal(hasChildProcessShellTrueCall(spawnAst), true);
  assert.equal(hasChildProcessShellTrueCall(computedAst), true);
  assert.equal(hasChildProcessShellTrueCall(safeAst), false);
});

test('hasExecFileUntrustedArgsCall detecta args no confiables y descarta arrays estaticos', () => {
  const untrustedAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'execFile' },
    arguments: [
      { type: 'StringLiteral', value: '/usr/bin/git' },
      { type: 'Identifier', name: 'userArgs' },
    ],
  };
  const safeAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'execFileSync' },
    arguments: [
      { type: 'StringLiteral', value: '/usr/bin/git' },
      {
        type: 'ArrayExpression',
        elements: [
          { type: 'StringLiteral', value: 'status' },
          { type: 'StringLiteral', value: '--short' },
        ],
      },
    ],
  };
  const dynamicFileAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'execFile' },
    arguments: [
      { type: 'Identifier', name: 'binPath' },
      { type: 'Identifier', name: 'userArgs' },
    ],
  };

  assert.equal(hasExecFileUntrustedArgsCall(untrustedAst), true);
  assert.equal(hasExecFileUntrustedArgsCall(safeAst), false);
  assert.equal(hasExecFileUntrustedArgsCall(dynamicFileAst), false);
});
