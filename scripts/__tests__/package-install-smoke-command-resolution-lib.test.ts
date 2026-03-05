import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { resolveConsumerPumukiCommand } from '../package-install-smoke-command-resolution-lib';

const createTempRepo = (): string => mkdtempSync(join(tmpdir(), 'pumuki-smoke-resolve-'));

const cleanupTempRepo = (repoPath: string): void => {
  rmSync(repoPath, { recursive: true, force: true });
};

test('resolveConsumerPumukiCommand prioriza binario local en node_modules/.bin', () => {
  const repoPath = createTempRepo();
  try {
    const binDir = join(repoPath, 'node_modules', '.bin');
    mkdirSync(binDir, { recursive: true });
    writeFileSync(
      join(binDir, 'pumuki-pre-commit'),
      '#!/usr/bin/env sh\nexit 0\n',
      'utf8'
    );

    const resolved = resolveConsumerPumukiCommand({
      consumerRepo: repoPath,
      binary: 'pumuki-pre-commit',
      args: ['--json'],
    });

    assert.equal(resolved.resolution, 'local-bin');
    assert.equal(
      resolved.executable,
      join(repoPath, 'node_modules', '.bin', 'pumuki-pre-commit')
    );
    assert.deepEqual(resolved.args, ['--json']);
  } finally {
    cleanupTempRepo(repoPath);
  }
});

test('resolveConsumerPumukiCommand usa entrypoint local node cuando falta .bin', () => {
  const repoPath = createTempRepo();
  try {
    const entryDir = join(repoPath, 'node_modules', 'pumuki', 'bin');
    mkdirSync(entryDir, { recursive: true });
    writeFileSync(join(entryDir, 'pumuki.js'), 'console.log("ok")\n', 'utf8');

    const resolved = resolveConsumerPumukiCommand({
      consumerRepo: repoPath,
      binary: 'pumuki',
      args: ['status', '--json'],
    });

    assert.equal(resolved.resolution, 'local-node-entry');
    assert.equal(resolved.executable, 'node');
    assert.deepEqual(resolved.args, [
      join(repoPath, 'node_modules', 'pumuki', 'bin', 'pumuki.js'),
      'status',
      '--json',
    ]);
  } finally {
    cleanupTempRepo(repoPath);
  }
});

test('resolveConsumerPumukiCommand cae a npx con --package cuando no existe instalación local', () => {
  const repoPath = createTempRepo();
  try {
    const resolved = resolveConsumerPumukiCommand({
      consumerRepo: repoPath,
      binary: 'pumuki',
      args: ['doctor', '--json'],
    });

    assert.equal(resolved.resolution, 'npx-package');
    assert.equal(resolved.executable, 'npx');
    assert.deepEqual(resolved.args, [
      '--yes',
      '--package',
      'pumuki@latest',
      'pumuki',
      'doctor',
      '--json',
    ]);
  } finally {
    cleanupTempRepo(repoPath);
  }
});
