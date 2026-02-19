import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasDynamicShellInvocationCall,
  hasProcessExitCall,
  hasSpawnSyncCall,
} from './index';

test('process barrel expone detectores de core, shell y spawn', () => {
  const processExitAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'process' },
      property: { type: 'Identifier', name: 'exit' },
    },
    arguments: [{ type: 'NumericLiteral', value: 1 }],
  };
  const dynamicShellAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'exec' },
    arguments: [{ type: 'Identifier', name: 'cmd' }],
  };
  const spawnSyncAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'spawnSync' },
    arguments: [],
  };

  assert.equal(hasProcessExitCall(processExitAst), true);
  assert.equal(hasDynamicShellInvocationCall(dynamicShellAst), true);
  assert.equal(hasSpawnSyncCall(spawnSyncAst), true);
});

test('process barrel descarta casos no coincidentes', () => {
  const processKillAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'process' },
      property: { type: 'Identifier', name: 'kill' },
    },
    arguments: [{ type: 'Identifier', name: 'pid' }],
  };
  const staticShellAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'exec' },
    arguments: [{ type: 'StringLiteral', value: 'ls -la' }],
  };
  const spawnAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'spawn' },
    arguments: [],
  };

  assert.equal(hasProcessExitCall(processKillAst), false);
  assert.equal(hasDynamicShellInvocationCall(staticShellAst), false);
  assert.equal(hasSpawnSyncCall(spawnAst), false);
});
