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

test('respects explicit gate outcome for stage-aware blocking decisions', () => {
  const result = buildEvidence({
    stage: 'PRE_PUSH',
    gateOutcome: 'BLOCK',
    findings: [
      {
        ruleId: 'ios.no-print',
        severity: 'ERROR',
        code: 'IOS_NO_PRINT',
        message: 'print() usage is not allowed in iOS code.',
      },
    ],
    detectedPlatforms: {
      ios: { detected: true, confidence: 'HIGH' },
    },
    loadedRulesets: [],
  });

  assert.equal(result.snapshot.outcome, 'BLOCK');
  assert.equal(result.ai_gate.status, 'BLOCKED');
  assert.equal(result.severity_metrics.gate_status, 'BLOCKED');
});

test('suppresses duplicated iOS heuristic findings shadowed by stronger baseline findings', () => {
  const result = buildEvidence({
    stage: 'PRE_PUSH',
    gateOutcome: 'BLOCK',
    findings: [
      {
        ruleId: 'heuristics.ios.anyview.ast',
        severity: 'ERROR',
        code: 'HEURISTICS_IOS_ANYVIEW_AST',
        message: 'AST heuristic detected AnyView usage.',
        filePath: 'apps/ios/Sources/ProfileView.swift',
      },
      {
        ruleId: 'ios.no-anyview',
        severity: 'CRITICAL',
        code: 'IOS_NO_ANYVIEW',
        message: 'AnyView usage is not allowed in iOS code.',
        filePath: 'apps/ios/Sources/ProfileView.swift',
      },
    ],
    detectedPlatforms: {
      ios: { detected: true, confidence: 'HIGH' },
    },
    loadedRulesets: [],
  });

  assert.deepEqual(
    result.snapshot.findings.map((finding) => finding.ruleId),
    ['ios.no-anyview']
  );
  assert.ok(result.consolidation);
  assert.deepEqual(
    result.consolidation.suppressed.map((entry) => entry.ruleId),
    ['heuristics.ios.anyview.ast']
  );
  assert.equal(result.consolidation.suppressed[0]?.replacedByRuleId, 'ios.no-anyview');
  assert.equal(result.severity_metrics.by_severity.CRITICAL, 1);
  assert.equal(result.severity_metrics.by_severity.ERROR, 0);
});

test('keeps only strongest iOS finding when mapped baseline severity is lower', () => {
  const result = buildEvidence({
    stage: 'PRE_PUSH',
    gateOutcome: 'BLOCK',
    findings: [
      {
        ruleId: 'heuristics.ios.anyview.ast',
        severity: 'ERROR',
        code: 'HEURISTICS_IOS_ANYVIEW_AST',
        message: 'AST heuristic detected AnyView usage.',
        filePath: 'apps/ios/Sources/ProfileView.swift',
      },
      {
        ruleId: 'ios.no-anyview',
        severity: 'WARN',
        code: 'IOS_NO_ANYVIEW',
        message: 'AnyView usage is not allowed in iOS code.',
        filePath: 'apps/ios/Sources/ProfileView.swift',
      },
    ],
    detectedPlatforms: {
      ios: { detected: true, confidence: 'HIGH' },
    },
    loadedRulesets: [],
  });

  assert.deepEqual(
    result.snapshot.findings.map((finding) => finding.ruleId),
    ['heuristics.ios.anyview.ast']
  );
});

test('keeps strongest finding in backend explicit-any family and drops weaker duplicate', () => {
  const result = buildEvidence({
    stage: 'PRE_PUSH',
    gateOutcome: 'BLOCK',
    findings: [
      {
        ruleId: 'backend.avoid-explicit-any',
        severity: 'WARN',
        code: 'BACKEND_AVOID_EXPLICIT_ANY',
        message: 'Avoid explicit any in backend code.',
        filePath: 'apps/backend/src/main.ts',
      },
      {
        ruleId: 'heuristics.ts.explicit-any.ast',
        severity: 'ERROR',
        code: 'HEURISTICS_EXPLICIT_ANY_AST',
        message: 'AST heuristic detected explicit any usage.',
        filePath: 'apps/backend/src/main.ts',
      },
    ],
    detectedPlatforms: {
      backend: { detected: true, confidence: 'HIGH' },
    },
    loadedRulesets: [],
  });

  assert.deepEqual(
    result.snapshot.findings.map((finding) => finding.ruleId),
    ['heuristics.ts.explicit-any.ast']
  );
  assert.ok(result.consolidation);
  assert.equal(result.consolidation.suppressed[0]?.ruleId, 'backend.avoid-explicit-any');
  assert.equal(
    result.consolidation.suppressed[0]?.replacedByRuleId,
    'heuristics.ts.explicit-any.ast'
  );
  assert.equal(result.severity_metrics.by_severity.ERROR, 1);
  assert.equal(result.severity_metrics.by_severity.WARN, 0);
});

test('prefers baseline finding on equal severity tie within same semantic family', () => {
  const result = buildEvidence({
    stage: 'PRE_COMMIT',
    gateOutcome: 'PASS',
    findings: [
      {
        ruleId: 'backend.avoid-explicit-any',
        severity: 'WARN',
        code: 'BACKEND_AVOID_EXPLICIT_ANY',
        message: 'Avoid explicit any in backend code.',
        filePath: 'apps/backend/src/main.ts',
      },
      {
        ruleId: 'heuristics.ts.explicit-any.ast',
        severity: 'WARN',
        code: 'HEURISTICS_EXPLICIT_ANY_AST',
        message: 'AST heuristic detected explicit any usage.',
        filePath: 'apps/backend/src/main.ts',
      },
    ],
    detectedPlatforms: {
      backend: { detected: true, confidence: 'HIGH' },
    },
    loadedRulesets: [],
  });

  assert.deepEqual(
    result.snapshot.findings.map((finding) => finding.ruleId),
    ['backend.avoid-explicit-any']
  );
  assert.ok(result.consolidation);
  assert.equal(
    result.consolidation.suppressed[0]?.ruleId,
    'heuristics.ts.explicit-any.ast'
  );
});

test('applies semantic-family consolidation at file level even when lines differ', () => {
  const result = buildEvidence({
    stage: 'PRE_PUSH',
    gateOutcome: 'BLOCK',
    findings: [
      {
        ruleId: 'heuristics.ts.explicit-any.ast',
        severity: 'ERROR',
        code: 'HEURISTICS_EXPLICIT_ANY_AST',
        message: 'AST heuristic detected explicit any usage.',
        filePath: 'apps/backend/src/main.ts',
        lines: [10],
      },
      {
        ruleId: 'backend.avoid-explicit-any',
        severity: 'WARN',
        code: 'BACKEND_AVOID_EXPLICIT_ANY',
        message: 'Avoid explicit any in backend code.',
        filePath: 'apps/backend/src/main.ts',
        lines: [42],
      },
    ],
    detectedPlatforms: {
      backend: { detected: true, confidence: 'HIGH' },
    },
    loadedRulesets: [],
  });

  assert.deepEqual(
    result.snapshot.findings.map((finding) => finding.ruleId),
    ['heuristics.ts.explicit-any.ast']
  );
  assert.ok(result.consolidation);
  assert.deepEqual(result.consolidation.suppressed[0]?.lines, [42]);
});

test('keeps one deterministic finding when same rule repeats on multiple lines in one file', () => {
  const result = buildEvidence({
    stage: 'PRE_PUSH',
    gateOutcome: 'BLOCK',
    findings: [
      {
        ruleId: 'heuristics.ts.explicit-any.ast',
        severity: 'ERROR',
        code: 'HEURISTICS_EXPLICIT_ANY_AST',
        message: 'AST heuristic detected explicit any usage.',
        filePath: 'apps/backend/src/main.ts',
        lines: [40],
      },
      {
        ruleId: 'heuristics.ts.explicit-any.ast',
        severity: 'ERROR',
        code: 'HEURISTICS_EXPLICIT_ANY_AST',
        message: 'AST heuristic detected explicit any usage.',
        filePath: 'apps/backend/src/main.ts',
        lines: [5],
      },
    ],
    detectedPlatforms: {
      backend: { detected: true, confidence: 'HIGH' },
    },
    loadedRulesets: [],
  });

  assert.equal(result.snapshot.findings.length, 1);
  assert.equal(result.snapshot.findings[0]?.ruleId, 'heuristics.ts.explicit-any.ast');
  assert.deepEqual(result.snapshot.findings[0]?.lines, [5]);
  assert.ok(result.consolidation);
  assert.equal(result.consolidation.suppressed.length, 1);
  assert.deepEqual(result.consolidation.suppressed[0]?.lines, [40]);
  assert.equal(
    result.consolidation.suppressed[0]?.replacedByRuleId,
    'heuristics.ts.explicit-any.ast'
  );
});

test('normalizes detected platforms in deterministic key order', () => {
  const result = buildEvidence({
    stage: 'CI',
    findings: [],
    detectedPlatforms: {
      ios: { detected: true, confidence: 'HIGH' },
      backend: { detected: true, confidence: 'MEDIUM' },
      android: { detected: false, confidence: 'LOW' },
    },
    loadedRulesets: [],
  });

  assert.deepEqual(Object.keys(result.platforms), ['android', 'backend', 'ios']);
  assert.deepEqual(result.platforms.backend, { detected: true, confidence: 'MEDIUM' });
  assert.deepEqual(result.platforms.ios, { detected: true, confidence: 'HIGH' });
});

test('dedupes rulesets by platform+bundle and sorts output deterministically', () => {
  const result = buildEvidence({
    stage: 'PRE_COMMIT',
    findings: [],
    detectedPlatforms: {},
    loadedRulesets: [
      { platform: 'ios', bundle: 'gold', hash: 'ios-gold-1' },
      { platform: 'backend', bundle: 'backend', hash: 'be-1' },
      { platform: 'ios', bundle: 'gold', hash: 'ios-gold-2' },
      { platform: 'ios', bundle: 'heuristics', hash: 'ios-heur-1' },
    ],
  });

  assert.deepEqual(result.rulesets, [
    { platform: 'backend', bundle: 'backend', hash: 'be-1' },
    { platform: 'ios', bundle: 'gold', hash: 'ios-gold-1' },
    { platform: 'ios', bundle: 'heuristics', hash: 'ios-heur-1' },
  ]);
});
