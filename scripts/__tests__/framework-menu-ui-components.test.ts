import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCliDesignTokens,
  renderActionRow,
  renderBadge,
  renderHintBlock,
  renderMetricRow,
  renderPanel,
  renderSectionHeader,
} from '../framework-menu-ui-components-lib';

test('buildCliDesignTokens respeta width explicito sin doble reduccion', () => {
  const tokens = buildCliDesignTokens({ width: 70, color: false });
  assert.equal(tokens.panelOuterWidth, 70);
  assert.equal(tokens.panelInnerWidth, 66);
});

test('buildCliDesignTokens usa fallback ASCII cuando PUMUKI_MENU_ASCII=1', () => {
  const previous = process.env.PUMUKI_MENU_ASCII;
  process.env.PUMUKI_MENU_ASCII = '1';
  try {
    const tokens = buildCliDesignTokens({ width: 70, color: false });
    assert.equal(tokens.asciiMode, true);
    assert.equal(tokens.border.topLeft, '+');
    assert.equal(tokens.border.vertical, '|');
  } finally {
    if (typeof previous === 'string') {
      process.env.PUMUKI_MENU_ASCII = previous;
    } else {
      delete process.env.PUMUKI_MENU_ASCII;
    }
  }
});

test('renderActionRow incluye hint opcional', () => {
  assert.equal(
    renderActionRow({ id: '1', label: 'Full audit', hint: 'repo analysis' }),
    '1) Full audit - repo analysis'
  );
  assert.equal(
    renderActionRow({ id: '10', label: 'Exit' }),
    '10) Exit'
  );
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

test('renderPanel ajusta contenido al ancho configurado', () => {
  const tokens = buildCliDesignTokens({ width: 70, color: false });
  const panel = renderPanel(
    [
      'PUMUKI — Hook-System (run: npx ast-hooks)',
      'Source files → AST analyzers → violations → severity evaluation → AI Gate verdict',
    ],
    tokens
  );
  for (const line of panel.split('\n')) {
    assert.ok(line.length <= 70, `line exceeds panel width (70): ${line}`);
  }
});
