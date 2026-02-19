import assert from 'node:assert/strict';
import test from 'node:test';
import {
  capRequestedLimit,
  sliceByOffsetAndLimit,
  toPaginationPayload,
} from '../evidencePayloadCollectionsPaging';

test('capRequestedLimit respeta undefined y cap en maxLimit', () => {
  assert.equal(capRequestedLimit(undefined, 25), undefined);
  assert.equal(capRequestedLimit(10, 25), 10);
  assert.equal(capRequestedLimit(30, 25), 25);
});

test('sliceByOffsetAndLimit aplica offset y límite opcional', () => {
  const values = ['a', 'b', 'c', 'd', 'e'];
  assert.deepEqual(sliceByOffsetAndLimit(values, 2, undefined), ['c', 'd', 'e']);
  assert.deepEqual(sliceByOffsetAndLimit(values, 1, 2), ['b', 'c']);
});

test('toPaginationPayload publica has_more solo cuando requestedLimit existe', () => {
  const withRequestedLimit = toPaginationPayload({
    requestedLimit: 10,
    maxLimit: 50,
    limit: 10,
    offset: 0,
    pageSize: 10,
    totalCount: 25,
  }) as Record<string, unknown>;
  assert.equal(withRequestedLimit.requested_limit, 10);
  assert.equal(withRequestedLimit.max_limit, 50);
  assert.equal(withRequestedLimit.limit, 10);
  assert.equal(withRequestedLimit.offset, 0);
  assert.equal(withRequestedLimit.has_more, true);

  const withoutRequestedLimit = toPaginationPayload({
    requestedLimit: undefined,
    maxLimit: 50,
    limit: undefined,
    offset: 10,
    pageSize: 10,
    totalCount: 25,
  }) as Record<string, unknown>;
  assert.equal(withoutRequestedLimit.requested_limit, null);
  assert.equal(withoutRequestedLimit.limit, null);
  assert.equal(withoutRequestedLimit.offset, 10);
  assert.equal(withoutRequestedLimit.has_more, undefined);
});
