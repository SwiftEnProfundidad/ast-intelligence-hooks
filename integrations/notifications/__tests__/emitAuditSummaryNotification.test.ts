import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import {
  emitGateBlockedNotification,
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
  findings?: AiEvidenceV2_1['snapshot']['findings'];
}): AiEvidenceV2_1 =>
  ({
    version: '2.1',
    timestamp: '2026-02-23T00:00:00.000Z',
    snapshot: {
      stage: 'PRE_COMMIT',
      outcome: params.totalViolations > 0 ? 'WARN' : 'PASS',
      findings: params.findings ?? [],
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

test('emitAuditSummaryNotificationFromEvidence emite gate.blocked accionable si hay causa en evidence', () => {
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
          findings: [
            {
              ruleId: 'skills.ios.prefer-swift-testing',
              code: 'SKILLS_IOS_PREFER_SWIFT_TESTING',
              severity: 'ERROR',
              file: 'apps/ios/Test.swift',
              lines: [12],
              message: 'XCTest usado en test nuevo.',
              expected_fix: 'Usa Swift Testing.',
              blocking: true,
            } as AiEvidenceV2_1['snapshot']['findings'][number],
          ],
        }),
      emitSystemNotification: ({ event }) => {
        events.push(event);
        return { delivered: true, reason: 'delivered' };
      },
    }
  );

  assert.deepEqual(result, { delivered: true, reason: 'delivered' });
  assert.equal(events.length, 1);
  const firstEvent = events[0] as {
    kind?: string;
    totalViolations?: number;
    blockingCauses?: ReadonlyArray<{ ruleId?: string; file?: string; message?: string; remediation?: string }>;
  };
  assert.equal(firstEvent.kind, 'gate.blocked');
  assert.equal(firstEvent.totalViolations, 3);
  assert.equal(firstEvent.blockingCauses?.[0]?.ruleId, 'skills.ios.prefer-swift-testing');
  assert.equal(firstEvent.blockingCauses?.[0]?.file, 'apps/ios/Test.swift');
  assert.match(firstEvent.blockingCauses?.[0]?.message ?? '', /lines=12/);
  assert.equal(firstEvent.blockingCauses?.[0]?.remediation, 'Usa Swift Testing.');
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

test('toAuditSummaryEventFromAiGate emite gate.blocked si hay violaciones en AI Gate', () => {
  const event = toAuditSummaryEventFromAiGate({
    aiGateResult: {
      violations: [
        { code: 'E1', message: 'error', severity: 'ERROR' },
        { code: 'W1', message: 'warn', severity: 'WARN' },
        { code: 'E2', message: 'error', severity: 'ERROR' },
      ],
    },
    stage: 'PRE_COMMIT',
  });
  assert.equal(event.kind, 'gate.blocked');
  if (event.kind !== 'gate.blocked') {
    assert.fail('Expected gate.blocked event');
  }
  assert.equal(event.totalViolations, 3);
  assert.equal(event.stage, 'PRE_COMMIT');
  assert.equal(event.blockingCauses?.[0]?.code, 'E1');
  assert.equal(event.blockingCauses?.[0]?.message, 'error');
});

test('toAuditSummaryEventFromAiGate extrae causa skill anidada con fichero real', () => {
  const event = toAuditSummaryEventFromAiGate({
    aiGateResult: {
      violations: [
        {
          code: 'EVIDENCE_GATE_BLOCKED',
          severity: 'ERROR',
          message:
            'Evidence AI gate status is BLOCKED. Blocking causes: 1) skills.backend.no-empty-catch severity=CRITICAL code=SKILLS_SKILLS_BACKEND_NO_EMPTY_CATCH file=apps/backend/src/admin/repositories/reporting/notification.repository.ts lines=63 message=Disallow empty catch blocks in backend runtime code. || 2) skills.ios.guideline.ios-swiftui-expert.use-relative-layout-over-hard-coded-constants severity=WARN file=apps/ios/View.swift lines=22 message=Use relative layout over hard-coded constants',
        },
      ],
    },
    stage: 'PRE_WRITE',
  });

  assert.equal(event.kind, 'gate.blocked');
  if (event.kind !== 'gate.blocked') {
    assert.fail('Expected gate.blocked event');
  }
  assert.equal(event.blockingCauses?.[0]?.ruleId, 'skills.backend.no-empty-catch');
  assert.equal(
    event.blockingCauses?.[0]?.file,
    'apps/backend/src/admin/repositories/reporting/notification.repository.ts'
  );
  assert.match(event.blockingCauses?.[0]?.message ?? '', /message=Disallow empty catch blocks/);
  assert.doesNotMatch(event.blockingCauses?.[0]?.message ?? '', /2\) skills\.ios/);
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

test('emitGateBlockedNotification añade contexto de tracking al evento emitido', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-notification-tracking-'));
  try {
    mkdirSync(join(repoRoot, 'docs'), { recursive: true });
    writeFileSync(
      join(repoRoot, 'docs', 'RURALGO_SEGUIMIENTO.md'),
      '| Estado | Task | Descripción |\n| --- | --- | --- |\n| 🚧 | RGO-1900-01 | Slice activo |\n',
      'utf8'
    );

    const events: unknown[] = [];
    const result = emitGateBlockedNotification(
      {
        repoRoot,
        stage: 'PRE_WRITE',
        totalViolations: 1,
        causeCode: 'EVIDENCE_GATE_BLOCKED',
        causeMessage: 'Evidence AI gate status is BLOCKED.',
        remediation: 'pumuki policy reconcile --strict --json',
      },
      {
        emitSystemNotification: ({ event }) => {
          events.push(event);
          return { delivered: true, reason: 'delivered' };
        },
      }
    );

    assert.deepEqual(result, { delivered: true, reason: 'delivered' });
    const [event] = events as Array<{ causeMessage?: string }>;
    assert.match(event?.causeMessage ?? '', /active_entries=RGO-1900-01@L3/);
    assert.match(event?.causeMessage ?? '', /tracking_source=docs\/RURALGO_SEGUIMIENTO\.md/);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('emitGateBlockedNotification materializa skill anidada dentro de EVIDENCE_GATE_BLOCKED', () => {
  const events: unknown[] = [];
  const result = emitGateBlockedNotification(
    {
      repoRoot: '/tmp/repo',
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      causeCode: 'EVIDENCE_GATE_BLOCKED',
      causeMessage: 'Evidence AI gate status is BLOCKED. Blocking causes: 1) skills.ios.prefer-swift-testing XCTest - Solo para proyectos legacy o UI tests',
      remediation: 'Corrige la violación indicada y vuelve a intentar el commit.',
      blockingCauses: [
        {
          code: 'EVIDENCE_GATE_BLOCKED',
          message: 'Evidence AI gate status is BLOCKED. Blocking causes: 1) skills.ios.prefer-swift-testing XCTest - Solo para proyectos legacy o UI tests',
          remediation: 'Corrige la violación indicada y vuelve a intentar el commit.',
        },
      ],
    },
    {
      emitSystemNotification: ({ event }) => {
        events.push(event);
        return { delivered: true, reason: 'delivered' };
      },
    }
  );

  assert.deepEqual(result, { delivered: true, reason: 'delivered' });
  const [event] = events as Array<{
    blockingCauses?: ReadonlyArray<{ code?: string; ruleId?: string; message?: string; remediation?: string }>;
  }>;
  assert.equal(event?.blockingCauses?.[0]?.code, 'SKILLS_IOS_PREFER_SWIFT_TESTING');
  assert.equal(event?.blockingCauses?.[0]?.ruleId, 'skills.ios.prefer-swift-testing');
  assert.match(event?.blockingCauses?.[0]?.message ?? '', /message=XCTest - Solo para proyectos legacy o UI tests/);
  assert.doesNotMatch(event?.blockingCauses?.[0]?.remediation ?? '', /violación indicada/);
});
