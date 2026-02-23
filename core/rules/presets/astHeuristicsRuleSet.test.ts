import assert from 'node:assert/strict';
import test from 'node:test';

import type { RuleSet } from '../RuleSet';
import { mergeRuleSets } from '../mergeRuleSets';
import { astHeuristicsRuleSet } from './astHeuristicsRuleSet';
import { androidRules } from './heuristics/android';
import { browserRules } from './heuristics/browser';
import { fsCallbacksRules } from './heuristics/fsCallbacks';
import { fsPromisesRules } from './heuristics/fsPromises';
import { fsSyncRules } from './heuristics/fsSync';
import { iosRules } from './heuristics/ios';
import { processRules } from './heuristics/process';
import { securityRules } from './heuristics/security';
import { typescriptRules } from './heuristics/typescript';
import { vmRules } from './heuristics/vm';
import { commonLegacyRules } from './heuristics/commonLegacy';

test('astHeuristicsRuleSet compone y normaliza reglas heurísticas esperadas', () => {
  const heuristicsRuleGroups: RuleSet[] = [
    typescriptRules,
    processRules,
    securityRules,
    browserRules,
    vmRules,
    fsSyncRules,
    fsPromisesRules,
    fsCallbacksRules,
    iosRules,
    androidRules,
    commonLegacyRules,
  ];

  const expected = heuristicsRuleGroups.reduce(
    (accumulator, next) => mergeRuleSets(accumulator, next),
    [] as RuleSet
  );

  assert.deepEqual(astHeuristicsRuleSet, expected);

  const ids = astHeuristicsRuleSet.map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes('heuristics.ts.empty-catch.ast'));
  assert.ok(ids.includes('common.error.empty_catch'));
  assert.ok(ids.includes('heuristics.ios.anyview.ast'));
  assert.ok(ids.includes('heuristics.android.thread-sleep.ast'));

  const platforms = new Set(astHeuristicsRuleSet.map((rule) => rule.platform));
  assert.ok(platforms.has('generic'));
  assert.ok(platforms.has('ios'));
  assert.ok(platforms.has('android'));

  for (const rule of astHeuristicsRuleSet) {
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
  }
});
