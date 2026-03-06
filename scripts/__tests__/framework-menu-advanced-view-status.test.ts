import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCliDesignTokens } from '../framework-menu-ui-components-lib';
import { resolveAdvancedStatusBadge } from '../framework-menu-advanced-view-status';

const tokens = buildCliDesignTokens({ color: false });

test('resolveAdvancedStatusBadge devuelve WARN cuando falta evidencia', () => {
  const badge = resolveAdvancedStatusBadge({
    status: 'missing',
    stage: null,
    outcome: null,
    totalFindings: 0,
    bySeverity: { CRITICAL: 0, ERROR: 0, WARN: 0, INFO: 0 },
    topFiles: [],
  }, tokens);

  assert.match(badge, /WARN/);
});

test('resolveAdvancedStatusBadge devuelve BLOCK cuando evidencia es invalida', () => {
  const badge = resolveAdvancedStatusBadge({
    status: 'invalid',
    stage: null,
    outcome: null,
    totalFindings: 0,
    bySeverity: { CRITICAL: 0, ERROR: 0, WARN: 0, INFO: 0 },
    topFiles: [],
  }, tokens);

  assert.match(badge, /BLOCK/);
});

test('resolveAdvancedStatusBadge traduce outcome BLOCK cuando evidencia es valida', () => {
  const badge = resolveAdvancedStatusBadge({
    status: 'ok',
    stage: 'PRE_COMMIT',
    outcome: 'BLOCK',
    totalFindings: 3,
    bySeverity: { CRITICAL: 3, ERROR: 0, WARN: 0, INFO: 0 },
    topFiles: [],
  }, tokens);

  assert.match(badge, /BLOCK/);
});
