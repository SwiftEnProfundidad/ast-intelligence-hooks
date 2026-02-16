import assert from 'node:assert/strict';
import test from 'node:test';
import type { Condition } from '../rules/Condition';
import { conditionMatches } from './conditionMatches';

const facts = [
  {
    kind: 'FileChange',
    path: 'apps/backend/src/main.ts',
    changeType: 'modified',
    source: 'git',
  },
  {
    kind: 'FileContent',
    path: 'apps/backend/src/main.ts',
    content: 'console.log("hello")\nconst token = "abc123";',
    source: 'repo',
  },
  {
    kind: 'Dependency',
    from: 'core/gate/evaluateGate',
    to: 'core/gate/evaluateRules',
    source: 'depcruise',
  },
  {
    kind: 'Heuristic',
    ruleId: 'heuristics.ts.console-log.ast',
    severity: 'WARN',
    code: 'HEURISTICS_CONSOLE_LOG_AST',
    message: 'AST heuristic detected console.log usage.',
    filePath: 'apps/backend/src/main.ts',
    source: 'heuristics:ast',
  },
] as const;

test('conditionMatches evalua FileChange por prefijo y tipo de cambio', () => {
  const matchingCondition: Condition = {
    kind: 'FileChange',
    where: { pathPrefix: 'apps/backend/', changeType: 'modified' },
  };
  const nonMatchingCondition: Condition = {
    kind: 'FileChange',
    where: { pathPrefix: 'apps/frontend/', changeType: 'modified' },
  };

  assert.equal(conditionMatches(matchingCondition, facts), true);
  assert.equal(conditionMatches(nonMatchingCondition, facts), false);
});

test('conditionMatches evalua FileContent con contains, regex y scope', () => {
  const condition: Condition = {
    kind: 'FileContent',
    contains: ['console.log', 'token'],
    regex: ['console\\.log\\(', 'token\\s*='],
  };

  assert.equal(
    conditionMatches(condition, facts, {
      include: ['apps/backend/*'],
      exclude: ['apps/backend/generated/*'],
    }),
    true
  );
  assert.equal(
    conditionMatches(condition, facts, {
      include: ['apps/frontend/*'],
    }),
    false
  );
});

test('conditionMatches evalua Dependency y Heuristic con where', () => {
  const dependencyCondition: Condition = {
    kind: 'Dependency',
    where: { from: 'core/gate/evaluateGate', to: 'core/gate/evaluateRules' },
  };
  const heuristicCondition: Condition = {
    kind: 'Heuristic',
    where: {
      ruleId: 'heuristics.ts.console-log.ast',
      code: 'HEURISTICS_CONSOLE_LOG_AST',
      filePathPrefix: 'apps/backend/',
    },
  };

  assert.equal(conditionMatches(dependencyCondition, facts), true);
  assert.equal(conditionMatches(heuristicCondition, facts), true);
});

test('conditionMatches soporta condiciones compuestas All, Any y Not', () => {
  const composedCondition: Condition = {
    kind: 'All',
    conditions: [
      { kind: 'FileChange', where: { changeType: 'modified' } },
      {
        kind: 'Any',
        conditions: [
          { kind: 'Dependency', where: { from: 'missing' } },
          { kind: 'Heuristic', where: { code: 'HEURISTICS_CONSOLE_LOG_AST' } },
        ],
      },
      {
        kind: 'Not',
        condition: { kind: 'FileChange', where: { changeType: 'deleted' } },
      },
    ],
  };

  assert.equal(conditionMatches(composedCondition, facts), true);
});
