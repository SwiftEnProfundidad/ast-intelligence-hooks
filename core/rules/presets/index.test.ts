import assert from 'node:assert/strict';
import test from 'node:test';
import {
  androidRuleSet as androidRuleSetFromBarrel,
  astHeuristicsRuleSet as astHeuristicsRuleSetFromBarrel,
  backendRuleSet as backendRuleSetFromBarrel,
  exampleRuleSet as exampleRuleSetFromBarrel,
  frontendRuleSet as frontendRuleSetFromBarrel,
  iosEnterpriseRuleSet as iosEnterpriseRuleSetFromBarrel,
  iosNonNegotiableRuleSet as iosNonNegotiableRuleSetFromBarrel,
  rulePackVersions as rulePackVersionsFromBarrel,
} from './index';
import { androidRuleSet } from './androidRuleSet';
import { astHeuristicsRuleSet } from './astHeuristicsRuleSet';
import { backendRuleSet } from './backendRuleSet';
import { exampleRuleSet } from './exampleRuleSet';
import { frontendRuleSet } from './frontendRuleSet';
import { iosEnterpriseRuleSet } from './iosEnterpriseRuleSet';
import { iosNonNegotiableRuleSet } from './iosNonNegotiableRuleSet';
import { rulePackVersions } from './rulePackVersions';

test('presets barrel reexporta rule sets y metadata de versiones', () => {
  assert.equal(astHeuristicsRuleSetFromBarrel, astHeuristicsRuleSet);
  assert.equal(androidRuleSetFromBarrel, androidRuleSet);
  assert.equal(backendRuleSetFromBarrel, backendRuleSet);
  assert.equal(frontendRuleSetFromBarrel, frontendRuleSet);
  assert.equal(exampleRuleSetFromBarrel, exampleRuleSet);
  assert.equal(iosEnterpriseRuleSetFromBarrel, iosEnterpriseRuleSet);
  assert.equal(iosNonNegotiableRuleSetFromBarrel, iosNonNegotiableRuleSet);
  assert.equal(rulePackVersionsFromBarrel, rulePackVersions);
  assert.equal(rulePackVersionsFromBarrel.backendRuleSet, rulePackVersions.backendRuleSet);
});
