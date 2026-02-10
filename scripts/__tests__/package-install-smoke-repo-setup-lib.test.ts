import assert from 'node:assert/strict';
import test from 'node:test';
import { writeStagedPayload } from '../package-install-smoke-repo-setup-lib';

test('package smoke repo setup exports writeStagedPayload helper', () => {
  assert.equal(typeof writeStagedPayload, 'function');
});
