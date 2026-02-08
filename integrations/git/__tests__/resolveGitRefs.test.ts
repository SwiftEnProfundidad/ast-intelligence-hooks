import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveCiBaseRef, resolveUpstreamRef } from '../resolveGitRefs';
import { runGit, withGithubBaseRef, withTempRepo } from './helpers/gitTestUtils';

const withResolveRepo = async (
  callback: (repoRoot: string) => Promise<void>,
  mainBranch: string = 'main'
): Promise<void> => {
  await withTempRepo(callback, {
    mainBranch,
    seedInitialCommit: true,
    tempPrefix: 'pumuki-resolve-refs-',
  });
};

test(
  'resolveUpstreamRef returns upstream hash when tracking branch is configured',
  { concurrency: false },
  async () => {
    await withResolveRepo(async (repoRoot) => {
      runGit(repoRoot, ['checkout', '--quiet', '-b', 'feature/resolve-upstream']);
      runGit(repoRoot, ['branch', '--quiet', '--set-upstream-to=main']);

      const expected = runGit(repoRoot, ['rev-parse', 'main']);
      const resolved = resolveUpstreamRef();

      assert.equal(resolved, expected);
    });
  }
);

test(
  'resolveUpstreamRef falls back to HEAD when tracking branch is missing',
  { concurrency: false },
  async () => {
    await withResolveRepo(async (repoRoot) => {
      runGit(repoRoot, ['checkout', '--quiet', '-b', 'feature/no-upstream']);

      const resolved = resolveUpstreamRef();

      assert.equal(resolved, 'HEAD');
    });
  }
);

test(
  'resolveCiBaseRef prefers explicit resolvable GITHUB_BASE_REF',
  { concurrency: false },
  async () => {
    await withResolveRepo(async () => {
      await withGithubBaseRef('main', async () => {
        const resolved = resolveCiBaseRef();
        assert.equal(resolved, 'main');
      });
    });
  }
);

test(
  'resolveCiBaseRef falls back to default resolvable base when GITHUB_BASE_REF is invalid',
  { concurrency: false },
  async () => {
    await withResolveRepo(async () => {
      await withGithubBaseRef('invalid/non-existent-ref', async () => {
        const resolved = resolveCiBaseRef();
        assert.equal(resolved, 'main');
      });
    });
  }
);

test(
  'resolveCiBaseRef falls back to main when env is absent and origin/main is missing',
  { concurrency: false },
  async () => {
    await withResolveRepo(async () => {
      await withGithubBaseRef(undefined, async () => {
        const resolved = resolveCiBaseRef();
        assert.equal(resolved, 'main');
      });
    });
  }
);

test(
  'resolveCiBaseRef falls back to HEAD when no main-like base exists',
  { concurrency: false },
  async () => {
    await withResolveRepo(
      async () => {
        await withGithubBaseRef(undefined, async () => {
          const resolved = resolveCiBaseRef();
          assert.equal(resolved, 'HEAD');
        });
      },
      'trunk'
    );
  }
);
