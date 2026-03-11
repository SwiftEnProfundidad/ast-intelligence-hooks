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

test('HeuristicFact conserva metadata semantica opcional del canario iOS', () => {
  const fact: HeuristicFact = {
    kind: 'Heuristic',
    ruleId: 'heuristics.ios.canary-001.presentation-mixed-responsibilities.ast',
    severity: 'CRITICAL',
    code: 'HEURISTICS_IOS_CANARY_001_PRESENTATION_MIXED_RESPONSIBILITIES_AST',
    message: 'Semantic iOS canary triggered.',
    filePath: 'apps/ios/Sources/AppShell/Application/AppShellViewModel.swift',
    lines: [1, 2, 3, 4],
    primary_node: {
      kind: 'class',
      name: 'AppShellViewModel',
      lines: [1],
    },
    related_nodes: [
      { kind: 'property', name: 'shared singleton', lines: [2] },
      { kind: 'call', name: 'URLSession.shared', lines: [3] },
    ],
    why: 'Mezcla responsabilidades incompatibles.',
    impact: 'Complica tests y cambios.',
    expected_fix: 'Extraer collaborators.',
  };

  assert.equal(fact.primary_node?.name, 'AppShellViewModel');
  assert.equal(fact.related_nodes?.length, 2);
  assert.equal(fact.expected_fix, 'Extraer collaborators.');
});
