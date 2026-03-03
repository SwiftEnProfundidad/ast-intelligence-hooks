import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { runSddSyncDocs } from '../syncDocs';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const withFixtureRepo = async (
  prefix: string,
  callback: (repoRoot: string) => Promise<void> | void
): Promise<void> => {
  const repoRoot = mkdtempSync(join(tmpdir(), prefix));
  runGit(repoRoot, ['init', '-b', 'main']);
  runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
  runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
  writeFileSync(join(repoRoot, 'README.md'), '# fixture\n', 'utf8');
  try {
    await callback(repoRoot);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
};

const writeCanonicalDoc = (repoRoot: string, body: string): string => {
  const path = join(
    repoRoot,
    'docs',
    'technical',
    '08-validation',
    'refactor',
    'pumuki-integration-feedback.md'
  );
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body, 'utf8');
  return path;
};

test('runSddSyncDocs dry-run previsualiza diff y no modifica archivo', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-dry-run-', (repoRoot) => {
    const canonicalPath = writeCanonicalDoc(
      repoRoot,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );
    const before = readFileSync(canonicalPath, 'utf8');

    const result = runSddSyncDocs({
      repoRoot,
      dryRun: true,
    });
    const after = readFileSync(canonicalPath, 'utf8');

    assert.equal(result.dryRun, true);
    assert.equal(result.updated, true);
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0]?.updated, true);
    assert.match(result.files[0]?.diffMarkdown ?? '', /sdd-status/i);
    assert.equal(before, after);
  });
});

test('runSddSyncDocs aplica cambios deterministas y segunda ejecución no cambia nada', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-apply-', (repoRoot) => {
    const canonicalPath = writeCanonicalDoc(
      repoRoot,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );

    const first = runSddSyncDocs({
      repoRoot,
      dryRun: false,
    });
    const synced = readFileSync(canonicalPath, 'utf8');
    const second = runSddSyncDocs({
      repoRoot,
      dryRun: false,
    });

    assert.equal(first.updated, true);
    assert.match(synced, /openspec_installed:/);
    assert.equal(second.updated, false);
    assert.equal(second.files[0]?.updated, false);
  });
});

test('runSddSyncDocs falla con conflicto de marcadores y no toca el archivo', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-conflict-', (repoRoot) => {
    const canonicalPath = writeCanonicalDoc(repoRoot, '# Canonical\n\nwithout managed markers\n');
    const before = readFileSync(canonicalPath, 'utf8');

    assert.throws(
      () =>
        runSddSyncDocs({
          repoRoot,
          dryRun: false,
        }),
      /sync-docs conflict/i
    );
    const after = readFileSync(canonicalPath, 'utf8');
    assert.equal(before, after);
  });
});
