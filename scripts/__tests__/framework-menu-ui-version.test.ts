import assert from 'node:assert/strict';
import test from 'node:test';
import { isMenuUiV2Enabled } from '../framework-menu-ui-version-lib';

test('isMenuUiV2Enabled default off', () => {
  const previous = process.env.PUMUKI_MENU_UI_V2;
  delete process.env.PUMUKI_MENU_UI_V2;
  try {
    assert.equal(isMenuUiV2Enabled(), false);
  } finally {
    if (typeof previous === 'string') {
      process.env.PUMUKI_MENU_UI_V2 = previous;
    }
  }
});

test('isMenuUiV2Enabled reconoce valores true', () => {
  const previous = process.env.PUMUKI_MENU_UI_V2;
  try {
    process.env.PUMUKI_MENU_UI_V2 = '1';
    assert.equal(isMenuUiV2Enabled(), true);
    process.env.PUMUKI_MENU_UI_V2 = 'true';
    assert.equal(isMenuUiV2Enabled(), true);
    process.env.PUMUKI_MENU_UI_V2 = 'on';
    assert.equal(isMenuUiV2Enabled(), true);
  } finally {
    if (typeof previous === 'string') {
      process.env.PUMUKI_MENU_UI_V2 = previous;
    } else {
      delete process.env.PUMUKI_MENU_UI_V2;
    }
  }
});
