import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveMacOsBlockedDialogMode } from '../framework-menu-system-notifications-macos-dialog-mode-resolve';

test('resolveMacOsBlockedDialogMode mantiene el contrato público de resolución del modo', () => {
  assert.equal(
    resolveMacOsBlockedDialogMode({
      PUMUKI_MACOS_BLOCKED_DIALOG_MODE: 'applescript',
    } as NodeJS.ProcessEnv),
    'applescript'
  );
  assert.equal(
    resolveMacOsBlockedDialogMode({
      PUMUKI_MACOS_BLOCKED_DIALOG_MODE: 'swift-floating',
    } as NodeJS.ProcessEnv),
    'swift-floating'
  );
  assert.equal(
    resolveMacOsBlockedDialogMode({
      PUMUKI_MACOS_BLOCKED_DIALOG_MODE: 'otra-cosa',
    } as NodeJS.ProcessEnv),
    'auto'
  );
});
