import assert from 'node:assert/strict';
import test from 'node:test';
import { applyBlockedDialogSelection } from '../framework-menu-system-notifications-macos-dialog-effect';

test('applyBlockedDialogSelection no hace nada si no hay botón seleccionado', () => {
  let applied = false;

  applyBlockedDialogSelection({
    repoRoot: '/tmp/repo',
    config: { enabled: true, channel: 'macos', blockedDialogEnabled: true },
    selectedButton: null,
    nowMs: 123,
    applyDialogChoice: () => {
      applied = true;
    },
  });

  assert.equal(applied, false);
});

test('applyBlockedDialogSelection aplica la decisión cuando hay botón seleccionado', () => {
  const calls: Array<{ repoRoot: string; button: string; nowMs: number }> = [];

  applyBlockedDialogSelection({
    repoRoot: '/tmp/repo',
    config: { enabled: true, channel: 'macos', blockedDialogEnabled: true },
    selectedButton: 'Desactivar',
    nowMs: 456,
    applyDialogChoice: ({ repoRoot, button, nowMs }) => {
      calls.push({ repoRoot, button, nowMs });
    },
  });

  assert.deepEqual(calls, [
    {
      repoRoot: '/tmp/repo',
      button: 'Desactivar',
      nowMs: 456,
    },
  ]);
});
