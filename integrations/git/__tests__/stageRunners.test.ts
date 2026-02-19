import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { runCiStage, runPreCommitStage, runPrePushStage } from '../stageRunners';
import {
  runGit,
  withGithubBaseRef,
  withSilencedConsoleLog,
  withTempRepo,
} from './helpers/gitTestUtils';

type StageName = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';

type StageThreshold = {
  blockOnOrAbove: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  warnOnOrAbove: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
};

type EvidenceShape = {
  version: string;
  snapshot: {
    stage: StageName;
    outcome: 'PASS' | 'WARN' | 'BLOCK';
    findings: Array<{ ruleId: string }>;
  };
  rulesets: Array<{ platform: string; bundle: string; hash: string }>;
};

const withStageRunnerRepo = async (
  callback: (repoRoot: string) => Promise<void>
): Promise<void> => {
  const previousBypass = process.env.PUMUKI_SDD_BYPASS;
  process.env.PUMUKI_SDD_BYPASS = '1';
  try {
    await withTempRepo(callback, { tempPrefix: 'pumuki-stage-runner-' });
  } finally {
    if (typeof previousBypass === 'undefined') {
      delete process.env.PUMUKI_SDD_BYPASS;
    } else {
      process.env.PUMUKI_SDD_BYPASS = previousBypass;
    }
  }
};

const readEvidence = (repoRoot: string): EvidenceShape => {
  return JSON.parse(readFileSync(join(repoRoot, '.ai_evidence.json'), 'utf8')) as EvidenceShape;
};

const assertPolicyTrace = (evidence: EvidenceShape, expectedBundle: string): void => {
  const policyRuleset = evidence.rulesets.find((ruleset) => ruleset.platform === 'policy');
  assert.ok(policyRuleset);
  assert.equal(policyRuleset.bundle, expectedBundle);
  assert.match(policyRuleset.hash, /^[A-Fa-f0-9]{64}$/);
};

const writeSkillsPolicy = (
  repoRoot: string,
  overrides: Partial<Record<StageName, StageThreshold>>
): void => {
  const defaults: Record<StageName, StageThreshold> = {
    PRE_COMMIT: { blockOnOrAbove: 'CRITICAL', warnOnOrAbove: 'ERROR' },
    PRE_PUSH: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
    CI: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
  };

  writeFileSync(
    join(repoRoot, 'skills.policy.json'),
    JSON.stringify(
      {
        version: '1.0',
        defaultBundleEnabled: true,
        stages: {
          PRE_COMMIT: overrides.PRE_COMMIT ?? defaults.PRE_COMMIT,
          PRE_PUSH: overrides.PRE_PUSH ?? defaults.PRE_PUSH,
          CI: overrides.CI ?? defaults.CI,
        },
        bundles: {},
      },
      null,
      2
    ),
    'utf8'
  );
};

const stageBackendFile = (repoRoot: string): void => {
  const backendDir = join(repoRoot, 'apps', 'backend', 'src');
  mkdirSync(backendDir, { recursive: true });
  writeFileSync(join(backendDir, 'service.ts'), 'export const value: any = 1;\n', 'utf8');
  runGit(repoRoot, ['add', 'apps/backend/src/service.ts']);
};

const setupBackendCommitRange = (repoRoot: string): void => {
  writeFileSync(join(repoRoot, 'README.md'), '# temp repo\n', 'utf8');
  runGit(repoRoot, ['add', 'README.md']);
  runGit(repoRoot, ['commit', '-m', 'chore: initial commit']);

  runGit(repoRoot, ['checkout', '--quiet', '-b', 'feature/stage-runners']);
  runGit(repoRoot, ['branch', '--quiet', '--set-upstream-to=main']);

  stageBackendFile(repoRoot);
  runGit(repoRoot, ['commit', '-m', 'feat: backend explicit any fixture']);
};

const setupBackendCommitRangeWithoutUpstream = (repoRoot: string): void => {
  writeFileSync(join(repoRoot, 'README.md'), '# temp repo\n', 'utf8');
  runGit(repoRoot, ['add', 'README.md']);
  runGit(repoRoot, ['commit', '-m', 'chore: initial commit']);

  runGit(repoRoot, ['checkout', '--quiet', '-b', 'feature/no-upstream']);

  stageBackendFile(repoRoot);
  runGit(repoRoot, ['commit', '-m', 'feat: backend explicit any fixture']);
};

const withCapturedConsoleError = async (
  callback: () => Promise<void>
): Promise<Array<string>> => {
  const original = console.error;
  const messages: Array<string> = [];
  console.error = (...args: Array<unknown>) => {
    messages.push(args.map((arg) => String(arg)).join(' '));
  };

  try {
    await callback();
    return messages;
  } finally {
    console.error = original;
  }
};

test('runPreCommitStage uses skills stage policy override and writes policy trace into evidence', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    writeSkillsPolicy(repoRoot, {
      PRE_COMMIT: {
        blockOnOrAbove: 'CRITICAL',
        warnOnOrAbove: 'WARN',
      },
    });
    stageBackendFile(repoRoot);

    const exitCode = await runPreCommitStage();
    assert.equal(exitCode, 0);

    const evidence = readEvidence(repoRoot);
    assert.equal(evidence.version, '2.1');
    assert.equal(evidence.snapshot.stage, 'PRE_COMMIT');
    assert.equal(evidence.snapshot.outcome, 'WARN');
    assert.equal(
      evidence.snapshot.findings.some(
        (finding) => finding.ruleId === 'backend.avoid-explicit-any'
      ),
      true
    );
    assertPolicyTrace(evidence, 'gate-policy.skills.policy.PRE_COMMIT');
  });
});

test('runPreCommitStage keeps default policy thresholds when skills policy is absent', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    stageBackendFile(repoRoot);

    const exitCode = await runPreCommitStage();
    assert.equal(exitCode, 0);

    const evidence = readEvidence(repoRoot);
    assert.equal(evidence.version, '2.1');
    assert.equal(evidence.snapshot.stage, 'PRE_COMMIT');
    assert.equal(evidence.snapshot.outcome, 'PASS');
    assert.equal(
      evidence.snapshot.findings.some(
        (finding) => finding.ruleId === 'backend.avoid-explicit-any'
      ),
      true
    );
    assertPolicyTrace(evidence, 'gate-policy.default.PRE_COMMIT');
  });
});

test('runPrePushStage uses skills policy override and writes PRE_PUSH policy trace', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    writeSkillsPolicy(repoRoot, {
      PRE_PUSH: {
        blockOnOrAbove: 'ERROR',
        warnOnOrAbove: 'ERROR',
      },
    });
    setupBackendCommitRange(repoRoot);

    const exitCode = await runPrePushStage();
    assert.equal(exitCode, 0);

    const evidence = readEvidence(repoRoot);
    assert.equal(evidence.version, '2.1');
    assert.equal(evidence.snapshot.stage, 'PRE_PUSH');
    assert.equal(evidence.snapshot.outcome, 'PASS');
    assert.equal(
      evidence.snapshot.findings.some(
        (finding) => finding.ruleId === 'backend.avoid-explicit-any'
      ),
      true
    );
    assertPolicyTrace(evidence, 'gate-policy.skills.policy.PRE_PUSH');
  });
});

test('runPrePushStage returns blocking exit code with strict WARN threshold override', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    writeSkillsPolicy(repoRoot, {
      PRE_PUSH: {
        blockOnOrAbove: 'WARN',
        warnOnOrAbove: 'WARN',
      },
    });
    setupBackendCommitRange(repoRoot);

    await withSilencedConsoleLog(async () => {
      const exitCode = await runPrePushStage();
      assert.equal(exitCode, 1);
    });

    const evidence = readEvidence(repoRoot);
    assert.equal(evidence.version, '2.1');
    assert.equal(evidence.snapshot.stage, 'PRE_PUSH');
    assert.equal(evidence.snapshot.outcome, 'BLOCK');
    assert.equal(
      evidence.snapshot.findings.some(
        (finding) => finding.ruleId === 'backend.avoid-explicit-any'
      ),
      true
    );
    assertPolicyTrace(evidence, 'gate-policy.skills.policy.PRE_PUSH');
  });
});

test('runPrePushStage keeps default PRE_PUSH thresholds when skills policy is absent', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRange(repoRoot);

    const exitCode = await runPrePushStage();
    assert.equal(exitCode, 0);

    const evidence = readEvidence(repoRoot);
    assert.equal(evidence.version, '2.1');
    assert.equal(evidence.snapshot.stage, 'PRE_PUSH');
    assert.equal(evidence.snapshot.outcome, 'WARN');
    assert.equal(
      evidence.snapshot.findings.some(
        (finding) => finding.ruleId === 'backend.avoid-explicit-any'
      ),
      true
    );
    assertPolicyTrace(evidence, 'gate-policy.default.PRE_PUSH');
  });
});

test('runPrePushStage fails safe with guidance when branch has no upstream', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRangeWithoutUpstream(repoRoot);

    const messages = await withCapturedConsoleError(async () => {
      const exitCode = await runPrePushStage();
      assert.equal(exitCode, 1);
    });

    assert.equal(existsSync(join(repoRoot, '.ai_evidence.json')), false);
    assert.equal(
      messages.some((message) =>
        message.includes('pumuki pre-push blocked: branch has no upstream tracking reference.')
      ),
      true
    );
  });
});

test('runCiStage uses skills policy override and writes CI policy trace', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    writeSkillsPolicy(repoRoot, {
      CI: {
        blockOnOrAbove: 'ERROR',
        warnOnOrAbove: 'ERROR',
      },
    });
    setupBackendCommitRange(repoRoot);

    await withGithubBaseRef('main', async () => {
      const exitCode = await runCiStage();
      assert.equal(exitCode, 0);
    });

    const evidence = readEvidence(repoRoot);
    assert.equal(evidence.version, '2.1');
    assert.equal(evidence.snapshot.stage, 'CI');
    assert.equal(evidence.snapshot.outcome, 'PASS');
    assert.equal(
      evidence.snapshot.findings.some(
        (finding) => finding.ruleId === 'backend.avoid-explicit-any'
      ),
      true
    );
    assertPolicyTrace(evidence, 'gate-policy.skills.policy.CI');
  });
});

test('runCiStage returns blocking exit code with strict WARN threshold override', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    writeSkillsPolicy(repoRoot, {
      CI: {
        blockOnOrAbove: 'WARN',
        warnOnOrAbove: 'WARN',
      },
    });
    setupBackendCommitRange(repoRoot);

    await withSilencedConsoleLog(async () => {
      await withGithubBaseRef('main', async () => {
        const exitCode = await runCiStage();
        assert.equal(exitCode, 1);
      });
    });

    const evidence = readEvidence(repoRoot);
    assert.equal(evidence.version, '2.1');
    assert.equal(evidence.snapshot.stage, 'CI');
    assert.equal(evidence.snapshot.outcome, 'BLOCK');
    assert.equal(
      evidence.snapshot.findings.some(
        (finding) => finding.ruleId === 'backend.avoid-explicit-any'
      ),
      true
    );
    assertPolicyTrace(evidence, 'gate-policy.skills.policy.CI');
  });
});

test('runCiStage keeps default CI thresholds when skills policy is absent', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRange(repoRoot);

    await withGithubBaseRef('main', async () => {
      const exitCode = await runCiStage();
      assert.equal(exitCode, 0);
    });

    const evidence = readEvidence(repoRoot);
    assert.equal(evidence.version, '2.1');
    assert.equal(evidence.snapshot.stage, 'CI');
    assert.equal(evidence.snapshot.outcome, 'WARN');
    assert.equal(
      evidence.snapshot.findings.some(
        (finding) => finding.ruleId === 'backend.avoid-explicit-any'
      ),
      true
    );
    assertPolicyTrace(evidence, 'gate-policy.default.CI');
  });
});

test('runCiStage falls back gracefully when GITHUB_BASE_REF is invalid', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRange(repoRoot);

    await withGithubBaseRef('invalid/non-existent-ref', async () => {
      const exitCode = await runCiStage();
      assert.equal(exitCode, 0);
    });

    const evidence = readEvidence(repoRoot);
    assert.equal(evidence.version, '2.1');
    assert.equal(evidence.snapshot.stage, 'CI');
    assert.equal(evidence.snapshot.outcome, 'WARN');
    assert.equal(
      evidence.snapshot.findings.some(
        (finding) => finding.ruleId === 'backend.avoid-explicit-any'
      ),
      true
    );
    assertPolicyTrace(evidence, 'gate-policy.default.CI');
  });
});
