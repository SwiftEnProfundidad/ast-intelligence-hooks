import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import {
  resolveCiBaseRef,
  resolvePrePushBootstrapBaseRef,
  resolveUpstreamRef,
} from '../resolveGitRefs';
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
  'resolveUpstreamRef returns null when tracking branch is missing',
  { concurrency: false },
  async () => {
    await withResolveRepo(async (repoRoot) => {
      runGit(repoRoot, ['checkout', '--quiet', '-b', 'feature/no-upstream']);

      const resolved = resolveUpstreamRef();

      assert.equal(resolved, null);
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

test(
  'resolvePrePushBootstrapBaseRef prefers develop when develop is the closer bootstrap base',
  { concurrency: false },
  async () => {
    await withResolveRepo(async (repoRoot) => {
      runGit(repoRoot, ['checkout', '--quiet', '-b', 'develop']);
      writeFileSync(join(repoRoot, 'develop-note.md'), 'develop\n', 'utf8');
      runGit(repoRoot, ['add', 'develop-note.md']);
      runGit(repoRoot, ['commit', '--quiet', '-m', 'docs: develop note']);
      runGit(repoRoot, ['checkout', '--quiet', '-b', 'feature/bootstrap-base']);
      writeFileSync(join(repoRoot, 'feature-note.md'), 'feature\n', 'utf8');
      runGit(repoRoot, ['add', 'feature-note.md']);
      runGit(repoRoot, ['commit', '--quiet', '-m', 'docs: feature note']);

      const resolved = resolvePrePushBootstrapBaseRef();
      assert.equal(resolved, 'develop');
    });
  }
);

test(
  'resolvePrePushBootstrapBaseRef prefers main when main is the closer bootstrap base',
  { concurrency: false },
  async () => {
    await withResolveRepo(async (repoRoot) => {
      runGit(repoRoot, ['checkout', '--quiet', '-b', 'develop']);
      writeFileSync(join(repoRoot, 'develop-note.md'), 'develop\n', 'utf8');
      runGit(repoRoot, ['add', 'develop-note.md']);
      runGit(repoRoot, ['commit', '--quiet', '-m', 'docs: develop note']);
      runGit(repoRoot, ['checkout', '--quiet', 'main']);
      writeFileSync(join(repoRoot, 'main-note.md'), 'main\n', 'utf8');
      runGit(repoRoot, ['add', 'main-note.md']);
      runGit(repoRoot, ['commit', '--quiet', '-m', 'docs: main note']);
      runGit(repoRoot, ['checkout', '--quiet', '-b', 'feature/bootstrap-base']);
      writeFileSync(join(repoRoot, 'feature-note.md'), 'feature\n', 'utf8');
      runGit(repoRoot, ['add', 'feature-note.md']);
      runGit(repoRoot, ['commit', '--quiet', '-m', 'docs: feature note']);

      const resolved = resolvePrePushBootstrapBaseRef();
      assert.equal(resolved, 'main');
    });
  }
);

test(
  'resolvePrePushBootstrapBaseRef falls back to HEAD when no base refs are resolvable',
  { concurrency: false },
  async () => {
    await withResolveRepo(
      async () => {
        const resolved = resolvePrePushBootstrapBaseRef();
        assert.equal(resolved, 'HEAD');
      },
      'trunk'
    );
  }
);
