#!/usr/bin/env node
'use strict';

const { existsSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const { resolveConsumerPostinstallInstallExtras } = require('./consumer-postinstall-resolve-args.cjs');

const skipReason = (env = process.env) => {
  if (env.PUMUKI_SKIP_POSTINSTALL === '1') {
    return 'PUMUKI_SKIP_POSTINSTALL=1';
  }
  if (env.CI === 'true' || env.CI === '1') {
    return 'CI';
  }
  if (env.npm_config_ignore_scripts === 'true') {
    return 'npm ignore-scripts';
  }
  return '';
};

const normalizePumukiInstallResult = (result) => {
  if (result.error) {
    return {
      code: 1,
      errorMessage: result.error.message ?? String(result.error),
    };
  }

  return { code: typeof result.status === 'number' ? result.status : 1, errorMessage: null };
};

const runPostinstall = ({
  spawnSyncFn = spawnSync,
  packageRoot = resolve(__dirname, '..'),
  consumerRoot = process.env.INIT_CWD || process.cwd(),
  env = process.env,
  logger = console,
} = {}) => {
  const reason = skipReason(env);
  if (reason) {
    return 0;
  }

  if (!existsSync(join(consumerRoot, '.git'))) {
    return 0;
  }

  const pumukiCli = join(packageRoot, 'bin', 'pumuki.js');
  if (!existsSync(pumukiCli)) {
    return 0;
  }

  const postinstallEnv = {
    ...env,
    PUMUKI_AUTO_POSTINSTALL: '1',
    PUMUKI_SKIP_OPENSPEC_BOOTSTRAP: env.PUMUKI_SKIP_OPENSPEC_BOOTSTRAP ?? '1',
  };

  const { extras: installExtras, reason: mcpReason } = resolveConsumerPostinstallInstallExtras(
    consumerRoot,
    postinstallEnv
  );
  if (installExtras.length > 0 && postinstallEnv.PUMUKI_VERBOSE_INSTALL === '1') {
    logger.debug(
      `[pumuki] postinstall: mcp wiring (${mcpReason}): ${installExtras.join(' ')}`
    );
  }

  if (installExtras.length === 0 && postinstallEnv.PUMUKI_VERBOSE_INSTALL === '1') {
    logger.debug('[pumuki] postinstall: no extra args; running baseline install only.');
  }

  const result = normalizePumukiInstallResult(
    spawnSyncFn(process.execPath, [pumukiCli, 'install', ...installExtras], {
      cwd: consumerRoot,
      env: postinstallEnv,
      stdio: 'inherit',
    })
  );

  if (result.code !== 0) {
    const scope = installExtras.length > 0 ? 'postinstall+extras' : 'postinstall';
    const severityHint =
      installExtras.length > 0
        ? 'Run `pumuki install` manually with the desired options to investigar y resolver el fallo.'
        : 'Run `pumuki install` o `pumuki doctor` desde la raíz del repo.';
    logger.error(
      `[pumuki] postinstall: install exited non-zero (scope=${scope}, reason=${mcpReason}). ${severityHint}`
    );
    if (result.errorMessage) {
      logger.error(`[pumuki] postinstall: ${result.errorMessage}`);
    }
  }

  return result.code;
};

const main = () => {
  return runPostinstall({
    spawnSyncFn: spawnSync,
    packageRoot: resolve(__dirname, '..'),
    consumerRoot: process.env.INIT_CWD || process.cwd(),
    env: process.env,
    logger: console,
  });
};

process.exitCode = main();

module.exports = {
  runPostinstall,
  skipReason,
};
