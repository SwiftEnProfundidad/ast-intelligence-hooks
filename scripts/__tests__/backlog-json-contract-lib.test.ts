import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BACKLOG_JSON_COMPAT_CONTRACT_ID,
  BACKLOG_JSON_COMPAT_MIN_READER_VERSION,
  BACKLOG_JSON_SCHEMA_VERSION,
} from '../backlog-json-contract-lib';

test('backlog json contract constants remain canonical', () => {
  assert.equal(BACKLOG_JSON_SCHEMA_VERSION, '1.0.0');
  assert.equal(BACKLOG_JSON_COMPAT_MIN_READER_VERSION, '1.0.0');
  assert.equal(BACKLOG_JSON_COMPAT_CONTRACT_ID, 'backlog-tooling-json-v1');
});
