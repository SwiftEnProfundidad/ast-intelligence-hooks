import assert from 'node:assert/strict';
import test from 'node:test';
import { androidRuleSet } from '../../../core/rules/presets/androidRuleSet';
import { backendRuleSet } from '../../../core/rules/presets/backendRuleSet';
import { frontendRuleSet } from '../../../core/rules/presets/frontendRuleSet';
import { iosEnterpriseRuleSet } from '../../../core/rules/presets/iosEnterpriseRuleSet';
import { rulePackVersions } from '../../../core/rules/presets/rulePackVersions';
import {
  buildBaselineRuleSetEntries,
  buildCombinedBaselineRules,
} from '../baselineRuleSets';

test('buildCombinedBaselineRules concatena reglas en orden ios/backend/frontend/android', () => {
  const result = buildCombinedBaselineRules({
    ios: { detected: true, confidence: 'HIGH' },
    backend: { detected: true, confidence: 'HIGH' },
    frontend: { detected: true, confidence: 'HIGH' },
    android: { detected: true, confidence: 'HIGH' },
  });

  assert.deepEqual(result, [
    ...iosEnterpriseRuleSet,
    ...backendRuleSet,
    ...frontendRuleSet,
    ...androidRuleSet,
  ]);
});

test('buildCombinedBaselineRules retorna vacio si no hay plataformas detectadas', () => {
  const result = buildCombinedBaselineRules({});
  assert.deepEqual(result, []);
});

test('buildBaselineRuleSetEntries crea entries solo para plataformas detectadas y en orden estable', () => {
  const result = buildBaselineRuleSetEntries({
    backend: { detected: true, confidence: 'HIGH' },
    android: { detected: true, confidence: 'HIGH' },
  });

  assert.equal(result.length, 2);
  assert.deepEqual(result.map((entry) => entry.platform), ['backend', 'android']);
  assert.deepEqual(result.map((entry) => entry.bundle), [
    `backendRuleSet@${rulePackVersions.backendRuleSet}`,
    `androidRuleSet@${rulePackVersions.androidRuleSet}`,
  ]);
  assert.equal(result[0].rules, backendRuleSet);
  assert.equal(result[1].rules, androidRuleSet);
});

test('buildBaselineRuleSetEntries retorna vacio si no hay plataformas detectadas', () => {
  const result = buildBaselineRuleSetEntries({});
  assert.deepEqual(result, []);
});
