import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import { toFindingsPayload } from '../evidencePayloadCollectionsFindings';

const createEvidence = (): AiEvidenceV2_1 => ({
  version: '2.1',
  timestamp: '2026-02-18T12:00:00.000Z',
  snapshot: {
    stage: 'PRE_COMMIT',
    outcome: 'FAIL',
    findings: [
      {
        ruleId: 'rule-b',
        severity: 'WARN',
        code: 'B001',
        message: 'warn backend',
        file: 'apps/backend/src/b.ts',
      },
      {
        ruleId: 'rule-a',
        severity: 'ERROR',
        code: 'A001',
        message: 'error backend',
        file: 'apps/backend/src/a.ts',
        lines: [2],
      },
      {
        ruleId: 'rule-a',
        severity: 'WARN',
        code: 'A002',
        message: 'warn ios',
        file: 'apps/ios/App/Feature.swift',
      },
      {
        ruleId: 'rule-c',
        severity: 'INFO',
        code: 'C001',
        message: 'info frontend',
        file: 'apps/frontend/src/App.tsx',
      },
      {
        ruleId: 'rule-a',
        severity: 'ERROR',
        code: 'A003',
        message: 'error android',
        file: 'apps/android/app/src/main/Main.kt',
      },
    ],
  },
  ledger: [],
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
    total_violations: 5,
    by_severity: {
      CRITICAL: 0,
      ERROR: 2,
      WARN: 2,
      INFO: 1,
    },
  },
});

test('toFindingsPayload devuelve findings ordenados y filtros nulos por defecto', () => {
  const payload = toFindingsPayload(createEvidence(), new URL('https://example.test')) as {
    findings_count: number;
    total_count: number;
    filters: { severity: string | null; ruleId: string | null; platform: string | null };
    pagination: { requested_limit: number | null; limit: number | null; offset: number; has_more?: boolean };
    findings: Array<{ ruleId: string; file: string }>;
  };

  assert.equal(payload.total_count, 5);
  assert.equal(payload.findings_count, 5);
  assert.deepEqual(payload.filters, { severity: null, ruleId: null, platform: null });
  assert.deepEqual(payload.pagination, {
    requested_limit: null,
    max_limit: 100,
    limit: null,
    offset: 0,
  });
  assert.deepEqual(
    payload.findings.map((entry) => `${entry.ruleId}|${entry.file}`),
    [
      'rule-a|apps/android/app/src/main/Main.kt',
      'rule-a|apps/backend/src/a.ts',
      'rule-a|apps/ios/App/Feature.swift',
      'rule-b|apps/backend/src/b.ts',
      'rule-c|apps/frontend/src/App.tsx',
    ],
  );
});

test('toFindingsPayload aplica filtros por severity/ruleId/platform con normalización', () => {
  const payload = toFindingsPayload(
    createEvidence(),
    new URL('https://example.test?severity=ERROR&ruleId=RULE-A&platform=backend'),
  ) as {
    findings_count: number;
    total_count: number;
    filters: { severity: string | null; ruleId: string | null; platform: string | null };
    findings: Array<{ ruleId: string; severity: string; file: string }>;
  };

  assert.equal(payload.total_count, 1);
  assert.equal(payload.findings_count, 1);
  assert.deepEqual(payload.filters, {
    severity: 'error',
    ruleId: 'rule-a',
    platform: 'backend',
  });
  assert.deepEqual(payload.findings, [
    {
      ruleId: 'rule-a',
      severity: 'ERROR',
      code: 'A001',
      message: 'error backend',
      file: 'apps/backend/src/a.ts',
      lines: [2],
    },
  ]);
});

test('toFindingsPayload aplica offset/limit y expone has_more cuando limit fue pedido', () => {
  const payload = toFindingsPayload(
    createEvidence(),
    new URL('https://example.test?limit=1&offset=1'),
  ) as {
    findings_count: number;
    total_count: number;
    pagination: { requested_limit: number | null; limit: number | null; offset: number; has_more?: boolean };
    findings: Array<{ ruleId: string; file: string }>;
  };

  assert.equal(payload.total_count, 5);
  assert.equal(payload.findings_count, 1);
  assert.deepEqual(payload.pagination, {
    requested_limit: 1,
    max_limit: 100,
    limit: 1,
    offset: 1,
    has_more: true,
  });
  assert.deepEqual(payload.findings.map((entry) => `${entry.ruleId}|${entry.file}`), [
    'rule-a|apps/backend/src/a.ts',
  ]);
});

test('toFindingsPayload limita limit al máximo permitido', () => {
  const payload = toFindingsPayload(
    createEvidence(),
    new URL('https://example.test?limit=999'),
  ) as {
    findings_count: number;
    total_count: number;
    pagination: { requested_limit: number | null; limit: number | null; max_limit: number; has_more?: boolean };
  };

  assert.equal(payload.total_count, 5);
  assert.equal(payload.findings_count, 5);
  assert.deepEqual(payload.pagination, {
    requested_limit: 999,
    max_limit: 100,
    limit: 100,
    offset: 0,
    has_more: false,
  });
});
