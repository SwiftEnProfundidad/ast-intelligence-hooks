import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import type { SkillsLockV1 } from '../../config/skillsLock';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import type { EvidenceSourceDescriptor } from '../../evidence/readEvidence';
import { getCurrentPumukiVersion } from '../../lifecycle/packageInfo';
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
      package_version: getCurrentPumukiVersion(),
      lifecycle_version: getCurrentPumukiVersion(),
      hooks: {
        pre_commit: 'managed',
        pre_push: 'managed',
      },
    },
  },
  ...overrides,
});

const sampleSourceDescriptor = (
  overrides: Partial<EvidenceSourceDescriptor> = {}
): EvidenceSourceDescriptor => ({
  source: 'local-file',
  path: '/repo/.ai_evidence.json',
  digest: 'sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  generated_at: '2026-02-20T12:00:00.000Z',
  ...overrides,
});

const missingEvidenceResult = () => ({
  kind: 'missing' as const,
  source_descriptor: sampleSourceDescriptor({
    digest: null,
    generated_at: null,
  }),
});

const validEvidenceResult = (evidence: AiEvidenceV2_1) => ({
  kind: 'valid' as const,
  evidence,
  source_descriptor: sampleSourceDescriptor({
    generated_at: evidence.timestamp,
  }),
});

const sampleBackendSkillsLock = (): SkillsLockV1 => ({
  version: '1.0',
  compilerVersion: '1.0.0',
  generatedAt: '2026-03-08T10:00:00.000Z',
  bundles: [
    {
      name: 'backend-guidelines',
      version: '1.0.0',
      source: 'repo-skill',
      hash: 'b'.repeat(64),
      rules: [
        {
          id: 'skills.backend.no-empty-catch',
          description: 'Avoid empty catch blocks.',
          severity: 'ERROR',
          platform: 'backend',
          sourceSkill: 'backend-guidelines',
          sourcePath: 'vendor/skills/backend/SKILL.md',
          locked: true,
        },
      ],
    },
  ],
});

const sampleMultiPlatformSkillsLock = (): SkillsLockV1 => ({
  version: '1.0',
  compilerVersion: '1.0.0',
  generatedAt: '2026-03-08T10:00:00.000Z',
  bundles: [
    {
      name: 'ios-guidelines',
      version: '1.0.0',
      source: 'repo-skill',
      hash: 'i'.repeat(64),
      rules: [
        {
          id: 'skills.ios.no-force-unwrap',
          description: 'Avoid force unwrap.',
          severity: 'ERROR',
          platform: 'ios',
          sourceSkill: 'ios-guidelines',
          sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
          locked: true,
        },
        {
          id: 'skills.ios.critical-test-quality',
          description: 'Keep critical iOS test quality coverage.',
          severity: 'ERROR',
          platform: 'ios',
          sourceSkill: 'ios-guidelines',
          sourcePath: 'vendor/skills/ios-enterprise-rules/SKILL.md',
          locked: true,
        },
      ],
    },
    {
      name: 'ios-concurrency-guidelines',
      version: '1.0.0',
      source: 'repo-skill',
      hash: 'c'.repeat(64),
      rules: [],
    },
    {
      name: 'ios-swiftui-expert-guidelines',
      version: '1.0.0',
      source: 'repo-skill',
      hash: 's'.repeat(64),
      rules: [],
    },
    {
      name: 'android-guidelines',
      version: '1.0.0',
      source: 'repo-skill',
      hash: 'a'.repeat(64),
      rules: [
        {
          id: 'skills.android.no-runblocking',
          description: 'Avoid runBlocking.',
          severity: 'ERROR',
          platform: 'android',
          sourceSkill: 'android-guidelines',
          sourcePath: 'vendor/skills/android-enterprise-rules/SKILL.md',
          locked: true,
        },
      ],
    },
    {
      name: 'backend-guidelines',
      version: '1.0.0',
      source: 'repo-skill',
      hash: 'b'.repeat(64),
      rules: [
        {
          id: 'skills.backend.no-empty-catch',
          description: 'Avoid empty catch blocks.',
          severity: 'ERROR',
          platform: 'backend',
          sourceSkill: 'backend-guidelines',
          sourcePath: 'vendor/skills/backend-enterprise-rules/SKILL.md',
          locked: true,
        },
      ],
    },
    {
      name: 'frontend-guidelines',
      version: '1.0.0',
      source: 'repo-skill',
      hash: 'f'.repeat(64),
      rules: [
        {
          id: 'skills.frontend.no-empty-catch',
          description: 'Avoid empty catch blocks.',
          severity: 'ERROR',
          platform: 'frontend',
          sourceSkill: 'frontend-guidelines',
          sourcePath: 'vendor/skills/frontend-enterprise-rules/SKILL.md',
          locked: true,
        },
      ],
    },
  ],
});

const withSkillsEnforcementEnv = async <T>(
  value: string | undefined,
  callback: () => Promise<T> | T
): Promise<T> => {
  const previous = process.env.PUMUKI_SKILLS_ENFORCEMENT;
  if (typeof value === 'undefined') {
    delete process.env.PUMUKI_SKILLS_ENFORCEMENT;
  } else {
    process.env.PUMUKI_SKILLS_ENFORCEMENT = value;
  }

  try {
    return await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_SKILLS_ENFORCEMENT;
    } else {
      process.env.PUMUKI_SKILLS_ENFORCEMENT = previous;
    }
  }
};

test('evaluateAiGate bloquea cuando falta evidencia', () => {
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () => missingEvidenceResult(),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.allowed, false);
  assert.equal(result.violations.some((item) => item.code === 'EVIDENCE_MISSING'), true);
  assert.deepEqual((result.evidence as { source?: unknown }).source, {
    source: 'local-file',
    path: '/repo/.ai_evidence.json',
    digest: null,
    generated_at: null,
  });
});

test('evaluateAiGate bloquea cuando evidencia está stale para PRE_WRITE', () => {
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:30:00.000Z'),
      readEvidenceResult: () => validEvidenceResult(sampleEvidence({ timestamp: '2026-02-20T11:00:00.000Z' })),
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
      readEvidenceResult: () =>
        validEvidenceResult(
          sampleEvidence({
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
          })
        ),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.allowed, false);
  assert.equal(result.violations.some((item) => item.code === 'EVIDENCE_GATE_BLOCKED'), true);
});

test('evaluateAiGate normaliza package_version/lifecycle_version cuando captureRepoState llega desalineado', () => {
  const repoState = sampleEvidence().repo_state!;
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () => validEvidenceResult(sampleEvidence()),
      captureRepoState: () => ({
        ...repoState,
        lifecycle: {
          ...repoState.lifecycle,
          package_version: '6.3.26',
          lifecycle_version: '6.3.41',
        },
      }),
    }
  );

  assert.equal(result.repo_state.lifecycle.package_version, '6.3.26');
  assert.equal(result.repo_state.lifecycle.lifecycle_version, '6.3.26');
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
      readEvidenceResult: () => validEvidenceResult(sampleEvidence()),
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
        source_descriptor: {
          source: 'local-file',
          path: '/repo/.ai_evidence.json',
          digest: 'sha256:abc123',
          generated_at: '2026-02-20T12:00:00.000Z',
        },
      }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.allowed, true);
  assert.equal(result.violations.length, 0);
  assert.deepEqual((result.evidence as { source?: unknown }).source, {
    source: 'local-file',
    path: '/repo/.ai_evidence.json',
    digest: 'sha256:abc123',
    generated_at: '2026-02-20T12:00:00.000Z',
  });
});

test('evaluateAiGate bloquea PRE_COMMIT cuando la higiene de worktree supera umbral crítico', () => {
  const repoState = sampleEvidence().repo_state!;
  repoState.git.dirty = true;
  repoState.git.staged = 15;
  repoState.git.unstaged = 10;

  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_COMMIT',
      preWriteWorktreeHygiene: {
        warnThreshold: 8,
        blockThreshold: 20,
      },
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () => validEvidenceResult(sampleEvidence()),
      captureRepoState: () => repoState,
    }
  );

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.allowed, false);
  assert.equal(
    result.violations.some((item) => item.code === 'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT'),
    true
  );
});

test('evaluateAiGate bloquea PRE_WRITE cuando la higiene de worktree supera umbral crítico', () => {
  const repoState = sampleEvidence().repo_state!;
  repoState.git.dirty = true;
  repoState.git.staged = 11;
  repoState.git.unstaged = 14;

  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
      preWriteWorktreeHygiene: {
        warnThreshold: 8,
        blockThreshold: 20,
      },
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () => validEvidenceResult(sampleEvidence()),
      captureRepoState: () => repoState,
    }
  );

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.allowed, false);
  assert.equal(
    result.violations.some((item) => item.code === 'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT'),
    true
  );
});

test('evaluateAiGate mantiene PRE_WRITE en ALLOWED y emite WARN cuando el worktree supera umbral de aviso', () => {
  const repoState = sampleEvidence().repo_state!;
  repoState.git.dirty = true;
  repoState.git.staged = 3;
  repoState.git.unstaged = 6;

  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
      preWriteWorktreeHygiene: {
        warnThreshold: 8,
        blockThreshold: 20,
      },
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () => validEvidenceResult(sampleEvidence()),
      captureRepoState: () => repoState,
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.allowed, true);
  assert.equal(
    result.violations.some((item) => item.code === 'EVIDENCE_PREWRITE_WORKTREE_WARN'),
    true
  );
});

test('evaluateAiGate deduplica archivos parcialmente staged usando pending_changes en PRE_WRITE', () => {
  const repoState = sampleEvidence().repo_state!;
  repoState.git.dirty = true;
  repoState.git.staged = 6;
  repoState.git.unstaged = 6;
  repoState.git.pending_changes = 6;

  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
      preWriteWorktreeHygiene: {
        warnThreshold: 8,
        blockThreshold: 12,
      },
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () => validEvidenceResult(sampleEvidence()),
      captureRepoState: () => repoState,
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.allowed, true);
  assert.equal(
    result.violations.some((item) => item.code === 'EVIDENCE_PREWRITE_WORKTREE_WARN'),
    false
  );
  assert.equal(
    result.violations.some((item) => item.code === 'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT'),
    false
  );
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
      readEvidenceResult: () =>
        validEvidenceResult({
          ...evidence,
          snapshot: snapshotWithoutCoverage,
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
      readEvidenceResult: () =>
        validEvidenceResult({
          ...evidence,
          repo_state: {
            ...evidence.repo_state!,
            repo_root: '/other-repo',
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
      readEvidenceResult: () =>
        validEvidenceResult({
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

test('evaluateAiGate mantiene PRE_WRITE en advisory cuando falta cobertura de prefijos skills por plataforma detectada', () => {
  const base = sampleEvidence();
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () =>
        validEvidenceResult({
          ...base,
          platforms: {
            backend: {
              detected: true,
              confidence: 'HIGH',
            },
          },
          rulesets: [
            {
              platform: 'skills',
              bundle: 'backend-guidelines@1.0.0',
              hash: 'skills-backend-hash',
            },
          ],
          snapshot: {
            ...base.snapshot,
            rules_coverage: {
              ...base.snapshot.rules_coverage!,
              active_rule_ids: ['project.rules.audit'],
              evaluated_rule_ids: ['project.rules.audit'],
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
          },
        }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.allowed, true);
  const violation = result.violations.find(
    (item) => item.code === 'EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE'
  );
  assert.ok(violation);
  assert.equal(violation.severity, 'WARN');
});

test('evaluateAiGate bloquea PRE_WRITE cuando active_rule_ids está vacío con plataforma de código detectada', () => {
  const base = sampleEvidence();
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () =>
        validEvidenceResult({
          ...base,
          platforms: {
            backend: {
              detected: true,
              confidence: 'HIGH',
            },
          },
          snapshot: {
            ...base.snapshot,
            rules_coverage: {
              ...base.snapshot.rules_coverage!,
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
            },
          },
        }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'BLOCKED');
  assert.equal(
    result.violations.some(
      (item) => item.code === 'EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES'
    ),
    true
  );
});

test('evaluateAiGate permite PRE_WRITE cuando active_rule_ids está vacío sin plataformas de código detectadas', () => {
  const base = sampleEvidence();
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () =>
        validEvidenceResult({
          ...base,
          platforms: {},
          snapshot: {
            ...base.snapshot,
            rules_coverage: {
              ...base.snapshot.rules_coverage!,
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
            },
          },
        }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.allowed, true);
  assert.equal(
    result.violations.some(
      (item) => item.code === 'EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES'
    ),
    false
  );
});

test('evaluateAiGate bloquea PRE_WRITE cuando active_rule_ids está vacío y la cobertura evaluada infiere plataforma', () => {
  const base = sampleEvidence();
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () =>
        validEvidenceResult({
          ...base,
          platforms: {},
          snapshot: {
            ...base.snapshot,
            rules_coverage: {
              ...base.snapshot.rules_coverage!,
              active_rule_ids: [],
              evaluated_rule_ids: ['skills.backend.no-empty-catch'],
              matched_rule_ids: [],
              unevaluated_rule_ids: [],
              counts: {
                active: 0,
                evaluated: 1,
                matched: 0,
                unevaluated: 0,
              },
              coverage_ratio: 1,
            },
          },
        }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'BLOCKED');
  assert.equal(
    result.violations.some(
      (item) => item.code === 'EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES'
    ),
    true
  );
  const violation = result.violations.find(
    (item) => item.code === 'EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES'
  );
  assert.match(violation?.message ?? '', /inferred code platforms=\[backend\]/i);
});

test('evaluateAiGate mantiene PRE_WRITE en advisory cuando faltan bundles skills requeridos por plataforma detectada', () => {
  const base = sampleEvidence();
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () =>
        validEvidenceResult({
          ...base,
          platforms: {
            backend: {
              detected: true,
              confidence: 'HIGH',
            },
          },
          rulesets: [],
          snapshot: {
            ...base.snapshot,
            rules_coverage: {
              ...base.snapshot.rules_coverage!,
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
          },
        }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.allowed, true);
  const violation = result.violations.find(
    (item) => item.code === 'EVIDENCE_PLATFORM_SKILLS_BUNDLES_MISSING'
  );
  assert.ok(violation);
  assert.equal(violation.severity, 'WARN');
});

test('evaluateAiGate permite PRE_WRITE con plataformas detectadas cuando skills están completas', () => {
  const base = sampleEvidence();
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () =>
        validEvidenceResult({
          ...base,
          platforms: {
            backend: {
              detected: true,
              confidence: 'HIGH',
            },
            frontend: {
              detected: true,
              confidence: 'MEDIUM',
            },
          },
          rulesets: [
            {
              platform: 'skills',
              bundle: 'backend-guidelines@1.0.0',
              hash: 'skills-backend-hash',
            },
            {
              platform: 'skills',
              bundle: 'frontend-guidelines@1.0.0',
              hash: 'skills-frontend-hash',
            },
          ],
          snapshot: {
            ...base.snapshot,
            rules_coverage: {
              ...base.snapshot.rules_coverage!,
              active_rule_ids: [
                'skills.backend.no-empty-catch',
                'skills.frontend.no-empty-catch',
              ],
              evaluated_rule_ids: [
                'skills.backend.no-empty-catch',
                'skills.frontend.no-empty-catch',
              ],
              matched_rule_ids: [],
              unevaluated_rule_ids: [],
              counts: {
                active: 2,
                evaluated: 2,
                matched: 0,
                unevaluated: 0,
              },
              coverage_ratio: 1,
            },
          },
        }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.allowed, true);
  assert.equal(
    result.violations.some(
      (item) => item.code === 'EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE'
    ),
    false
  );
  assert.equal(
    result.violations.some(
      (item) => item.code === 'EVIDENCE_PLATFORM_SKILLS_BUNDLES_MISSING'
    ),
    false
  );
});

test('evaluateAiGate bloquea PRE_WRITE aunque skills enforcement esté en advisory cuando iOS no incluye regla crítica de calidad de tests', () => {
  const base = sampleEvidence();
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () =>
        validEvidenceResult({
          ...base,
          platforms: {
            ios: {
              detected: true,
              confidence: 'HIGH',
            },
          },
          rulesets: [
            {
              platform: 'skills',
              bundle: 'ios-guidelines@1.0.0',
              hash: 'skills-ios-hash',
            },
            {
              platform: 'skills',
              bundle: 'ios-concurrency-guidelines@1.0.0',
              hash: 'skills-ios-concurrency-hash',
            },
            {
              platform: 'skills',
              bundle: 'ios-swiftui-expert-guidelines@1.0.0',
              hash: 'skills-ios-swiftui-hash',
            },
          ],
          snapshot: {
            ...base.snapshot,
            rules_coverage: {
              ...base.snapshot.rules_coverage!,
              active_rule_ids: ['skills.ios.no-force-unwrap'],
              evaluated_rule_ids: ['skills.ios.no-force-unwrap'],
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
          },
        }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.allowed, false);
  const violation = result.violations.find(
    (item) => item.code === 'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING'
  );
  assert.ok(violation);
  assert.equal(violation.severity, 'ERROR');
});

test('evaluateAiGate permite PRE_WRITE cuando iOS detectado incluye regla crítica de calidad de tests', () => {
  const base = sampleEvidence();
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () =>
        validEvidenceResult({
          ...base,
          platforms: {
            ios: {
              detected: true,
              confidence: 'HIGH',
            },
          },
          rulesets: [
            {
              platform: 'skills',
              bundle: 'ios-guidelines@1.0.0',
              hash: 'skills-ios-hash',
            },
            {
              platform: 'skills',
              bundle: 'ios-concurrency-guidelines@1.0.0',
              hash: 'skills-ios-concurrency-hash',
            },
            {
              platform: 'skills',
              bundle: 'ios-swiftui-expert-guidelines@1.0.0',
              hash: 'skills-ios-swiftui-hash',
            },
          ],
          snapshot: {
            ...base.snapshot,
            rules_coverage: {
              ...base.snapshot.rules_coverage!,
              active_rule_ids: [
                'skills.ios.no-force-unwrap',
                'skills.ios.critical-test-quality',
              ],
              evaluated_rule_ids: [
                'skills.ios.no-force-unwrap',
                'skills.ios.critical-test-quality',
              ],
              matched_rule_ids: [],
              unevaluated_rule_ids: [],
              counts: {
                active: 2,
                evaluated: 2,
                matched: 0,
                unevaluated: 0,
              },
              coverage_ratio: 1,
            },
          },
        }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.allowed, true);
  assert.equal(
    result.violations.some(
      (item) => item.code === 'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING'
    ),
    false
  );
});

test('evaluateAiGate mantiene PRE_WRITE en advisory cuando plataforma backend detectada no cubre regla crítica transversal', () => {
  const base = sampleEvidence();
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () =>
        validEvidenceResult({
          ...base,
          platforms: {
            backend: {
              detected: true,
              confidence: 'HIGH',
            },
          },
          rulesets: [
            {
              platform: 'skills',
              bundle: 'backend-guidelines@1.0.0',
              hash: 'skills-backend-hash',
            },
          ],
          snapshot: {
            ...base.snapshot,
            rules_coverage: {
              ...base.snapshot.rules_coverage!,
              active_rule_ids: ['skills.backend.custom-guideline'],
              evaluated_rule_ids: ['skills.backend.custom-guideline'],
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
          },
        }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.allowed, true);
  const violation = result.violations.find(
    (item) => item.code === 'EVIDENCE_CROSS_PLATFORM_CRITICAL_ENFORCEMENT_INCOMPLETE'
  );
  assert.ok(violation);
  assert.equal(violation.severity, 'WARN');
});

test('evaluateAiGate permite PRE_WRITE cuando plataforma backend detectada cubre regla crítica transversal', () => {
  const base = sampleEvidence();
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () =>
        validEvidenceResult({
          ...base,
          platforms: {
            backend: {
              detected: true,
              confidence: 'HIGH',
            },
          },
          rulesets: [
            {
              platform: 'skills',
              bundle: 'backend-guidelines@1.0.0',
              hash: 'skills-backend-hash',
            },
          ],
          snapshot: {
            ...base.snapshot,
            rules_coverage: {
              ...base.snapshot.rules_coverage!,
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
          },
        }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.allowed, true);
  assert.equal(
    result.violations.some(
      (item) => item.code === 'EVIDENCE_CROSS_PLATFORM_CRITICAL_ENFORCEMENT_INCOMPLETE'
    ),
    false
  );
});

test('evaluateAiGate permite PRE_WRITE cuando platforms arrastra iOS pero la cobertura efectiva es backend', () => {
  const base = sampleEvidence();
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () =>
        validEvidenceResult({
          ...base,
          platforms: {
            ios: {
              detected: true,
              confidence: 'HIGH',
            },
            backend: {
              detected: true,
              confidence: 'HIGH',
            },
          },
          rulesets: [
            {
              platform: 'skills',
              bundle: 'backend-guidelines@1.0.0',
              hash: 'skills-backend-hash',
            },
          ],
          snapshot: {
            ...base.snapshot,
            rules_coverage: {
              ...base.snapshot.rules_coverage!,
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
          },
        }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.allowed, true);
  assert.equal(
    result.violations.some(
      (item) => item.code === 'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING'
    ),
    false
  );
  assert.equal(
    result.violations.some(
      (item) => item.code === 'EVIDENCE_CROSS_PLATFORM_CRITICAL_ENFORCEMENT_INCOMPLETE'
    ),
    false
  );
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
      readEvidenceResult: () => validEvidenceResult(sampleEvidence()),
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

test('evaluateAiGate mantiene PRE_PUSH en advisory cuando contrato skills/policy queda incompleto para plataforma detectada', () => {
  const base = sampleEvidence();
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_PUSH',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () =>
        validEvidenceResult({
          ...base,
          platforms: {
            backend: {
              detected: true,
              confidence: 'HIGH',
            },
          },
          rulesets: [
            {
              platform: 'skills',
              bundle: 'backend-guidelines@1.0.0',
              hash: 'skills-backend-hash',
            },
          ],
          snapshot: {
            ...base.snapshot,
            rules_coverage: {
              ...base.snapshot.rules_coverage!,
              active_rule_ids: ['project.rules.audit'],
              evaluated_rule_ids: ['project.rules.audit'],
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
          },
        }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.allowed, true);
  assert.equal(
    result.violations.some((item) => item.code === 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE'),
    true
  );
  assert.equal(
    result.violations.find((item) => item.code === 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE')
      ?.severity,
    'WARN'
  );
  assert.equal(result.skills_contract?.status, 'FAIL');
  assert.equal(
    result.skills_contract?.violations.some(
      (item) => item.code === 'EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE'
    ),
    true
  );
});

test('evaluateAiGate bloquea PRE_PUSH en modo strict cuando contrato skills/policy queda incompleto para plataforma detectada', async () => {
  await withSkillsEnforcementEnv('strict', async () => {
    const base = sampleEvidence();
    const result = evaluateAiGate(
      {
        repoRoot: '/repo',
        stage: 'PRE_PUSH',
      },
      {
        now: () => Date.parse('2026-02-20T12:05:00.000Z'),
        readEvidenceResult: () =>
          validEvidenceResult({
            ...base,
            platforms: {
              backend: {
                detected: true,
                confidence: 'HIGH',
              },
            },
            rulesets: [
              {
                platform: 'skills',
                bundle: 'backend-guidelines@1.0.0',
                hash: 'skills-backend-hash',
              },
            ],
            snapshot: {
              ...base.snapshot,
              rules_coverage: {
                ...base.snapshot.rules_coverage!,
                active_rule_ids: ['project.rules.audit'],
                evaluated_rule_ids: ['project.rules.audit'],
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
            },
          }),
        captureRepoState: () => sampleEvidence().repo_state!,
      }
    );

    assert.equal(result.status, 'BLOCKED');
    assert.equal(result.allowed, false);
    assert.equal(
      result.violations.find((item) => item.code === 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE')
        ?.severity,
      'ERROR'
    );
  });
});

test('evaluateAiGate permite PRE_COMMIT cuando contrato skills/policy está completo para plataforma detectada', () => {
  const base = sampleEvidence();
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_COMMIT',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () =>
        validEvidenceResult({
          ...base,
          platforms: {
            backend: {
              detected: true,
              confidence: 'HIGH',
            },
          },
          rulesets: [
            {
              platform: 'skills',
              bundle: 'backend-guidelines@1.0.0',
              hash: 'skills-backend-hash',
            },
          ],
          snapshot: {
            ...base.snapshot,
            rules_coverage: {
              ...base.snapshot.rules_coverage!,
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
          },
        }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.allowed, true);
  assert.equal(result.skills_contract?.status, 'PASS');
  assert.equal(result.skills_contract?.detected_platforms.includes('backend'), true);
});

test('evaluateAiGate infiere plataforma desde rules_coverage cuando evidence.platforms está vacío', () => {
  const base = sampleEvidence();
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_COMMIT',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () =>
        validEvidenceResult({
          ...base,
          platforms: {},
          rulesets: [
            {
              platform: 'skills',
              bundle: 'backend-guidelines@1.0.0',
              hash: 'skills-backend-hash',
            },
          ],
          snapshot: {
            ...base.snapshot,
            rules_coverage: {
              ...base.snapshot.rules_coverage!,
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
          },
        }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.skills_contract?.status, 'PASS');
  assert.equal(result.skills_contract?.detected_platforms.includes('backend'), true);
});

test('evaluateAiGate trata PRE_WRITE como no-op cuando el repo exige skills pero el worktree está limpio y no se detectan plataformas activas', () => {
  const base = sampleEvidence();
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () =>
        validEvidenceResult({
          ...base,
          snapshot: {
            ...base.snapshot,
            stage: 'PRE_WRITE',
            rules_coverage: {
              ...base.snapshot.rules_coverage!,
              stage: 'PRE_WRITE',
              active_rule_ids: ['project.rules.audit'],
              evaluated_rule_ids: ['project.rules.audit'],
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
          },
          rulesets: [],
          platforms: {},
        }),
      captureRepoState: () => sampleEvidence().repo_state!,
      loadRequiredSkillsLock: () => sampleBackendSkillsLock(),
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.allowed, true);
  assert.equal(result.skills_contract?.enforced, false);
  assert.equal(result.skills_contract?.status, 'NOT_APPLICABLE');
  assert.equal(result.skills_contract?.violations.length, 0);
  assert.equal(
    result.violations.some((item) => item.code === 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE'),
    false
  );
  assert.equal(result.skills_contract?.requirements.length, 0);
  assert.deepEqual(result.skills_contract?.detected_platforms, []);
});

test('evaluateAiGate permite PRE_WRITE strict cuando el lock del repo es multi-plataforma pero el delta detecta solo iOS', async () => {
  await withSkillsEnforcementEnv('strict', async () => {
    const base = sampleEvidence();
    const result = evaluateAiGate(
      {
        repoRoot: '/repo',
        stage: 'PRE_WRITE',
      },
      {
        now: () => Date.parse('2026-02-20T12:05:00.000Z'),
        readEvidenceResult: () =>
          validEvidenceResult({
            ...base,
            platforms: {
              ios: {
                detected: true,
                confidence: 'HIGH',
              },
            },
            rulesets: [
              {
                platform: 'skills',
                bundle: 'ios-guidelines@1.0.0',
                hash: 'skills-ios-hash',
              },
              {
                platform: 'skills',
                bundle: 'ios-concurrency-guidelines@1.0.0',
                hash: 'skills-ios-concurrency-hash',
              },
              {
                platform: 'skills',
                bundle: 'ios-swiftui-expert-guidelines@1.0.0',
                hash: 'skills-ios-swiftui-hash',
              },
            ],
            snapshot: {
              ...base.snapshot,
              stage: 'PRE_WRITE',
              rules_coverage: {
                ...base.snapshot.rules_coverage!,
                stage: 'PRE_WRITE',
                active_rule_ids: [
                  'skills.ios.no-force-unwrap',
                  'skills.ios.critical-test-quality',
                ],
                evaluated_rule_ids: [
                  'skills.ios.no-force-unwrap',
                  'skills.ios.critical-test-quality',
                ],
                matched_rule_ids: [],
                unevaluated_rule_ids: [],
                counts: {
                  active: 2,
                  evaluated: 2,
                  matched: 0,
                  unevaluated: 0,
                },
                coverage_ratio: 1,
              },
            },
          }),
        captureRepoState: () => sampleEvidence().repo_state!,
        loadRequiredSkillsLock: () => sampleMultiPlatformSkillsLock(),
      }
    );

    assert.equal(result.status, 'ALLOWED');
    assert.equal(result.allowed, true);
    assert.deepEqual(result.skills_contract?.detected_platforms, ['ios']);
    assert.deepEqual(
      result.skills_contract?.requirements.map((item) => item.platform),
      ['ios']
    );
    assert.equal(
      result.violations.some((item) => item.code === 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE'),
      false
    );
  });
});

test('evaluateAiGate no bloquea PRE_WRITE en modo strict cuando el repo exige skills pero el worktree está limpio y no se detectan plataformas activas', async () => {
  await withSkillsEnforcementEnv('strict', async () => {
    const base = sampleEvidence();
    const result = evaluateAiGate(
      {
        repoRoot: '/repo',
        stage: 'PRE_WRITE',
      },
      {
        now: () => Date.parse('2026-02-20T12:05:00.000Z'),
        readEvidenceResult: () =>
          validEvidenceResult({
            ...base,
            snapshot: {
              ...base.snapshot,
              stage: 'PRE_WRITE',
              rules_coverage: {
                ...base.snapshot.rules_coverage!,
                stage: 'PRE_WRITE',
                active_rule_ids: ['project.rules.audit'],
                evaluated_rule_ids: ['project.rules.audit'],
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
            },
            rulesets: [],
            platforms: {},
          }),
        captureRepoState: () => sampleEvidence().repo_state!,
        loadRequiredSkillsLock: () => sampleBackendSkillsLock(),
      }
    );

    assert.equal(result.status, 'ALLOWED');
    assert.equal(result.allowed, true);
    assert.equal(result.skills_contract?.enforced, false);
    assert.equal(result.skills_contract?.status, 'NOT_APPLICABLE');
    assert.equal(
      result.violations.some((item) => item.code === 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE'),
      false
    );
  });
});

test('evaluateAiGate no mezcla skills_contract_incomplete con evidence stale en PRE_WRITE cuando el slice limpio no materializa plataformas', async () => {
  await withSkillsEnforcementEnv('strict', async () => {
    const base = sampleEvidence();
    const result = evaluateAiGate(
      {
        repoRoot: '/repo',
        stage: 'PRE_WRITE',
      },
      {
        now: () => Date.parse('2026-02-20T12:20:01.000Z'),
        readEvidenceResult: () =>
          validEvidenceResult({
            ...base,
            timestamp: '2026-02-20T12:00:00.000Z',
            snapshot: {
              ...base.snapshot,
              stage: 'PRE_WRITE',
              rules_coverage: {
                ...base.snapshot.rules_coverage!,
                stage: 'PRE_WRITE',
                active_rule_ids: ['project.rules.audit'],
                evaluated_rule_ids: ['project.rules.audit'],
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
            },
            platforms: {},
            rulesets: [],
          }),
        captureRepoState: () => sampleEvidence().repo_state!,
        loadRequiredSkillsLock: () => sampleBackendSkillsLock(),
      }
    );

    assert.equal(result.status, 'BLOCKED');
    assert.equal(
      result.violations.some((item) => item.code === 'EVIDENCE_STALE'),
      true
    );
    assert.equal(
      result.violations.some((item) => item.code === 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE'),
      false
    );
    assert.equal(result.skills_contract?.status, 'NOT_APPLICABLE');
    assert.equal(result.skills_contract?.violations.length, 0);
  });
});

test('evaluateAiGate bloquea PRE_COMMIT cuando el repo exige skills pero solo hay plataforma inferida por coverage', () => {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'pumuki-ai-gate-precommit-'));
  mkdirSync(join(tmpRoot, 'apps/backend'), { recursive: true });

  try {
    const base = sampleEvidence();
    const result = evaluateAiGate(
      {
        repoRoot: tmpRoot,
        stage: 'PRE_COMMIT',
      },
      {
        now: () => Date.parse('2026-02-20T12:05:00.000Z'),
        readEvidenceResult: () =>
          validEvidenceResult({
            ...base,
            platforms: {},
            rulesets: [
              {
                platform: 'skills',
                bundle: 'backend-guidelines@1.0.0',
                hash: 'skills-backend-hash',
              },
            ],
            snapshot: {
              ...base.snapshot,
              stage: 'PRE_COMMIT',
              rules_coverage: {
                ...base.snapshot.rules_coverage!,
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
            },
          }),
        captureRepoState: () => ({
          ...sampleEvidence().repo_state!,
          repo_root: tmpRoot,
        }),
        loadRequiredSkillsLock: () => sampleBackendSkillsLock(),
      }
    );

    assert.equal(result.status, 'ALLOWED');
    assert.equal(result.allowed, true);
    assert.equal(result.skills_contract?.enforced, true);
    assert.equal(result.skills_contract?.status, 'PASS');
    assert.deepEqual(result.skills_contract?.detected_platforms, ['backend']);
    assert.equal(
      result.skills_contract?.violations.some(
        (item) => item.code === 'EVIDENCE_SKILLS_PLATFORMS_UNDETECTED'
      ),
      false
    );
    assert.equal(
      result.violations.some((item) => item.code === 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE'),
      false
    );
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('evaluateAiGate detecta plataformas requeridas desde el árbol del repo cuando coverage no las materializa', () => {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'pumuki-ai-gate-'));
  mkdirSync(join(tmpRoot, 'apps/backend'), { recursive: true });

  try {
    const base = sampleEvidence();
    const result = evaluateAiGate(
      {
        repoRoot: tmpRoot,
        stage: 'PRE_WRITE',
      },
      {
        now: () => Date.parse('2026-02-20T12:05:00.000Z'),
        readEvidenceResult: () =>
          validEvidenceResult({
            ...base,
            platforms: {},
            rulesets: [
              {
                platform: 'skills',
                bundle: 'backend-guidelines@1.0.0',
                hash: 'skills-backend-hash',
              },
            ],
            snapshot: {
              ...base.snapshot,
              stage: 'PRE_WRITE',
              rules_coverage: {
                ...base.snapshot.rules_coverage!,
                stage: 'PRE_WRITE',
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
            },
          }),
        captureRepoState: () => ({
          ...sampleEvidence().repo_state!,
          repo_root: tmpRoot,
        }),
        loadRequiredSkillsLock: () => sampleBackendSkillsLock(),
      }
    );

    assert.equal(result.skills_contract?.enforced, true);
    assert.equal(result.skills_contract?.status, 'PASS');
    assert.deepEqual(result.skills_contract?.detected_platforms, ['backend']);
    assert.equal(
      result.skills_contract?.violations.some(
        (item) => item.code === 'EVIDENCE_SKILLS_PLATFORMS_UNDETECTED'
      ),
      false
    );
    assert.equal(
      result.violations.some((item) => item.code === 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE'),
      false
    );
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('evaluateAiGate no arrastra plataformas desde el árbol completo del repo en PRE_WRITE y deja el slice limpio como no-op', async () => {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'pumuki-ai-gate-prewrite-scope-'));
  mkdirSync(join(tmpRoot, 'apps/ios'), { recursive: true });
  mkdirSync(join(tmpRoot, 'apps/android'), { recursive: true });
  mkdirSync(join(tmpRoot, 'apps/backend'), { recursive: true });

  try {
    await withSkillsEnforcementEnv('strict', async () => {
      const base = sampleEvidence();
      const result = evaluateAiGate(
        {
          repoRoot: tmpRoot,
          stage: 'PRE_WRITE',
        },
        {
          now: () => Date.parse('2026-02-20T12:05:00.000Z'),
          readEvidenceResult: () =>
            validEvidenceResult({
              ...base,
              platforms: {},
              rulesets: [],
              repo_state: {
                ...base.repo_state!,
                repo_root: tmpRoot,
              },
              snapshot: {
                ...base.snapshot,
                stage: 'PRE_WRITE',
                rules_coverage: {
                  ...base.snapshot.rules_coverage!,
                  stage: 'PRE_WRITE',
                  active_rule_ids: ['project.rules.audit'],
                  evaluated_rule_ids: ['project.rules.audit'],
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
              },
            }),
          captureRepoState: () => ({
            ...sampleEvidence().repo_state!,
            repo_root: tmpRoot,
          }),
          loadRequiredSkillsLock: () => sampleMultiPlatformSkillsLock(),
        }
      );

      assert.equal(result.status, 'ALLOWED');
      assert.equal(result.allowed, true);
      assert.deepEqual(result.skills_contract?.detected_platforms, []);
      assert.deepEqual(result.skills_contract?.requirements, []);
      assert.equal(
        result.violations.some((item) => item.code === 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE'),
        false
      );
    });
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('evaluateAiGate no bloquea PRE_WRITE cuando el worktree está limpio y no hay plataformas activas detectables', async () => {
  await withSkillsEnforcementEnv('strict', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'pumuki-ai-gate-prewrite-clean-'));
    mkdirSync(join(tmpRoot, 'apps/ios'), { recursive: true });
    mkdirSync(join(tmpRoot, 'apps/android'), { recursive: true });
    mkdirSync(join(tmpRoot, 'apps/backend'), { recursive: true });

    try {
      const base = sampleEvidence();
      const result = evaluateAiGate(
        {
          repoRoot: tmpRoot,
          stage: 'PRE_WRITE',
        },
        {
          now: () => Date.parse('2026-02-20T12:05:00.000Z'),
          readEvidenceResult: () =>
            validEvidenceResult({
              ...base,
              platforms: {},
              rulesets: [],
              repo_state: {
                ...base.repo_state!,
                repo_root: tmpRoot,
              },
              snapshot: {
                ...base.snapshot,
                stage: 'PRE_WRITE',
                rules_coverage: {
                  ...base.snapshot.rules_coverage!,
                  stage: 'PRE_WRITE',
                  active_rule_ids: ['project.rules.audit'],
                  evaluated_rule_ids: ['project.rules.audit'],
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
              },
            }),
          captureRepoState: () => ({
            ...sampleEvidence().repo_state!,
            repo_root: tmpRoot,
            git: {
              ...sampleEvidence().repo_state!.git,
              pending_changes: 0,
            },
          }),
          loadRequiredSkillsLock: () => sampleMultiPlatformSkillsLock(),
        }
      );

      assert.equal(result.status, 'ALLOWED');
      assert.equal(result.allowed, true);
      assert.equal(result.skills_contract?.enforced, false);
      assert.equal(result.skills_contract?.status, 'NOT_APPLICABLE');
      assert.deepEqual(result.skills_contract?.detected_platforms, []);
      assert.equal(
        result.violations.some((item) => item.code === 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE'),
        false
      );
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});

test('evaluateAiGate trata PRE_WRITE de tooling puro como no-op aunque existan pending_changes', async () => {
  await withSkillsEnforcementEnv('strict', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'pumuki-ai-gate-prewrite-tooling-'));

    try {
      execFileSync('git', ['init'], { cwd: tmpRoot, stdio: 'ignore' });
      writeFileSync(join(tmpRoot, 'package.json'), '{"name":"consumer","private":true}\n');
      writeFileSync(join(tmpRoot, 'package-lock.json'), '{"lockfileVersion":3}\n');

      const base = sampleEvidence();
      const result = evaluateAiGate(
        {
          repoRoot: tmpRoot,
          stage: 'PRE_WRITE',
        },
        {
          now: () => Date.parse('2026-02-20T12:05:00.000Z'),
          readEvidenceResult: () =>
            validEvidenceResult({
              ...base,
              platforms: {},
              rulesets: [],
              repo_state: {
                ...base.repo_state!,
                repo_root: tmpRoot,
              },
              snapshot: {
                ...base.snapshot,
                stage: 'PRE_WRITE',
                rules_coverage: {
                  ...base.snapshot.rules_coverage!,
                  stage: 'PRE_WRITE',
                  active_rule_ids: ['project.rules.audit'],
                  evaluated_rule_ids: ['project.rules.audit'],
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
              },
            }),
          captureRepoState: () => ({
            ...sampleEvidence().repo_state!,
            repo_root: tmpRoot,
            git: {
              ...sampleEvidence().repo_state!.git,
              pending_changes: 2,
              staged: 1,
              unstaged: 1,
            },
          }),
          loadRequiredSkillsLock: () => sampleMultiPlatformSkillsLock(),
        }
      );

      assert.equal(result.status, 'ALLOWED');
      assert.equal(result.allowed, true);
      assert.equal(result.skills_contract?.enforced, false);
      assert.equal(result.skills_contract?.status, 'NOT_APPLICABLE');
      assert.equal(
        result.violations.some((item) => item.code === 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE'),
        false
      );
      assert.deepEqual(result.skills_contract?.detected_platforms, []);
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});

test('evaluateAiGate degrada EVIDENCE_GATE_BLOCKED a WARN en slices documentales/render con evidencia fresca', async () => {
  await withSkillsEnforcementEnv('strict', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'pumuki-ai-gate-doc-render-advisory-'));

    try {
      execFileSync('git', ['init'], { cwd: tmpRoot, stdio: 'ignore' });
      mkdirSync(join(tmpRoot, 'stack-my-architecture-pumuki/05-bloque-05'), { recursive: true });
      mkdirSync(join(tmpRoot, 'stack-my-architecture-pumuki/dist'), { recursive: true });
      mkdirSync(join(tmpRoot, 'stack-my-architecture-hub/pumuki'), { recursive: true });
      writeFileSync(
        join(tmpRoot, 'stack-my-architecture-pumuki/05-bloque-05/20-cierre.md'),
        '# Cierre\n'
      );
      writeFileSync(join(tmpRoot, 'stack-my-architecture-pumuki/dist/index.html'), '<main></main>\n');
      writeFileSync(join(tmpRoot, 'stack-my-architecture-hub/pumuki/index.html'), '<main></main>\n');

      const base = sampleEvidence();
      const result = evaluateAiGate(
        {
          repoRoot: tmpRoot,
          stage: 'PRE_WRITE',
        },
        {
          now: () => Date.parse('2026-02-20T12:05:00.000Z'),
          readEvidenceResult: () =>
            validEvidenceResult({
              ...base,
              snapshot: {
                ...base.snapshot,
                stage: 'PRE_WRITE',
                outcome: 'BLOCK',
                rules_coverage: {
                  ...base.snapshot.rules_coverage!,
                  stage: 'PRE_WRITE',
                  active_rule_ids: ['project.rules.audit'],
                  evaluated_rule_ids: ['project.rules.audit'],
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
              },
              ai_gate: {
                ...base.ai_gate,
                status: 'BLOCKED',
                violations: [
                  {
                    code: 'EVIDENCE_GATE_BLOCKED',
                    message: 'Evidence AI gate status is BLOCKED.',
                    severity: 'ERROR',
                  },
                ],
              },
              severity_metrics: {
                ...base.severity_metrics,
                gate_status: 'BLOCKED',
                total_violations: 1,
                by_severity: {
                  ...base.severity_metrics.by_severity,
                  ERROR: 1,
                },
              },
              repo_state: {
                ...base.repo_state!,
                repo_root: tmpRoot,
              },
            }),
          captureRepoState: () => ({
            ...sampleEvidence().repo_state!,
            repo_root: tmpRoot,
            git: {
              ...sampleEvidence().repo_state!.git,
              pending_changes: 3,
              staged: 0,
              unstaged: 3,
            },
          }),
          loadRequiredSkillsLock: () => sampleMultiPlatformSkillsLock(),
        }
      );

      assert.equal(result.status, 'ALLOWED');
      assert.equal(result.allowed, true);
      assert.deepEqual(
        result.violations.filter((item) => item.code === 'EVIDENCE_GATE_BLOCKED').map((item) => item.severity),
        ['WARN']
      );
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});

test('evaluateAiGate mantiene EVIDENCE_GATE_BLOCKED como ERROR si el slice documental tiene evidencia caducada', async () => {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'pumuki-ai-gate-doc-render-stale-'));

  try {
    execFileSync('git', ['init'], { cwd: tmpRoot, stdio: 'ignore' });
    writeFileSync(join(tmpRoot, 'docs-change.md'), '# Docs\n');

    const base = sampleEvidence();
    const result = evaluateAiGate(
      {
        repoRoot: tmpRoot,
        stage: 'PRE_WRITE',
      },
      {
        now: () => Date.parse('2026-02-20T13:00:00.000Z'),
        readEvidenceResult: () =>
          validEvidenceResult({
            ...base,
            snapshot: {
              ...base.snapshot,
              stage: 'PRE_WRITE',
              outcome: 'BLOCK',
            },
            ai_gate: {
              ...base.ai_gate,
              status: 'BLOCKED',
            },
            severity_metrics: {
              ...base.severity_metrics,
              gate_status: 'BLOCKED',
              total_violations: 1,
              by_severity: {
                ...base.severity_metrics.by_severity,
                ERROR: 1,
              },
            },
          }),
        captureRepoState: () => ({
          ...sampleEvidence().repo_state!,
          repo_root: tmpRoot,
          git: {
            ...sampleEvidence().repo_state!.git,
            pending_changes: 1,
            staged: 0,
            unstaged: 1,
          },
        }),
      }
    );

    assert.equal(result.status, 'BLOCKED');
    assert.equal(result.allowed, false);
    assert.deepEqual(
      result.violations.filter((item) => item.code === 'EVIDENCE_GATE_BLOCKED').map((item) => item.severity),
      ['ERROR']
    );
    assert.equal(result.violations.some((item) => item.code === 'EVIDENCE_STALE'), true);
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('evaluateAiGate no trata skills core efectivas como contrato obligatorio del consumer', () => {
  const base = sampleEvidence();
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_COMMIT',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () =>
        validEvidenceResult({
          ...base,
          platforms: {},
          rulesets: [],
          snapshot: {
            ...base.snapshot,
            stage: 'PRE_COMMIT',
            rules_coverage: {
              ...base.snapshot.rules_coverage!,
              stage: 'PRE_COMMIT',
              active_rule_ids: ['project.rules.audit'],
              evaluated_rule_ids: ['project.rules.audit'],
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
          },
        }),
      captureRepoState: () => sampleEvidence().repo_state!,
      loadEffectiveSkillsLock: () => sampleBackendSkillsLock(),
      loadRequiredSkillsLock: () => undefined,
    }
  );

  assert.equal(result.status, 'ALLOWED');
  assert.equal(result.skills_contract?.enforced, false);
  assert.equal(result.skills_contract?.status, 'NOT_APPLICABLE');
  assert.deepEqual(result.skills_contract?.detected_platforms, []);
  assert.equal(
    result.violations.some((item) => item.code === 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE'),
    false
  );
});

test('evaluateAiGate usa código específico cuando la evidence chain es inválida', () => {
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () =>
        ({
          kind: 'invalid',
          version: '2.1',
          reason: 'evidence-chain-invalid',
          detail: 'Evidence chain payload hash mismatch.',
          source_descriptor: {
            source: 'local-file',
            path: '/repo/.ai_evidence.json',
            digest: 'sha256:abc123',
            generated_at: '2026-02-20T12:00:00.000Z',
          },
        }),
      captureRepoState: () => sampleEvidence().repo_state!,
    }
  );

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.allowed, false);
  assert.equal(result.violations.some((item) => item.code === 'EVIDENCE_CHAIN_INVALID'), true);
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
      readEvidenceResult: () => validEvidenceResult(sampleEvidence()),
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

test('evaluateAiGate permite PRE_WRITE con recibo MCP en PRE_COMMIT cuando está fresco', () => {
  const result = evaluateAiGate(
    {
      repoRoot: '/repo',
      stage: 'PRE_WRITE',
      requireMcpReceipt: true,
    },
    {
      now: () => Date.parse('2026-02-20T12:05:00.000Z'),
      readEvidenceResult: () => validEvidenceResult(sampleEvidence()),
      captureRepoState: () => sampleEvidence().repo_state!,
      readMcpAiGateReceipt: () => ({
        kind: 'valid',
        path: '/repo/.pumuki/artifacts/mcp-ai-gate-receipt.json',
        receipt: {
          version: '1',
          source: 'pumuki-enterprise-mcp',
          tool: 'ai_gate_check',
          repo_root: '/repo',
          stage: 'PRE_COMMIT',
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
    result.violations.some((item) => item.code === 'MCP_ENTERPRISE_RECEIPT_STAGE_MISMATCH'),
    false
  );
});
