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

test('persiste snapshot.files_scanned cuando llega desde el runner de gate', () => {
  const result = buildEvidence({
    stage: 'PRE_COMMIT',
    gateOutcome: 'WARN',
    filesScanned: 911,
    findings: [
      {
        ruleId: 'heuristics.ts.console-log.ast',
        severity: 'WARN',
        code: 'TS_CONSOLE_LOG',
        message: 'Avoid console.log',
        filePath: 'scripts/example.ts',
      },
    ],
    detectedPlatforms: {},
    loadedRulesets: [],
  });

  assert.equal(result.snapshot.files_scanned, 911);
  assert.equal(result.snapshot.files_affected, 1);
});

test('separa semantica de files_scanned y files_affected en snapshot', () => {
  const result = buildEvidence({
    stage: 'PRE_PUSH',
    gateOutcome: 'BLOCK',
    filesScanned: 939,
    findings: [
      {
        ruleId: 'skills.backend.no-empty-catch',
        severity: 'ERROR',
        code: 'BACKEND_NO_EMPTY_CATCH',
        message: 'No empty catch',
        filePath: 'scripts/a.ts',
      },
      {
        ruleId: 'skills.backend.no-console-log',
        severity: 'ERROR',
        code: 'BACKEND_NO_CONSOLE_LOG',
        message: 'No console.log',
        filePath: 'scripts/a.ts',
      },
      {
        ruleId: 'skills.backend.avoid-explicit-any',
        severity: 'WARN',
        code: 'BACKEND_EXPLICIT_ANY',
        message: 'No explicit any',
        filePath: 'scripts/b.ts',
      },
    ],
    detectedPlatforms: {},
    loadedRulesets: [],
  });

  assert.equal(result.snapshot.files_scanned, 939);
  assert.equal(result.snapshot.files_affected, 2);
  assert.equal(result.snapshot.findings.length, 3);
});

test('persiste snapshot.evaluation_metrics con inventario evaluado/matcheado', () => {
  const result = buildEvidence({
    stage: 'PRE_COMMIT',
    findings: [],
    gateOutcome: 'PASS',
    filesScanned: 939,
    evaluationMetrics: {
      facts_total: 1878,
      rules_total: 25,
      baseline_rules: 0,
      heuristic_rules: 0,
      skills_rules: 25,
      project_rules: 0,
      matched_rules: 0,
      unmatched_rules: 25,
      evaluated_rule_ids: ['skills.backend.no-empty-catch', 'skills.backend.no-console-log'],
      matched_rule_ids: [],
      unmatched_rule_ids: ['skills.backend.no-empty-catch', 'skills.backend.no-console-log'],
    },
    detectedPlatforms: {},
    loadedRulesets: [],
  });

  assert.deepEqual(result.snapshot.evaluation_metrics, {
    facts_total: 1878,
    rules_total: 25,
    baseline_rules: 0,
    heuristic_rules: 0,
    skills_rules: 25,
    project_rules: 0,
    matched_rules: 0,
    unmatched_rules: 25,
    evaluated_rule_ids: ['skills.backend.no-console-log', 'skills.backend.no-empty-catch'],
    matched_rule_ids: [],
    unmatched_rule_ids: ['skills.backend.no-console-log', 'skills.backend.no-empty-catch'],
  });
});

test('persiste snapshot.rules_coverage con active/evaluated/matched/unevaluated y ratio', () => {
  const result = buildEvidence({
    stage: 'PRE_PUSH',
    findings: [],
    gateOutcome: 'PASS',
    filesScanned: 939,
    rulesCoverage: {
      stage: 'PRE_PUSH',
      active_rule_ids: ['skills.backend.no-empty-catch', 'skills.backend.no-console-log'],
      evaluated_rule_ids: ['skills.backend.no-empty-catch'],
      matched_rule_ids: ['skills.backend.no-empty-catch'],
      unevaluated_rule_ids: ['skills.backend.no-console-log'],
      counts: {
        active: 2,
        evaluated: 1,
        matched: 1,
        unevaluated: 1,
      },
      coverage_ratio: 0.5,
    },
    detectedPlatforms: {},
    loadedRulesets: [],
  });

  assert.deepEqual(result.snapshot.rules_coverage, {
    stage: 'PRE_PUSH',
    active_rule_ids: ['skills.backend.no-console-log', 'skills.backend.no-empty-catch'],
    evaluated_rule_ids: ['skills.backend.no-empty-catch'],
    matched_rule_ids: ['skills.backend.no-empty-catch'],
    unevaluated_rule_ids: ['skills.backend.no-console-log'],
    counts: {
      active: 2,
      evaluated: 1,
      matched: 1,
      unevaluated: 1,
    },
    coverage_ratio: 0.5,
  });
});

test('normaliza telemetria por defecto cuando no se informa filesScanned ni evaluationMetrics', () => {
  const result = buildEvidence({
    stage: 'PRE_COMMIT',
    findings: [],
    gateOutcome: 'PASS',
    detectedPlatforms: {},
    loadedRulesets: [],
  });

  assert.equal(result.snapshot.files_scanned, 0);
  assert.equal(result.snapshot.files_affected, 0);
  assert.deepEqual(result.snapshot.evaluation_metrics, {
    facts_total: 0,
    rules_total: 0,
    baseline_rules: 0,
    heuristic_rules: 0,
    skills_rules: 0,
    project_rules: 0,
    matched_rules: 0,
    unmatched_rules: 0,
    evaluated_rule_ids: [],
    matched_rule_ids: [],
    unmatched_rule_ids: [],
  });
  assert.deepEqual(result.snapshot.rules_coverage, {
    stage: 'PRE_COMMIT',
    active_rule_ids: [],
    evaluated_rule_ids: [],
    matched_rule_ids: [],
    unevaluated_rule_ids: [],
    counts: {
      active: 0,
      evaluated: 0,
      matched: 0,
      unevaluated: 0,
    },
    coverage_ratio: 1,
  });
});

test('incluye snapshot.platforms con las cinco plataformas y severidades legacy', () => {
  const result = buildEvidence({
    stage: 'PRE_COMMIT',
    gateOutcome: 'BLOCK',
    findings: [
      {
        ruleId: 'backend.avoid-explicit-any',
        severity: 'ERROR',
        code: 'BACKEND_ANY',
        message: 'Avoid explicit any',
        filePath: 'apps/backend/src/service.ts',
      },
      {
        ruleId: 'heuristics.ts.inner-html.ast',
        severity: 'WARN',
        code: 'TS_INNER_HTML',
        message: 'Avoid innerHTML',
        filePath: 'scripts/ui.ts',
      },
    ],
    detectedPlatforms: {},
    loadedRulesets: [],
  });

  assert.equal(result.snapshot.platforms?.length, 5);
  const backend = result.snapshot.platforms?.find((platform) => platform.platform === 'Backend');
  const frontend = result.snapshot.platforms?.find((platform) => platform.platform === 'Frontend');
  const ios = result.snapshot.platforms?.find((platform) => platform.platform === 'iOS');
  assert.ok(backend);
  assert.ok(frontend);
  assert.ok(ios);
  assert.equal(backend?.files_affected, 1);
  assert.equal(backend?.by_severity.HIGH, 1);
  assert.equal(frontend?.files_affected, 1);
  assert.equal(frontend?.by_severity.MEDIUM, 1);
  assert.equal(ios?.files_affected, 0);
});

test('deduplicates equivalent findings deterministically regardless of input order', () => {
  const baseFinding = {
    ruleId: 'backend.no-console-log',
    severity: 'ERROR' as const,
    filePath: 'apps/backend/src/service.ts',
    lines: [4, 7],
  };

  const firstRun = buildEvidence({
    stage: 'PRE_COMMIT',
    findings: [
      {
        ...baseFinding,
        code: 'B_RULE',
        message: 'second variant',
        matchedBy: 'Heuristic',
        source: 'heuristics:ast',
      },
      {
        ...baseFinding,
        code: 'A_RULE',
        message: 'first variant',
        matchedBy: 'FileContent',
        source: 'git:staged',
      },
    ],
    detectedPlatforms: {},
    loadedRulesets: [],
  });

  const secondRun = buildEvidence({
    stage: 'PRE_COMMIT',
    findings: [
      {
        ...baseFinding,
        code: 'A_RULE',
        message: 'first variant',
        matchedBy: 'FileContent',
        source: 'git:staged',
      },
      {
        ...baseFinding,
        code: 'B_RULE',
        message: 'second variant',
        matchedBy: 'Heuristic',
        source: 'heuristics:ast',
      },
    ],
    detectedPlatforms: {},
    loadedRulesets: [],
  });

  assert.equal(firstRun.snapshot.findings.length, 1);
  assert.equal(secondRun.snapshot.findings.length, 1);
  assert.deepEqual(firstRun.snapshot.findings, secondRun.snapshot.findings);
  assert.equal(firstRun.snapshot.findings[0]?.code, 'A_RULE');
  assert.equal(firstRun.snapshot.findings[0]?.source, 'git:staged');
});

test('persists sdd metrics for stage-level enforcement traceability', () => {
  const result = buildEvidence({
    stage: 'PRE_PUSH',
    findings: [],
    gateOutcome: 'PASS',
    detectedPlatforms: {},
    loadedRulesets: [],
    sddMetrics: {
      enforced: true,
      stage: 'PRE_PUSH',
      decision: {
        allowed: true,
        code: 'ALLOWED',
        message: 'sdd policy passed',
      },
    },
  });

  assert.deepEqual(result.sdd_metrics, {
    enforced: true,
    stage: 'PRE_PUSH',
    decision: {
      allowed: true,
      code: 'ALLOWED',
      message: 'sdd policy passed',
    },
  });
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
  assert.equal(result.consolidation.suppressed[0]?.replacementRuleId, 'ios.no-anyview');
  assert.equal(result.consolidation.suppressed[0]?.platform, 'ios');
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
  assert.equal(
    result.consolidation.suppressed[0]?.replacementRuleId,
    'heuristics.ts.explicit-any.ast'
  );
  assert.equal(result.consolidation.suppressed[0]?.platform, 'backend');
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
  assert.equal(result.consolidation.suppressed[0]?.platform, 'backend');
});

test('does not consolidate semantic-family findings when anchor lines differ', () => {
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

  assert.deepEqual(result.snapshot.findings.map((finding) => finding.ruleId), [
    'backend.avoid-explicit-any',
    'heuristics.ts.explicit-any.ast',
  ]);
  assert.equal(result.consolidation, undefined);
});

test('keeps findings for same rule when anchors differ and preserves deterministic order', () => {
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

  assert.equal(result.snapshot.findings.length, 2);
  assert.equal(result.snapshot.findings[0]?.ruleId, 'heuristics.ts.explicit-any.ast');
  assert.deepEqual(result.snapshot.findings[0]?.lines, [5]);
  assert.equal(result.snapshot.findings[1]?.ruleId, 'heuristics.ts.explicit-any.ast');
  assert.deepEqual(result.snapshot.findings[1]?.lines, [40]);
  assert.equal(result.consolidation, undefined);
});

test('applies origin precedence project-rules > skills > platform-preset > heuristics on tie', () => {
  const result = buildEvidence({
    stage: 'PRE_COMMIT',
    gateOutcome: 'WARN',
    findings: [
      {
        ruleId: 'heuristics.ts.explicit-any.ast',
        severity: 'WARN',
        code: 'HEURISTICS_EXPLICIT_ANY_AST',
        message: 'heuristic finding',
        filePath: 'apps/backend/src/main.ts',
      },
      {
        ruleId: 'backend.avoid-explicit-any',
        severity: 'WARN',
        code: 'BACKEND_AVOID_EXPLICIT_ANY',
        message: 'platform preset finding',
        filePath: 'apps/backend/src/main.ts',
      },
      {
        ruleId: 'skills.backend.avoid-explicit-any',
        severity: 'WARN',
        code: 'SKILLS_BACKEND_AVOID_EXPLICIT_ANY',
        message: 'skills finding',
        filePath: 'apps/backend/src/main.ts',
      },
      {
        ruleId: 'project.backend.no-explicit-any',
        severity: 'WARN',
        code: 'PROJECT_BACKEND_NO_EXPLICIT_ANY',
        message: 'project rule finding',
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
    ['project.backend.no-explicit-any']
  );
  assert.ok(result.consolidation);
  assert.deepEqual(
    result.consolidation.suppressed.map((entry) => entry.ruleId),
    [
      'backend.avoid-explicit-any',
      'heuristics.ts.explicit-any.ast',
      'skills.backend.avoid-explicit-any',
    ]
  );
  assert.ok(
    result.consolidation.suppressed.every(
      (entry) => entry.replacedByRuleId === 'project.backend.no-explicit-any'
    )
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

test('infers gate outcome from findings when gateOutcome is not provided', () => {
  const blockResult = buildEvidence({
    stage: 'PRE_PUSH',
    findings: [
      {
        ruleId: 'ios.no-force-unwrap',
        severity: 'CRITICAL',
        code: 'IOS_NO_FORCE_UNWRAP',
        message: 'Force unwrap is forbidden.',
        filePath: 'apps/ios/App/Feature.swift',
      },
    ],
    detectedPlatforms: {},
    loadedRulesets: [],
  });
  assert.equal(blockResult.snapshot.outcome, 'BLOCK');
  assert.equal(blockResult.ai_gate.status, 'BLOCKED');

  const warnResult = buildEvidence({
    stage: 'PRE_COMMIT',
    findings: [
      {
        ruleId: 'backend.no-console-log',
        severity: 'WARN',
        code: 'BACKEND_NO_CONSOLE_LOG',
        message: 'console.log is discouraged.',
        filePath: 'apps/backend/src/main.ts',
      },
    ],
    detectedPlatforms: {},
    loadedRulesets: [],
  });
  assert.equal(warnResult.snapshot.outcome, 'WARN');
  assert.equal(warnResult.ai_gate.status, 'ALLOWED');
});

test('preserves finding traceability fields in snapshot and compatibility violations', () => {
  const result = buildEvidence({
    stage: 'PRE_COMMIT',
    findings: [
      {
        ruleId: 'backend.no-console-log',
        severity: 'CRITICAL',
        code: 'BACKEND_NO_CONSOLE_LOG',
        message: 'console.log no permitido',
        filePath: 'apps/backend/src/main.ts',
        lines: [12],
        matchedBy: 'FileContent',
        source: 'git:staged',
      },
    ],
    detectedPlatforms: {
      backend: { detected: true, confidence: 'HIGH' },
    },
    loadedRulesets: [],
  });

  assert.equal(result.snapshot.findings[0]?.matchedBy, 'FileContent');
  assert.equal(result.snapshot.findings[0]?.source, 'git:staged');
  assert.equal(result.ai_gate.violations[0]?.matchedBy, 'FileContent');
  assert.equal(result.ai_gate.violations[0]?.source, 'git:staged');
});

test('propaga repo_state al construir evidencia determinista', () => {
  const result = buildEvidence({
    stage: 'PRE_COMMIT',
    findings: [],
    detectedPlatforms: {},
    loadedRulesets: [],
    repoState: {
      repo_root: '/tmp/pumuki-repo',
      git: {
        available: true,
        branch: 'feature/repo-state',
        upstream: 'origin/feature/repo-state',
        ahead: 0,
        behind: 0,
        dirty: false,
        staged: 0,
        unstaged: 0,
      },
      lifecycle: {
        installed: true,
        package_version: '6.3.16',
        lifecycle_version: '6.3.16',
        hooks: {
          pre_commit: 'managed',
          pre_push: 'managed',
        },
      },
    },
  });

  assert.equal(result.repo_state?.repo_root, '/tmp/pumuki-repo');
  assert.equal(result.repo_state?.git.branch, 'feature/repo-state');
  assert.equal(result.repo_state?.lifecycle.hooks.pre_push, 'managed');
});

test('preserves firstSeen from previous ledger and refreshes lastSeen timestamp', () => {
  const previous = emptyEvidence();
  previous.ledger = [
    {
      ruleId: 'backend.no-console-log',
      file: 'apps/backend/src/main.ts',
      firstSeen: '2026-01-01T00:00:00.000Z',
      lastSeen: '2026-01-05T00:00:00.000Z',
    },
  ];

  const result = buildEvidence({
    stage: 'CI',
    findings: [
      {
        ruleId: 'backend.no-console-log',
        severity: 'ERROR',
        code: 'BACKEND_NO_CONSOLE_LOG',
        message: 'console.log no permitido',
        filePath: 'apps/backend/src/main.ts',
      },
    ],
    previousEvidence: previous,
    detectedPlatforms: {},
    loadedRulesets: [],
  });

  assert.equal(result.ledger.length, 1);
  assert.equal(result.ledger[0]?.firstSeen, '2026-01-01T00:00:00.000Z');
  assert.equal(result.ledger[0]?.lastSeen, result.timestamp);
});
