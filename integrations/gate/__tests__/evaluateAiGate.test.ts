import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import { evaluateAiGate } from '../evaluateAiGate';

const sampleEvidence = (overrides: Partial<AiEvidenceV2_1> = {}): AiEvidenceV2_1 => ({
  version: '2.1',
  timestamp: '2026-02-20T12:00:00.000Z',
  snapshot: {
    stage: 'PRE_COMMIT',
    outcome: 'PASS',
    rules_coverage: {
      stage: 'PRE_COMMIT',
      active_rule_ids: ['skills.backend.no-empty-catch'],
      evaluated_rule_ids: ['skills.backend.no-empty-catch'],
      matched_rule_ids: [],
      unevaluated_rule_ids: [],
      counts: {
        active: 1,
        evaluated: 1,
        matched: 0,
        unevaluated: 0,
      },
      coverage_ratio: 1,
    },
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
      CRITICAL: 0,
      ERROR: 0,
      WARN: 0,
      INFO: 0,
    },
  },
  repo_state: {
    repo_root: '/repo',
    git: {
      available: true,
      branch: 'feature/happy-path',
      upstream: 'origin/feature/happy-path',
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
  ...overrides,
});

test('evaluateAiGate bloquea cuando falta evidencia', () => {
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () => ({ kind: 'missing' }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.allowed, false);
  assert.equal(result.violations.some((item) => item.code === 'EVIDENCE_MISSING'), true);
});

test('evaluateAiGate bloquea cuando evidencia está stale para PRE_WRITE', () => {
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:30:00.000Z'),
      readEvidenceResult: () => ({
        kind: 'valid',
        evidence: sampleEvidence({ timestamp: '2026-02-20T11:00:00.000Z' }),
      }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.allowed, false);
  assert.equal(result.violations.some((item) => item.code === 'EVIDENCE_STALE'), true);
});

test('evaluateAiGate bloquea cuando evidencia válida ya está BLOCKED', () => {
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () => ({
        kind: 'valid',
        evidence: sampleEvidence({
          snapshot: {
            stage: 'PRE_COMMIT',
            outcome: 'BLOCK',
            findings: [
              {
                ruleId: 'backend.avoid-explicit-any',
                severity: 'CRITICAL',
                code: 'BACKEND_EXPLICIT_ANY',
                message: 'explicit any found',
                file: 'apps/backend/src/service.ts',
              },
            ],
          },
          ai_gate: {
            status: 'BLOCKED',
            violations: [
              {
                ruleId: 'backend.avoid-explicit-any',
                level: 'CRITICAL',
                code: 'BACKEND_EXPLICIT_ANY',
                message: 'explicit any found',
                file: 'apps/backend/src/service.ts',
              },
            ],
            human_intent: null,
          },
          severity_metrics: {
            gate_status: 'BLOCKED',
            total_violations: 1,
            by_severity: {
              CRITICAL: 1,
              ERROR: 0,
              WARN: 0,
              INFO: 0,
            },
          },
        }),
      }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.allowed, false);
  assert.equal(result.violations.some((item) => item.code === 'EVIDENCE_GATE_BLOCKED'), true);
});

test('evaluateAiGate bloquea en ramas protegidas por gitflow', () => {
  const repoState = sampleEvidence().repo_state!;
  repoState.git.branch = 'main';

  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () => ({
        kind: 'valid',
        evidence: sampleEvidence(),
      }),
      captureRepoState: () => repoState,
    }
  );

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.allowed, false);
  assert.equal(result.violations.some((item) => item.code === 'GITFLOW_PROTECTED_BRANCH'), true);
});

test('evaluateAiGate permite continuar cuando evidencia está fresca y rama cumple gitflow', () => {
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () => ({
        kind: 'valid',
        evidence: sampleEvidence(),
      }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.allowed, true);
  assert.equal(result.violations.length, 0);
});

test('evaluateAiGate bloquea PRE_WRITE cuando falta rules_coverage en evidencia válida', () => {
  const evidence = sampleEvidence();
  const snapshotWithoutCoverage = {
    ...evidence.snapshot,
    rules_coverage: undefined,
  };

  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () => ({
        kind: 'valid',
        evidence: {
          ...evidence,
          snapshot: snapshotWithoutCoverage,
        },
      }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.allowed, false);
  assert.equal(
    result.violations.some((item) => item.code === 'EVIDENCE_RULES_COVERAGE_MISSING'),
    true
  );
});

test('evaluateAiGate bloquea PRE_WRITE cuando repo root de evidencia no coincide', () => {
  const evidence = sampleEvidence();
  const repoState = sampleEvidence().repo_state!;

  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () => ({
        kind: 'valid',
        evidence: {
          ...evidence,
          repo_state: {
            ...evidence.repo_state!,
            repo_root: '/other-repo',
          },
        },
      }),
      captureRepoState: () => repoState,
    }
  );

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.allowed, false);
  assert.equal(
    result.violations.some((item) => item.code === 'EVIDENCE_REPO_ROOT_MISMATCH'),
    true
  );
});

test('evaluateAiGate bloquea PRE_WRITE ante incoherencias múltiples de evidencia', () => {
  const base = sampleEvidence();
  const repoState = sampleEvidence().repo_state!;
  repoState.git.branch = 'feature/current-branch';

  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () => ({
        kind: 'valid',
        evidence: {
          ...base,
          timestamp: '2026-02-20T13:00:00.000Z',
          snapshot: {
            ...base.snapshot,
            stage: 'PRE_COMMIT',
            outcome: 'PASS',
            rules_coverage: {
              stage: 'PRE_PUSH',
              active_rule_ids: ['skills.backend.no-empty-catch'],
              evaluated_rule_ids: [],
              matched_rule_ids: [],
              unevaluated_rule_ids: ['skills.backend.no-empty-catch'],
              unsupported_auto_rule_ids: ['skills.backend.guideline.dynamic-rule'],
              counts: {
                active: 1,
                evaluated: 0,
                matched: 0,
                unevaluated: 1,
                unsupported_auto: 1,
              },
              coverage_ratio: 0,
            },
          },
          ai_gate: {
            status: 'BLOCKED',
            violations: [],
            human_intent: null,
          },
          severity_metrics: {
            gate_status: 'ALLOWED',
            total_violations: 0,
            by_severity: {
              CRITICAL: 0,
              ERROR: 0,
              WARN: 0,
              INFO: 0,
            },
          },
          repo_state: {
            ...base.repo_state!,
            git: {
              ...base.repo_state!.git,
              branch: 'feature/legacy-branch',
            },
          },
        },
      }),
      captureRepoState: () => repoState,
    }
  );

  const codes = new Set(result.violations.map((item) => item.code));
  assert.equal(result.status, 'BLOCKED');
  assert.equal(codes.has('EVIDENCE_BRANCH_MISMATCH'), true);
  assert.equal(codes.has('EVIDENCE_GATE_STATUS_INCOHERENT'), true);
  assert.equal(codes.has('EVIDENCE_OUTCOME_INCOHERENT'), true);
  assert.equal(codes.has('EVIDENCE_RULES_COVERAGE_STAGE_MISMATCH'), true);
  assert.equal(codes.has('EVIDENCE_RULES_COVERAGE_INCOMPLETE'), true);
  assert.equal(codes.has('EVIDENCE_UNSUPPORTED_AUTO_RULES'), true);
  assert.equal(codes.has('EVIDENCE_TIMESTAMP_FUTURE'), true);
});

test('evaluateAiGate bloquea PRE_WRITE cuando se requiere recibo MCP y no existe', () => {
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
      requireMcpReceipt: true,
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () => ({
        kind: 'valid',
        evidence: sampleEvidence(),
      }),
      captureRepoState: () => sampleEvidence().repo_state!,
      readMcpAiGateReceipt: () => ({
        kind: 'missing',
        path: '/repo/.pumuki/artifacts/mcp-ai-gate-receipt.json',
      }),
    }
  );

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.allowed, false);
  assert.equal(
    result.violations.some((item) => item.code === 'MCP_ENTERPRISE_RECEIPT_MISSING'),
    true
  );
});

test('evaluateAiGate permite PRE_WRITE cuando hay recibo MCP fresco y válido', () => {
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
      requireMcpReceipt: true,
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () => ({
        kind: 'valid',
        evidence: sampleEvidence(),
      }),
      captureRepoState: () => sampleEvidence().repo_state!,
      readMcpAiGateReceipt: () => ({
        kind: 'valid',
        path: '/repo/.pumuki/artifacts/mcp-ai-gate-receipt.json',
        receipt: {
          version: '1',
          source: 'pumuki-enterprise-mcp',
          tool: 'ai_gate_check',
          repo_root: '/repo',
          stage: 'PRE_WRITE',
          status: 'ALLOWED',
          allowed: true,
          issued_at: '2026-02-20T12:04:50.000Z',
        },
      }),
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.allowed, true);
  assert.equal(
    result.violations.some((item) => item.code.startsWith('MCP_ENTERPRISE_RECEIPT_')),
    false
  );
});
