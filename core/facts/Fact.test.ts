import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from './Fact';

test('Fact incluye source en variantes FileChange, FileContent, Dependency y Heuristic', () => {
  const fileChangeFact: Fact = {
    kind: 'FileChange',
    path: 'apps/backend/src/main.ts',
    changeType: 'modified',
    source: 'git',
  };
  const fileContentFact: Fact = {
    kind: 'FileContent',
    path: 'apps/backend/src/main.ts',
    content: 'export const ready = true;',
    source: 'repo',
  };
  const dependencyFact: Fact = {
    kind: 'Dependency',
    from: 'module/a',
    to: 'module/b',
    source: 'deps',
  };
  const heuristicFact: Fact = {
    kind: 'Heuristic',
    ruleId: 'heuristics.example.rule',
    severity: 'WARN',
    code: 'HEURISTICS_EXAMPLE_RULE',
    message: 'Example heuristic.',
    filePath: 'apps/backend/src/main.ts',
    source: 'heuristics:ast',
  };

  assert.equal(fileChangeFact.source, 'git');
  assert.equal(fileContentFact.source, 'repo');
  assert.equal(dependencyFact.source, 'deps');
  assert.equal(heuristicFact.source, 'heuristics:ast');
});

test('Fact mantiene acceso consistente al discriminante kind', () => {
  const facts: Fact[] = [
    {
      kind: 'FileChange',
      path: 'apps/backend/src/main.ts',
      changeType: 'added',
      source: 'git',
    },
    {
      kind: 'FileContent',
      path: 'apps/backend/src/main.ts',
      content: 'const a = 1;',
      source: 'repo',
    },
    {
      kind: 'Dependency',
      from: 'a',
      to: 'b',
      source: 'deps',
    },
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.example',
      severity: 'WARN',
      code: 'HEURISTICS_EXAMPLE',
      message: 'Example',
      source: 'heuristics:ast',
    },
  ];

  assert.deepEqual(
    facts.map((fact) => fact.kind),
    ['FileChange', 'FileContent', 'Dependency', 'Heuristic']
  );
});
