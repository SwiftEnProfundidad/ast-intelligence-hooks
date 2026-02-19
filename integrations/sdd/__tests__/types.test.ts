import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  OpenSpecValidationSummary,
  SddDecision,
  SddEvaluateResult,
  SddSessionState,
  SddStatusPayload,
} from '../types';

const buildSession = (): SddSessionState => ({
  repoRoot: '/tmp/repo',
  active: true,
  changeId: 'feature-auth',
  updatedAt: '2026-02-18T00:00:00.000Z',
  expiresAt: '2026-02-18T01:00:00.000Z',
  ttlMinutes: 60,
  valid: true,
  remainingSeconds: 1800,
});

const buildDecision = (): SddDecision => ({
  allowed: true,
  code: 'ALLOWED',
  message: 'ok',
  details: { stage: 'PRE_COMMIT' },
});

const buildValidation = (): OpenSpecValidationSummary => ({
  ok: true,
  exitCode: 0,
  stdout: 'valid',
  stderr: '',
  totals: {
    items: 2,
    failed: 0,
    passed: 2,
  },
  issues: {
    errors: 0,
    warnings: 0,
    infos: 1,
  },
});

test('SddStatusPayload typed contract supports runtime-safe construction', () => {
  const status: SddStatusPayload = {
    repoRoot: '/tmp/repo',
    openspec: {
      installed: true,
      version: '1.1.1',
      projectInitialized: true,
      minimumVersion: '1.1.0',
      recommendedVersion: '1.1.1',
      compatible: true,
      parsedVersion: '1.1.1',
    },
    session: buildSession(),
  };

  assert.equal(status.openspec.compatible, true);
  assert.equal(status.session.changeId, 'feature-auth');
  assert.equal(status.session.valid, true);
});

test('SddEvaluateResult typed contract supports decision + validation payload', () => {
  const result: SddEvaluateResult = {
    stage: 'PRE_PUSH',
    decision: buildDecision(),
    status: {
      repoRoot: '/tmp/repo',
      openspec: {
        installed: true,
        projectInitialized: true,
        minimumVersion: '1.1.0',
        recommendedVersion: '1.1.1',
        compatible: true,
      },
      session: buildSession(),
    },
    validation: buildValidation(),
  };

  assert.equal(result.stage, 'PRE_PUSH');
  assert.equal(result.decision.code, 'ALLOWED');
  assert.equal(result.validation?.totals.passed, 2);
  assert.equal(result.validation?.issues.errors, 0);
});
