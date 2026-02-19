import assert from 'node:assert/strict';
import test from 'node:test';
import * as facetsBase from '../evidenceFacetsBase';
import * as facetsSnapshot from '../evidenceFacetsSnapshot';
import {
  sortRulesets,
  toRulesetsBundlesCount,
  toRulesetsByPlatform,
  toRulesetsFingerprint,
  toRulesetsHashesCount,
  toRulesetsPlatformsCount,
} from '../evidenceFacetsRulesets';
import { sortPlatforms, toPlatformConfidenceCounts } from '../evidenceFacetsPlatforms';
import {
  toBlockingFindingsCount,
  toHighestSeverity,
  toSeverityCounts,
  severityOrder,
  severityRank,
} from '../evidenceFacetsSeverity';
import {
  toFindingsByPlatform,
  toFindingsFilesCount,
  toFindingsRulesCount,
  toFindingsWithLinesCount,
} from '../evidenceFacetsFindings';
import { toLedgerByPlatform, toLedgerFilesCount, toLedgerRulesCount } from '../evidenceFacetsLedger';

test('evidenceFacetsBase reexporta facetas base esperadas', () => {
  assert.equal(facetsBase.sortRulesets, sortRulesets);
  assert.equal(facetsBase.toRulesetsByPlatform, toRulesetsByPlatform);
  assert.equal(facetsBase.toRulesetsFingerprint, toRulesetsFingerprint);
  assert.equal(facetsBase.toRulesetsBundlesCount, toRulesetsBundlesCount);
  assert.equal(facetsBase.toRulesetsPlatformsCount, toRulesetsPlatformsCount);
  assert.equal(facetsBase.toRulesetsHashesCount, toRulesetsHashesCount);
  assert.equal(facetsBase.sortPlatforms, sortPlatforms);
  assert.equal(facetsBase.toPlatformConfidenceCounts, toPlatformConfidenceCounts);
  assert.equal(facetsBase.severityOrder, severityOrder);
  assert.equal(facetsBase.severityRank, severityRank);
  assert.equal(facetsBase.toSeverityCounts, toSeverityCounts);
  assert.equal(facetsBase.toHighestSeverity, toHighestSeverity);
  assert.equal(facetsBase.toBlockingFindingsCount, toBlockingFindingsCount);
});

test('evidenceFacetsSnapshot reexporta facetas snapshot esperadas', () => {
  assert.equal(facetsSnapshot.sortPlatforms, sortPlatforms);
  assert.equal(facetsSnapshot.toPlatformConfidenceCounts, toPlatformConfidenceCounts);
  assert.equal(facetsSnapshot.toFindingsFilesCount, toFindingsFilesCount);
  assert.equal(facetsSnapshot.toFindingsRulesCount, toFindingsRulesCount);
  assert.equal(facetsSnapshot.toFindingsWithLinesCount, toFindingsWithLinesCount);
  assert.equal(facetsSnapshot.toFindingsByPlatform, toFindingsByPlatform);
  assert.equal(facetsSnapshot.toLedgerByPlatform, toLedgerByPlatform);
  assert.equal(facetsSnapshot.toLedgerFilesCount, toLedgerFilesCount);
  assert.equal(facetsSnapshot.toLedgerRulesCount, toLedgerRulesCount);
  assert.equal(facetsSnapshot.toSeverityCounts, toSeverityCounts);
  assert.equal(facetsSnapshot.toHighestSeverity, toHighestSeverity);
  assert.equal(facetsSnapshot.toBlockingFindingsCount, toBlockingFindingsCount);
});
