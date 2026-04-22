import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runEnterpriseAutoExecuteAiStart } from '../autoExecuteAiStart';
import { buildEvidenceChain } from '../../evidence/evidenceChain';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import { getCurrentPumukiVersion } from '../../lifecycle/packageInfo';

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

const writeEvidence = (params: {
  repoRoot: string;
  timestamp: string;
  status: 'ALLOWED' | 'BLOCKED';
  snapshotStage?: 'PRE_WRITE' | 'PRE_COMMIT';
}): void => {
  const evidence: AiEvidenceV2_1 = {
    version: '2.1',
    timestamp: params.timestamp,
    snapshot: {
      stage: params.snapshotStage ?? 'PRE_WRITE',
      outcome: params.status === 'ALLOWED' ? 'PASS' : 'BLOCK',
      rules_coverage: {
        stage: params.snapshotStage ?? 'PRE_WRITE',
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
      status: params.status,
      violations: [],
      human_intent: null,
    },
    severity_metrics: {
      gate_status: params.status,
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
  writeFileSync(
    join(params.repoRoot, '.ai_evidence.json'),
    JSON.stringify(evidence, null, 2),
    'utf8'
  );
};

test('auto_execute_ai_start devuelve contrato accionable en bloqueo (confidence_pct/reason_code/next_action)', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-auto-execute-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/auto-execute']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeEvidence({
      repoRoot,
      timestamp: '2026-01-01T00:00:00.000Z',
      status: 'ALLOWED',
    });

    const result = runEnterpriseAutoExecuteAiStart({
      repoRoot,
      stage: 'PRE_WRITE',
    });

    assert.equal(result.tool, 'auto_execute_ai_start');
    assert.equal(result.success, false);
    assert.equal(result.result.action, 'ask');
    assert.equal(result.result.phase, 'RED');
    assert.equal(result.result.message.length > 0, true);
    assert.equal(result.result.instruction.length > 0, true);
    assert.equal(result.result.platforms.force, true);
    assert.equal(typeof result.result.confidence_pct, 'number');
    assert.equal(result.result.confidence_pct >= 0, true);
    assert.equal(result.result.reason_code.length > 0, true);
    assert.equal(result.result.next_action.message.length > 0, true);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('auto_execute_ai_start incorpora learning_context y recomendación cuando existe learning.json activo', async () => {
  await withLearningContextMode('advisory', async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-auto-execute-learning-'));
    try {
      runGit(repoRoot, ['init', '-b', 'feature/auto-execute-learning']);
      runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
      runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
      runGit(repoRoot, ['config', '--local', 'pumuki.sdd.session.active', 'true']);
      runGit(repoRoot, ['config', '--local', 'pumuki.sdd.session.change', 'rgo-1700-10']);
      mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
      mkdirSync(join(repoRoot, 'openspec', 'changes', 'rgo-1700-10'), { recursive: true });
      writeFileSync(
        join(repoRoot, 'openspec', 'changes', 'rgo-1700-10', 'learning.json'),
        JSON.stringify(
          {
            generated_at: '2026-03-05T10:10:00.000Z',
            failed_patterns: ['ai-gate.blocked'],
            successful_patterns: [],
            rule_updates: ['ai-gate.violation.EVIDENCE_STALE.review'],
            gate_anomalies: ['ai-gate.violation.EVIDENCE_STALE'],
          },
          null,
          2
        ),
        'utf8'
      );
      writeEvidence({
        repoRoot,
        timestamp: '2026-01-01T00:00:00.000Z',
        status: 'ALLOWED',
      });

      const result = runEnterpriseAutoExecuteAiStart({
        repoRoot,
        stage: 'PRE_WRITE',
      });

      assert.equal(result.result.action, 'ask');
      assert.equal(result.result.learning_context?.change, 'rgo-1700-10');
      assert.equal(result.result.message.includes('Learning:'), true);
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});

test('auto_execute_ai_start no mezcla learning_context cuando el feature sigue apagado por defecto', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-auto-execute-learning-off-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/auto-execute-learning-off']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    runGit(repoRoot, ['config', '--local', 'pumuki.sdd.session.active', 'true']);
    runGit(repoRoot, ['config', '--local', 'pumuki.sdd.session.change', 'rgo-1700-14']);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    mkdirSync(join(repoRoot, 'openspec', 'changes', 'rgo-1700-14'), { recursive: true });
    writeFileSync(
      join(repoRoot, 'openspec', 'changes', 'rgo-1700-14', 'learning.json'),
      JSON.stringify(
        {
          generated_at: '2026-03-05T10:10:00.000Z',
          rule_updates: ['ai-gate.violation.EVIDENCE_STALE.review'],
        },
        null,
        2
      ),
      'utf8'
    );
    writeEvidence({
      repoRoot,
      timestamp: '2026-01-01T00:00:00.000Z',
      status: 'ALLOWED',
    });

    const result = runEnterpriseAutoExecuteAiStart({
      repoRoot,
      stage: 'PRE_WRITE',
    });

    assert.equal(result.result.learning_context, null);
    assert.equal(result.result.message.includes('Learning:'), false);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('auto_execute_ai_start devuelve proceed cuando gate está en verde', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-auto-execute-allow-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/auto-execute-allow']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeEvidence({
      repoRoot,
      timestamp: new Date().toISOString(),
      status: 'ALLOWED',
      snapshotStage: 'PRE_COMMIT',
    });

    const result = runEnterpriseAutoExecuteAiStart({
      repoRoot,
      stage: 'PRE_COMMIT',
    });

    assert.equal(result.tool, 'auto_execute_ai_start');
    assert.equal(result.success, true);
    assert.equal(result.result.action, 'proceed');
    assert.equal(result.result.phase, 'GREEN');
    assert.equal(result.result.message.includes('Confianza alta'), true);
    assert.equal(result.result.reason_code.length > 0, true);
    assert.equal(result.result.confidence_pct >= 50, true);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('auto_execute_ai_start devuelve next_action de remediación para cobertura de skills por plataforma', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-auto-execute-platform-skills-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/auto-execute-platform-skills']);
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

    const result = runEnterpriseAutoExecuteAiStart({
      repoRoot,
      stage: 'PRE_WRITE',
    });

    assert.equal(result.result.action, 'proceed');
    assert.equal(result.result.phase, 'GREEN');
    assert.equal(result.result.reason_code, 'EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE');
    assert.equal(result.result.next_action.kind, 'info');
    assert.equal(result.result.next_action.message.length > 0, true);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('auto_execute_ai_start devuelve next_action de reconcile cuando PRE_WRITE detecta active_rule_ids vacío para código', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-auto-execute-active-rule-ids-empty-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/auto-execute-active-rule-ids-empty']);
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
      platforms: {},
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
      ledger: [],
      human_intent: null,
    };
    evidence.evidence_chain = buildEvidenceChain({ evidence });
    writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');

    const result = runEnterpriseAutoExecuteAiStart({
      repoRoot,
      stage: 'PRE_WRITE',
    });

    assert.equal(result.result.action, 'ask');
    assert.equal(result.result.phase, 'RED');
    assert.equal(result.result.reason_code, 'EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES');
    assert.equal(result.result.next_action.kind, 'run_command');
    assert.equal(
      result.result.next_action.message.includes('active_rule_ids'),
      true
    );
    assert.equal(
      result.result.next_action.command,
      `npx --yes --package pumuki@${getCurrentPumukiVersion({ repoRoot })} pumuki policy reconcile --strict --json && npx --yes --package pumuki@${getCurrentPumukiVersion({ repoRoot })} pumuki sdd validate --stage=PRE_WRITE --json`
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('auto_execute_ai_start devuelve next_action de reconcile estricto cuando falta regla crítica iOS en PRE_WRITE', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-auto-execute-ios-critical-reconcile-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/auto-execute-ios-critical-reconcile']);
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

    const result = runEnterpriseAutoExecuteAiStart({
      repoRoot,
      stage: 'PRE_WRITE',
    });

    assert.equal(result.result.action, 'proceed');
    assert.equal(result.result.phase, 'GREEN');
    assert.equal(result.result.reason_code, 'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING');
    assert.equal(result.result.next_action.kind, 'info');
    assert.equal(result.result.next_action.message.length > 0, true);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('auto_execute_ai_start devuelve next_action accionable cuando PRE_WRITE supera umbral de higiene de worktree', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-auto-execute-worktree-hygiene-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/auto-execute-worktree-hygiene']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeEvidence({
      repoRoot,
      timestamp: new Date().toISOString(),
      status: 'ALLOWED',
      snapshotStage: 'PRE_WRITE',
    });

    for (let index = 0; index < 30; index += 1) {
      writeFileSync(join(repoRoot, `dirty-file-${index}.txt`), `line-${index}`, 'utf8');
    }

    const result = runEnterpriseAutoExecuteAiStart({
      repoRoot,
      stage: 'PRE_WRITE',
    });

    assert.equal(result.result.action, 'ask');
    assert.equal(result.result.phase, 'RED');
    assert.equal(result.result.reason_code, 'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT');
    assert.equal(result.result.next_action.kind, 'run_command');
    assert.equal(
      result.result.next_action.message.includes('Particiona el worktree en slices atómicos'),
      true
    );
    assert.equal(
      (result.result.next_action.command ?? '').startsWith('git add -- '),
      true
    );
    assert.equal(
      (result.result.next_action.command ?? '').includes(
        'pumuki sdd validate --stage=PRE_WRITE --json'
      ),
      true
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('auto_execute_ai_start remedia evidence_chain_invalid como fallo accionable de evidencia', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-auto-execute-evidence-chain-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/auto-execute-evidence-chain']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeEvidence({
      repoRoot,
      timestamp: new Date().toISOString(),
      status: 'ALLOWED',
    });

    const evidencePath = join(repoRoot, '.ai_evidence.json');
    const evidence = JSON.parse(readFileSync(evidencePath, 'utf8')) as AiEvidenceV2_1;
    evidence.evidence_chain = {
      ...evidence.evidence_chain!,
      payload_hash: 'sha256:broken',
    };
    writeFileSync(evidencePath, JSON.stringify(evidence, null, 2), 'utf8');

    const result = runEnterpriseAutoExecuteAiStart({
      repoRoot,
      stage: 'PRE_WRITE',
    });

    assert.equal(result.result.action, 'ask');
    assert.equal(result.result.phase, 'RED');
    assert.equal(result.result.reason_code, 'EVIDENCE_CHAIN_INVALID');
    assert.equal(result.result.confidence_pct, 65);
    assert.equal(result.result.next_action.kind, 'run_command');
    assert.equal(
      result.result.next_action.message.includes('evidencia'),
      true
    );
    assert.equal(
      result.result.next_action.command,
      `npx --yes --package pumuki@${getCurrentPumukiVersion({ repoRoot })} pumuki sdd validate --stage=PRE_WRITE --json`
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
