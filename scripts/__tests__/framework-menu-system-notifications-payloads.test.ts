import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSystemNotificationPayload } from '../framework-menu-system-notifications-payloads';

test('buildSystemNotificationPayload mantiene la fachada pública con contexto de proyecto', () => {
  const payload = buildSystemNotificationPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      causeCode: 'EVIDENCE_STALE',
    },
    {
      repoRoot: '/Users/dev/Projects/SAAS:APP_SUPERMERCADOS',
    }
  );

  assert.match(payload.subtitle ?? '', /SAAS:APP_SUPERMERCADOS/);
  assert.match(payload.subtitle ?? '', /PRE_COMMIT/);
  assert.match(payload.message, /^solución:/i);
});

test('gate.blocked prioriza violaciones skills frente a tracking en notificación visible', () => {
  const payload = buildSystemNotificationPayload(
    {
      kind: 'gate.blocked',
      stage: 'PRE_COMMIT',
      totalViolations: 2,
      causeCode: 'TRACKING_CANONICAL_IN_PROGRESS_INVALID',
      causeMessage: 'Tracking bloqueado: line_970 en PUMUKI-RESET-MASTER-PLAN.md.',
      remediation: 'Corrige el MD de tracking.',
      blockingCauses: [
        {
          code: 'TRACKING_CANONICAL_IN_PROGRESS_INVALID',
          message: 'Tracking bloqueado: line_970 en PUMUKI-RESET-MASTER-PLAN.md.',
          file: 'PUMUKI-RESET-MASTER-PLAN.md',
          remediation: 'Corrige el MD de tracking.',
        },
        {
          code: 'SKILLS_IOS_NO_FORCE_UNWRAP',
          ruleId: 'skills.ios.no-force-unwrap',
          message: 'Force unwrap is not allowed. lines=42',
          file: 'apps/ios/Presentation/LoginView.swift',
          remediation: 'Sustituye el force unwrap por guard let o #require según contexto.',
        },
      ],
    },
    {
      repoRoot: '/Users/dev/Projects/R_GO',
    }
  );

  assert.match(payload.subtitle ?? '', /Skill violada: skills\.ios\.no-force-unwrap/);
  assert.match(payload.subtitle ?? '', /LoginView\.swift:42/);
  assert.doesNotMatch(payload.subtitle ?? '', /Tracking bloqueado/);
  assert.match(payload.message, /Sustituye el force unwrap/);
});
