import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSddCompletenessEnforcement } from '../sddCompletenessEnforcement';

test('resolveSddCompletenessEnforcement defaults to strict', () => {
  const previous = process.env.PUMUKI_SDD_ENFORCE_COMPLETENESS;
  delete process.env.PUMUKI_SDD_ENFORCE_COMPLETENESS;
  try {
    const resolution = resolveSddCompletenessEnforcement();
    assert.equal(resolution.mode, 'strict');
    assert.equal(resolution.source, 'default');
    assert.equal(resolution.blocking, true);
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_SDD_ENFORCE_COMPLETENESS;
    } else {
      process.env.PUMUKI_SDD_ENFORCE_COMPLETENESS = previous;
    }
  }
});

test('resolveSddCompletenessEnforcement enables strict blocking from env', () => {
  const previous = process.env.PUMUKI_SDD_ENFORCE_COMPLETENESS;
  process.env.PUMUKI_SDD_ENFORCE_COMPLETENESS = 'strict';
  try {
    const resolution = resolveSddCompletenessEnforcement();
    assert.equal(resolution.mode, 'strict');
    assert.equal(resolution.source, 'env');
    assert.equal(resolution.blocking, true);
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_SDD_ENFORCE_COMPLETENESS;
    } else {
      process.env.PUMUKI_SDD_ENFORCE_COMPLETENESS = previous;
    }
  }
});

test('resolveSddCompletenessEnforcement keeps advisory mode for legacy zero override', () => {
  const previous = process.env.PUMUKI_SDD_ENFORCE_COMPLETENESS;
  process.env.PUMUKI_SDD_ENFORCE_COMPLETENESS = '0';
  try {
    const resolution = resolveSddCompletenessEnforcement();
    assert.equal(resolution.mode, 'advisory');
    assert.equal(resolution.source, 'env');
    assert.equal(resolution.blocking, false);
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_SDD_ENFORCE_COMPLETENESS;
    } else {
      process.env.PUMUKI_SDD_ENFORCE_COMPLETENESS = previous;
    }
  }
});
