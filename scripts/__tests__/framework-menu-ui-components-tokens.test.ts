import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCliPalette,
  buildCliDesignTokens,
} from '../framework-menu-ui-components-tokens';

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

test('applyCliPalette no anade ansi cuando color esta deshabilitado', () => {
  const tokens = buildCliDesignTokens({ width: 70, color: false });
  assert.equal(applyCliPalette('Pipeline', 'muted', tokens), 'Pipeline');
});
