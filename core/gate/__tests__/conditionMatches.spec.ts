import { conditionMatches } from '../conditionMatches';
import type { Condition } from '../../rules/Condition';

const facts = [
  {
    kind: 'FileChange' as const,
    path: 'apps/backend/src/main.ts',
    changeType: 'modified' as const,
    source: 'git',
  },
  {
    kind: 'FileContent' as const,
    path: 'apps/backend/src/main.ts',
    content: 'console.log("hello")\nconst token = "abc123";',
    source: 'repo',
  },
  {
    kind: 'Dependency' as const,
    from: 'core/gate/evaluateGate',
    to: 'core/gate/evaluateRules',
    source: 'depcruise',
  },
  {
    kind: 'Heuristic' as const,
    ruleId: 'heuristics.ts.console-log.ast',
    severity: 'WARN' as const,
    code: 'HEURISTICS_CONSOLE_LOG_AST',
    message: 'AST heuristic detected console.log usage.',
    filePath: 'apps/backend/src/main.ts',
    source: 'heuristics:ast',
  },
];

describe('conditionMatches', () => {
  test('evalua FileChange por prefijo y tipo de cambio', () => {
    const matchingCondition: Condition = {
      kind: 'FileChange',
      where: { pathPrefix: 'apps/backend/', changeType: 'modified' },
    };
    const nonMatchingCondition: Condition = {
      kind: 'FileChange',
      where: { pathPrefix: 'apps/frontend/', changeType: 'modified' },
    };

    expect(conditionMatches(matchingCondition, facts)).toBe(true);
    expect(conditionMatches(nonMatchingCondition, facts)).toBe(false);
  });

  test('evalua FileContent con contains, regex y scope', () => {
    const condition: Condition = {
      kind: 'FileContent',
      contains: ['console.log', 'token'],
      regex: ['console\\.log\\(', 'token\\s*='],
    };

    expect(
      conditionMatches(condition, facts, {
        include: ['apps/backend/*'],
        exclude: ['apps/backend/generated/*'],
      })
    ).toBe(true);

    expect(
      conditionMatches(condition, facts, {
        include: ['apps/frontend/*'],
      })
    ).toBe(false);
  });

  test('evalua Dependency y Heuristic con where', () => {
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

    expect(conditionMatches(dependencyCondition, facts)).toBe(true);
    expect(conditionMatches(heuristicCondition, facts)).toBe(true);
  });

  test('soporta condiciones compuestas All, Any y Not', () => {
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

    expect(conditionMatches(composedCondition, facts)).toBe(true);
  });
});
