import assert from 'node:assert/strict';
import test from 'node:test';
import * as payloadContext from '../evidencePayloadContext';
import { readEvidence, readEvidenceResult } from '../../evidence/readEvidence';
import {
  CONTEXT_API_CAPABILITIES,
  includeSuppressedFromQuery,
  normalizeQueryToken,
  parseBooleanQuery,
  parseNonNegativeIntQuery,
} from '../evidencePayloadConfig';
import { toStatusPayload } from '../evidencePayloadStatus';

test('evidencePayloadContext reexporta API de contexto esperada', () => {
  assert.equal(payloadContext.readEvidence, readEvidence);
  assert.equal(payloadContext.readEvidenceResult, readEvidenceResult);
  assert.equal(payloadContext.toStatusPayload, toStatusPayload);
  assert.equal(payloadContext.CONTEXT_API_CAPABILITIES, CONTEXT_API_CAPABILITIES);
  assert.equal(payloadContext.parseBooleanQuery, parseBooleanQuery);
  assert.equal(payloadContext.parseNonNegativeIntQuery, parseNonNegativeIntQuery);
  assert.equal(payloadContext.includeSuppressedFromQuery, includeSuppressedFromQuery);
  assert.equal(payloadContext.normalizeQueryToken, normalizeQueryToken);
});

test('evidencePayloadContext expone funciones ejecutables', () => {
  assert.equal(typeof payloadContext.readEvidence, 'function');
  assert.equal(typeof payloadContext.readEvidenceResult, 'function');
  assert.equal(typeof payloadContext.toStatusPayload, 'function');
  assert.equal(typeof payloadContext.parseBooleanQuery, 'function');
  assert.equal(typeof payloadContext.parseNonNegativeIntQuery, 'function');
  assert.equal(typeof payloadContext.includeSuppressedFromQuery, 'function');
  assert.equal(typeof payloadContext.normalizeQueryToken, 'function');
});
