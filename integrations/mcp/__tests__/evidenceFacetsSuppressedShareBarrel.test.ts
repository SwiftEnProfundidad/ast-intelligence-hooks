import assert from 'node:assert/strict';
import test from 'node:test';
import * as suppressedShare from '../evidenceFacetsSuppressedShare';
import {
  toSuppressedShareDirection,
  toSuppressedShareNetPolarityPct,
} from '../evidenceFacetsSuppressedShareCore';
import {
  toSuppressedShareTriageAction,
  toSuppressedShareTriageSummary,
} from '../evidenceFacetsSuppressedShareTriage';

test('evidenceFacetsSuppressedShare reexporta funciones de core y triage', () => {
  assert.equal(
    suppressedShare.toSuppressedShareDirection,
    toSuppressedShareDirection,
  );
  assert.equal(
    suppressedShare.toSuppressedShareNetPolarityPct,
    toSuppressedShareNetPolarityPct,
  );
  assert.equal(
    suppressedShare.toSuppressedShareTriageSummary,
    toSuppressedShareTriageSummary,
  );
  assert.equal(
    suppressedShare.toSuppressedShareTriageAction,
    toSuppressedShareTriageAction,
  );
});

test('evidenceFacetsSuppressedShare expone funciones ejecutables', () => {
  assert.equal(typeof suppressedShare.toSuppressedShareDirection, 'function');
  assert.equal(typeof suppressedShare.toSuppressedShareNetPolarityPct, 'function');
  assert.equal(typeof suppressedShare.toSuppressedShareTriageSummary, 'function');
  assert.equal(typeof suppressedShare.toSuppressedShareTriageAction, 'function');
});
