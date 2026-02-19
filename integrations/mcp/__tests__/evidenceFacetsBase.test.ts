import assert from 'node:assert/strict';
import test from 'node:test';
import * as base from '../evidenceFacetsBase';
import { sortRulesets } from '../evidenceFacetsRulesets';
import { sortPlatforms } from '../evidenceFacetsPlatforms';
import { toSeverityCounts } from '../evidenceFacetsSeverity';

test('evidenceFacetsBase re-exporta facetas base', () => {
  assert.strictEqual(base.sortRulesets, sortRulesets);
  assert.strictEqual(base.sortPlatforms, sortPlatforms);
  assert.strictEqual(base.toSeverityCounts, toSeverityCounts);
});

test('evidenceFacetsBase expone helpers ejecutables', () => {
  assert.equal(typeof base.sortRulesets, 'function');
  assert.equal(typeof base.sortPlatforms, 'function');
  assert.equal(typeof base.toSeverityCounts, 'function');
});
