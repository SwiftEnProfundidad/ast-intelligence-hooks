import assert from 'node:assert/strict';
import test from 'node:test';
import { astHeuristicsRuleSet } from '../../rules/presets/astHeuristicsRuleSet';
import {
  AST_DETECTOR_CONTRACT,
  resolveAstDetectorLanguageByRuleId,
} from './contract';

test('AST_DETECTOR_CONTRACT declara prefijos unicos', () => {
  const prefixes = AST_DETECTOR_CONTRACT.map((entry) => entry.ruleIdPrefix.toLowerCase());
  assert.equal(prefixes.length, new Set(prefixes).size);
});

test('resolveAstDetectorLanguageByRuleId mapea reglas heuristicas conocidas', () => {
  assert.equal(resolveAstDetectorLanguageByRuleId('heuristics.ts.console-log.ast'), 'typescript');
  assert.equal(resolveAstDetectorLanguageByRuleId('heuristics.ios.force-unwrap.ast'), 'swift');
  assert.equal(resolveAstDetectorLanguageByRuleId('heuristics.android.thread-sleep.ast'), 'kotlin');
  assert.equal(resolveAstDetectorLanguageByRuleId('common.error.empty_catch'), 'typescript');
  assert.equal(resolveAstDetectorLanguageByRuleId('workflow.bdd.missing_feature_files'), 'generic');
  assert.equal(resolveAstDetectorLanguageByRuleId(''), null);
});

test('todas las reglas AST heuristicas quedan cubiertas por contrato de lenguaje', () => {
  const uncoveredRuleIds = astHeuristicsRuleSet
    .map((rule) => rule.id)
    .filter((ruleId) => resolveAstDetectorLanguageByRuleId(ruleId) === null);

  assert.deepEqual(uncoveredRuleIds, []);
});
