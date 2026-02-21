import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { PUMUKI_MANAGED_BLOCK_END, PUMUKI_MANAGED_BLOCK_START } from '../constants';
import { getCurrentPumukiPackageName, getCurrentPumukiVersion } from '../packageInfo';
import { parseLifecycleCliArgs } from '../cli';
import { runLifecycleCli } from '../cli';
import { runLifecycleInstall } from '../install';
import { runLifecycleRemove } from '../remove';
import { runLifecycleUninstall } from '../uninstall';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const createGitRepo = (): string => {
  const repo = join(tmpdir(), `pumuki-lifecycle-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
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

test('parseLifecycleCliArgs parses supported command options', () => {
  const parsed = parseLifecycleCliArgs(['uninstall', '--purge-artifacts']);
  assert.equal(parsed.command, 'uninstall');
  assert.equal(parsed.purgeArtifacts, true);
});

test('parseLifecycleCliArgs accepts remove command', () => {
  const parsed = parseLifecycleCliArgs(['remove']);
  assert.equal(parsed.command, 'remove');
  assert.equal(parsed.purgeArtifacts, false);
});

test('runLifecycleCli bloquea PRE_WRITE cuando SDD está en bypass pero falta ai_evidence', async () => {
  const repo = createGitRepo();
  const previousBypass = process.env.PUMUKI_SDD_BYPASS;
  process.env.PUMUKI_SDD_BYPASS = '1';
  const previousCwd = process.cwd();
  process.chdir(repo);
  try {
    const exitCode = await runLifecycleCli(['sdd', 'validate', '--stage=PRE_WRITE']);
    assert.equal(exitCode, 1);
  } finally {
    process.chdir(previousCwd);
    if (typeof previousBypass === 'undefined') {
      delete process.env.PUMUKI_SDD_BYPASS;
    } else {
      process.env.PUMUKI_SDD_BYPASS = previousBypass;
    }
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli PRE_WRITE --json mantiene salida encadenada con ai_gate cuando SDD bloquea', async () => {
  const repo = createGitRepo();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const previousCwd = process.cwd();
  process.chdir(repo);
  process.stdout.write = ((chunk: unknown): boolean => {
    printed.push(String(chunk).trimEnd());
    return true;
  }) as typeof process.stdout.write;
  try {
    const exitCode = await runLifecycleCli(['sdd', 'validate', '--stage=PRE_WRITE', '--json']);
    assert.equal(exitCode, 1);
    assert.equal(printed.length > 0, true);
    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      decision?: {
        code?: string;
      };
      telemetry?: {
        chain?: string;
        mcp_tool?: string;
      };
      sdd?: {
        decision?: {
          code?: string;
        };
      };
      ai_gate?: {
        evidence?: {
          kind?: string;
        };
      };
    };
    const decisionCode = payload.sdd?.decision?.code ?? payload.decision?.code;
    assert.equal(decisionCode, 'OPENSPEC_MISSING');
    assert.equal(typeof payload.ai_gate, 'object');
    assert.equal(payload.ai_gate?.evidence?.kind, 'missing');
    assert.equal(payload.telemetry?.chain, 'pumuki->mcp->ai_gate->ai_evidence');
    assert.equal(payload.telemetry?.mcp_tool, 'ai_gate_check');
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleInstall and runLifecycleUninstall manage hooks and artifacts cleanly', () => {
  const repo = createGitRepo();
  try {
    const installResult = runLifecycleInstall({ cwd: repo });
    assert.equal(installResult.changedHooks.length > 0, true);

    const preCommitHook = readFileSync(join(repo, '.git/hooks/pre-commit'), 'utf8');
    const prePushHook = readFileSync(join(repo, '.git/hooks/pre-push'), 'utf8');
    assert.match(preCommitHook, new RegExp(PUMUKI_MANAGED_BLOCK_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(preCommitHook, new RegExp(PUMUKI_MANAGED_BLOCK_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(prePushHook, /pumuki-pre-push/);

    writeFileSync(join(repo, '.ai_evidence.json'), '{}\n', 'utf8');
    assert.equal(existsSync(join(repo, '.ai_evidence.json')), true);

    const uninstallResult = runLifecycleUninstall({
      cwd: repo,
      purgeArtifacts: true,
    });
    assert.equal(uninstallResult.removedArtifacts.includes('.ai_evidence.json'), true);
    assert.equal(existsSync(join(repo, '.ai_evidence.json')), false);
    assert.equal(existsSync(join(repo, '.git/hooks/pre-commit')), false);
    assert.equal(existsSync(join(repo, '.git/hooks/pre-push')), false);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleInstall blocks when node_modules is tracked in git', () => {
  const repo = createGitRepo();
  try {
    const nodeModulesDir = join(repo, 'node_modules');
    mkdirSync(nodeModulesDir, { recursive: true });
    writeFileSync(join(nodeModulesDir, 'tracked-file.txt'), 'tracked\n', 'utf8');
    runGit(repo, ['add', '-f', 'node_modules/tracked-file.txt']);
    runGit(repo, ['commit', '-m', 'test: tracked node_modules']);

    assert.throws(
      () => runLifecycleInstall({ cwd: repo }),
      /blocked by repository safety checks/i
    );
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleRemove purges lifecycle state and requests package uninstall', () => {
  const repo = createGitRepo();
  const npmCalls: { args: ReadonlyArray<string>; cwd: string }[] = [];
  try {
    const packageName = getCurrentPumukiPackageName();
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify(
        {
          name: 'fixture',
          version: '1.0.0',
          dependencies: {
            [packageName]: getCurrentPumukiVersion(),
          },
        },
        null,
        2
      ),
      'utf8'
    );
    runGit(repo, ['add', 'package.json']);
    runGit(repo, ['commit', '-m', 'test: add dependency']);

    runLifecycleInstall({ cwd: repo });
    writeFileSync(join(repo, '.ai_evidence.json'), '{}\n', 'utf8');

    const removeResult = runLifecycleRemove({
      cwd: repo,
      npm: {
        runNpm(args, cwd) {
          npmCalls.push({ args, cwd });
        },
      },
    });

    assert.equal(removeResult.packageRemoved, true);
    assert.equal(existsSync(join(repo, '.git/hooks/pre-commit')), false);
    assert.equal(existsSync(join(repo, '.git/hooks/pre-push')), false);
    assert.equal(existsSync(join(repo, '.ai_evidence.json')), false);
    assert.equal(npmCalls.length, 1);
    assert.deepEqual(npmCalls[0]?.args, ['uninstall', packageName]);
    assert.equal(realpathSync(npmCalls[0]?.cwd ?? ''), realpathSync(repo));
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleRemove purges OpenSpec artifacts managed by bootstrap when package is not declared', () => {
  const repo = createGitRepo();
  try {
    const installResult = runLifecycleInstall({ cwd: repo });
    assert.equal(
      (installResult.openSpecBootstrap?.managedArtifacts.length ?? 0) > 0,
      true
    );
    assert.equal(existsSync(join(repo, 'openspec', 'project.md')), true);

    const removeResult = runLifecycleRemove({
      cwd: repo,
      npm: {
        runNpm() {},
      },
    });

    assert.equal(removeResult.packageRemoved, false);
    assert.equal(
      removeResult.removedArtifacts.includes('openspec/project.md'),
      true
    );
    assert.equal(existsSync(join(repo, 'openspec')), false);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleRemove deletes node_modules when only .package-lock.json residue exists', () => {
  const repo = createGitRepo();
  try {
    const nodeModulesDir = join(repo, 'node_modules');
    mkdirSync(nodeModulesDir, { recursive: true });
    writeFileSync(join(nodeModulesDir, '.package-lock.json'), '{}\n', 'utf8');

    const removeResult = runLifecycleRemove({
      cwd: repo,
      npm: {
        runNpm() {},
      },
    });

    assert.equal(removeResult.packageRemoved, false);
    assert.equal(existsSync(nodeModulesDir), false);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleRemove deletes node_modules when residue is .package-lock.json plus empty .bin', () => {
  const repo = createGitRepo();
  try {
    const nodeModulesDir = join(repo, 'node_modules');
    const nodeModulesBinDir = join(nodeModulesDir, '.bin');
    mkdirSync(nodeModulesBinDir, { recursive: true });
    writeFileSync(join(nodeModulesDir, '.package-lock.json'), '{}\n', 'utf8');

    const removeResult = runLifecycleRemove({
      cwd: repo,
      npm: {
        runNpm() {},
      },
    });

    assert.equal(removeResult.packageRemoved, false);
    assert.equal(existsSync(nodeModulesDir), false);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleRemove preserves unrelated empty scoped directories when no pumuki trace exists', () => {
  const repo = createGitRepo();
  try {
    const nodeModulesDir = join(repo, 'node_modules');
    const scopedDir = join(nodeModulesDir, '@babel');
    mkdirSync(scopedDir, { recursive: true });
    writeFileSync(join(nodeModulesDir, '.package-lock.json'), '{}\n', 'utf8');

    const removeResult = runLifecycleRemove({
      cwd: repo,
      npm: {
        runNpm() {},
      },
    });

    assert.equal(removeResult.packageRemoved, false);
    assert.equal(existsSync(nodeModulesDir), true);
    assert.equal(existsSync(scopedDir), true);
    assert.equal(existsSync(join(nodeModulesDir, '.package-lock.json')), true);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleRemove never removes node_modules when non-empty dependencies remain', () => {
  const repo = createGitRepo();
  try {
    const nodeModulesDir = join(repo, 'node_modules');
    const dependencyDir = join(nodeModulesDir, '@kept', 'dependency');
    mkdirSync(dependencyDir, { recursive: true });
    writeFileSync(join(nodeModulesDir, '.package-lock.json'), '{}\n', 'utf8');
    writeFileSync(join(dependencyDir, 'index.js'), 'module.exports = {};\n', 'utf8');

    const removeResult = runLifecycleRemove({
      cwd: repo,
      npm: {
        runNpm() {},
      },
    });

    assert.equal(removeResult.packageRemoved, false);
    assert.equal(existsSync(nodeModulesDir), true);
    assert.equal(existsSync(join(dependencyDir, 'index.js')), true);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleRemove does not prune empty third-party directories when other dependencies are declared', () => {
  const repo = createGitRepo();
  try {
    const packageName = getCurrentPumukiPackageName();
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify(
        {
          name: 'fixture',
          version: '1.0.0',
          dependencies: {
            [packageName]: '1.0.0',
            react: '18.3.1',
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const nodeModulesDir = join(repo, 'node_modules');
    const emptyThirdPartyScopeDir = join(nodeModulesDir, '@babel');
    mkdirSync(emptyThirdPartyScopeDir, { recursive: true });
    writeFileSync(join(nodeModulesDir, '.package-lock.json'), '{}\n', 'utf8');

    const removeResult = runLifecycleRemove({
      cwd: repo,
      npm: {
        runNpm() {},
      },
    });

    assert.equal(removeResult.packageRemoved, true);
    assert.equal(existsSync(emptyThirdPartyScopeDir), true);
    assert.equal(existsSync(join(nodeModulesDir, '.package-lock.json')), true);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleRemove removes only pumuki trace residue and preserves unrelated dependencies', () => {
  const repo = createGitRepo();
  try {
    const packageName = getCurrentPumukiPackageName();
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify(
        {
          name: 'fixture',
          version: '1.0.0',
          dependencies: {
            [packageName]: '1.0.0',
            dayjs: '1.11.13',
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const nodeModulesDir = join(repo, 'node_modules');
    const pumukiPackageDir = join(nodeModulesDir, packageName);
    const pumukiTransientScopeDir = join(nodeModulesDir, '@pumuki');
    const pumukiTransientPackageDir = join(pumukiTransientScopeDir, 'transient');
    const unrelatedEmptyScopeDir = join(nodeModulesDir, '@keep-empty');
    const unrelatedDependencyDir = join(nodeModulesDir, 'dayjs');
    mkdirSync(pumukiPackageDir, { recursive: true });
    mkdirSync(pumukiTransientPackageDir, { recursive: true });
    mkdirSync(unrelatedEmptyScopeDir, { recursive: true });
    mkdirSync(unrelatedDependencyDir, { recursive: true });
    writeFileSync(
      join(pumukiPackageDir, 'package.json'),
      JSON.stringify(
        {
          name: packageName,
          version: '1.0.0',
          dependencies: {
            '@pumuki/transient': '1.0.0',
          },
        },
        null,
        2
      ),
      'utf8'
    );
    writeFileSync(
      join(pumukiTransientPackageDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pumuki/transient',
          version: '1.0.0',
        },
        null,
        2
      ),
      'utf8'
    );
    writeFileSync(join(unrelatedDependencyDir, 'index.js'), 'module.exports = {};\n', 'utf8');

    const removeResult = runLifecycleRemove({
      cwd: repo,
      npm: {
        runNpm() {
          rmSync(pumukiPackageDir, { recursive: true, force: true });
          rmSync(pumukiTransientPackageDir, { recursive: true, force: true });
        },
      },
    });

    assert.equal(removeResult.packageRemoved, true);
    assert.equal(existsSync(unrelatedEmptyScopeDir), true);
    assert.equal(existsSync(unrelatedDependencyDir), true);
    assert.equal(existsSync(pumukiPackageDir), false);
    assert.equal(existsSync(pumukiTransientScopeDir), false);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
