import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import {
  toSuppressedReplacementRuleIdsCount,
  toSuppressedRulesCount,
  toSuppressedShareDirection,
  toSuppressedShareTriageAction,
  toSuppressedWithReplacementCount,
} from '../evidenceFacets';
import { toSuppressedSummaryFields } from '../evidencePayloadSummarySuppressed';

const createEvidence = (): AiEvidenceV2_1 => ({
  version: '2.1',
  timestamp: '2026-02-18T17:00:00.000Z',
  snapshot: {
    stage: 'PRE_COMMIT',
    outcome: 'FAIL',
    findings: [
      {
        ruleId: 'rule.warn',
        severity: 'WARN',
        code: 'W001',
        message: 'warn',
        file: 'apps/backend/src/warn.ts',
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
        ruleId: 'rule-a',
        file: 'apps/backend/src/a.ts',
        replacedByRuleId: 'backend.replacement.a',
        replacementRuleId: 'backend.replacement.a',
        platform: 'backend',
        reason: 'semantic-family-precedence',
      },
      {
        ruleId: 'rule-b',
        file: 'apps/ios/App/Feature.swift',
        replacedByRuleId: '',
        replacementRuleId: null,
        platform: 'ios',
        reason: 'manual-suppression',
      },
      {
        ruleId: 'rule-c',
        file: 'apps/frontend/src/App.tsx',
        replacedByRuleId: 'frontend.replacement.c',
        replacementRuleId: 'frontend.replacement.c',
        platform: 'frontend',
        reason: 'semantic-family-precedence',
      },
    ],
  },
});

test('toSuppressedSummaryFields mapea métricas clave con valores de facetas', () => {
  const evidence = createEvidence();
  const payload = toSuppressedSummaryFields(evidence) as Record<string, unknown>;

  assert.equal(payload.suppressed_rules_count, toSuppressedRulesCount(evidence));
  assert.equal(
    payload.suppressed_with_replacement_count,
    toSuppressedWithReplacementCount(evidence),
  );
  assert.equal(
    payload.suppressed_replacement_rule_ids_count,
    toSuppressedReplacementRuleIdsCount(evidence),
  );
  assert.equal(payload.suppressed_share_direction, toSuppressedShareDirection(evidence));
  assert.equal(
    payload.suppressed_share_triage_action,
    toSuppressedShareTriageAction(evidence),
  );
});

test('toSuppressedSummaryFields expone contrato amplio de campos suppressed_*', () => {
  const payload = toSuppressedSummaryFields(createEvidence()) as Record<string, unknown>;
  const keys = Object.keys(payload);

  assert.ok(keys.length > 100);
  assert.ok(keys.includes('suppressed_share_triage_stream_signal_family_trace_hash_weight'));
  assert.ok(keys.includes('suppressed_reason_rule_file_platform_replacement_split_count'));
  assert.ok(keys.includes('suppressed_non_replacement_rule_file_platform_distinct_count'));
});
