import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { readLifecyclePolicyValidationSnapshot } from '../policyValidationSnapshot';

const withPreWriteMode = async <T>(
  value: string | undefined,
  callback: () => Promise<T> | T
): Promise<T> => {
  const previous = process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE;
  if (typeof value === 'undefined') {
    delete process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE;
  } else {
    process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE = value;
  }
  try {
    return await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE = previous;
    }
  }
};

test('readLifecyclePolicyValidationSnapshot trata PRE_WRITE como estricto cuando el enforcement efectivo se activa en strict', async () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-policy-validation-prewrite-'));
  try {
    await withPreWriteMode('strict', () => {
      const snapshot = readLifecyclePolicyValidationSnapshot(repoRoot);
      assert.equal(snapshot.stages.PRE_WRITE.strict, true);
    });
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('readLifecyclePolicyValidationSnapshot refleja PRE_WRITE no estricto cuando el enforcement efectivo está en advisory', async () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-policy-validation-prewrite-advisory-'));
  try {
    await withPreWriteMode('advisory', () => {
      const snapshot = readLifecyclePolicyValidationSnapshot(repoRoot);
      assert.equal(snapshot.stages.PRE_WRITE.strict, false);
    });
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
