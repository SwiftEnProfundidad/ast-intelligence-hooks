import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import {
  toLedgerPayload,
  toLedgerPayloadWithFilters,
} from '../evidencePayloadCollectionsLedger';

const createEvidence = (): AiEvidenceV2_1 => ({
  version: '2.1',
  timestamp: '2026-02-18T13:00:00.000Z',
  snapshot: {
    stage: 'PRE_PUSH',
    outcome: 'FAIL',
    findings: [],
  },
  ledger: [
    {
      ruleId: 'rule-b',
      file: 'apps/backend/src/b.ts',
      firstSeen: '2026-01-03T00:00:00.000Z',
      lastSeen: '2026-01-10T00:00:00.000Z',
      lines: [3],
    },
    {
      ruleId: 'rule-a',
      file: 'apps/backend/src/a.ts',
      firstSeen: '2026-01-01T00:00:00.000Z',
      lastSeen: '2026-01-08T00:00:00.000Z',
      lines: [1],
    },
    {
      ruleId: 'rule-a',
      file: 'apps/backend/src/a.ts',
      firstSeen: '2026-01-01T00:00:00.000Z',
      lastSeen: '2026-01-09T00:00:00.000Z',
      lines: [1],
    },
    {
      ruleId: 'rule-c',
      file: 'apps/ios/App/Feature.swift',
      firstSeen: '2026-01-02T00:00:00.000Z',
      lastSeen: '2026-01-11T00:00:00.000Z',
    },
  ],
  platforms: {},
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

test('toLedgerPayload devuelve orden estable y filtros/paginación por defecto', () => {
  const payload = toLedgerPayload(createEvidence()) as {
    total_count: number;
    filters: { lastSeenAfter: string | null; lastSeenBefore: string | null };
    pagination: { requested_limit: number | null; limit: number | null; offset: number; max_limit: number };
    ledger: Array<{ ruleId: string; file: string; lastSeen: string }>;
  };

  assert.equal(payload.total_count, 4);
  assert.deepEqual(payload.filters, { lastSeenAfter: null, lastSeenBefore: null });
  assert.deepEqual(payload.pagination, {
    requested_limit: null,
    max_limit: 100,
    limit: null,
    offset: 0,
  });
  assert.deepEqual(
    payload.ledger.map((entry) => `${entry.ruleId}|${entry.file}|${entry.lastSeen}`),
    [
      'rule-a|apps/backend/src/a.ts|2026-01-08T00:00:00.000Z',
      'rule-a|apps/backend/src/a.ts|2026-01-09T00:00:00.000Z',
      'rule-b|apps/backend/src/b.ts|2026-01-10T00:00:00.000Z',
      'rule-c|apps/ios/App/Feature.swift|2026-01-11T00:00:00.000Z',
    ],
  );
});

test('toLedgerPayloadWithFilters aplica rango lastSeen y normaliza tokens', () => {
  const payload = toLedgerPayloadWithFilters(
    createEvidence(),
    new URL('https://example.test?lastSeenAfter=2026-01-09T00:00:00.000Z&lastSeenBefore=2026-01-10T00:00:00.000Z'),
  ) as {
    total_count: number;
    filters: { lastSeenAfter: string | null; lastSeenBefore: string | null };
    ledger: Array<{ ruleId: string; file: string; lastSeen: string }>;
  };

  assert.equal(payload.total_count, 2);
  assert.deepEqual(payload.filters, {
    lastSeenAfter: '2026-01-09t00:00:00.000z',
    lastSeenBefore: '2026-01-10t00:00:00.000z',
  });
  assert.deepEqual(
    payload.ledger.map((entry) => `${entry.ruleId}|${entry.file}|${entry.lastSeen}`),
    [
      'rule-a|apps/backend/src/a.ts|2026-01-09T00:00:00.000Z',
      'rule-b|apps/backend/src/b.ts|2026-01-10T00:00:00.000Z',
    ],
  );
});

test('toLedgerPayloadWithFilters aplica offset/limit y has_more', () => {
  const payload = toLedgerPayloadWithFilters(
    createEvidence(),
    new URL('https://example.test?limit=1&offset=1'),
  ) as {
    total_count: number;
    pagination: { requested_limit: number | null; limit: number | null; max_limit: number; offset: number; has_more?: boolean };
    ledger: Array<{ ruleId: string; file: string; lastSeen: string }>;
  };

  assert.equal(payload.total_count, 4);
  assert.deepEqual(payload.pagination, {
    requested_limit: 1,
    max_limit: 100,
    limit: 1,
    offset: 1,
    has_more: true,
  });
  assert.deepEqual(payload.ledger.map((entry) => `${entry.ruleId}|${entry.file}|${entry.lastSeen}`), [
    'rule-a|apps/backend/src/a.ts|2026-01-09T00:00:00.000Z',
  ]);
});
