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
      mcp?: { enterprise?: { command?: string }; evidence?: { command?: string } };
    };
    assert.equal(payload.hooks?.pre_write?.command, 'npx --yes pumuki-pre-write');
    assert.equal(
      payload.mcp?.enterprise?.command,
      'npx --yes --package pumuki@latest pumuki-mcp-enterprise-stdio'
    );
    assert.equal(
      payload.mcp?.evidence?.command,
      'npx --yes --package pumuki@latest pumuki-mcp-evidence-stdio'
    );
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

test('runLifecycleAdapterInstall integra MCP global de windsurf sin romper servidores existentes', () => {
  const repo = createGitRepo();
  const homeDir = join(tmpdir(), `pumuki-adapter-home-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const windsurfConfigDir = join(homeDir, '.codeium', 'windsurf');
  const mcpConfigPath = join(windsurfConfigDir, 'mcp_config.json');
  mkdirSync(windsurfConfigDir, { recursive: true });
  writeFileSync(
    mcpConfigPath,
    JSON.stringify(
      {
        mcpServers: {
          existing: {
            command: 'npx',
            args: ['-y', '@example/server'],
            disabled: true,
          },
        },
      },
      null,
      2
    ),
    'utf8'
  );

  const previousHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const result = runLifecycleAdapterInstall({
      cwd: repo,
      agent: 'windsurf',
    });

    assert.equal(result.agent, 'windsurf');
    assert.equal(result.changedFiles.includes('$HOME/.codeium/windsurf/mcp_config.json'), true);
    assert.equal(existsSync(join(repo, '.codeium', 'adapter', 'hooks.json')), true);

    const payload = JSON.parse(readFileSync(mcpConfigPath, 'utf8')) as {
      mcpServers?: Record<
        string,
        {
          command?: string;
          args?: string[];
          disabled?: boolean;
          env?: Record<string, string>;
        }
      >;
    };
    assert.equal(payload.mcpServers?.existing?.command, 'npx');
    assert.equal(payload.mcpServers?.existing?.disabled, true);
    assert.equal(payload.mcpServers?.['pumuki-enterprise']?.command, 'npx');
    assert.deepEqual(payload.mcpServers?.['pumuki-enterprise']?.args, [
      '--yes',
      '--package',
      'pumuki@latest',
      'pumuki-mcp-enterprise-stdio',
    ]);
    assert.equal(payload.mcpServers?.['pumuki-enterprise']?.env?.PUMUKI_ENTERPRISE_MCP_PORT, '0');
    assert.equal(payload.mcpServers?.['pumuki-enterprise']?.env?.PUMUKI_ENTERPRISE_MCP_HOST, '127.0.0.1');
    assert.equal(payload.mcpServers?.['pumuki-enterprise']?.disabled, false);
    assert.equal(payload.mcpServers?.['pumuki-evidence']?.command, 'npx');
    assert.deepEqual(payload.mcpServers?.['pumuki-evidence']?.args, [
      '--yes',
      '--package',
      'pumuki@latest',
      'pumuki-mcp-evidence-stdio',
    ]);
    assert.equal(payload.mcpServers?.['pumuki-evidence']?.env?.PUMUKI_EVIDENCE_PORT, '0');
    assert.equal(payload.mcpServers?.['pumuki-evidence']?.env?.PUMUKI_EVIDENCE_HOST, '127.0.0.1');
    assert.equal(payload.mcpServers?.['pumuki-evidence']?.env?.PUMUKI_EVIDENCE_ROUTE, '/ai-evidence');
    assert.equal(payload.mcpServers?.['pumuki-evidence']?.disabled, false);
  } finally {
    process.env.HOME = previousHome;
    rmSync(repo, { recursive: true, force: true });
    rmSync(homeDir, { recursive: true, force: true });
  }
});

test('runLifecycleAdapterInstall dry-run para windsurf no toca mcp_config global', () => {
  const repo = createGitRepo();
  const homeDir = join(tmpdir(), `pumuki-adapter-home-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const windsurfConfigDir = join(homeDir, '.codeium', 'windsurf');
  const mcpConfigPath = join(windsurfConfigDir, 'mcp_config.json');
  mkdirSync(windsurfConfigDir, { recursive: true });
  const initialContents = JSON.stringify(
    {
      mcpServers: {
        existing: {
          command: 'npx',
          args: ['-y', '@example/server'],
          disabled: true,
        },
      },
    },
    null,
    2
  );
  writeFileSync(mcpConfigPath, initialContents, 'utf8');

  const previousHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const result = runLifecycleAdapterInstall({
      cwd: repo,
      agent: 'windsurf',
      dryRun: true,
    });

    assert.equal(result.written, false);
    assert.equal(result.changedFiles.includes('$HOME/.codeium/windsurf/mcp_config.json'), true);
    assert.equal(existsSync(join(repo, '.codeium', 'adapter', 'hooks.json')), false);
    assert.equal(readFileSync(mcpConfigPath, 'utf8'), initialContents);
  } finally {
    process.env.HOME = previousHome;
    rmSync(repo, { recursive: true, force: true });
    rmSync(homeDir, { recursive: true, force: true });
  }
});
