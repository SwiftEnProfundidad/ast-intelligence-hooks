import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runEnterpriseAiGateCheck } from '../aiGateCheck';
import { runEnterprisePreFlightCheck } from '../preFlightCheck';
import { buildEvidenceChain } from '../../evidence/evidenceChain';
import type { AiEvidenceV2_1 } from '../../evidence/schema';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

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

test('pre_flight_check comparte evaluador con ai_gate_check y mantiene mismo veredicto', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-preflight-check-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/preflight-parity']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      JSON.stringify(
        {
          version: '2.1',
          timestamp: '2026-01-01T00:00:00.000Z',
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
        },
        null,
        2
      ),
      'utf8'
    );

    const aiGateResult = runEnterpriseAiGateCheck({
      repoRoot,
      stage: 'PRE_COMMIT',
    });
    const preFlightResult = runEnterprisePreFlightCheck({
      repoRoot,
      stage: 'PRE_COMMIT',
    });

    assert.equal(aiGateResult.result.status, preFlightResult.result.status);
    assert.equal(aiGateResult.result.allowed, preFlightResult.result.allowed);
    assert.equal(aiGateResult.result.violations[0]?.code, preFlightResult.result.violations[0]?.code);
    assert.equal(preFlightResult.result.phase, 'RED');
    assert.equal(preFlightResult.result.message.length > 0, true);
    assert.equal(preFlightResult.result.instruction.length > 0, true);
    assert.equal(preFlightResult.result.reason_code.length > 0, true);
    assert.equal(preFlightResult.result.next_action.message.length > 0, true);
    assert.equal(preFlightResult.result.ast_analysis, null);
    assert.equal(preFlightResult.result.tdd_status, null);
    assert.equal(preFlightResult.result.hints.length > 0, true);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('pre_flight_check expone tdd_status bloqueado y corta el flujo cuando el snapshot tdd_bdd está bloqueado', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-preflight-tdd-blocked-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/preflight-tdd-blocked']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
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
        tdd_bdd: {
          status: 'blocked',
          scope: {
            in_scope: true,
            is_new_feature: true,
            is_complex_change: true,
            reasons: ['new_feature', 'complex_change'],
            metrics: {
              changed_files: 2,
              estimated_loc: 160,
              critical_path_files: 1,
              public_interface_files: 1,
            },
          },
          evidence: {
            path: '.pumuki/artifacts/pumuki-evidence-v1.json',
            state: 'valid',
            slices_total: 1,
            slices_valid: 0,
            slices_invalid: 1,
            integrity_ok: true,
            errors: ['TDD_BDD_GREEN_REFACTOR_MUST_PASS'],
          },
          waiver: {
            applied: false,
          },
        },
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
      rulesets: [
        {
          platform: 'skills',
          bundle: 'backend-guidelines@1.0.0',
          hash: 'skills-backend-hash',
        },
      ],
      ledger: [],
      human_intent: null,
    };
    evidence.evidence_chain = buildEvidenceChain({ evidence });
    writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');

    const aiGateResult = runEnterpriseAiGateCheck({
      repoRoot,
      stage: 'PRE_WRITE',
    });
    const preFlightResult = runEnterprisePreFlightCheck({
      repoRoot,
      stage: 'PRE_WRITE',
    });

    assert.equal(aiGateResult.result.allowed, false);
    assert.equal(
      aiGateResult.result.violations.some((violation) => violation.code === 'TDD_BDD_BASELINE_BLOCKED'),
      true
    );
    assert.equal(preFlightResult.result.allowed, false);
    assert.equal(preFlightResult.result.tdd_status, 'blocked');
    assert.equal(preFlightResult.result.reason_code, 'TDD_BDD_BASELINE_BLOCKED');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('pre_flight_check expone phase/message GREEN cuando no hay bloqueos', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-preflight-green-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/preflight-green']);
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
      platforms: {},
      rulesets: [
        {
          platform: 'skills',
          bundle: 'backend-guidelines@1.0.0',
          hash: 'skills-backend-hash',
        },
      ],
      ledger: [],
      human_intent: null,
    };
    evidence.evidence_chain = buildEvidenceChain({ evidence });
    writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');

    const preFlightResult = runEnterprisePreFlightCheck({
      repoRoot,
      stage: 'PRE_COMMIT',
    });

    assert.equal(preFlightResult.result.allowed, true);
    assert.equal(preFlightResult.result.phase, 'GREEN');
    assert.match(preFlightResult.result.message, /pre-flight aprobado/i);
    assert.equal(preFlightResult.result.instruction.length > 0, true);
    assert.equal(preFlightResult.result.reason_code.length > 0, true);
    assert.equal(preFlightResult.result.next_action.kind, 'info');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('pre_flight_check bloquea cuando el tracking canónico entra en conflicto con la documentación del repo', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-preflight-tracking-conflict-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/tracking-conflict']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    mkdirSync(join(repoRoot, 'docs'), { recursive: true });
    writeFileSync(
      join(repoRoot, 'AGENTS.md'),
      [
        '# AGENTS',
        '',
        '- La unica fuente viva del tracking interno es `PUMUKI-RESET-MASTER-PLAN.md`.',
      ].join('\n'),
      'utf8'
    );
    writeFileSync(
      join(repoRoot, 'docs', 'README.md'),
      [
        '# Docs',
        '',
        '- Fuente viva del tracking interno: `docs/tracking/plan-activo-de-trabajo.md`',
      ].join('\n'),
      'utf8'
    );
    writeFileSync(join(repoRoot, 'PUMUKI-RESET-MASTER-PLAN.md'), '- Estado: 🚧\n', 'utf8');

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

    const result = runEnterprisePreFlightCheck({
      repoRoot,
      stage: 'PRE_COMMIT',
    });

    assert.equal(result.result.allowed, false);
    assert.equal(result.result.repo_state.lifecycle.tracking.conflict, true);
    assert.equal(
      result.result.violations.some((violation) => violation.code === 'TRACKING_CANONICAL_SOURCE_CONFLICT'),
      true
    );
    assert.equal(
      result.result.hints.some((hint) => hint.includes('TRACKING_CANONICAL_SOURCE_CONFLICT')),
      true
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('pre_flight_check incorpora learning_context cuando existe learning.json del cambio activo', async () => {
  await withLearningContextMode('advisory', async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-preflight-learning-'));
    try {
      runGit(repoRoot, ['init', '-b', 'feature/preflight-learning']);
      runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
      runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
      runGit(repoRoot, ['config', '--local', 'pumuki.sdd.session.active', 'true']);
      runGit(repoRoot, ['config', '--local', 'pumuki.sdd.session.change', 'rgo-1700-09']);
      mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
      mkdirSync(join(repoRoot, 'openspec', 'changes', 'rgo-1700-09'), { recursive: true });
      writeFileSync(
        join(repoRoot, 'openspec', 'changes', 'rgo-1700-09', 'learning.json'),
        JSON.stringify(
          {
            generated_at: '2026-03-05T10:00:00.000Z',
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

      const result = runEnterprisePreFlightCheck({
        repoRoot,
        stage: 'PRE_WRITE',
      });

      assert.equal(result.result.learning_context?.change, 'rgo-1700-09');
      assert.equal(
        result.result.hints.some((hint) => hint.startsWith('LEARNING_CONTEXT:')),
        true
      );
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});

test('pre_flight_check no expone learning_context cuando el feature se apaga explícitamente', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-preflight-learning-off-'));
  const previousLearningContext = process.env.PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT;
  try {
    process.env.PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT = 'off';
    runGit(repoRoot, ['init', '-b', 'feature/preflight-learning-off']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    runGit(repoRoot, ['config', '--local', 'pumuki.sdd.session.active', 'true']);
    runGit(repoRoot, ['config', '--local', 'pumuki.sdd.session.change', 'rgo-1700-13']);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    mkdirSync(join(repoRoot, 'openspec', 'changes', 'rgo-1700-13'), { recursive: true });
    writeFileSync(
      join(repoRoot, 'openspec', 'changes', 'rgo-1700-13', 'learning.json'),
      JSON.stringify(
        {
          generated_at: '2026-03-05T10:00:00.000Z',
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

    const result = runEnterprisePreFlightCheck({
      repoRoot,
      stage: 'PRE_WRITE',
    });

    assert.equal(result.result.learning_context, null);
    assert.equal(
      result.result.hints.some((hint) => hint.startsWith('LEARNING_CONTEXT:')),
      false
    );
  } finally {
    if (typeof previousLearningContext === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT = previousLearningContext;
    }
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('pre_flight_check expone hint accionable cuando falta cobertura de skills por plataforma detectada', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-preflight-scope-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/preflight-scope']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    const evidence: AiEvidenceV2_1 = {
      version: '2.1',
      timestamp: new Date().toISOString(),
      snapshot: {
        stage: 'PRE_WRITE',
        outcome: 'PASS',
        rules_coverage: {
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
        findings: [],
      },
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

    const preFlightResult = runEnterprisePreFlightCheck({
      repoRoot,
      stage: 'PRE_WRITE',
    });

    assert.equal(preFlightResult.result.allowed, false);
    assert.equal(preFlightResult.result.phase, 'RED');
    assert.equal(preFlightResult.result.reason_code, 'EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE');
    assert.equal(preFlightResult.result.next_action.kind, 'run_command');
    assert.equal(
      preFlightResult.result.violations.some(
        (item) => item.code === 'EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE'
      ),
      true
    );
    assert.equal(
      preFlightResult.result.hints.some((hint) =>
        hint.startsWith('EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE:')
      ),
      true
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('pre_flight_check expone hint accionable de reconcile estricto cuando falta regla crítica iOS en PRE_WRITE', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-preflight-ios-critical-reconcile-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/preflight-ios-critical-reconcile']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    const evidence: AiEvidenceV2_1 = {
      version: '2.1',
      timestamp: new Date().toISOString(),
      snapshot: {
        stage: 'PRE_WRITE',
        outcome: 'PASS',
        rules_coverage: {
          stage: 'PRE_WRITE',
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
        findings: [],
      },
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
        {
          platform: 'skills',
          bundle: 'ios-swift-testing-guidelines@1.0.0',
          hash: 'skills-ios-swift-testing-hash',
        },
        {
          platform: 'skills',
          bundle: 'ios-core-data-guidelines@1.0.0',
          hash: 'skills-ios-core-data-hash',
        },
      ],
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
      ledger: [],
      human_intent: null,
    };
    evidence.evidence_chain = buildEvidenceChain({ evidence });
    writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');

    const preFlightResult = runEnterprisePreFlightCheck({
      repoRoot,
      stage: 'PRE_WRITE',
    });

    assert.equal(preFlightResult.result.allowed, false);
    assert.equal(preFlightResult.result.phase, 'RED');
    assert.equal(preFlightResult.result.reason_code, 'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING');
    assert.equal(preFlightResult.result.next_action.kind, 'run_command');
    assert.equal(
      preFlightResult.result.violations.some(
        (item) => item.code === 'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING'
      ),
      true
    );
    const criticalHint = preFlightResult.result.hints.find((hint) =>
      hint.startsWith('EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING:')
    );
    assert.ok(criticalHint);
    assert.match(criticalHint, /policy reconcile --strict --apply --json/i);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('pre_flight_check expone hint accionable cuando PRE_WRITE supera umbral de higiene de worktree', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-preflight-worktree-hygiene-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/preflight-worktree-hygiene']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
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

    for (let index = 0; index < 30; index += 1) {
      writeFileSync(join(repoRoot, `dirty-file-${index}.txt`), `line-${index}`, 'utf8');
    }

    const preFlightResult = runEnterprisePreFlightCheck({
      repoRoot,
      stage: 'PRE_WRITE',
    });

    assert.equal(preFlightResult.result.allowed, false);
    assert.equal(preFlightResult.result.phase, 'RED');
    assert.equal(
      preFlightResult.result.violations.some(
        (item) => item.code === 'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT'
      ),
      true
    );
    assert.equal(
      preFlightResult.result.hints.some((hint) =>
        hint.startsWith('EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT:')
      ),
      true
    );
    assert.equal(
      preFlightResult.result.hints.some((hint) =>
        hint.startsWith('ATOMIC_SLICES:')
      ),
      true
    );
    assert.equal(
      preFlightResult.result.hints.some((hint) =>
        hint.includes('ATOMIC_SLICES[next]:')
      ),
      true
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('pre_flight_check expone hint accionable cuando PRE_WRITE detecta active_rule_ids vacío para código', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-preflight-active-rule-ids-empty-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/preflight-active-rule-ids-empty']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });

    const evidence: AiEvidenceV2_1 = {
      version: '2.1',
      timestamp: new Date().toISOString(),
      snapshot: {
        stage: 'PRE_WRITE',
        outcome: 'PASS',
        rules_coverage: {
          stage: 'PRE_WRITE',
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
      rulesets: [
        {
          platform: 'skills',
          bundle: 'backend-guidelines@1.0.0',
          hash: 'skills-backend-hash',
        },
      ],
      ledger: [],
      human_intent: null,
    };
    evidence.evidence_chain = buildEvidenceChain({ evidence });
    writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');

    const preFlightResult = runEnterprisePreFlightCheck({
      repoRoot,
      stage: 'PRE_WRITE',
    });

    assert.equal(preFlightResult.result.allowed, false);
    assert.equal(preFlightResult.result.phase, 'RED');
    assert.equal(
      preFlightResult.result.violations.some(
        (item) => item.code === 'EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES'
      ),
      true
    );
    assert.equal(
      preFlightResult.result.hints.some((hint) =>
        hint.startsWith('EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES:')
      ),
      true
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
