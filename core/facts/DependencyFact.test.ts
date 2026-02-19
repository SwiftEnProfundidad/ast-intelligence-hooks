import assert from 'node:assert/strict';
import test from 'node:test';
import type { DependencyFact } from './DependencyFact';

test('DependencyFact conserva kind, from, to y source', () => {
  const fact: DependencyFact = {
    kind: 'Dependency',
    from: 'core/gate/evaluateGate',
    to: 'core/rules/RuleSet',
    source: 'import-graph',
  };

  assert.equal(fact.kind, 'Dependency');
  assert.equal(fact.from, 'core/gate/evaluateGate');
  assert.equal(fact.to, 'core/rules/RuleSet');
  assert.equal(fact.source, 'import-graph');
});

test('DependencyFact permite modelar relaciones distintas dentro del grafo', () => {
  const dependencies: DependencyFact[] = [
    {
      kind: 'Dependency',
      from: 'integrations/git/runPlatformGate',
      to: 'core/gate/evaluateGate',
      source: 'depcruise',
    },
    {
      kind: 'Dependency',
      from: 'core/facts/extractHeuristicFacts',
      to: 'core/facts/detectors/security',
      source: 'depcruise',
    },
  ];

  assert.equal(dependencies.length, 2);
  assert.equal(dependencies[0]?.kind, 'Dependency');
  assert.equal(dependencies[1]?.source, 'depcruise');
});
