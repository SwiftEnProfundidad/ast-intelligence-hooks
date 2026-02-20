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
