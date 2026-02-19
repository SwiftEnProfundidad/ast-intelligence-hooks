import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import {
  toSuppressedNonReplacementRuleFilePlatformDistinctCount,
  toSuppressedNonReplacementRuleFilePlatformDominancePct,
  toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct,
  toSuppressedReplacementMinusNonReplacementShareSignedPct,
  toSuppressedReplacementRuleFilePlatformDistinctCount,
  toSuppressedReplacementRuleFilePlatformDominancePct,
  toSuppressedReplacementRuleFilePlatformShareOfTotalPct,
  toSuppressedReplacementVsNonReplacementShareGapPct,
  toSuppressedRuleFilePlatformDistinctTotalCount,
  toSuppressedShareBalanceScorePct,
  toSuppressedShareDirection,
  toSuppressedShareDirectionCode,
  toSuppressedShareDirectionConfidence,
  toSuppressedShareDirectionIsBalanced,
  toSuppressedShareDirectionLabel,
  toSuppressedShareDirectionStrengthBucket,
  toSuppressedShareDirectionStrengthRank,
  toSuppressedShareDirectionTriageHint,
  toSuppressedShareImbalanceIndexPct,
  toSuppressedShareNetPolarityPct,
  toSuppressedSharePolarizationBalanceGapPct,
  toSuppressedSharePolarizationIndexPct,
} from '../evidenceFacetsSuppressedShareCore';

const baseEvidence = (
  mode: 'replacement-dominant' | 'non-replacement-dominant' | 'balanced'
): AiEvidenceV2_1 => {
  const suppressed =
    mode === 'replacement-dominant'
      ? [
          {
            ruleId: 'rule-a',
            file: 'apps/backend/src/a.ts',
            replacedByRuleId: 'rep-a',
            replacementRuleId: 'rep-a',
            platform: 'backend',
            reason: 'r',
          },
          {
            ruleId: 'rule-b',
            file: 'apps/backend/src/b.ts',
            replacedByRuleId: 'rep-b',
            replacementRuleId: 'rep-b',
            platform: 'backend',
            reason: 'r',
          },
          {
            ruleId: 'rule-c',
            file: 'apps/ios/App.swift',
            replacedByRuleId: '',
            replacementRuleId: null,
            platform: 'ios',
            reason: 'r',
          },
        ]
      : mode === 'non-replacement-dominant'
      ? [
          {
            ruleId: 'rule-a',
            file: 'apps/backend/src/a.ts',
            replacedByRuleId: '',
            replacementRuleId: null,
            platform: 'backend',
            reason: 'r',
          },
          {
            ruleId: 'rule-b',
            file: 'apps/backend/src/b.ts',
            replacedByRuleId: '',
            replacementRuleId: null,
            platform: 'backend',
            reason: 'r',
          },
          {
            ruleId: 'rule-c',
            file: 'apps/ios/App.swift',
            replacedByRuleId: 'rep-c',
            replacementRuleId: 'rep-c',
            platform: 'ios',
            reason: 'r',
          },
        ]
      : [
          {
            ruleId: 'rule-a',
            file: 'apps/backend/src/a.ts',
            replacedByRuleId: 'rep-a',
            replacementRuleId: 'rep-a',
            platform: 'backend',
            reason: 'r',
          },
          {
            ruleId: 'rule-b',
            file: 'apps/ios/App.swift',
            replacedByRuleId: '',
            replacementRuleId: null,
            platform: 'ios',
            reason: 'r',
          },
        ];

  return {
    version: '2.1',
    timestamp: '2026-02-18T20:00:00.000Z',
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
      by_severity: { CRITICAL: 0, ERROR: 0, WARN: 0, INFO: 0 },
    },
    consolidation: { suppressed },
  };
};

test('suppressed share core calcula métricas de distribución replacement/non-replacement', () => {
  const evidence = baseEvidence('replacement-dominant');

  assert.equal(toSuppressedReplacementRuleFilePlatformDistinctCount(evidence), 2);
  assert.equal(toSuppressedNonReplacementRuleFilePlatformDistinctCount(evidence), 1);
  assert.equal(toSuppressedRuleFilePlatformDistinctTotalCount(evidence), 3);
  assert.equal(toSuppressedReplacementRuleFilePlatformShareOfTotalPct(evidence), 66.67);
  assert.equal(toSuppressedNonReplacementRuleFilePlatformShareOfTotalPct(evidence), 33.33);
  assert.equal(toSuppressedReplacementVsNonReplacementShareGapPct(evidence), 33.34);
  assert.equal(toSuppressedReplacementRuleFilePlatformDominancePct(evidence), 66.67);
  assert.equal(toSuppressedReplacementMinusNonReplacementShareSignedPct(evidence), 33.34);
  assert.equal(toSuppressedNonReplacementRuleFilePlatformDominancePct(evidence), 0);
  assert.equal(toSuppressedSharePolarizationIndexPct(evidence), 33.34);
  assert.equal(toSuppressedShareBalanceScorePct(evidence), 66.66);
  assert.equal(toSuppressedShareImbalanceIndexPct(evidence), 33.34);
  assert.equal(toSuppressedSharePolarizationBalanceGapPct(evidence), 33.32);
  assert.equal(toSuppressedShareNetPolarityPct(evidence), 33.34);
});

test('suppressed share core deriva dirección/etiquetas/códigos según polaridad', () => {
  const replacement = baseEvidence('replacement-dominant');
  assert.equal(toSuppressedShareDirection(replacement), 'replacement');
  assert.equal(toSuppressedShareDirectionCode(replacement), 'R');
  assert.equal(toSuppressedShareDirectionLabel(replacement), 'Replacement Dominant');
  assert.equal(toSuppressedShareDirectionConfidence(replacement), 33.34);
  assert.equal(toSuppressedShareDirectionStrengthBucket(replacement), 'MEDIUM');
  assert.equal(toSuppressedShareDirectionStrengthRank(replacement), 2);
  assert.equal(toSuppressedShareDirectionIsBalanced(replacement), false);
  assert.ok(
    toSuppressedShareDirectionTriageHint(replacement).includes('Replacement-leaning suppression')
  );

  const nonReplacement = baseEvidence('non-replacement-dominant');
  assert.equal(toSuppressedShareDirection(nonReplacement), 'non_replacement');
  assert.equal(toSuppressedShareDirectionCode(nonReplacement), 'N');
  assert.equal(toSuppressedShareDirectionLabel(nonReplacement), 'Non-Replacement Dominant');
  assert.equal(toSuppressedShareDirectionConfidence(nonReplacement), 33.34);
  assert.equal(toSuppressedShareDirectionStrengthBucket(nonReplacement), 'MEDIUM');
  assert.equal(toSuppressedShareDirectionStrengthRank(nonReplacement), 2);
  assert.equal(toSuppressedShareDirectionIsBalanced(nonReplacement), false);
  assert.ok(
    toSuppressedShareDirectionTriageHint(nonReplacement).includes(
      'Non-replacement-leaning suppression'
    )
  );

  const balanced = baseEvidence('balanced');
  assert.equal(toSuppressedShareDirection(balanced), 'balanced');
  assert.equal(toSuppressedShareDirectionCode(balanced), 'B');
  assert.equal(toSuppressedShareDirectionLabel(balanced), 'Balanced');
  assert.equal(toSuppressedShareDirectionConfidence(balanced), 0);
  assert.equal(toSuppressedShareDirectionStrengthBucket(balanced), 'LOW');
  assert.equal(toSuppressedShareDirectionStrengthRank(balanced), 1);
  assert.equal(toSuppressedShareDirectionIsBalanced(balanced), true);
  assert.ok(
    toSuppressedShareDirectionTriageHint(balanced).includes('Balanced suppression split')
  );
});
