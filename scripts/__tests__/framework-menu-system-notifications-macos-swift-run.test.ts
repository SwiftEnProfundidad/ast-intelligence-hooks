import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  resolveSwiftBlockedDialogScriptPath,
  runBlockedDialogWithSwiftHelper,
  SWIFT_BLOCKED_DIALOG_SOURCE,
} from '../framework-menu-system-notifications-macos-swift';

test('resolveSwiftBlockedDialogScriptPath materializa el helper Swift en runtime', async () => {
  await withTempDir('pumuki-macos-swift-script-', async (repoRoot) => {
    const scriptPath = resolveSwiftBlockedDialogScriptPath(repoRoot);

    assert.equal(existsSync(scriptPath), true);
    assert.equal(readFileSync(scriptPath, 'utf8'), `${SWIFT_BLOCKED_DIALOG_SOURCE}\n`);
  });
});

test('runBlockedDialogWithSwiftHelper ejecuta swift y devuelve el botón seleccionado', async () => {
  await withTempDir('pumuki-macos-swift-run-', async (repoRoot) => {
    const calls: Array<{ command: string; args: ReadonlyArray<string> }> = [];
    const result = runBlockedDialogWithSwiftHelper({
      repoRoot,
      title: 'Pumuki bloqueado',
      cause: 'La evidencia está desactualizada.',
      remediation: 'Refresca evidencia.',
      runner: (command, args) => {
        calls.push({ command, args });
        return {
          exitCode: 0,
          stdout: 'button returned:Mantener activas\n',
        };
      },
    });

    assert.equal(result.commandFailed, false);
    assert.equal(result.selectedButton, 'Mantener activas');
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.command, 'swift');
    assert.match((calls[0]?.args ?? []).join(' '), /--title Pumuki bloqueado/);
  });
});

test('runBlockedDialogWithSwiftHelper marca commandFailed si swift falla', async () => {
  await withTempDir('pumuki-macos-swift-run-fail-', async (repoRoot) => {
    const result = runBlockedDialogWithSwiftHelper({
      repoRoot,
      title: 'Pumuki bloqueado',
      cause: 'La evidencia está desactualizada.',
      remediation: 'Refresca evidencia.',
      runner: () => ({
        exitCode: 1,
        stdout: '',
      }),
    });

    assert.deepEqual(result, {
      selectedButton: null,
      commandFailed: true,
    });
  });
});
