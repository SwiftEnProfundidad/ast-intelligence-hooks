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
    assert.equal(result.context.change, null);
    assert.equal(result.context.stage, null);
    assert.equal(result.context.task, null);
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
    assert.equal(first.context.change, null);
    assert.equal(first.context.stage, null);
    assert.equal(first.context.task, null);
    assert.match(synced, /openspec_installed:/);
    assert.equal(second.updated, false);
    assert.equal(second.files[0]?.updated, false);
  });
});

test('runSddSyncDocs incluye contexto explícito change/stage/task en resultado', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-context-', (repoRoot) => {
    writeCanonicalDoc(
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

    const result = runSddSyncDocs({
      repoRoot,
      dryRun: true,
      change: 'rgo-1700-01',
      stage: 'PRE_PUSH',
      task: 'P12.F2.T63',
    });

    assert.equal(result.context.change, 'rgo-1700-01');
    assert.equal(result.context.stage, 'PRE_PUSH');
    assert.equal(result.context.task, 'P12.F2.T63');
  });
});

test('runSddSyncDocs soporta múltiples documentos canónicos de forma determinista', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-multi-target-', (repoRoot) => {
    const firstPath = writeCanonicalDoc(
      repoRoot,
      [
        '# First',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: first',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );
    const secondRelativePath = 'docs/ops/secondary-sync.md';
    const secondPath = join(repoRoot, secondRelativePath);
    mkdirSync(dirname(secondPath), { recursive: true });
    writeFileSync(
      secondPath,
      [
        '# Second',
        '',
        '<!-- PUMUKI:BEGIN SECONDARY_STATUS -->',
        '- stale: second',
        '<!-- PUMUKI:END SECONDARY_STATUS -->',
        '',
      ].join('\n'),
      'utf8'
    );

    const result = runSddSyncDocs({
      repoRoot,
      dryRun: false,
      targets: [
        {
          path: 'docs/technical/08-validation/refactor/pumuki-integration-feedback.md',
          sections: [
            {
              id: 'sdd-status',
              beginMarker: '<!-- PUMUKI:BEGIN SDD_STATUS -->',
              endMarker: '<!-- PUMUKI:END SDD_STATUS -->',
              renderBody: () => '- value: first-updated',
            },
          ],
        },
        {
          path: secondRelativePath,
          sections: [
            {
              id: 'secondary-status',
              beginMarker: '<!-- PUMUKI:BEGIN SECONDARY_STATUS -->',
              endMarker: '<!-- PUMUKI:END SECONDARY_STATUS -->',
              renderBody: () => '- value: second-updated',
            },
          ],
        },
      ],
    });

    assert.equal(result.files.length, 2);
    assert.equal(result.files[0]?.updated, true);
    assert.equal(result.files[1]?.updated, true);
    assert.match(readFileSync(firstPath, 'utf8'), /first-updated/);
    assert.match(readFileSync(secondPath, 'utf8'), /second-updated/);
  });
});

test('runSddSyncDocs es fail-safe: conflicto en un archivo evita escritura parcial de otros archivos', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-failsafe-', (repoRoot) => {
    const firstPath = writeCanonicalDoc(
      repoRoot,
      [
        '# First',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: first',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );
    const secondRelativePath = 'docs/ops/secondary-sync.md';
    const secondPath = join(repoRoot, secondRelativePath);
    mkdirSync(dirname(secondPath), { recursive: true });
    writeFileSync(secondPath, '# Second without markers\n', 'utf8');

    const firstBefore = readFileSync(firstPath, 'utf8');
    const secondBefore = readFileSync(secondPath, 'utf8');

    assert.throws(
      () =>
        runSddSyncDocs({
          repoRoot,
          dryRun: false,
          targets: [
            {
              path: 'docs/technical/08-validation/refactor/pumuki-integration-feedback.md',
              sections: [
                {
                  id: 'sdd-status',
                  beginMarker: '<!-- PUMUKI:BEGIN SDD_STATUS -->',
                  endMarker: '<!-- PUMUKI:END SDD_STATUS -->',
                  renderBody: () => '- value: first-updated',
                },
              ],
            },
            {
              path: secondRelativePath,
              sections: [
                {
                  id: 'secondary-status',
                  beginMarker: '<!-- PUMUKI:BEGIN SECONDARY_STATUS -->',
                  endMarker: '<!-- PUMUKI:END SECONDARY_STATUS -->',
                  renderBody: () => '- value: second-updated',
                },
              ],
            },
          ],
        }),
      /sync-docs conflict/i
    );

    const firstAfter = readFileSync(firstPath, 'utf8');
    const secondAfter = readFileSync(secondPath, 'utf8');
    assert.equal(firstAfter, firstBefore);
    assert.equal(secondAfter, secondBefore);
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
