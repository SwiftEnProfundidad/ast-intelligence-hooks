import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runLifecycleAdapterInstall } from '../adapter';
import { parseLifecycleCliArgs } from '../cli';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const createGitRepo = (): string => {
  const repo = join(tmpdir(), `pumuki-adapter-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(repo, { recursive: true });
  runGit(repo, ['init', '-b', 'main']);
  runGit(repo, ['config', 'user.email', 'pumuki-test@example.com']);
  runGit(repo, ['config', 'user.name', 'Pumuki Test']);
  writeFileSync(join(repo, 'README.md'), '# fixture\n', 'utf8');
  runGit(repo, ['add', '.']);
  runGit(repo, ['commit', '-m', 'chore: fixture']);
  return repo;
};

test('parseLifecycleCliArgs soporta comando adapter install', () => {
  const parsed = parseLifecycleCliArgs(['adapter', 'install', '--agent=codex']);
  assert.equal(parsed.command, 'adapter');
  assert.equal(parsed.adapterCommand, 'install');
  assert.equal(parsed.adapterAgent, 'codex');
  assert.equal(parsed.adapterDryRun, false);
});

test('runLifecycleAdapterInstall genera scaffolding para codex', () => {
  const repo = createGitRepo();
  try {
    const result = runLifecycleAdapterInstall({
      cwd: repo,
      agent: 'codex',
    });

    assert.equal(result.agent, 'codex');
    assert.equal(result.changedFiles.length > 0, true);
    const codexConfig = join(repo, '.pumuki', 'adapter.json');
    assert.equal(existsSync(codexConfig), true);
    const payload = JSON.parse(readFileSync(codexConfig, 'utf8')) as {
      hooks?: { pre_write?: { command?: string } };
      mcp?: { enterprise?: { command?: string } };
    };
    assert.equal(payload.hooks?.pre_write?.command, 'npx --yes pumuki-pre-write');
    assert.equal(payload.mcp?.enterprise?.command, 'npx --yes pumuki-mcp-enterprise');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleAdapterInstall genera scaffolding para cursor', () => {
  const repo = createGitRepo();
  try {
    const result = runLifecycleAdapterInstall({
      cwd: repo,
      agent: 'cursor',
    });

    assert.equal(result.agent, 'cursor');
    const cursorConfig = join(repo, '.cursor', 'mcp.json');
    assert.equal(existsSync(cursorConfig), true);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleAdapterInstall soporta dry-run sin escribir archivos', () => {
  const repo = createGitRepo();
  try {
    const result = runLifecycleAdapterInstall({
      cwd: repo,
      agent: 'claude',
      dryRun: true,
    });

    assert.equal(result.written, false);
    assert.equal(result.changedFiles.length > 0, true);
    assert.equal(existsSync(join(repo, '.claude', 'settings.json')), false);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
