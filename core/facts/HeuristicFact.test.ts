import assert from 'node:assert/strict';
import test from 'node:test';
import type { HeuristicFact } from './HeuristicFact';

test('HeuristicFact conserva campos requeridos y severidad valida', () => {
  const fact: HeuristicFact = {
    kind: 'Heuristic',
    ruleId: 'heuristics.ts.console-log.ast',
    severity: 'WARN',
    code: 'HEURISTICS_CONSOLE_LOG_AST',
    message: 'AST heuristic detected console.log usage.',
    filePath: 'apps/backend/src/main.ts',
  };

  assert.equal(fact.kind, 'Heuristic');
  assert.equal(fact.ruleId, 'heuristics.ts.console-log.ast');
  assert.equal(fact.severity, 'WARN');
  assert.equal(fact.code, 'HEURISTICS_CONSOLE_LOG_AST');
  assert.equal(fact.message, 'AST heuristic detected console.log usage.');
  assert.equal(fact.filePath, 'apps/backend/src/main.ts');
});

test('HeuristicFact permite omitir filePath', () => {
  const factWithoutPath: HeuristicFact = {
    kind: 'Heuristic',
    ruleId: 'heuristics.summary',
    severity: 'INFO',
    code: 'HEURISTICS_SUMMARY',
    message: 'Summary heuristic.',
  };

  assert.equal(factWithoutPath.filePath, undefined);
  assert.equal(factWithoutPath.severity, 'INFO');
});
