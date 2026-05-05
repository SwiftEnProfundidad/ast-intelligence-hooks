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

test('runConsumerPreflight notifica la causa TDD/BDD específica antes que el paraguas de evidencia', () => {
  const blockedEvents: Array<{ causeCode?: string; causeMessage?: string }> = [];
  runConsumerPreflight(
    {
      repoRoot: '/tmp/repo',
      stage: 'PRE_WRITE',
    },
    {
      evaluateAiGate: () => ({
        stage: 'PRE_WRITE',
        status: 'BLOCKED',
        allowed: false,
        policy: {
          stage: 'PRE_WRITE',
          resolved_stage: 'PRE_WRITE',
          block_on_or_above: 'ERROR',
          warn_on_or_above: 'WARN',
          trace: { source: 'default', bundle: 'gate-policy.default.PRE_WRITE', hash: 'hash' },
        },
        evidence: {
          kind: 'valid',
          max_age_seconds: 300,
          age_seconds: 1,
          source: { source: 'local-file', path: '/tmp/repo/.ai_evidence.json', digest: null, generated_at: null },
        },
        repo_state: {
          repo_root: '/tmp/repo',
          git: {
            available: true,
            branch: 'feature/rgo-1900-01',
            upstream: null,
            ahead: 0,
            behind: 0,
            dirty: true,
            staged: 1,
            unstaged: 0,
          },
          lifecycle: {
            installed: true,
            package_version: '6.3.145',
            lifecycle_version: '6.3.145',
            hooks: { pre_commit: 'managed', pre_push: 'managed' },
          },
        },
        violations: [
          {
            code: 'EVIDENCE_GATE_BLOCKED',
            message: 'Evidence AI gate status is BLOCKED.',
            severity: 'ERROR',
          },
          {
            code: 'TDD_BDD_SCENARIO_FILE_MISSING',
            message: 'TDD/BDD scenario file is missing.',
            severity: 'ERROR',
          },
        ],
      }),
      emitSystemNotification: ({ event }) => {
        if (event.kind === 'gate.blocked') {
          blockedEvents.push({
            causeCode: event.causeCode,
            causeMessage: event.causeMessage,
          });
        }
        return { delivered: false, reason: 'disabled' };
      },
    }
  );

  assert.equal(blockedEvents[0]?.causeCode, 'TDD_BDD_SCENARIO_FILE_MISSING');
  assert.match(blockedEvents[0]?.causeMessage ?? '', /scenario file/i);
});
