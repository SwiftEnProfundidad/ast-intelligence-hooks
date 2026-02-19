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
      changeId: 'add-auth-feature',
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
    assert.equal(readBack.active, true);
    assert.equal(readBack.valid, false);
    assert.equal(readBack.remainingSeconds, 0);
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
