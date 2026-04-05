import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { verifyInstalledPumukiBinaryVersion } from '../package-install-smoke-consumer-npm-lib';
import type { SmokeWorkspace } from '../package-install-smoke-workspace-contract';

const createWorkspace = (): SmokeWorkspace => {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'pumuki-consumer-npm-lib-'));
  const consumerRepo = join(tmpRoot, 'consumer');
  mkdirSync(consumerRepo, { recursive: true });
  return {
    repoRoot: process.cwd(),
    reportsDir: '.audit-reports/package-smoke/block',
    reportRoot: join(process.cwd(), '.audit-reports'),
    tmpRoot,
    consumerRepo,
    bareRemote: join(tmpRoot, 'remote.git'),
    commandLog: [],
    summary: [],
  };
};

const withFakeNpx = async (scriptBody: string, callback: () => void): Promise<void> => {
  const fakeBinRoot = mkdtempSync(join(tmpdir(), 'pumuki-fake-npx-'));
  const fakeNpx = join(fakeBinRoot, 'npx');
  writeFileSync(fakeNpx, scriptBody, 'utf8');
  chmodSync(fakeNpx, 0o755);
  const previousPath = process.env.PATH;
  process.env.PATH = `${fakeBinRoot}:${previousPath ?? ''}`;
  try {
    callback();
  } finally {
    process.env.PATH = previousPath;
    rmSync(fakeBinRoot, { recursive: true, force: true });
  }
};

test('verifyInstalledPumukiBinaryVersion valida npx --no-install pumuki status --json y registra comando', async () => {
  const workspace = createWorkspace();
  try {
    await withFakeNpx(
      '#!/usr/bin/env sh\nprintf \'{"packageVersion":"6.3.61","version":{"effective":"6.3.61"}}\\n\'\nexit 0\n',
      () => {
        verifyInstalledPumukiBinaryVersion(workspace);
      }
    );
    assert.equal(workspace.commandLog.length, 1);
    assert.equal(
      workspace.commandLog[0]?.includes('npx --no-install pumuki status --json'),
      true
    );
  } finally {
    rmSync(workspace.tmpRoot, { recursive: true, force: true });
  }
});

test('verifyInstalledPumukiBinaryVersion falla cuando salida contiene MODULE_NOT_FOUND', async () => {
  const workspace = createWorkspace();
  try {
    await withFakeNpx(
      '#!/usr/bin/env sh\necho \"Error: Cannot find module ../telemetry/gateTelemetry\" 1>&2\nexit 0\n',
      () => {
        assert.throws(
          () => verifyInstalledPumukiBinaryVersion(workspace),
          /fatal pattern/i
        );
      }
    );
    assert.equal(workspace.commandLog.length, 2);
  } finally {
    rmSync(workspace.tmpRoot, { recursive: true, force: true });
  }
});

test('verifyInstalledPumukiBinaryVersion usa fallback local cuando npx --no-install falla por MODULE_NOT_FOUND', async () => {
  const workspace = createWorkspace();
  try {
    const localBinDir = join(workspace.consumerRepo, 'node_modules', '.bin');
    mkdirSync(localBinDir, { recursive: true });
    const localPumukiBin = join(localBinDir, 'pumuki');
    writeFileSync(
      localPumukiBin,
      '#!/usr/bin/env sh\nprintf \'{"packageVersion":"6.3.61","version":{"effective":"6.3.61"}}\\n\'\nexit 0\n',
      'utf8'
    );
    chmodSync(localPumukiBin, 0o755);

    await withFakeNpx(
      '#!/usr/bin/env sh\necho \"Error: Cannot find module ../telemetry/gateTelemetry\" 1>&2\nexit 0\n',
      () => {
        verifyInstalledPumukiBinaryVersion(workspace);
      }
    );

    assert.equal(workspace.commandLog.length, 2);
    assert.equal(
      workspace.commandLog[0]?.includes('npx --no-install pumuki status --json'),
      true
    );
    assert.equal(
      workspace.commandLog[1]?.includes('node_modules/.bin/pumuki status --json'),
      true
    );
  } finally {
    rmSync(workspace.tmpRoot, { recursive: true, force: true });
  }
});
