import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import {
  includeSuppressedFromQuery,
  parseBooleanQuery,
  parseNonNegativeIntQuery,
  toPlatformsPayload,
  toResponsePayload,
  toRulesetsPayload,
  toStatusPayload,
  toSummaryPayload,
} from '../evidencePayloads';

const createEvidence = (): AiEvidenceV2_1 => {
  return {
    version: '2.1',
    timestamp: '2026-02-01T10:00:00.000Z',
    snapshot: {
      stage: 'CI',
      outcome: 'PASS',
      findings: [
        {
          ruleId: 'rule.error',
          severity: 'ERROR',
          code: 'E001',
          message: 'Error finding',
          file: 'apps/backend/src/z.ts',
          lines: [3],
        },
        {
          ruleId: 'rule.warn',
          severity: 'WARN',
          code: 'W001',
          message: 'Warn finding',
          file: 'apps/backend/src/a.ts',
        },
      ],
    },
    ledger: [
      {
        ruleId: 'rule.error',
        file: 'apps/backend/src/z.ts',
        firstSeen: '2026-01-01T00:00:00.000Z',
        lastSeen: '2026-02-01T00:00:00.000Z',
      },
      {
        ruleId: 'rule.warn',
        file: 'apps/ios/App.swift',
        firstSeen: '2026-01-02T00:00:00.000Z',
        lastSeen: '2026-02-02T00:00:00.000Z',
      },
    ],
    platforms: {
      backend: { detected: true, confidence: 'HIGH' },
      ios: { detected: false, confidence: 'LOW' },
    },
    rulesets: [
      { platform: 'ios', bundle: 'mobile', hash: '222' },
      { platform: 'backend', bundle: 'core', hash: '111' },
    ],
    human_intent: null,
    ai_gate: {
      status: 'ALLOWED',
      violations: [],
      human_intent: null,
    },
    severity_metrics: {
      gate_status: 'ALLOWED',
      total_violations: 0,
      by_severity: {
        CRITICAL: 0,
        ERROR: 1,
        WARN: 1,
        INFO: 0,
      },
    },
    consolidation: {
      suppressed: [
        {
          ruleId: 'heuristics.ts.explicit-any.ast',
          file: 'apps/backend/src/main.ts',
          replacedByRuleId: 'backend.avoid-explicit-any',
          platform: 'backend',
          reason: 'semantic-family-precedence',
        },
      ],
    },
  };
};

test('parseBooleanQuery normaliza valores truthy/falsy', () => {
  assert.equal(parseBooleanQuery('YES'), true);
  assert.equal(parseBooleanQuery('0'), false);
  assert.equal(parseBooleanQuery(' maybe '), undefined);
  assert.equal(parseBooleanQuery(null), undefined);
});

test('parseNonNegativeIntQuery acepta enteros no negativos y rechaza inválidos', () => {
  assert.equal(parseNonNegativeIntQuery('12'), 12);
  assert.equal(parseNonNegativeIntQuery(' 0007 '), 7);
  assert.equal(parseNonNegativeIntQuery('-1'), undefined);
  assert.equal(parseNonNegativeIntQuery('1.2'), undefined);
  assert.equal(parseNonNegativeIntQuery(null), undefined);
});

test('includeSuppressedFromQuery respeta alias view', () => {
  assert.equal(includeSuppressedFromQuery(new URL('https://example.test?view=compact')), false);
  assert.equal(includeSuppressedFromQuery(new URL('https://example.test?view=full')), true);
  assert.equal(includeSuppressedFromQuery(new URL('https://example.test?includeSuppressed=false')), false);
  assert.equal(includeSuppressedFromQuery(new URL('https://example.test')), true);
});

test('toResponsePayload permite excluir consolidation', () => {
  const evidence = createEvidence();
  const compact = toResponsePayload(evidence, new URL('https://example.test?includeSuppressed=false')) as {
    consolidation?: unknown;
  };
  const full = toResponsePayload(evidence, new URL('https://example.test?includeSuppressed=true')) as {
    consolidation?: unknown;
  };

  assert.equal('consolidation' in compact, false);
  assert.equal('consolidation' in full, true);
});

test('toRulesetsPayload filtra por platform y pagina determinísticamente', () => {
  const payload = toRulesetsPayload(
    createEvidence(),
    new URL('https://example.test?platform=backend&limit=1&offset=0'),
  ) as {
    total_count: number;
    rulesets: Array<{ platform: string; hash: string }>;
    filters: { platform: string | null };
    pagination: { limit: number | null; max_limit: number; has_more?: boolean };
  };

  assert.equal(payload.total_count, 1);
  assert.equal(payload.filters.platform, 'backend');
  assert.equal(payload.pagination.limit, 1);
  assert.equal(payload.pagination.max_limit, 100);
  assert.equal(payload.pagination.has_more, false);
  assert.deepEqual(payload.rulesets, [{ platform: 'backend', bundle: 'core', hash: '111' }]);
});

test('toPlatformsPayload aplica detectedOnly=true por defecto', () => {
  const payload = toPlatformsPayload(createEvidence(), new URL('https://example.test')) as {
    total_count: number;
    platforms: Array<{ platform: string; detected: boolean }>;
    filters: { detectedOnly: boolean };
  };

  assert.equal(payload.filters.detectedOnly, true);
  assert.equal(payload.total_count, 1);
  assert.deepEqual(payload.platforms, [{ platform: 'backend', detected: true, confidence: 'HIGH' }]);
});

test('toSummaryPayload expone métricas derivadas estables', () => {
  const payload = toSummaryPayload(createEvidence()) as {
    snapshot: { findings_count: number };
    rulesets_fingerprint: string;
    suppressed_findings_count: number;
    tracked_platforms_count: number;
    detected_platforms_count: number;
  };

  assert.equal(payload.snapshot.findings_count, 2);
  assert.equal(payload.rulesets_fingerprint, '111|222');
  assert.equal(payload.suppressed_findings_count, 1);
  assert.equal(payload.tracked_platforms_count, 2);
  assert.equal(payload.detected_platforms_count, 1);
});

test('toStatusPayload retorna degraded cuando no existe evidencia', async () => {
  await withTempDir('pumuki-evidence-payload-status-', async (repoRoot) => {
    const payload = toStatusPayload(repoRoot) as {
      status: string;
      evidence?: { present?: boolean; valid?: boolean; version?: string | null };
    };

    assert.equal(payload.status, 'degraded');
    assert.equal(payload.evidence?.present, false);
    assert.equal(payload.evidence?.valid, false);
    assert.equal(payload.evidence?.version, null);
  });
});

test('toStatusPayload retorna ok cuando la evidencia v2.1 es válida', async () => {
  await withTempDir('pumuki-evidence-payload-status-', async (repoRoot) => {
    writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(createEvidence()));

    const payload = toStatusPayload(repoRoot) as {
      status: string;
      evidence?: {
        present?: boolean;
        valid?: boolean;
        version?: string | null;
        findings_count?: number;
        suppressed_findings_count?: number;
      };
    };

    assert.equal(payload.status, 'ok');
    assert.equal(payload.evidence?.present, true);
    assert.equal(payload.evidence?.valid, true);
    assert.equal(payload.evidence?.version, '2.1');
    assert.equal(payload.evidence?.findings_count, 2);
    assert.equal(payload.evidence?.suppressed_findings_count, 1);
  });
});
