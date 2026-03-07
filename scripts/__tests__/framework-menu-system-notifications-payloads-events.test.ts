import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildEvidenceStalePayload,
  buildGitflowViolationPayload,
} from '../framework-menu-system-notifications-payloads-events';

test('buildEvidenceStalePayload construye payload para evidencia stale', () => {
  const payload = buildEvidenceStalePayload({
    kind: 'evidence.stale',
    evidencePath: '.ai_evidence.json',
    ageMinutes: 45,
  });

  assert.match(payload.title, /pumuki/i);
  assert.match(payload.title, /evidencia/i);
  assert.match(payload.message, /\.ai_evidence\.json/i);
  assert.match(payload.message, /45/);
});

test('buildGitflowViolationPayload construye payload para violación git-flow', () => {
  const payload = buildGitflowViolationPayload({
    kind: 'gitflow.violation',
    currentBranch: 'main',
    reason: 'commits-direct-to-main',
  });

  assert.match(payload.title, /pumuki/i);
  assert.match(payload.title, /git[- ]?flow/i);
  assert.match(payload.message, /\bmain\b/i);
  assert.match(payload.message, /no cumple/i);
});
