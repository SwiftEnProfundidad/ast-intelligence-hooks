import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createLoopSessionContract,
  isLoopSessionTransitionAllowed,
  parseLoopSessionContract,
} from '../loopSessionContract';

test('createLoopSessionContract crea sesión canónica con estado inicial running y sin intentos', () => {
  const session = createLoopSessionContract({
    sessionId: 'loop-001',
    objective: 'stabilize gate before commit',
    generatedAt: '2026-02-27T10:00:00+00:00',
    maxAttempts: 3,
  });

  assert.equal(session.version, '1');
  assert.equal(session.status, 'running');
  assert.equal(session.current_attempt, 0);
  assert.equal(session.max_attempts, 3);
  assert.equal(session.attempts.length, 0);
});

test('isLoopSessionTransitionAllowed valida transiciones permitidas y bloquea inválidas', () => {
  assert.equal(isLoopSessionTransitionAllowed('running', 'blocked'), true);
  assert.equal(isLoopSessionTransitionAllowed('running', 'completed'), true);
  assert.equal(isLoopSessionTransitionAllowed('running', 'stopped'), true);
  assert.equal(isLoopSessionTransitionAllowed('blocked', 'running'), true);
  assert.equal(isLoopSessionTransitionAllowed('blocked', 'stopped'), true);
  assert.equal(isLoopSessionTransitionAllowed('stopped', 'running'), true);

  assert.equal(isLoopSessionTransitionAllowed('completed', 'running'), false);
  assert.equal(isLoopSessionTransitionAllowed('completed', 'stopped'), false);
  assert.equal(isLoopSessionTransitionAllowed('running', 'running'), false);
});

test('parseLoopSessionContract rechaza contratos con intentos fuera de límite', () => {
  const session = createLoopSessionContract({
    sessionId: 'loop-002',
    objective: 'enforce strict gate',
    generatedAt: '2026-02-27T10:00:00+00:00',
    maxAttempts: 2,
  });
  const invalid = {
    ...session,
    current_attempt: 3,
    attempts: [
      {
        attempt: 1,
        started_at: '2026-02-27T10:01:00+00:00',
        finished_at: '2026-02-27T10:02:00+00:00',
        outcome: 'pass',
        gate_allowed: true,
        gate_code: 'ALLOW',
      },
      {
        attempt: 2,
        started_at: '2026-02-27T10:03:00+00:00',
        finished_at: '2026-02-27T10:04:00+00:00',
        outcome: 'pass',
        gate_allowed: true,
        gate_code: 'ALLOW',
      },
      {
        attempt: 3,
        started_at: '2026-02-27T10:05:00+00:00',
        finished_at: '2026-02-27T10:06:00+00:00',
        outcome: 'pass',
        gate_allowed: true,
        gate_code: 'ALLOW',
      },
    ],
  };
  const parsed = parseLoopSessionContract(invalid);
  assert.equal(parsed.kind, 'invalid');
  if (parsed.kind === 'invalid') {
    assert.match(parsed.reason, /max_attempts/i);
  }
});
