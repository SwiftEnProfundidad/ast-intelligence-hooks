import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1, ConsolidationSuppressedFinding } from '../../evidence/schema';
import {
  toSuppressedFilesCount,
  toSuppressedFindingCoverageRatioPct,
  toSuppressedNonReplacementFilesRatioPct,
  toSuppressedNonReplacementRulesRatioPct,
  toSuppressedPlatformsCount,
  toSuppressedReasonsCount,
  toSuppressedReplacementRulesRatioPct,
  toSuppressedRulesCount,
  toSuppressedShareDirection,
  toSuppressedShareDirectionCode,
  toSuppressedShareDirectionConfidence,
  toSuppressedShareDirectionPriorityScore,
  toSuppressedShareDirectionStrengthBucket,
  toSuppressedShareTriageAction,
  toSuppressedShareTriageLane,
  toSuppressedShareTriagePriorityBand,
  toSuppressedShareTriageRoute,
  toSuppressedShareTriageStreamClass,
  toSuppressedShareTriageStreamSignalCode,
  toSuppressedWithReplacementCount,
  toSuppressedWithReplacementFilesRatioPct,
  toSuppressedWithReplacementPlatformsRatioPct,
  toSuppressedWithReplacementRatioPct,
  toSuppressedWithoutReplacementCount,
  toSuppressedWithoutReplacementPlatformsRatioPct,
  toSuppressedWithoutReplacementRatioPct,
} from '../evidenceFacets';

const toEvidence = (suppressed: ConsolidationSuppressedFinding[]): AiEvidenceV2_1 => {
  return {
    version: '2.1',
    timestamp: '2026-02-15T12:00:00.000Z',
    snapshot: {
      stage: 'CI',
      outcome: 'PASS',
      findings: [
        {
          ruleId: 'rule.warn',
          severity: 'WARN',
          code: 'W001',
          message: 'warn',
          file: 'apps/backend/src/warn.ts',
        },
        {
          ruleId: 'rule.error',
          severity: 'ERROR',
          code: 'E001',
          message: 'error',
          file: 'apps/frontend/src/error.tsx',
        },
      ],
    },
    ledger: [],
    platforms: {
      backend: { detected: true, confidence: 'HIGH' },
      frontend: { detected: true, confidence: 'HIGH' },
      ios: { detected: true, confidence: 'HIGH' },
      android: { detected: true, confidence: 'HIGH' },
    },
    rulesets: [
      { platform: 'backend', bundle: 'core', hash: '111' },
      { platform: 'frontend', bundle: 'web', hash: '222' },
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
      suppressed,
    },
  };
};

test('facetas suprimidas críticas mantienen conteos y ratios deterministas', () => {
  const evidence = toEvidence([
    {
      ruleId: 'rule.alpha',
      file: 'apps/backend/src/a.ts',
      replacedByRuleId: 'backend.no-alpha',
      replacementRuleId: 'backend.no-alpha',
      platform: 'backend',
      reason: 'semantic-family-precedence',
    },
    {
      ruleId: 'rule.beta',
      file: 'apps/ios/App.swift',
      replacedByRuleId: '',
      replacementRuleId: null,
      platform: 'ios',
      reason: 'manual-suppression',
    },
    {
      ruleId: 'rule.gamma',
      file: 'apps/frontend/src/App.tsx',
      replacedByRuleId: 'frontend.no-gamma',
      replacementRuleId: 'frontend.no-gamma',
      platform: 'frontend',
      reason: 'semantic-family-precedence',
    },
    {
      ruleId: 'rule.delta',
      file: 'apps/android/app/src/main/kotlin/App.kt',
      replacedByRuleId: '',
      replacementRuleId: null,
      platform: 'android',
      reason: 'dedupe',
    },
  ]);

  assert.equal(toSuppressedRulesCount(evidence), 4);
  assert.equal(toSuppressedFilesCount(evidence), 4);
  assert.equal(toSuppressedPlatformsCount(evidence), 4);
  assert.equal(toSuppressedReasonsCount(evidence), 3);
  assert.equal(toSuppressedWithReplacementCount(evidence), 2);
  assert.equal(toSuppressedWithoutReplacementCount(evidence), 2);
  assert.equal(toSuppressedWithReplacementRatioPct(evidence), 50);
  assert.equal(toSuppressedWithoutReplacementRatioPct(evidence), 50);
  assert.equal(toSuppressedWithReplacementFilesRatioPct(evidence), 50);
  assert.equal(toSuppressedNonReplacementFilesRatioPct(evidence), 50);
  assert.equal(toSuppressedWithReplacementPlatformsRatioPct(evidence), 50);
  assert.equal(toSuppressedWithoutReplacementPlatformsRatioPct(evidence), 50);
  assert.equal(toSuppressedReplacementRulesRatioPct(evidence), 75);
  assert.equal(toSuppressedNonReplacementRulesRatioPct(evidence), 50);
  assert.equal(toSuppressedFindingCoverageRatioPct(evidence), 67);
});

test('facetas share/triage conservan semántica tras split de módulos', () => {
  const evidence = toEvidence([
    {
      ruleId: 'rule.one',
      file: 'apps/backend/src/one.ts',
      replacedByRuleId: 'backend.one.replacement',
      replacementRuleId: 'backend.one.replacement',
      platform: 'backend',
      reason: 'semantic-family-precedence',
    },
    {
      ruleId: 'rule.two',
      file: 'apps/frontend/src/two.tsx',
      replacedByRuleId: 'frontend.two.replacement',
      replacementRuleId: 'frontend.two.replacement',
      platform: 'frontend',
      reason: 'semantic-family-precedence',
    },
    {
      ruleId: 'rule.three',
      file: 'apps/ios/App.swift',
      replacedByRuleId: 'ios.three.replacement',
      replacementRuleId: 'ios.three.replacement',
      platform: 'ios',
      reason: 'semantic-family-precedence',
    },
    {
      ruleId: 'rule.four',
      file: 'apps/android/app/src/main/kotlin/Four.kt',
      replacedByRuleId: '',
      replacementRuleId: null,
      platform: 'android',
      reason: 'manual-suppression',
    },
  ]);

  assert.equal(toSuppressedShareDirection(evidence), 'replacement');
  assert.equal(toSuppressedShareDirectionCode(evidence), 'R');
  assert.equal(toSuppressedShareDirectionConfidence(evidence), 50);
  assert.equal(toSuppressedShareDirectionStrengthBucket(evidence), 'MEDIUM');
  assert.equal(toSuppressedShareDirectionPriorityScore(evidence), 50);
  assert.equal(toSuppressedShareTriageAction(evidence), 'review_replacement_then_non_replacement');
  assert.equal(toSuppressedShareTriagePriorityBand(evidence), 'MEDIUM');
  assert.equal(toSuppressedShareTriageLane(evidence), 'replacement_standard_lane');
  assert.equal(
    toSuppressedShareTriageRoute(evidence),
    'replacement_standard_lane:replacement_rules>non_replacement_paths',
  );
  assert.equal(toSuppressedShareTriageStreamClass(evidence), 'standard');
  assert.equal(toSuppressedShareTriageStreamSignalCode(evidence), 'STD-M');
});
