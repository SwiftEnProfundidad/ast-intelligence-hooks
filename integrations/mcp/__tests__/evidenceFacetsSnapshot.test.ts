import assert from 'node:assert/strict';
import test from 'node:test';
import * as snapshot from '../evidenceFacetsSnapshot';
import { sortPlatforms } from '../evidenceFacetsPlatforms';
import { toFindingsFilesCount } from '../evidenceFacetsFindings';
import { toLedgerFilesCount } from '../evidenceFacetsLedger';
import { toSeverityCounts } from '../evidenceFacetsSeverity';

test('evidenceFacetsSnapshot re-exporta facetas de snapshot', () => {
  assert.strictEqual(snapshot.sortPlatforms, sortPlatforms);
  assert.strictEqual(snapshot.toFindingsFilesCount, toFindingsFilesCount);
  assert.strictEqual(snapshot.toLedgerFilesCount, toLedgerFilesCount);
  assert.strictEqual(snapshot.toSeverityCounts, toSeverityCounts);
});

test('evidenceFacetsSnapshot expone helpers ejecutables', () => {
  assert.equal(typeof snapshot.sortPlatforms, 'function');
  assert.equal(typeof snapshot.toFindingsFilesCount, 'function');
  assert.equal(typeof snapshot.toLedgerFilesCount, 'function');
  assert.equal(typeof snapshot.toSeverityCounts, 'function');
});
