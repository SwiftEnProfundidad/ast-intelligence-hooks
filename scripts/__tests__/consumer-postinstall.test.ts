import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { runPostinstall } = require('../consumer-postinstall.cjs') as {
  runPostinstall: (options: {
    spawnSyncFn?: (command: string, args: ReadonlyArray<string>, options?: object) => {
      status?: number | null;
      error?: Error | null;
    };
    packageRoot?: string;
    consumerRoot?: string;
    env?: NodeJS.ProcessEnv;
  }) => number;
};

const withTempDir = async <T>(namePrefix: string, fn: (dir: string) => Promise<T> | T): Promise<T> => {
  const dir = mkdtempSync(join(tmpdir(), `${namePrefix}`));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test('runPostinstall propaga codigo de salida no-cero', async () => {
  await withTempDir('pumuki-postinstall-fail-', async (workspace) => {
    const packageRoot = join(workspace, 'package');
    const consumerRoot = join(workspace, 'consumer');
    mkdirSync(join(consumerRoot, '.git'), { recursive: true });
    mkdirSync(join(packageRoot, 'bin'), { recursive: true });
    writeFileSync(join(packageRoot, 'bin', 'pumuki.js'), '#!/usr/bin/env node\n', 'utf8');

    const result = runPostinstall({
      packageRoot,
      consumerRoot,
      env: { ...process.env, PUMUKI_VERBOSE_INSTALL: '0' },
      spawnSyncFn: () => ({
        status: 7,
        error: null,
      }),
    });

    assert.equal(result, 7);
  });
});

test('runPostinstall devuelve 0 en instalacion exitosa', async () => {
  await withTempDir('pumuki-postinstall-success-', async (workspace) => {
    const packageRoot = join(workspace, 'package');
    const consumerRoot = join(workspace, 'consumer');
    mkdirSync(join(consumerRoot, '.git'), { recursive: true });
    mkdirSync(join(packageRoot, 'bin'), { recursive: true });
    writeFileSync(join(packageRoot, 'bin', 'pumuki.js'), '#!/usr/bin/env node\n', 'utf8');

    const result = runPostinstall({
      packageRoot,
      consumerRoot,
      env: { ...process.env, PUMUKI_VERBOSE_INSTALL: '0' },
      spawnSyncFn: () => ({
        status: 0,
        error: null,
      }),
    });

    assert.equal(result, 0);
  });
});
