import assert from 'node:assert/strict';
import test from 'node:test';
import {
  listSkillsDetectorBindings,
  resolveMappedHeuristicRuleIds,
  resolveSkillsDetectorBinding,
} from '../skillsDetectorRegistry';

test('resuelve detectores heuristics para reglas canonicales backend/frontend/ios/android', () => {
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.backend.no-console-log'), [
    'heuristics.ts.console-log.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.frontend.no-solid-violations'), [
    'heuristics.ts.solid.srp.class-command-query-mix.ast',
    'heuristics.ts.solid.isp.interface-command-query-mix.ast',
    'heuristics.ts.solid.ocp.discriminator-switch.ast',
    'heuristics.ts.solid.lsp.override-not-implemented.ast',
    'heuristics.ts.solid.dip.framework-import.ast',
    'heuristics.ts.solid.dip.concrete-instantiation.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.ios.no-force-unwrap'), [
    'heuristics.ios.force-unwrap.ast',
  ]);
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.android.no-globalscope'), [
    'heuristics.android.globalscope.ast',
  ]);
});

test('devuelve lista ordenada de bindings y binding completo por ruleId', () => {
  const bindings = listSkillsDetectorBindings();
  assert.equal(bindings.length > 0, true);
  const ids = bindings.map((entry) => entry.ruleId);
  const sorted = [...ids].sort((left, right) => left.localeCompare(right));
  assert.deepEqual(ids, sorted);

  const binding = resolveSkillsDetectorBinding('skills.backend.no-god-classes');
  assert.ok(binding);
  assert.equal(binding.detectorId, 'typescript.god-class');
  assert.equal(binding.detectorKind, 'heuristic');
  assert.deepEqual(binding.mappedHeuristicRuleIds, ['heuristics.ts.god-class-large-class.ast']);
});

test('regla no mapeada devuelve lista vacia y binding undefined', () => {
  assert.deepEqual(resolveMappedHeuristicRuleIds('skills.backend.non-existent-rule'), []);
  assert.equal(resolveSkillsDetectorBinding('skills.backend.non-existent-rule'), undefined);
});
