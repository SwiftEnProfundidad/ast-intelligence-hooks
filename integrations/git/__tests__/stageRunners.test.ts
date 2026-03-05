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
  const previousDisableCore = process.env.PUMUKI_DISABLE_CORE_SKILLS;
  const previousAtomicity = process.env.PUMUKI_GIT_ATOMICITY_ENABLED;
  process.env.PUMUKI_SDD_BYPASS = '1';
  process.env.PUMUKI_DISABLE_CORE_SKILLS = '0';
  process.env.PUMUKI_GIT_ATOMICITY_ENABLED = '0';
  try {
    await withTempRepo(async (repoRoot) => {
      seedTddBddEvidenceContract(repoRoot);
      await callback(repoRoot);
    }, { tempPrefix: 'pumuki-stage-runner-' });
  } finally {
    if (typeof previousBypass === 'undefined') {
      delete process.env.PUMUKI_SDD_BYPASS;
    } else {
      process.env.PUMUKI_SDD_BYPASS = previousBypass;
    }
    if (typeof previousDisableCore === 'undefined') {
      delete process.env.PUMUKI_DISABLE_CORE_SKILLS;
    } else {
      process.env.PUMUKI_DISABLE_CORE_SKILLS = previousDisableCore;
    }
    if (typeof previousAtomicity === 'undefined') {
      delete process.env.PUMUKI_GIT_ATOMICITY_ENABLED;
    } else {
      process.env.PUMUKI_GIT_ATOMICITY_ENABLED = previousAtomicity;
    }
  }
};

const seedTddBddEvidenceContract = (repoRoot: string): void => {
  mkdirSync(join(repoRoot, '.pumuki', 'artifacts'), { recursive: true });
  mkdirSync(join(repoRoot, 'features'), { recursive: true });
  writeFileSync(
    join(repoRoot, 'features', 'core.feature'),
    'Feature: Core flow\n  Scenario: baseline vertical slice\n',
    'utf8'
  );
  writeFileSync(
    join(repoRoot, '.pumuki', 'artifacts', 'pumuki-evidence-v1.json'),
    JSON.stringify(
      {
        version: '1',
        generated_at: '2026-02-26T10:00:00.000Z',
        slices: [
          {
            id: 'slice-seed-1',
            scenario_ref: 'features/core.feature:2',
            red: { status: 'failed', timestamp: '2026-02-26T10:00:00.000Z' },
            green: { status: 'passed', timestamp: '2026-02-26T10:01:00.000Z' },
            refactor: { status: 'passed', timestamp: '2026-02-26T10:02:00.000Z' },
          },
        ],
      },
      null,
      2
    ),
    'utf8'
  );
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
    PRE_COMMIT: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
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

const withCapturedStderr = async (
  callback: () => Promise<void>
): Promise<Array<string>> => {
  const original = process.stderr.write.bind(process.stderr);
  const messages: Array<string> = [];
  process.stderr.write = ((chunk: unknown): boolean => {
    messages.push(String(chunk).trimEnd());
    return true;
  }) as typeof process.stderr.write;

  try {
    await callback();
    return messages;
  } finally {
    process.stderr.write = original;
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
    assert.equal(evidence.snapshot.outcome, 'WARN');
    assert.equal(
      evidence.snapshot.findings.some(
        (finding) => finding.ruleId === 'backend.avoid-explicit-any'
      ),
      true
    );
    assertPolicyTrace(evidence, 'gate-policy.default.PRE_COMMIT');
  });
});

test('runPreCommitStage evita ruido de HEAD ambiguo en repos sin commit inicial', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    stageBackendFile(repoRoot);

    const stderr = await withCapturedStderr(async () => {
      await runPreCommitStage();
    });

    const merged = stderr.join('\n');
    assert.doesNotMatch(merged, /ambiguous argument 'HEAD'/i);
    assert.doesNotMatch(merged, /argumento ambiguo 'HEAD'/i);
  });
});

test('runCiStage no rompe bootstrap en repo sin commit inicial con git-atomicity activa', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    stageBackendFile(repoRoot);
    const previousAtomicity = process.env.PUMUKI_GIT_ATOMICITY_ENABLED;
    process.env.PUMUKI_GIT_ATOMICITY_ENABLED = '1';

    try {
      const stderr = await withCapturedStderr(async () => {
        const exitCode = await runCiStage();
        assert.equal(exitCode, 0);
      });

      const merged = stderr.join('\n');
      assert.doesNotMatch(merged, /ambiguous argument 'HEAD'/i);
      assert.doesNotMatch(merged, /argumento ambiguo 'HEAD'/i);
    } finally {
      if (typeof previousAtomicity === 'undefined') {
        delete process.env.PUMUKI_GIT_ATOMICITY_ENABLED;
      } else {
        process.env.PUMUKI_GIT_ATOMICITY_ENABLED = previousAtomicity;
      }
    }
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

test('runPrePushStage sin upstream usa fallback bootstrap range cuando no hay stdin', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRangeWithoutUpstream(repoRoot);
    const messages = await withCapturedStderr(async () => {
      const exitCode = await runPrePushStage();
      assert.equal(exitCode, 0);
    });

    assert.equal(existsSync(join(repoRoot, '.ai_evidence.json')), true);
    const evidence = readEvidence(repoRoot);
    assert.equal(evidence.snapshot.stage, 'PRE_PUSH');
    assert.equal(
      messages.some((message) =>
        message.includes('[pumuki][pre-push] branch has no upstream; using bootstrap range')
      ),
      true
    );
  });
});

test('runPrePushStage sin upstream falla safe cuando no existe base bootstrap válida', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRangeWithoutUpstream(repoRoot);

    const messages = await withCapturedStderr(async () => {
      const exitCode = await runPrePushStage({
        resolvePrePushBootstrapBaseRef: () => 'HEAD',
      });
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

test('runPrePushStage allows bootstrap push without upstream when stdin indicates new remote branch', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRangeWithoutUpstream(repoRoot);
    const headOid = runGit(repoRoot, ['rev-parse', 'HEAD']).trim();
    const remoteZero = '0'.repeat(40);

    const exitCode = await runPrePushStage({
      readPrePushStdin: () =>
        `refs/heads/feature/no-upstream ${headOid} refs/heads/feature/no-upstream ${remoteZero}\n`,
      resolvePrePushBootstrapBaseRef: () => 'main',
    });

    assert.equal(exitCode, 0);
    assert.equal(existsSync(join(repoRoot, '.ai_evidence.json')), true);
    const evidence = readEvidence(repoRoot);
    assert.equal(evidence.snapshot.stage, 'PRE_PUSH');
  });
});

test('runPrePushStage allows bootstrap push without upstream when hook injects stdin via env', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRangeWithoutUpstream(repoRoot);
    const headOid = runGit(repoRoot, ['rev-parse', 'HEAD']).trim();
    const remoteZero = '0'.repeat(40);
    const previousEnv = process.env.PUMUKI_PRE_PUSH_STDIN;
    process.env.PUMUKI_PRE_PUSH_STDIN =
      `refs/heads/feature/no-upstream ${headOid} refs/heads/feature/no-upstream ${remoteZero}\n`;

    try {
      const exitCode = await runPrePushStage({
        resolvePrePushBootstrapBaseRef: () => 'main',
      });
      assert.equal(exitCode, 0);
      assert.equal(existsSync(join(repoRoot, '.ai_evidence.json')), true);
      const evidence = readEvidence(repoRoot);
      assert.equal(evidence.snapshot.stage, 'PRE_PUSH');
    } finally {
      if (typeof previousEnv === 'undefined') {
        delete process.env.PUMUKI_PRE_PUSH_STDIN;
      } else {
        process.env.PUMUKI_PRE_PUSH_STDIN = previousEnv;
      }
    }
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

test('runPreCommitStage dispara notificación de resumen tras evaluar el gate', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    stageBackendFile(repoRoot);
    const notifications: Array<{ repoRoot: string; stage: StageName }> = [];

    const exitCode = await runPreCommitStage({
      notifyAuditSummaryFromEvidence: (params) => {
        notifications.push(params);
      },
      resolveRepoRoot: () => repoRoot,
    });

    assert.equal(exitCode, 0);
    assert.deepEqual(notifications, [{ repoRoot, stage: 'PRE_COMMIT' }]);
  });
});

test('runPrePushStage dispara notificación de resumen tras evaluar el gate', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRange(repoRoot);
    const notifications: Array<{ repoRoot: string; stage: StageName }> = [];

    const exitCode = await runPrePushStage({
      notifyAuditSummaryFromEvidence: (params) => {
        notifications.push(params);
      },
      resolveRepoRoot: () => repoRoot,
    });

    assert.equal(exitCode, 0);
    assert.deepEqual(notifications, [{ repoRoot, stage: 'PRE_PUSH' }]);
  });
});

test('runCiStage dispara notificación de resumen tras evaluar el gate', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRange(repoRoot);
    const notifications: Array<{ repoRoot: string; stage: StageName }> = [];

    await withGithubBaseRef('main', async () => {
      const exitCode = await runCiStage({
        notifyAuditSummaryFromEvidence: (params) => {
          notifications.push(params);
        },
        resolveRepoRoot: () => repoRoot,
      });
      assert.equal(exitCode, 0);
    });

    assert.deepEqual(notifications, [{ repoRoot, stage: 'CI' }]);
  });
});

test('runPrePushStage sin upstream mantiene paridad de notificación de resumen', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRangeWithoutUpstream(repoRoot);
    const notifications: Array<{ repoRoot: string; stage: StageName }> = [];

    const messages = await withCapturedStderr(async () => {
      const exitCode = await runPrePushStage({
        notifyAuditSummaryFromEvidence: (params) => {
          notifications.push(params);
        },
        resolveRepoRoot: () => repoRoot,
      });
      assert.equal(exitCode, 0);
    });

    assert.equal(existsSync(join(repoRoot, '.ai_evidence.json')), true);
    assert.equal(
      messages.some((message) =>
        message.includes('[pumuki][pre-push] branch has no upstream; using bootstrap range')
      ),
      true
    );
    assert.deepEqual(notifications, [{ repoRoot, stage: 'PRE_PUSH' }]);
  });
});

test('runPreCommitStage emite notificación de bloqueo con causa y remediación', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    stageBackendFile(repoRoot);
    writeSkillsPolicy(repoRoot, {
      PRE_COMMIT: { blockOnOrAbove: 'WARN', warnOnOrAbove: 'WARN' },
    });

    const blocked: Array<{
      stage: StageName;
      totalViolations: number;
      causeCode: string;
      causeMessage: string;
      remediation: string;
    }> = [];

    const exitCode = await runPreCommitStage({
      notifyGateBlocked: (params) => {
        blocked.push({
          stage: params.stage,
          totalViolations: params.totalViolations,
          causeCode: params.causeCode,
          causeMessage: params.causeMessage,
          remediation: params.remediation,
        });
      },
      resolveRepoRoot: () => repoRoot,
    });

    assert.equal(exitCode, 1);
    assert.equal(blocked.length, 1);
    assert.equal(blocked[0]?.stage, 'PRE_COMMIT');
    assert.match(blocked[0]?.causeCode ?? '', /[A-Z0-9_]+/);
    assert.equal((blocked[0]?.causeMessage ?? '').length > 0, true);
    assert.equal((blocked[0]?.remediation ?? '').length > 0, true);
  });
});

test('runPrePushStage sin upstream emite notificación de bloqueo accionable', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRangeWithoutUpstream(repoRoot);
    const blocked: Array<{
      stage: StageName;
      causeCode: string;
      remediation: string;
    }> = [];

    const exitCode = await runPrePushStage({
      resolvePrePushBootstrapBaseRef: () => 'HEAD',
      notifyGateBlocked: (params) => {
        blocked.push({
          stage: params.stage,
          causeCode: params.causeCode,
          remediation: params.remediation,
        });
      },
      resolveRepoRoot: () => repoRoot,
    });

    assert.equal(exitCode, 1);
    assert.equal(blocked.length, 1);
    assert.equal(blocked[0]?.stage, 'PRE_PUSH');
    assert.equal(blocked[0]?.causeCode, 'PRE_PUSH_UPSTREAM_MISSING');
    assert.match(blocked[0]?.remediation ?? '', /set-upstream/i);
  });
});

test('runPrePushStage bloquea con código específico cuando upstream está desalineado para rama topic', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRange(repoRoot);
    let gateCalls = 0;
    const blocked: Array<{
      stage: StageName;
      causeCode: string;
      causeMessage: string;
      remediation: string;
    }> = [];

    const messages = await withCapturedStderr(async () => {
      const exitCode = await runPrePushStage({
        resolveUpstreamRef: () => 'origin/develop',
        resolveCurrentBranchRef: () => 'feature/misaligned-upstream',
        resolveUpstreamTrackingRef: () => 'origin/develop',
        resolveAheadBehindFromRef: () => ({ ahead: 42, behind: 0 }),
        runPlatformGate: async () => {
          gateCalls += 1;
          return 0;
        },
        notifyGateBlocked: (params) => {
          blocked.push({
            stage: params.stage,
            causeCode: params.causeCode,
            causeMessage: params.causeMessage,
            remediation: params.remediation,
          });
        },
        resolveRepoRoot: () => repoRoot,
      });

      assert.equal(exitCode, 1);
    });

    assert.equal(gateCalls, 0);
    assert.equal(blocked.length, 1);
    assert.equal(blocked[0]?.stage, 'PRE_PUSH');
    assert.equal(blocked[0]?.causeCode, 'PRE_PUSH_UPSTREAM_MISALIGNED');
    assert.equal((blocked[0]?.causeMessage ?? '').includes('upstream appears misaligned'), true);
    assert.match(blocked[0]?.remediation ?? '', /set-upstream/i);
    assert.equal(
      messages.some((message) =>
        message.includes('pumuki pre-push blocked: upstream appears misaligned')
      ),
      true
    );
  });
});

test('runPreCommitStage bloquea temprano cuando falla git atomicity y no ejecuta el gate principal', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    stageBackendFile(repoRoot);
    let gateCalls = 0;
    const blocked: Array<{ code: string; remediation: string }> = [];

    const exitCode = await runPreCommitStage({
      evaluateGitAtomicity: () => ({
        enabled: true,
        allowed: false,
        violations: [
          {
            code: 'GIT_ATOMICITY_TOO_MANY_FILES',
            message: 'changed_files=42 exceeds max_files=10',
            remediation: 'Divide cambios en commits atómicos.',
          },
        ],
      }),
      runPlatformGate: async () => {
        gateCalls += 1;
        return 0;
      },
      notifyGateBlocked: (params) => {
        blocked.push({ code: params.causeCode, remediation: params.remediation });
      },
      resolveRepoRoot: () => repoRoot,
    });

    assert.equal(exitCode, 1);
    assert.equal(gateCalls, 0);
    assert.equal(blocked.length, 1);
    assert.equal(blocked[0]?.code, 'GIT_ATOMICITY_TOO_MANY_FILES');
    assert.match(blocked[0]?.remediation ?? '', /atómicos/i);
  });
});

test('runPrePushStage bloquea temprano cuando falla git atomicity y no ejecuta el gate principal', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRange(repoRoot);
    let gateCalls = 0;
    const blocked: Array<{ code: string; remediation: string }> = [];

    const exitCode = await runPrePushStage({
      evaluateGitAtomicity: () => ({
        enabled: true,
        allowed: false,
        violations: [
          {
            code: 'GIT_ATOMICITY_COMMIT_MESSAGE_TRACEABILITY',
            message: 'commit messages without traceable pattern detected',
            remediation: 'Reescribe commits con patrón trazable.',
          },
        ],
      }),
      runPlatformGate: async () => {
        gateCalls += 1;
        return 0;
      },
      notifyGateBlocked: (params) => {
        blocked.push({ code: params.causeCode, remediation: params.remediation });
      },
      resolveRepoRoot: () => repoRoot,
    });

    assert.equal(exitCode, 1);
    assert.equal(gateCalls, 0);
    assert.equal(blocked.length, 1);
    assert.equal(blocked[0]?.code, 'GIT_ATOMICITY_COMMIT_MESSAGE_TRACEABILITY');
    assert.match(blocked[0]?.remediation ?? '', /trazable/i);
  });
});
