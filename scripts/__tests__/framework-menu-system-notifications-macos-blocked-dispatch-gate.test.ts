import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldDispatchBlockedMacOsDialog } from '../framework-menu-system-notifications-macos-blocked-dispatch-gate';

test('shouldDispatchBlockedMacOsDialog devuelve false si el evento no es gate.blocked', () => {
  assert.equal(
    shouldDispatchBlockedMacOsDialog({
      event: { kind: 'audit.summary', summary: { totalViolations: 1 } },
      repoRoot: '/tmp/repo',
    }),
    false,
  );
});

test('shouldDispatchBlockedMacOsDialog devuelve false si falta repoRoot', () => {
  assert.equal(
    shouldDispatchBlockedMacOsDialog({
      event: {
        kind: 'gate.blocked',
        code: 'EVIDENCE_STALE',
        stage: 'PRE_WRITE',
        reason: 'stale',
        remediation: 'regenera evidencia',
      },
    }),
    false,
  );
});

test('shouldDispatchBlockedMacOsDialog devuelve true cuando hay gate.blocked y repoRoot', () => {
  assert.equal(
    shouldDispatchBlockedMacOsDialog({
      event: {
        kind: 'gate.blocked',
        code: 'EVIDENCE_STALE',
        stage: 'PRE_WRITE',
        reason: 'stale',
        remediation: 'regenera evidencia',
      },
      repoRoot: '/tmp/repo',
    }),
    true,
  );
});
