import assert from 'node:assert/strict';
import test from 'node:test';
import { runConsumerPreflight } from '../framework-menu-consumer-preflight-lib';

test('runConsumerPreflight genera hints operativos y eventos de notificación en BLOCK', () => {
  const events: string[] = [];
  const result = runConsumerPreflight(
    {
      repoRoot: '/tmp/repo',
      stage: 'PRE_PUSH',
    },
    {
      evaluateAiGate: () => ({
        stage: 'PRE_PUSH',
        status: 'BLOCKED',
        allowed: false,
        policy: {
          stage: 'PRE_PUSH',
          resolved_stage: 'PRE_PUSH',
          block_on_or_above: 'ERROR',
          warn_on_or_above: 'WARN',
          trace: { source: 'default', bundle: 'gate-policy.default.PRE_PUSH', hash: 'hash' },
        },
        evidence: {
          kind: 'valid',
          max_age_seconds: 1800,
          age_seconds: 2400,
          source: { source: 'local-file', path: '/tmp/repo/.ai_evidence.json', digest: null, generated_at: null },
        },
        repo_state: {
          repo_root: '/tmp/repo',
          git: {
            available: true,
            branch: 'main',
            upstream: null,
            ahead: 0,
            behind: 0,
            dirty: true,
            staged: 2,
            unstaged: 1,
          },
          lifecycle: {
            installed: true,
            package_version: '6.3.17',
            lifecycle_version: '6.3.17',
            hooks: { pre_commit: 'managed', pre_push: 'managed' },
          },
        },
        violations: [
          { code: 'EVIDENCE_STALE', message: 'Evidence is stale', severity: 'ERROR' },
          { code: 'EVIDENCE_GATE_BLOCKED', message: 'Evidence AI gate status is BLOCKED.', severity: 'ERROR' },
          { code: 'GITFLOW_PROTECTED_BRANCH', message: 'Direct work on protected branch "main" is not allowed.', severity: 'ERROR' },
        ],
      }),
      emitSystemNotification: ({ event }) => {
        events.push(event.kind);
        return { delivered: false, reason: 'disabled' };
      },
    }
  );

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.hints.some((hint) => /Evidence stale/i.test(hint)), true);
  assert.equal(result.hints.some((hint) => /EVIDENCE_GATE_BLOCKED/i.test(hint)), true);
  assert.equal(result.hints.some((hint) => /Git-flow/i.test(hint)), true);
  assert.deepEqual(events, ['evidence.stale', 'gitflow.violation', 'gate.blocked']);
});
