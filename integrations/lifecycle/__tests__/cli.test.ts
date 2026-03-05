import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import type { LocalHotspotsReport } from '../analyticsHotspots';
import { getCurrentPumukiPackageName } from '../packageInfo';
import { resolveHotspotsSaasIngestionAuditPath } from '../saasIngestionAudit';
import {
  createHotspotsSaasIngestionPayload,
  resolveHotspotsSaasIngestionPayloadPath,
} from '../saasIngestionContract';
import { resolveHotspotsSaasIngestionMetricsPath } from '../saasIngestionMetrics';
import { parseLifecycleCliArgs, runLifecycleCli } from '../cli';
import { computeEvidencePayloadHash } from '../../evidence/evidenceChain';
import { openSddSession } from '../../sdd/sessionStore';
import { resolveMcpAiGateReceiptPath, writeMcpAiGateReceipt } from '../../mcp/aiGateReceipt';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const createGitRepo = (trackedNodeModules = false): string => {
  const repo = join(tmpdir(), `pumuki-lifecycle-cli-test-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(repo, { recursive: true });
  runGit(repo, ['init', '-b', 'main']);
  runGit(repo, ['config', 'user.email', 'pumuki-test@example.com']);
  runGit(repo, ['config', 'user.name', 'Pumuki Test']);
  writeFileSync(join(repo, '.gitignore'), 'node_modules/\n', 'utf8');
  writeFileSync(join(repo, 'README.md'), '# fixture\n', 'utf8');
  runGit(repo, ['add', '.']);
  runGit(repo, ['commit', '-m', 'chore: fixture']);

  if (trackedNodeModules) {
    mkdirSync(join(repo, 'node_modules'), { recursive: true });
    writeFileSync(join(repo, 'node_modules', 'tracked.txt'), 'tracked\n', 'utf8');
    runGit(repo, ['add', '-f', 'node_modules/tracked.txt']);
    runGit(repo, ['commit', '-m', 'test: tracked node_modules']);
  }

  return repo;
};

const writePreWriteEvidence = (repoRoot: string, branch: string): void => {
  const evidence = {
    version: '2.1' as const,
    timestamp: new Date().toISOString(),
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
        package_version: '6.3.26',
        lifecycle_version: '6.3.26',
        hooks: {
          pre_commit: 'managed' as const,
          pre_push: 'managed' as const,
        },
      },
    },
  };

  const payloadHash = computeEvidencePayloadHash(evidence);
  const withChain = {
    ...evidence,
    evidence_chain: {
      algorithm: 'sha256' as const,
      previous_payload_hash: null,
      payload_hash: payloadHash,
      sequence: 1,
    },
  };

  writeFileSync(
    join(repoRoot, '.ai_evidence.json'),
    JSON.stringify(withChain, null, 2),
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

const withSilentConsole = async <T>(callback: () => Promise<T>): Promise<T> => {
  const originalLog = console.log;
  const originalError = console.error;
  console.log = () => {};
  console.error = () => {};
  try {
    return await callback();
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
};

const withSddBypass = async <T>(callback: () => Promise<T>): Promise<T> => {
  const previous = process.env.PUMUKI_SDD_BYPASS;
  process.env.PUMUKI_SDD_BYPASS = '1';
  try {
    return await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_SDD_BYPASS;
    } else {
      process.env.PUMUKI_SDD_BYPASS = previous;
    }
  }
};

const createEmptyHotspotsReport = (repoRoot: string): LocalHotspotsReport => {
  return {
    generatedAt: '2026-02-26T12:00:00+00:00',
    repoRoot,
    options: {
      topN: 1,
      sinceDays: 90,
    },
    totals: {
      churnSignals: 0,
      technicalSignals: 0,
      ranked: 0,
    },
    hotspots: [],
  };
};

test('parseLifecycleCliArgs interpreta comandos y flags soportados', () => {
  const packageName = getCurrentPumukiPackageName();

  assert.deepEqual(parseLifecycleCliArgs(['install']), {
    command: 'install',
    purgeArtifacts: false,
    updateSpec: undefined,
    json: false,
  });
  assert.deepEqual(parseLifecycleCliArgs(['install', '--with-mcp']), {
    command: 'install',
    purgeArtifacts: false,
    updateSpec: undefined,
    json: false,
    installWithMcp: true,
  });
  assert.deepEqual(parseLifecycleCliArgs(['install', '--with-mcp', '--agent=codex']), {
    command: 'install',
    purgeArtifacts: false,
    updateSpec: undefined,
    json: false,
    installWithMcp: true,
    installMcpAgent: 'codex',
  });
  assert.deepEqual(parseLifecycleCliArgs(['uninstall', '--purge-artifacts']), {
    command: 'uninstall',
    purgeArtifacts: true,
    updateSpec: undefined,
    json: false,
  });
  assert.deepEqual(parseLifecycleCliArgs(['update', `--spec= ${packageName}@next `]), {
    command: 'update',
    purgeArtifacts: false,
    updateSpec: `${packageName}@next`,
    json: false,
  });
  assert.deepEqual(parseLifecycleCliArgs(['update', '--latest']), {
    command: 'update',
    purgeArtifacts: false,
    updateSpec: undefined,
    json: false,
  });
  assert.deepEqual(parseLifecycleCliArgs(['doctor', '--remote-checks']), {
    command: 'doctor',
    purgeArtifacts: false,
    updateSpec: undefined,
    json: false,
    remoteChecks: true,
  });
  assert.deepEqual(parseLifecycleCliArgs(['doctor', '--deep', '--json']), {
    command: 'doctor',
    purgeArtifacts: false,
    updateSpec: undefined,
    json: true,
    doctorDeep: true,
  });
  assert.deepEqual(parseLifecycleCliArgs(['status', '--json', '--remote-checks']), {
    command: 'status',
    purgeArtifacts: false,
    updateSpec: undefined,
    json: true,
    remoteChecks: true,
  });
  assert.deepEqual(
    parseLifecycleCliArgs([
      'watch',
      '--stage=pre_push',
      '--scope=repoAndStaged',
      '--severity=medium',
      '--interval-ms=1500',
      '--notify-cooldown-ms=45000',
      '--iterations=2',
      '--no-notify',
      '--json',
    ]),
    {
      command: 'watch',
      purgeArtifacts: false,
      json: true,
      watchStage: 'PRE_PUSH',
      watchScope: 'repoAndStaged',
      watchIntervalMs: 1500,
      watchNotifyCooldownMs: 45000,
      watchSeverityThreshold: 'medium',
      watchNotifyEnabled: false,
      watchIterations: 2,
    }
  );
});

test('parseLifecycleCliArgs soporta subcomandos SDD', () => {
  assert.deepEqual(parseLifecycleCliArgs(['sdd', 'status', '--json']), {
    command: 'sdd',
    purgeArtifacts: false,
    json: true,
    sddCommand: 'status',
  });
  assert.deepEqual(parseLifecycleCliArgs(['sdd', 'validate', '--stage=ci']), {
    command: 'sdd',
    purgeArtifacts: false,
    json: false,
    sddCommand: 'validate',
    sddStage: 'CI',
  });
  assert.deepEqual(
    parseLifecycleCliArgs([
      'sdd',
      'session',
      '--open',
      '--change=add-auth-feature',
      '--ttl-minutes=60',
    ]),
    {
      command: 'sdd',
      purgeArtifacts: false,
      json: false,
      sddCommand: 'session',
      sddSessionAction: 'open',
      sddChangeId: 'add-auth-feature',
      sddTtlMinutes: 60,
    }
  );
  assert.deepEqual(
    parseLifecycleCliArgs([
      'sdd',
      'sync-docs',
      '--dry-run',
      '--json',
    ]),
    {
      command: 'sdd',
      purgeArtifacts: false,
      json: true,
      sddCommand: 'sync-docs',
      sddSyncDocsDryRun: true,
    }
  );
  assert.deepEqual(
    parseLifecycleCliArgs([
      'sdd',
      'sync-docs',
      '--change=rgo-1700-01',
      '--stage=pre_push',
      '--task=P12.F2.T63',
      '--json',
    ]),
    {
      command: 'sdd',
      purgeArtifacts: false,
      json: true,
      sddCommand: 'sync-docs',
      sddSyncDocsDryRun: false,
      sddSyncDocsChange: 'rgo-1700-01',
      sddSyncDocsStage: 'PRE_PUSH',
      sddSyncDocsTask: 'P12.F2.T63',
    }
  );
  assert.deepEqual(
    parseLifecycleCliArgs([
      'sdd',
      'sync',
      '--change=rgo-1700-01',
      '--stage=pre_push',
      '--task=P12.F2.T63',
      '--from-evidence=.pumuki/evidence/custom.json',
      '--json',
    ]),
    {
      command: 'sdd',
      purgeArtifacts: false,
      json: true,
      sddCommand: 'sync-docs',
      sddSyncDocsDryRun: false,
      sddSyncDocsChange: 'rgo-1700-01',
      sddSyncDocsStage: 'PRE_PUSH',
      sddSyncDocsTask: 'P12.F2.T63',
      sddSyncDocsFromEvidence: '.pumuki/evidence/custom.json',
    }
  );
  assert.deepEqual(
    parseLifecycleCliArgs([
      'sdd',
      'learn',
      '--change=rgo-1700-02',
      '--stage=pre_write',
      '--task=P12.F2.T68',
      '--from-evidence=.pumuki/evidence/learn.json',
      '--dry-run',
      '--json',
    ]),
    {
      command: 'sdd',
      purgeArtifacts: false,
      json: true,
      sddCommand: 'learn',
      sddLearnDryRun: true,
      sddLearnChange: 'rgo-1700-02',
      sddLearnStage: 'PRE_WRITE',
      sddLearnTask: 'P12.F2.T68',
      sddLearnFromEvidence: '.pumuki/evidence/learn.json',
    }
  );
  assert.deepEqual(
    parseLifecycleCliArgs([
      'sdd',
      'auto-sync',
      '--change=rgo-1700-04',
      '--stage=pre_push',
      '--task=P12.F2.T70',
      '--from-evidence=.pumuki/evidence/auto-sync.json',
      '--dry-run',
      '--json',
    ]),
    {
      command: 'sdd',
      purgeArtifacts: false,
      json: true,
      sddCommand: 'auto-sync',
      sddAutoSyncDryRun: true,
      sddAutoSyncChange: 'rgo-1700-04',
      sddAutoSyncStage: 'PRE_PUSH',
      sddAutoSyncTask: 'P12.F2.T70',
      sddAutoSyncFromEvidence: '.pumuki/evidence/auto-sync.json',
    }
  );
});

test('parseLifecycleCliArgs soporta analytics hotspots report', () => {
  assert.deepEqual(
    parseLifecycleCliArgs([
      'analytics',
      'hotspots',
      'report',
      '--top=5',
      '--since-days=30',
      '--json',
    ]),
    {
      command: 'analytics',
      purgeArtifacts: false,
      json: true,
      analyticsCommand: 'hotspots',
      analyticsHotspotsCommand: 'report',
      analyticsTopN: 5,
      analyticsSinceDays: 30,
    }
  );
});

test('parseLifecycleCliArgs soporta analytics hotspots diagnose', () => {
  assert.deepEqual(parseLifecycleCliArgs(['analytics', 'hotspots', 'diagnose', '--json']), {
    command: 'analytics',
    purgeArtifacts: false,
    json: true,
    analyticsCommand: 'hotspots',
    analyticsHotspotsCommand: 'diagnose',
  });
});

test('parseLifecycleCliArgs soporta exportes locales json/markdown para hotspots', () => {
  assert.deepEqual(
    parseLifecycleCliArgs([
      'analytics',
      'hotspots',
      'report',
      '--top=3',
      '--since-days=120',
      '--output-json=.audit-reports/hotspots-report.json',
      '--output-markdown=.audit-reports/hotspots-report.md',
    ]),
    {
      command: 'analytics',
      purgeArtifacts: false,
      json: false,
      analyticsCommand: 'hotspots',
      analyticsHotspotsCommand: 'report',
      analyticsTopN: 3,
      analyticsSinceDays: 120,
      analyticsJsonOutputPath: '.audit-reports/hotspots-report.json',
      analyticsMarkdownOutputPath: '.audit-reports/hotspots-report.md',
    }
  );
});

test('parseLifecycleCliArgs soporta subcomandos loop', () => {
  assert.deepEqual(
    parseLifecycleCliArgs(['loop', 'run', '--objective=stabilize loop runner', '--max-attempts=4']),
    {
      command: 'loop',
      purgeArtifacts: false,
      json: false,
      loopCommand: 'run',
      loopObjective: 'stabilize loop runner',
      loopMaxAttempts: 4,
    }
  );
  assert.deepEqual(parseLifecycleCliArgs(['loop', 'status', '--session=loop-001', '--json']), {
    command: 'loop',
    purgeArtifacts: false,
    json: true,
    loopCommand: 'status',
    loopSessionId: 'loop-001',
  });
  assert.deepEqual(parseLifecycleCliArgs(['loop', 'list', '--json']), {
    command: 'loop',
    purgeArtifacts: false,
    json: true,
    loopCommand: 'list',
  });
  assert.deepEqual(
    parseLifecycleCliArgs([
      'loop',
      'export',
      '--session=loop-001',
      '--output-json=.audit-reports/loop-001.json',
    ]),
    {
      command: 'loop',
      purgeArtifacts: false,
      json: false,
      loopCommand: 'export',
      loopSessionId: 'loop-001',
      loopOutputJsonPath: '.audit-reports/loop-001.json',
    }
  );
});

test('parseLifecycleCliArgs rechaza help implícito y flags no soportados', () => {
  assert.throws(() => parseLifecycleCliArgs([]), /Pumuki lifecycle commands/i);
  assert.throws(() => parseLifecycleCliArgs(['-h']), /Pumuki lifecycle commands/i);
  assert.throws(() => parseLifecycleCliArgs(['unknown']), /Unknown command/i);
  assert.throws(
    () => parseLifecycleCliArgs(['watch', '--severity=urgent']),
    /Unsupported watch severity threshold/i
  );
  assert.throws(
    () => parseLifecycleCliArgs(['watch', '--interval-ms=0']),
    /Invalid --interval-ms value/i
  );
  assert.throws(() => parseLifecycleCliArgs(['analytics']), /Unsupported analytics command/i);
  assert.throws(
    () => parseLifecycleCliArgs(['analytics', 'hotspots']),
    /Unsupported analytics hotspots action/i
  );
  assert.throws(
    () => parseLifecycleCliArgs(['analytics', 'hotspots', 'diagnose', '--top=1']),
    /Unsupported argument/i
  );
  assert.throws(
    () => parseLifecycleCliArgs(['loop', 'run']),
    /Missing --objective/i
  );
  assert.throws(
    () => parseLifecycleCliArgs(['loop', 'status']),
    /Missing --session/i
  );
  assert.throws(
    () => parseLifecycleCliArgs(['install', '--bad-flag']),
    /Unsupported argument/i
  );
  assert.throws(
    () => parseLifecycleCliArgs(['install', '--remote-checks']),
    /only supported with "pumuki doctor" or "pumuki status"/i
  );
  assert.throws(
    () => parseLifecycleCliArgs(['install', '--agent=codex']),
    /only supported with "pumuki install --with-mcp"/i
  );
  assert.throws(
    () => parseLifecycleCliArgs(['status', '--deep']),
    /only supported with "pumuki doctor"/i
  );
  assert.throws(
    () => parseLifecycleCliArgs(['sdd', 'learn']),
    /Missing --change=<change-id> for "pumuki sdd learn"/i
  );
  assert.throws(
    () => parseLifecycleCliArgs(['sdd', 'validate', '--from-evidence=.ai_evidence.json']),
    /--from-evidence is only supported/i
  );
  assert.throws(
    () => parseLifecycleCliArgs(['sdd', 'auto-sync']),
    /Missing --change=<change-id> for "pumuki sdd auto-sync"/i
  );
});

test('runLifecycleCli retorna 1 ante argumentos inválidos', async () => {
  const code = await withSilentConsole(() => runLifecycleCli(['--bad']));
  assert.equal(code, 1);
});

test('runLifecycleCli retorna 0 para ayuda explícita en comando raíz', async () => {
  const code = await withSilentConsole(() => runLifecycleCli(['--help']));
  assert.equal(code, 0);
});

test('runLifecycleCli retorna 0 para ayuda explícita en subcomando', async () => {
  const code = await withSilentConsole(() => runLifecycleCli(['sdd', '--help']));
  assert.equal(code, 0);
});

test('runLifecycleCli watch --json delega en runLifecycleWatch y devuelve payload estable', async () => {
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  try {
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;
    const code = await runLifecycleCli(
      ['watch', '--stage=pre_commit', '--once', '--json'],
      {
        runLifecycleWatch: async () => ({
          command: 'pumuki watch',
          repoRoot: '/repo',
          stage: 'PRE_COMMIT',
          scope: 'workingTree',
          intervalMs: 3000,
          notifyCooldownMs: 30000,
          severityThreshold: 'high',
          notifyEnabled: true,
          ticks: 1,
          evaluations: 1,
          notificationsSent: 1,
          notificationsSuppressed: 0,
          lastTick: {
            tick: 1,
            changed: true,
            evaluated: true,
            stage: 'PRE_COMMIT',
            scope: 'workingTree',
            gateExitCode: 1,
            gateOutcome: 'BLOCK',
            threshold: 'high',
            thresholdSeverity: 'ERROR',
            totalFindings: 2,
            findingsAtOrAboveThreshold: 1,
            topCodes: ['RULE_BLOCK'],
            notification: 'sent',
          },
        }),
      }
    );
    assert.equal(code, 0);
    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      command?: string;
      stage?: string;
      ticks?: number;
      notificationsSent?: number;
      lastTick?: { notification?: string };
    };
    assert.equal(payload.command, 'pumuki watch');
    assert.equal(payload.stage, 'PRE_COMMIT');
    assert.equal(payload.ticks, 1);
    assert.equal(payload.notificationsSent, 1);
    assert.equal(payload.lastTick?.notification, 'sent');
  } finally {
    process.stdout.write = originalStdoutWrite;
  }
});

test('runLifecycleCli status --json --remote-checks añade diagnóstico remoto en payload', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);

  try {
    process.chdir(repo);
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;

    const code = await runLifecycleCli(['status', '--json', '--remote-checks'], {
      collectRemoteCiDiagnostics: () => ({
        enabled: true,
        provider: 'github',
        status: 'blocked',
        repoRoot: repo,
        checkedAt: '2026-03-03T12:00:00.000Z',
        branch: 'feature/remote-ci',
        pr: {
          number: 512,
          url: 'https://github.com/org/repo/pull/512',
          headRefName: 'feature/remote-ci',
        },
        checks: {
          total: 2,
          failing: 2,
        },
        blockers: [
          {
            code: 'REMOTE_CI_BILLING_LOCK',
            severity: 'error',
            message: 'billing lock',
            remediation: 'unlock billing',
            affectedChecks: ['Type Check'],
            evidence: ['Type Check: billing issue'],
          },
        ],
      }),
    });
    assert.equal(code, 0);
    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      remoteCiDiagnostics?: { status?: string; blockers?: Array<{ code?: string }> };
      policyValidation?: {
        stages?: {
          PRE_COMMIT?: { validationCode?: string };
          PRE_PUSH?: { validationCode?: string };
          CI?: { validationCode?: string };
        };
      };
    };
    assert.equal(payload.remoteCiDiagnostics?.status, 'blocked');
    assert.equal(payload.remoteCiDiagnostics?.blockers?.[0]?.code, 'REMOTE_CI_BILLING_LOCK');
    assert.equal(
      payload.policyValidation?.stages?.PRE_COMMIT?.validationCode,
      'POLICY_AS_CODE_VALID'
    );
    assert.equal(
      payload.policyValidation?.stages?.PRE_PUSH?.validationCode,
      'POLICY_AS_CODE_VALID'
    );
    assert.equal(payload.policyValidation?.stages?.CI?.validationCode, 'POLICY_AS_CODE_VALID');
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli doctor --remote-checks imprime resumen de bloqueadores remotos', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);

  try {
    process.chdir(repo);
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;

    const code = await runLifecycleCli(['doctor', '--remote-checks'], {
      collectRemoteCiDiagnostics: () => ({
        enabled: true,
        provider: 'github',
        status: 'blocked',
        repoRoot: repo,
        checkedAt: '2026-03-03T12:00:00.000Z',
        checks: {
          total: 1,
          failing: 1,
        },
        blockers: [
          {
            code: 'REMOTE_CI_PROVIDER_QUOTA',
            severity: 'error',
            message: 'provider quota',
            remediation: 'increase quota',
            affectedChecks: ['security/snyk'],
            evidence: ['security/snyk: quota reached'],
          },
        ],
      }),
    });
    assert.equal(code, 0);
    const output = printed.join('\n');
    assert.match(output, /\[pumuki\]\[remote-ci\] status=BLOCKED/i);
    assert.match(output, /REMOTE_CI_PROVIDER_QUOTA/i);
    assert.match(output, /remediation: increase quota/i);
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli doctor --deep --json expone checks enterprise deterministas', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);

  try {
    process.chdir(repo);
    await withSilentConsole(() => runLifecycleCli(['install']));
    mkdirSync(join(repo, '.pumuki'), { recursive: true });
    writeFileSync(
      join(repo, '.pumuki', 'adapter.json'),
      JSON.stringify(
        {
          hooks: {
            pre_write: { command: 'npx --yes --package pumuki@latest pumuki-pre-write' },
            pre_commit: { command: 'npx --yes --package pumuki@latest pumuki-pre-commit' },
            pre_push: { command: 'npx --yes --package pumuki@latest pumuki-pre-push' },
            ci: { command: 'npx --yes --package pumuki@latest pumuki-ci' },
          },
          mcp: {
            enterprise: { command: 'npx --yes --package pumuki@latest pumuki-mcp-enterprise-stdio' },
            evidence: { command: 'npx --yes --package pumuki@latest pumuki-mcp-evidence-stdio' },
          },
        },
        null,
        2
      ),
      'utf8'
    );
    writePreWriteEvidence(repo, 'main');

    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;

    const code = await runLifecycleCli(['doctor', '--deep', '--json']);
    assert.equal(code, 0);
    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      deep?: {
        enabled?: boolean;
        checks?: Array<{ id?: string }>;
        contract?: {
          overall?: string;
        };
      };
      policyValidation?: {
        stages?: {
          PRE_COMMIT?: { validationCode?: string };
          PRE_PUSH?: { validationCode?: string };
          CI?: { validationCode?: string };
        };
      };
    };
    assert.equal(payload.deep?.enabled, true);
    assert.equal(payload.deep?.checks?.some((check) => check.id === 'upstream-readiness'), true);
    assert.equal(payload.deep?.checks?.some((check) => check.id === 'adapter-wiring'), true);
    assert.equal(payload.deep?.checks?.some((check) => check.id === 'policy-drift'), true);
    assert.equal(payload.deep?.checks?.some((check) => check.id === 'evidence-source-drift'), true);
    assert.equal(payload.deep?.checks?.some((check) => check.id === 'compatibility-contract'), true);
    assert.equal(
      payload.deep?.contract?.overall === 'compatible' ||
      payload.deep?.contract?.overall === 'incompatible',
      true
    );
    assert.equal(
      payload.policyValidation?.stages?.PRE_COMMIT?.validationCode,
      'POLICY_AS_CODE_VALID'
    );
    assert.equal(
      payload.policyValidation?.stages?.PRE_PUSH?.validationCode,
      'POLICY_AS_CODE_VALID'
    );
    assert.equal(payload.policyValidation?.stages?.CI?.validationCode, 'POLICY_AS_CODE_VALID');
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli doctor --deep retorna 1 cuando hay bloqueo crítico deep', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);

  try {
    process.chdir(repo);
    await withSilentConsole(() => runLifecycleCli(['install']));
    writeFileSync(join(repo, '.ai_evidence.json'), JSON.stringify({ version: '2.0' }, null, 2), 'utf8');
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;

    const code = await runLifecycleCli(['doctor', '--deep', '--json']);
    assert.equal(code, 1);
    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      deep?: {
        blocking?: boolean;
      };
    };
    assert.equal(payload.deep?.blocking, true);
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli sdd validate PRE_WRITE autocura recibo MCP faltante y permite continuar', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);

  try {
    runGit(repo, ['checkout', '-b', 'feature/prewrite-mcp-enforcement']);
    writeFileSync(
      join(repo, '.ai_evidence.json'),
      JSON.stringify(
        {
          version: '2.1',
          timestamp: new Date().toISOString(),
          snapshot: {
            stage: 'PRE_COMMIT',
            outcome: 'PASS',
            rules_coverage: {
              stage: 'PRE_COMMIT',
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
            status: 'ALLOWED',
            violations: [],
            human_intent: null,
          },
          severity_metrics: {
            gate_status: 'ALLOWED',
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
              branch: 'feature/prewrite-mcp-enforcement',
              upstream: null,
              ahead: 0,
              behind: 0,
              dirty: false,
              staged: 0,
              unstaged: 0,
            },
            lifecycle: {
              installed: true,
              package_version: '6.3.26',
              lifecycle_version: '6.3.26',
              hooks: {
                pre_commit: 'managed',
                pre_push: 'managed',
              },
            },
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

    const code = await withSddBypass(() =>
      runLifecycleCli(['sdd', 'validate', '--stage=PRE_WRITE', '--json'])
    );
    assert.equal(code, 0);
    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      ai_gate?: {
        allowed?: boolean;
        violations?: Array<{ code?: string }>;
      };
      policy_validation?: {
        stages?: {
          PRE_COMMIT?: { validationCode?: string };
          PRE_PUSH?: { validationCode?: string };
          CI?: { validationCode?: string };
        };
      };
    };
    assert.equal(payload.ai_gate?.allowed, true);
    assert.equal(
      (payload.ai_gate?.violations ?? []).some(
        (violation) => violation.code === 'MCP_ENTERPRISE_RECEIPT_MISSING'
      ),
      false
    );
    assert.equal(
      payload.policy_validation?.stages?.PRE_COMMIT?.validationCode,
      'POLICY_AS_CODE_VALID'
    );
    assert.equal(
      payload.policy_validation?.stages?.PRE_PUSH?.validationCode,
      'POLICY_AS_CODE_VALID'
    );
    assert.equal(payload.policy_validation?.stages?.CI?.validationCode, 'POLICY_AS_CODE_VALID');
    assert.equal(existsSync(resolveMcpAiGateReceiptPath(repo)), true);
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli sdd validate PRE_WRITE permite continuar con recibo MCP válido', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);

  try {
    runGit(repo, ['checkout', '-b', 'feature/prewrite-mcp-ready']);
    writeFileSync(
      join(repo, '.ai_evidence.json'),
      JSON.stringify(
        {
          version: '2.1',
          timestamp: new Date().toISOString(),
          snapshot: {
            stage: 'PRE_COMMIT',
            outcome: 'PASS',
            rules_coverage: {
              stage: 'PRE_COMMIT',
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
            status: 'ALLOWED',
            violations: [],
            human_intent: null,
          },
          severity_metrics: {
            gate_status: 'ALLOWED',
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
              branch: 'feature/prewrite-mcp-ready',
              upstream: null,
              ahead: 0,
              behind: 0,
              dirty: false,
              staged: 0,
              unstaged: 0,
            },
            lifecycle: {
              installed: true,
              package_version: '6.3.26',
              lifecycle_version: '6.3.26',
              hooks: {
                pre_commit: 'managed',
                pre_push: 'managed',
              },
            },
          },
        },
        null,
        2
      ),
      'utf8'
    );
    writeMcpAiGateReceipt({
      repoRoot: repo,
      stage: 'PRE_WRITE',
      status: 'ALLOWED',
      allowed: true,
    });

    process.chdir(repo);
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;

    const code = await withSddBypass(() =>
      runLifecycleCli(['sdd', 'validate', '--stage=PRE_WRITE', '--json'])
    );
    assert.equal(code, 0);
    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      ai_gate?: {
        allowed?: boolean;
      };
      policy_validation?: {
        stages?: {
          PRE_COMMIT?: { validationCode?: string };
          PRE_PUSH?: { validationCode?: string };
          CI?: { validationCode?: string };
        };
      };
    };
    assert.equal(payload.ai_gate?.allowed, true);
    assert.equal(
      payload.policy_validation?.stages?.PRE_COMMIT?.validationCode,
      'POLICY_AS_CODE_VALID'
    );
    assert.equal(
      payload.policy_validation?.stages?.PRE_PUSH?.validationCode,
      'POLICY_AS_CODE_VALID'
    );
    assert.equal(payload.policy_validation?.stages?.CI?.validationCode, 'POLICY_AS_CODE_VALID');
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli sdd validate PRE_WRITE sin --json renderiza panel legacy de pre-flight', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);

  try {
    runGit(repo, ['checkout', '-b', 'feature/prewrite-panel']);
    writeFileSync(
      join(repo, '.ai_evidence.json'),
      JSON.stringify(
        {
          version: '2.1',
          timestamp: new Date().toISOString(),
          snapshot: {
            stage: 'PRE_COMMIT',
            outcome: 'PASS',
            rules_coverage: {
              stage: 'PRE_COMMIT',
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
            status: 'ALLOWED',
            violations: [],
            human_intent: null,
          },
          severity_metrics: {
            gate_status: 'ALLOWED',
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
              branch: 'feature/prewrite-panel',
              upstream: null,
              ahead: 0,
              behind: 0,
              dirty: false,
              staged: 0,
              unstaged: 0,
            },
            lifecycle: {
              installed: true,
              package_version: '6.3.26',
              lifecycle_version: '6.3.26',
              hooks: {
                pre_commit: 'managed',
                pre_push: 'managed',
              },
            },
          },
        },
        null,
        2
      ),
      'utf8'
    );

    process.chdir(repo);
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;

    const code = await withSddBypass(() =>
      runLifecycleCli(['sdd', 'validate', '--stage=PRE_WRITE'])
    );
    assert.equal(code, 0);
    const output = printed.join('\n');
    assert.match(output, /PRE-FLIGHT CHECK/);
    assert.match(output, /MCP receipt: required=yes kind=valid/);
    assert.match(output, /Evidence source: source=local-file/);
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli sdd validate PRE_WRITE auto-bootstrap de OpenSpec y habilita flujo determinista', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const changeId = 'bootstrap-openspec-missing';

  try {
    runGit(repo, ['checkout', '-b', 'feature/prewrite-openspec-bootstrap']);
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ name: 'fixture', version: '1.0.0' }, null, 2),
      'utf8'
    );
    mkdirSync(join(repo, 'openspec', 'changes', changeId), { recursive: true });
    writeFileSync(join(repo, 'openspec', 'changes', changeId, 'proposal.md'), '# proposal\n', 'utf8');
    openSddSession({ cwd: repo, changeId, ttlMinutes: 60 });
    writePreWriteEvidence(repo, 'feature/prewrite-openspec-bootstrap');
    writeMcpAiGateReceipt({
      repoRoot: repo,
      stage: 'PRE_WRITE',
      status: 'ALLOWED',
      allowed: true,
    });

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
    assert.equal(existsSync(join(repo, 'node_modules', '.bin', 'openspec')), true);

    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      sdd?: {
        decision?: { code?: string; allowed?: boolean };
        status?: { openspec?: { installed?: boolean; compatible?: boolean } };
      };
      bootstrap?: { enabled?: boolean; attempted?: boolean; status?: string; actions?: string[] };
    };
    assert.equal(payload.sdd?.decision?.allowed, true);
    assert.equal(payload.sdd?.decision?.code, 'ALLOWED');
    assert.equal(payload.sdd?.status?.openspec?.installed, true);
    assert.equal(payload.sdd?.status?.openspec?.compatible, true);
    assert.equal(payload.bootstrap?.enabled, true);
    assert.equal(payload.bootstrap?.attempted, true);
    assert.equal(payload.bootstrap?.status, 'OK');
    assert.equal((payload.bootstrap?.actions ?? []).includes('npm-install:@fission-ai/openspec@latest'), true);
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli sdd validate PRE_WRITE con auto-bootstrap deshabilitado expone next_action ejecutable', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const previousAutoBootstrap = process.env.PUMUKI_PREWRITE_AUTO_BOOTSTRAP;
  const changeId = 'bootstrap-disabled-openspec-missing';

  try {
    runGit(repo, ['checkout', '-b', 'feature/prewrite-openspec-bootstrap-disabled']);
    writeFileSync(
      join(repo, 'package.json'),
      JSON.stringify({ name: 'fixture', version: '1.0.0' }, null, 2),
      'utf8'
    );
    mkdirSync(join(repo, 'openspec', 'changes', changeId), { recursive: true });
    writeFileSync(join(repo, 'openspec', 'changes', changeId, 'proposal.md'), '# proposal\n', 'utf8');
    openSddSession({ cwd: repo, changeId, ttlMinutes: 60 });
    writePreWriteEvidence(repo, 'feature/prewrite-openspec-bootstrap-disabled');
    writeMcpAiGateReceipt({
      repoRoot: repo,
      stage: 'PRE_WRITE',
      status: 'ALLOWED',
      allowed: true,
    });
    process.env.PUMUKI_PREWRITE_AUTO_BOOTSTRAP = '0';

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
    assert.equal(code, 1);
    assert.equal(existsSync(join(repo, 'node_modules', '.bin', 'openspec')), false);

    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      sdd?: { decision?: { code?: string; allowed?: boolean } };
      bootstrap?: { enabled?: boolean; attempted?: boolean; status?: string; details?: string };
      next_action?: { reason?: string; command?: string };
    };
    assert.equal(payload.sdd?.decision?.allowed, false);
    assert.equal(payload.sdd?.decision?.code, 'OPENSPEC_MISSING');
    assert.equal(payload.bootstrap?.enabled, false);
    assert.equal(payload.bootstrap?.attempted, false);
    assert.equal(payload.bootstrap?.status, 'SKIPPED');
    assert.match(payload.bootstrap?.details ?? '', /PUMUKI_PREWRITE_AUTO_BOOTSTRAP=0/);
    assert.equal(payload.next_action?.reason, 'OPENSPEC_MISSING');
    assert.equal(payload.next_action?.command, 'npx --yes --package pumuki@latest pumuki install');
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

test('runLifecycleCli sdd sync-docs dry-run devuelve diff sin modificar el archivo canónico', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const canonicalDoc = join(
    repo,
    'docs',
    'technical',
    '08-validation',
    'refactor',
    'pumuki-integration-feedback.md'
  );

  try {
    mkdirSync(dirname(canonicalDoc), { recursive: true });
    writeFileSync(
      canonicalDoc,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n'),
      'utf8'
    );
    const before = readFileSync(canonicalDoc, 'utf8');

    process.chdir(repo);
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;

    const code = await runLifecycleCli([
      'sdd',
      'sync-docs',
      '--change=rgo-1700-01',
      '--stage=pre_commit',
      '--task=P12.F2.T63',
      '--dry-run',
      '--json',
    ]);
    assert.equal(code, 0);
    const after = readFileSync(canonicalDoc, 'utf8');
    assert.equal(before, after);

    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      command?: string;
      dryRun?: boolean;
      context?: {
        change?: string | null;
        stage?: string | null;
        task?: string | null;
      };
      learning?: {
        path?: string;
        written?: boolean;
        artifact?: {
          change_id?: string;
          stage?: string | null;
          task?: string | null;
        };
      };
      updated?: boolean;
      files?: Array<{ updated?: boolean; diffMarkdown?: string }>;
    };
    assert.equal(payload.command, 'pumuki sdd sync-docs');
    assert.equal(payload.dryRun, true);
    assert.equal(payload.context?.change, 'rgo-1700-01');
    assert.equal(payload.context?.stage, 'PRE_COMMIT');
    assert.equal(payload.context?.task, 'P12.F2.T63');
    assert.equal(payload.learning?.path, 'openspec/changes/rgo-1700-01/learning.json');
    assert.equal(payload.learning?.written, false);
    assert.equal(payload.learning?.artifact?.change_id, 'rgo-1700-01');
    assert.equal(payload.learning?.artifact?.stage, 'PRE_COMMIT');
    assert.equal(payload.learning?.artifact?.task, 'P12.F2.T63');
    assert.equal(payload.updated, true);
    assert.equal(payload.files?.[0]?.updated, true);
    assert.match(payload.files?.[0]?.diffMarkdown ?? '', /sdd-status/i);
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli sdd sync alias acepta --from-evidence y usa esa fuente para learning', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const canonicalDoc = join(
    repo,
    'docs',
    'technical',
    '08-validation',
    'refactor',
    'pumuki-integration-feedback.md'
  );
  const customEvidence = join(repo, '.pumuki', 'evidence', 'custom-invalid.json');

  try {
    mkdirSync(dirname(canonicalDoc), { recursive: true });
    writeFileSync(
      canonicalDoc,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n'),
      'utf8'
    );
    mkdirSync(dirname(customEvidence), { recursive: true });
    writeFileSync(customEvidence, '{invalid-json', 'utf8');

    process.chdir(repo);
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;

    const code = await runLifecycleCli([
      'sdd',
      'sync',
      '--change=rgo-1700-01',
      '--from-evidence=.pumuki/evidence/custom-invalid.json',
      '--dry-run',
      '--json',
    ]);
    assert.equal(code, 0);

    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      context?: {
        fromEvidencePath?: string | null;
      };
      learning?: {
        artifact?: {
          gate_anomalies?: string[];
        };
      };
    };
    assert.equal(payload.context?.fromEvidencePath, '.pumuki/evidence/custom-invalid.json');
    assert.deepEqual(payload.learning?.artifact?.gate_anomalies, ['evidence.invalid.schema']);
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli sdd sync devuelve 1 cuando --from-evidence intenta salir del repo root', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const canonicalDoc = join(
    repo,
    'docs',
    'technical',
    '08-validation',
    'refactor',
    'pumuki-integration-feedback.md'
  );

  try {
    mkdirSync(dirname(canonicalDoc), { recursive: true });
    writeFileSync(
      canonicalDoc,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n'),
      'utf8'
    );

    process.chdir(repo);
    const code = await runLifecycleCli([
      'sdd',
      'sync',
      '--change=rgo-1700-01',
      '--from-evidence=../outside-evidence.json',
      '--dry-run',
      '--json',
    ]);
    assert.equal(code, 1);
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli sdd auto-sync dry-run orquesta sync-docs + learning sin modificar archivo canónico', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const canonicalDoc = join(
    repo,
    'docs',
    'technical',
    '08-validation',
    'refactor',
    'pumuki-integration-feedback.md'
  );

  try {
    mkdirSync(dirname(canonicalDoc), { recursive: true });
    writeFileSync(
      canonicalDoc,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n'),
      'utf8'
    );
    const before = readFileSync(canonicalDoc, 'utf8');

    process.chdir(repo);
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;

    const code = await runLifecycleCli([
      'sdd',
      'auto-sync',
      '--change=rgo-1700-04',
      '--stage=pre_push',
      '--task=P12.F2.T70',
      '--dry-run',
      '--json',
    ]);
    assert.equal(code, 0);
    const after = readFileSync(canonicalDoc, 'utf8');
    assert.equal(before, after);

    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      command?: string;
      dryRun?: boolean;
      context?: {
        change?: string;
        stage?: string | null;
        task?: string | null;
      };
      syncDocs?: {
        updated?: boolean;
        files?: Array<{ updated?: boolean; diffMarkdown?: string }>;
      };
      learning?: {
        path?: string;
        written?: boolean;
      };
    };
    assert.equal(payload.command, 'pumuki sdd auto-sync');
    assert.equal(payload.dryRun, true);
    assert.equal(payload.context?.change, 'rgo-1700-04');
    assert.equal(payload.context?.stage, 'PRE_PUSH');
    assert.equal(payload.context?.task, 'P12.F2.T70');
    assert.equal(payload.syncDocs?.updated, true);
    assert.equal(payload.syncDocs?.files?.[0]?.updated, true);
    assert.match(payload.syncDocs?.files?.[0]?.diffMarkdown ?? '', /sdd-status/i);
    assert.equal(payload.learning?.path, 'openspec/changes/rgo-1700-04/learning.json');
    assert.equal(payload.learning?.written, false);
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli sdd learn dry-run genera learning payload sin requerir archivos canónicos', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);

  try {
    process.chdir(repo);
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;

    const code = await runLifecycleCli([
      'sdd',
      'learn',
      '--change=rgo-1700-03',
      '--stage=pre_write',
      '--task=P12.F2.T68',
      '--dry-run',
      '--json',
    ]);
    assert.equal(code, 0);

    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      command?: string;
      dryRun?: boolean;
      context?: {
        change?: string;
        stage?: string | null;
        task?: string | null;
      };
      learning?: {
        path?: string;
        written?: boolean;
      };
    };
    assert.equal(payload.command, 'pumuki sdd learn');
    assert.equal(payload.dryRun, true);
    assert.equal(payload.context?.change, 'rgo-1700-03');
    assert.equal(payload.context?.stage, 'PRE_WRITE');
    assert.equal(payload.context?.task, 'P12.F2.T68');
    assert.equal(payload.learning?.path, 'openspec/changes/rgo-1700-03/learning.json');
    assert.equal(payload.learning?.written, false);
    assert.equal(
      existsSync(join(repo, 'openspec', 'changes', 'rgo-1700-03', 'learning.json')),
      false
    );
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli ejecuta flujo install/doctor/status/remove/uninstall en repo válido', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();

  try {
    process.chdir(repo);
    const installCode = await withSilentConsole(() =>
      runLifecycleCli(['install', '--with-mcp'])
    );
    assert.equal(installCode, 0);
    assert.equal(existsSync(join(repo, '.pumuki', 'adapter.json')), true);

    writeFileSync(join(repo, '.ai_evidence.json'), '{}\n', 'utf8');
    const doctorCode = await withSilentConsole(() => runLifecycleCli(['doctor']));
    assert.equal(doctorCode, 0);

    const statusCode = await withSilentConsole(() => runLifecycleCli(['status']));
    assert.equal(statusCode, 0);

    const removeCode = await withSilentConsole(() => runLifecycleCli(['remove']));
    assert.equal(removeCode, 0);

    const uninstallCode = await withSilentConsole(() =>
      runLifecycleCli(['uninstall', '--purge-artifacts'])
    );
    assert.equal(uninstallCode, 0);
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli retorna 1 para update cuando doctor bloquea baseline inseguro', async () => {
  const repo = createGitRepo(true);
  const previousCwd = process.cwd();
  const packageName = getCurrentPumukiPackageName();

  try {
    process.chdir(repo);
    const code = await withSilentConsole(() =>
      runLifecycleCli(['update', `--spec=${packageName}@next`])
    );
    assert.equal(code, 1);
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli analytics hotspots report devuelve ranking local en json', async () => {
  const repo = createGitRepo();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const previousCwd = process.cwd();

  try {
    mkdirSync(join(repo, 'src'), { recursive: true });
    writeFileSync(join(repo, 'src', 'a.ts'), 'export const a = 1;\n', 'utf8');
    writeFileSync(join(repo, 'src', 'b.ts'), 'export const b = 1;\n', 'utf8');
    runGit(repo, ['add', 'src/a.ts', 'src/b.ts']);
    runGit(repo, ['commit', '-m', 'feat: add files for hotspots']);
    writeFileSync(join(repo, 'src', 'a.ts'), 'export const a = 2;\nexport const aa = 3;\n', 'utf8');
    runGit(repo, ['add', 'src/a.ts']);
    runGit(repo, ['commit', '-m', 'feat: increase churn on a.ts']);

    writeFileSync(
      join(repo, '.ai_evidence.json'),
      JSON.stringify(
        {
          snapshot: {
            findings: [
              {
                file: join(repo, 'src', 'a.ts'),
                ruleId: 'rule.critical',
                severity: 'CRITICAL',
                code: 'RULE_CRITICAL',
                message: 'critical finding',
                lines: [2],
              },
              {
                file: join(repo, 'src', 'b.ts'),
                ruleId: 'rule.low',
                severity: 'INFO',
                code: 'RULE_LOW',
                message: 'low finding',
              },
            ],
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

    const exitCode = await runLifecycleCli([
      'analytics',
      'hotspots',
      'report',
      '--json',
      '--top=2',
      '--since-days=365',
    ]);

    assert.equal(exitCode, 0);
    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      options?: { topN?: number; sinceDays?: number };
      hotspots?: Array<{ path?: string; rank?: number }>;
    };
    assert.equal(payload.options?.topN, 2);
    assert.equal(payload.options?.sinceDays, 365);
    assert.equal(Array.isArray(payload.hotspots), true);
    assert.equal((payload.hotspots?.length ?? 0) > 0, true);
    assert.equal(payload.hotspots?.[0]?.rank, 1);
    assert.equal(payload.hotspots?.[0]?.path, 'src/a.ts');
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli analytics hotspots report exporta json y markdown en rutas locales', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();

  try {
    mkdirSync(join(repo, 'src'), { recursive: true });
    writeFileSync(join(repo, 'src', 'a.ts'), 'export const a = 1;\n', 'utf8');
    runGit(repo, ['add', 'src/a.ts']);
    runGit(repo, ['commit', '-m', 'feat: add a.ts for export report']);
    writeFileSync(join(repo, 'src', 'a.ts'), 'export const a = 2;\nexport const aa = 3;\n', 'utf8');
    runGit(repo, ['add', 'src/a.ts']);
    runGit(repo, ['commit', '-m', 'feat: increase churn for export report']);
    writeFileSync(
      join(repo, '.ai_evidence.json'),
      JSON.stringify(
        {
          snapshot: {
            findings: [
              {
                file: join(repo, 'src', 'a.ts'),
                ruleId: 'rule.critical',
                severity: 'CRITICAL',
                code: 'RULE_CRITICAL',
                message: 'critical finding',
                lines: [2],
              },
            ],
          },
        },
        null,
        2
      ),
      'utf8'
    );

    process.chdir(repo);
    const exitCode = await withSilentConsole(() =>
      runLifecycleCli([
        'analytics',
        'hotspots',
        'report',
        '--top=1',
        '--since-days=365',
        '--output-json=.audit-reports/hotspots-report.json',
        '--output-markdown=.audit-reports/hotspots-report.md',
      ])
    );
    assert.equal(exitCode, 0);
    assert.equal(existsSync(join(repo, '.audit-reports', 'hotspots-report.json')), true);
    assert.equal(existsSync(join(repo, '.audit-reports', 'hotspots-report.md')), true);

    const jsonPayload = JSON.parse(
      readFileSync(join(repo, '.audit-reports', 'hotspots-report.json'), 'utf8')
    ) as { hotspots?: Array<{ path?: string }>; options?: { topN?: number; sinceDays?: number } };
    assert.equal(jsonPayload.options?.topN, 1);
    assert.equal(jsonPayload.options?.sinceDays, 365);
    assert.equal(Array.isArray(jsonPayload.hotspots), true);
    assert.equal((jsonPayload.hotspots?.length ?? 0) > 0, true);
    assert.equal(jsonPayload.hotspots?.[0]?.path, 'src/a.ts');

    const markdownPayload = readFileSync(
      join(repo, '.audit-reports', 'hotspots-report.md'),
      'utf8'
    );
    assert.match(markdownPayload, /# Pumuki Hotspots Report/i);
    assert.match(markdownPayload, /src\/a\.ts/);
  } finally {
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli analytics hotspots diagnose genera diagnóstico y métricas de ingesta', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);

  try {
    const payloadPath = resolveHotspotsSaasIngestionPayloadPath(repo);
    mkdirSync(dirname(payloadPath), { recursive: true });
    const payload = createHotspotsSaasIngestionPayload({
      tenantId: 'tenant-alpha',
      repositoryId: 'repo-alpha',
      repositoryName: 'ast-intelligence-hooks',
      report: createEmptyHotspotsReport(repo),
      producerVersion: '0.0.0-test',
      sourceMode: 'local',
      generatedAt: '2026-02-26T12:00:00+00:00',
      repositoryDefaultBranch: 'main',
    });
    writeFileSync(payloadPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    const auditPath = resolveHotspotsSaasIngestionAuditPath(repo);
    mkdirSync(dirname(auditPath), { recursive: true });
    writeFileSync(
      auditPath,
      `${JSON.stringify({
        event_id: 'event-1',
        event_at: '2026-02-26T12:01:00+00:00',
        tenant_id: 'tenant-alpha',
        repository_id: 'repo-alpha',
        endpoint: 'https://example.com/ingestion',
        idempotency_key: 'idem-1',
        payload_hash: payload.integrity.payload_hash,
        outcome: 'success',
        attempts: 1,
        latency_ms: 140,
        status: 200,
      })}\n`,
      'utf8'
    );

    process.chdir(repo);
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;

    const exitCode = await runLifecycleCli(['analytics', 'hotspots', 'diagnose', '--json']);

    assert.equal(exitCode, 0);
    const diagnostics = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      status?: string;
      issues?: ReadonlyArray<unknown>;
      contract?: { status?: string };
      audit?: { events?: number };
      metrics?: { snapshot?: { totals?: { success?: number; error?: number } } };
    };
    assert.equal(diagnostics.status, 'healthy');
    assert.equal(Array.isArray(diagnostics.issues), true);
    assert.equal(diagnostics.issues?.length, 0);
    assert.equal(diagnostics.contract?.status, 'valid');
    assert.equal(diagnostics.audit?.events, 1);
    assert.equal(diagnostics.metrics?.snapshot?.totals?.success, 1);
    assert.equal(diagnostics.metrics?.snapshot?.totals?.error, 0);
    assert.equal(existsSync(resolveHotspotsSaasIngestionMetricsPath(repo)), true);
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli loop run/status/list/stop/resume/export opera sobre store local', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);

  try {
    process.chdir(repo);
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;

    const runCode = await runLifecycleCli([
      'loop',
      'run',
      '--objective=validate gate in loop mode',
      '--max-attempts=3',
      '--json',
    ], {
      runPlatformGate: async () => 0,
    });
    assert.equal(runCode, 0);
    const runPayload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      session_id?: string;
      status?: string;
      current_attempt?: number;
      attempts?: Array<{ outcome?: string; evidence_path?: string }>;
    };
    assert.equal(runPayload.status, 'running');
    assert.equal(runPayload.current_attempt, 1);
    assert.equal(runPayload.attempts?.[0]?.outcome, 'pass');
    assert.match(runPayload.attempts?.[0]?.evidence_path ?? '', /\.attempt-1\.json$/);
    assert.equal(typeof runPayload.session_id, 'string');
    const sessionId = runPayload.session_id ?? '';

    const statusCode = await runLifecycleCli(['loop', 'status', `--session=${sessionId}`, '--json']);
    assert.equal(statusCode, 0);
    const statusPayload = JSON.parse(printed[printed.length - 1] ?? '{}') as { session_id?: string };
    assert.equal(statusPayload.session_id, sessionId);

    const listCode = await runLifecycleCli(['loop', 'list', '--json']);
    assert.equal(listCode, 0);
    const listPayload = JSON.parse(printed[printed.length - 1] ?? '[]') as Array<{ session_id?: string }>;
    assert.equal(Array.isArray(listPayload), true);
    assert.equal(listPayload.some((item) => item.session_id === sessionId), true);

    const stopCode = await runLifecycleCli(['loop', 'stop', `--session=${sessionId}`, '--json']);
    assert.equal(stopCode, 0);
    const stopPayload = JSON.parse(printed[printed.length - 1] ?? '{}') as { status?: string };
    assert.equal(stopPayload.status, 'stopped');

    const resumeCode = await runLifecycleCli(['loop', 'resume', `--session=${sessionId}`, '--json']);
    assert.equal(resumeCode, 0);
    const resumePayload = JSON.parse(printed[printed.length - 1] ?? '{}') as { status?: string };
    assert.equal(resumePayload.status, 'running');

    const exportCode = await runLifecycleCli([
      'loop',
      'export',
      `--session=${sessionId}`,
      '--output-json=.audit-reports/loop-export.json',
    ]);
    assert.equal(exportCode, 0);
    assert.equal(existsSync(join(repo, '.audit-reports', 'loop-export.json')), true);
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});

test('runLifecycleCli loop run aplica fail-fast cuando gate bloquea y deja evidencia por intento', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);

  try {
    process.chdir(repo);
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;

    const runCode = await runLifecycleCli([
      'loop',
      'run',
      '--objective=fail fast smoke',
      '--max-attempts=2',
      '--json',
    ], {
      runPlatformGate: async () => 1,
    });
    assert.equal(runCode, 1);
    const payload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      session_id?: string;
      status?: string;
      current_attempt?: number;
      attempts?: Array<{ outcome?: string; gate_allowed?: boolean; evidence_path?: string }>;
    };
    assert.equal(payload.status, 'blocked');
    assert.equal(payload.current_attempt, 1);
    assert.equal(payload.attempts?.[0]?.outcome, 'block');
    assert.equal(payload.attempts?.[0]?.gate_allowed, false);
    assert.equal(typeof payload.session_id, 'string');
    const evidencePath = payload.attempts?.[0]?.evidence_path ?? '';
    assert.match(evidencePath, /\.attempt-1\.json$/);
    assert.equal(existsSync(join(repo, evidencePath)), true);

    const statusCode = await runLifecycleCli([
      'loop',
      'status',
      `--session=${payload.session_id ?? ''}`,
      '--json',
    ]);
    assert.equal(statusCode, 0);
    const statusPayload = JSON.parse(printed[printed.length - 1] ?? '{}') as {
      status?: string;
    };
    assert.equal(statusPayload.status, 'blocked');
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.chdir(previousCwd);
    rmSync(repo, { recursive: true, force: true });
  }
});
