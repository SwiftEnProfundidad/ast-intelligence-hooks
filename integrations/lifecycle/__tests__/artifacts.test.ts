import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import type { ILifecycleGitService } from '../gitService';
import { ensureRuntimeArtifactsIgnored, purgeUntrackedPumukiArtifacts } from '../artifacts';

const createGitStub = (
  trackedPaths: ReadonlyArray<string>
): ILifecycleGitService =>
  ({
    runGit() {
      return '';
    },
    resolveRepoRoot(cwd: string) {
      return cwd;
    },
    statusShort() {
      return '';
    },
    trackedNodeModulesPaths() {
      return [];
    },
    pathTracked(_cwd: string, path: string) {
      return trackedPaths.includes(path);
    },
    applyLocalConfig() {},
    clearLocalConfig() {},
    localConfig() {
      return undefined;
    },
  }) as ILifecycleGitService;

test('purgeUntrackedPumukiArtifacts elimina artefactos no trackeados', async () => {
  await withTempDir('pumuki-artifacts-purge-', async (repoRoot) => {
    const lowercase = join(repoRoot, '.ai_evidence.json');
    writeFileSync(lowercase, '{}\n', 'utf8');

    const removed = purgeUntrackedPumukiArtifacts({
      git: createGitStub([]),
      repoRoot,
    });

    assert.deepEqual(removed, ['.ai_evidence.json']);
    assert.equal(existsSync(lowercase), false);
  });
});

test('purgeUntrackedPumukiArtifacts preserva artefactos trackeados', async () => {
  await withTempDir('pumuki-artifacts-tracked-', async (repoRoot) => {
    const lowercase = join(repoRoot, '.ai_evidence.json');
    writeFileSync(lowercase, '{}\n', 'utf8');

    const removed = purgeUntrackedPumukiArtifacts({
      git: createGitStub(['.ai_evidence.json', '.AI_EVIDENCE.json']),
      repoRoot,
    });

    assert.deepEqual(removed, []);
    assert.equal(existsSync(lowercase), true);
  });
});

test('purgeUntrackedPumukiArtifacts contempla variante uppercase de artefacto', async () => {
  await withTempDir('pumuki-artifacts-uppercase-', async (repoRoot) => {
    const uppercase = join(repoRoot, '.AI_EVIDENCE.json');
    writeFileSync(uppercase, '{}\n', 'utf8');

    const removed = purgeUntrackedPumukiArtifacts({
      git: createGitStub([]),
      repoRoot,
    });

    assert.equal(removed.length, 1);
    assert.equal(
      removed[0] === '.ai_evidence.json' || removed[0] === '.AI_EVIDENCE.json',
      true
    );
    assert.equal(existsSync(uppercase), false);
  });
});

test('purgeUntrackedPumukiArtifacts preserva alias cuando alguna variante está trackeada', async () => {
  await withTempDir('pumuki-artifacts-tracked-alias-', async (repoRoot) => {
    const uppercase = join(repoRoot, '.AI_EVIDENCE.json');
    writeFileSync(uppercase, '{}\n', 'utf8');

    const removed = purgeUntrackedPumukiArtifacts({
      git: createGitStub(['.ai_evidence.json']),
      repoRoot,
    });

    assert.deepEqual(removed, []);
    assert.equal(existsSync(uppercase), true);
  });
});

test('purgeUntrackedPumukiArtifacts ignora rutas ausentes', async () => {
  await withTempDir('pumuki-artifacts-missing-', async (repoRoot) => {
    const removed = purgeUntrackedPumukiArtifacts({
      git: createGitStub([]),
      repoRoot,
    });

    assert.deepEqual(removed, []);
  });
});

test('purgeUntrackedPumukiArtifacts elimina artefactos OpenSpec gestionados y poda directorios vacíos', async () => {
  await withTempDir('pumuki-artifacts-openspec-managed-', async (repoRoot) => {
    mkdirSync(join(repoRoot, 'openspec', 'changes', 'archive'), {
      recursive: true,
    });
    mkdirSync(join(repoRoot, 'openspec', 'specs'), {
      recursive: true,
    });
    writeFileSync(join(repoRoot, 'openspec', 'project.md'), '# OpenSpec Project\n', 'utf8');
    writeFileSync(join(repoRoot, 'openspec', 'changes', 'archive', '.gitkeep'), '', 'utf8');
    writeFileSync(join(repoRoot, 'openspec', 'specs', '.gitkeep'), '', 'utf8');

    const removed = purgeUntrackedPumukiArtifacts({
      git: createGitStub([]),
      repoRoot,
      managedOpenSpecArtifacts: [
        'openspec/project.md',
        'openspec/changes/archive/.gitkeep',
        'openspec/specs/.gitkeep',
      ],
    });

    assert.deepEqual(removed, [
      'openspec/project.md',
      'openspec/changes/archive/.gitkeep',
      'openspec/specs/.gitkeep',
    ]);
    assert.equal(existsSync(join(repoRoot, 'openspec', 'project.md')), false);
    assert.equal(existsSync(join(repoRoot, 'openspec')), false);
  });
});

test('purgeUntrackedPumukiArtifacts preserva artefactos OpenSpec gestionados que están trackeados', async () => {
  await withTempDir('pumuki-artifacts-openspec-tracked-', async (repoRoot) => {
    mkdirSync(join(repoRoot, 'openspec', 'changes', 'archive'), {
      recursive: true,
    });
    writeFileSync(join(repoRoot, 'openspec', 'project.md'), '# OpenSpec Project\n', 'utf8');
    writeFileSync(join(repoRoot, 'openspec', 'changes', 'archive', '.gitkeep'), '', 'utf8');

    const removed = purgeUntrackedPumukiArtifacts({
      git: createGitStub(['openspec/project.md']),
      repoRoot,
      managedOpenSpecArtifacts: ['openspec/project.md', 'openspec/changes/archive/.gitkeep'],
    });

    assert.deepEqual(removed, ['openspec/changes/archive/.gitkeep']);
    assert.equal(existsSync(join(repoRoot, 'openspec', 'project.md')), true);
    assert.equal(existsSync(join(repoRoot, 'openspec')), true);
  });
});

test('ensureRuntimeArtifactsIgnored inserta bloque gestionado en .git/info/exclude', async () => {
  await withTempDir('pumuki-artifacts-ignore-block-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'info'), { recursive: true });

    const result = ensureRuntimeArtifactsIgnored(repoRoot);

    assert.equal(result.updated, true);
    const excludePath = join(repoRoot, '.git', 'info', 'exclude');
    const content = existsSync(excludePath) ? readFileSync(excludePath, 'utf8') : '';
    assert.match(content, /# >>> pumuki-runtime-artifacts >>>/);
    assert.match(content, /\.ai_evidence\.json/);
    assert.match(content, /\.pumuki\//);
    assert.match(content, /# <<< pumuki-runtime-artifacts <<</);
  });
});

test('ensureRuntimeArtifactsIgnored es idempotente y no reescribe bloque si ya está alineado', async () => {
  await withTempDir('pumuki-artifacts-ignore-idempotent-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'info'), { recursive: true });

    const first = ensureRuntimeArtifactsIgnored(repoRoot);
    const second = ensureRuntimeArtifactsIgnored(repoRoot);

    assert.equal(first.updated, true);
    assert.equal(second.updated, false);
  });
});

test('ensureRuntimeArtifactsIgnored reemplaza bloque existente y preserva contenido externo', async () => {
  await withTempDir('pumuki-artifacts-ignore-replace-', async (repoRoot) => {
    const excludePath = join(repoRoot, '.git', 'info', 'exclude');
    mkdirSync(join(repoRoot, '.git', 'info'), { recursive: true });
    writeFileSync(
      excludePath,
      [
        '# custom-line',
        '# >>> pumuki-runtime-artifacts >>>',
        '.ai_evidence.json',
        '# legacy-entry',
        '# <<< pumuki-runtime-artifacts <<<',
        '',
      ].join('\n'),
      'utf8'
    );

    const result = ensureRuntimeArtifactsIgnored(repoRoot);

    assert.equal(result.updated, true);
    const content = readFileSync(excludePath, 'utf8');
    assert.match(content, /# custom-line/);
    assert.match(content, /\.AI_EVIDENCE\.json/);
    assert.match(content, /\.pumuki\//);
    assert.equal((content.match(/# >>> pumuki-runtime-artifacts >>>/g) ?? []).length, 1);
  });
});
