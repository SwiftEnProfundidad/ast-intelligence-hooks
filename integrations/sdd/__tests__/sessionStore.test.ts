import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  closeSddSession,
  openSddSession,
  readSddSession,
  refreshSddSession,
} from '../sessionStore';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const createRepoWithOpenSpecChange = (): string => {
  const repo = join(
    tmpdir(),
    `pumuki-sdd-session-test-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
  mkdirSync(repo, { recursive: true });
  runGit(repo, ['init', '-b', 'main']);
  runGit(repo, ['config', 'user.email', 'pumuki-test@example.com']);
  runGit(repo, ['config', 'user.name', 'Pumuki Test']);
  writeFileSync(join(repo, 'README.md'), '# fixture\n', 'utf8');
  mkdirSync(join(repo, 'openspec', 'changes', 'add-auth-feature'), {
    recursive: true,
  });
  writeFileSync(
    join(repo, 'openspec', 'changes', 'add-auth-feature', 'proposal.md'),
    '# proposal\n',
    'utf8'
  );
  runGit(repo, ['add', '.']);
  runGit(repo, ['commit', '-m', 'chore: fixture']);
  return repo;
};

test('open/read/refresh/close session persists state per repository', () => {
  const repo = createRepoWithOpenSpecChange();
  const previousCwd = process.cwd();
  try {
    process.chdir(repo);

    const opened = openSddSession({
      changeId: 'Add-Auth-Feature',
      ttlMinutes: 30,
    });
    assert.equal(opened.active, true);
    assert.equal(opened.changeId, 'add-auth-feature');
    assert.equal(opened.valid, true);

    const readBack = readSddSession();
    assert.equal(readBack.active, true);
    assert.equal(readBack.changeId, 'add-auth-feature');
    assert.equal(readBack.valid, true);

    const refreshed = refreshSddSession({
      ttlMinutes: 60,
    });
    assert.equal(refreshed.active, true);
    assert.equal(refreshed.ttlMinutes, 60);
    assert.equal(refreshed.valid, true);

    const closed = closeSddSession();
    assert.equal(closed.active, false);
    assert.equal(closed.valid, false);
    assert.equal(closed.changeId, undefined);
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('readSddSession normaliza changeId legado en mayúsculas a lowercase canónico', () => {
  const repo = createRepoWithOpenSpecChange();
  const previousCwd = process.cwd();
  try {
    process.chdir(repo);
    openSddSession({
      changeId: 'add-auth-feature',
      ttlMinutes: 30,
    });
    runGit(repo, ['config', '--local', 'pumuki.sdd.session.change', 'ADD-AUTH-FEATURE']);

    const readBack = readSddSession();
    assert.equal(readBack.active, true);
    assert.equal(readBack.changeId, 'add-auth-feature');
    assert.equal(readBack.valid, true);
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('openSddSession falla cuando el changeId no existe en openspec/changes', () => {
  const repo = createRepoWithOpenSpecChange();
  const previousCwd = process.cwd();
  try {
    process.chdir(repo);
    assert.throws(
      () =>
        openSddSession({
          changeId: 'missing-change',
        }),
      /not found/i
    );
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('openSddSession permite --change=auto cuando existe un único cambio activo', () => {
  const repo = createRepoWithOpenSpecChange();
  const previousCwd = process.cwd();
  try {
    process.chdir(repo);
    const opened = openSddSession({
      changeId: 'auto',
    });
    assert.equal(opened.active, true);
    assert.equal(opened.changeId, 'add-auth-feature');
    assert.equal(opened.valid, true);
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('openSddSession con --change=auto falla cuando hay múltiples cambios activos', () => {
  const repo = createRepoWithOpenSpecChange();
  const previousCwd = process.cwd();
  try {
    process.chdir(repo);
    mkdirSync(join(repo, 'openspec', 'changes', 'rgo-2000-01'), {
      recursive: true,
    });
    writeFileSync(
      join(repo, 'openspec', 'changes', 'rgo-2000-01', 'proposal.md'),
      '# proposal\n',
      'utf8'
    );
    assert.throws(
      () =>
        openSddSession({
          changeId: 'auto',
        }),
      /Multiple active OpenSpec changes found/i
    );
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('openSddSession falla cuando el change activo está archivado', () => {
  const repo = createRepoWithOpenSpecChange();
  const previousCwd = process.cwd();
  try {
    process.chdir(repo);
    mkdirSync(join(repo, 'openspec', 'changes', 'archive', 'add-auth-feature'), {
      recursive: true,
    });
    assert.throws(
      () =>
        openSddSession({
          changeId: 'add-auth-feature',
        }),
      /archived/i
    );
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('refreshSddSession falla cuando no existe sesión activa', () => {
  const repo = createRepoWithOpenSpecChange();
  const previousCwd = process.cwd();
  try {
    process.chdir(repo);
    assert.throws(
      () => refreshSddSession(),
      /No active SDD session to refresh/i
    );
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('readSddSession marca la sesión como inválida cuando expiresAt ya venció', () => {
  const repo = createRepoWithOpenSpecChange();
  const previousCwd = process.cwd();
  try {
    process.chdir(repo);
    openSddSession({
      changeId: 'add-auth-feature',
      ttlMinutes: 30,
    });
    runGit(repo, [
      'config',
      '--local',
      'pumuki.sdd.session.expiresAt',
      '2000-01-01T00:00:00.000Z',
    ]);

    const readBack = readSddSession();
    assert.equal(readBack.active, false);
    assert.equal(readBack.valid, false);
    assert.equal(readBack.remainingSeconds, 0);
    assert.equal(readBack.changeId, 'add-auth-feature');

    const refreshed = refreshSddSession();
    assert.equal(refreshed.active, true);
    assert.equal(refreshed.valid, true);
    assert.equal(refreshed.changeId, 'add-auth-feature');
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('refreshSddSession realinea la sesión con la única task activa del tracking', () => {
  const repo = createRepoWithOpenSpecChange();
  const previousCwd = process.cwd();
  try {
    process.chdir(repo);
    mkdirSync(join(repo, 'openspec', 'changes', 'rgo-1900-25'), {
      recursive: true,
    });
    writeFileSync(
      join(repo, 'openspec', 'changes', 'rgo-1900-25', 'proposal.md'),
      '# proposal\n',
      'utf8'
    );
    mkdirSync(join(repo, 'docs'), { recursive: true });
    writeFileSync(
      join(repo, 'docs', 'RURALGO_SEGUIMIENTO.md'),
      [
        '| Estado | Task ID | Foco | Definition of done |',
        '| --- | --- | --- | --- |',
        '| ✅ | RGO-1900-24 | Cart | listo |',
        '| 🚧 | RGO-1900-25 | Checkout/Payment | pendiente |',
      ].join('\n'),
      'utf8'
    );
    openSddSession({
      changeId: 'add-auth-feature',
      ttlMinutes: 30,
    });
    runGit(repo, [
      'config',
      '--local',
      'pumuki.sdd.session.expiresAt',
      '2000-01-01T00:00:00.000Z',
    ]);

    const refreshed = refreshSddSession({
      ttlMinutes: 90,
    });

    assert.equal(refreshed.active, true);
    assert.equal(refreshed.valid, true);
    assert.equal(refreshed.changeId, 'rgo-1900-25');
    assert.equal(refreshed.ttlMinutes, 90);
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('refreshSddSession no reutiliza una sesión antigua si el tracking activo no existe en OpenSpec', () => {
  const repo = createRepoWithOpenSpecChange();
  const previousCwd = process.cwd();
  try {
    process.chdir(repo);
    mkdirSync(join(repo, 'docs'), { recursive: true });
    writeFileSync(
      join(repo, 'docs', 'RURALGO_SEGUIMIENTO.md'),
      [
        '| Estado | Task ID | Foco | Definition of done |',
        '| --- | --- | --- | --- |',
        '| 🚧 | RGO-1900-25 | Checkout/Payment | pendiente |',
      ].join('\n'),
      'utf8'
    );
    openSddSession({
      changeId: 'add-auth-feature',
      ttlMinutes: 30,
    });

    assert.throws(
      () => refreshSddSession(),
      /Active tracking change "rgo-1900-25" does not exist in openspec\/changes/i
    );

    const readBack = readSddSession();
    assert.equal(readBack.changeId, 'add-auth-feature');
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('refreshSddSession ignora bullets operativos que no son task ids', () => {
  const repo = createRepoWithOpenSpecChange();
  const previousCwd = process.cwd();
  try {
    process.chdir(repo);
    mkdirSync(join(repo, 'openspec', 'changes', 'rgo-1900-25'), {
      recursive: true,
    });
    writeFileSync(
      join(repo, 'openspec', 'changes', 'rgo-1900-25', 'proposal.md'),
      '# proposal\n',
      'utf8'
    );
    mkdirSync(join(repo, 'docs'), { recursive: true });
    writeFileSync(
      join(repo, 'docs', 'RURALGO_SEGUIMIENTO.md'),
      [
        '| Estado | Task ID | Foco | Definition of done |',
        '| --- | --- | --- | --- |',
        '| 🚧 | RGO-1900-25 | Checkout/Payment | pendiente |',
        '',
        '- 🚧 Siguiente',
        '- 🚧 next',
        '- 🚧 delegable',
      ].join('\n'),
      'utf8'
    );
    openSddSession({
      changeId: 'add-auth-feature',
      ttlMinutes: 30,
    });

    const refreshed = refreshSddSession({
      ttlMinutes: 90,
    });

    assert.equal(refreshed.changeId, 'rgo-1900-25');
    assert.equal(refreshed.valid, true);
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('refreshSddSession aplica TTL por defecto cuando el TTL persistido es inválido', () => {
  const repo = createRepoWithOpenSpecChange();
  const previousCwd = process.cwd();
  try {
    process.chdir(repo);
    openSddSession({
      changeId: 'add-auth-feature',
      ttlMinutes: 15,
    });
    runGit(repo, ['config', '--local', 'pumuki.sdd.session.ttlMinutes', '0']);

    const refreshed = refreshSddSession();
    assert.equal(refreshed.active, true);
    assert.equal(refreshed.ttlMinutes, 45);
    assert.equal(refreshed.valid, true);
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});
