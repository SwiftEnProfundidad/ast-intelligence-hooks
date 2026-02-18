import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import { toSuppressedSummaryFields } from '../evidencePayloadSummarySuppressed';
import { toSummaryPayload } from '../evidencePayloadSummary';

const sampleEvidence: AiEvidenceV2_1 = {
  version: '2.1',
  timestamp: '2026-02-18T12:00:00.000Z',
  snapshot: {
    stage: 'PRE_COMMIT',
    outcome: 'BLOCK',
    findings: [
      {
        ruleId: 'backend.avoid-explicit-any',
        severity: 'WARN',
        code: 'AVOID_ANY',
        message: 'Avoid explicit any.',
        file: 'apps/backend/src/userService.ts',
        lines: [10],
      },
      {
        ruleId: 'frontend.no-console-log',
        severity: 'ERROR',
        code: 'NO_CONSOLE_LOG',
        message: 'console.log is not allowed.',
        file: 'apps/frontend/src/components/Banner.tsx',
      },
      {
        ruleId: 'ios.no-force-unwrap',
        severity: 'ERROR',
        code: 'NO_FORCE_UNWRAP',
        message: 'Force unwrap is not allowed.',
        file: 'apps/ios/App/Feature.swift',
        lines: [],
      },
    ],
  },
  ledger: [
    {
      ruleId: 'backend.avoid-explicit-any',
      file: 'apps/backend/src/userService.ts',
      lines: [10],
      firstSeen: '2026-02-17T00:00:00.000Z',
      lastSeen: '2026-02-18T00:00:00.000Z',
    },
    {
      ruleId: 'frontend.no-console-log',
      file: 'apps/frontend/src/components/Banner.tsx',
      firstSeen: '2026-02-17T00:00:00.000Z',
      lastSeen: '2026-02-18T00:00:00.000Z',
    },
  ],
  platforms: {
    ios: { detected: true, confidence: 'MEDIUM' },
    backend: { detected: true, confidence: 'HIGH' },
    android: { detected: false, confidence: 'LOW' },
  },
  rulesets: [
    { platform: 'ios', bundle: 'iosEnterpriseRuleSet@1.0.0', hash: 'h-ios' },
    { platform: 'backend', bundle: 'backendRuleSet@1.0.0', hash: 'h-backend' },
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
    by_severity: { WARN: 1, ERROR: 1, CRITICAL: 0 },
  },
  consolidation: {
    suppressed: [
      {
        ruleId: 'legacy.backend.explicit-any',
        file: 'apps/backend/src/userService.ts',
        replacedByRuleId: 'backend.avoid-explicit-any',
        replacementRuleId: 'backend.avoid-explicit-any',
        platform: 'backend',
        reason: 'replaced-by-project-rule',
      },
    ],
  },
};

test('toSummaryPayload builds deterministic summary counters and detected platforms', () => {
  const summary = toSummaryPayload(sampleEvidence);

  assert.equal(summary.version, sampleEvidence.version);
  assert.equal(summary.timestamp, sampleEvidence.timestamp);
  assert.equal(summary.snapshot.stage, 'PRE_COMMIT');
  assert.equal(summary.snapshot.outcome, 'BLOCK');
  assert.equal(summary.snapshot.findings_count, 3);
  assert.equal(summary.snapshot.findings_with_lines_count, 1);
  assert.equal(summary.snapshot.findings_without_lines_count, 2);
  assert.equal(summary.ledger_count, 2);
  assert.equal(summary.rulesets_count, 2);
  assert.equal(summary.suppressed_findings_count, 1);

  assert.equal(summary.tracked_platforms_count, 3);
  assert.equal(summary.detected_platforms_count, 2);
  assert.equal(summary.non_detected_platforms_count, 1);
  assert.deepEqual(
    summary.platforms.map((entry) => `${entry.platform}:${entry.confidence}`),
    ['backend:HIGH', 'ios:MEDIUM']
  );
});

test('toSummaryPayload includes all suppressed summary fields as a spread payload', () => {
  const summary = toSummaryPayload(sampleEvidence) as Record<string, unknown>;
  const suppressedFields = toSuppressedSummaryFields(sampleEvidence);

  for (const [field, value] of Object.entries(suppressedFields)) {
    assert.ok(field in summary);
    assert.deepEqual(summary[field], value);
  }
});
