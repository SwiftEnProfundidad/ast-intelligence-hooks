import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeHumanIntent, resolveHumanIntent } from '../humanIntent';
import type { HumanIntentState } from '../schema';

const baseIntent = (overrides: Partial<HumanIntentState> = {}): HumanIntentState => {
  return {
    primary_goal: ' Stabilize evidence pipeline ',
    secondary_goals: [' keep CI green ', 'keep CI green'],
    non_goals: [' scope creep '],
    constraints: [' no core changes '],
    confidence_level: 'medium',
    set_by: ' user ',
    set_at: '2026-02-06T09:00:00.000Z',
    expires_at: '2099-01-01T00:00:00.000Z',
    preserved_at: '2026-02-06T09:00:00.000Z',
    preservation_count: 1,
    _hint: '  keep deterministic output ',
    ...overrides,
  };
};

test('normalizeHumanIntent returns canonical trimmed structure', () => {
  const normalized = normalizeHumanIntent(baseIntent());
  assert.ok(normalized);
  assert.equal(normalized.primary_goal, 'Stabilize evidence pipeline');
  assert.deepEqual(normalized.secondary_goals, ['keep CI green']);
  assert.deepEqual(normalized.non_goals, ['scope creep']);
  assert.deepEqual(normalized.constraints, ['no core changes']);
  assert.equal(normalized.set_by, 'user');
  assert.equal(normalized._hint, 'keep deterministic output');
});

test('resolveHumanIntent increments preservation count from previous evidence', () => {
  const now = '2026-02-06T12:00:00.000Z';
  const resolved = resolveHumanIntent({
    now,
    previousEvidence: {
      human_intent: baseIntent({ preservation_count: 3 }),
    },
  });

  assert.ok(resolved);
  assert.equal(resolved.preservation_count, 4);
  assert.equal(resolved.preserved_at, now);
});

test('resolveHumanIntent drops expired intent and keeps explicit input count', () => {
  const now = '2026-02-06T12:00:00.000Z';

  const expired = resolveHumanIntent({
    now,
    previousEvidence: {
      human_intent: baseIntent({ expires_at: '2000-01-01T00:00:00.000Z' }),
    },
  });
  assert.equal(expired, null);

  const explicit = resolveHumanIntent({
    now,
    inputIntent: baseIntent({ preservation_count: 9 }),
  });
  assert.ok(explicit);
  assert.equal(explicit.preservation_count, 9);
  assert.equal(explicit.preserved_at, now);
});
