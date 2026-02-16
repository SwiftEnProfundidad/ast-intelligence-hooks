import assert from 'node:assert/strict';
import test from 'node:test';
import type { FileContentFact } from './FileContentFact';

test('FileContentFact conserva kind, path y content', () => {
  const fact: FileContentFact = {
    kind: 'FileContent',
    path: 'apps/backend/src/service.ts',
    content: 'export const value = 1;',
  };

  assert.equal(fact.kind, 'FileContent');
  assert.equal(fact.path, 'apps/backend/src/service.ts');
  assert.equal(fact.content, 'export const value = 1;');
});

test('FileContentFact permite contenido multilinea', () => {
  const fact: FileContentFact = {
    kind: 'FileContent',
    path: 'apps/frontend/src/App.tsx',
    content: 'const a = 1;\nconst b = 2;\n',
  };

  assert.equal(fact.content.includes('\n'), true);
  assert.equal(fact.content.split('\n').length > 1, true);
});
