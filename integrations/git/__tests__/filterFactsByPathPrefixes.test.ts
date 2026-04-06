import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import {
  filterFactsByPathPrefixes,
  resolveGateScopePathPrefixesFromEnv,
} from '../filterFactsByPathPrefixes';

test('filterFactsByPathPrefixes keeps all facts when prefixes empty', () => {
  const facts: Fact[] = [
    {
      kind: 'FileChange',
      path: 'apps/backend/src/a.ts',
      changeType: 'modified',
      source: 'git',
    },
  ];
  assert.equal(filterFactsByPathPrefixes(facts, []).length, 1);
});

test('filterFactsByPathPrefixes filters by prefix', () => {
  const facts: Fact[] = [
    {
      kind: 'FileChange',
      path: 'apps/backend/src/a.ts',
      changeType: 'modified',
      source: 'git',
    },
    {
      kind: 'FileChange',
      path: 'apps/ios/App.swift',
      changeType: 'modified',
      source: 'git',
    },
  ];
  const filtered = filterFactsByPathPrefixes(facts, ['apps/backend']);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.path, 'apps/backend/src/a.ts');
});

test('resolveGateScopePathPrefixesFromEnv parses comma list', () => {
  const previous = process.env.PUMUKI_GATE_SCOPE_PATH_PREFIXES;
  process.env.PUMUKI_GATE_SCOPE_PATH_PREFIXES = 'apps/backend, apps/ios/';
  try {
    const prefixes = resolveGateScopePathPrefixesFromEnv();
    assert.ok(prefixes.includes('apps/backend'));
    assert.ok(prefixes.includes('apps/ios/'));
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_GATE_SCOPE_PATH_PREFIXES;
    } else {
      process.env.PUMUKI_GATE_SCOPE_PATH_PREFIXES = previous;
    }
  }
});
