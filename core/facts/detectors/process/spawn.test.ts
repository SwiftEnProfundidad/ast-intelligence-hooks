import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasExecFileCall,
  hasExecFileSyncCall,
  hasForkCall,
  hasSpawnCall,
  hasSpawnSyncCall,
} from './spawn';

test('hasSpawnSyncCall detecta spawnSync en llamadas directas y member', () => {
  const directAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'spawnSync' },
    arguments: [],
  };
  const memberAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'childProcess' },
      property: { type: 'Identifier', name: 'spawnSync' },
    },
    arguments: [],
  };
  const otherAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'spawn' },
    arguments: [],
  };

  assert.equal(hasSpawnSyncCall(directAst), true);
  assert.equal(hasSpawnSyncCall(memberAst), true);
  assert.equal(hasSpawnSyncCall(otherAst), false);
});

test('hasSpawnCall detecta spawn en directas, member y computed', () => {
  const directAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'spawn' },
    arguments: [],
  };
  const memberAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'cp' },
      property: { type: 'Identifier', name: 'spawn' },
    },
    arguments: [],
  };
  const computedAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: true,
      object: { type: 'Identifier', name: 'cp' },
      property: { type: 'StringLiteral', value: 'spawn' },
    },
    arguments: [],
  };
  const otherAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'spawnSync' },
    arguments: [],
  };

  assert.equal(hasSpawnCall(directAst), true);
  assert.equal(hasSpawnCall(memberAst), true);
  assert.equal(hasSpawnCall(computedAst), true);
  assert.equal(hasSpawnCall(otherAst), false);
});

test('hasForkCall detecta fork y descarta llamadas distintas', () => {
  const directAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'fork' },
    arguments: [],
  };
  const memberAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'cp' },
      property: { type: 'Identifier', name: 'fork' },
    },
    arguments: [],
  };
  const otherAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'execFile' },
    arguments: [],
  };

  assert.equal(hasForkCall(directAst), true);
  assert.equal(hasForkCall(memberAst), true);
  assert.equal(hasForkCall(otherAst), false);
});

test('hasExecFileSyncCall detecta execFileSync y descarta execFile', () => {
  const directAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'execFileSync' },
    arguments: [],
  };
  const memberAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'cp' },
      property: { type: 'Identifier', name: 'execFileSync' },
    },
    arguments: [],
  };
  const otherAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'execFile' },
    arguments: [],
  };

  assert.equal(hasExecFileSyncCall(directAst), true);
  assert.equal(hasExecFileSyncCall(memberAst), true);
  assert.equal(hasExecFileSyncCall(otherAst), false);
});

test('hasExecFileCall detecta execFile y descarta execFileSync', () => {
  const directAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'execFile' },
    arguments: [],
  };
  const memberAst = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: { type: 'Identifier', name: 'cp' },
      property: { type: 'Identifier', name: 'execFile' },
    },
    arguments: [],
  };
  const otherAst = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'execFileSync' },
    arguments: [],
  };

  assert.equal(hasExecFileCall(directAst), true);
  assert.equal(hasExecFileCall(memberAst), true);
  assert.equal(hasExecFileCall(otherAst), false);
});
