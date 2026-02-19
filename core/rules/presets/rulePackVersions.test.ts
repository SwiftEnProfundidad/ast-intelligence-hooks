import assert from 'node:assert/strict';
import test from 'node:test';
import { rulePackVersions, type RulePackName } from './rulePackVersions';

test('rulePackVersions expone versiones semver para todos los packs conocidos', () => {
  const expected: Record<RulePackName, string> = {
    astHeuristicsRuleSet: '0.5.0',
    iosEnterpriseRuleSet: '1.0.0',
    backendRuleSet: '1.0.0',
    frontendRuleSet: '1.0.0',
    androidRuleSet: '1.0.0',
    rulesgold: '1.0.0',
    rulesbackend: '1.0.0',
  };

  assert.deepEqual(rulePackVersions, expected);

  for (const version of Object.values(rulePackVersions)) {
    assert.match(version, /^\d+\.\d+\.\d+$/);
  }
});
