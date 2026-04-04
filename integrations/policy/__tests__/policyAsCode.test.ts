import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import {
  createPolicyAsCodeSignature,
  resolvePolicyAsCodeTraceMetadata,
} from '../policyAsCode';

test('resolvePolicyAsCodeTraceMetadata returns computed-local valid metadata when contract is missing', async () => {
  await withTempDir('pumuki-policy-as-code-default-', async (repoRoot) => {
    const trace = resolvePolicyAsCodeTraceMetadata({
      stage: 'PRE_PUSH',
      source: 'default',
      bundle: 'gate-policy.default.PRE_PUSH',
      hash: 'a'.repeat(64),
      repoRoot,
    });

    assert.equal(trace.version, 'policy-as-code/default@1.0');
    assert.match(trace.signature, /^[a-f0-9]{64}$/i);
    assert.equal(trace.policySource, 'computed-local');
    assert.equal(trace.validation.status, 'valid');
    assert.equal(trace.validation.code, 'POLICY_AS_CODE_VALID');
  });
});

test('resolvePolicyAsCodeTraceMetadata returns unsigned in strict mode when contract is missing', async () => {
  await withTempDir('pumuki-policy-as-code-strict-', async (repoRoot) => {
    const previousStrict = process.env.PUMUKI_POLICY_STRICT;
    process.env.PUMUKI_POLICY_STRICT = '1';
    try {
      const trace = resolvePolicyAsCodeTraceMetadata({
        stage: 'PRE_PUSH',
        source: 'default',
        bundle: 'gate-policy.default.PRE_PUSH',
        hash: 'a'.repeat(64),
        repoRoot,
      });

      assert.equal(trace.validation.status, 'unsigned');
      assert.equal(trace.validation.code, 'POLICY_AS_CODE_UNSIGNED');
      assert.equal(trace.validation.strict, true);
    } finally {
      if (typeof previousStrict === 'undefined') {
        delete process.env.PUMUKI_POLICY_STRICT;
      } else {
        process.env.PUMUKI_POLICY_STRICT = previousStrict;
      }
    }
  });
});

test('resolvePolicyAsCodeTraceMetadata returns unknown-source when contract source mismatches runtime profile', async () => {
  await withTempDir('pumuki-policy-as-code-source-mismatch-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      join(repoRoot, '.pumuki', 'policy-as-code.json'),
      JSON.stringify(
        {
          version: '1.0',
          source: 'skills.policy',
          signatures: {
            PRE_COMMIT: 'a'.repeat(64),
            PRE_PUSH: 'b'.repeat(64),
            CI: 'c'.repeat(64),
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const trace = resolvePolicyAsCodeTraceMetadata({
      stage: 'PRE_PUSH',
      source: 'default',
      bundle: 'gate-policy.default.PRE_PUSH',
      hash: 'a'.repeat(64),
      repoRoot,
    });

    assert.equal(trace.validation.status, 'unknown-source');
    assert.equal(trace.validation.code, 'POLICY_AS_CODE_UNKNOWN_SOURCE');
    assert.equal(trace.policySource, 'file:.pumuki/policy-as-code.json');
  });
});

test('resolvePolicyAsCodeTraceMetadata validates signature when contract matches runtime profile', async () => {
  await withTempDir('pumuki-policy-as-code-valid-signature-', async (repoRoot) => {
    const runtime = {
      stage: 'PRE_PUSH' as const,
      source: 'default' as const,
      bundle: 'gate-policy.default.PRE_PUSH',
      hash: 'a'.repeat(64),
    };
    const signature = createPolicyAsCodeSignature({
      stage: runtime.stage,
      source: runtime.source,
      bundle: runtime.bundle,
      hash: runtime.hash,
      version: '1.0',
    });

    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      join(repoRoot, '.pumuki', 'policy-as-code.json'),
      JSON.stringify(
        {
          version: '1.0',
          source: 'default',
          signatures: {
            PRE_COMMIT: 'a'.repeat(64),
            PRE_PUSH: signature,
            CI: 'c'.repeat(64),
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const trace = resolvePolicyAsCodeTraceMetadata({
      stage: runtime.stage,
      source: runtime.source,
      bundle: runtime.bundle,
      hash: runtime.hash,
      repoRoot,
    });

    assert.equal(trace.validation.status, 'valid');
    assert.equal(trace.validation.code, 'POLICY_AS_CODE_VALID');
    assert.equal(trace.signature, signature);
  });
});

test('resolvePolicyAsCodeTraceMetadata detects expired contract', async () => {
  await withTempDir('pumuki-policy-as-code-expired-', async (repoRoot) => {
    const runtime = {
      stage: 'PRE_PUSH' as const,
      source: 'default' as const,
      bundle: 'gate-policy.default.PRE_PUSH',
      hash: 'a'.repeat(64),
    };
    const signature = createPolicyAsCodeSignature({
      stage: runtime.stage,
      source: runtime.source,
      bundle: runtime.bundle,
      hash: runtime.hash,
      version: '1.0',
    });

    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      join(repoRoot, '.pumuki', 'policy-as-code.json'),
      JSON.stringify(
        {
          version: '1.0',
          source: 'default',
          expires_at: '2000-01-01T00:00:00.000Z',
          signatures: {
            PRE_COMMIT: 'a'.repeat(64),
            PRE_PUSH: signature,
            CI: 'c'.repeat(64),
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const trace = resolvePolicyAsCodeTraceMetadata({
      stage: runtime.stage,
      source: runtime.source,
      bundle: runtime.bundle,
      hash: runtime.hash,
      repoRoot,
    });

    assert.equal(trace.validation.status, 'expired');
    assert.equal(trace.validation.code, 'POLICY_AS_CODE_CONTRACT_EXPIRED');
  });
});
