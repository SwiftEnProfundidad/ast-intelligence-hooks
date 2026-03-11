import assert from 'node:assert/strict';
import test from 'node:test';
import {
  renderLegacyPanel,
  resolveLegacyMenuDesignTokens,
  resolveLegacyPanelOuterWidth,
} from '../framework-menu-legacy-audit-lib';

test('resolveLegacyPanelOuterWidth respeta override por PUMUKI_MENU_WIDTH', () => {
  const previous = process.env.PUMUKI_MENU_WIDTH;
  process.env.PUMUKI_MENU_WIDTH = '72';
  try {
    assert.equal(resolveLegacyPanelOuterWidth(), 72);
  } finally {
    if (typeof previous === 'string') {
      process.env.PUMUKI_MENU_WIDTH = previous;
    } else {
      delete process.env.PUMUKI_MENU_WIDTH;
    }
  }
});

test('renderLegacyPanel mantiene todas las lineas dentro del ancho solicitado', () => {
  const panel = renderLegacyPanel(
    [
      'PUMUKI — Hook-System (run: npx ast-hooks)',
      'Source files → AST analyzers → violations → severity evaluation → AI Gate verdict',
      'ACTION REQUIRED: Critical or high-severity issues detected. Please review and fix before proceeding.',
    ],
    { width: 70, color: false }
  );

  for (const line of panel.split('\n')) {
    assert.ok(line.length <= 70, `line exceeds panel width (70): ${line}`);
  }
});

test('resolveLegacyMenuDesignTokens aplica fallback no-color cuando NO_COLOR=1', () => {
  const previous = process.env.NO_COLOR;
  process.env.NO_COLOR = '1';
  try {
    const tokens = resolveLegacyMenuDesignTokens();
    assert.equal(tokens.colorEnabled, false);
  } finally {
    if (typeof previous === 'string') {
      process.env.NO_COLOR = previous;
    } else {
      delete process.env.NO_COLOR;
    }
  }
});

test('renderLegacyPanel usa bordes ASCII cuando PUMUKI_MENU_ASCII=1', () => {
  const previous = process.env.PUMUKI_MENU_ASCII;
  process.env.PUMUKI_MENU_ASCII = '1';
  try {
    const panel = renderLegacyPanel(
      [
        'PUMUKI — Hook-System (run: npx ast-hooks)',
        'AST Intelligence System Overview',
      ],
      { width: 70, color: false }
    );
    const lines = panel.split('\n');
    assert.match(lines[0] ?? '', /^\+-+\+$/);
    assert.match(lines[lines.length - 1] ?? '', /^\+-+\+$/);
    assert.equal(lines[1]?.startsWith('| '), true);
  } finally {
    if (typeof previous === 'string') {
      process.env.PUMUKI_MENU_ASCII = previous;
    } else {
      delete process.env.PUMUKI_MENU_ASCII;
    }
  }
});

test('renderLegacyPanel respeta ancho solicitado sin doble reduccion', () => {
  const panel = renderLegacyPanel(
    ['PUMUKI — Hook-System (run: npx ast-hooks)'],
    { width: 70, color: false }
  );
  const lines = panel.split('\n');
  const top = lines[0] ?? '';
  assert.equal(top.length, 70);
});
