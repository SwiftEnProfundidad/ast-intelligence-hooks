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

const withExperimentalPreWriteDisabled = async <T>(
  callback: () => Promise<T>
): Promise<T> => {
  const previous = process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE;
  const previousSdd = process.env.PUMUKI_EXPERIMENTAL_SDD;
  const previousHeuristics = process.env.PUMUKI_EXPERIMENTAL_HEURISTICS;
  const previousLearningContext = process.env.PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT;
  const previousAnalytics = process.env.PUMUKI_EXPERIMENTAL_ANALYTICS;
  const previousOperationalMemory = process.env.PUMUKI_EXPERIMENTAL_OPERATIONAL_MEMORY;
  const previousSaasIngestion = process.env.PUMUKI_EXPERIMENTAL_SAAS_INGESTION;
  const previousSkills = process.env.PUMUKI_SKILLS_ENFORCEMENT;
  const previousTddBdd = process.env.PUMUKI_TDD_BDD_ENFORCEMENT;
  const previousLegacy = process.env.PUMUKI_PREWRITE_ENFORCEMENT;
  delete process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE;
  delete process.env.PUMUKI_EXPERIMENTAL_SDD;
  delete process.env.PUMUKI_EXPERIMENTAL_HEURISTICS;
  delete process.env.PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT;
  delete process.env.PUMUKI_EXPERIMENTAL_ANALYTICS;
  delete process.env.PUMUKI_EXPERIMENTAL_OPERATIONAL_MEMORY;
  delete process.env.PUMUKI_EXPERIMENTAL_SAAS_INGESTION;
  delete process.env.PUMUKI_SKILLS_ENFORCEMENT;
  delete process.env.PUMUKI_TDD_BDD_ENFORCEMENT;
  delete process.env.PUMUKI_PREWRITE_ENFORCEMENT;
  try {
    return await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE = previous;
    }
    if (typeof previousSdd === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_SDD;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_SDD = previousSdd;
    }
    if (typeof previousHeuristics === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_HEURISTICS;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_HEURISTICS = previousHeuristics;
    }
    if (typeof previousLearningContext === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT = previousLearningContext;
    }
    if (typeof previousAnalytics === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_ANALYTICS;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_ANALYTICS = previousAnalytics;
    }
    if (typeof previousOperationalMemory === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_OPERATIONAL_MEMORY;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_OPERATIONAL_MEMORY = previousOperationalMemory;
    }
    if (typeof previousSaasIngestion === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_SAAS_INGESTION;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_SAAS_INGESTION = previousSaasIngestion;
    }
    if (typeof previousSkills === 'undefined') {
      delete process.env.PUMUKI_SKILLS_ENFORCEMENT;
    } else {
      process.env.PUMUKI_SKILLS_ENFORCEMENT = previousSkills;
    }
    if (typeof previousTddBdd === 'undefined') {
      delete process.env.PUMUKI_TDD_BDD_ENFORCEMENT;
    } else {
      process.env.PUMUKI_TDD_BDD_ENFORCEMENT = previousTddBdd;
    }
    if (typeof previousLegacy === 'undefined') {
      delete process.env.PUMUKI_PREWRITE_ENFORCEMENT;
    } else {
      process.env.PUMUKI_PREWRITE_ENFORCEMENT = previousLegacy;
    }
  }
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

test('runLifecycleCli deja PRE_WRITE en no-op cuando está apagado por defecto', async () => {
  await withExperimentalPreWriteDisabled(async () => {
    const repo = createGitRepo();
    const previousBypass = process.env.PUMUKI_SDD_BYPASS;
    process.env.PUMUKI_SDD_BYPASS = '1';
    const previousCwd = process.cwd();
    process.chdir(repo);
    try {
      const exitCode = await runLifecycleCli(['sdd', 'validate', '--stage=PRE_WRITE']);
      assert.equal(exitCode, 0);
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
});

test('runLifecycleCli PRE_WRITE en modo texto anuncia que el flujo experimental está apagado por defecto', async () => {
  await withExperimentalPreWriteDisabled(async () => {
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
      const exitCode = await runLifecycleCli(['sdd', 'validate', '--stage=PRE_WRITE']);
      assert.equal(exitCode, 0);
      const rendered = printed.join('\n');
      assert.match(rendered, /PRE_WRITE_EXPERIMENTAL_DISABLED/);
      assert.match(rendered, /pertenece al namespace experimental/i);
      assert.match(rendered, /pre-write enforcement: mode=off source=default blocking=no/i);
      assert.doesNotMatch(rendered, /\[pumuki\]\[ai-gate\]/);
    } finally {
      process.stdout.write = originalStdoutWrite;
      process.chdir(previousCwd);
      rmSync(repo, { recursive: true, force: true });
    }
  });
});

test('runLifecycleCli PRE_WRITE --json expone payload determinista cuando el flujo experimental está apagado', async () => {
  await withExperimentalPreWriteDisabled(async () => {
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
      assert.equal(exitCode, 0);
      assert.equal(printed.length > 0, true);
      const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      sdd?: {
        decision?: {
          code?: string;
          allowed?: boolean;
        };
      };
      pre_write_enforcement?: {
        mode?: string;
        blocking?: boolean;
        activationVariable?: string;
      };
      experimental_features?: {
        features?: {
          pre_write?: {
            mode?: string;
            source?: string;
            activationVariable?: string;
          };
          sdd?: {
            mode?: string;
            source?: string;
            activationVariable?: string;
          };
        };
      };
      next_action?: {
        reason?: string;
        command?: string;
      };
      ai_gate?: object;
      };
      assert.equal(payload.sdd?.decision?.code, 'PRE_WRITE_EXPERIMENTAL_DISABLED');
      assert.equal(payload.sdd?.decision?.allowed, true);
      assert.equal(payload.pre_write_enforcement?.mode, 'off');
      assert.equal(payload.pre_write_enforcement?.blocking, false);
      assert.equal(payload.pre_write_enforcement?.activationVariable, 'PUMUKI_EXPERIMENTAL_PRE_WRITE');
      assert.equal(payload.experimental_features?.features?.pre_write?.mode, 'off');
      assert.equal(payload.experimental_features?.features?.pre_write?.source, 'default');
      assert.equal(payload.experimental_features?.features?.sdd?.mode, 'off');
      assert.equal(payload.experimental_features?.features?.sdd?.source, 'default');
      assert.equal(
        payload.experimental_features?.features?.pre_write?.activationVariable,
        'PUMUKI_EXPERIMENTAL_PRE_WRITE'
      );
      assert.equal(
        payload.experimental_features?.features?.sdd?.activationVariable,
        'PUMUKI_EXPERIMENTAL_SDD'
      );
      assert.equal(payload.next_action?.reason, 'PRE_WRITE_EXPERIMENTAL_DISABLED');
      assert.match(payload.next_action?.command ?? '', /PUMUKI_EXPERIMENTAL_PRE_WRITE=advisory/);
      assert.equal(typeof payload.ai_gate, 'undefined');
    } finally {
      process.stdout.write = originalStdoutWrite;
      process.chdir(previousCwd);
      rmSync(repo, { recursive: true, force: true });
    }
  });
});

test('runLifecycleCli SDD PRE_COMMIT --json expone payload determinista cuando SDD/OpenSpec está apagado por defecto', async () => {
  await withExperimentalPreWriteDisabled(async () => {
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
      const exitCode = await runLifecycleCli(['sdd', 'validate', '--stage=PRE_COMMIT', '--json']);
      assert.equal(exitCode, 0);
      const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
        decision?: { code?: string; allowed?: boolean };
        experimental_features?: {
          features?: {
            sdd?: {
              mode?: string;
              source?: string;
              activationVariable?: string;
            };
          };
        };
        next_action?: {
          reason?: string;
          command?: string;
        };
      };
      assert.equal(payload.decision?.code, 'SDD_EXPERIMENTAL_DISABLED');
      assert.equal(payload.decision?.allowed, true);
      assert.equal(payload.experimental_features?.features?.sdd?.mode, 'off');
      assert.equal(payload.experimental_features?.features?.sdd?.source, 'default');
      assert.equal(
        payload.experimental_features?.features?.sdd?.activationVariable,
        'PUMUKI_EXPERIMENTAL_SDD'
      );
      assert.equal(payload.next_action?.reason, 'SDD_EXPERIMENTAL_DISABLED');
      assert.match(payload.next_action?.command ?? '', /PUMUKI_EXPERIMENTAL_SDD=advisory/);
    } finally {
      process.stdout.write = originalStdoutWrite;
      process.chdir(previousCwd);
      rmSync(repo, { recursive: true, force: true });
    }
  });
});

test('runLifecycleCli PRE_WRITE apagado no emite notificaciones de bloqueo ni resumen de AI gate', async () => {
  await withExperimentalPreWriteDisabled(async () => {
    const repo = createGitRepo();
    const previousCwd = process.cwd();
    process.chdir(repo);
    const notifications: Array<{ stage: string; violations: number }> = [];
    const blockedNotifications: Array<{
      stage: string;
      totalViolations: number;
      causeCode: string;
      causeMessage: string;
      remediation: string;
    }> = [];
    try {
      const exitCode = await runLifecycleCli(['sdd', 'validate', '--stage=PRE_WRITE'], {
        emitAuditSummaryNotificationFromAiGate: ({ stage, aiGateResult }) => {
          notifications.push({
            stage,
            violations: aiGateResult.violations.length,
          });
          return { delivered: true, reason: 'delivered' };
        },
        emitGateBlockedNotification: (params) => {
          blockedNotifications.push({
            stage: params.stage,
            totalViolations: params.totalViolations,
            causeCode: params.causeCode,
            causeMessage: params.causeMessage,
            remediation: params.remediation,
          });
          return { delivered: true, reason: 'delivered' };
        },
      });
      assert.equal(exitCode, 0);
      assert.equal(notifications.length, 0);
      assert.equal(blockedNotifications.length, 0);
    } finally {
      process.chdir(previousCwd);
      rmSync(repo, { recursive: true, force: true });
    }
  });
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

    runLifecycleInstall({ cwd: repo, bootstrapOpenSpec: false });
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
