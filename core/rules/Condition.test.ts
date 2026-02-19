import assert from 'node:assert/strict';
import test from 'node:test';
import type { Condition } from './Condition';

test('Condition soporta variantes base FileChange, Heuristic, FileContent y Dependency', () => {
  const fileChange: Condition = {
    kind: 'FileChange',
    where: { pathPrefix: 'apps/backend/', changeType: 'modified' },
  };
  const heuristic: Condition = {
    kind: 'Heuristic',
    where: { ruleId: 'heuristics.ts.console-log.ast', code: 'HEURISTICS_CONSOLE_LOG_AST' },
  };
  const fileContent: Condition = {
    kind: 'FileContent',
    contains: ['console.log'],
    regex: ['console\\.log\\('],
  };
  const dependency: Condition = {
    kind: 'Dependency',
    where: { from: 'core/gate/evaluateGate', to: 'core/gate/evaluateRules' },
  };

  assert.equal(fileChange.kind, 'FileChange');
  assert.equal(heuristic.kind, 'Heuristic');
  assert.equal(fileContent.kind, 'FileContent');
  assert.equal(dependency.kind, 'Dependency');
});

test('Condition soporta compuestos All, Any y Not', () => {
  const compound: Condition = {
    kind: 'All',
    conditions: [
      { kind: 'FileChange', where: { changeType: 'modified' } },
      {
        kind: 'Any',
        conditions: [
          { kind: 'FileContent', contains: ['token'] },
          { kind: 'Dependency', where: { to: 'core/gate/evaluateRules' } },
        ],
      },
      {
        kind: 'Not',
        condition: { kind: 'Heuristic', where: { code: 'HEURISTICS_DEBUGGER_AST' } },
      },
    ],
  };

  assert.equal(compound.kind, 'All');
  const anyNode = compound.conditions[1];
  const notNode = compound.conditions[2];
  assert.equal(anyNode?.kind, 'Any');
  assert.equal(notNode?.kind, 'Not');
});
