import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { PUMUKI_CONFIG_KEYS } from '../constants';
import { runLifecycleInstall } from '../install';
import { getCurrentPumukiVersion } from '../packageInfo';

const withCwd = <T>(cwd: string, fn: () => T): T => {
  const previous = process.cwd();
  process.chdir(cwd);
  try {
    return fn();
  } finally {
    process.chdir(previous);
  }
};

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const readLocalConfig = (cwd: string, key: string): string | undefined => {
  try {
    return runGit(cwd, ['config', '--local', '--get', key]).trim();
  } catch {
    return undefined;
  }
};

const createGitRepo = (): string => {
  const repo = join(tmpdir(), `pumuki-install-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(repo, { recursive: true });
  runGit(repo, ['init', '-b', 'main']);
  runGit(repo, ['config', 'user.email', 'pumuki-test@example.com']);
  runGit(repo, ['config', 'user.name', 'Pumuki Test']);
  writeFileSync(join(repo, '.gitignore'), 'node_modules/\n', 'utf8');
  writeFileSync(join(repo, 'README.md'), '# fixture\n', 'utf8');
  runGit(repo, ['add', '.']);
  runGit(repo, ['commit', '-m', 'chore: fixture']);
  return repo;
};

test('runLifecycleInstall instala hooks y persiste estado lifecycle', () => {
  const repo = createGitRepo();
  try {
    const result = runLifecycleInstall({ cwd: repo });

    assert.equal(realpathSync(result.repoRoot), realpathSync(repo));
    assert.equal(result.version, getCurrentPumukiVersion());
    assert.deepEqual(result.changedHooks, ['pre-commit', 'pre-push']);

    const preCommitPath = join(repo, '.git/hooks/pre-commit');
    const prePushPath = join(repo, '.git/hooks/pre-push');
    assert.equal(existsSync(preCommitPath), true);
    assert.equal(existsSync(prePushPath), true);
    assert.match(readFileSync(preCommitPath, 'utf8'), /pumuki-pre-commit/);
    assert.match(readFileSync(prePushPath, 'utf8'), /pumuki-pre-push/);

    assert.equal(readLocalConfig(repo, PUMUKI_CONFIG_KEYS.installed), 'true');
    assert.equal(readLocalConfig(repo, PUMUKI_CONFIG_KEYS.version), getCurrentPumukiVersion());
    assert.equal(readLocalConfig(repo, PUMUKI_CONFIG_KEYS.hooks), 'pre-commit,pre-push');
    assert.equal(
      typeof readLocalConfig(repo, PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts),
      'string'
    );
    const installedAt = readLocalConfig(repo, PUMUKI_CONFIG_KEYS.installedAt);
    assert.equal(typeof installedAt, 'string');
    assert.equal(Number.isFinite(Date.parse(installedAt ?? '')), true);

    const evidencePath = join(repo, '.ai_evidence.json');
    assert.equal(existsSync(evidencePath), true);
    const evidence = JSON.parse(readFileSync(evidencePath, 'utf8')) as {
      version: string;
      snapshot?: {
        stage?: string;
        outcome?: string;
        files_scanned?: number;
        files_affected?: number;
        evaluation_metrics?: {
          facts_total?: number;
          rules_total?: number;
          baseline_rules?: number;
          heuristic_rules?: number;
          skills_rules?: number;
          project_rules?: number;
          matched_rules?: number;
          unmatched_rules?: number;
          evaluated_rule_ids?: unknown[];
          matched_rule_ids?: unknown[];
          unmatched_rule_ids?: unknown[];
        };
        rules_coverage?: {
          stage?: string;
          active_rule_ids?: unknown[];
          evaluated_rule_ids?: unknown[];
          matched_rule_ids?: unknown[];
          unevaluated_rule_ids?: unknown[];
          counts?: {
            active?: number;
            evaluated?: number;
            matched?: number;
            unevaluated?: number;
          };
          coverage_ratio?: number;
        };
        findings?: unknown[];
      };
      repo_state?: { repo_root?: string };
    };
    assert.equal(evidence.version, '2.1');
    assert.equal(evidence.snapshot?.stage, 'PRE_COMMIT');
    assert.equal(evidence.snapshot?.outcome, 'PASS');
    assert.equal(evidence.snapshot?.files_scanned, 0);
    assert.equal(evidence.snapshot?.files_affected, 0);
    assert.deepEqual(evidence.snapshot?.evaluation_metrics, {
      facts_total: 0,
      rules_total: 0,
      baseline_rules: 0,
      heuristic_rules: 0,
      skills_rules: 0,
      project_rules: 0,
      matched_rules: 0,
      unmatched_rules: 0,
      evaluated_rule_ids: [],
      matched_rule_ids: [],
      unmatched_rule_ids: [],
    });
    assert.deepEqual(evidence.snapshot?.rules_coverage, {
      stage: 'PRE_COMMIT',
      active_rule_ids: [],
      evaluated_rule_ids: [],
      matched_rule_ids: [],
      unevaluated_rule_ids: [],
      counts: {
        active: 0,
        evaluated: 0,
        matched: 0,
        unevaluated: 0,
      },
      coverage_ratio: 1,
    });
    assert.deepEqual(evidence.snapshot?.findings, []);
    assert.equal(realpathSync(evidence.repo_state?.repo_root ?? ''), realpathSync(repo));
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleInstall bloquea cuando hay node_modules trackeado y no persiste estado', () => {
  const repo = createGitRepo();
  try {
    const trackedFile = join(repo, 'node_modules', 'tracked.txt');
    mkdirSync(join(repo, 'node_modules'), { recursive: true });
    writeFileSync(trackedFile, 'tracked\n', 'utf8');
    runGit(repo, ['add', '-f', 'node_modules/tracked.txt']);
    runGit(repo, ['commit', '-m', 'test: tracked node_modules']);

    assert.throws(
      () => runLifecycleInstall({ cwd: repo }),
      /blocked by repository safety checks/i
    );

    assert.equal(existsSync(join(repo, '.git/hooks/pre-commit')), false);
    assert.equal(existsSync(join(repo, '.git/hooks/pre-push')), false);
    assert.equal(existsSync(join(repo, '.ai_evidence.json')), false);
    assert.equal(readLocalConfig(repo, PUMUKI_CONFIG_KEYS.installed), undefined);
    assert.equal(readLocalConfig(repo, PUMUKI_CONFIG_KEYS.version), undefined);
    assert.equal(
      readLocalConfig(repo, PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts),
      undefined
    );
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleInstall es idempotente en segunda ejecución sobre repo ya instalado', () => {
  const repo = createGitRepo();
  try {
    const firstInstall = runLifecycleInstall({ cwd: repo });
    const firstInstalledAt = readLocalConfig(repo, PUMUKI_CONFIG_KEYS.installedAt);

    const secondInstall = runLifecycleInstall({ cwd: repo });
    const secondInstalledAt = readLocalConfig(repo, PUMUKI_CONFIG_KEYS.installedAt);

    assert.deepEqual(firstInstall.changedHooks, ['pre-commit', 'pre-push']);
    assert.deepEqual(secondInstall.changedHooks, []);
    assert.equal(secondInstall.version, getCurrentPumukiVersion());
    assert.equal(readLocalConfig(repo, PUMUKI_CONFIG_KEYS.installed), 'true');
    assert.equal(readLocalConfig(repo, PUMUKI_CONFIG_KEYS.hooks), 'pre-commit,pre-push');
    assert.equal(typeof firstInstalledAt, 'string');
    assert.equal(typeof secondInstalledAt, 'string');
    assert.equal(existsSync(join(repo, '.ai_evidence.json')), true);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleInstall usa process.cwd cuando no recibe cwd explícito', () => {
  const repo = createGitRepo();
  try {
    const result = withCwd(repo, () => runLifecycleInstall());
    assert.equal(realpathSync(result.repoRoot), realpathSync(repo));
    assert.deepEqual(result.changedHooks, ['pre-commit', 'pre-push']);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleInstall con bootstrapOpenSpec=false no ejecuta bootstrap y preserva artefactos OpenSpec previos', () => {
  const repo = createGitRepo();
  try {
    runGit(repo, [
      'config',
      '--local',
      PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts,
      'openspec/project.md',
    ]);

    const result = runLifecycleInstall({
      cwd: repo,
      bootstrapOpenSpec: false,
    });

    assert.equal(result.openSpecBootstrap, undefined);
    assert.equal(
      readLocalConfig(repo, PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts),
      'openspec/project.md'
    );
    assert.equal(existsSync(join(repo, 'openspec')), false);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleInstall respeta PUMUKI_SKIP_OPENSPEC_BOOTSTRAP=1 cuando bootstrapOpenSpec no se define', () => {
  const repo = createGitRepo();
  const previous = process.env.PUMUKI_SKIP_OPENSPEC_BOOTSTRAP;
  process.env.PUMUKI_SKIP_OPENSPEC_BOOTSTRAP = '1';
  try {
    const result = runLifecycleInstall({ cwd: repo });
    assert.equal(result.openSpecBootstrap, undefined);
    assert.equal(readLocalConfig(repo, PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts), undefined);
    assert.equal(existsSync(join(repo, 'openspec')), false);
  } finally {
    if (typeof previous === 'string') {
      process.env.PUMUKI_SKIP_OPENSPEC_BOOTSTRAP = previous;
    } else {
      delete process.env.PUMUKI_SKIP_OPENSPEC_BOOTSTRAP;
    }
    rmSync(repo, { recursive: true, force: true });
  }
});
