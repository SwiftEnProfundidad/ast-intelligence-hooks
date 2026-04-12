import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const testInstalledStrategyMissingPackageExits2 = () => {
  const emptyConsumer = mkdtempSync(join(tmpdir(), 'pumuki-smoke-empty-'));
  try {
    const result = spawnSync(
      'npx',
      ['--yes', 'tsx@4.21.0', 'scripts/pumuki-full-surface-smoke.ts'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          PUMUKI_SMOKE_REPO_ROOT: emptyConsumer,
          PUMUKI_SMOKE_BIN_STRATEGY: 'installed',
          FORCE_COLOR: '0',
        },
      }
    );
    assert.equal(result.status, 2, result.stderr?.slice(0, 500));
    assert.match(result.stderr ?? '', /PUMUKI_SMOKE_BIN_STRATEGY=installed/);
  } finally {
    rmSync(emptyConsumer, { recursive: true, force: true });
  }
};

testInstalledStrategyMissingPackageExits2();
