import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1, CompatibilityViolation, HumanIntentState, SnapshotFinding } from './schema';

const sampleIntent = (): HumanIntentState => ({
  primary_goal: 'Ship deterministic evidence',
  secondary_goals: ['protect CI'],
  non_goals: ['change scope'],
  constraints: ['no core changes'],
  confidence_level: 'high',
  set_by: 'user',
  set_at: '2026-02-17T08:00:00.000Z',
  expires_at: null,
  preserved_at: '2026-02-17T08:00:00.000Z',
  preservation_count: 1,
});

const sampleFinding = (overrides: Partial<SnapshotFinding> = {}): SnapshotFinding => ({
  ruleId: 'backend.no-console-log',
  severity: 'ERROR',
  code: 'BACKEND_NO_CONSOLE_LOG',
  message: 'console.log no permitido',
  file: 'apps/backend/src/main.ts',
  lines: [4, 7],
  ...overrides,
});

const sampleViolation = (overrides: Partial<CompatibilityViolation> = {}): CompatibilityViolation => ({
  ruleId: 'backend.no-console-log',
  level: 'ERROR',
  code: 'BACKEND_NO_CONSOLE_LOG',
  message: 'console.log no permitido',
  file: 'apps/backend/src/main.ts',
  lines: 4,
  ...overrides,
});

test('AiEvidenceV2_1 soporta snapshot/ledger/platforms/rulesets con contrato 2.1', () => {
  const evidence: AiEvidenceV2_1 = {
    version: '2.1',
    timestamp: '2026-02-17T09:00:00.000Z',
    snapshot: {
      stage: 'PRE_PUSH',
      outcome: 'BLOCK',
      files_scanned: 911,
      files_affected: 1,
      evaluation_metrics: {
        facts_total: 1878,
        rules_total: 25,
        baseline_rules: 0,
        heuristic_rules: 0,
        skills_rules: 25,
        project_rules: 0,
        matched_rules: 1,
        unmatched_rules: 24,
        evaluated_rule_ids: ['skills.backend.no-console-log'],
        matched_rule_ids: ['skills.backend.no-console-log'],
        unmatched_rule_ids: ['skills.backend.no-empty-catch'],
      },
      rules_coverage: {
        stage: 'PRE_PUSH',
        active_rule_ids: ['skills.backend.no-console-log'],
        evaluated_rule_ids: ['skills.backend.no-console-log'],
        matched_rule_ids: ['skills.backend.no-console-log'],
        unevaluated_rule_ids: [],
        counts: {
          active: 1,
          evaluated: 1,
          matched: 1,
          unevaluated: 0,
        },
        coverage_ratio: 1,
      },
      findings: [sampleFinding()],
    },
    ledger: [
      {
        ruleId: 'backend.no-console-log',
        file: 'apps/backend/src/main.ts',
        lines: '4-7',
        firstSeen: '2026-02-16T09:00:00.000Z',
        lastSeen: '2026-02-17T09:00:00.000Z',
      },
    ],
    platforms: {
      backend: { detected: true, confidence: 'HIGH' },
    },
    rulesets: [{ platform: 'backend', bundle: 'backendRuleSet', hash: 'hash-1' }],
    human_intent: sampleIntent(),
    ai_gate: {
      status: 'BLOCKED',
      violations: [sampleViolation()],
      human_intent: sampleIntent(),
    },
    severity_metrics: {
      gate_status: 'BLOCKED',
      total_violations: 1,
      by_severity: {
        INFO: 0,
        WARN: 0,
        ERROR: 1,
        CRITICAL: 0,
      },
    },
    repo_state: {
      repo_root: '/repo',
      git: {
        available: true,
        branch: 'feature/evidence',
        upstream: 'origin/feature/evidence',
        ahead: 1,
        behind: 0,
        dirty: true,
        staged: 2,
        unstaged: 1,
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
  };

  assert.equal(evidence.version, '2.1');
  assert.equal(evidence.snapshot.stage, 'PRE_PUSH');
  assert.equal(evidence.snapshot.files_scanned, 911);
  assert.equal(evidence.snapshot.files_affected, 1);
  assert.equal(evidence.snapshot.evaluation_metrics?.rules_total, 25);
  assert.equal(evidence.snapshot.rules_coverage?.counts.active, 1);
  assert.equal(evidence.snapshot.findings[0]?.ruleId, 'backend.no-console-log');
  assert.equal(evidence.ai_gate.violations[0]?.level, 'ERROR');
  assert.equal(evidence.repo_state?.git.branch, 'feature/evidence');
  assert.equal(evidence.repo_state?.lifecycle.hooks.pre_commit, 'managed');
});

test('AiEvidenceV2_1 soporta contrato SDD en evidencia (sdd_metrics + source sdd-policy)', () => {
  const evidence: AiEvidenceV2_1 = {
    version: '2.1',
    timestamp: '2026-02-18T10:00:00.000Z',
    snapshot: {
      stage: 'PRE_PUSH',
      outcome: 'BLOCK',
      findings: [
        sampleFinding({
          ruleId: 'sdd.policy.blocked',
          severity: 'ERROR',
          code: 'SDD_VALIDATION_FAILED',
          message: 'OpenSpec validation failed',
          file: 'openspec/changes',
          lines: undefined,
          matchedBy: 'SddPolicy',
          source: 'sdd-policy',
        }),
      ],
    },
    ledger: [
      {
        ruleId: 'sdd.policy.blocked',
        file: 'openspec/changes',
        firstSeen: '2026-02-18T09:58:00.000Z',
        lastSeen: '2026-02-18T10:00:00.000Z',
      },
    ],
    platforms: {},
    rulesets: [{ platform: 'policy', bundle: 'gate-policy.default.PRE_PUSH', hash: 'hash-policy' }],
    human_intent: null,
    ai_gate: {
      status: 'BLOCKED',
      violations: [
        sampleViolation({
          ruleId: 'sdd.policy.blocked',
          code: 'SDD_VALIDATION_FAILED',
          message: 'OpenSpec validation failed',
          file: 'openspec/changes',
          lines: undefined,
          matchedBy: 'SddPolicy',
          source: 'sdd-policy',
        }),
      ],
      human_intent: null,
    },
    severity_metrics: {
      gate_status: 'BLOCKED',
      total_violations: 1,
      by_severity: {
        INFO: 0,
        WARN: 0,
        ERROR: 1,
        CRITICAL: 0,
      },
    },
    sdd_metrics: {
      enforced: true,
      stage: 'PRE_PUSH',
      decision: {
        allowed: false,
        code: 'SDD_VALIDATION_FAILED',
        message: 'OpenSpec validation failed',
      },
    },
  };

  assert.equal(evidence.snapshot.findings[0]?.source, 'sdd-policy');
  assert.equal(evidence.snapshot.findings[0]?.matchedBy, 'SddPolicy');
  assert.equal(evidence.ai_gate.violations[0]?.source, 'sdd-policy');
  assert.deepEqual(evidence.sdd_metrics, {
    enforced: true,
    stage: 'PRE_PUSH',
    decision: {
      allowed: false,
      code: 'SDD_VALIDATION_FAILED',
      message: 'OpenSpec validation failed',
    },
  });
});

test('EvidenceLines acepta string, number y array numérico según contrato', () => {
  const stringLines = sampleFinding({ lines: 'L12-L14' });
  const numberLines = sampleFinding({ lines: 12 });
  const arrayLines = sampleFinding({ lines: [12, 14] });

  assert.equal(typeof stringLines.lines, 'string');
  assert.equal(typeof numberLines.lines, 'number');
  assert.deepEqual(arrayLines.lines, [12, 14]);
});

test('AiEvidenceV2_1 soporta consolidation.suppressed y campos opcionales de compatibilidad', () => {
  const evidence: AiEvidenceV2_1 = {
    version: '2.1',
    timestamp: '2026-02-17T09:30:00.000Z',
    snapshot: {
      stage: 'CI',
      outcome: 'WARN',
      findings: [sampleFinding({ severity: 'WARN', lines: 'L10' })],
    },
    ledger: [
      {
        ruleId: 'backend.no-console-log',
        file: 'apps/backend/src/main.ts',
        firstSeen: '2026-02-16T09:00:00.000Z',
        lastSeen: '2026-02-17T09:30:00.000Z',
      },
    ],
    platforms: {
      backend: { detected: true, confidence: 'MEDIUM' },
      frontend: { detected: false, confidence: 'LOW' },
    },
    rulesets: [{ platform: 'backend', bundle: 'backendRuleSet', hash: 'hash-2' }],
    human_intent: null,
    ai_gate: {
      status: 'ALLOWED',
      violations: [sampleViolation({ level: 'WARN', lines: [10, 11] })],
      human_intent: null,
    },
    severity_metrics: {
      gate_status: 'ALLOWED',
      total_violations: 1,
      by_severity: {
        INFO: 0,
        WARN: 1,
        ERROR: 0,
        CRITICAL: 0,
      },
    },
    consolidation: {
      suppressed: [
        {
          ruleId: 'heuristics.ts.console-log.ast',
          file: 'apps/backend/src/main.ts',
          replacedByRuleId: 'backend.no-console-log',
          replacementRuleId: null,
          platform: 'backend',
          reason: 'semantic-family-precedence',
        },
      ],
    },
  };

  assert.equal(evidence.snapshot.outcome, 'WARN');
  assert.equal(evidence.platforms.backend?.confidence, 'MEDIUM');
  assert.equal(evidence.platforms.frontend?.confidence, 'LOW');
  assert.equal(evidence.ai_gate.status, 'ALLOWED');
  assert.equal(evidence.consolidation?.suppressed[0]?.reason, 'semantic-family-precedence');
});

test('HumanIntentState admite confidence unset y hint opcional', () => {
  const intent: HumanIntentState = {
    primary_goal: null,
    secondary_goals: [],
    non_goals: [],
    constraints: ['keep deterministic'],
    confidence_level: 'unset',
    set_by: null,
    set_at: null,
    expires_at: null,
    preserved_at: '2026-02-17T10:00:00.000Z',
    preservation_count: 0,
    _hint: 'captured from previous evidence',
  };

  assert.equal(intent.confidence_level, 'unset');
  assert.equal(intent._hint, 'captured from previous evidence');
});
