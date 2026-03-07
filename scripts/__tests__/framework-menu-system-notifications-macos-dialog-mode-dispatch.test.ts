import assert from 'node:assert/strict';
import test from 'node:test';

import { dispatchBlockedDialogByMode } from '../framework-menu-system-notifications-macos-dialog-mode-dispatch';

const baseParams = {
  repoRoot: '/tmp/pumuki-repo',
  title: 'Pumuki bloqueado',
  cause: 'La evidencia está desactualizada.',
  remediation: 'Refresca evidencia.',
  runner: () => ({
    exitCode: 0,
    stdout: 'button returned:Mantener activas\n',
  }),
};

test('dispatchBlockedDialogByMode usa AppleScript directamente cuando el modo es applescript', () => {
  let swiftCalls = 0;
  let appleCalls = 0;

  const selectedButton = dispatchBlockedDialogByMode({
    ...baseParams,
    dialogMode: 'applescript',
    runSwiftDialog: () => {
      swiftCalls += 1;
      return {
        selectedButton: 'Mantener activas',
        commandFailed: false,
      };
    },
    runAppleScriptDialog: () => {
      appleCalls += 1;
      return {
        selectedButton: 'Silenciar 30 min',
        commandFailed: false,
      };
    },
  });

  assert.equal(selectedButton, 'Silenciar 30 min');
  assert.equal(swiftCalls, 0);
  assert.equal(appleCalls, 1);
});

test('dispatchBlockedDialogByMode devuelve el resultado Swift cuando no falla', () => {
  let appleCalls = 0;

  const selectedButton = dispatchBlockedDialogByMode({
    ...baseParams,
    dialogMode: 'auto',
    runSwiftDialog: () => ({
      selectedButton: 'Mantener activas',
      commandFailed: false,
    }),
    runAppleScriptDialog: () => {
      appleCalls += 1;
      return {
        selectedButton: 'Silenciar 30 min',
        commandFailed: false,
      };
    },
  });

  assert.equal(selectedButton, 'Mantener activas');
  assert.equal(appleCalls, 0);
});

test('dispatchBlockedDialogByMode hace fallback a AppleScript cuando Swift falla', () => {
  let appleCalls = 0;

  const selectedButton = dispatchBlockedDialogByMode({
    ...baseParams,
    dialogMode: 'auto',
    runSwiftDialog: () => ({
      selectedButton: null,
      commandFailed: true,
    }),
    runAppleScriptDialog: () => {
      appleCalls += 1;
      return {
        selectedButton: 'Desactivar',
        commandFailed: false,
      };
    },
  });

  assert.equal(selectedButton, 'Desactivar');
  assert.equal(appleCalls, 1);
});
