import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAuditSummaryPayload } from '../framework-menu-system-notifications-payloads-audit';

test('buildAuditSummaryPayload informa bloqueo para audit summary con violaciones', () => {
  const payload = buildAuditSummaryPayload({
    kind: 'audit.summary',
    totalViolations: 12,
    criticalViolations: 3,
    highViolations: 4,
  });

  assert.equal(payload.title, 'AST Audit Blocked');
  assert.match(payload.message, /3 CRITICAL, 4 HIGH/i);
});

test('buildAuditSummaryPayload informa bloqueo aunque las violaciones no sean high critical', () => {
  const payload = buildAuditSummaryPayload({
    kind: 'audit.summary',
    totalViolations: 2,
    criticalViolations: 0,
    highViolations: 0,
  });

  assert.equal(payload.title, 'AST Audit Blocked');
  assert.match(payload.message, /2 violations block the gate/i);
});

test('buildAuditSummaryPayload informa pass cuando no hay violaciones', () => {
  const payload = buildAuditSummaryPayload({
    kind: 'audit.summary',
    totalViolations: 0,
    criticalViolations: 0,
    highViolations: 0,
  });

  assert.equal(payload.title, 'AST Audit Complete');
  assert.match(payload.message, /No violations found/i);
});
