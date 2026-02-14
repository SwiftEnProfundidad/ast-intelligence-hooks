import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  runGhJson,
  tryRunGh,
  tryRunGhJson,
} from '../consumer-support-bundle-gh-command-lib';

const writeMockGh = (binDir: string): void => {
  const ghPath = join(binDir, 'gh');
  writeFileSync(
    ghPath,
    `#!/usr/bin/env bash
set -eu

case "\${1:-}" in
  success)
    echo '{"ok":true}'
    exit 0
    ;;
  invalid-json)
    echo '{invalid'
    exit 0
    ;;
  fail)
    echo 'gh: intentional failure' >&2
    exit 1
    ;;
  *)
    echo '{}'
    exit 0
    ;;
esac
`,
    'utf8'
  );
  chmodSync(ghPath, 0o755);
};

const withMockGhPath = <T>(binDir: string, fn: () => T): T => {
  const previousPath = process.env.PATH;
  process.env.PATH = `${binDir}:${previousPath ?? ''}`;
  try {
    return fn();
  } finally {
    process.env.PATH = previousPath;
  }
};

test('runGhJson parses deterministic JSON output', async () => {
  await withTempDir('pumuki-support-gh-command-json-', (tempRoot) => {
    const binDir = join(tempRoot, 'bin');
    mkdirSync(binDir, { recursive: true });
    writeMockGh(binDir);

    const data = withMockGhPath(binDir, () =>
      runGhJson<{ ok: boolean }>(['success'])
    );
    assert.equal(data.ok, true);
  });
});

test('tryRunGh returns normalized error on command failure', async () => {
  await withTempDir('pumuki-support-gh-command-fail-', (tempRoot) => {
    const binDir = join(tempRoot, 'bin');
    mkdirSync(binDir, { recursive: true });
    writeMockGh(binDir);

    const result = withMockGhPath(binDir, () => tryRunGh(['fail']));
    assert.equal(result.ok, false);
    assert.match(result.error ?? '', /intentional failure/);
  });
});

test('tryRunGhJson returns parse error for invalid JSON output', async () => {
  await withTempDir('pumuki-support-gh-command-parse-', (tempRoot) => {
    const binDir = join(tempRoot, 'bin');
    mkdirSync(binDir, { recursive: true });
    writeMockGh(binDir);

    const result = withMockGhPath(binDir, () =>
      tryRunGhJson<{ ok: boolean }>(['invalid-json'])
    );
    assert.equal(result.ok, false);
    assert.match(result.error ?? '', /JSON/);
  });
});
