import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SMOKE_BASELINE_FILE,
  SMOKE_STAGED_ONLY_FILE,
} from '../package-install-smoke-fixtures-content-lib';

test('minimal staged fixture mutates baseline file instead of adding a new file', () => {
  assert.equal(SMOKE_STAGED_ONLY_FILE.path, SMOKE_BASELINE_FILE.path);
});

test('minimal staged fixture avoids public interface tokens', () => {
  assert.equal(/\bexport\s+/.test(SMOKE_STAGED_ONLY_FILE.content), false);
});
