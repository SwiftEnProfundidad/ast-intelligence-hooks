#!/usr/bin/env node
'use strict';

const { existsSync, readFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

const readConsumerPackageName = (consumerRoot) => {
  try {
    const raw = readFileSync(join(consumerRoot, 'package.json'), 'utf8');
    const parsed = JSON.parse(raw);
    return typeof parsed.name === 'string' ? parsed.name : '';
  } catch {
    return '';
  }
};

const isPumukiFrameworkSourceTree = (consumerRoot) =>
  existsSync(join(consumerRoot, 'integrations', 'lifecycle', 'cli.ts'));

const skipReason = () => {
  if (process.env.PUMUKI_SKIP_POSTINSTALL === '1') {
    return 'PUMUKI_SKIP_POSTINSTALL=1';
  }
  if (process.env.CI === 'true' || process.env.CI === '1') {
    return 'CI';
  }
  if (process.env.npm_config_ignore_scripts === 'true') {
    return 'npm ignore-scripts';
  }
  return '';
};

const main = () => {
  const reason = skipReason();
  if (reason) {
    return 0;
  }

  const consumerRoot = process.env.INIT_CWD || process.cwd();
  if (!existsSync(join(consumerRoot, '.git'))) {
    return 0;
  }

  const packageRoot = resolve(__dirname, '..');
  const pumukiCli = join(packageRoot, 'bin', 'pumuki.js');
  if (!existsSync(pumukiCli)) {
    return 0;
  }

  const pkgName = readConsumerPackageName(consumerRoot);
  const frameworkSelfInstall =
    pkgName === 'pumuki' && isPumukiFrameworkSourceTree(consumerRoot);

  const installArgs = ['install'];
  const env = {
    ...process.env,
    PUMUKI_AUTO_POSTINSTALL: '1',
  };

  if (frameworkSelfInstall) {
    env.PUMUKI_SKIP_OPENSPEC_BOOTSTRAP = '1';
  } else if (process.env.PUMUKI_POSTINSTALL_WITH_MCP !== '0') {
    installArgs.push('--with-mcp');
    const agent =
      typeof process.env.PUMUKI_POSTINSTALL_AGENT === 'string'
      && process.env.PUMUKI_POSTINSTALL_AGENT.trim().length > 0
        ? process.env.PUMUKI_POSTINSTALL_AGENT.trim()
        : 'cursor';
    installArgs.push(`--agent=${agent}`);
  }

  if (process.env.PUMUKI_SKIP_OPENSPEC_BOOTSTRAP === '1') {
    env.PUMUKI_SKIP_OPENSPEC_BOOTSTRAP = '1';
  }

  const result = spawnSync(process.execPath, [pumukiCli, ...installArgs], {
    cwd: consumerRoot,
    env,
    stdio: 'inherit',
  });

  const code = typeof result.status === 'number' ? result.status : 1;
  if (code !== 0) {
    console.error(
      '[pumuki] postinstall: `pumuki install` exited non-zero; npm install will still succeed. Run `npx pumuki install` or `npx pumuki doctor` from the repo root.'
    );
  }
  return 0;
};

process.exitCode = main();
