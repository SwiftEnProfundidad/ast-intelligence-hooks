import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runEnterpriseAiGateCheck, runEnterpriseAiGateCheckAsync } from '../aiGateCheck';
import { buildEvidenceChain } from '../../evidence/evidenceChain';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import { evaluateAiGate } from '../../gate/evaluateAiGate';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const withAiGateCheckMode = async <T>(
  mode: 'policy' | 'full' | undefined,
  callback: () => Promise<T> | T
): Promise<T> => {
  const previous = process.env.PUMUKI_MCP_AI_GATE_CHECK_MODE;
  if (typeof mode === 'undefined') {
    delete process.env.PUMUKI_MCP_AI_GATE_CHECK_MODE;
  } else {
    process.env.PUMUKI_MCP_AI_GATE_CHECK_MODE = mode;
  }
  try {
    return await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_MCP_AI_GATE_CHECK_MODE;
    } else {
      process.env.PUMUKI_MCP_AI_GATE_CHECK_MODE = previous;
    }
  }
};

const withLearningContextMode = async <T>(
  mode: 'off' | 'advisory' | 'strict' | undefined,
  callback: () => Promise<T> | T
): Promise<T> => {
  const previous = process.env.PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT;
  if (typeof mode === 'undefined') {
    delete process.env.PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT;
  } else {
    process.env.PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT = mode;
  }
  try {
    return await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT = previous;
    }
  }
};

test('runEnterpriseAiGateCheck aplica contrato de tool ai_gate_check en PRE_WRITE', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-aigate-check-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/mcp-chain']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    const evidence: AiEvidenceV2_1 = {
      version: '2.1',
      timestamp: new Date().toISOString(),
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
    };
    evidence.evidence_chain = buildEvidenceChain({ evidence });
    writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');

    const result = runEnterpriseAiGateCheck({
      repoRoot,
      stage: 'PRE_WRITE',
    });

    assert.equal(result.tool, 'ai_gate_check');
    assert.equal(result.success, true);
    assert.equal(
      result.result.branch === null || typeof result.result.branch === 'string',
      true
    );
    assert.equal(result.result.message.length > 0, true);
    assert.equal(result.result.reason_code, 'AI_GATE_ALLOWED');
    assert.equal(result.result.instruction.length > 0, true);
    assert.equal(typeof result.result.prewrite_effective.mode, 'string');
    assert.equal(typeof result.result.prewrite_effective.source, 'string');
    assert.equal(typeof result.result.prewrite_effective.blocking, 'boolean');
    assert.equal(typeof result.result.prewrite_effective.strict_policy, 'boolean');
    assert.equal(result.result.next_action.reason, 'AI_GATE_ALLOWED');
    assert.equal(result.result.next_action.kind, 'info');
    assert.equal(result.result.next_action.message.length > 0, true);
    assert.ok(Array.isArray(result.result.warnings));
    assert.ok(Array.isArray(result.result.auto_fixes));
    assert.equal(result.result.stage, 'PRE_WRITE');
    assert.equal(result.result.consistency_hint.comparable_with_hook_runner, true);
    assert.equal(result.result.consistency_hint.reason_code, null);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('runEnterpriseAiGateCheck incorpora learning_context y auto_fix recomendado cuando existe learning.json activo', async () => {
  await withLearningContextMode('advisory', async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-aigate-learning-'));
    try {
      runGit(repoRoot, ['init', '-b', 'feature/mcp-learning']);
      runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
      runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
      runGit(repoRoot, ['config', '--local', 'pumuki.sdd.session.active', 'true']);
      runGit(repoRoot, ['config', '--local', 'pumuki.sdd.session.change', 'rgo-1700-11']);
      mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
      mkdirSync(join(repoRoot, 'openspec', 'changes', 'rgo-1700-11'), { recursive: true });
      writeFileSync(
        join(repoRoot, 'openspec', 'changes', 'rgo-1700-11', 'learning.json'),
        JSON.stringify(
          {
            generated_at: '2026-03-05T10:20:00.000Z',
            failed_patterns: [],
            successful_patterns: ['sync-docs.completed'],
            rule_updates: ['evidence.bootstrap.required'],
            gate_anomalies: [],
          },
          null,
          2
        ),
        'utf8'
      );
      const evidence: AiEvidenceV2_1 = {
        version: '2.1',
        timestamp: new Date().toISOString(),
        snapshot: {
          stage: 'PRE_WRITE',
          outcome: 'PASS',
          rules_coverage: {
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
          findings: [],
        },
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
        platforms: {},
        rulesets: [],
        ledger: [],
        human_intent: null,
      };
      evidence.evidence_chain = buildEvidenceChain({ evidence });
      writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');

      const result = runEnterpriseAiGateCheck({
        repoRoot,
        stage: 'PRE_WRITE',
      });

      assert.equal(result.result.learning_context?.change, 'rgo-1700-11');
      assert.equal(
        result.result.auto_fixes.some((item) => item.includes('Regenera evidencia')),
        true
      );
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});

test('runEnterpriseAiGateCheck oculta learning_context cuando el feature sigue default-off', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-aigate-learning-off-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/mcp-learning-off']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    runGit(repoRoot, ['config', '--local', 'pumuki.sdd.session.active', 'true']);
    runGit(repoRoot, ['config', '--local', 'pumuki.sdd.session.change', 'rgo-1700-12']);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    mkdirSync(join(repoRoot, 'openspec', 'changes', 'rgo-1700-12'), { recursive: true });
    writeFileSync(
      join(repoRoot, 'openspec', 'changes', 'rgo-1700-12', 'learning.json'),
      JSON.stringify(
        {
          generated_at: '2026-03-05T10:20:00.000Z',
          rule_updates: ['evidence.bootstrap.required'],
        },
        null,
        2
      ),
      'utf8'
    );
    const evidence: AiEvidenceV2_1 = {
      version: '2.1',
      timestamp: new Date().toISOString(),
      snapshot: {
        stage: 'PRE_WRITE',
        outcome: 'PASS',
        rules_coverage: {
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
        findings: [],
      },
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
    };
    evidence.evidence_chain = buildEvidenceChain({ evidence });
    writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');

    const result = runEnterpriseAiGateCheck({
      repoRoot,
      stage: 'PRE_WRITE',
    });

    assert.equal(result.result.learning_context, null);
    assert.equal(
      result.result.auto_fixes.some((item) => item.includes('Regenera evidencia')),
      false
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('runEnterpriseAiGateCheck expone hint de precedencia cuando PRE_PUSH bloquea por evidencia refrescable', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-aigate-prepush-hint-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/mcp-chain']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    writeFileSync(join(repoRoot, 'README.md'), '# temp\n', 'utf8');
    runGit(repoRoot, ['add', 'README.md']);
    runGit(repoRoot, ['commit', '-m', 'chore: bootstrap']);

    const result = runEnterpriseAiGateCheck({
      repoRoot,
      stage: 'PRE_PUSH',
    });

    assert.equal(result.result.stage, 'PRE_PUSH');
    assert.equal(typeof result.result.allowed, 'boolean');
    assert.equal(result.result.message.length > 0, true);
    assert.equal(result.result.auto_fixes.length > 0, true);
    assert.equal(result.result.consistency_hint.comparable_with_hook_runner, false);
    assert.equal(result.result.consistency_hint.reason_code, 'HOOK_RUNNER_CAN_REFRESH_EVIDENCE');
    assert.equal(
      result.result.consistency_hint.message.includes('Hook stage runners may regenerate evidence'),
      true
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('runEnterpriseAiGateCheck marca precedencia para códigos EVIDENCE_* legacy no listados explícitamente', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-aigate-legacy-evidence-code-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/mcp-chain']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    writeFileSync(join(repoRoot, 'README.md'), '# temp\n', 'utf8');
    runGit(repoRoot, ['add', 'README.md']);
    runGit(repoRoot, ['commit', '-m', 'chore: bootstrap']);

    const baseline = evaluateAiGate({
      repoRoot,
      stage: 'PRE_PUSH',
    });

    const result = runEnterpriseAiGateCheck(
      {
        repoRoot,
        stage: 'PRE_PUSH',
      },
      {
        evaluateAiGate: () => ({
          ...baseline,
          status: 'BLOCKED',
          allowed: false,
          violations: [
            {
              code: 'EVIDENCE_INTEGRITY_MISSING',
              severity: 'ERROR',
              message: 'Evidence integrity metadata is missing.',
            },
          ],
        }),
      }
    );

    assert.equal(typeof result.result.allowed, 'boolean');
    assert.equal(result.result.auto_fixes.length, 0);
    assert.equal(result.result.consistency_hint.comparable_with_hook_runner, false);
    assert.equal(result.result.consistency_hint.reason_code, 'HOOK_RUNNER_CAN_REFRESH_EVIDENCE');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('runEnterpriseAiGateCheckAsync por defecto mantiene semántica read-only y coincide con sync', async () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-aigate-async-policy-default-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/mcp-chain']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    const evidence: AiEvidenceV2_1 = {
      version: '2.1',
      timestamp: new Date().toISOString(),
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
    };
    evidence.evidence_chain = buildEvidenceChain({ evidence });
    writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');

    const syncResult = runEnterpriseAiGateCheck({
      repoRoot,
      stage: 'PRE_WRITE',
    });
    const asyncResult = await runEnterpriseAiGateCheckAsync(
      {
        repoRoot,
        stage: 'PRE_WRITE',
      },
      {
        runMcpAlignedPlatformGate: async () => {
          throw new Error('runMcpAlignedPlatformGate no debería ejecutarse en modo policy por defecto');
        },
      }
    );

    assert.equal(asyncResult.success, syncResult.success);
    assert.equal(asyncResult.result.allowed, syncResult.result.allowed);
    assert.equal(asyncResult.result.message, syncResult.result.message);
    assert.equal(asyncResult.result.platform_gate_alignment, undefined);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('runEnterpriseAiGateCheckAsync en modo full lee evidencia actual antes del platform gate', async () => {
  await withAiGateCheckMode('full', async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-aigate-async-preserve-evidence-'));
    try {
      runGit(repoRoot, ['init', '-b', 'feature/mcp-async-order']);
      runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
      runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
      mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });

      const result = await runEnterpriseAiGateCheckAsync(
        {
          repoRoot,
          stage: 'PRE_WRITE',
        },
        {
          runMcpAlignedPlatformGate: async () => {
            const freshEvidence: AiEvidenceV2_1 = {
              version: '2.1',
              timestamp: new Date().toISOString(),
              snapshot: {
                stage: 'PRE_WRITE',
                outcome: 'PASS',
                rules_coverage: {
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
                findings: [],
              },
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
            };
            freshEvidence.evidence_chain = buildEvidenceChain({ evidence: freshEvidence });
            writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(freshEvidence, null, 2), 'utf8');
            return { exitCode: 0, aligned: true, skipReason: null };
          },
        }
      );

      assert.equal(result.success, false);
      assert.equal(result.result.allowed, false);
      assert.equal(result.result.status, 'BLOCKED');
      assert.equal(
        result.result.violations.some((violation) => violation.code === 'EVIDENCE_MISSING'),
        true
      );
      assert.equal(result.result.platform_gate_alignment?.mode, 'full');
      assert.equal(result.result.platform_gate_alignment?.exit_code, 0);
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});

test('runEnterpriseAiGateCheck incluye warning explícito en ramas protegidas', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-aigate-protected-branch-warning-'));
  try {
    runGit(repoRoot, ['init', '-b', 'main']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    writeFileSync(join(repoRoot, 'README.md'), '# protected-branch\n', 'utf8');
    runGit(repoRoot, ['add', 'README.md']);
    runGit(repoRoot, ['commit', '-m', 'chore: bootstrap protected branch']);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    const evidence: AiEvidenceV2_1 = {
      version: '2.1',
      timestamp: new Date().toISOString(),
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
      platforms: {},
      rulesets: [],
      ledger: [],
      human_intent: null,
    };
    evidence.evidence_chain = buildEvidenceChain({ evidence });
    writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');

    const result = runEnterpriseAiGateCheck({
      repoRoot,
      stage: 'PRE_COMMIT',
    });

    assert.equal(typeof result.result.allowed, 'boolean');
    assert.equal(
      result.result.warnings.some((warning) => warning.startsWith('ON_PROTECTED_BRANCH:')),
      true
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('runEnterpriseAiGateCheck bloquea rama con naming GitFlow inválido y expone auto-fix', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-aigate-invalid-branch-'));
  try {
    runGit(repoRoot, ['init', '-b', 'topic/inc-076']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    writeFileSync(join(repoRoot, 'README.md'), '# invalid-branch\n', 'utf8');
    runGit(repoRoot, ['add', 'README.md']);
    runGit(repoRoot, ['commit', '-m', 'chore: bootstrap invalid branch']);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    const evidence: AiEvidenceV2_1 = {
      version: '2.1',
      timestamp: new Date().toISOString(),
      snapshot: {
        stage: 'PRE_WRITE',
        outcome: 'PASS',
        rules_coverage: {
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
        findings: [],
      },
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
      platforms: {},
      rulesets: [],
      ledger: [],
      human_intent: null,
    };
    evidence.evidence_chain = buildEvidenceChain({ evidence });
    writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');

    const result = runEnterpriseAiGateCheck({
      repoRoot,
      stage: 'PRE_WRITE',
    });

    assert.equal(result.success, false);
    assert.equal(result.result.status, 'BLOCKED');
    assert.equal(result.result.violations[0]?.code, 'GITFLOW_BRANCH_NAMING_INVALID');
    assert.equal(result.result.reason_code, 'GITFLOW_BRANCH_NAMING_INVALID');
    assert.equal(result.result.instruction.length > 0, true);
    assert.equal(result.result.next_action.reason, 'GITFLOW_BRANCH_NAMING_INVALID');
    assert.equal(result.result.next_action.kind, 'info');
    assert.equal(result.result.next_action.message.length > 0, true);
    assert.equal(
      result.result.auto_fixes.some((item) => item.includes('prefijo GitFlow válido')),
      true
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
