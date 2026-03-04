import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runEnterpriseAutoExecuteAiStart } from '../autoExecuteAiStart';
import { buildEvidenceChain } from '../../evidence/evidenceChain';
import type { AiEvidenceV2_1 } from '../../evidence/schema';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

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
    assert.equal(result.result.action, 'ask');
    assert.equal(typeof result.result.confidence_pct, 'number');
    assert.equal(result.result.confidence_pct >= 0, true);
    assert.equal(result.result.reason_code.length > 0, true);
    assert.equal(result.result.next_action.message.length > 0, true);
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
    assert.equal(result.result.action, 'proceed');
    assert.equal(result.result.reason_code, 'READY');
    assert.equal(result.result.confidence_pct, 90);
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

    assert.equal(result.result.action, 'ask');
    assert.equal(result.result.reason_code, 'EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE');
    assert.equal(result.result.next_action.kind, 'run_command');
    assert.equal(
      result.result.next_action.message.includes('cobertura de skills por plataforma'),
      true
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
