import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const scriptPath = resolve(process.cwd(), 'scripts/compile-skills-lock.ts');

const withTempDir = (run: (root: string) => void): void => {
  const root = mkdtempSync(join(tmpdir(), 'pumuki-compile-skills-lock-'));
  try {
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

test('compile-skills-lock exits cleanly when skills.sources.json is missing', () => {
  withTempDir((root) => {
    try {
      execFileSync(
        'npx',
        ['--yes', 'tsx@4.21.0', scriptPath],
        {
          cwd: root,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        }
      );
      assert.fail('Expected missing skills.sources.json to fail');
    } catch (error) {
      const stderr = String((error as { stderr?: string | Buffer }).stderr ?? '');
      assert.match(stderr, /skills sources manifest not found or invalid/i);
      assert.doesNotMatch(stderr, /Error:/);
      assert.doesNotMatch(stderr, /at main \(/);
      assert.doesNotMatch(stderr, /stack/i);
    }
  });
});
