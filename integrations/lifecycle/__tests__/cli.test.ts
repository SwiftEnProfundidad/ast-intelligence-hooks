import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

test('parseLifecycleCliArgs rechaza help implícito y flags no soportados', () => {
  assert.throws(() => parseLifecycleCliArgs([]), /Pumuki lifecycle commands/i);
  assert.throws(() => parseLifecycleCliArgs(['-h']), /Pumuki lifecycle commands/i);
  assert.throws(() => parseLifecycleCliArgs(['unknown']), /Unknown command/i);
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
    () => parseLifecycleCliArgs(['install', '--bad-flag']),
    /Unsupported argument/i
  );
});

test('runLifecycleCli retorna 1 ante argumentos inválidos', async () => {
  const code = await withSilentConsole(() => runLifecycleCli(['--bad']));
  assert.equal(code, 1);
});

test('runLifecycleCli ejecuta flujo install/doctor/status/remove/uninstall en repo válido', async () => {
  const repo = createGitRepo();
  const previousCwd = process.cwd();

  try {
    process.chdir(repo);
    const installCode = await withSilentConsole(() => runLifecycleCli(['install']));
    assert.equal(installCode, 0);

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
