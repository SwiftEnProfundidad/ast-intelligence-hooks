import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import { toPlatformsPayload } from '../evidencePayloadCollectionsPlatforms';

const createEvidence = (): AiEvidenceV2_1 => ({
  version: '2.1',
  timestamp: '2026-02-18T14:00:00.000Z',
  snapshot: {
    stage: 'PRE_COMMIT',
    outcome: 'FAIL',
    findings: [],
  },
  ledger: [],
  platforms: {
    backend: { detected: true, confidence: 'HIGH' },
    ios: { detected: false, confidence: 'LOW' },
    frontend: { detected: true, confidence: 'MEDIUM' },
    android: { detected: true, confidence: 'HIGH' },
  },
  rulesets: [],
  human_intent: null,
  ai_gate: {
    status: 'BLOCKED',
    violations: [],
    human_intent: null,
  },
  severity_metrics: {
    gate_status: 'BLOCKED',
    total_violations: 0,
    by_severity: {
      CRITICAL: 0,
      ERROR: 0,
      WARN: 0,
      INFO: 0,
    },
  },
});

test('toPlatformsPayload usa detectedOnly=true por defecto y ordena por platform', () => {
  const payload = toPlatformsPayload(createEvidence(), new URL('https://example.test')) as {
    total_count: number;
    filters: { detectedOnly: boolean; confidence: string | null };
    pagination: { requested_limit: number | null; limit: number | null; offset: number; max_limit: number };
    platforms: Array<{ platform: string; detected: boolean; confidence: string }>;
  };

  assert.equal(payload.total_count, 3);
  assert.deepEqual(payload.filters, { detectedOnly: true, confidence: null });
  assert.deepEqual(payload.pagination, {
    requested_limit: null,
    max_limit: 100,
    limit: null,
    offset: 0,
  });
  assert.deepEqual(payload.platforms, [
    { platform: 'android', detected: true, confidence: 'HIGH' },
    { platform: 'backend', detected: true, confidence: 'HIGH' },
    { platform: 'frontend', detected: true, confidence: 'MEDIUM' },
  ]);
});

test('toPlatformsPayload aplica filtro confidence con normalización', () => {
  const payload = toPlatformsPayload(
    createEvidence(),
    new URL('https://example.test?confidence= HIGH &detectedOnly=false'),
  ) as {
    total_count: number;
    filters: { detectedOnly: boolean; confidence: string | null };
    platforms: Array<{ platform: string; confidence: string }>;
  };

  assert.equal(payload.total_count, 2);
  assert.deepEqual(payload.filters, { detectedOnly: false, confidence: 'high' });
  assert.deepEqual(payload.platforms, [
    { platform: 'android', detected: true, confidence: 'HIGH' },
    { platform: 'backend', detected: true, confidence: 'HIGH' },
  ]);
});

test('toPlatformsPayload aplica limit/offset y expone has_more cuando limit fue pedido', () => {
  const payload = toPlatformsPayload(
    createEvidence(),
    new URL('https://example.test?detectedOnly=false&limit=1&offset=1'),
  ) as {
    total_count: number;
    pagination: { requested_limit: number | null; limit: number | null; max_limit: number; offset: number; has_more?: boolean };
    platforms: Array<{ platform: string; detected: boolean; confidence: string }>;
  };

  assert.equal(payload.total_count, 4);
  assert.deepEqual(payload.pagination, {
    requested_limit: 1,
    max_limit: 100,
    limit: 1,
    offset: 1,
    has_more: true,
  });
  assert.deepEqual(payload.platforms, [
    { platform: 'backend', detected: true, confidence: 'HIGH' },
  ]);
});
