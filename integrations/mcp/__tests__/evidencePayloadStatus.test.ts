import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import { CONTEXT_API_CAPABILITIES } from '../evidencePayloadConfig';
import { toStatusPayload } from '../evidencePayloadStatus';

const createEvidence = (): AiEvidenceV2_1 => ({
  version: '2.1',
  timestamp: '2026-02-19T09:00:00.000Z',
  snapshot: {
    stage: 'PRE_PUSH',
    outcome: 'FAIL',
    findings: [
      {
        ruleId: 'backend.avoid-explicit-any',
        severity: 'ERROR',
        code: 'B001',
        message: 'Avoid explicit any',
        file: 'apps/backend/src/domain/reservation.ts',
        lines: [10, 11],
      },
      {
        ruleId: 'frontend.no-console-log',
        severity: 'WARN',
        code: 'F001',
        message: 'console.log not allowed',
        file: 'apps/web/src/components/Banner.tsx',
      },
    ],
  },
  ledger: [
    {
      ruleId: 'backend.avoid-explicit-any',
      file: 'apps/backend/src/domain/reservation.ts',
      firstSeen: '2026-02-17T09:00:00.000Z',
      lastSeen: '2026-02-19T09:00:00.000Z',
    },
  ],
  platforms: {
    backend: { detected: true, confidence: 'HIGH' },
    frontend: { detected: true, confidence: 'MEDIUM' },
    ios: { detected: false, confidence: 'LOW' },
  },
  rulesets: [
    { platform: 'backend', bundle: 'backendRuleSet@1.0.0', hash: 'aaa111' },
    { platform: 'frontend', bundle: 'frontendRuleSet@1.0.0', hash: 'bbb222' },
  ],
  human_intent: null,
  ai_gate: {
    status: 'BLOCKED',
    violations: [],
    human_intent: null,
  },
  severity_metrics: {
    gate_status: 'BLOCKED',
    total_violations: 2,
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
        file: 'apps/backend/src/domain/reservation.ts',
        replacedByRuleId: 'backend.avoid-explicit-any',
        replacementRuleId: 'backend.avoid-explicit-any',
        platform: 'backend',
        reason: 'semantic-family-precedence',
      },
    ],
  },
});

test('toStatusPayload devuelve degraded cuando falta .ai_evidence.json', async () => {
  await withTempDir('pumuki-status-payload-missing-', async (repoRoot) => {
    const payload = toStatusPayload(repoRoot) as {
      status: string;
      context_api: unknown;
      evidence: {
        path: string;
        exists: boolean;
        present: boolean;
        valid: boolean;
        version: string | null;
        findings_count: number;
      };
    };

    assert.equal(payload.status, 'degraded');
    assert.deepEqual(payload.context_api, CONTEXT_API_CAPABILITIES);
    assert.equal(payload.evidence.path, resolve(repoRoot, '.ai_evidence.json'));
    assert.equal(payload.evidence.exists, false);
    assert.equal(payload.evidence.present, false);
    assert.equal(payload.evidence.valid, false);
    assert.equal(payload.evidence.version, null);
    assert.equal(payload.evidence.findings_count, 0);
  });
});

test('toStatusPayload devuelve degraded con evidencia inválida y version conocida', async () => {
  await withTempDir('pumuki-status-payload-invalid-known-', async (repoRoot) => {
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      JSON.stringify({ version: '2.0', snapshot: { findings: [] } }),
      'utf8'
    );

    const payload = toStatusPayload(repoRoot) as {
      status: string;
      evidence: {
        path: string;
        exists: boolean;
        present: boolean;
        valid: boolean;
        version: string | null;
        findings_count: number;
      };
    };

    assert.equal(payload.status, 'degraded');
    assert.equal(payload.evidence.path, resolve(repoRoot, '.ai_evidence.json'));
    assert.equal(payload.evidence.exists, true);
    assert.equal(payload.evidence.present, true);
    assert.equal(payload.evidence.valid, false);
    assert.equal(payload.evidence.version, '2.0');
    assert.equal(payload.evidence.findings_count, 0);
  });
});

test('toStatusPayload devuelve degraded con evidencia inválida y version desconocida', async () => {
  await withTempDir('pumuki-status-payload-invalid-unknown-', async (repoRoot) => {
    writeFileSync(join(repoRoot, '.ai_evidence.json'), '{invalid-json', 'utf8');

    const payload = toStatusPayload(repoRoot) as {
      status: string;
      evidence: {
        exists: boolean;
        present: boolean;
        valid: boolean;
        version: string | null;
        findings_count: number;
      };
    };

    assert.equal(payload.status, 'degraded');
    assert.equal(payload.evidence.exists, true);
    assert.equal(payload.evidence.present, true);
    assert.equal(payload.evidence.valid, false);
    assert.equal(payload.evidence.version, null);
    assert.equal(payload.evidence.findings_count, 0);
  });
});

test('toStatusPayload devuelve ok y métricas derivadas cuando la evidencia es válida', async () => {
  await withTempDir('pumuki-status-payload-valid-', async (repoRoot) => {
    writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(createEvidence()), 'utf8');

    const payload = toStatusPayload(repoRoot) as {
      status: string;
      context_api: unknown;
      evidence: {
        path: string;
        exists: boolean;
        present: boolean;
        valid: boolean;
        version: string;
        stage: string;
        outcome: string;
        findings_count: number;
        findings_with_lines_count: number;
        findings_without_lines_count: number;
        findings_files_count: number;
        findings_rules_count: number;
        highest_severity: string | null;
        blocking_findings_count: number;
        ledger_count: number;
        rulesets_count: number;
        rulesets_fingerprint: string;
        suppressed_findings_count: number;
        tracked_platforms_count: number;
        detected_platforms_count: number;
        non_detected_platforms_count: number;
        platforms: string[];
      };
    };

    assert.equal(payload.status, 'ok');
    assert.deepEqual(payload.context_api, CONTEXT_API_CAPABILITIES);
    assert.equal(payload.evidence.path, resolve(repoRoot, '.ai_evidence.json'));
    assert.equal(payload.evidence.exists, true);
    assert.equal(payload.evidence.present, true);
    assert.equal(payload.evidence.valid, true);
    assert.equal(payload.evidence.version, '2.1');
    assert.equal(payload.evidence.stage, 'PRE_PUSH');
    assert.equal(payload.evidence.outcome, 'FAIL');
    assert.equal(payload.evidence.findings_count, 2);
    assert.equal(payload.evidence.findings_with_lines_count, 1);
    assert.equal(payload.evidence.findings_without_lines_count, 1);
    assert.equal(payload.evidence.findings_files_count, 2);
    assert.equal(payload.evidence.findings_rules_count, 2);
    assert.equal(payload.evidence.highest_severity, 'ERROR');
    assert.equal(payload.evidence.blocking_findings_count, 1);
    assert.equal(payload.evidence.ledger_count, 1);
    assert.equal(payload.evidence.rulesets_count, 2);
    assert.equal(payload.evidence.rulesets_fingerprint, 'aaa111|bbb222');
    assert.equal(payload.evidence.suppressed_findings_count, 1);
    assert.equal(payload.evidence.tracked_platforms_count, 3);
    assert.equal(payload.evidence.detected_platforms_count, 2);
    assert.equal(payload.evidence.non_detected_platforms_count, 1);
    assert.deepEqual(payload.evidence.platforms, ['backend', 'frontend', 'ios']);
  });
});
