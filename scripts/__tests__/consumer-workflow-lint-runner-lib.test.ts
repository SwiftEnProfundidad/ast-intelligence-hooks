import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  assertConsumerWorkflowLintBinary,
  runConsumerWorkflowLint,
} from '../consumer-workflow-lint-runner-lib';

const withTempDir = (run: (root: string) => void): void => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'pumuki-workflow-lint-'));
  try {
    run(tempRoot);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
};

test('assertConsumerWorkflowLintBinary validates missing explicit binary path', () => {
  withTempDir((root) => {
    assert.throws(
      () => assertConsumerWorkflowLintBinary('./bin/missing-actionlint', root),
      /actionlint binary not found/
    );
  });
});

test('runConsumerWorkflowLint returns no-workflows result for empty workflow directory', () => {
  withTempDir((root) => {
    const repoPath = join(root, 'repo');
    mkdirSync(join(repoPath, '.github/workflows'), { recursive: true });

    const result = runConsumerWorkflowLint({
      repoPath,
      outFile: 'unused.md',
      actionlintBin: 'actionlint',
    });

    assert.equal(result.exitCode, 0);
    assert.match(result.output, /No workflow files found/);
  });
});

test('runConsumerWorkflowLint captures command failure output deterministically', () => {
  withTempDir((root) => {
    const repoPath = join(root, 'repo');
    const workflowsDir = join(repoPath, '.github/workflows');
    mkdirSync(workflowsDir, { recursive: true });
    writeFileSync(join(workflowsDir, 'ci.yml'), 'name: CI', 'utf8');

    const fakeActionlint = join(root, 'fake-actionlint.sh');
    writeFileSync(fakeActionlint, '#!/usr/bin/env bash\necho \"lint boom\" >&2\nexit 7\n', 'utf8');
    chmodSync(fakeActionlint, 0o755);

    const result = runConsumerWorkflowLint({
      repoPath,
      outFile: 'unused.md',
      actionlintBin: fakeActionlint,
    });

    assert.equal(result.exitCode, 7);
    assert.match(result.output, /lint boom/);
    assert.match(result.workflowPath, /\.github\/workflows\/\*\.\{yml,yaml\}$/);
  });
});
