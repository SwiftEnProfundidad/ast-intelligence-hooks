import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { resolveCiBaseRef, resolveUpstreamRef } from '../resolveGitRefs';

const runGit = (cwd: string, args: ReadonlyArray<string>): string => {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
};

const withTempRepo = async (
  options: { mainBranch?: string } = {},
  callback: (repoRoot: string) => Promise<void>
) => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-resolve-refs-'));
  const previousCwd = process.cwd();

  try {
    runGit(repoRoot, ['init']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    if (options.mainBranch) {
      runGit(repoRoot, ['branch', '-M', options.mainBranch]);
    }

    writeFileSync(join(repoRoot, 'README.md'), '# refs test\n', 'utf8');
    runGit(repoRoot, ['add', 'README.md']);
    runGit(repoRoot, ['commit', '-m', 'chore: initial commit']);

    process.chdir(repoRoot);
    await callback(repoRoot);
  } finally {
    process.chdir(previousCwd);
    rmSync(repoRoot, { recursive: true, force: true });
  }
};

const withGithubBaseRef = async (
  ref: string | undefined,
  callback: () => Promise<void>
): Promise<void> => {
  const previous = process.env.GITHUB_BASE_REF;
  if (typeof ref === 'undefined') {
    delete process.env.GITHUB_BASE_REF;
  } else {
    process.env.GITHUB_BASE_REF = ref;
  }

  try {
    await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.GITHUB_BASE_REF;
    } else {
      process.env.GITHUB_BASE_REF = previous;
    }
  }
};

test(
  'resolveUpstreamRef returns upstream hash when tracking branch is configured',
  { concurrency: false },
  async () => {
    await withTempRepo({ mainBranch: 'main' }, async (repoRoot) => {
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
    await withTempRepo({ mainBranch: 'main' }, async (repoRoot) => {
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
    await withTempRepo({ mainBranch: 'main' }, async () => {
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
    await withTempRepo({ mainBranch: 'main' }, async () => {
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
    await withTempRepo({ mainBranch: 'main' }, async () => {
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
    await withTempRepo({ mainBranch: 'trunk' }, async () => {
      await withGithubBaseRef(undefined, async () => {
        const resolved = resolveCiBaseRef();
        assert.equal(resolved, 'HEAD');
      });
    });
  }
);
