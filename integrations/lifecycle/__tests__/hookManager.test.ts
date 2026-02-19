import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { hasPumukiManagedBlock, upsertPumukiManagedBlock } from '../hookBlock';
import { getPumukiHooksStatus, installPumukiHooks, uninstallPumukiHooks } from '../hookManager';

const ensureGitHooksDir = (repoRoot: string): string => {
  const hooksDir = join(repoRoot, '.git', 'hooks');
  mkdirSync(hooksDir, { recursive: true });
  return hooksDir;
};

test('installPumukiHooks instala hooks gestionados y es idempotente', async () => {
  await withTempDir('pumuki-hook-manager-install-', async (repoRoot) => {
    ensureGitHooksDir(repoRoot);

    const firstInstall = installPumukiHooks(repoRoot);
    assert.deepEqual(firstInstall.changedHooks, ['pre-commit', 'pre-push']);

    const preCommit = readFileSync(join(repoRoot, '.git/hooks/pre-commit'), 'utf8');
    const prePush = readFileSync(join(repoRoot, '.git/hooks/pre-push'), 'utf8');
    assert.match(preCommit, /pumuki-pre-commit/);
    assert.match(prePush, /pumuki-pre-push/);

    const status = getPumukiHooksStatus(repoRoot);
    assert.deepEqual(status, {
      'pre-commit': { exists: true, managedBlockPresent: true },
      'pre-push': { exists: true, managedBlockPresent: true },
    });

    const secondInstall = installPumukiHooks(repoRoot);
    assert.deepEqual(secondInstall.changedHooks, []);
  });
});

test('uninstallPumukiHooks elimina archivos cuando el hook contiene solo bloque gestionado', async () => {
  await withTempDir('pumuki-hook-manager-uninstall-clean-', async (repoRoot) => {
    ensureGitHooksDir(repoRoot);
    installPumukiHooks(repoRoot);

    const uninstallResult = uninstallPumukiHooks(repoRoot);
    assert.deepEqual(uninstallResult.changedHooks, ['pre-commit', 'pre-push']);
    assert.equal(existsSync(join(repoRoot, '.git/hooks/pre-commit')), false);
    assert.equal(existsSync(join(repoRoot, '.git/hooks/pre-push')), false);
  });
});

test('uninstallPumukiHooks conserva contenido custom y solo retira bloque gestionado', async () => {
  await withTempDir('pumuki-hook-manager-uninstall-custom-', async (repoRoot) => {
    const hooksDir = ensureGitHooksDir(repoRoot);
    const preCommitPath = join(hooksDir, 'pre-commit');
    const prePushPath = join(hooksDir, 'pre-push');

    const customScript = '#!/usr/bin/env sh\n\necho "custom"\n';
    writeFileSync(
      preCommitPath,
      upsertPumukiManagedBlock({ contents: customScript, hook: 'pre-commit' }),
      'utf8'
    );
    writeFileSync(prePushPath, customScript, 'utf8');

    const uninstallResult = uninstallPumukiHooks(repoRoot);
    assert.deepEqual(uninstallResult.changedHooks, ['pre-commit']);

    const preCommitAfter = readFileSync(preCommitPath, 'utf8');
    assert.match(preCommitAfter, /echo "custom"/);
    assert.equal(hasPumukiManagedBlock(preCommitAfter), false);

    const prePushAfter = readFileSync(prePushPath, 'utf8');
    assert.equal(prePushAfter, customScript);
  });
});

test('installPumukiHooks crea .git/hooks cuando no existe', async () => {
  await withTempDir('pumuki-hook-manager-create-hooks-dir-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git'), { recursive: true });

    const result = installPumukiHooks(repoRoot);
    assert.deepEqual(result.changedHooks, ['pre-commit', 'pre-push']);
    assert.equal(existsSync(join(repoRoot, '.git/hooks/pre-commit')), true);
    assert.equal(existsSync(join(repoRoot, '.git/hooks/pre-push')), true);
  });
});

test('installPumukiHooks conserva script custom al insertar bloque gestionado', async () => {
  await withTempDir('pumuki-hook-manager-preserve-custom-', async (repoRoot) => {
    ensureGitHooksDir(repoRoot);
    const preCommitPath = join(repoRoot, '.git/hooks/pre-commit');
    const customScript = '#!/usr/bin/env sh\n\necho "legacy-custom"\n';
    writeFileSync(preCommitPath, customScript, 'utf8');

    const result = installPumukiHooks(repoRoot);
    assert.deepEqual(result.changedHooks, ['pre-commit', 'pre-push']);
    const preCommitAfter = readFileSync(preCommitPath, 'utf8');
    assert.match(preCommitAfter, /echo "legacy-custom"/);
    assert.match(preCommitAfter, /pumuki-pre-commit/);
    assert.equal(hasPumukiManagedBlock(preCommitAfter), true);
  });
});

test('uninstallPumukiHooks no reporta cambios cuando no hay hooks gestionados', async () => {
  await withTempDir('pumuki-hook-manager-uninstall-noop-', async (repoRoot) => {
    ensureGitHooksDir(repoRoot);
    const preCommitPath = join(repoRoot, '.git/hooks/pre-commit');
    writeFileSync(preCommitPath, '#!/usr/bin/env sh\n\necho "custom-only"\n', 'utf8');

    const result = uninstallPumukiHooks(repoRoot);
    assert.deepEqual(result.changedHooks, []);
    assert.equal(existsSync(preCommitPath), true);
  });
});

test('getPumukiHooksStatus refleja estado mixto entre hooks existentes y gestionados', async () => {
  await withTempDir('pumuki-hook-manager-status-mixed-', async (repoRoot) => {
    ensureGitHooksDir(repoRoot);
    const preCommitPath = join(repoRoot, '.git/hooks/pre-commit');
    writeFileSync(preCommitPath, '#!/usr/bin/env sh\n\necho "custom-only"\n', 'utf8');

    const status = getPumukiHooksStatus(repoRoot);
    assert.deepEqual(status, {
      'pre-commit': { exists: true, managedBlockPresent: false },
      'pre-push': { exists: false, managedBlockPresent: false },
    });
  });
});
