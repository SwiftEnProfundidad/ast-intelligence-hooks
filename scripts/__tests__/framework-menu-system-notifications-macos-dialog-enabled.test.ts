import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveBlockedDialogEnabled } from '../framework-menu-system-notifications-macos-dialog-enabled';

test('resolveBlockedDialogEnabled respeta override explícito del entorno', () => {
  assert.equal(
    resolveBlockedDialogEnabled({
      env: { PUMUKI_MACOS_BLOCKED_DIALOG: '0' } as NodeJS.ProcessEnv,
      config: { enabled: true, channel: 'macos', blockedDialogEnabled: true },
    }),
    false
  );
  assert.equal(
    resolveBlockedDialogEnabled({
      env: { PUMUKI_MACOS_BLOCKED_DIALOG: 'true' } as NodeJS.ProcessEnv,
      config: { enabled: true, channel: 'macos', blockedDialogEnabled: false },
    }),
    true
  );
});
