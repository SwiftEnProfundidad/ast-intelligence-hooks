import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { captureRepoState } from '../repoState';
import { getCurrentPumukiVersion } from '../../lifecycle/packageInfo';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const createGitRepo = (): string => {
  const repo = join(tmpdir(), `pumuki-repo-state-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(repo, { recursive: true });
  runGit(repo, ['init', '-b', 'main']);
  runGit(repo, ['config', 'user.email', 'pumuki-test@example.com']);
  runGit(repo, ['config', 'user.name', 'Pumuki Test']);
  writeFileSync(join(repo, 'README.md'), '# fixture\n', 'utf8');
  runGit(repo, ['add', '.']);
  runGit(repo, ['commit', '-m', 'chore: fixture']);
  return repo;
};

test('captureRepoState refleja hard mode config persistida en archivo determinista', () => {
  const repo = createGitRepo();
  try {
    mkdirSync(join(repo, '.pumuki'), { recursive: true });
    writeFileSync(
      join(repo, '.pumuki', 'hard-mode.json'),
      JSON.stringify({ enabled: true, profile: 'critical-high' }, null, 2),
      'utf8'
    );

    const repoState = captureRepoState(repo);
    const hardMode = (repoState.lifecycle as { hard_mode?: unknown }).hard_mode;

    assert.deepEqual(hardMode, {
      enabled: true,
      profile: 'critical-high',
      config_path: '.pumuki/hard-mode.json',
    });
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('captureRepoState prioriza versión instalada del consumer sobre lifecycle git config y alinea lifecycle_version', () => {
  const repo = createGitRepo();
  try {
    // Simula lifecycle config legado con versión antigua.
    runGit(repo, ['config', '--local', 'pumuki.version', '0.0.1']);

    const rootPackage = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8')
    ) as { name?: string };
    const packageName = rootPackage.name ?? 'pumuki';
    const packageRoot = join(repo, 'node_modules', packageName);
    mkdirSync(packageRoot, { recursive: true });
    writeFileSync(
      join(packageRoot, 'package.json'),
      JSON.stringify({ name: packageName, version: '9.9.9' }, null, 2),
      'utf8'
    );

    const repoState = captureRepoState(repo);

    assert.equal(repoState.lifecycle.package_version, '9.9.9');
    assert.equal(repoState.lifecycle.lifecycle_version, '9.9.9');
    assert.equal(repoState.lifecycle.package_version_source, 'consumer-node-modules');
    assert.equal(repoState.lifecycle.package_version_runtime, getCurrentPumukiVersion());
    assert.equal(repoState.lifecycle.package_version_installed, '9.9.9');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('captureRepoState prioriza AGENTS.md como fuente canónica de tracking y detecta conflicto documental', () => {
  const repo = createGitRepo();
  try {
    mkdirSync(join(repo, 'docs'), { recursive: true });
    writeFileSync(
      join(repo, 'AGENTS.md'),
      [
        '# AGENTS',
        '',
        '- La unica fuente viva del tracking interno es `PUMUKI-RESET-MASTER-PLAN.md`.',
      ].join('\n'),
      'utf8'
    );
    writeFileSync(
      join(repo, 'docs', 'README.md'),
      [
        '# Docs',
        '',
        '- Fuente viva del tracking interno: `docs/tracking/plan-activo-de-trabajo.md`',
      ].join('\n'),
      'utf8'
    );
    writeFileSync(join(repo, 'PUMUKI-RESET-MASTER-PLAN.md'), '- Estado: 🚧\n', 'utf8');

    const repoState = captureRepoState(repo);

    assert.equal(repoState.lifecycle.tracking.enforced, true);
    assert.equal(repoState.lifecycle.tracking.canonical_path, 'PUMUKI-RESET-MASTER-PLAN.md');
    assert.equal(repoState.lifecycle.tracking.source_file, 'AGENTS.md');
    assert.equal(repoState.lifecycle.tracking.canonical_present, true);
    assert.equal(repoState.lifecycle.tracking.in_progress_count, 1);
    assert.equal(repoState.lifecycle.tracking.single_in_progress_valid, true);
    assert.equal(repoState.lifecycle.tracking.conflict, true);
    assert.equal(
      repoState.lifecycle.tracking.declarations.some(
        (entry) =>
          entry.source_file === 'docs/README.md'
          && entry.resolved_path === 'docs/tracking/plan-activo-de-trabajo.md'
      ),
      true
    );
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('captureRepoState marca tracking inválido cuando la fuente canónica deja más de una tarea en construcción', () => {
  const repo = createGitRepo();
  try {
    writeFileSync(
      join(repo, 'AGENTS.md'),
      [
        '# AGENTS',
        '',
        '- La unica fuente viva del tracking interno es `PUMUKI-RESET-MASTER-PLAN.md`.',
      ].join('\n'),
      'utf8'
    );
    writeFileSync(
      join(repo, 'PUMUKI-RESET-MASTER-PLAN.md'),
      ['- Estado: 🚧', '- Estado: 🚧'].join('\n'),
      'utf8'
    );

    const repoState = captureRepoState(repo);

    assert.equal(repoState.lifecycle.tracking.canonical_path, 'PUMUKI-RESET-MASTER-PLAN.md');
    assert.equal(repoState.lifecycle.tracking.conflict, false);
    assert.equal(repoState.lifecycle.tracking.in_progress_count, 2);
    assert.equal(repoState.lifecycle.tracking.single_in_progress_valid, false);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('captureRepoState reconoce la fila tabular del plan canónico como única tarea en construcción', () => {
  const repo = createGitRepo();
  try {
    writeFileSync(
      join(repo, 'AGENTS.md'),
      [
        '# AGENTS',
        '',
        '- La unica fuente viva del tracking interno es `PUMUKI-RESET-MASTER-PLAN.md`.',
      ].join('\n'),
      'utf8'
    );
    writeFileSync(
      join(repo, 'PUMUKI-RESET-MASTER-PLAN.md'),
      [
        '| Documento | Tarea 🚧 actual |',
        '|-----------|-----------------|',
        '| Este plan | 🚧 **Bug externo prioritario** |',
      ].join('\n'),
      'utf8'
    );

    const repoState = captureRepoState(repo);

    assert.equal(repoState.lifecycle.tracking.in_progress_count, 1);
    assert.equal(repoState.lifecycle.tracking.single_in_progress_valid, true);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('captureRepoState reconoce una board tabular estilo RuralGo con la 🚧 en la primera columna', () => {
  const repo = createGitRepo();
  try {
    mkdirSync(join(repo, 'docs'), { recursive: true });
    writeFileSync(
      join(repo, 'docs', 'README.md'),
      [
        '# Docs',
        '',
        '- Fuente viva del tracking interno: `docs/RURALGO_SEGUIMIENTO.md`',
      ].join('\n'),
      'utf8'
    );
    writeFileSync(
      join(repo, 'docs', 'RURALGO_SEGUIMIENTO.md'),
      [
        '| Estado | Task | Resumen |',
        '|--------|------|---------|',
        '| 🚧 | RGO-1900-01 | Slice activa |',
      ].join('\n'),
      'utf8'
    );

    const repoState = captureRepoState(repo);

    assert.equal(repoState.lifecycle.tracking.canonical_path, 'docs/RURALGO_SEGUIMIENTO.md');
    assert.equal(repoState.lifecycle.tracking.canonical_present, true);
    assert.equal(repoState.lifecycle.tracking.in_progress_count, 1);
    assert.equal(repoState.lifecycle.tracking.single_in_progress_valid, true);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
