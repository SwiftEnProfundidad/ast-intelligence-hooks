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

type StageName = 'PRE_WRITE' | 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';

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

const createSkillsCoverageBlockedEvidence = (stage: StageName): EvidenceShape =>
  ({
    version: '2.1',
    timestamp: '2026-03-05T10:00:00.000Z',
    snapshot: {
      stage,
      outcome: 'BLOCK',
      findings: [
        {
          ruleId: 'governance.skills.scope-compliance.incomplete',
          severity: 'ERROR',
          code: 'SKILLS_SCOPE_COMPLIANCE_INCOMPLETE_HIGH',
          message: 'Scope compliance incomplete.',
          file: 'apps/backend/src/service.ts',
        },
      ],
    },
    rulesets: [],
    ledger: [],
    platforms: {},
    human_intent: null,
    ai_gate: {
      status: 'BLOCKED',
      violations: [
        {
          ruleId: 'governance.skills.scope-compliance.incomplete',
          level: 'ERROR',
          code: 'SKILLS_SCOPE_COMPLIANCE_INCOMPLETE_HIGH',
          message: 'Scope compliance incomplete.',
          file: 'apps/backend/src/service.ts',
        },
      ],
      human_intent: null,
    },
    severity_metrics: {
      gate_status: 'BLOCKED',
      total_violations: 1,
      by_severity: {
        INFO: 0,
        WARN: 0,
        ERROR: 1,
        CRITICAL: 0,
      },
    },
  }) as unknown as EvidenceShape;

const withStageRunnerRepo = async (
  callback: (repoRoot: string) => Promise<void>
): Promise<void> => {
  const previousBypass = process.env.PUMUKI_SDD_BYPASS;
  const previousDisableCore = process.env.PUMUKI_DISABLE_CORE_SKILLS;
  const previousAtomicity = process.env.PUMUKI_GIT_ATOMICITY_ENABLED;
  const previousDisableNotifications = process.env.PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS;
  process.env.PUMUKI_SDD_BYPASS = '1';
  process.env.PUMUKI_DISABLE_CORE_SKILLS = '0';
  process.env.PUMUKI_GIT_ATOMICITY_ENABLED = '0';
  process.env.PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS = '1';
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
    if (typeof previousDisableNotifications === 'undefined') {
      delete process.env.PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS;
    } else {
      process.env.PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS = previousDisableNotifications;
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
    PRE_WRITE: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
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
          PRE_WRITE: overrides.PRE_WRITE ?? defaults.PRE_WRITE,
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

test('runPreCommitStage emits visible progress before evaluating the gate', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    stageBackendFile(repoRoot);
    const hookMessages: Array<string> = [];

    const exitCode = await runPreCommitStage({
      resolveRepoRoot: () => repoRoot,
      writeHookGateSummary: (message) => {
        hookMessages.push(message);
      },
      runPlatformGate: async () => {
        assert.equal(
          hookMessages.some((message) =>
            message.includes('stage=PRE_COMMIT decision=PENDING status=STARTED')
          ),
          true
        );
        return 0;
      },
    });

    assert.equal(exitCode, 0);
  });
});

test('runPreCommitStage emits a running reminder when the gate evaluation takes longer', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    stageBackendFile(repoRoot);
    const hookMessages: Array<string> = [];
    let reminderCancelled = false;

    const exitCode = await runPreCommitStage({
      resolveRepoRoot: () => repoRoot,
      writeHookGateSummary: (message) => {
        hookMessages.push(message);
      },
      scheduleHookGateProgressReminder: ({ onProgress }) => {
        onProgress();
        return () => {
          reminderCancelled = true;
        };
      },
      runPlatformGate: async () => {
        assert.equal(
          hookMessages.some((message) =>
            message.includes('stage=PRE_COMMIT decision=PENDING status=RUNNING')
          ),
          true
        );
        return 0;
      },
    });

    assert.equal(exitCode, 0);
    assert.equal(reminderCancelled, true);
  });
});

test('runPreCommitStage stays silent in quiet mode while the gate runs', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    stageBackendFile(repoRoot);
    const hookMessages: Array<string> = [];
    let reminderScheduled = false;

    const exitCode = await runPreCommitStage({
      resolveRepoRoot: () => repoRoot,
      isQuietMode: () => true,
      writeHookGateSummary: (message) => {
        hookMessages.push(message);
      },
      scheduleHookGateProgressReminder: () => {
        reminderScheduled = true;
        return () => {};
      },
      runPlatformGate: async () => {
        assert.deepEqual(hookMessages, []);
        return 0;
      },
    });

    assert.equal(exitCode, 0);
    assert.deepEqual(hookMessages, []);
    assert.equal(reminderScheduled, false);
  });
});

test('runPreCommitStage asegura ignore local para artefactos runtime de Pumuki', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    stageBackendFile(repoRoot);

    const exitCode = await runPreCommitStage();
    assert.equal(exitCode, 0);

    const excludePath = join(repoRoot, '.git', 'info', 'exclude');
    const content = readFileSync(excludePath, 'utf8');
    assert.match(content, /# >>> pumuki-runtime-artifacts >>>/);
    assert.match(content, /\.ai_evidence\.json/);
    assert.match(content, /\.pumuki\//);
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

test('runPrePushStage sin upstream usa fallback working-tree cuando no hay stdin y no existe base bootstrap válida', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRangeWithoutUpstream(repoRoot);

    const messages = await withCapturedStderr(async () => {
      const exitCode = await runPrePushStage({
        resolvePrePushBootstrapBaseRef: () => 'HEAD',
      });
      assert.equal(exitCode, 0);
    });

    assert.equal(existsSync(join(repoRoot, '.ai_evidence.json')), true);
    const evidence = readEvidence(repoRoot);
    assert.equal(evidence.snapshot.stage, 'PRE_PUSH');
    assert.equal(
      messages.some((message) =>
        message.includes('using working-tree fallback scope')
      ),
      true
    );
  });
});

test('runPrePushStage sin upstream falla safe cuando stdin no representa bootstrap y no existe base válida', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRangeWithoutUpstream(repoRoot);
    const headOid = runGit(repoRoot, ['rev-parse', 'HEAD']).trim();

    const messages = await withCapturedStderr(async () => {
      const exitCode = await runPrePushStage({
        resolvePrePushBootstrapBaseRef: () => 'HEAD',
        readPrePushStdin: () =>
          `refs/heads/feature/no-upstream ${headOid} refs/heads/develop ${headOid}\n`,
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

test('runPrePushStage usa el rango exacto del stdin cuando se empuja un commit concreto', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRange(repoRoot);
    writeFileSync(join(repoRoot, 'docs-note.md'), 'one\n', 'utf8');
    runGit(repoRoot, ['add', 'docs-note.md']);
    runGit(repoRoot, ['commit', '-m', 'docs: add note']);

    const remoteOid = runGit(repoRoot, ['rev-parse', 'main']).trim();
    const pushedCommitOid = runGit(repoRoot, ['rev-parse', 'HEAD~1']).trim();
    const capturedAtomicityArgs: Array<{ fromRef?: string; toRef?: string }> = [];
    const capturedScopes: Array<{ kind: string; fromRef?: string; toRef?: string }> = [];

    const exitCode = await runPrePushStage({
      resolveUpstreamRef: () => 'origin/feature/stage-runners',
      resolveUpstreamTrackingRef: () => 'origin/feature/stage-runners',
      resolveAheadBehindFromRef: () => ({ ahead: 2, behind: 0 }),
      readPrePushStdin: () =>
        `refs/heads/feature/stage-runners ${pushedCommitOid} refs/heads/feature/stage-runners ${remoteOid}\n`,
      evaluateGitAtomicity: (params) => {
        capturedAtomicityArgs.push({
          fromRef: params.fromRef,
          toRef: params.toRef,
        });
        return {
          enabled: true,
          allowed: true,
          violations: [],
        };
      },
      runPlatformGate: async (params) => {
        if (params.scope.kind === 'range') {
          capturedScopes.push({
            kind: params.scope.kind,
            fromRef: params.scope.fromRef,
            toRef: params.scope.toRef,
          });
        }
        return 0;
      },
      resolveRepoRoot: () => repoRoot,
    });

    assert.equal(exitCode, 0);
    assert.deepEqual(capturedAtomicityArgs, [{ fromRef: remoteOid, toRef: pushedCommitOid }]);
    assert.deepEqual(capturedScopes, [{ kind: 'range', fromRef: remoteOid, toRef: pushedCommitOid }]);
  });
});

test('runPrePushStage mantiene upstream..HEAD cuando stdin no aporta un rango único utilizable', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRange(repoRoot);
    const upstreamRef = 'origin/feature/stage-runners';
    const capturedAtomicityArgs: Array<{ fromRef?: string; toRef?: string }> = [];

    const exitCode = await runPrePushStage({
      resolveUpstreamRef: () => upstreamRef,
      resolveUpstreamTrackingRef: () => upstreamRef,
      resolveAheadBehindFromRef: () => ({ ahead: 1, behind: 0 }),
      readPrePushStdin: () =>
        [
          'refs/heads/feature/stage-runners 1111111111111111111111111111111111111111 refs/heads/feature/stage-runners 2222222222222222222222222222222222222222',
          'refs/heads/docs/extra 3333333333333333333333333333333333333333 refs/heads/docs/extra 4444444444444444444444444444444444444444',
        ].join('\n'),
      evaluateGitAtomicity: (params) => {
        capturedAtomicityArgs.push({
          fromRef: params.fromRef,
          toRef: params.toRef,
        });
        return {
          enabled: true,
          allowed: true,
          violations: [],
        };
      },
      runPlatformGate: async () => 0,
      resolveRepoRoot: () => repoRoot,
    });

    assert.equal(exitCode, 0);
    assert.deepEqual(capturedAtomicityArgs, [{ fromRef: upstreamRef, toRef: 'HEAD' }]);
  });
});

test('runPrePushStage suspende enforcement SDD para publish histórico de commit concreto distinto de HEAD', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRange(repoRoot);
    writeFileSync(join(repoRoot, 'docs-note.md'), 'one\n', 'utf8');
    runGit(repoRoot, ['add', 'docs-note.md']);
    runGit(repoRoot, ['commit', '-m', 'docs: add note']);

    const remoteOid = runGit(repoRoot, ['rev-parse', 'main']).trim();
    const historicalOid = runGit(repoRoot, ['rev-parse', 'HEAD~1']).trim();
    const headOid = runGit(repoRoot, ['rev-parse', 'HEAD']).trim();
    const capturedOverrides: Array<{
      allowed: boolean;
      code: string;
      message: string;
    }> = [];

    const exitCode = await runPrePushStage({
      resolveUpstreamRef: () => 'origin/feature/stage-runners',
      resolveUpstreamTrackingRef: () => 'origin/feature/stage-runners',
      resolveAheadBehindFromRef: () => ({ ahead: 2, behind: 0 }),
      readPrePushStdin: () =>
        `refs/heads/feature/stage-runners ${historicalOid} refs/heads/feature/stage-runners ${remoteOid}\n`,
      runPlatformGate: async (params) => {
        if (params.sddDecisionOverride) {
          capturedOverrides.push({
            allowed: params.sddDecisionOverride.allowed,
            code: params.sddDecisionOverride.code,
            message: params.sddDecisionOverride.message,
          });
        }
        return 0;
      },
      resolveRepoRoot: () => repoRoot,
    });

    assert.equal(exitCode, 0);
    assert.equal(capturedOverrides.length, 1);
    assert.equal(capturedOverrides[0]?.allowed, true);
    assert.equal(capturedOverrides[0]?.code, 'ALLOWED');
    assert.match(capturedOverrides[0]?.message ?? '', /historical publish/i);
    assert.match(capturedOverrides[0]?.message ?? '', new RegExp(historicalOid.slice(0, 12)));
    assert.match(capturedOverrides[0]?.message ?? '', new RegExp(headOid.slice(0, 12)));
  });
});

test('runPrePushStage no suspende enforcement SDD cuando el refspec empuja HEAD actual', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRange(repoRoot);
    const remoteOid = runGit(repoRoot, ['rev-parse', 'main']).trim();
    const headOid = runGit(repoRoot, ['rev-parse', 'HEAD']).trim();
    let capturedOverride: unknown;

    const exitCode = await runPrePushStage({
      resolveUpstreamRef: () => 'origin/feature/stage-runners',
      resolveUpstreamTrackingRef: () => 'origin/feature/stage-runners',
      resolveAheadBehindFromRef: () => ({ ahead: 1, behind: 0 }),
      readPrePushStdin: () =>
        `refs/heads/feature/stage-runners ${headOid} refs/heads/feature/stage-runners ${remoteOid}\n`,
      runPlatformGate: async (params) => {
        capturedOverride = params.sddDecisionOverride;
        return 0;
      },
      resolveRepoRoot: () => repoRoot,
    });

    assert.equal(exitCode, 0);
    assert.equal(capturedOverride, undefined);
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

test('runPreCommitStage restagea .ai_evidence.json cuando ya estaba trackeado', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    stageBackendFile(repoRoot);
    const stagedPaths: string[] = [];

    const exitCode = await runPreCommitStage({
      resolveRepoRoot: () => repoRoot,
      isPathTracked: (_repoRoot, relativePath) => relativePath === '.ai_evidence.json',
      stagePath: (_repoRoot, relativePath) => {
        stagedPaths.push(relativePath);
      },
    });

    assert.equal(exitCode, 0);
    assert.deepEqual(stagedPaths, ['.ai_evidence.json']);
  });
});

test('runPreCommitStage no auto-restaguea evidencia trackeada si el índice solo tiene Markdown', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    writeFileSync(join(repoRoot, 'README.md'), '# temp repo\n', 'utf8');
    runGit(repoRoot, ['add', 'README.md']);
    runGit(repoRoot, ['commit', '-m', 'chore: initial commit']);
    runGit(repoRoot, ['checkout', '-b', 'feature/doc-only-evidence-restage']);

    stageBackendFile(repoRoot);
    const firstExit = await runPreCommitStage({
      resolveRepoRoot: () => repoRoot,
    });
    assert.equal(firstExit, 0);
    runGit(repoRoot, ['add', '-f', '.ai_evidence.json']);
    runGit(repoRoot, ['commit', '-m', 'chore: track ai evidence']);

    mkdirSync(join(repoRoot, 'docs'), { recursive: true });
    writeFileSync(join(repoRoot, 'docs', 'operational-summary.md'), '# ops\n', 'utf8');
    runGit(repoRoot, ['add', 'docs/operational-summary.md']);

    const stagedPaths: string[] = [];
    const secondExit = await runPreCommitStage({
      resolveRepoRoot: () => repoRoot,
      stagePath: (_r, relativePath) => {
        stagedPaths.push(relativePath);
      },
    });

    assert.equal(secondExit, 0);
    assert.deepEqual(stagedPaths, []);
  });
});

test('runPreCommitStage restaguea evidencia con índice solo Markdown si ALWAYS_RESTAGE_TRACKED_EVIDENCE', async () => {
  const previous = process.env.PUMUKI_PRE_COMMIT_ALWAYS_RESTAGE_TRACKED_EVIDENCE;
  process.env.PUMUKI_PRE_COMMIT_ALWAYS_RESTAGE_TRACKED_EVIDENCE = '1';
  try {
    await withStageRunnerRepo(async (repoRoot) => {
      writeFileSync(join(repoRoot, 'README.md'), '# temp repo\n', 'utf8');
      runGit(repoRoot, ['add', 'README.md']);
      runGit(repoRoot, ['commit', '-m', 'chore: initial commit']);
      runGit(repoRoot, ['checkout', '-b', 'feature/doc-only-evidence-force-restage']);

      stageBackendFile(repoRoot);
      assert.equal(
        await runPreCommitStage({ resolveRepoRoot: () => repoRoot }),
        0
      );
      runGit(repoRoot, ['add', '-f', '.ai_evidence.json']);
      runGit(repoRoot, ['commit', '-m', 'chore: track ai evidence']);

      mkdirSync(join(repoRoot, 'docs'), { recursive: true });
      writeFileSync(join(repoRoot, 'docs', 'note.md'), '# n\n', 'utf8');
      runGit(repoRoot, ['add', 'docs/note.md']);

      const stagedPaths: string[] = [];
      const exitCode = await runPreCommitStage({
        resolveRepoRoot: () => repoRoot,
        isPathTracked: (_r, p) => p === '.ai_evidence.json',
        stagePath: (_r, p) => {
          stagedPaths.push(p);
        },
      });

      assert.equal(exitCode, 0);
      assert.deepEqual(stagedPaths, ['.ai_evidence.json']);
    });
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_PRE_COMMIT_ALWAYS_RESTAGE_TRACKED_EVIDENCE;
    } else {
      process.env.PUMUKI_PRE_COMMIT_ALWAYS_RESTAGE_TRACKED_EVIDENCE = previous;
    }
  }
});

test('runPreCommitStage no intenta trackear .ai_evidence.json cuando no estaba versionado', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    stageBackendFile(repoRoot);
    const stagedPaths: string[] = [];

    const exitCode = await runPreCommitStage({
      resolveRepoRoot: () => repoRoot,
      isPathTracked: () => false,
      stagePath: (_repoRoot, relativePath) => {
        stagedPaths.push(relativePath);
      },
    });

    assert.equal(exitCode, 0);
    assert.deepEqual(stagedPaths, []);
  });
});

test('runPreCommitStage bloquea con causa explícita si no puede restagear evidencia trackeada', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    stageBackendFile(repoRoot);
    const blocked: Array<{
      stage: StageName;
      causeCode: string;
      causeMessage: string;
      remediation: string;
    }> = [];

    const exitCode = await runPreCommitStage({
      resolveRepoRoot: () => repoRoot,
      isPathTracked: (_repoRoot, relativePath) => relativePath === '.ai_evidence.json',
      stagePath: () => {
        throw new Error('git add failed');
      },
      notifyGateBlocked: (params) => {
        blocked.push({
          stage: params.stage,
          causeCode: params.causeCode,
          causeMessage: params.causeMessage,
          remediation: params.remediation,
        });
      },
    });

    assert.equal(exitCode, 1);
    assert.equal(blocked.length, 1);
    assert.equal(blocked[0]?.stage, 'PRE_COMMIT');
    assert.equal(blocked[0]?.causeCode, 'EVIDENCE_STAGE_SYNC_FAILED');
    assert.match(blocked[0]?.causeMessage ?? '', /restage tracked \.ai_evidence\.json/i);
    assert.match(blocked[0]?.remediation ?? '', /git add -- \.ai_evidence\.json/i);
  });
});

test('runPreCommitStage no deja drift de working tree en .ai_evidence.json cuando ya estaba trackeado', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    writeFileSync(join(repoRoot, 'README.md'), '# temp repo\n', 'utf8');
    runGit(repoRoot, ['add', 'README.md']);
    runGit(repoRoot, ['commit', '-m', 'chore: initial commit']);
    runGit(repoRoot, ['checkout', '-b', 'feature/stage-runner-evidence-sync']);

    stageBackendFile(repoRoot);
    const firstExitCode = await runPreCommitStage({
      resolveRepoRoot: () => repoRoot,
    });
    assert.equal(firstExitCode, 0);
    runGit(repoRoot, ['add', '-f', '.ai_evidence.json']);
    runGit(repoRoot, ['commit', '-m', 'chore: track ai evidence fixture']);

    writeFileSync(join(repoRoot, 'apps/backend/src/service.ts'), 'export const value: any = 2;\n', 'utf8');
    runGit(repoRoot, ['add', 'apps/backend/src/service.ts']);

    const exitCode = await runPreCommitStage({
      resolveRepoRoot: () => repoRoot,
    });

    assert.equal(exitCode, 0);
    assert.equal(runGit(repoRoot, ['diff', '--name-only', '--', '.ai_evidence.json']), '');
    assert.equal(
      runGit(repoRoot, ['diff', '--cached', '--name-only', '--', '.ai_evidence.json']),
      '.ai_evidence.json'
    );
  });
});

test('runPrePushStage no reescribe .ai_evidence.json trackeado cuando el gate permite el push', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    writeFileSync(join(repoRoot, 'README.md'), '# temp repo\n', 'utf8');
    runGit(repoRoot, ['add', 'README.md']);
    runGit(repoRoot, ['commit', '-m', 'chore: initial commit']);
    runGit(repoRoot, ['checkout', '--quiet', '-b', 'feature/stage-runner-pre-push-evidence']);

    stageBackendFile(repoRoot);
    const firstPreCommit = await runPreCommitStage({
      resolveRepoRoot: () => repoRoot,
    });
    assert.equal(firstPreCommit, 0);
    runGit(repoRoot, ['add', '-f', '.ai_evidence.json']);
    runGit(repoRoot, ['commit', '-m', 'chore: track ai evidence fixture']);

    runGit(repoRoot, ['branch', '--quiet', '--set-upstream-to=main']);

    const evidenceBefore = readFileSync(join(repoRoot, '.ai_evidence.json'), 'utf8');

    const prePushExit = await runPrePushStage({
      resolveRepoRoot: () => repoRoot,
    });
    assert.equal(prePushExit, 0);

    const evidenceAfter = readFileSync(join(repoRoot, '.ai_evidence.json'), 'utf8');
    assert.equal(evidenceAfter, evidenceBefore);
    assert.equal(runGit(repoRoot, ['diff', '--name-only', '--', '.ai_evidence.json']), '');
    assert.equal(runGit(repoRoot, ['diff', '--cached', '--name-only', '--', '.ai_evidence.json']), '');
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

test('runPreCommitStage usa finding del snapshot PRE_COMMIT como causa primaria y remediación específica', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    stageBackendFile(repoRoot);
    const blocked: Array<{
      causeCode: string;
      causeMessage: string;
      remediation: string;
      totalViolations: number;
    }> = [];

    const exitCode = await runPreCommitStage({
      runPlatformGate: async () => 1,
      readEvidence: () =>
        ({
          version: '2.1',
          snapshot: {
            stage: 'PRE_COMMIT',
            outcome: 'BLOCK',
            findings: [
              {
                ruleId: 'governance.rules.active-rule-coverage.empty',
                severity: 'ERROR',
                code: 'ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH',
                message: 'Active rules coverage is empty at PRE_COMMIT while code changes were detected.',
              },
            ],
          },
          ai_gate: {
            status: 'ALLOWED',
            violations: [],
            human_intent: null,
          },
          rulesets: [],
        }) as ReturnType<typeof readEvidence>,
      notifyGateBlocked: (params) => {
        blocked.push({
          causeCode: params.causeCode,
          causeMessage: params.causeMessage,
          remediation: params.remediation,
          totalViolations: params.totalViolations,
        });
      },
      resolveRepoRoot: () => repoRoot,
    });

    assert.equal(exitCode, 1);
    assert.equal(blocked.length, 1);
    assert.equal(blocked[0]?.causeCode, 'ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH');
    assert.match(blocked[0]?.causeMessage ?? '', /Active rules coverage is empty/i);
    assert.match(blocked[0]?.remediation ?? '', /policy reconcile --strict --json/i);
    assert.equal(blocked[0]?.totalViolations, 1);
  });
});

test('runPreCommitStage usa el primer finding bloqueante aunque existan warnings antes en el snapshot', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    stageBackendFile(repoRoot);
    const blocked: Array<{
      causeCode: string;
      causeMessage: string;
      remediation: string;
      totalViolations: number;
    }> = [];

    const exitCode = await runPreCommitStage({
      runPlatformGate: async () => 1,
      readEvidence: () =>
        ({
          version: '2.1',
          snapshot: {
            stage: 'PRE_COMMIT',
            outcome: 'BLOCK',
            findings: [
              {
                ruleId: 'rules.warning.only',
                severity: 'WARN',
                code: 'WARNING_ONLY',
                message: 'warning no bloqueante',
              },
              {
                ruleId: 'governance.rules.active-rule-coverage.empty',
                severity: 'ERROR',
                code: 'ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH',
                message: 'Active rules coverage is empty at PRE_COMMIT while code changes were detected.',
              },
            ],
          },
          ai_gate: {
            status: 'BLOCKED',
            violations: [
              {
                code: 'AI_GATE_BLOCK',
                severity: 'ERROR',
                message: 'bloqueo ai gate',
              },
            ],
            human_intent: null,
          },
          rulesets: [],
        }) as ReturnType<typeof readEvidence>,
      notifyGateBlocked: (params) => {
        blocked.push({
          causeCode: params.causeCode,
          causeMessage: params.causeMessage,
          remediation: params.remediation,
          totalViolations: params.totalViolations,
        });
      },
      resolveRepoRoot: () => repoRoot,
    });

    assert.equal(exitCode, 1);
    assert.equal(blocked.length, 1);
    assert.equal(blocked[0]?.causeCode, 'ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH');
    assert.match(blocked[0]?.causeMessage ?? '', /Active rules coverage is empty/i);
    assert.match(blocked[0]?.remediation ?? '', /policy reconcile --strict --json/i);
    assert.equal(blocked[0]?.totalViolations, 2);
  });
});

test('runPreCommitStage ejecuta policy reconcile y reintenta una vez cuando bloquea por skills coverage', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    let gateCalls = 0;
    let reconcileCalls = 0;
    const exitCode = await runPreCommitStage({
      runPlatformGate: async () => {
        gateCalls += 1;
        return gateCalls === 1 ? 1 : 0;
      },
      readEvidence: () => createSkillsCoverageBlockedEvidence('PRE_COMMIT') as ReturnType<typeof readEvidence>,
      runPolicyReconcile: ((params?: { repoRoot?: string; strict?: boolean; apply?: boolean }) => {
        reconcileCalls += 1;
        assert.equal(params?.repoRoot, repoRoot);
        assert.equal(params?.strict, true);
        assert.equal(params?.apply, true);
        return {} as never;
      }) as never,
      notifyAuditSummaryFromEvidence: () => {
      },
      isQuietMode: () => true,
      resolveRepoRoot: () => repoRoot,
    });

    assert.equal(exitCode, 0);
    assert.equal(reconcileCalls, 1);
    assert.equal(gateCalls, 2);
  });
});

test('runPreCommitStage no reintenta cuando el auto-reconcile de hook está desactivado por env', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    const previous = process.env.PUMUKI_HOOK_POLICY_AUTO_RECONCILE;
    process.env.PUMUKI_HOOK_POLICY_AUTO_RECONCILE = '0';
    let gateCalls = 0;
    let reconcileCalls = 0;
    try {
      const exitCode = await runPreCommitStage({
        runPlatformGate: async () => {
          gateCalls += 1;
          return 1;
        },
        readEvidence: () =>
          createSkillsCoverageBlockedEvidence('PRE_COMMIT') as ReturnType<typeof readEvidence>,
        runPolicyReconcile: (() => {
          reconcileCalls += 1;
          return {} as never;
        }) as never,
        notifyAuditSummaryFromEvidence: () => {
        },
        isQuietMode: () => true,
        resolveRepoRoot: () => repoRoot,
      });

      assert.equal(exitCode, 1);
      assert.equal(reconcileCalls, 0);
      assert.equal(gateCalls, 1);
    } finally {
      if (typeof previous === 'undefined') {
        delete process.env.PUMUKI_HOOK_POLICY_AUTO_RECONCILE;
      } else {
        process.env.PUMUKI_HOOK_POLICY_AUTO_RECONCILE = previous;
      }
    }
  });
});

test('runPreCommitStage bloquea y revierte mutación inesperada de manifests', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    const packageJsonPath = join(repoRoot, 'package.json');
    const packageLockPath = join(repoRoot, 'package-lock.json');
    const pnpmLockPath = join(repoRoot, 'pnpm-lock.yaml');
    const yarnLockPath = join(repoRoot, 'yarn.lock');
    const originalPackageJson = '{\n  "name": "consumer-fixture",\n  "private": true\n}\n';
    const originalPackageLock = '{\n  "name": "consumer-fixture",\n  "lockfileVersion": 3\n}\n';
    const originalPnpmLock = 'lockfileVersion: 9.0\n';
    writeFileSync(packageJsonPath, originalPackageJson, 'utf8');
    writeFileSync(packageLockPath, originalPackageLock, 'utf8');
    writeFileSync(pnpmLockPath, originalPnpmLock, 'utf8');

    const blocked: Array<{
      stage: StageName;
      causeCode: string;
      causeMessage: string;
    }> = [];

    const exitCode = await runPreCommitStage({
      runPlatformGate: async () => {
        writeFileSync(packageJsonPath, '{\n  "name": "mutated-by-hook"\n}\n', 'utf8');
        writeFileSync(packageLockPath, '{\n  "name": "mutated-by-hook",\n  "lockfileVersion": 3\n}\n', 'utf8');
        writeFileSync(pnpmLockPath, 'lockfileVersion: 9.1\n', 'utf8');
        writeFileSync(yarnLockPath, '# generated unexpectedly\n', 'utf8');
        return 0;
      },
      notifyGateBlocked: (params) => {
        blocked.push({
          stage: params.stage,
          causeCode: params.causeCode,
          causeMessage: params.causeMessage,
        });
      },
      notifyAuditSummaryFromEvidence: () => {
      },
      isQuietMode: () => true,
      resolveRepoRoot: () => repoRoot,
    });

    assert.equal(exitCode, 1);
    assert.equal(blocked.length, 1);
    assert.equal(blocked[0]?.stage, 'PRE_COMMIT');
    assert.equal(blocked[0]?.causeCode, 'MANIFEST_MUTATION_DETECTED');
    assert.match(blocked[0]?.causeMessage ?? '', /package\.json/i);
    assert.equal(readFileSync(packageJsonPath, 'utf8'), originalPackageJson);
    assert.equal(readFileSync(packageLockPath, 'utf8'), originalPackageLock);
    assert.equal(readFileSync(pnpmLockPath, 'utf8'), originalPnpmLock);
    assert.equal(existsSync(yarnLockPath), false);
  });
});

test('runPrePushStage bloquea y revierte mutación inesperada de manifests', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    const packageJsonPath = join(repoRoot, 'package.json');
    const packageLockPath = join(repoRoot, 'package-lock.json');
    const pnpmLockPath = join(repoRoot, 'pnpm-lock.yaml');
    const yarnLockPath = join(repoRoot, 'yarn.lock');
    const originalPackageJson = '{\n  "name": "consumer-fixture",\n  "private": true\n}\n';
    const originalPackageLock = '{\n  "name": "consumer-fixture",\n  "lockfileVersion": 3\n}\n';
    const originalPnpmLock = 'lockfileVersion: 9.0\n';
    writeFileSync(packageJsonPath, originalPackageJson, 'utf8');
    writeFileSync(packageLockPath, originalPackageLock, 'utf8');
    writeFileSync(pnpmLockPath, originalPnpmLock, 'utf8');

    const blocked: Array<{
      stage: StageName;
      causeCode: string;
      causeMessage: string;
    }> = [];

    const exitCode = await runPrePushStage({
      resolveUpstreamRef: () => 'origin/develop',
      runPlatformGate: async () => {
        writeFileSync(packageJsonPath, '{\n  "name": "mutated-by-hook"\n}\n', 'utf8');
        writeFileSync(packageLockPath, '{\n  "name": "mutated-by-hook",\n  "lockfileVersion": 3\n}\n', 'utf8');
        writeFileSync(pnpmLockPath, 'lockfileVersion: 9.1\n', 'utf8');
        writeFileSync(yarnLockPath, '# generated unexpectedly\n', 'utf8');
        return 0;
      },
      notifyGateBlocked: (params) => {
        blocked.push({
          stage: params.stage,
          causeCode: params.causeCode,
          causeMessage: params.causeMessage,
        });
      },
      notifyAuditSummaryFromEvidence: () => {
      },
      isQuietMode: () => true,
      resolveRepoRoot: () => repoRoot,
    });

    assert.equal(exitCode, 1);
    assert.equal(blocked.length, 1);
    assert.equal(blocked[0]?.stage, 'PRE_PUSH');
    assert.equal(blocked[0]?.causeCode, 'MANIFEST_MUTATION_DETECTED');
    assert.match(blocked[0]?.causeMessage ?? '', /package\.json/i);
    assert.equal(readFileSync(packageJsonPath, 'utf8'), originalPackageJson);
    assert.equal(readFileSync(packageLockPath, 'utf8'), originalPackageLock);
    assert.equal(readFileSync(pnpmLockPath, 'utf8'), originalPnpmLock);
    assert.equal(existsSync(yarnLockPath), false);
  });
});

test('runPrePushStage sin upstream emite notificación de bloqueo accionable', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRangeWithoutUpstream(repoRoot);
    const headOid = runGit(repoRoot, ['rev-parse', 'HEAD']).trim();
    const blocked: Array<{
      stage: StageName;
      causeCode: string;
      remediation: string;
    }> = [];

    const exitCode = await runPrePushStage({
      resolvePrePushBootstrapBaseRef: () => 'HEAD',
      readPrePushStdin: () =>
        `refs/heads/feature/no-upstream ${headOid} refs/heads/develop ${headOid}\n`,
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

test('runPrePushStage bloquea upstream desalineado también con ahead moderado (evita falso positivo de scope)', async () => {
  await withStageRunnerRepo(async (repoRoot) => {
    setupBackendCommitRange(repoRoot);
    let gateCalls = 0;
    const blocked: Array<{
      stage: StageName;
      causeCode: string;
      causeMessage: string;
      remediation: string;
    }> = [];

    const exitCode = await runPrePushStage({
      resolveUpstreamRef: () => 'origin/develop',
      resolveCurrentBranchRef: () => 'feature/misaligned-low-ahead',
      resolveUpstreamTrackingRef: () => 'origin/develop',
      resolveAheadBehindFromRef: () => ({ ahead: 6, behind: 0 }),
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
    assert.equal(gateCalls, 0);
    assert.equal(blocked.length, 1);
    assert.equal(blocked[0]?.stage, 'PRE_PUSH');
    assert.equal(blocked[0]?.causeCode, 'PRE_PUSH_UPSTREAM_MISALIGNED');
  });
});

test('runPreCommitStage deja git atomicity en advisory por defecto y ejecuta el gate principal', async () => {
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

    assert.equal(exitCode, 0);
    assert.equal(gateCalls, 1);
    assert.equal(blocked.length, 0);
  });
});

test('runPreCommitStage bloquea temprano por git atomicity cuando el enforcement es strict', async () => {
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
      resolveGitAtomicityEnforcement: () => ({
        mode: 'strict',
        source: 'env',
        blocking: true,
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

test('runPrePushStage deja git atomicity en advisory por defecto y ejecuta el gate principal', async () => {
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

    assert.equal(exitCode, 0);
    assert.equal(gateCalls, 1);
    assert.equal(blocked.length, 0);
  });
});

test('runPrePushStage bloquea temprano por git atomicity cuando el enforcement es strict', async () => {
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
      resolveGitAtomicityEnforcement: () => ({
        mode: 'strict',
        source: 'env',
        blocking: true,
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
