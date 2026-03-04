import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runEnterpriseAiGateCheck } from '../aiGateCheck';
import { runEnterprisePreFlightCheck } from '../preFlightCheck';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

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
    assert.equal(preFlightResult.result.hints.length > 0, true);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
