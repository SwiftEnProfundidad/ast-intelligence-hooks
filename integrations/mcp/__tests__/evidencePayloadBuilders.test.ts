import assert from 'node:assert/strict';
import test from 'node:test';
import * as payloadBuilders from '../evidencePayloadBuilders';
import {
  inferFindingPlatform,
  sortLedger,
  sortSnapshotFindings,
  toFindingsPayload,
  toLedgerPayload,
  toLedgerPayloadWithFilters,
  toPlatformsPayload,
  toResponsePayload,
  toRulesetsPayload,
  toSnapshotPayload,
} from '../evidencePayloadCollections';
import { toSummaryPayload } from '../evidencePayloadSummary';

test('evidencePayloadBuilders reexporta builders esperados', () => {
  assert.equal(payloadBuilders.toSummaryPayload, toSummaryPayload);
  assert.equal(payloadBuilders.toFindingsPayload, toFindingsPayload);
  assert.equal(payloadBuilders.toRulesetsPayload, toRulesetsPayload);
  assert.equal(payloadBuilders.toPlatformsPayload, toPlatformsPayload);
  assert.equal(payloadBuilders.toLedgerPayload, toLedgerPayload);
  assert.equal(payloadBuilders.toLedgerPayloadWithFilters, toLedgerPayloadWithFilters);
  assert.equal(payloadBuilders.toSnapshotPayload, toSnapshotPayload);
  assert.equal(payloadBuilders.toResponsePayload, toResponsePayload);
  assert.equal(payloadBuilders.sortSnapshotFindings, sortSnapshotFindings);
  assert.equal(payloadBuilders.sortLedger, sortLedger);
  assert.equal(payloadBuilders.inferFindingPlatform, inferFindingPlatform);
});

test('evidencePayloadBuilders expone funciones ejecutables', () => {
  assert.equal(typeof payloadBuilders.toSummaryPayload, 'function');
  assert.equal(typeof payloadBuilders.toFindingsPayload, 'function');
  assert.equal(typeof payloadBuilders.toRulesetsPayload, 'function');
  assert.equal(typeof payloadBuilders.toPlatformsPayload, 'function');
  assert.equal(typeof payloadBuilders.toLedgerPayload, 'function');
  assert.equal(typeof payloadBuilders.toLedgerPayloadWithFilters, 'function');
  assert.equal(typeof payloadBuilders.toSnapshotPayload, 'function');
  assert.equal(typeof payloadBuilders.toResponsePayload, 'function');
  assert.equal(typeof payloadBuilders.sortSnapshotFindings, 'function');
  assert.equal(typeof payloadBuilders.sortLedger, 'function');
  assert.equal(typeof payloadBuilders.inferFindingPlatform, 'function');
});
