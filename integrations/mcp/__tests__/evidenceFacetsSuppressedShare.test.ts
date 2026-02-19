import assert from 'node:assert/strict';
import test from 'node:test';
import * as suppressedShare from '../evidenceFacetsSuppressedShare';
import { toSuppressedShareDirection } from '../evidenceFacetsSuppressedShareCore';
import { toSuppressedShareTriageAction } from '../evidenceFacetsSuppressedShareTriage';

test('evidenceFacetsSuppressedShare direct barrel re-exports remain wired', () => {
  assert.strictEqual(
    suppressedShare.toSuppressedShareDirection,
    toSuppressedShareDirection,
  );
  assert.strictEqual(
    suppressedShare.toSuppressedShareTriageAction,
    toSuppressedShareTriageAction,
  );
});

test('evidenceFacetsSuppressedShare direct barrel exposes callable helpers', () => {
  assert.equal(typeof suppressedShare.toSuppressedShareDirection, 'function');
  assert.equal(typeof suppressedShare.toSuppressedShareTriageAction, 'function');
});
