import assert from 'node:assert/strict';
import test from 'node:test';
import { determineWindsurfSessionVerdict } from '../windsurf-session-status-lib';

test('returns BLOCKED when runtime verify command fails', () => {
  const verdict = determineWindsurfSessionVerdict({
    verifyExitCode: 1,
    strictOutput: '[pumuki:cascade-hooks] session-assessment=PASS',
    anyOutput: '[pumuki:cascade-hooks] session-assessment=PASS',
  });

  assert.equal(verdict, 'BLOCKED');
});

test('returns PASS when strict session assessment passes', () => {
  const verdict = determineWindsurfSessionVerdict({
    verifyExitCode: 0,
    strictOutput: '[pumuki:cascade-hooks] session-assessment=PASS',
    anyOutput: '[pumuki:cascade-hooks] session-assessment=FAIL',
  });

  assert.equal(verdict, 'PASS');
});

test('returns NEEDS_REAL_SESSION when strict fails but include-simulated mode passes', () => {
  const verdict = determineWindsurfSessionVerdict({
    verifyExitCode: 0,
    strictOutput: '[pumuki:cascade-hooks] session-assessment=FAIL',
    anyOutput: '[pumuki:cascade-hooks] session-assessment=PASS',
  });

  assert.equal(verdict, 'NEEDS_REAL_SESSION');
});

test('returns BLOCKED when both strict and include-simulated assessments fail', () => {
  const verdict = determineWindsurfSessionVerdict({
    verifyExitCode: 0,
    strictOutput: '[pumuki:cascade-hooks] session-assessment=FAIL',
    anyOutput: '[pumuki:cascade-hooks] session-assessment=FAIL',
  });

  assert.equal(verdict, 'BLOCKED');
});
