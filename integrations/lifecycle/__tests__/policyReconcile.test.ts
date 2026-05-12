import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createPolicyAsCodeSignature } from '../../policy/policyAsCode';
import { readLifecyclePolicyValidationSnapshot } from '../policyValidationSnapshot';
import { runPolicyReconcile } from '../policyReconcile';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const withFixtureRepo = async (
  prefix: string,
  callback: (repoRoot: string) => Promise<void> | void
): Promise<void> => {
  const repoRoot = mkdtempSync(join(tmpdir(), prefix));
  runGit(repoRoot, ['init', '-b', 'main']);
  runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
  runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
  writeFileSync(join(repoRoot, 'README.md'), '# fixture\n', 'utf8');
  try {
    await callback(repoRoot);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
};

const writeValidAgentsAndSkillsLock = (repoRoot: string): void => {
  writeFileSync(
    join(repoRoot, 'AGENTS.md'),
    [
      '# AGENTS',
      'skills:',
      '- windsurf-rules-backend',
      '- windsurf-rules-frontend',
      '- windsurf-rules-ios',
      '- swift-concurrency',
      '- swiftui-expert-skill',
      '- windsurf-rules-android',
      '',
    ].join('\n'),
    'utf8'
  );
  writeFileSync(
    join(repoRoot, 'skills.lock.json'),
    JSON.stringify(
      {
        version: '1.0',
        bundles: [
          { name: 'backend', source: 'docs/codex-skills/windsurf-rules-backend.md' },
          { name: 'frontend', source: 'docs/codex-skills/windsurf-rules-frontend.md' },
          { name: 'ios', source: 'docs/codex-skills/windsurf-rules-ios.md' },
          { name: 'swift-concurrency', source: 'docs/codex-skills/swift-concurrency.md' },
          { name: 'swiftui-expert-skill', source: 'docs/codex-skills/swiftui-expert-skill.md' },
          { name: 'android', source: 'docs/codex-skills/windsurf-rules-android.md' },
        ],
      },
      null,
      2
    ),
    'utf8'
  );
};

const withPolicyStrictEnv = async <T>(callback: () => Promise<T> | T): Promise<T> => {
  const previous = process.env.PUMUKI_POLICY_STRICT;
  process.env.PUMUKI_POLICY_STRICT = '1';
  try {
    return await callback();
  } finally {
    if (typeof previous === 'string') {
      process.env.PUMUKI_POLICY_STRICT = previous;
    } else {
      delete process.env.PUMUKI_POLICY_STRICT;
    }
  }
};

const writeValidPolicyAsCodeContract = (repoRoot: string): void => {
  const snapshot = readLifecyclePolicyValidationSnapshot(repoRoot);
  const preWriteStage = snapshot.stages.PRE_WRITE;
  const contractSource =
    preWriteStage.source === 'skills.policy' || preWriteStage.source === 'hard-mode'
      ? preWriteStage.source
      : 'default';
  const preWriteSignature = createPolicyAsCodeSignature({
    stage: 'PRE_COMMIT',
    source: contractSource,
    bundle: preWriteStage.bundle,
    hash: preWriteStage.hash,
    version: '1.0',
  });
  const preCommitSignature = snapshot.stages.PRE_COMMIT.signature;
  const prePushSignature = snapshot.stages.PRE_PUSH.signature;
  const ciSignature = snapshot.stages.CI.signature;
  assert.ok(preCommitSignature);
  assert.ok(prePushSignature);
  assert.ok(ciSignature);
  mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
  writeFileSync(
    join(repoRoot, '.pumuki', 'policy-as-code.json'),
    JSON.stringify(
      {
        version: '1.0',
        source: 'default',
        strict: {
          PRE_WRITE: snapshot.stages.PRE_WRITE.strict,
          PRE_COMMIT: snapshot.stages.PRE_COMMIT.strict,
          PRE_PUSH: snapshot.stages.PRE_PUSH.strict,
          CI: snapshot.stages.CI.strict,
        },
        signatures: {
          PRE_WRITE: preWriteSignature,
          PRE_COMMIT: preCommitSignature,
          PRE_PUSH: prePushSignature,
          CI: ciSignature,
        },
        expires_at: '2999-01-01T00:00:00.000Z',
      },
      null,
      2
    ),
    'utf8'
  );
};

test('runPolicyReconcile devuelve PASS cuando contrato mínimo está alineado', async () => {
  await withFixtureRepo('pumuki-policy-reconcile-pass-', (repoRoot) => {
    writeValidAgentsAndSkillsLock(repoRoot);
    const report = runPolicyReconcile({
      repoRoot,
      now: () => new Date('2026-03-05T13:00:00.000Z'),
    });
    assert.equal(report.command, 'pumuki policy reconcile');
    assert.equal(report.generatedAt, '2026-03-05T13:00:00.000Z');
    assert.equal(report.strictRequested, false);
    assert.equal(report.summary.blocking, 0);
    assert.equal(report.summary.status, 'PASS');
  });
});

test('runPolicyReconcile bloquea si falta AGENTS.md', async () => {
  await withFixtureRepo('pumuki-policy-reconcile-agents-missing-', (repoRoot) => {
    writeFileSync(
      join(repoRoot, 'skills.lock.json'),
      JSON.stringify({ version: '1.0', bundles: [] }, null, 2),
      'utf8'
    );
    const report = runPolicyReconcile({ repoRoot });
    assert.equal(report.summary.status, 'BLOCKED');
    assert.ok(report.drifts.some((drift) => drift.code === 'AGENTS_FILE_MISSING'));
  });
});

test('runPolicyReconcile bloquea si falta skills.lock.json', async () => {
  await withFixtureRepo('pumuki-policy-reconcile-lock-missing-', (repoRoot) => {
    writeFileSync(
      join(repoRoot, 'AGENTS.md'),
      'windsurf-rules-backend\nwindsurf-rules-frontend\n',
      'utf8'
    );
    const report = runPolicyReconcile({ repoRoot });
    assert.equal(report.summary.status, 'BLOCKED');
    assert.ok(report.drifts.some((drift) => drift.code === 'SKILLS_LOCK_MISSING'));
  });
});

test('runPolicyReconcile --strict bloquea cuando falta contrato file-based firmado', async () => {
  await withFixtureRepo('pumuki-policy-reconcile-strict-blocks-', async (repoRoot) => {
    writeValidAgentsAndSkillsLock(repoRoot);
    await withPolicyStrictEnv(async () => {
      const report = runPolicyReconcile({
        repoRoot,
        strict: true,
      });
      assert.equal(report.strictRequested, true);
      assert.equal(report.summary.status, 'BLOCKED');
      assert.ok(
        report.drifts.some((drift) => drift.code === 'POLICY_STAGE_UNSIGNED_OR_COMPUTED')
      );
      assert.ok(
        report.drifts.some((drift) => drift.code === 'POLICY_STAGE_INVALID')
      );
    });
  });
});

test('runPolicyReconcile --strict devuelve PASS con contrato firmado + strict activo', async () => {
  await withFixtureRepo('pumuki-policy-reconcile-strict-pass-', async (repoRoot) => {
    writeValidAgentsAndSkillsLock(repoRoot);
    await withPolicyStrictEnv(async () => {
      writeValidPolicyAsCodeContract(repoRoot);
      const report = runPolicyReconcile({
        repoRoot,
        strict: true,
      });
      assert.equal(report.strictRequested, true);
      assert.equal(report.summary.blocking, 0);
      assert.equal(report.summary.status, 'PASS');
    });
  });
});

test('runPolicyReconcile --strict --apply genera contrato y converge a PASS sin tocar entorno externo', async () => {
  await withFixtureRepo('pumuki-policy-reconcile-strict-apply-', async (repoRoot) => {
    writeValidAgentsAndSkillsLock(repoRoot);
    const report = runPolicyReconcile({
      repoRoot,
      strict: true,
      apply: true,
    });
    assert.equal(report.strictRequested, true);
    assert.equal(report.applyRequested, true);
    assert.equal(report.autofix.attempted, true);
    assert.equal(report.autofix.status, 'APPLIED');
    assert.equal(report.autofix.actions.includes('WRITE_POLICY_AS_CODE_CONTRACT'), true);
    assert.equal(report.summary.status, 'PASS');
    assert.equal(report.summary.blocking, 0);
    const writtenContract = JSON.parse(
      readFileSync(join(repoRoot, '.pumuki', 'policy-as-code.json'), 'utf8')
    ) as {
      strict?: Partial<Record<'PRE_WRITE' | 'PRE_COMMIT' | 'PRE_PUSH' | 'CI', boolean>>;
    };
    assert.equal(writtenContract.strict?.PRE_WRITE, true);
    assert.equal(writtenContract.strict?.PRE_COMMIT, true);
    assert.equal(writtenContract.strict?.PRE_PUSH, true);
    assert.equal(writtenContract.strict?.CI, true);
  });
});

test('runPolicyReconcile --strict --apply recalcula firmas inválidas y converge a PASS', async () => {
  await withFixtureRepo('pumuki-policy-reconcile-invalid-signatures-', async (repoRoot) => {
    writeValidAgentsAndSkillsLock(repoRoot);
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    writeFileSync(
      join(repoRoot, '.pumuki', 'policy-as-code.json'),
      JSON.stringify(
        {
          version: '1.0',
          source: 'default',
          strict: {
            PRE_WRITE: true,
            PRE_COMMIT: true,
            PRE_PUSH: true,
            CI: true,
          },
          signatures: {
            PRE_WRITE: '0'.repeat(64),
            PRE_COMMIT: '1'.repeat(64),
            PRE_PUSH: '2'.repeat(64),
            CI: '3'.repeat(64),
          },
          expires_at: '2999-01-01T00:00:00.000Z',
        },
        null,
        2
      ),
      'utf8'
    );

    const initial = runPolicyReconcile({
      repoRoot,
      strict: true,
    });
    assert.equal(initial.summary.status, 'BLOCKED');
    assert.ok(
      initial.drifts.some(
        (drift) =>
          drift.code === 'POLICY_STAGE_INVALID' &&
          drift.context?.validation_code === 'POLICY_AS_CODE_SIGNATURE_MISMATCH'
      )
    );

    const report = runPolicyReconcile({
      repoRoot,
      strict: true,
      apply: true,
    });

    assert.equal(report.autofix.status, 'APPLIED');
    assert.equal(report.summary.status, 'PASS');
    assert.equal(report.summary.blocking, 0);
    const validation = readLifecyclePolicyValidationSnapshot(repoRoot);
    assert.equal(validation.stages.PRE_WRITE.validationCode, 'POLICY_AS_CODE_VALID');
    assert.equal(validation.stages.PRE_COMMIT.validationCode, 'POLICY_AS_CODE_VALID');
    assert.equal(validation.stages.PRE_PUSH.validationCode, 'POLICY_AS_CODE_VALID');
    assert.equal(validation.stages.CI.validationCode, 'POLICY_AS_CODE_VALID');
  });
});
