import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAuditSummaryPayload } from '../framework-menu-system-notifications-payloads-audit';

test('buildAuditSummaryPayload mantiene contrato legacy para audit summary con bloqueos', () => {
  const payload = buildAuditSummaryPayload({
    kind: 'audit.summary',
    totalViolations: 12,
    criticalViolations: 3,
    highViolations: 4,
  });

  assert.equal(payload.title, 'AST Audit Complete');
  assert.match(payload.message, /3 CRITICAL, 4 HIGH/i);
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
