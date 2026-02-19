import assert from 'node:assert/strict';
import test from 'node:test';
import * as suppressed from '../evidenceFacetsSuppressed';
import {
  inferPlatformFromFilePath,
  toSuppressedReasonsCount,
  toSuppressedRulesCount,
} from '../evidenceFacetsSuppressedBase';
import {
  toSuppressedPlatformRulePairsCount,
  toSuppressedReasonsWithReplacementRatioPct,
} from '../evidenceFacetsSuppressedRelations';
import {
  toSuppressedShareDirection,
  toSuppressedShareTriageAction,
} from '../evidenceFacetsSuppressedShare';

test('evidenceFacetsSuppressed reexporta facetas de base, relaciones y share', () => {
  assert.equal(suppressed.toSuppressedRulesCount, toSuppressedRulesCount);
  assert.equal(suppressed.toSuppressedReasonsCount, toSuppressedReasonsCount);
  assert.equal(suppressed.inferPlatformFromFilePath, inferPlatformFromFilePath);
  assert.equal(
    suppressed.toSuppressedPlatformRulePairsCount,
    toSuppressedPlatformRulePairsCount,
  );
  assert.equal(
    suppressed.toSuppressedReasonsWithReplacementRatioPct,
    toSuppressedReasonsWithReplacementRatioPct,
  );
  assert.equal(suppressed.toSuppressedShareDirection, toSuppressedShareDirection);
  assert.equal(
    suppressed.toSuppressedShareTriageAction,
    toSuppressedShareTriageAction,
  );
});

test('evidenceFacetsSuppressed expone funciones ejecutables', () => {
  assert.equal(typeof suppressed.toSuppressedRulesCount, 'function');
  assert.equal(typeof suppressed.toSuppressedPlatformRulePairsCount, 'function');
  assert.equal(typeof suppressed.toSuppressedShareDirection, 'function');
  assert.equal(typeof suppressed.toSuppressedShareTriageAction, 'function');
});
