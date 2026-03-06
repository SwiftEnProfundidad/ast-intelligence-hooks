import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCliDesignTokens } from '../framework-menu-ui-components-tokens';
import {
  renderActionRow,
  renderBadge,
  renderHintBlock,
  renderMetricRow,
  renderSectionHeader,
} from '../framework-menu-ui-components-render';

test('renderActionRow incluye hint opcional', () => {
  assert.equal(
    renderActionRow({ id: '1', label: 'Full audit', hint: 'repo analysis' }),
    '1) Full audit - repo analysis'
  );
  assert.equal(renderActionRow({ id: '10', label: 'Exit' }), '10) Exit');
});

test('renderMetricRow y renderSectionHeader generan contrato esperado', () => {
  const tokens = buildCliDesignTokens({ width: 70, color: false });
  assert.equal(renderMetricRow('Files scanned', 925), 'Files scanned: 925');
  assert.equal(renderSectionHeader(1, 'PATTERN CHECKS', tokens), '1) PATTERN CHECKS');
});

test('renderHintBlock y renderBadge generan salida consistente', () => {
  const tokens = buildCliDesignTokens({ width: 70, color: false });
  const hint = renderHintBlock('Pipeline', ['Source files', 'AST analyzers'], tokens);
  assert.equal(hint[0], 'Pipeline');
  assert.equal(hint[1], '• Source files');
  assert.equal(hint[2], '• AST analyzers');
  assert.equal(renderBadge('pass', 'ok', tokens), '● PASS');
});
