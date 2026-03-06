import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSystemNotificationPayload } from '../framework-menu-system-notifications-payloads';

test('buildSystemNotificationPayload construye payload para gate BLOCK', () => {
  const payload = buildSystemNotificationPayload({
    kind: 'gate.blocked',
    stage: 'PRE_COMMIT',
    totalViolations: 7,
  });

  assert.match(payload.title, /pumuki/i);
  assert.match(payload.title, /bloqueado/i);
  assert.match(payload.subtitle ?? '', /pre_commit|pre-commit/i);
  assert.match(payload.subtitle ?? '', /7/);
  assert.match(payload.message, /^solución:/i);
  assert.equal(payload.soundName, 'Basso');
});

test('buildSystemNotificationPayload incluye proyecto en subtítulo cuando hay repoRoot', () => {
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
});

test('buildSystemNotificationPayload construye payload para evidencia stale', () => {
  const payload = buildSystemNotificationPayload({
    kind: 'evidence.stale',
    evidencePath: '.ai_evidence.json',
    ageMinutes: 45,
  });

  assert.match(payload.title, /pumuki/i);
  assert.match(payload.title, /evidencia/i);
  assert.match(payload.message, /\.ai_evidence\.json/i);
  assert.match(payload.message, /45/);
});

test('buildSystemNotificationPayload construye payload para violación git-flow', () => {
  const payload = buildSystemNotificationPayload({
    kind: 'gitflow.violation',
    currentBranch: 'main',
    reason: 'commits-direct-to-main',
  });

  assert.match(payload.title, /pumuki/i);
  assert.match(payload.title, /git[- ]?flow/i);
  assert.match(payload.message, /\bmain\b/i);
  assert.match(payload.message, /no cumple/i);
});

test('buildSystemNotificationPayload mantiene contrato legacy para audit summary', () => {
  const blocked = buildSystemNotificationPayload({
    kind: 'audit.summary',
    totalViolations: 12,
    criticalViolations: 3,
    highViolations: 4,
  });
  assert.equal(blocked.title, 'AST Audit Complete');
  assert.match(blocked.message, /3 CRITICAL, 4 HIGH/i);

  const pass = buildSystemNotificationPayload({
    kind: 'audit.summary',
    totalViolations: 0,
    criticalViolations: 0,
    highViolations: 0,
  });
  assert.equal(pass.title, 'AST Audit Complete');
  assert.match(pass.message, /No violations found/i);
});
