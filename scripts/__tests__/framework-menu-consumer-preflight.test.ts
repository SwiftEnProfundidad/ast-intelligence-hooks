import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatConsumerPreflight,
  runConsumerPreflight,
} from '../framework-menu-consumer-preflight-lib';

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
          trace: {
            source: 'default',
            bundle: 'gate-policy.default.PRE_PUSH',
            hash: 'hash',
          },
        },
        evidence: {
          kind: 'valid',
          max_age_seconds: 1800,
          age_seconds: 2400,
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
            hooks: {
              pre_commit: 'managed',
              pre_push: 'managed',
            },
          },
        },
        violations: [
          {
            code: 'EVIDENCE_STALE',
            message: 'Evidence is stale',
            severity: 'ERROR',
          },
          {
            code: 'GITFLOW_PROTECTED_BRANCH',
            message: 'Direct work on protected branch "main" is not allowed.',
            severity: 'ERROR',
          },
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
  assert.equal(result.hints.some((hint) => /Git-flow/i.test(hint)), true);
  assert.deepEqual(events, ['evidence.stale', 'gitflow.violation', 'gate.blocked']);
});

test('formatConsumerPreflight renderiza panel legacy con estado de repo e hints', () => {
  const result = runConsumerPreflight(
    {
      repoRoot: '/tmp/repo',
      stage: 'PRE_COMMIT',
    },
    {
      evaluateAiGate: () => ({
        stage: 'PRE_COMMIT',
        status: 'ALLOWED',
        allowed: true,
        policy: {
          stage: 'PRE_COMMIT',
          resolved_stage: 'PRE_COMMIT',
          block_on_or_above: 'ERROR',
          warn_on_or_above: 'WARN',
          trace: {
            source: 'default',
            bundle: 'gate-policy.default.PRE_COMMIT',
            hash: 'hash',
          },
        },
        evidence: {
          kind: 'missing',
          max_age_seconds: 900,
          age_seconds: null,
        },
        repo_state: {
          repo_root: '/tmp/repo',
          git: {
            available: true,
            branch: 'feature/menu',
            upstream: 'origin/feature/menu',
            ahead: 1,
            behind: 0,
            dirty: false,
            staged: 0,
            unstaged: 0,
          },
          lifecycle: {
            installed: true,
            package_version: '6.3.17',
            lifecycle_version: '6.3.17',
            hooks: {
              pre_commit: 'managed',
              pre_push: 'managed',
            },
          },
        },
        violations: [],
      }),
      emitSystemNotification: () => ({ delivered: false, reason: 'disabled' }),
    }
  );

  const rendered = formatConsumerPreflight(result, {
    panelWidth: 80,
    color: false,
  });

  assert.match(rendered, /PRE-FLIGHT CHECK/);
  assert.match(rendered, /Branch: feature\/menu/);
  assert.match(rendered, /Gate: ALLOWED/);
});
