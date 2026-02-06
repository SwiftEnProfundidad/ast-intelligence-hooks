import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1, HumanIntentState } from '../schema';
import { buildEvidence } from '../buildEvidence';

const emptyEvidence = (): AiEvidenceV2_1 => {
  return {
    version: '2.1',
    timestamp: '2026-02-06T00:00:00.000Z',
    snapshot: {
      stage: 'PRE_COMMIT',
      outcome: 'PASS',
      findings: [],
    },
    ledger: [],
    platforms: {},
    rulesets: [],
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
        INFO: 0,
        WARN: 0,
        ERROR: 0,
        CRITICAL: 0,
      },
    },
  };
};

const activeIntent = (overrides: Partial<HumanIntentState> = {}): HumanIntentState => {
  return {
    primary_goal: 'Harden platform gate',
    secondary_goals: ['stabilize CI'],
    non_goals: ['change product scope'],
    constraints: ['no core changes'],
    confidence_level: 'high',
    set_by: 'user',
    set_at: '2026-02-06T09:00:00.000Z',
    expires_at: '2099-01-01T00:00:00.000Z',
    preserved_at: '2026-02-06T09:00:00.000Z',
    preservation_count: 2,
    ...overrides,
  };
};

test('preserves non-expired human intent and mirrors it into ai_gate', () => {
  const previous = emptyEvidence();
  previous.human_intent = activeIntent();
  previous.ai_gate.human_intent = previous.human_intent;

  const result = buildEvidence({
    stage: 'CI',
    findings: [],
    previousEvidence: previous,
    detectedPlatforms: {},
    loadedRulesets: [],
  });

  assert.ok(result.human_intent);
  assert.equal(result.human_intent.primary_goal, 'Harden platform gate');
  assert.equal(result.human_intent.preservation_count, 3);
  assert.equal(result.human_intent.preserved_at, result.timestamp);
  assert.deepEqual(result.ai_gate.human_intent, result.human_intent);
});

test('drops stale human intent when expires_at is in the past', () => {
  const previous = emptyEvidence();
  previous.human_intent = activeIntent({
    expires_at: '2000-01-01T00:00:00.000Z',
  });
  previous.ai_gate.human_intent = previous.human_intent;

  const result = buildEvidence({
    stage: 'PRE_PUSH',
    findings: [],
    previousEvidence: previous,
    detectedPlatforms: {},
    loadedRulesets: [],
  });

  assert.equal(result.human_intent, null);
  assert.equal(result.ai_gate.human_intent, null);
});

test('uses explicit human intent input as source of truth without incrementing count', () => {
  const explicitIntent = activeIntent({
    primary_goal: 'Execute deterministic evidence rollout',
    preservation_count: 7,
  });

  const result = buildEvidence({
    stage: 'PRE_COMMIT',
    findings: [],
    humanIntent: explicitIntent,
    detectedPlatforms: {},
    loadedRulesets: [],
  });

  assert.ok(result.human_intent);
  assert.equal(result.human_intent.primary_goal, 'Execute deterministic evidence rollout');
  assert.equal(result.human_intent.preservation_count, 7);
  assert.equal(result.human_intent.preserved_at, result.timestamp);
  assert.deepEqual(result.ai_gate.human_intent, result.human_intent);
});
