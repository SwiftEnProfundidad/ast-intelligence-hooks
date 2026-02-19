import assert from 'node:assert/strict';
import test from 'node:test';
import { isSeverityAtLeast, severityRank, type Severity } from './Severity';

test('severityRank define orden esperado para todas las severidades', () => {
  assert.equal(severityRank.INFO, 10);
  assert.equal(severityRank.WARN, 20);
  assert.equal(severityRank.ERROR, 30);
  assert.equal(severityRank.CRITICAL, 40);
});

test('isSeverityAtLeast compara severidades por ranking', () => {
  const order: Severity[] = ['INFO', 'WARN', 'ERROR', 'CRITICAL'];

  assert.equal(isSeverityAtLeast(order[3], order[2]), true);
  assert.equal(isSeverityAtLeast(order[2], order[2]), true);
  assert.equal(isSeverityAtLeast(order[1], order[2]), false);
  assert.equal(isSeverityAtLeast(order[0], order[3]), false);
});
