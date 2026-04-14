import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { getCurrentPumukiVersion } from '../packageInfo';
import { runLifecycleCli } from '../cli';
import { computeEvidencePayloadHash } from '../../evidence/evidenceChain';
import { openSddSession } from '../../sdd/sessionStore';
import { writeMcpAiGateReceipt } from '../../mcp/aiGateReceipt';

test.afterEach(() => {
  process.exitCode = undefined;
});

test.after(() => {
  process.exitCode = undefined;
});

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const createGitRepo = (): string => {
  const repo = join(tmpdir(), `pumuki-lifecycle-cli-prewrite-heavy-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(repo, { recursive: true });
  runGit(repo, ['init', '-b', 'main']);
  runGit(repo, ['config', 'user.email', 'pumuki-test@example.com']);
  runGit(repo, ['config', 'user.name', 'Pumuki Test']);
  writeFileSync(join(repo, '.gitignore'), 'node_modules/\n', 'utf8');
  writeFileSync(join(repo, 'README.md'), '# fixture\n', 'utf8');
  runGit(repo, ['add', '.']);
  runGit(repo, ['commit', '-m', 'chore: fixture']);
  return repo;
};

const writePreWriteEvidence = (
  repoRoot: string,
  branch: string,
  timestamp = new Date().toISOString()
): void => {
  const evidence = {
    version: '2.1' as const,
    timestamp,
    snapshot: {
      stage: 'PRE_COMMIT' as const,
      outcome: 'PASS' as const,
      rules_coverage: {
        stage: 'PRE_COMMIT' as const,
        active_rule_ids: ['skills.backend.no-empty-catch'],
        evaluated_rule_ids: ['skills.backend.no-empty-catch'],
        matched_rule_ids: [],
        unevaluated_rule_ids: [],
        counts: {
          active: 1,
          evaluated: 1,
          matched: 0,
          unevaluated: 0,
        },
        coverage_ratio: 1,
      },
      findings: [],
    },
    ledger: [],
    platforms: {},
    rulesets: [],
    human_intent: null,
    ai_gate: {
      status: 'ALLOWED' as const,
      violations: [],
      human_intent: null,
    },
    severity_metrics: {
      gate_status: 'ALLOWED' as const,
      total_violations: 0,
      by_severity: {
        CRITICAL: 0,
        ERROR: 0,
        WARN: 0,
        INFO: 0,
      },
    },
    repo_state: {
      repo_root: repoRoot,
      git: {
        available: true,
        branch,
        upstream: null,
        ahead: 0,
        behind: 0,
        dirty: false,
        staged: 0,
        unstaged: 0,
      },
      lifecycle: {
        installed: true,
        package_version: getCurrentPumukiVersion({ repoRoot }),
        lifecycle_version: getCurrentPumukiVersion({ repoRoot }),
        hooks: {
          pre_commit: 'managed' as const,
          pre_push: 'managed' as const,
        },
      },
    },
  };
  const payloadHash = computeEvidencePayloadHash(evidence);
  writeFileSync(
    join(repoRoot, '.ai_evidence.json'),
    JSON.stringify(
      {
        ...evidence,
        evidence_chain: {
          algorithm: 'sha256' as const,
          previous_payload_hash: null,
          payload_hash: payloadHash,
          sequence: 1,
        },
      },
      null,
      2
    ),
    'utf8'
  );
};

const withFakeNpmOpenSpecInstaller = async <T>(
  repoRoot: string,
  callback: () => Promise<T>
): Promise<T> => {
  const previousPath = process.env.PATH ?? '';
  const fakeBinDir = join(repoRoot, '.fake-bin');
  mkdirSync(fakeBinDir, { recursive: true });
  const npmPath = join(fakeBinDir, 'npm');
  const script = `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
if (args[0] === 'install' && args.includes('@fission-ai/openspec@latest')) {
  const cwd = process.cwd();
  const binDir = path.join(cwd, 'node_modules', '.bin');
  fs.mkdirSync(binDir, { recursive: true });
  const openspecPath = path.join(binDir, 'openspec');
  fs.writeFileSync(
    openspecPath,
    '#!/usr/bin/env node\\nconst args = process.argv.slice(2);\\nif (args.includes(\"--version\")) { process.stdout.write(\"OpenSpec CLI v1.2.0\\\\n\"); process.exit(0); }\\nif (args[0] === \"validate\") { process.stdout.write(JSON.stringify({ summary: { totals: { items: 1, failed: 0, passed: 1 }, byLevel: { ERROR: 0, WARNING: 0, INFO: 0 } } })); process.exit(0); }\\nprocess.exit(0);\\n',
    'utf8'
  );
  fs.chmodSync(openspecPath, 0o755);
  process.exit(0);
}
process.exit(0);
`;
  writeFileSync(npmPath, script, 'utf8');
  chmodSync(npmPath, 0o755);
  process.env.PATH = `${fakeBinDir}:${previousPath}`;
  try {
    return await callback();
  } finally {
    process.env.PATH = previousPath;
  }
};

const withPreWriteEnforcement = async <T>(
  mode: 'off' | 'advisory' | 'strict',
  callback: () => Promise<T>
): Promise<T> => {
  const previous = process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE;
  const previousSdd = process.env.PUMUKI_EXPERIMENTAL_SDD;
  const previousHeuristics = process.env.PUMUKI_EXPERIMENTAL_HEURISTICS;
  const previousLearningContext = process.env.PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT;
  const previousAnalytics = process.env.PUMUKI_EXPERIMENTAL_ANALYTICS;
  const previousSkills = process.env.PUMUKI_SKILLS_ENFORCEMENT;
  const previousTddBdd = process.env.PUMUKI_TDD_BDD_ENFORCEMENT;
  const previousLegacy = process.env.PUMUKI_PREWRITE_ENFORCEMENT;
  delete process.env.PUMUKI_EXPERIMENTAL_HEURISTICS;
  delete process.env.PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT;
  delete process.env.PUMUKI_EXPERIMENTAL_ANALYTICS;
  delete process.env.PUMUKI_SKILLS_ENFORCEMENT;
  delete process.env.PUMUKI_TDD_BDD_ENFORCEMENT;
  delete process.env.PUMUKI_PREWRITE_ENFORCEMENT;
  process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE = mode;
  process.env.PUMUKI_EXPERIMENTAL_SDD = 'strict';
  try {
    return await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE = previous;
    }
    if (typeof previousSdd === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_SDD;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_SDD = previousSdd;
    }
    if (typeof previousHeuristics === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_HEURISTICS;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_HEURISTICS = previousHeuristics;
    }
    if (typeof previousLearningContext === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT = previousLearningContext;
    }
    if (typeof previousAnalytics === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_ANALYTICS;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_ANALYTICS = previousAnalytics;
    }
    if (typeof previousSkills === 'undefined') {
      delete process.env.PUMUKI_SKILLS_ENFORCEMENT;
    } else {
      process.env.PUMUKI_SKILLS_ENFORCEMENT = previousSkills;
    }
    if (typeof previousTddBdd === 'undefined') {
      delete process.env.PUMUKI_TDD_BDD_ENFORCEMENT;
    } else {
      process.env.PUMUKI_TDD_BDD_ENFORCEMENT = previousTddBdd;
    }
    if (typeof previousLegacy === 'undefined') {
      delete process.env.PUMUKI_PREWRITE_ENFORCEMENT;
    } else {
      process.env.PUMUKI_PREWRITE_ENFORCEMENT = previousLegacy;
    }
  }
};

const withSkillsEnforcement = async <T>(
  mode: 'advisory' | 'strict',
  callback: () => Promise<T>
): Promise<T> => {
  const previous = process.env.PUMUKI_SKILLS_ENFORCEMENT;
  process.env.PUMUKI_SKILLS_ENFORCEMENT = mode;
  try {
    return await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_SKILLS_ENFORCEMENT;
    } else {
      process.env.PUMUKI_SKILLS_ENFORCEMENT = previous;
    }
  }
};

const withStrictPreWriteEnforcement = async <T>(callback: () => Promise<T>): Promise<T> =>
  withPreWriteEnforcement('strict', callback);

const withAdvisoryPreWriteEnforcement = async <T>(callback: () => Promise<T>): Promise<T> =>
  withPreWriteEnforcement('advisory', callback);

test('runLifecycleCli sdd validate PRE_WRITE blocks missing OpenSpec in strict enforcement mode', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const previousAutoBootstrap = process.env.PUMUKI_PREWRITE_AUTO_BOOTSTRAP;

  try {
    runGit(repo, ['checkout', '-b', 'feature/prewrite-openspec-strict']);
    process.chdir(repo);
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;
    process.env.PUMUKI_PREWRITE_AUTO_BOOTSTRAP = '0';

    const code = await withStrictPreWriteEnforcement(() =>
      runLifecycleCli(['sdd', 'validate', '--stage=PRE_WRITE', '--json'], {
        runPlatformGate: async () => 0,
      })
    );
    assert.equal(code, 1);

    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      pre_write_enforcement?: { mode?: string; blocking?: boolean };
      sdd?: { decision?: { code?: string } };
    };
    assert.equal(payload.pre_write_enforcement?.mode, 'strict');
    assert.equal(payload.pre_write_enforcement?.blocking, true);
    assert.equal(payload.sdd?.decision?.code, 'OPENSPEC_MISSING');
  } finally {
    if (typeof previousAutoBootstrap === 'undefined') {
      delete process.env.PUMUKI_PREWRITE_AUTO_BOOTSTRAP;
    } else {
      process.env.PUMUKI_PREWRITE_AUTO_BOOTSTRAP = previousAutoBootstrap;
    }
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli sdd validate PRE_WRITE deja skills gap en advisory cuando skills enforcement no está activado explícitamente', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const changeId = 'prewrite-ios-critical-gap';

  await withAdvisoryPreWriteEnforcement(async () => {
    try {
      runGit(repo, ['checkout', '-b', 'feature/prewrite-ios-critical-gap']);
      writeFileSync(
        join(repo, 'package.json'),
        JSON.stringify({ name: 'fixture', version: '1.0.0' }, null, 2),
        'utf8'
      );
      mkdirSync(join(repo, 'openspec', 'changes', changeId), { recursive: true });
      writeFileSync(join(repo, 'openspec', 'changes', changeId, 'proposal.md'), '# proposal\n', 'utf8');
      openSddSession({ cwd: repo, changeId, ttlMinutes: 60 });
      writeMcpAiGateReceipt({
        repoRoot: repo,
        stage: 'PRE_WRITE',
        status: 'ALLOWED',
        allowed: true,
      });

      const evidence = {
        version: '2.1' as const,
        timestamp: new Date().toISOString(),
        snapshot: {
          stage: 'PRE_WRITE' as const,
          outcome: 'PASS' as const,
          rules_coverage: {
            stage: 'PRE_WRITE' as const,
            active_rule_ids: ['skills.ios.no-force-unwrap'],
            evaluated_rule_ids: ['skills.ios.no-force-unwrap'],
            matched_rule_ids: [],
            unevaluated_rule_ids: [],
            counts: {
              active: 1,
              evaluated: 1,
              matched: 0,
              unevaluated: 0,
            },
            coverage_ratio: 1,
          },
          findings: [],
        },
        ledger: [],
        platforms: {
          ios: {
            detected: true,
            confidence: 'HIGH' as const,
          },
        },
        rulesets: [
          {
            platform: 'skills' as const,
            bundle: 'ios-guidelines@1.0.0',
            hash: 'skills-ios-hash',
          },
          {
            platform: 'skills' as const,
            bundle: 'ios-concurrency-guidelines@1.0.0',
            hash: 'skills-ios-concurrency-hash',
          },
          {
            platform: 'skills' as const,
            bundle: 'ios-swiftui-expert-guidelines@1.0.0',
            hash: 'skills-ios-swiftui-hash',
          },
        ],
        human_intent: null,
        ai_gate: {
          status: 'ALLOWED' as const,
          violations: [],
          human_intent: null,
        },
        severity_metrics: {
          gate_status: 'ALLOWED' as const,
          total_violations: 0,
          by_severity: {
            CRITICAL: 0,
            ERROR: 0,
            WARN: 0,
            INFO: 0,
          },
        },
        repo_state: {
          repo_root: repo,
          git: {
            available: true,
            branch: 'feature/prewrite-ios-critical-gap',
            upstream: null,
            ahead: 0,
            behind: 0,
            dirty: false,
            staged: 0,
            unstaged: 0,
          },
          lifecycle: {
            installed: true,
            package_version: getCurrentPumukiVersion({ repoRoot: repo }),
            lifecycle_version: getCurrentPumukiVersion({ repoRoot: repo }),
            hooks: {
              pre_commit: 'managed' as const,
              pre_push: 'managed' as const,
            },
          },
        },
      };
      const payloadHash = computeEvidencePayloadHash(evidence);
      writeFileSync(
        join(repo, '.ai_evidence.json'),
        JSON.stringify(
          {
            ...evidence,
            evidence_chain: {
              algorithm: 'sha256' as const,
              previous_payload_hash: null,
              payload_hash: payloadHash,
              sequence: 1,
            },
          },
          null,
          2
        ),
        'utf8'
      );

      process.chdir(repo);
      process.stdout.write = ((chunk: unknown): boolean => {
        printed.push(String(chunk).trimEnd());
        return true;
      }) as typeof process.stdout.write;

      const code = await withFakeNpmOpenSpecInstaller(repo, async () =>
        runLifecycleCli(['sdd', 'validate', '--stage=PRE_WRITE', '--json'], {
          runPlatformGate: async () => 0,
        })
      );
      assert.equal(code, 0);

      const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
        sdd?: { decision?: { code?: string; allowed?: boolean } };
        pre_write_enforcement?: { mode?: string; blocking?: boolean };
        ai_gate?: { allowed?: boolean; violations?: Array<{ code?: string }> };
        next_action?: { reason?: string; command?: string };
      };
      assert.equal(payload.sdd?.decision?.allowed, true);
      assert.equal(payload.sdd?.decision?.code, 'ALLOWED');
      assert.equal(payload.pre_write_enforcement?.mode, 'advisory');
      assert.equal(payload.pre_write_enforcement?.blocking, false);
      assert.equal(payload.ai_gate?.allowed, true);
      assert.equal(
        (payload.ai_gate?.violations ?? []).some(
          (item) => item.code === 'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING'
        ),
        true
      );
      assert.equal(payload.next_action, undefined);
    } finally {
      process.stdout.write = originalStdoutWrite;
      process.chdir(previousCwd);
      rmSync(repo, { recursive: true, force: true });
    }
  });
});

test('runLifecycleCli sdd validate PRE_WRITE blocks skills gap when skills enforcement está activado en strict explícitamente', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const changeId = 'prewrite-ios-critical-gap-strict';

  try {
    runGit(repo, ['checkout', '-b', 'feature/prewrite-ios-critical-gap-strict']);
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ name: 'fixture', version: '1.0.0' }, null, 2),
      'utf8'
    );
    mkdirSync(join(repo, 'openspec', 'changes', changeId), { recursive: true });
    writeFileSync(join(repo, 'openspec', 'changes', changeId, 'proposal.md'), '# proposal\n', 'utf8');
    openSddSession({ cwd: repo, changeId, ttlMinutes: 60 });
    writeMcpAiGateReceipt({
      repoRoot: repo,
      stage: 'PRE_WRITE',
      status: 'ALLOWED',
      allowed: true,
    });

    const evidence = {
      version: '2.1' as const,
      timestamp: new Date().toISOString(),
      snapshot: {
        stage: 'PRE_WRITE' as const,
        outcome: 'PASS' as const,
        rules_coverage: {
          stage: 'PRE_WRITE' as const,
          active_rule_ids: ['skills.ios.no-force-unwrap'],
          evaluated_rule_ids: ['skills.ios.no-force-unwrap'],
          matched_rule_ids: [],
          unevaluated_rule_ids: [],
          counts: {
            active: 1,
            evaluated: 1,
            matched: 0,
            unevaluated: 0,
          },
          coverage_ratio: 1,
        },
        findings: [],
      },
      ledger: [],
      platforms: {
        ios: {
          detected: true,
          confidence: 'HIGH' as const,
        },
      },
      rulesets: [
        {
          platform: 'skills' as const,
          bundle: 'ios-guidelines@1.0.0',
          hash: 'skills-ios-hash',
        },
        {
          platform: 'skills' as const,
          bundle: 'ios-concurrency-guidelines@1.0.0',
          hash: 'skills-ios-concurrency-hash',
        },
        {
          platform: 'skills' as const,
          bundle: 'ios-swiftui-expert-guidelines@1.0.0',
          hash: 'skills-ios-swiftui-hash',
        },
      ],
      human_intent: null,
      ai_gate: {
        status: 'ALLOWED' as const,
        violations: [],
        human_intent: null,
      },
      severity_metrics: {
        gate_status: 'ALLOWED' as const,
        total_violations: 0,
        by_severity: {
          CRITICAL: 0,
          ERROR: 0,
          WARN: 0,
          INFO: 0,
        },
      },
      repo_state: {
        repo_root: repo,
        git: {
          available: true,
          branch: 'feature/prewrite-ios-critical-gap-strict',
          upstream: null,
          ahead: 0,
          behind: 0,
          dirty: false,
          staged: 0,
          unstaged: 0,
        },
        lifecycle: {
          installed: true,
          package_version: getCurrentPumukiVersion({ repoRoot: repo }),
          lifecycle_version: getCurrentPumukiVersion({ repoRoot: repo }),
          hooks: {
            pre_commit: 'managed' as const,
            pre_push: 'managed' as const,
          },
        },
      },
    };
    const payloadHash = computeEvidencePayloadHash(evidence);
    writeFileSync(
      join(repo, '.ai_evidence.json'),
      JSON.stringify(
        {
          ...evidence,
          evidence_chain: {
            algorithm: 'sha256' as const,
            previous_payload_hash: null,
            payload_hash: payloadHash,
            sequence: 1,
          },
        },
        null,
        2
      ),
      'utf8'
    );

    process.chdir(repo);
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;

    const code = await withFakeNpmOpenSpecInstaller(repo, async () =>
      withStrictPreWriteEnforcement(() =>
        withSkillsEnforcement('strict', () =>
          runLifecycleCli(['sdd', 'validate', '--stage=PRE_WRITE', '--json'], {
            runPlatformGate: async () => 0,
          })
        )
      )
    );
    assert.equal(code, 1);

    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      pre_write_enforcement?: { mode?: string; blocking?: boolean };
      ai_gate?: { allowed?: boolean; violations?: Array<{ code?: string }> };
    };
    assert.equal(payload.pre_write_enforcement?.mode, 'strict');
    assert.equal(payload.pre_write_enforcement?.blocking, true);
    assert.equal(payload.ai_gate?.allowed, false);
    assert.equal(
      (payload.ai_gate?.violations ?? []).some(
        (item) => item.code === 'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING'
      ),
      true
    );
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli sdd validate PRE_WRITE expone next_action de reconcile cuando active_rule_ids está vacío para código', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const changeId = 'prewrite-active-rule-ids-empty';

  try {
    runGit(repo, ['checkout', '-b', 'feature/prewrite-active-rule-ids-empty']);
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ name: 'fixture', version: '1.0.0' }, null, 2),
      'utf8'
    );
    mkdirSync(join(repo, 'openspec', 'changes', changeId), { recursive: true });
    writeFileSync(join(repo, 'openspec', 'changes', changeId, 'proposal.md'), '# proposal\n', 'utf8');
    openSddSession({ cwd: repo, changeId, ttlMinutes: 60 });
    writeMcpAiGateReceipt({
      repoRoot: repo,
      stage: 'PRE_WRITE',
      status: 'ALLOWED',
      allowed: true,
    });

    const evidence = {
      version: '2.1' as const,
      timestamp: new Date().toISOString(),
      snapshot: {
        stage: 'PRE_WRITE' as const,
        outcome: 'PASS' as const,
        rules_coverage: {
          stage: 'PRE_WRITE' as const,
          active_rule_ids: [],
          evaluated_rule_ids: ['skills.backend.no-empty-catch'],
          matched_rule_ids: [],
          unevaluated_rule_ids: [],
          counts: {
            active: 0,
            evaluated: 1,
            matched: 0,
            unevaluated: 0,
          },
          coverage_ratio: 1,
        },
        findings: [],
      },
      ledger: [],
      platforms: {},
      rulesets: [
        {
          platform: 'skills' as const,
          bundle: 'backend-guidelines@1.0.0',
          hash: 'skills-backend-hash',
        },
      ],
      human_intent: null,
      ai_gate: {
        status: 'ALLOWED' as const,
        violations: [],
        human_intent: null,
      },
      severity_metrics: {
        gate_status: 'ALLOWED' as const,
        total_violations: 0,
        by_severity: {
          CRITICAL: 0,
          ERROR: 0,
          WARN: 0,
          INFO: 0,
        },
      },
      repo_state: {
        repo_root: repo,
        git: {
          available: true,
          branch: 'feature/prewrite-active-rule-ids-empty',
          upstream: null,
          ahead: 0,
          behind: 0,
          dirty: false,
          staged: 0,
          unstaged: 0,
        },
        lifecycle: {
          installed: true,
          package_version: getCurrentPumukiVersion({ repoRoot: repo }),
          lifecycle_version: getCurrentPumukiVersion({ repoRoot: repo }),
          hooks: {
            pre_commit: 'managed' as const,
            pre_push: 'managed' as const,
          },
        },
      },
    };
    const payloadHash = computeEvidencePayloadHash(evidence);
    writeFileSync(
      join(repo, '.ai_evidence.json'),
      JSON.stringify(
        {
          ...evidence,
          evidence_chain: {
            algorithm: 'sha256' as const,
            previous_payload_hash: null,
            payload_hash: payloadHash,
            sequence: 1,
          },
        },
        null,
        2
      ),
      'utf8'
    );

    process.chdir(repo);
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;

    const code = await withFakeNpmOpenSpecInstaller(repo, async () =>
      withStrictPreWriteEnforcement(() =>
        runLifecycleCli(['sdd', 'validate', '--stage=PRE_WRITE', '--json'], {
          runPlatformGate: async () => 0,
        })
      )
    );
    assert.equal(code, 1);

    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      pre_write_enforcement?: { mode?: string; blocking?: boolean };
      sdd?: { decision?: { code?: string; allowed?: boolean } };
      ai_gate?: { allowed?: boolean; violations?: Array<{ code?: string }> };
      next_action?: { reason?: string; command?: string };
    };
    assert.equal(payload.pre_write_enforcement?.mode, 'strict');
    assert.equal(payload.pre_write_enforcement?.blocking, true);
    assert.equal(payload.sdd?.decision?.allowed, true);
    assert.equal(payload.sdd?.decision?.code, 'ALLOWED');
    assert.equal(payload.ai_gate?.allowed, false);
    assert.equal(
      (payload.ai_gate?.violations ?? []).some(
        (item) => item.code === 'EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES'
      ),
      true
    );
    assert.equal(payload.next_action?.reason, 'EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES');
    assert.equal(
      payload.next_action?.command,
      'npx --yes --package pumuki@latest pumuki policy reconcile --strict --json && npx --yes --package pumuki@latest pumuki sdd validate --stage=PRE_WRITE --json'
    );
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli sdd validate PRE_WRITE expone next_action con slice atómico cuando el worktree supera el umbral', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const changeId = 'prewrite-worktree-atomic-slice';

  try {
    runGit(repo, ['checkout', '-b', 'feature/prewrite-worktree-atomic-slice']);
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ name: 'fixture', version: '1.0.0' }, null, 2),
      'utf8'
    );
    mkdirSync(join(repo, 'openspec', 'changes', changeId), { recursive: true });
    writeFileSync(join(repo, 'openspec', 'changes', changeId, 'proposal.md'), '# proposal\n', 'utf8');
    openSddSession({ cwd: repo, changeId, ttlMinutes: 60 });
    writePreWriteEvidence(repo, 'feature/prewrite-worktree-atomic-slice');
    writeMcpAiGateReceipt({
      repoRoot: repo,
      stage: 'PRE_WRITE',
      status: 'ALLOWED',
      allowed: true,
    });

    for (let index = 0; index < 30; index += 1) {
      writeFileSync(join(repo, `dirty-file-${index}.txt`), `line-${index}`, 'utf8');
    }

    process.chdir(repo);
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;

    const code = await withFakeNpmOpenSpecInstaller(repo, async () =>
      withStrictPreWriteEnforcement(() =>
        runLifecycleCli(['sdd', 'validate', '--stage=PRE_WRITE', '--json'], {
          runPlatformGate: async () => 0,
        })
      )
    );
    assert.equal(code, 1);

    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      pre_write_enforcement?: { mode?: string; blocking?: boolean };
      ai_gate?: { allowed?: boolean; violations?: Array<{ code?: string }> };
      next_action?: { reason?: string; command?: string };
    };
    assert.equal(payload.pre_write_enforcement?.mode, 'strict');
    assert.equal(payload.pre_write_enforcement?.blocking, true);
    assert.equal(payload.ai_gate?.allowed, false);
    assert.equal(
      (payload.ai_gate?.violations ?? []).some(
        (item) => item.code === 'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT'
      ),
      true
    );
    assert.equal(payload.next_action?.reason, 'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT');
    assert.equal((payload.next_action?.command ?? '').startsWith('git add -- '), true);
    assert.equal(
      (payload.next_action?.command ?? '').includes(
        'pumuki sdd validate --stage=PRE_WRITE --json'
      ),
      true
    );
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});
