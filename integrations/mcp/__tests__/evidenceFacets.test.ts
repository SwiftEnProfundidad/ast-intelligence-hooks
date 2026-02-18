import assert from 'node:assert/strict';
import test from 'node:test';
import * as facets from '../evidenceFacets';
import { toFindingsFilesCount } from '../evidenceFacetsFindings';
import { toLedgerFilesCount } from '../evidenceFacetsLedger';
import { sortPlatforms } from '../evidenceFacetsPlatforms';
import { sortRulesets } from '../evidenceFacetsRulesets';
import { toSeverityCounts } from '../evidenceFacetsSeverity';
import { toSuppressedRulesCount } from '../evidenceFacetsSuppressed';

test('evidenceFacets re-exports expected domain facets', () => {
  assert.strictEqual(facets.sortRulesets, sortRulesets);
  assert.strictEqual(facets.sortPlatforms, sortPlatforms);
  assert.strictEqual(facets.toSeverityCounts, toSeverityCounts);
  assert.strictEqual(facets.toFindingsFilesCount, toFindingsFilesCount);
  assert.strictEqual(facets.toLedgerFilesCount, toLedgerFilesCount);
  assert.strictEqual(facets.toSuppressedRulesCount, toSuppressedRulesCount);
});

test('evidenceFacets exports callable facet helpers', () => {
  assert.equal(typeof facets.sortRulesets, 'function');
  assert.equal(typeof facets.sortPlatforms, 'function');
  assert.equal(typeof facets.toSeverityCounts, 'function');
  assert.equal(typeof facets.toFindingsFilesCount, 'function');
  assert.equal(typeof facets.toLedgerFilesCount, 'function');
  assert.equal(typeof facets.toSuppressedRulesCount, 'function');
});
