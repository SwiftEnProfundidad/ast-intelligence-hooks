#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const { join } = require('node:path');

if (!process.env.PUMUKI_SMOKE_REPO_ROOT || !String(process.env.PUMUKI_SMOKE_REPO_ROOT).trim()) {
  console.error(
    '[pumuki] smoke:pumuki-surface-installed requires PUMUKI_SMOKE_REPO_ROOT (absolute path to consumer repo).'
  );
  process.exit(1);
}

const root = join(__dirname, '..');
const env = {
  ...process.env,
  PUMUKI_SMOKE_BIN_STRATEGY: 'installed',
};

const result = spawnSync(
  'npx',
  ['--yes', 'tsx@4.21.0', 'scripts/pumuki-full-surface-smoke.ts'],
  {
    cwd: root,
    env,
    stdio: 'inherit',
  }
);

const code = typeof result.status === 'number' ? result.status : 1;
process.exitCode = code;
