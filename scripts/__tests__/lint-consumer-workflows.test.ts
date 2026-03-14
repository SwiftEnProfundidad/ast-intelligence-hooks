import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const scriptPath = resolve(process.cwd(), 'scripts/lint-consumer-workflows.ts');

const withTempDir = (run: (root: string) => void): void => {
  const root = mkdtempSync(join(tmpdir(), 'pumuki-lint-consumer-workflows-'));
  try {
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

test('lint-consumer-workflows exits cleanly when actionlint binary is missing', () => {
  withTempDir((root) => {
    const repoPath = join(root, 'consumer');
    mkdirSync(join(repoPath, '.github/workflows'), { recursive: true });
    writeFileSync(join(repoPath, '.github/workflows/ci.yml'), 'name: CI', 'utf8');

    try {
      execFileSync(
        'npx',
        [
          '--yes',
          'tsx@4.21.0',
          scriptPath,
          '--repo-path',
          repoPath,
          '--actionlint-bin',
          './bin/missing-actionlint',
        ],
        {
          cwd: root,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        }
      );
      assert.fail('Expected missing actionlint binary to fail');
    } catch (error) {
      const stderr = String((error as { stderr?: string | Buffer }).stderr ?? '');
      assert.match(stderr, /actionlint binary not found/i);
      assert.doesNotMatch(stderr, /Error:/);
      assert.doesNotMatch(stderr, /at main \(/);
      assert.doesNotMatch(stderr, /stack/i);
    }
  });
});
