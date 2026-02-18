import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import {
  toResponsePayload,
  toSnapshotPayload,
} from '../evidencePayloadCollections';

const createEvidence = (): AiEvidenceV2_1 => ({
  version: '2.1',
  timestamp: '2026-02-18T18:00:00.000Z',
  snapshot: {
    stage: 'PRE_COMMIT',
    outcome: 'FAIL',
    findings: [
      {
        ruleId: 'rule-b',
        severity: 'WARN',
        code: 'B001',
        message: 'warn',
        file: 'apps/backend/src/z.ts',
      },
      {
        ruleId: 'rule-a',
        severity: 'ERROR',
        code: 'A001',
        message: 'error',
        file: 'apps/backend/src/a.ts',
        lines: [3],
      },
      {
        ruleId: 'rule-a',
        severity: 'ERROR',
        code: 'A000',
        message: 'error-priority',
        file: 'apps/backend/src/a.ts',
        lines: [1],
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
    total_violations: 0,
    by_severity: {
      CRITICAL: 0,
      ERROR: 0,
      WARN: 0,
      INFO: 0,
    },
  },
  consolidation: {
    suppressed: [
      {
        ruleId: 'heuristics.ts.explicit-any.ast',
        file: 'apps/backend/src/a.ts',
        replacedByRuleId: 'backend.avoid-explicit-any',
        replacementRuleId: 'backend.avoid-explicit-any',
        platform: 'backend',
        reason: 'semantic-family-precedence',
      },
    ],
  },
});

test('toSnapshotPayload conserva metadatos y ordena findings', () => {
  const payload = toSnapshotPayload(createEvidence()) as {
    version: string;
    timestamp: string;
    snapshot: {
      stage: string;
      outcome: string;
      findings_count: number;
      findings: Array<{ ruleId: string; code: string; file: string; lines?: readonly number[] }>;
    };
  };

  assert.equal(payload.version, '2.1');
  assert.equal(payload.timestamp, '2026-02-18T18:00:00.000Z');
  assert.equal(payload.snapshot.stage, 'PRE_COMMIT');
  assert.equal(payload.snapshot.outcome, 'FAIL');
  assert.equal(payload.snapshot.findings_count, 3);
  assert.deepEqual(
    payload.snapshot.findings.map((entry) => `${entry.ruleId}|${entry.file}|${String(entry.lines)}|${entry.code}`),
    [
      'rule-a|apps/backend/src/a.ts|1|A000',
      'rule-a|apps/backend/src/a.ts|3|A001',
      'rule-b|apps/backend/src/z.ts|undefined|B001',
    ],
  );
});

test('toResponsePayload respeta includeSuppressed/view para compact/full', () => {
  const evidence = createEvidence();

  const compact = toResponsePayload(
    evidence,
    new URL('https://example.test?includeSuppressed=false'),
  ) as { consolidation?: unknown };
  assert.equal('consolidation' in compact, false);

  const compactAlias = toResponsePayload(
    evidence,
    new URL('https://example.test?view=compact'),
  ) as { consolidation?: unknown };
  assert.equal('consolidation' in compactAlias, false);

  const full = toResponsePayload(
    evidence,
    new URL('https://example.test?includeSuppressed=true'),
  ) as { consolidation?: unknown };
  assert.equal('consolidation' in full, true);

  const defaultPayload = toResponsePayload(
    evidence,
    new URL('https://example.test'),
  ) as { consolidation?: unknown };
  assert.equal('consolidation' in defaultPayload, true);
});
