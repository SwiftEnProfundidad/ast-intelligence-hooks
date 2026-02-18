import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CONTEXT_API_CAPABILITIES,
  MAX_FINDINGS_LIMIT,
  MAX_LEDGER_LIMIT,
  MAX_PLATFORMS_LIMIT,
  MAX_RULESETS_LIMIT,
  includeSuppressedFromQuery,
  normalizeQueryToken,
  parseBooleanQuery,
  parseNonNegativeIntQuery,
} from '../evidencePayloadConfig';

test('exports deterministic context limits and endpoint contract', () => {
  assert.equal(MAX_FINDINGS_LIMIT, 100);
  assert.equal(MAX_RULESETS_LIMIT, 100);
  assert.equal(MAX_PLATFORMS_LIMIT, 100);
  assert.equal(MAX_LEDGER_LIMIT, 100);

  assert.deepEqual(CONTEXT_API_CAPABILITIES.pagination_bounds.findings, { max_limit: 100 });
  assert.deepEqual(CONTEXT_API_CAPABILITIES.pagination_bounds.rulesets, { max_limit: 100 });
  assert.deepEqual(CONTEXT_API_CAPABILITIES.pagination_bounds.platforms, { max_limit: 100 });
  assert.deepEqual(CONTEXT_API_CAPABILITIES.pagination_bounds.ledger, { max_limit: 100 });
  assert.ok(CONTEXT_API_CAPABILITIES.endpoints.includes('/ai-evidence/summary'));
  assert.ok(CONTEXT_API_CAPABILITIES.endpoints.includes('/ai-evidence/ledger'));
});

test('parseBooleanQuery normalizes truthy/falsy values and rejects ambiguous values', () => {
  assert.equal(parseBooleanQuery('YES'), true);
  assert.equal(parseBooleanQuery(' on '), true);
  assert.equal(parseBooleanQuery('0'), false);
  assert.equal(parseBooleanQuery('False'), false);
  assert.equal(parseBooleanQuery(' maybe '), undefined);
  assert.equal(parseBooleanQuery('   '), undefined);
  assert.equal(parseBooleanQuery(null), undefined);
});

test('parseNonNegativeIntQuery accepts only non-negative integers', () => {
  assert.equal(parseNonNegativeIntQuery('12'), 12);
  assert.equal(parseNonNegativeIntQuery(' 0007 '), 7);
  assert.equal(parseNonNegativeIntQuery('0'), 0);
  assert.equal(parseNonNegativeIntQuery('-1'), undefined);
  assert.equal(parseNonNegativeIntQuery('1.2'), undefined);
  assert.equal(parseNonNegativeIntQuery('NaN'), undefined);
  assert.equal(parseNonNegativeIntQuery(null), undefined);
});

test('includeSuppressedFromQuery resolves view precedence and fallback behavior', () => {
  const compact = new URL('http://localhost/ai-evidence/findings?view=compact&includeSuppressed=1');
  assert.equal(includeSuppressedFromQuery(compact), false);

  const full = new URL('http://localhost/ai-evidence/findings?view=full&includeSuppressed=0');
  assert.equal(includeSuppressedFromQuery(full), true);

  const explicitFalse = new URL('http://localhost/ai-evidence/findings?includeSuppressed=no');
  assert.equal(includeSuppressedFromQuery(explicitFalse), false);

  const fallbackTrue = new URL('http://localhost/ai-evidence/findings?includeSuppressed=unknown');
  assert.equal(includeSuppressedFromQuery(fallbackTrue), true);
});

test('normalizeQueryToken trims and lowercases non-empty values', () => {
  assert.equal(normalizeQueryToken('  ERROR  '), 'error');
  assert.equal(normalizeQueryToken('MixedCase'), 'mixedcase');
  assert.equal(normalizeQueryToken('   '), undefined);
  assert.equal(normalizeQueryToken(null), undefined);
});
