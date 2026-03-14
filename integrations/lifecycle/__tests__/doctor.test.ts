import assert from 'node:assert/strict';
import { mkdirSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import { computeEvidencePayloadHash } from '../../evidence/evidenceChain';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { PUMUKI_CONFIG_KEYS } from '../constants';
import type { ILifecycleGitService } from '../gitService';
import { installPumukiHooks } from '../hookManager';
import { doctorHasBlockingIssues, runLifecycleDoctor } from '../doctor';
import { getCurrentPumukiVersion } from '../packageInfo';

const withCwd = <T>(cwd: string, fn: () => T): T => {
  const previous = process.cwd();
  process.chdir(cwd);
  try {
    return fn();
  } finally {
    process.chdir(previous);
  }
};

class FakeLifecycleGitService implements ILifecycleGitService {
  readonly resolveRepoRootCalls: string[] = [];

  constructor(
    private readonly repoRoot: string,
    private readonly trackedNodeModules: ReadonlyArray<string> = [],
    private readonly state: Record<string, string | undefined> = {},
    private readonly runGitResponses: Record<string, string> = {}
  ) {}

  runGit(args: ReadonlyArray<string>, _cwd: string): string {
    const key = args.join(' ');
    if (key in this.runGitResponses) {
      return this.runGitResponses[key] ?? '';
    }
    return '';
  }

  resolveRepoRoot(cwd: string): string {
    this.resolveRepoRootCalls.push(cwd);
    return this.repoRoot;
  }

  statusShort(_cwd: string): string {
    return '';
  }

  trackedNodeModulesPaths(_cwd: string): ReadonlyArray<string> {
    return this.trackedNodeModules;
  }

  pathTracked(_cwd: string, _path: string): boolean {
    return false;
  }

  applyLocalConfig(_cwd: string, _key: string, _value: string): void {}

  clearLocalConfig(_cwd: string, _key: string): void {}

  localConfig(_cwd: string, key: string): string | undefined {
    return this.state[key];
  }
}

const sampleEvidence = (params: {
  repoRoot: string;
  branch: string;
  upstream: string | null;
  timestamp?: string;
}): AiEvidenceV2_1 => {
  const evidence: AiEvidenceV2_1 = {
    version: '2.1',
    timestamp: params.timestamp ?? new Date().toISOString(),
    snapshot: {
      stage: 'PRE_COMMIT',
      outcome: 'PASS',
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
      repo_root: params.repoRoot,
      git: {
        available: true,
        branch: params.branch,
        upstream: params.upstream,
        ahead: 0,
        behind: 0,
        dirty: false,
        staged: 0,
        unstaged: 0,
      },
      lifecycle: {
        installed: true,
        package_version: getCurrentPumukiVersion(),
        lifecycle_version: getCurrentPumukiVersion(),
        hooks: {
          pre_commit: 'managed',
          pre_push: 'managed',
        },
      },
    },
  };

  const payloadHash = computeEvidencePayloadHash(evidence);
  evidence.evidence_chain = {
    algorithm: 'sha256',
    previous_payload_hash: null,
    payload_hash: payloadHash,
    sequence: 1,
  };

  return evidence;
};

test('runLifecycleDoctor marca issue bloqueante cuando hay rutas trackeadas en node_modules', async () => {
  await withTempDir('pumuki-doctor-tracked-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    const git = new FakeLifecycleGitService(repoRoot, ['node_modules/pkg/index.js'], {
      [PUMUKI_CONFIG_KEYS.installed]: 'true',
    });

    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
    });

    assert.equal(report.hooksDirectory, join(repoRoot, '.git', 'hooks'));
    assert.equal(report.hooksDirectoryResolution, 'default');
    assert.equal(report.repoRoot, repoRoot);
    assert.equal(typeof report.policyValidation.stages.PRE_COMMIT.hash, 'string');
    assert.equal(typeof report.policyValidation.stages.PRE_PUSH.hash, 'string');
    assert.equal(typeof report.policyValidation.stages.CI.hash, 'string');
    assert.equal(report.experimentalFeatures.features.analytics.mode, 'off');
    assert.equal(report.experimentalFeatures.features.analytics.source, 'default');
    assert.equal(report.experimentalFeatures.features.pre_write.mode, 'off');
    assert.equal(report.experimentalFeatures.features.pre_write.source, 'default');
    assert.equal(report.experimentalFeatures.features.heuristics.mode, 'off');
    assert.equal(report.experimentalFeatures.features.heuristics.source, 'default');
    assert.equal(report.experimentalFeatures.features.learning_context.mode, 'off');
    assert.equal(report.experimentalFeatures.features.learning_context.source, 'default');
    assert.equal(report.experimentalFeatures.features.mcp_enterprise.mode, 'off');
    assert.equal(report.experimentalFeatures.features.mcp_enterprise.source, 'default');
    assert.equal(report.experimentalFeatures.features.operational_memory.mode, 'off');
    assert.equal(report.experimentalFeatures.features.operational_memory.source, 'default');
    assert.equal(report.experimentalFeatures.features.saas_ingestion.mode, 'off');
    assert.equal(report.experimentalFeatures.features.saas_ingestion.source, 'default');
    assert.equal(report.experimentalFeatures.features.sdd.mode, 'off');
    assert.equal(report.experimentalFeatures.features.sdd.source, 'default');
    assert.deepEqual(report.trackedNodeModulesPaths, ['node_modules/pkg/index.js']);
    assert.equal(report.issues.some((issue) => issue.severity === 'error'), true);
    assert.equal(doctorHasBlockingIssues(report), true);
  });
});

test('runLifecycleDoctor marca warning si lifecycle dice instalado y falta bloque de hook', async () => {
  await withTempDir('pumuki-doctor-missing-hook-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);
    unlinkSync(join(repoRoot, '.git', 'hooks', 'pre-push'));

    const git = new FakeLifecycleGitService(repoRoot, [], {
      [PUMUKI_CONFIG_KEYS.installed]: 'true',
    });
    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
    });

    assert.equal(report.hooksDirectory, join(repoRoot, '.git', 'hooks'));
    assert.equal(report.hooksDirectoryResolution, 'default');
    assert.equal(report.issues.length, 1);
    assert.equal(report.issues[0]?.severity, 'warning');
    assert.match(report.issues[0]?.message ?? '', /installed=true/i);
    assert.match(report.issues[0]?.message ?? '', /core\.hooksPath/i);
    assert.equal(doctorHasBlockingIssues(report), false);
  });
});

test('runLifecycleDoctor marca warning si hay hooks gestionados pero lifecycle no está instalado', async () => {
  await withTempDir('pumuki-doctor-hooks-without-state-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);

    const git = new FakeLifecycleGitService(repoRoot, [], {
      [PUMUKI_CONFIG_KEYS.installed]: 'false',
    });
    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
    });

    assert.equal(report.issues.length, 1);
    assert.equal(report.issues[0]?.severity, 'warning');
    assert.match(report.issues[0]?.message ?? '', /not marked as installed/i);
    assert.equal(doctorHasBlockingIssues(report), false);
  });
});

test('runLifecycleDoctor queda limpio cuando estado y hooks son consistentes', async () => {
  await withTempDir('pumuki-doctor-clean-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);

    const git = new FakeLifecycleGitService(repoRoot, [], {
      [PUMUKI_CONFIG_KEYS.installed]: 'true',
      [PUMUKI_CONFIG_KEYS.version]: '6.3.11',
      [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit,pre-push',
    });
    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
    });

    assert.deepEqual(report.issues, []);
    assert.equal(doctorHasBlockingIssues(report), false);
  });
});

test('runLifecycleDoctor usa process.cwd por defecto y conserva metadatos de lifecycle', async () => {
  await withTempDir('pumuki-doctor-default-cwd-', async (repoRoot) => {
    const git = new FakeLifecycleGitService(repoRoot, [], {
      [PUMUKI_CONFIG_KEYS.installed]: 'true',
      [PUMUKI_CONFIG_KEYS.version]: '6.3.11',
      [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit,pre-push',
      [PUMUKI_CONFIG_KEYS.installedAt]: '2026-02-17T00:00:00.000Z',
    });
    const defaultCwd = tmpdir();
    const report = withCwd(defaultCwd, () =>
      runLifecycleDoctor({
        git,
      })
    );

    assert.equal(report.packageVersion, getCurrentPumukiVersion());
    assert.equal(report.version.effective, getCurrentPumukiVersion());
    assert.equal(report.version.runtime, getCurrentPumukiVersion());
    assert.equal(report.version.consumerInstalled, null);
    assert.equal(report.version.lifecycleInstalled, '6.3.11');
    assert.equal(report.version.driftFromRuntime, false);
    assert.equal(report.version.driftFromLifecycleInstalled, true);
    assert.match(report.version.driftWarning ?? '', /lifecycle=6\.3\.11/i);
    assert.equal(
      report.version.alignmentCommand,
      `npm install --save-exact pumuki@${getCurrentPumukiVersion()} && npx --yes --package pumuki@${getCurrentPumukiVersion()} pumuki install`
    );
    assert.equal(report.version.pathExecutionHazard, false);
    assert.equal(report.version.pathExecutionWarning, null);
    assert.equal(report.version.pathExecutionWorkaroundCommand, null);
    assert.equal(report.lifecycleState.installed, 'true');
    assert.equal(report.lifecycleState.version, '6.3.11');
    assert.equal(report.lifecycleState.hooks, 'pre-commit,pre-push');
    assert.equal(report.lifecycleState.installedAt, '2026-02-17T00:00:00.000Z');
    assert.equal(git.resolveRepoRootCalls.length >= 1, true);
    assert.equal(realpathSync(git.resolveRepoRootCalls[0] ?? defaultCwd), realpathSync(defaultCwd));
  });
});

test('runLifecycleDoctor expone warning y workaround cuando repoRoot contiene el separador de PATH', async () => {
  await withTempDir('pumuki:doctor-path-hazard-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);

    const git = new FakeLifecycleGitService(repoRoot, [], {
      [PUMUKI_CONFIG_KEYS.installed]: 'true',
      [PUMUKI_CONFIG_KEYS.version]: '6.3.11',
      [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit,pre-push',
    });

    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
    });

    assert.equal(report.version.pathExecutionHazard, true);
    assert.match(report.version.pathExecutionWarning ?? '', /rompe PATH/i);
    assert.equal(
      report.version.pathExecutionWorkaroundCommand,
      process.platform === 'win32'
        ? 'node .\\node_modules\\pumuki\\bin\\pumuki.js'
        : 'node ./node_modules/pumuki/bin/pumuki.js'
    );
    assert.equal(
      report.version.alignmentCommand,
      process.platform === 'win32'
        ? `npm install --save-exact pumuki@${getCurrentPumukiVersion()} && node .\\node_modules\\pumuki\\bin\\pumuki.js install`
        : `npm install --save-exact pumuki@${getCurrentPumukiVersion()} && node ./node_modules/pumuki/bin/pumuki.js install`
    );
  });
});

test('runLifecycleDoctor reporta error y warning cuando hay tracked node_modules y hooks huérfanos', async () => {
  await withTempDir('pumuki-doctor-mixed-issues-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);
    const git = new FakeLifecycleGitService(repoRoot, ['node_modules/pkg/index.js'], {
      [PUMUKI_CONFIG_KEYS.installed]: 'false',
    });

    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
    });

    assert.equal(report.issues.length, 2);
    assert.equal(report.issues[0]?.severity, 'error');
    assert.equal(report.issues[1]?.severity, 'warning');
    assert.equal(doctorHasBlockingIssues(report), true);
  });
});

test('runLifecycleDoctor --deep reporta warning no bloqueante cuando evidence está ausente', async () => {
  await withTempDir('pumuki-doctor-deep-missing-evidence-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);
    const git = new FakeLifecycleGitService(
      repoRoot,
      [],
      {
        [PUMUKI_CONFIG_KEYS.installed]: 'true',
        [PUMUKI_CONFIG_KEYS.version]: getCurrentPumukiVersion(),
        [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit,pre-push',
      },
      {
        'rev-parse --abbrev-ref --symbolic-full-name @{u}': '',
        'rev-parse --abbrev-ref HEAD': 'feature/deep-evidence',
      }
    );

    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
      deep: true,
    });

    assert.equal(report.deep?.enabled, true);
    assert.equal(report.deep?.checks.some((check) => check.id === 'evidence-source-drift'), true);
    assert.equal(report.deep?.checks.some((check) => check.id === 'evidence-source-drift' && check.status === 'warn'), true);
    assert.equal(
      report.deep?.checks.some(
        (check) =>
          check.id === 'evidence-source-drift' &&
          check.severity === 'warning' &&
          check.layer === 'operational'
      ),
      true
    );
    assert.equal(report.deep?.blocking, false);
    assert.equal(doctorHasBlockingIssues(report), false);
  });
});

test('runLifecycleDoctor --deep reporta warning no bloqueante cuando evidence está stale', async () => {
  await withTempDir('pumuki-doctor-deep-stale-evidence-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    installPumukiHooks(repoRoot);
    const branch = 'feature/deep-evidence-stale';
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      JSON.stringify(
        sampleEvidence({
          repoRoot,
          branch,
          upstream: null,
          timestamp: '2026-01-01T00:00:00.000Z',
        }),
        null,
        2
      ),
      'utf8'
    );

    const git = new FakeLifecycleGitService(
      repoRoot,
      [],
      {
        [PUMUKI_CONFIG_KEYS.installed]: 'true',
        [PUMUKI_CONFIG_KEYS.version]: getCurrentPumukiVersion(),
        [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit,pre-push',
      },
      {
        'rev-parse --abbrev-ref --symbolic-full-name @{u}': '',
        'rev-parse --abbrev-ref HEAD': branch,
      }
    );

    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
      deep: true,
    });

    const evidenceCheck = report.deep?.checks.find(
      (check) => check.id === 'evidence-source-drift'
    );

    assert.equal(evidenceCheck?.status, 'warn');
    assert.equal(evidenceCheck?.severity, 'warning');
    assert.equal(evidenceCheck?.layer, 'operational');
    assert.match(evidenceCheck?.message ?? '', /Evidence is stale/i);
    assert.equal(report.deep?.blocking, false);
    assert.equal(doctorHasBlockingIssues(report), false);
  });
});

test('runLifecycleDoctor --deep trata policy-drift por fallback default como advisory', async () => {
  await withTempDir('pumuki-doctor-deep-policy-drift-advisory-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    installPumukiHooks(repoRoot);

    writeFileSync(
      join(repoRoot, '.pumuki', 'adapter.json'),
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

    const branch = 'feature/doctor-policy-drift-advisory';
    const upstream = 'origin/feature/doctor-policy-drift-advisory';
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      JSON.stringify(
        sampleEvidence({
          repoRoot,
          branch,
          upstream,
        }),
        null,
        2
      ),
      'utf8'
    );

    const git = new FakeLifecycleGitService(
      repoRoot,
      [],
      {
        [PUMUKI_CONFIG_KEYS.installed]: 'true',
        [PUMUKI_CONFIG_KEYS.version]: getCurrentPumukiVersion(),
        [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit,pre-push',
      },
      {
        'rev-parse --abbrev-ref --symbolic-full-name @{u}': upstream,
        'rev-parse --abbrev-ref HEAD': branch,
      }
    );

    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
      deep: true,
    });

    const policyDriftCheck = report.deep?.checks.find(
      (check) => check.id === 'policy-drift'
    );

    assert.equal(policyDriftCheck?.status, 'warn');
    assert.equal(policyDriftCheck?.severity, 'warning');
    assert.equal(policyDriftCheck?.layer, 'policy-pack');
    assert.equal(policyDriftCheck?.metadata?.pre_commit_activation_source, null);
    assert.equal(policyDriftCheck?.metadata?.pre_push_activation_source, null);
    assert.equal(report.policyValidation.stages.PRE_COMMIT.activationSource, null);
    assert.equal(report.experimentalFeatures.features.analytics.activationVariable, 'PUMUKI_EXPERIMENTAL_ANALYTICS');
    assert.equal(report.experimentalFeatures.features.pre_write.activationVariable, 'PUMUKI_EXPERIMENTAL_PRE_WRITE');
    assert.equal(report.experimentalFeatures.features.heuristics.activationVariable, 'PUMUKI_EXPERIMENTAL_HEURISTICS');
    assert.equal(report.experimentalFeatures.features.learning_context.activationVariable, 'PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT');
    assert.equal(report.experimentalFeatures.features.mcp_enterprise.activationVariable, 'PUMUKI_EXPERIMENTAL_MCP_ENTERPRISE');
    assert.equal(report.experimentalFeatures.features.operational_memory.activationVariable, 'PUMUKI_EXPERIMENTAL_OPERATIONAL_MEMORY');
    assert.equal(report.experimentalFeatures.features.saas_ingestion.activationVariable, 'PUMUKI_EXPERIMENTAL_SAAS_INGESTION');
    assert.equal(report.experimentalFeatures.features.sdd.activationVariable, 'PUMUKI_EXPERIMENTAL_SDD');
    assert.match(policyDriftCheck?.message ?? '', /default advisory pack/i);
    assert.equal(report.deep?.blocking, false);
    assert.equal(doctorHasBlockingIssues(report), false);
  });
});

test('runLifecycleDoctor --deep queda en PASS cuando upstream/adapter/policy/evidence están alineados', async () => {
  await withTempDir('pumuki-doctor-deep-pass-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    installPumukiHooks(repoRoot);

    writeFileSync(
      join(repoRoot, '.pumuki', 'adapter.json'),
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

    writeFileSync(
      join(repoRoot, 'skills.policy.json'),
      JSON.stringify(
        {
          version: '1.0',
          defaultBundleEnabled: true,
          stages: {
            PRE_COMMIT: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
            PRE_PUSH: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
            CI: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
          },
          bundles: {},
        },
        null,
        2
      ),
      'utf8'
    );

    const branch = 'feature/doctor-deep-pass';
    const upstream = 'origin/feature/doctor-deep-pass';
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      JSON.stringify(
        sampleEvidence({
          repoRoot,
          branch,
          upstream,
        }),
        null,
        2
      ),
      'utf8'
    );

    const git = new FakeLifecycleGitService(
      repoRoot,
      [],
      {
        [PUMUKI_CONFIG_KEYS.installed]: 'true',
        [PUMUKI_CONFIG_KEYS.version]: getCurrentPumukiVersion(),
        [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit,pre-push',
      },
      {
        'rev-parse --abbrev-ref --symbolic-full-name @{u}': upstream,
        'rev-parse --abbrev-ref HEAD': branch,
      }
    );

    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
      deep: true,
    });

    assert.equal(report.deep?.enabled, true);
    assert.equal(
      report.policyValidation.stages.PRE_COMMIT.activationSource,
      'file:skills.policy.json'
    );
    assert.equal(
      report.policyValidation.stages.PRE_PUSH.activationSource,
      'file:skills.policy.json'
    );
    assert.equal(report.experimentalFeatures.features.analytics.mode, 'off');
    assert.equal(report.experimentalFeatures.features.pre_write.mode, 'off');
    assert.equal(report.experimentalFeatures.features.heuristics.mode, 'off');
    assert.equal(report.experimentalFeatures.features.learning_context.mode, 'off');
    assert.equal(report.experimentalFeatures.features.mcp_enterprise.mode, 'off');
    assert.equal(report.experimentalFeatures.features.operational_memory.mode, 'off');
    assert.equal(report.experimentalFeatures.features.saas_ingestion.mode, 'off');
    assert.equal(report.experimentalFeatures.features.sdd.mode, 'off');
    assert.equal(report.deep?.checks.every((check) => check.status === 'pass'), true);
    assert.equal(report.deep?.contract.overall, 'compatible');
    assert.equal(report.deep?.blocking, false);
    assert.equal(doctorHasBlockingIssues(report), false);
  });
});

test('runLifecycleDoctor --deep marca warning cuando adapter wiring usa comandos frágiles', async () => {
  await withTempDir('pumuki-doctor-deep-weak-adapter-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    installPumukiHooks(repoRoot);

    writeFileSync(
      join(repoRoot, '.pumuki', 'adapter.json'),
      JSON.stringify(
        {
          hooks: {
            pre_write: { command: 'npx --yes pumuki-pre-write' },
            pre_commit: { command: 'npx --yes pumuki-pre-commit' },
            pre_push: { command: 'npx --yes pumuki-pre-push' },
            ci: { command: 'npx --yes pumuki-ci' },
          },
          mcp: {
            enterprise: { command: 'npx --yes pumuki-mcp-enterprise-stdio' },
            evidence: { command: 'npx --yes pumuki-mcp-evidence-stdio' },
          },
        },
        null,
        2
      ),
      'utf8'
    );

    writeFileSync(
      join(repoRoot, 'skills.policy.json'),
      JSON.stringify(
        {
          version: '1.0',
          defaultBundleEnabled: true,
          stages: {
            PRE_COMMIT: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
            PRE_PUSH: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
            CI: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
          },
          bundles: {},
        },
        null,
        2
      ),
      'utf8'
    );

    const branch = 'feature/doctor-deep-weak-adapter';
    const upstream = 'origin/feature/doctor-deep-weak-adapter';
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      JSON.stringify(
        sampleEvidence({
          repoRoot,
          branch,
          upstream,
        }),
        null,
        2
      ),
      'utf8'
    );

    const git = new FakeLifecycleGitService(
      repoRoot,
      [],
      {
        [PUMUKI_CONFIG_KEYS.installed]: 'true',
        [PUMUKI_CONFIG_KEYS.version]: getCurrentPumukiVersion(),
        [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit,pre-push',
      },
      {
        'rev-parse --abbrev-ref --symbolic-full-name @{u}': upstream,
        'rev-parse --abbrev-ref HEAD': branch,
      }
    );

    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
      deep: true,
    });

    const adapterCheck = report.deep?.checks.find(
      (check) => check.id === 'adapter-wiring'
    );

    assert.equal(adapterCheck?.status, 'fail');
    assert.equal(adapterCheck?.severity, 'warning');
    assert.match(adapterCheck?.message ?? '', /fragile binary resolution/i);
    assert.equal(report.deep?.blocking, false);
  });
});

test('runLifecycleDoctor --deep marca warning cuando adapter wiring muta PATH', async () => {
  await withTempDir('pumuki-doctor-deep-path-mutation-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    installPumukiHooks(repoRoot);

    writeFileSync(
      join(repoRoot, '.pumuki', 'adapter.json'),
      JSON.stringify(
        {
          hooks: {
            pre_write: { command: 'PATH="$HOME/.nvm/bin:$PATH" npx --yes --package pumuki@latest pumuki-pre-write' },
            pre_commit: { command: 'PATH="$HOME/.nvm/bin:$PATH" npx --yes --package pumuki@latest pumuki-pre-commit' },
            pre_push: { command: 'PATH="$HOME/.nvm/bin:$PATH" npx --yes --package pumuki@latest pumuki-pre-push' },
            ci: { command: 'PATH="$HOME/.nvm/bin:$PATH" npx --yes --package pumuki@latest pumuki-ci' },
          },
          mcp: {
            enterprise: { command: 'PATH="$HOME/.nvm/bin:$PATH" npx --yes --package pumuki@latest pumuki-mcp-enterprise-stdio' },
            evidence: { command: 'PATH="$HOME/.nvm/bin:$PATH" npx --yes --package pumuki@latest pumuki-mcp-evidence-stdio' },
          },
        },
        null,
        2
      ),
      'utf8'
    );

    writeFileSync(
      join(repoRoot, 'skills.policy.json'),
      JSON.stringify(
        {
          version: '1.0',
          defaultBundleEnabled: true,
          stages: {
            PRE_COMMIT: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
            PRE_PUSH: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
            CI: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
          },
          bundles: {},
        },
        null,
        2
      ),
      'utf8'
    );

    const branch = 'feature/doctor-deep-path-mutation';
    const upstream = 'origin/feature/doctor-deep-path-mutation';
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      JSON.stringify(
        sampleEvidence({
          repoRoot,
          branch,
          upstream,
        }),
        null,
        2
      ),
      'utf8'
    );

    const git = new FakeLifecycleGitService(
      repoRoot,
      [],
      {
        [PUMUKI_CONFIG_KEYS.installed]: 'true',
        [PUMUKI_CONFIG_KEYS.version]: getCurrentPumukiVersion(),
        [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit,pre-push',
      },
      {
        'rev-parse --abbrev-ref --symbolic-full-name @{u}': upstream,
        'rev-parse --abbrev-ref HEAD': branch,
      }
    );

    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
      deep: true,
    });

    const adapterCheck = report.deep?.checks.find(
      (check) => check.id === 'adapter-wiring'
    );

    assert.equal(adapterCheck?.status, 'fail');
    assert.equal(adapterCheck?.severity, 'warning');
    assert.match(adapterCheck?.message ?? '', /path mutation/i);
  });
});

test('runLifecycleDoctor --deep marca incompatibilidad cuando OpenSpec es requerido y no está instalado', async () => {
  await withTempDir('pumuki-doctor-deep-compat-openspec-', async (repoRoot) => {
    mkdirSync(join(repoRoot, '.git', 'hooks'), { recursive: true });
    mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
    mkdirSync(join(repoRoot, 'openspec', 'changes'), { recursive: true });
    installPumukiHooks(repoRoot);

    writeFileSync(
      join(repoRoot, '.pumuki', 'adapter.json'),
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

    writeFileSync(
      join(repoRoot, 'skills.policy.json'),
      JSON.stringify(
        {
          version: '1.0',
          defaultBundleEnabled: true,
          stages: {
            PRE_COMMIT: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
            PRE_PUSH: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
            CI: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
          },
          bundles: {},
        },
        null,
        2
      ),
      'utf8'
    );

    const branch = 'feature/doctor-deep-compat';
    const upstream = 'origin/feature/doctor-deep-compat';
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      JSON.stringify(
        sampleEvidence({
          repoRoot,
          branch,
          upstream,
        }),
        null,
        2
      ),
      'utf8'
    );

    const git = new FakeLifecycleGitService(
      repoRoot,
      [],
      {
        [PUMUKI_CONFIG_KEYS.installed]: 'true',
        [PUMUKI_CONFIG_KEYS.version]: getCurrentPumukiVersion(),
        [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit,pre-push',
      },
      {
        'rev-parse --abbrev-ref --symbolic-full-name @{u}': upstream,
        'rev-parse --abbrev-ref HEAD': branch,
      }
    );

    const report = runLifecycleDoctor({
      cwd: repoRoot,
      git,
      deep: true,
    });

    const compatibilityCheck = report.deep?.checks.find(
      (check) => check.id === 'compatibility-contract'
    );

    assert.equal(report.deep?.contract.overall, 'incompatible');
    assert.equal(report.deep?.contract.openspec.required, true);
    assert.equal(report.deep?.contract.openspec.installed, false);
    assert.equal(compatibilityCheck?.status, 'fail');
    assert.equal(compatibilityCheck?.severity, 'warning');
    assert.equal(report.deep?.blocking, false);
  });
});
