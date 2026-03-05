import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import { runLifecycleWatch } from '../watch';

const makeEvidence = (params: {
  outcome: 'ALLOW' | 'WARN' | 'BLOCK';
  findingSeverity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  findingCode: string;
  findingMessage: string;
  aiGateStatus?: 'ALLOWED' | 'BLOCKED';
  aiGateViolationCode?: string;
}): AiEvidenceV2_1 =>
  ({
    timestamp: '2026-03-05T10:00:00.000Z',
    snapshot: {
      outcome: params.outcome,
      findings: [
        {
          ruleId: 'rule.sample',
          severity: params.findingSeverity,
          code: params.findingCode,
          message: params.findingMessage,
          filePath: 'src/sample.ts',
          matchedBy: 'AstRule',
          source: 'skills.backend.sample',
        },
      ],
    },
    ai_gate: {
      status: params.aiGateStatus ?? (params.outcome === 'BLOCK' ? 'BLOCKED' : 'ALLOWED'),
      violations: params.aiGateViolationCode
        ? [{ code: params.aiGateViolationCode, severity: 'ERROR', message: params.findingMessage }]
        : [],
    },
  }) as AiEvidenceV2_1;

test('runLifecycleWatch ejecuta evaluate->notify en cambios de worktree', async () => {
  const blockedNotifications: Array<{ code: string }> = [];
  const summaryNotifications: number[] = [];
  const tickLines: string[] = [];
  let tokenIndex = 0;
  let evalIndex = 0;

  const result = await runLifecycleWatch(
    {
      stage: 'PRE_COMMIT',
      scope: 'workingTree',
      intervalMs: 250,
      notifyCooldownMs: 0,
      severityThreshold: 'high',
      notifyEnabled: true,
      maxIterations: 2,
      onTick: (tick) => {
        tickLines.push(`${tick.tick}:${tick.notification}`);
      },
    },
    {
      resolveRepoRoot: () => '/repo',
      readChangeToken: () => {
        const value = tokenIndex === 0 ? 'A' : 'B';
        tokenIndex += 1;
        return value;
      },
      resolvePolicyForStage: (stage) => ({
        policy: {
          stage,
          blockOnOrAbove: 'ERROR',
          warnOnOrAbove: 'WARN',
        },
        trace: {
          source: 'default',
          bundle: 'default',
          hash: 'hash',
        },
      }),
      runPlatformGate: async () => {
        evalIndex += 1;
        return evalIndex === 1 ? 1 : 0;
      },
      readEvidence: () =>
        evalIndex === 1
          ? makeEvidence({
              outcome: 'BLOCK',
              findingSeverity: 'ERROR',
              findingCode: 'FIRST_BLOCK',
              findingMessage: 'primer bloqueo',
              aiGateStatus: 'BLOCKED',
              aiGateViolationCode: 'FIRST_BLOCK',
            })
          : makeEvidence({
              outcome: 'ALLOW',
              findingSeverity: 'ERROR',
              findingCode: 'SECOND_ALERT',
              findingMessage: 'alerta alta',
              aiGateStatus: 'ALLOWED',
            }),
      emitGateBlockedNotification: (params) => {
        blockedNotifications.push({ code: params.causeCode });
        return { delivered: true, reason: 'delivered' };
      },
      emitAuditSummaryNotificationFromEvidence: () => {
        summaryNotifications.push(1);
        return { delivered: true, reason: 'delivered' };
      },
      nowMs: () => 1000 + evalIndex * 1000,
      sleep: async () => {},
    }
  );

  assert.equal(result.evaluations, 2);
  assert.equal(result.notificationsSent, 2);
  assert.equal(result.notificationsSuppressed, 0);
  assert.deepEqual(blockedNotifications, [{ code: 'FIRST_BLOCK' }]);
  assert.equal(summaryNotifications.length, 1);
  assert.equal(tickLines.length, 2);
});

test('runLifecycleWatch aplica anti-spam por cooldown y firma duplicada', async () => {
  let tokenIndex = 0;
  let nowIndex = 0;
  const nowValues = [1000, 1100];
  const blockedNotifications: Array<{ code: string }> = [];

  const result = await runLifecycleWatch(
    {
      stage: 'PRE_PUSH',
      scope: 'workingTree',
      intervalMs: 250,
      notifyCooldownMs: 60_000,
      severityThreshold: 'high',
      notifyEnabled: true,
      maxIterations: 2,
    },
    {
      resolveRepoRoot: () => '/repo',
      readChangeToken: () => {
        const value = tokenIndex === 0 ? 'A' : 'B';
        tokenIndex += 1;
        return value;
      },
      resolvePolicyForStage: (stage) => ({
        policy: {
          stage,
          blockOnOrAbove: 'ERROR',
          warnOnOrAbove: 'WARN',
        },
        trace: {
          source: 'default',
          bundle: 'default',
          hash: 'hash',
        },
      }),
      runPlatformGate: async () => 1,
      readEvidence: () =>
        makeEvidence({
          outcome: 'BLOCK',
          findingSeverity: 'ERROR',
          findingCode: 'SAME_BLOCK',
          findingMessage: 'bloqueo repetido',
          aiGateStatus: 'BLOCKED',
          aiGateViolationCode: 'SAME_BLOCK',
        }),
      emitGateBlockedNotification: (params) => {
        blockedNotifications.push({ code: params.causeCode });
        return { delivered: true, reason: 'delivered' };
      },
      emitAuditSummaryNotificationFromEvidence: () => ({ delivered: true, reason: 'delivered' }),
      nowMs: () => {
        const value = nowValues[Math.min(nowIndex, nowValues.length - 1)] ?? 0;
        nowIndex += 1;
        return value;
      },
      sleep: async () => {},
    }
  );

  assert.equal(result.evaluations, 2);
  assert.equal(result.notificationsSent, 1);
  assert.equal(result.notificationsSuppressed, 1);
  assert.equal(result.lastTick.notification, 'suppressed-duplicate');
  assert.deepEqual(blockedNotifications, [{ code: 'SAME_BLOCK' }]);
});

test('runLifecycleWatch respeta umbral de severidad y evita alertas por debajo', async () => {
  const result = await runLifecycleWatch(
    {
      stage: 'PRE_COMMIT',
      scope: 'workingTree',
      intervalMs: 250,
      notifyCooldownMs: 0,
      severityThreshold: 'high',
      notifyEnabled: true,
      maxIterations: 1,
    },
    {
      resolveRepoRoot: () => '/repo',
      readChangeToken: () => 'A',
      resolvePolicyForStage: (stage) => ({
        policy: {
          stage,
          blockOnOrAbove: 'ERROR',
          warnOnOrAbove: 'WARN',
        },
        trace: {
          source: 'default',
          bundle: 'default',
          hash: 'hash',
        },
      }),
      runPlatformGate: async () => 0,
      readEvidence: () =>
        makeEvidence({
          outcome: 'WARN',
          findingSeverity: 'WARN',
          findingCode: 'WARN_ONLY',
          findingMessage: 'solo warning',
          aiGateStatus: 'ALLOWED',
        }),
      emitGateBlockedNotification: () => ({ delivered: true, reason: 'delivered' }),
      emitAuditSummaryNotificationFromEvidence: () => ({ delivered: true, reason: 'delivered' }),
      nowMs: () => 1000,
      sleep: async () => {},
    }
  );

  assert.equal(result.evaluations, 1);
  assert.equal(result.notificationsSent, 0);
  assert.equal(result.notificationsSuppressed, 0);
  assert.equal(result.lastTick.notification, 'below-threshold');
  assert.equal(result.lastTick.findingsAtOrAboveThreshold, 0);
});
