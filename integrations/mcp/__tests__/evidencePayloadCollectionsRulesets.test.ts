import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import { toRulesetsPayload } from '../evidencePayloadCollectionsRulesets';

const createEvidence = (): AiEvidenceV2_1 => ({
  version: '2.1',
  timestamp: '2026-02-18T15:00:00.000Z',
  snapshot: {
    stage: 'PRE_COMMIT',
    outcome: 'FAIL',
    findings: [],
  },
  ledger: [],
  platforms: {},
  rulesets: [
    { platform: 'ios', bundle: 'mobile', hash: 'h-3' },
    { platform: 'backend', bundle: 'core', hash: 'h-2' },
    { platform: 'backend', bundle: 'core', hash: 'h-1' },
    { platform: 'android', bundle: 'mobile', hash: 'h-4' },
  ],
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

test('toRulesetsPayload ordena determinísticamente y expone filtros nulos por defecto', () => {
  const payload = toRulesetsPayload(createEvidence(), new URL('https://example.test')) as {
    total_count: number;
    filters: { platform: string | null; bundle: string | null };
    pagination: { requested_limit: number | null; limit: number | null; offset: number; max_limit: number };
    rulesets: Array<{ platform: string; bundle: string; hash: string }>;
  };

  assert.equal(payload.total_count, 4);
  assert.deepEqual(payload.filters, { platform: null, bundle: null });
  assert.deepEqual(payload.pagination, {
    requested_limit: null,
    max_limit: 100,
    limit: null,
    offset: 0,
  });
  assert.deepEqual(payload.rulesets, [
    { platform: 'android', bundle: 'mobile', hash: 'h-4' },
    { platform: 'backend', bundle: 'core', hash: 'h-1' },
    { platform: 'backend', bundle: 'core', hash: 'h-2' },
    { platform: 'ios', bundle: 'mobile', hash: 'h-3' },
  ]);
});

test('toRulesetsPayload aplica filtros por platform y bundle con normalización', () => {
  const payload = toRulesetsPayload(
    createEvidence(),
    new URL('https://example.test?platform=BACKEND&bundle= CORE '),
  ) as {
    total_count: number;
    filters: { platform: string | null; bundle: string | null };
    rulesets: Array<{ platform: string; bundle: string; hash: string }>;
  };

  assert.equal(payload.total_count, 2);
  assert.deepEqual(payload.filters, {
    platform: 'backend',
    bundle: 'core',
  });
  assert.deepEqual(payload.rulesets, [
    { platform: 'backend', bundle: 'core', hash: 'h-1' },
    { platform: 'backend', bundle: 'core', hash: 'h-2' },
  ]);
});

test('toRulesetsPayload aplica limit/offset y has_more cuando limit fue pedido', () => {
  const payload = toRulesetsPayload(
    createEvidence(),
    new URL('https://example.test?limit=1&offset=2'),
  ) as {
    total_count: number;
    pagination: { requested_limit: number | null; limit: number | null; max_limit: number; offset: number; has_more?: boolean };
    rulesets: Array<{ platform: string; bundle: string; hash: string }>;
  };

  assert.equal(payload.total_count, 4);
  assert.deepEqual(payload.pagination, {
    requested_limit: 1,
    max_limit: 100,
    limit: 1,
    offset: 2,
    has_more: true,
  });
  assert.deepEqual(payload.rulesets, [
    { platform: 'backend', bundle: 'core', hash: 'h-2' },
  ]);
});

test('toRulesetsPayload limita limit al máximo configurado', () => {
  const payload = toRulesetsPayload(
    createEvidence(),
    new URL('https://example.test?limit=999'),
  ) as {
    total_count: number;
    pagination: { requested_limit: number | null; limit: number | null; max_limit: number; has_more?: boolean };
    rulesets: Array<{ platform: string; bundle: string; hash: string }>;
  };

  assert.equal(payload.total_count, 4);
  assert.equal(payload.rulesets.length, 4);
  assert.deepEqual(payload.pagination, {
    requested_limit: 999,
    max_limit: 100,
    limit: 100,
    offset: 0,
    has_more: false,
  });
});
