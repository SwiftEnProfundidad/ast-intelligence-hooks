import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { evaluateGitAtomicity } from '../gitAtomicity';
import { runGit, withTempRepo } from './helpers/gitTestUtils';

const withAtomicityEnv = async (
  env: Record<string, string | undefined>,
  callback: () => Promise<void>
): Promise<void> => {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(env)) {
    previous.set(key, process.env[key]);
    if (typeof value === 'undefined') {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    await callback();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (typeof value === 'undefined') {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
};

const withCapturedStderr = async (
  callback: () => Promise<void> | void
): Promise<ReadonlyArray<string>> => {
  const originalWrite = process.stderr.write.bind(process.stderr);
  const chunks: string[] = [];
  process.stderr.write = ((chunk: unknown, encoding?: unknown, cb?: unknown) => {
    chunks.push(typeof chunk === 'string' ? chunk : String(chunk));
    if (typeof encoding === 'function') {
      encoding();
    } else if (typeof cb === 'function') {
      cb();
    }
    return true;
  }) as typeof process.stderr.write;

  try {
    await callback();
  } finally {
    process.stderr.write = originalWrite;
  }
  return chunks;
};

test('evaluateGitAtomicity está activado por defecto con umbrales base', async () => {
  await withTempRepo(async (repoRoot) => {
    const result = evaluateGitAtomicity({
      repoRoot,
      stage: 'PRE_COMMIT',
    });
    assert.equal(result.enabled, true);
    assert.equal(result.allowed, true);
    assert.equal(result.violations.length, 0);
  });
});

test('evaluateGitAtomicity bloquea PRE_COMMIT cuando supera maxFiles', async () => {
  await withAtomicityEnv(
    {
      PUMUKI_GIT_ATOMICITY_ENABLED: '1',
      PUMUKI_GIT_ATOMICITY_MAX_FILES: '1',
      PUMUKI_GIT_ATOMICITY_MAX_SCOPES: '10',
    },
    async () => {
      await withTempRepo(async (repoRoot) => {
        writeFileSync(join(repoRoot, 'a.ts'), 'export const a = 1;\n', 'utf8');
        writeFileSync(join(repoRoot, 'b.ts'), 'export const b = 2;\n', 'utf8');
        runGit(repoRoot, ['add', 'a.ts', 'b.ts']);

        const result = evaluateGitAtomicity({
          repoRoot,
          stage: 'PRE_COMMIT',
        });

        assert.equal(result.enabled, true);
        assert.equal(result.allowed, false);
        assert.equal(
          result.violations.some((violation) => violation.code === 'GIT_ATOMICITY_TOO_MANY_FILES'),
          true
        );
      }, { tempPrefix: 'pumuki-git-atomicity-pre-commit-' });
    }
  );
});

test('evaluateGitAtomicity bloquea PRE_PUSH cuando detecta commits sin patrón trazable', async () => {
  await withAtomicityEnv(
    {
      PUMUKI_GIT_ATOMICITY_ENABLED: '1',
      PUMUKI_GIT_ATOMICITY_MAX_FILES: '100',
      PUMUKI_GIT_ATOMICITY_MAX_SCOPES: '10',
      PUMUKI_GIT_ATOMICITY_ENFORCE_COMMIT_PATTERN: '1',
      PUMUKI_GIT_ATOMICITY_COMMIT_PATTERN:
        '^(feat|fix|chore|refactor|docs|test|perf|build|ci|revert)(\\([^)]+\\))?:\\s.+$',
    },
    async () => {
      await withTempRepo(async (repoRoot) => {
        writeFileSync(join(repoRoot, 'README.md'), '# baseline\n', 'utf8');
        runGit(repoRoot, ['add', 'README.md']);
        runGit(repoRoot, ['commit', '-m', 'chore: baseline']);

        runGit(repoRoot, ['checkout', '--quiet', '-b', 'feature/atomicity']);
        mkdirSync(join(repoRoot, 'apps', 'backend', 'src'), { recursive: true });
        writeFileSync(join(repoRoot, 'apps', 'backend', 'src', 'service.ts'), 'export const v = 1;\n', 'utf8');
        runGit(repoRoot, ['add', 'apps/backend/src/service.ts']);
        runGit(repoRoot, ['commit', '-m', 'update backend service']);

        const result = evaluateGitAtomicity({
          repoRoot,
          stage: 'PRE_PUSH',
          fromRef: 'main',
          toRef: 'HEAD',
        });

        assert.equal(result.enabled, true);
        assert.equal(result.allowed, false);
        assert.equal(
          result.violations.some(
            (violation) => violation.code === 'GIT_ATOMICITY_COMMIT_MESSAGE_TRACEABILITY'
          ),
          true
        );
      }, { tempPrefix: 'pumuki-git-atomicity-pre-push-' });
    }
  );
});

test('evaluateGitAtomicity no rompe bootstrap en repo sin HEAD inicial para PRE_PUSH/CI', async () => {
  await withAtomicityEnv(
    {
      PUMUKI_GIT_ATOMICITY_ENABLED: '1',
      PUMUKI_GIT_ATOMICITY_MAX_FILES: '25',
      PUMUKI_GIT_ATOMICITY_MAX_SCOPES: '2',
      PUMUKI_GIT_ATOMICITY_ENFORCE_COMMIT_PATTERN: '1',
    },
    async () => {
      await withTempRepo(async (repoRoot) => {
        const captured = await withCapturedStderr(() => {
          assert.doesNotThrow(() => {
            const prePush = evaluateGitAtomicity({
              repoRoot,
              stage: 'PRE_PUSH',
              fromRef: 'HEAD',
              toRef: 'HEAD',
            });
            assert.equal(prePush.enabled, true);
            assert.equal(prePush.allowed, true);
            assert.equal(prePush.violations.length, 0);
          });

          assert.doesNotThrow(() => {
            const ci = evaluateGitAtomicity({
              repoRoot,
              stage: 'CI',
              fromRef: 'HEAD',
              toRef: 'HEAD',
            });
            assert.equal(ci.enabled, true);
            assert.equal(ci.allowed, true);
            assert.equal(ci.violations.length, 0);
          });
        });

        const merged = captured.join('\n');
        assert.doesNotMatch(merged, /ambiguous argument 'HEAD'/i);
        assert.doesNotMatch(merged, /argumento ambiguo 'HEAD'/i);
      }, { tempPrefix: 'pumuki-git-atomicity-no-head-' });
    }
  );
});
