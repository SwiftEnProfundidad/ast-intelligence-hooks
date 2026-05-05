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

test('evaluateGitAtomicity sugiere split de staging cuando supera maxScopes', async () => {
  await withAtomicityEnv(
    {
      PUMUKI_GIT_ATOMICITY_ENABLED: '1',
      PUMUKI_GIT_ATOMICITY_MAX_FILES: '100',
      PUMUKI_GIT_ATOMICITY_MAX_SCOPES: '1',
    },
    async () => {
      await withTempRepo(async (repoRoot) => {
        mkdirSync(join(repoRoot, 'apps', 'backend', 'src'), { recursive: true });
        mkdirSync(join(repoRoot, 'apps', 'frontend', 'src'), { recursive: true });
        writeFileSync(join(repoRoot, 'apps', 'backend', 'src', 'service.ts'), 'export const a = 1;\n', 'utf8');
        writeFileSync(join(repoRoot, 'apps', 'frontend', 'src', 'view.tsx'), 'export const b = 2;\n', 'utf8');
        runGit(repoRoot, ['add', 'apps/backend/src/service.ts', 'apps/frontend/src/view.tsx']);

        const result = evaluateGitAtomicity({
          repoRoot,
          stage: 'PRE_COMMIT',
        });

        assert.equal(result.enabled, true);
        assert.equal(result.allowed, false);
        const violation = result.violations.find(
          (candidate) => candidate.code === 'GIT_ATOMICITY_TOO_MANY_SCOPES'
        );
        assert.ok(violation);
        assert.match(violation.message, /scope_files=/i);
        assert.match(violation.message, /apps\/backend\/src\/service\.ts/i);
        assert.match(violation.message, /apps\/frontend\/src\/view\.tsx/i);
        assert.match(violation.remediation, /git restore --staged \./i);
        assert.match(violation.remediation, /apps\/backend/i);
        assert.match(violation.remediation, /apps\/frontend/i);
        assert.match(violation.remediation, /Slices sugeridos:/i);
        assert.match(violation.remediation, /git add -- 'apps\/backend\/src\/service\.ts'/i);
        assert.match(violation.remediation, /git add -- 'apps\/frontend\/src\/view\.tsx'/i);
        assert.match(violation.remediation, /Sugerencia split/i);
      }, { tempPrefix: 'pumuki-git-atomicity-scopes-' });
    }
  );
});

test('evaluateGitAtomicity permite remediacion de infraestructura de skills aunque toque varios scopes', async () => {
  await withAtomicityEnv(
    {
      PUMUKI_GIT_ATOMICITY_ENABLED: '1',
      PUMUKI_GIT_ATOMICITY_MAX_FILES: '100',
      PUMUKI_GIT_ATOMICITY_MAX_SCOPES: '1',
    },
    async () => {
      await withTempRepo(async (repoRoot) => {
        const paths = [
          'PARITY-IOS-001.feature',
          'core/facts/extractHeuristicFacts.ts',
          'integrations/config/skillsDetectorRegistry.ts',
          'integrations/git/gitAtomicity.ts',
          'skills.lock.json',
        ];
        for (const path of paths) {
          mkdirSync(join(repoRoot, path.split('/').slice(0, -1).join('/')), { recursive: true });
          writeFileSync(join(repoRoot, path), 'export const remediation = true;\n', 'utf8');
        }
        runGit(repoRoot, ['add', ...paths]);

        const result = evaluateGitAtomicity({
          repoRoot,
          stage: 'PRE_COMMIT',
        });

        assert.equal(result.enabled, true);
        assert.equal(result.allowed, true);
        assert.deepEqual(result.violations, []);
      }, { tempPrefix: 'pumuki-git-atomicity-skills-remediation-' });
    }
  );
});

test('evaluateGitAtomicity ignora evidencia gestionada al contar scopes staged', async () => {
  await withAtomicityEnv(
    {
      PUMUKI_GIT_ATOMICITY_ENABLED: '1',
      PUMUKI_GIT_ATOMICITY_MAX_FILES: '10',
      PUMUKI_GIT_ATOMICITY_MAX_SCOPES: '2',
    },
    async () => {
      await withTempRepo(async (repoRoot) => {
        writeFileSync(join(repoRoot, 'package.json'), '{"name":"fixture"}\n', 'utf8');
        writeFileSync(join(repoRoot, 'package-lock.json'), '{"lockfileVersion":3}\n', 'utf8');
        writeFileSync(join(repoRoot, '.ai_evidence.json'), '{"version":"2.1"}\n', 'utf8');
        runGit(repoRoot, ['add', 'package.json', 'package-lock.json', '.ai_evidence.json']);

        const result = evaluateGitAtomicity({
          repoRoot,
          stage: 'PRE_COMMIT',
        });

        assert.equal(result.enabled, true);
        assert.equal(result.allowed, true);
        assert.equal(result.violations.length, 0);
      }, { tempPrefix: 'pumuki-git-atomicity-evidence-scope-' });
    }
  );
});

test('evaluateGitAtomicity sugiere slices concretos cuando supera maxFiles en PRE_COMMIT', async () => {
  await withAtomicityEnv(
    {
      PUMUKI_GIT_ATOMICITY_ENABLED: '1',
      PUMUKI_GIT_ATOMICITY_MAX_FILES: '1',
      PUMUKI_GIT_ATOMICITY_MAX_SCOPES: '10',
    },
    async () => {
      await withTempRepo(async (repoRoot) => {
        mkdirSync(join(repoRoot, 'apps', 'backend', 'src'), { recursive: true });
        writeFileSync(join(repoRoot, 'apps', 'backend', 'src', 'service.ts'), 'export const a = 1;\n', 'utf8');
        writeFileSync(join(repoRoot, 'apps', 'backend', 'src', 'controller.ts'), 'export const b = 2;\n', 'utf8');
        runGit(repoRoot, ['add', 'apps/backend/src/service.ts', 'apps/backend/src/controller.ts']);

        const result = evaluateGitAtomicity({
          repoRoot,
          stage: 'PRE_COMMIT',
        });

        const violation = result.violations.find(
          (candidate) => candidate.code === 'GIT_ATOMICITY_TOO_MANY_FILES'
        );
        assert.ok(violation);
        assert.match(violation.remediation, /Slices sugeridos:/i);
        assert.match(violation.remediation, /apps\/backend/i);
        assert.match(
          violation.remediation,
          /git add -- 'apps\/backend\/src\/controller\.ts' 'apps\/backend\/src\/service\.ts'/i
        );
      }, { tempPrefix: 'pumuki-git-atomicity-files-' });
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

test('evaluateGitAtomicity ignora merges e historial heredado de main al validar PRE_PUSH de rollout', async () => {
  await withAtomicityEnv(
    {
      PUMUKI_GIT_ATOMICITY_ENABLED: '1',
      PUMUKI_GIT_ATOMICITY_MAX_FILES: '4',
      PUMUKI_GIT_ATOMICITY_MAX_SCOPES: '2',
      PUMUKI_GIT_ATOMICITY_ENFORCE_COMMIT_PATTERN: '1',
      PUMUKI_GIT_ATOMICITY_COMMIT_PATTERN:
        '^(feat|fix|chore|refactor|docs|test|perf|build|ci|revert)(\\([^)]+\\))?:\\s.+$',
    },
    async () => {
      await withTempRepo(async (repoRoot) => {
        writeFileSync(join(repoRoot, 'README.md'), '# baseline\n', 'utf8');
        runGit(repoRoot, ['add', 'README.md']);
        runGit(repoRoot, ['commit', '-m', 'chore: baseline']);

        runGit(repoRoot, ['checkout', '--quiet', '-b', 'chore/pumuki-6-3-134-rollout']);
        writeFileSync(join(repoRoot, 'package.json'), '{"devDependencies":{"pumuki":"6.3.135"}}\n', 'utf8');
        runGit(repoRoot, ['add', 'package.json']);
        runGit(repoRoot, ['commit', '-m', 'chore(pumuki): previous rollout']);
        runGit(repoRoot, ['branch', 'rollout-upstream']);

        runGit(repoRoot, ['checkout', '--quiet', 'main']);
        runGit(repoRoot, ['checkout', '--quiet', '-b', 'chore/repin-pumuki-6-3-133']);
        writeFileSync(join(repoRoot, 'main-rollout.txt'), 'main rollout\n', 'utf8');
        runGit(repoRoot, ['add', 'main-rollout.txt']);
        runGit(repoRoot, ['commit', '-m', 'chore: repin pumuki 6.3.133']);
        runGit(repoRoot, ['checkout', '--quiet', 'main']);
        runGit(repoRoot, [
          'merge',
          '--no-ff',
          'chore/repin-pumuki-6-3-133',
          '-m',
          'Merge pull request #12 from SwiftEnProfundidad/chore/repin-pumuki-6-3-133',
        ]);

        runGit(repoRoot, ['checkout', '--quiet', 'chore/pumuki-6-3-134-rollout']);
        writeFileSync(join(repoRoot, 'package.json'), '{"devDependencies":{"pumuki":"6.3.140"}}\n', 'utf8');
        runGit(repoRoot, ['add', 'package.json']);
        runGit(repoRoot, ['commit', '-m', 'chore(pumuki): repin to 6.3.140']);
        runGit(repoRoot, ['merge', '--no-ff', 'main', '-m', "Merge remote-tracking branch 'origin/main'"]);

        const result = evaluateGitAtomicity({
          repoRoot,
          stage: 'PRE_PUSH',
          fromRef: 'rollout-upstream',
          toRef: 'HEAD',
        });

        assert.equal(result.enabled, true);
        assert.equal(result.allowed, true);
        assert.equal(result.violations.length, 0);
      }, { tempPrefix: 'pumuki-git-atomicity-pre-push-inherited-main-' });
    }
  );
});

test('evaluateGitAtomicity permite PRE_PUSH con diff agregado grande cuando cada commit es atómico', async () => {
  await withAtomicityEnv(
    {
      PUMUKI_GIT_ATOMICITY_ENABLED: '1',
      PUMUKI_GIT_ATOMICITY_MAX_FILES: '2',
      PUMUKI_GIT_ATOMICITY_MAX_SCOPES: '1',
      PUMUKI_GIT_ATOMICITY_ENFORCE_COMMIT_PATTERN: '1',
    },
    async () => {
      await withTempRepo(async (repoRoot) => {
        writeFileSync(join(repoRoot, 'README.md'), '# baseline\n', 'utf8');
        runGit(repoRoot, ['add', 'README.md']);
        runGit(repoRoot, ['commit', '-m', 'chore: baseline']);

        runGit(repoRoot, ['checkout', '--quiet', '-b', 'feature/atomic-release-train']);
        mkdirSync(join(repoRoot, 'integrations', 'gate'), { recursive: true });
        writeFileSync(join(repoRoot, 'integrations', 'gate', 'a.ts'), 'export const a = 1;\n', 'utf8');
        writeFileSync(join(repoRoot, 'integrations', 'gate', 'b.ts'), 'export const b = 2;\n', 'utf8');
        runGit(repoRoot, ['add', 'integrations/gate/a.ts', 'integrations/gate/b.ts']);
        runGit(repoRoot, ['commit', '-m', 'fix(gate): keep release slice atomic']);

        mkdirSync(join(repoRoot, 'docs', 'operations'), { recursive: true });
        writeFileSync(join(repoRoot, 'docs', 'operations', 'a.md'), 'A\n', 'utf8');
        writeFileSync(join(repoRoot, 'docs', 'operations', 'b.md'), 'B\n', 'utf8');
        runGit(repoRoot, ['add', 'docs/operations/a.md', 'docs/operations/b.md']);
        runGit(repoRoot, ['commit', '-m', 'docs(release): record atomic train']);

        const result = evaluateGitAtomicity({
          repoRoot,
          stage: 'PRE_PUSH',
          fromRef: 'main',
          toRef: 'HEAD',
        });

        assert.equal(result.enabled, true);
        assert.equal(result.allowed, true);
        assert.equal(result.violations.length, 0);
      }, { tempPrefix: 'pumuki-git-atomicity-pre-push-commit-range-' });
    }
  );
});

test('evaluateGitAtomicity permite PRE_PUSH con commit de remediacion de infraestructura de skills', async () => {
  await withAtomicityEnv(
    {
      PUMUKI_GIT_ATOMICITY_ENABLED: '1',
      PUMUKI_GIT_ATOMICITY_MAX_FILES: '100',
      PUMUKI_GIT_ATOMICITY_MAX_SCOPES: '1',
      PUMUKI_GIT_ATOMICITY_ENFORCE_COMMIT_PATTERN: '1',
    },
    async () => {
      await withTempRepo(async (repoRoot) => {
        writeFileSync(join(repoRoot, 'README.md'), '# baseline\n', 'utf8');
        runGit(repoRoot, ['add', 'README.md']);
        runGit(repoRoot, ['commit', '-m', 'chore: baseline']);

        runGit(repoRoot, ['checkout', '--quiet', '-b', 'feature/skills-remediation']);
        const paths = [
          'PARITY-IOS-001.feature',
          'core/facts/extractHeuristicFacts.ts',
          'integrations/config/skillsDetectorRegistry.ts',
          'integrations/git/gitAtomicity.ts',
          'skills.lock.json',
        ];
        for (const path of paths) {
          mkdirSync(join(repoRoot, path.split('/').slice(0, -1).join('/')), { recursive: true });
          writeFileSync(join(repoRoot, path), 'export const remediation = true;\n', 'utf8');
        }
        runGit(repoRoot, ['add', ...paths]);
        runGit(repoRoot, ['commit', '-m', 'feat(ios): expose skills remediation']);

        const result = evaluateGitAtomicity({
          repoRoot,
          stage: 'PRE_PUSH',
          fromRef: 'main',
          toRef: 'HEAD',
        });

        assert.equal(result.enabled, true);
        assert.equal(result.allowed, true);
        assert.equal(result.violations.length, 0);
      }, { tempPrefix: 'pumuki-git-atomicity-pre-push-skills-remediation-' });
    }
  );
});

test('evaluateGitAtomicity bloquea PRE_PUSH cuando un commit individual no es atómico', async () => {
  await withAtomicityEnv(
    {
      PUMUKI_GIT_ATOMICITY_ENABLED: '1',
      PUMUKI_GIT_ATOMICITY_MAX_FILES: '2',
      PUMUKI_GIT_ATOMICITY_MAX_SCOPES: '2',
      PUMUKI_GIT_ATOMICITY_ENFORCE_COMMIT_PATTERN: '1',
    },
    async () => {
      await withTempRepo(async (repoRoot) => {
        writeFileSync(join(repoRoot, 'README.md'), '# baseline\n', 'utf8');
        runGit(repoRoot, ['add', 'README.md']);
        runGit(repoRoot, ['commit', '-m', 'chore: baseline']);

        runGit(repoRoot, ['checkout', '--quiet', '-b', 'feature/non-atomic-commit']);
        mkdirSync(join(repoRoot, 'integrations', 'gate'), { recursive: true });
        writeFileSync(join(repoRoot, 'integrations', 'gate', 'a.ts'), 'export const a = 1;\n', 'utf8');
        writeFileSync(join(repoRoot, 'integrations', 'gate', 'b.ts'), 'export const b = 2;\n', 'utf8');
        writeFileSync(join(repoRoot, 'integrations', 'gate', 'c.ts'), 'export const c = 3;\n', 'utf8');
        runGit(repoRoot, [
          'add',
          'integrations/gate/a.ts',
          'integrations/gate/b.ts',
          'integrations/gate/c.ts',
        ]);
        runGit(repoRoot, ['commit', '-m', 'fix(gate): add non atomic fixture']);

        const result = evaluateGitAtomicity({
          repoRoot,
          stage: 'PRE_PUSH',
          fromRef: 'main',
          toRef: 'HEAD',
        });

        assert.equal(result.enabled, true);
        assert.equal(result.allowed, false);
        const violation = result.violations.find(
          (candidate) => candidate.code === 'GIT_ATOMICITY_TOO_MANY_FILES'
        );
        assert.ok(violation);
        assert.match(violation.message, /commit=/);
      }, { tempPrefix: 'pumuki-git-atomicity-pre-push-non-atomic-commit-' });
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
