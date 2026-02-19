import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import {
  sortRulesets,
  toRulesetsBundlesCount,
  toRulesetsByPlatform,
  toRulesetsFingerprint,
  toRulesetsHashesCount,
  toRulesetsPlatformsCount,
} from '../evidenceFacetsRulesets';

const sampleRulesets: AiEvidenceV2_1['rulesets'] = [
  { platform: 'ios', bundle: 'bundle-b', hash: 'h2' },
  { platform: 'backend', bundle: 'bundle-a', hash: 'h3' },
  { platform: 'ios', bundle: 'bundle-a', hash: 'h1' },
  { platform: 'backend', bundle: 'bundle-a', hash: 'h0' },
  { platform: 'frontend', bundle: 'bundle-c', hash: 'h3' },
];

test('sortRulesets orders by platform, bundle and hash without mutating input', () => {
  const original = [...sampleRulesets];
  const sorted = sortRulesets(sampleRulesets);

  assert.deepEqual(sampleRulesets, original);
  assert.deepEqual(
    sorted.map((item) => `${item.platform}/${item.bundle}/${item.hash}`),
    [
      'backend/bundle-a/h0',
      'backend/bundle-a/h3',
      'frontend/bundle-c/h3',
      'ios/bundle-a/h1',
      'ios/bundle-b/h2',
    ]
  );
});

test('toRulesetsByPlatform returns deterministic sorted counts', () => {
  assert.deepEqual(toRulesetsByPlatform(sampleRulesets), {
    backend: 2,
    frontend: 1,
    ios: 2,
  });
});

test('toRulesetsFingerprint uses sorted hash order', () => {
  assert.equal(toRulesetsFingerprint(sampleRulesets), 'h0|h3|h3|h1|h2');
});

test('rulesets counters compute unique bundles/platforms/hashes', () => {
  assert.equal(toRulesetsBundlesCount(sampleRulesets), 3);
  assert.equal(toRulesetsPlatformsCount(sampleRulesets), 3);
  assert.equal(toRulesetsHashesCount(sampleRulesets), 4);
});
