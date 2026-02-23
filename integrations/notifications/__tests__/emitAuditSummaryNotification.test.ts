import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import {
  emitAuditSummaryNotificationFromAiGate,
  emitAuditSummaryNotificationFromEvidence,
  shouldEmitAuditSummaryNotificationForStage,
  toAuditSummaryEventFromAiGate,
  toAuditSummaryEventFromEvidence,
} from '../emitAuditSummaryNotification';

const buildEvidence = (params: {
  totalViolations: number;
  critical: number;
  high: number;
  warn?: number;
  info?: number;
  includeEnterpriseSeverity?: boolean;
}): AiEvidenceV2_1 =>
  ({
    version: '2.1',
    timestamp: '2026-02-23T00:00:00.000Z',
    snapshot: {
      stage: 'PRE_COMMIT',
      outcome: params.totalViolations > 0 ? 'WARN' : 'PASS',
      findings: [],
    },
    ledger: [],
    platforms: {},
    rulesets: [],
    human_intent: null,
    ai_gate: {
      status: params.totalViolations > 0 ? 'BLOCKED' : 'ALLOWED',
      violations: [],
      human_intent: null,
    },
    severity_metrics: {
      gate_status: params.totalViolations > 0 ? 'BLOCKED' : 'ALLOWED',
      total_violations: params.totalViolations,
      by_severity: {
        CRITICAL: params.critical,
        ERROR: params.high,
        WARN: params.warn ?? 0,
        INFO: params.info ?? 0,
      },
      by_enterprise_severity: params.includeEnterpriseSeverity
        ? {
          CRITICAL: params.critical,
          HIGH: params.high,
          MEDIUM: params.warn ?? 0,
          LOW: params.info ?? 0,
        }
        : undefined,
    },
  }) as AiEvidenceV2_1;

test('shouldEmitAuditSummaryNotificationForStage desactiva CI por defecto', () => {
  assert.equal(shouldEmitAuditSummaryNotificationForStage('PRE_COMMIT', {}), true);
  assert.equal(shouldEmitAuditSummaryNotificationForStage('PRE_PUSH', {}), true);
  assert.equal(shouldEmitAuditSummaryNotificationForStage('PRE_WRITE', {}), true);
  assert.equal(shouldEmitAuditSummaryNotificationForStage('CI', {}), false);
  assert.equal(shouldEmitAuditSummaryNotificationForStage('CI', { PUMUKI_NOTIFY_CI: '1' }), true);
});

test('toAuditSummaryEventFromEvidence prioriza severidad enterprise cuando existe', () => {
  const event = toAuditSummaryEventFromEvidence(
    buildEvidence({
      totalViolations: 6,
      critical: 2,
      high: 3,
      warn: 1,
      includeEnterpriseSeverity: true,
    })
  );
  assert.equal(event.kind, 'audit.summary');
  if (event.kind !== 'audit.summary') {
    assert.fail('Expected audit.summary event');
  }
  assert.equal(event.totalViolations, 6);
  assert.equal(event.criticalViolations, 2);
  assert.equal(event.highViolations, 3);
});

test('toAuditSummaryEventFromEvidence usa fallback legacy por severidad si no hay enterprise', () => {
  const event = toAuditSummaryEventFromEvidence(
    buildEvidence({
      totalViolations: 4,
      critical: 1,
      high: 2,
      warn: 1,
      includeEnterpriseSeverity: false,
    })
  );
  assert.equal(event.kind, 'audit.summary');
  if (event.kind !== 'audit.summary') {
    assert.fail('Expected audit.summary event');
  }
  assert.equal(event.totalViolations, 4);
  assert.equal(event.criticalViolations, 1);
  assert.equal(event.highViolations, 2);
});

test('emitAuditSummaryNotificationFromEvidence retorna missing-evidence cuando no existe evidencia', () => {
  const result = emitAuditSummaryNotificationFromEvidence(
    {
      repoRoot: '/tmp/pumuki-not-found',
      stage: 'PRE_COMMIT',
    },
    {
      readEvidence: () => undefined,
      emitSystemNotification: () => ({ delivered: true, reason: 'delivered' }),
    }
  );
  assert.deepEqual(result, {
    delivered: false,
    reason: 'missing-evidence',
  });
});

test('emitAuditSummaryNotificationFromEvidence emite notificación en PRE_COMMIT', () => {
  const events: unknown[] = [];
  const result = emitAuditSummaryNotificationFromEvidence(
    {
      repoRoot: '/tmp/repo',
      stage: 'PRE_COMMIT',
    },
    {
      readEvidence: () =>
        buildEvidence({
          totalViolations: 3,
          critical: 1,
          high: 2,
          includeEnterpriseSeverity: true,
        }),
      emitSystemNotification: ({ event }) => {
        events.push(event);
        return { delivered: true, reason: 'delivered' };
      },
    }
  );

  assert.deepEqual(result, { delivered: true, reason: 'delivered' });
  assert.equal(events.length, 1);
  const firstEvent = events[0] as { kind?: string; totalViolations?: number };
  assert.equal(firstEvent.kind, 'audit.summary');
  assert.equal(firstEvent.totalViolations, 3);
});

test('emitAuditSummaryNotificationFromEvidence no emite en CI salvo override explícito', () => {
  const resultDisabled = emitAuditSummaryNotificationFromEvidence(
    {
      repoRoot: '/tmp/repo',
      stage: 'CI',
    },
    {
      env: {},
      readEvidence: () =>
        buildEvidence({
          totalViolations: 1,
          critical: 1,
          high: 0,
        }),
      emitSystemNotification: () => ({ delivered: true, reason: 'delivered' }),
    }
  );
  assert.deepEqual(resultDisabled, {
    delivered: false,
    reason: 'ci-disabled',
  });

  const resultEnabled = emitAuditSummaryNotificationFromEvidence(
    {
      repoRoot: '/tmp/repo',
      stage: 'CI',
    },
    {
      env: {
        PUMUKI_NOTIFY_CI: '1',
      },
      readEvidence: () =>
        buildEvidence({
          totalViolations: 1,
          critical: 1,
          high: 0,
        }),
      emitSystemNotification: () => ({ delivered: true, reason: 'delivered' }),
    }
  );
  assert.deepEqual(resultEnabled, { delivered: true, reason: 'delivered' });
});

test('toAuditSummaryEventFromAiGate mapea ERROR/WARN a CRITICAL/HIGH', () => {
  const event = toAuditSummaryEventFromAiGate({
    aiGateResult: {
      violations: [
        { code: 'E1', message: 'error', severity: 'ERROR' },
        { code: 'W1', message: 'warn', severity: 'WARN' },
        { code: 'E2', message: 'error', severity: 'ERROR' },
      ],
    },
  });
  assert.equal(event.kind, 'audit.summary');
  if (event.kind !== 'audit.summary') {
    assert.fail('Expected audit.summary event');
  }
  assert.equal(event.totalViolations, 3);
  assert.equal(event.criticalViolations, 2);
  assert.equal(event.highViolations, 1);
});

test('emitAuditSummaryNotificationFromAiGate emite notificación para PRE_WRITE', () => {
  const events: unknown[] = [];
  const result = emitAuditSummaryNotificationFromAiGate(
    {
      repoRoot: '/tmp/repo',
      stage: 'PRE_WRITE',
      aiGateResult: {
        violations: [{ code: 'E1', message: 'error', severity: 'ERROR' }],
      },
    },
    {
      emitSystemNotification: ({ event }) => {
        events.push(event);
        return { delivered: true, reason: 'delivered' };
      },
    }
  );
  assert.deepEqual(result, { delivered: true, reason: 'delivered' });
  assert.equal(events.length, 1);
});
