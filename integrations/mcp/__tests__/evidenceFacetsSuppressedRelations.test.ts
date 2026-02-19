import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import {
  toSuppressedNonReplacementReasonFilePairsCount,
  toSuppressedNonReplacementReasonsCount,
  toSuppressedNonReplacementRuleFilePairsCount,
  toSuppressedNonReplacementRuleFilePairsRatioPct,
  toSuppressedNonReplacementRulePlatformPairsCount,
  toSuppressedNonReplacementRulePlatformPairsRatioPct,
  toSuppressedNonReplacementPlatformsCount,
  toSuppressedPlatformRulePairsCount,
  toSuppressedReasonsWithReplacementCount,
  toSuppressedReasonsWithReplacementRatioPct,
  toSuppressedReasonsWithoutReplacementCount,
  toSuppressedReasonsWithoutReplacementRatioPct,
  toSuppressedReplacementPlatformsCount,
  toSuppressedReplacementReasonFilePairsCount,
  toSuppressedReplacementRuleFilePairsCount,
  toSuppressedReplacementRuleFilePairsRatioPct,
  toSuppressedReplacementRuleIdsCount,
  toSuppressedReplacementRulePlatformPairsCount,
  toSuppressedReplacementRulePlatformPairsRatioPct,
  toSuppressedReplacementRuleReasonPairsCount,
  toSuppressedReplacementReasonsCount,
  toSuppressedRuleFilePairsCount,
  toSuppressedWithoutReplacementPlatformsCount,
} from '../evidenceFacetsSuppressedRelations';

const createEvidence = (): AiEvidenceV2_1 => ({
  version: '2.1',
  timestamp: '2026-02-18T16:00:00.000Z',
  snapshot: {
    stage: 'PRE_COMMIT',
    outcome: 'FAIL',
    findings: [],
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
        replacedByRuleId: 'rep-1',
        replacementRuleId: 'rep-1',
        platform: 'backend',
        reason: 'r-1',
      },
      {
        ruleId: 'rule-a',
        file: 'apps/backend/src/a.ts',
        replacedByRuleId: 'rep-1',
        replacementRuleId: 'rep-1',
        platform: 'backend',
        reason: 'r-1',
      },
      {
        ruleId: 'rule-b',
        file: 'apps/ios/App/Feature.swift',
        replacedByRuleId: '',
        replacementRuleId: null,
        platform: 'ios',
        reason: 'r-2',
      },
      {
        ruleId: 'rule-c',
        file: 'apps/ios/App/Dashboard.swift',
        replacedByRuleId: 'rep-2',
        replacementRuleId: 'rep-2',
        platform: 'ios',
        reason: 'r-1',
      },
      {
        ruleId: 'rule-d',
        file: 'apps/android/app/src/main/Main.kt',
        replacedByRuleId: '',
        replacementRuleId: null,
        platform: 'android',
        reason: 'r-3',
      },
    ],
  },
});

const createEmptyEvidence = (): AiEvidenceV2_1 => ({
  ...createEvidence(),
  consolidation: { suppressed: [] },
});

test('suppressed relations calcula pares base y ratios de replacement', () => {
  const evidence = createEvidence();

  assert.equal(toSuppressedRuleFilePairsCount(evidence), 4);
  assert.equal(toSuppressedPlatformRulePairsCount(evidence), 4);
  assert.equal(toSuppressedReasonsWithReplacementCount(evidence), 1);
  assert.equal(toSuppressedReasonsWithReplacementRatioPct(evidence), 33);
  assert.equal(toSuppressedReasonsWithoutReplacementCount(evidence), 2);
  assert.equal(toSuppressedReasonsWithoutReplacementRatioPct(evidence), 67);
  assert.equal(toSuppressedReplacementRuleFilePairsCount(evidence), 2);
  assert.equal(toSuppressedReplacementRuleFilePairsRatioPct(evidence), 50);
  assert.equal(toSuppressedReplacementRulePlatformPairsCount(evidence), 2);
  assert.equal(toSuppressedReplacementRulePlatformPairsRatioPct(evidence), 50);
  assert.equal(toSuppressedReplacementPlatformsCount(evidence), 2);
});

test('suppressed relations calcula pares y ratios de non-replacement', () => {
  const evidence = createEvidence();

  assert.equal(toSuppressedNonReplacementPlatformsCount(evidence), 2);
  assert.equal(toSuppressedWithoutReplacementPlatformsCount(evidence), 2);
  assert.equal(toSuppressedNonReplacementReasonFilePairsCount(evidence), 2);
  assert.equal(toSuppressedNonReplacementRuleFilePairsCount(evidence), 2);
  assert.equal(toSuppressedNonReplacementRuleFilePairsRatioPct(evidence), 50);
  assert.equal(toSuppressedNonReplacementRulePlatformPairsCount(evidence), 2);
  assert.equal(toSuppressedNonReplacementRulePlatformPairsRatioPct(evidence), 50);
  assert.equal(toSuppressedNonReplacementReasonsCount(evidence), 2);
});

test('suppressed relations calcula métricas de replacement por reason/rule', () => {
  const evidence = createEvidence();

  assert.equal(toSuppressedReplacementReasonFilePairsCount(evidence), 2);
  assert.equal(toSuppressedReplacementRuleReasonPairsCount(evidence), 2);
  assert.equal(toSuppressedReplacementRuleIdsCount(evidence), 2);
  assert.equal(toSuppressedReplacementReasonsCount(evidence), 1);
});

test('suppressed relations devuelve 0 en ratios cuando no hay suppressed', () => {
  const empty = createEmptyEvidence();

  assert.equal(toSuppressedReasonsWithReplacementRatioPct(empty), 0);
  assert.equal(toSuppressedReasonsWithoutReplacementRatioPct(empty), 0);
  assert.equal(toSuppressedReplacementRuleFilePairsRatioPct(empty), 0);
  assert.equal(toSuppressedReplacementRulePlatformPairsRatioPct(empty), 0);
  assert.equal(toSuppressedNonReplacementRuleFilePairsRatioPct(empty), 0);
  assert.equal(toSuppressedNonReplacementRulePlatformPairsRatioPct(empty), 0);
});
