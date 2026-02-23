import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runEnterpriseAiGateCheck } from '../aiGateCheck';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

test('runEnterpriseAiGateCheck aplica contrato de tool ai_gate_check en PRE_WRITE', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-mcp-aigate-check-'));
  try {
    runGit(repoRoot, ['init', '-b', 'feature/mcp-chain']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      JSON.stringify(
        {
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
        },
        null,
        2
      ),
      'utf8'
    );

    const result = runEnterpriseAiGateCheck({
      repoRoot,
      stage: 'PRE_WRITE',
    });

    assert.equal(result.tool, 'ai_gate_check');
    assert.equal(result.success, true);
    assert.equal(result.result.stage, 'PRE_WRITE');
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
