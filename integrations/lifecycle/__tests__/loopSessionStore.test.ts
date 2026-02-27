import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { createLoopSessionContract } from '../loopSessionContract';
import {
  createLoopSession,
  listLoopSessions,
  readLoopSession,
  resolveLoopSessionPath,
  updateLoopSession,
} from '../loopSessionStore';

test('createLoopSession persiste contrato y readLoopSession lo recupera', async () => {
  await withTempDir('pumuki-loop-store-test-', (repoRoot) => {
    const session = createLoopSessionContract({
      sessionId: 'loop-store-001',
      objective: 'gate stabilization',
      generatedAt: '2026-02-27T12:00:00+00:00',
      maxAttempts: 3,
    });

    const created = createLoopSession({
      repoRoot,
      session,
    });

    assert.equal(created.path, resolveLoopSessionPath(repoRoot, session.session_id));
    const persistedRaw = readFileSync(created.path, 'utf8');
    assert.match(persistedRaw, /"session_id": "loop-store-001"/);

    const readResult = readLoopSession({
      repoRoot,
      sessionId: session.session_id,
    });
    assert.equal(readResult.kind, 'valid');
    if (readResult.kind === 'valid') {
      assert.equal(readResult.session.objective, session.objective);
      assert.equal(readResult.session.max_attempts, 3);
    }
  });
});

test('updateLoopSession sobrescribe sesión existente y listLoopSessions ordena por updated_at desc', async () => {
  await withTempDir('pumuki-loop-store-test-', (repoRoot) => {
    const older = createLoopSessionContract({
      sessionId: 'loop-store-older',
      objective: 'older objective',
      generatedAt: '2026-02-27T12:00:00+00:00',
      maxAttempts: 2,
    });
    const newer = createLoopSessionContract({
      sessionId: 'loop-store-newer',
      objective: 'newer objective',
      generatedAt: '2026-02-27T12:10:00+00:00',
      maxAttempts: 2,
    });
    createLoopSession({ repoRoot, session: older });
    createLoopSession({ repoRoot, session: newer });

    const updatedOlder = {
      ...older,
      status: 'blocked' as const,
      updated_at: '2026-02-27T12:20:00+00:00',
      current_attempt: 1,
      attempts: [
        {
          attempt: 1,
          started_at: '2026-02-27T12:15:00+00:00',
          finished_at: '2026-02-27T12:16:00+00:00',
          outcome: 'block' as const,
          gate_allowed: false,
          gate_code: 'BLOCKED_BY_GATE',
        },
      ],
    };
    updateLoopSession({ repoRoot, session: updatedOlder });

    const listed = listLoopSessions(repoRoot);
    assert.equal(listed.length, 2);
    assert.equal(listed[0]?.session_id, 'loop-store-older');
    assert.equal(listed[0]?.status, 'blocked');
    assert.equal(listed[1]?.session_id, 'loop-store-newer');
  });
});

test('readLoopSession devuelve missing cuando no existe sesión', async () => {
  await withTempDir('pumuki-loop-store-test-', (repoRoot) => {
    const result = readLoopSession({
      repoRoot,
      sessionId: 'unknown-loop',
    });
    assert.equal(result.kind, 'missing');
    if (result.kind === 'missing') {
      assert.equal(result.path, join(repoRoot, '.pumuki', 'loop-sessions', 'unknown-loop.json'));
    }
  });
});
