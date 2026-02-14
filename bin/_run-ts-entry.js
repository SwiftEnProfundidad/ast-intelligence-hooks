#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

function runTsEntry(relativeEntry, forwardedArgs = []) {
  const packageRoot = resolve(__dirname, '..');
  const entryFile = resolve(packageRoot, relativeEntry);
  let tsxCli;

  try {
    tsxCli = require.resolve('tsx/cli', { paths: [packageRoot] });
  } catch (error) {
    console.error(
      `[pumuki] failed to resolve tsx runtime for ${relativeEntry}: ${error.message}`
    );
    return 1;
  }

  const result = spawnSync(
    process.execPath,
    [tsxCli, entryFile, ...forwardedArgs],
    {
      stdio: 'inherit',
      env: process.env,
    }
  );

  if (result.error) {
    console.error(`[pumuki] failed to execute ${relativeEntry}: ${result.error.message}`);
    return 1;
  }

  return typeof result.status === 'number' ? result.status : 1;
}

module.exports = { runTsEntry };

if (require.main === module) {
  const [entry, ...args] = process.argv.slice(2);
  if (!entry) {
    console.error('Usage: _run-ts-entry <relative-entry.ts> [args...]');
    process.exit(1);
  }
  process.exit(runTsEntry(entry, args));
}
