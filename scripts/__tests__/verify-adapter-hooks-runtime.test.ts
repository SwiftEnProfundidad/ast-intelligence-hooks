import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

const VERIFY_SCRIPT = resolve(
  process.cwd(),
  'legacy/scripts/hooks-system/infrastructure/cascade-hooks/verify-adapter-hooks-runtime.sh'
);
const WRAPPER_PATH = resolve(
  process.cwd(),
  'legacy/scripts/hooks-system/infrastructure/cascade-hooks/run-hook-with-node.sh'
);
const ADAPTER_RUNTIME_TEST = existsSync(VERIFY_SCRIPT) && existsSync(WRAPPER_PATH) ? test : test.skip;

type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

const writeHooksConfig = (params: {
  homeRoot: string;
  adapterName?: 'adapter' | 'windsurf';
  preCommand: string;
  postCommand: string;
}): void => {
  const targetDir = join(params.homeRoot, '.codeium', params.adapterName ?? 'adapter');
  mkdirSync(targetDir, { recursive: true });
  writeFileSync(
    join(targetDir, 'hooks.json'),
    JSON.stringify(
      {
        hooks: {
          pre_write_code: [
            {
              command: params.preCommand,
              show_output: true,
              timeout_ms: 10_000,
            },
          ],
          post_write_code: [
            {
              command: params.postCommand,
              show_output: false,
              timeout_ms: 5_000,
            },
          ],
        },
      },
      null,
      2
    ),
    'utf8'
  );
};

const runVerify = (homeRoot: string): CommandResult => {
  try {
    const stdout = execFileSync('bash', [VERIFY_SCRIPT], {
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeRoot,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return {
      exitCode: 0,
      stdout,
      stderr: '',
    };
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      'stdout' in error &&
      'stderr' in error
    ) {
      return {
        exitCode: Number((error as { status?: number }).status ?? 1),
        stdout: String((error as { stdout?: string | Buffer }).stdout ?? ''),
        stderr: String((error as { stderr?: string | Buffer }).stderr ?? ''),
      };
    }
    throw error;
  }
};

ADAPTER_RUNTIME_TEST('verify-adapter-hooks-runtime passes when hooks.json points to wrapper script', async () => {
  await withTempDir('pumuki-adapter-verify-ok-', async (tempRoot) => {
    writeHooksConfig({
      homeRoot: tempRoot,
      preCommand: `bash "${WRAPPER_PATH}" pre-write-code-hook.js`,
      postCommand: `bash "${WRAPPER_PATH}" post-write-code-hook.js`,
    });

    const result = runVerify(tempRoot);

    assert.equal(result.exitCode, 0);
    assert.match(result.stdout, /verify OK/);
    assert.match(result.stdout, /wrapper=/);
  });
});

ADAPTER_RUNTIME_TEST('verify-adapter-hooks-runtime fails with actionable message on stale direct-node commands', async () => {
  await withTempDir('pumuki-adapter-verify-stale-', async (tempRoot) => {
    writeHooksConfig({
      homeRoot: tempRoot,
      preCommand:
        'node /tmp/node_modules/pumuki/scripts/hooks-system/infrastructure/cascade-hooks/pre-write-code-hook.js',
      postCommand:
        'node /tmp/node_modules/pumuki/scripts/hooks-system/infrastructure/cascade-hooks/post-write-code-hook.js',
    });

    const result = runVerify(tempRoot);

    assert.equal(result.exitCode, 1);
    assert.match(result.stderr, /detected stale direct-node hook command/);
    assert.match(result.stderr, /npm run install:adapter-hooks-config/);
    assert.match(result.stderr, /npm run verify:adapter-hooks-runtime/);
  });
});

ADAPTER_RUNTIME_TEST('verify-adapter-hooks-runtime falls back to legacy windsurf hooks.json when adapter config is absent', async () => {
  await withTempDir('pumuki-adapter-verify-fallback-', async (tempRoot) => {
    writeHooksConfig({
      homeRoot: tempRoot,
      adapterName: 'windsurf',
      preCommand: `bash "${WRAPPER_PATH}" pre-write-code-hook.js`,
      postCommand: `bash "${WRAPPER_PATH}" post-write-code-hook.js`,
    });

    const result = runVerify(tempRoot);

    assert.equal(result.exitCode, 0);
    assert.match(result.stdout, /config=.*\.codeium\/windsurf\/hooks\.json/);
  });
});

ADAPTER_RUNTIME_TEST('verify-adapter-hooks-runtime fails when one active config is stale even if another is valid', async () => {
  await withTempDir('pumuki-adapter-verify-dual-stale-', async (tempRoot) => {
    writeHooksConfig({
      homeRoot: tempRoot,
      adapterName: 'adapter',
      preCommand: `bash "${WRAPPER_PATH}" pre-write-code-hook.js`,
      postCommand: `bash "${WRAPPER_PATH}" post-write-code-hook.js`,
    });
    writeHooksConfig({
      homeRoot: tempRoot,
      adapterName: 'windsurf',
      preCommand:
        'node /tmp/node_modules/pumuki/scripts/hooks-system/infrastructure/cascade-hooks/pre-write-code-hook.js',
      postCommand:
        'node /tmp/node_modules/pumuki/scripts/hooks-system/infrastructure/cascade-hooks/post-write-code-hook.js',
    });

    const result = runVerify(tempRoot);

    assert.equal(result.exitCode, 1);
    assert.match(result.stderr, /detected stale direct-node hook command/);
    assert.match(result.stderr, /\.codeium\/windsurf\/hooks\.json/);
  });
});
