import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import {
  inferPlatformFromFilePath,
  toSuppressedFilesCount,
  toSuppressedFindingCoverageRatioPct,
  toSuppressedNonReplacementFilesCount,
  toSuppressedNonReplacementFilesRatioPct,
  toSuppressedNonReplacementPlatformsRatioPct,
  toSuppressedNonReplacementRatioPct,
  toSuppressedNonReplacementRulesCount,
  toSuppressedNonReplacementRulesRatioPct,
  toSuppressedPlatformsCount,
  toSuppressedReasonsCount,
  toSuppressedReasonsCoverageRatioPct,
  toSuppressedReplacementFilesRatioPct,
  toSuppressedReplacementPlatformsRatioPct,
  toSuppressedReplacementRulesCount,
  toSuppressedReplacementRulesRatioPct,
  toSuppressedRulesCount,
  toSuppressedWithReplacementCount,
  toSuppressedWithReplacementFilesCount,
  toSuppressedWithReplacementFilesRatioPct,
  toSuppressedWithReplacementPlatformsCount,
  toSuppressedWithReplacementPlatformsRatioPct,
  toSuppressedWithReplacementRatioPct,
  toSuppressedWithoutReplacementCount,
  toSuppressedWithoutReplacementFilesCount,
  toSuppressedWithoutReplacementFilesRatioPct,
  toSuppressedWithoutReplacementPlatformsRatioPct,
  toSuppressedWithoutReplacementRatioPct,
} from '../evidenceFacetsSuppressedBase';

const createEvidence = (): AiEvidenceV2_1 => ({
  version: '2.1',
  timestamp: '2026-02-18T19:00:00.000Z',
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
    ],
  },
});

const createEmptyEvidence = (): AiEvidenceV2_1 => ({
  ...createEvidence(),
  snapshot: {
    stage: 'PRE_COMMIT',
    outcome: 'PASS',
    findings: [],
  },
  consolidation: {
    suppressed: [],
  },
});

test('inferPlatformFromFilePath clasifica rutas y extensiones', () => {
  assert.equal(inferPlatformFromFilePath('apps/ios/App/Feature.swift'), 'ios');
  assert.equal(inferPlatformFromFilePath('apps/backend/src/health.ts'), 'backend');
  assert.equal(inferPlatformFromFilePath('apps/frontend/src/App.tsx'), 'frontend');
  assert.equal(inferPlatformFromFilePath('apps/android/app/src/main/Main.kt'), 'android');
  assert.equal(inferPlatformFromFilePath('scripts/utility.sh'), 'generic');
});

test('suppressed base calcula conteos y ratios deterministas', () => {
  const evidence = createEvidence();

  assert.equal(toSuppressedReplacementRulesCount(evidence), 3);
  assert.equal(toSuppressedRulesCount(evidence), 4);
  assert.equal(toSuppressedReplacementRulesRatioPct(evidence), 75);
  assert.equal(toSuppressedNonReplacementRulesCount(evidence), 2);
  assert.equal(toSuppressedNonReplacementRulesRatioPct(evidence), 50);
  assert.equal(toSuppressedPlatformsCount(evidence), 4);
  assert.equal(toSuppressedFilesCount(evidence), 4);
  assert.equal(toSuppressedReasonsCount(evidence), 3);
  assert.equal(toSuppressedWithReplacementCount(evidence), 2);
  assert.equal(toSuppressedWithReplacementFilesCount(evidence), 2);
  assert.equal(toSuppressedWithReplacementPlatformsCount(evidence), 2);
  assert.equal(toSuppressedWithoutReplacementFilesCount(evidence), 2);
  assert.equal(toSuppressedNonReplacementFilesCount(evidence), 2);
  assert.equal(toSuppressedWithReplacementFilesRatioPct(evidence), 50);
  assert.equal(toSuppressedReplacementFilesRatioPct(evidence), 50);
  assert.equal(toSuppressedWithoutReplacementFilesRatioPct(evidence), 50);
  assert.equal(toSuppressedNonReplacementFilesRatioPct(evidence), 50);
  assert.equal(toSuppressedWithReplacementPlatformsRatioPct(evidence), 50);
  assert.equal(toSuppressedWithoutReplacementPlatformsRatioPct(evidence), 50);
  assert.equal(toSuppressedNonReplacementPlatformsRatioPct(evidence), 50);
  assert.equal(toSuppressedReplacementPlatformsRatioPct(evidence), 50);
  assert.equal(toSuppressedWithReplacementRatioPct(evidence), 50);
  assert.equal(toSuppressedFindingCoverageRatioPct(evidence), 67);
  assert.equal(toSuppressedWithoutReplacementCount(evidence), 2);
  assert.equal(toSuppressedNonReplacementRatioPct(evidence), 50);
  assert.equal(toSuppressedWithoutReplacementRatioPct(evidence), 50);
  assert.equal(toSuppressedReasonsCoverageRatioPct(evidence), 75);
});

test('suppressed base devuelve 0 en ratios cuando no hay suppressions', () => {
  const evidence = createEmptyEvidence();

  assert.equal(toSuppressedReplacementRulesRatioPct(evidence), 0);
  assert.equal(toSuppressedNonReplacementRulesRatioPct(evidence), 0);
  assert.equal(toSuppressedWithReplacementFilesRatioPct(evidence), 0);
  assert.equal(toSuppressedWithoutReplacementFilesRatioPct(evidence), 0);
  assert.equal(toSuppressedNonReplacementFilesRatioPct(evidence), 0);
  assert.equal(toSuppressedWithReplacementPlatformsRatioPct(evidence), 0);
  assert.equal(toSuppressedWithoutReplacementPlatformsRatioPct(evidence), 0);
  assert.equal(toSuppressedNonReplacementPlatformsRatioPct(evidence), 0);
  assert.equal(toSuppressedReplacementPlatformsRatioPct(evidence), 0);
  assert.equal(toSuppressedWithReplacementRatioPct(evidence), 0);
  assert.equal(toSuppressedFindingCoverageRatioPct(evidence), 0);
  assert.equal(toSuppressedNonReplacementRatioPct(evidence), 0);
  assert.equal(toSuppressedWithoutReplacementRatioPct(evidence), 0);
  assert.equal(toSuppressedReasonsCoverageRatioPct(evidence), 0);
});
