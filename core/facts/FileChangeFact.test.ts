import assert from 'node:assert/strict';
import test from 'node:test';
import type { FileChangeFact } from './FileChangeFact';

test('FileChangeFact soporta los tres changeType permitidos', () => {
  const addedFact: FileChangeFact = {
    kind: 'FileChange',
    path: 'apps/backend/src/new-file.ts',
    changeType: 'added',
  };
  const modifiedFact: FileChangeFact = {
    kind: 'FileChange',
    path: 'apps/backend/src/existing-file.ts',
    changeType: 'modified',
  };
  const deletedFact: FileChangeFact = {
    kind: 'FileChange',
    path: 'apps/backend/src/old-file.ts',
    changeType: 'deleted',
  };

  assert.equal(addedFact.changeType, 'added');
  assert.equal(modifiedFact.changeType, 'modified');
  assert.equal(deletedFact.changeType, 'deleted');
});

test('FileChangeFact conserva kind y path en registros tipados', () => {
  const fact: FileChangeFact = {
    kind: 'FileChange',
    path: 'apps/frontend/src/App.tsx',
    changeType: 'modified',
  };

  assert.equal(fact.kind, 'FileChange');
  assert.equal(fact.path, 'apps/frontend/src/App.tsx');
});
