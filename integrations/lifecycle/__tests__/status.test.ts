import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { PUMUKI_CONFIG_KEYS } from '../constants';
import type { ILifecycleGitService } from '../gitService';
import { buildPumukiManagedHookBlock } from '../hookBlock';
import { getCurrentPumukiVersion } from '../packageInfo';
import { readLifecycleStatus } from '../status';

class FakeLifecycleGitService implements ILifecycleGitService {
  readonly resolveCalls: string[] = [];
  readonly listTrackedCalls: string[] = [];
  readonly getConfigCalls: Array<{ cwd: string; key: string }> = [];

  constructor(
    private readonly repoRoot: string,
    private readonly trackedNodeModules: ReadonlyArray<string>,
    private readonly config: Record<string, string>
  ) {}

  runGit(): string {
    return '';
  }

  resolveRepoRoot(cwd: string): string {
    this.resolveCalls.push(cwd);
    return this.repoRoot;
  }

  statusShort(): string {
    return '';
  }

  trackedNodeModulesPaths(cwd: string): ReadonlyArray<string> {
    this.listTrackedCalls.push(cwd);
    return this.trackedNodeModules;
  }

  pathTracked(): boolean {
    return false;
  }

  applyLocalConfig(): void {}

  clearLocalConfig(): void {}

  localConfig(cwd: string, key: string): string | undefined {
    this.getConfigCalls.push({ cwd, key });
    return this.config[key];
  }
}

test('readLifecycleStatus compone estado desde git + hooks + lifecycle config', async () => {
  await withTempDir('pumuki-lifecycle-status-', async (repoRoot) => {
    const hooksDir = join(repoRoot, '.git', 'hooks');
    mkdirSync(hooksDir, { recursive: true });

    writeFileSync(
      join(hooksDir, 'pre-commit'),
      `#!/usr/bin/env sh\n\n${buildPumukiManagedHookBlock('pre-commit')}\n`,
      'utf8'
    );
    writeFileSync(join(hooksDir, 'pre-push'), '#!/usr/bin/env sh\necho "custom"\n', 'utf8');

    const git = new FakeLifecycleGitService(
      repoRoot,
      ['node_modules/.package-lock.json', 'node_modules/@scope/pkg/index.js'],
      {
        [PUMUKI_CONFIG_KEYS.installed]: 'true',
        [PUMUKI_CONFIG_KEYS.version]: '6.3.11',
        [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit,pre-push',
        [PUMUKI_CONFIG_KEYS.installedAt]: '2026-02-17T10:00:00.000Z',
      }
    );

    const status = readLifecycleStatus({
      cwd: '/tmp/ignored-cwd',
      git,
    });

    assert.equal(status.repoRoot, repoRoot);
    assert.equal(status.packageVersion, getCurrentPumukiVersion());
    assert.equal(status.version.effective, getCurrentPumukiVersion());
    assert.equal(status.version.runtime, getCurrentPumukiVersion());
    assert.equal(status.version.consumerInstalled, null);
    assert.equal(status.version.lifecycleInstalled, '6.3.11');
    assert.equal(status.version.source, 'runtime-package');
    assert.equal(status.version.driftFromRuntime, false);
    assert.equal(status.version.driftFromLifecycleInstalled, true);
    assert.match(status.version.driftWarning ?? '', /lifecycle=6\.3\.11/i);
    assert.equal(
      status.version.alignmentCommand,
      `npm install --save-exact pumuki@${getCurrentPumukiVersion()} && npx --yes --package pumuki@${getCurrentPumukiVersion()} pumuki install`
    );
    assert.equal(status.version.pathExecutionHazard, false);
    assert.equal(status.version.pathExecutionWarning, null);
    assert.equal(status.version.pathExecutionWorkaroundCommand, null);
    assert.equal(status.trackedNodeModulesCount, 2);
    assert.deepEqual(status.lifecycleState, {
      installed: 'true',
      version: '6.3.11',
      hooks: 'pre-commit,pre-push',
      installedAt: '2026-02-17T10:00:00.000Z',
      openSpecManagedArtifacts: undefined,
    });
    assert.deepEqual(status.hookStatus, {
      'pre-commit': { exists: true, managedBlockPresent: true },
      'pre-push': { exists: true, managedBlockPresent: false },
    });
    assert.equal(status.hooksDirectory, join(repoRoot, '.git', 'hooks'));
    assert.equal(status.hooksDirectoryResolution, 'default');
    assert.equal(typeof status.policyValidation.stages.PRE_COMMIT.hash, 'string');
    assert.equal(typeof status.policyValidation.stages.PRE_PUSH.hash, 'string');
    assert.equal(typeof status.policyValidation.stages.CI.hash, 'string');
    assert.equal(status.policyValidation.stages.PRE_COMMIT.activationSource ?? null, null);
    assert.equal(status.policyValidation.stages.PRE_PUSH.activationSource ?? null, null);
    assert.equal(status.policyValidation.stages.CI.activationSource ?? null, null);
    assert.equal(status.policyValidation.stages.PRE_COMMIT.validationCode, 'POLICY_AS_CODE_VALID');
    assert.equal(status.policyValidation.stages.PRE_PUSH.validationCode, 'POLICY_AS_CODE_VALID');
    assert.equal(status.policyValidation.stages.CI.validationCode, 'POLICY_AS_CODE_VALID');
    assert.equal(status.experimentalFeatures.features.pre_write.layer, 'experimental');
    assert.equal(status.experimentalFeatures.features.pre_write.mode, 'strict');
    assert.equal(status.experimentalFeatures.features.pre_write.source, 'default');
    assert.equal(status.experimentalFeatures.features.analytics.layer, 'experimental');
    assert.equal(status.experimentalFeatures.features.analytics.mode, 'off');
    assert.equal(status.experimentalFeatures.features.analytics.source, 'default');
    assert.equal(
      status.experimentalFeatures.features.analytics.activationVariable,
      'PUMUKI_EXPERIMENTAL_ANALYTICS'
    );
    assert.equal(status.experimentalFeatures.features.analytics.legacyActivationVariable, null);
    assert.equal(status.experimentalFeatures.features.heuristics.layer, 'experimental');
    assert.equal(status.experimentalFeatures.features.heuristics.mode, 'off');
    assert.equal(status.experimentalFeatures.features.heuristics.source, 'default');
    assert.equal(
      status.experimentalFeatures.features.heuristics.activationVariable,
      'PUMUKI_EXPERIMENTAL_HEURISTICS'
    );
    assert.equal(status.experimentalFeatures.features.heuristics.legacyActivationVariable, null);
    assert.equal(status.experimentalFeatures.features.mcp_enterprise.layer, 'experimental');
    assert.equal(status.experimentalFeatures.features.mcp_enterprise.mode, 'off');
    assert.equal(status.experimentalFeatures.features.mcp_enterprise.source, 'default');
    assert.equal(
      status.experimentalFeatures.features.mcp_enterprise.activationVariable,
      'PUMUKI_EXPERIMENTAL_MCP_ENTERPRISE'
    );
    assert.equal(status.experimentalFeatures.features.mcp_enterprise.legacyActivationVariable, null);
    assert.equal(status.experimentalFeatures.features.operational_memory.layer, 'experimental');
    assert.equal(status.experimentalFeatures.features.operational_memory.mode, 'off');
    assert.equal(status.experimentalFeatures.features.operational_memory.source, 'default');
    assert.equal(
      status.experimentalFeatures.features.operational_memory.activationVariable,
      'PUMUKI_EXPERIMENTAL_OPERATIONAL_MEMORY'
    );
    assert.equal(status.experimentalFeatures.features.operational_memory.legacyActivationVariable, null);
    assert.equal(status.experimentalFeatures.features.learning_context.layer, 'experimental');
    assert.equal(status.experimentalFeatures.features.learning_context.mode, 'off');
    assert.equal(status.experimentalFeatures.features.learning_context.source, 'default');
    assert.equal(
      status.experimentalFeatures.features.learning_context.activationVariable,
      'PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT'
    );
    assert.equal(status.experimentalFeatures.features.learning_context.legacyActivationVariable, null);
    assert.equal(
      status.experimentalFeatures.features.pre_write.activationVariable,
      'PUMUKI_EXPERIMENTAL_PRE_WRITE'
    );
    assert.equal(
      status.experimentalFeatures.features.pre_write.legacyActivationVariable,
      'PUMUKI_PREWRITE_ENFORCEMENT'
    );
    assert.equal(status.experimentalFeatures.features.saas_ingestion.layer, 'experimental');
    assert.equal(status.experimentalFeatures.features.saas_ingestion.mode, 'off');
    assert.equal(status.experimentalFeatures.features.saas_ingestion.source, 'default');
    assert.equal(
      status.experimentalFeatures.features.saas_ingestion.activationVariable,
      'PUMUKI_EXPERIMENTAL_SAAS_INGESTION'
    );
    assert.equal(status.experimentalFeatures.features.saas_ingestion.legacyActivationVariable, null);
    assert.equal(status.experimentalFeatures.features.sdd.layer, 'experimental');
    assert.equal(status.experimentalFeatures.features.sdd.mode, 'off');
    assert.equal(status.experimentalFeatures.features.sdd.source, 'default');
    assert.equal(
      status.experimentalFeatures.features.sdd.activationVariable,
      'PUMUKI_EXPERIMENTAL_SDD'
    );
    assert.equal(status.experimentalFeatures.features.sdd.legacyActivationVariable, null);
    assert.equal(status.governanceObservation.schema_version, '1');
    assert.equal(status.governanceNextAction.stage, 'PRE_WRITE');
    assert.equal(typeof status.governanceNextAction.reason_code, 'string');
    assert.equal(status.governanceObservation.evidence.readable, 'missing');
    assert.equal(status.governanceObservation.git.current_branch, null);
    assert.equal(status.governanceObservation.contract_surface.agents_md, false);
    assert.equal(
      status.governanceObservation.attention_codes.includes('POLICY_PRE_WRITE_NOT_STRICT'),
      true
    );

    assert.deepEqual(git.resolveCalls, ['/tmp/ignored-cwd']);
    assert.deepEqual(git.listTrackedCalls, [repoRoot]);
    assert.deepEqual(
      git.getConfigCalls.map((call) => call.key),
      [
        PUMUKI_CONFIG_KEYS.installed,
        PUMUKI_CONFIG_KEYS.version,
        PUMUKI_CONFIG_KEYS.hooks,
        PUMUKI_CONFIG_KEYS.installedAt,
        PUMUKI_CONFIG_KEYS.openSpecManagedArtifacts,
      ]
    );
    assert.ok(git.getConfigCalls.every((call) => call.cwd === repoRoot));
  });
});

test('readLifecycleStatus expone warning y workaround cuando repoRoot contiene el separador de PATH', async () => {
  await withTempDir('pumuki:status-path-hazard-', async (repoRoot) => {
    const hooksDir = join(repoRoot, '.git', 'hooks');
    mkdirSync(hooksDir, { recursive: true });

    const git = new FakeLifecycleGitService(
      repoRoot,
      [],
      {
        [PUMUKI_CONFIG_KEYS.installed]: 'true',
        [PUMUKI_CONFIG_KEYS.version]: '6.3.11',
        [PUMUKI_CONFIG_KEYS.hooks]: 'pre-commit,pre-push',
      }
    );

    const status = readLifecycleStatus({
      cwd: repoRoot,
      git,
    });

    assert.equal(status.version.pathExecutionHazard, true);
    assert.match(status.version.pathExecutionWarning ?? '', /rompe PATH/i);
    assert.equal(
      status.version.pathExecutionWorkaroundCommand,
      process.platform === 'win32'
        ? 'node .\\node_modules\\pumuki\\bin\\pumuki.js'
        : 'node ./node_modules/pumuki/bin/pumuki.js'
    );
    assert.equal(
      status.version.alignmentCommand,
      process.platform === 'win32'
        ? `npm install --save-exact pumuki@${getCurrentPumukiVersion()} && node .\\node_modules\\pumuki\\bin\\pumuki.js install`
        : `npm install --save-exact pumuki@${getCurrentPumukiVersion()} && node ./node_modules/pumuki/bin/pumuki.js install`
    );
  });
});

test('readLifecycleStatus usa process.cwd cuando no se pasa cwd explícito', async () => {
  await withTempDir('pumuki-lifecycle-status-default-cwd-', async (repoRoot) => {
    const git = new FakeLifecycleGitService(repoRoot, [], {});

    const status = readLifecycleStatus({ git });

    assert.equal(status.repoRoot, repoRoot);
    assert.equal(status.version.effective, getCurrentPumukiVersion());
    assert.deepEqual(git.resolveCalls, [process.cwd()]);
    assert.deepEqual(git.listTrackedCalls, [repoRoot]);
    assert.equal(status.trackedNodeModulesCount, 0);
    assert.equal(status.hooksDirectory, join(repoRoot, '.git', 'hooks'));
    assert.equal(status.hooksDirectoryResolution, 'default');
    assert.equal(status.experimentalFeatures.features.analytics.mode, 'off');
    assert.equal(status.experimentalFeatures.features.operational_memory.mode, 'off');
    assert.equal(status.experimentalFeatures.features.pre_write.mode, 'strict');
    assert.equal(status.experimentalFeatures.features.saas_ingestion.mode, 'off');
    assert.equal(status.experimentalFeatures.features.heuristics.mode, 'off');
    assert.equal(status.experimentalFeatures.features.learning_context.mode, 'off');
    assert.equal(status.experimentalFeatures.features.mcp_enterprise.mode, 'off');
    assert.equal(status.experimentalFeatures.features.sdd.mode, 'off');
    assert.equal(status.governanceNextAction.stage, 'PRE_WRITE');
    assert.equal(status.governanceObservation.governance_effective, 'attention');
  });
});

test('readLifecycleStatus incorpora tracking canónico y expone conflicto documental en governanceObservation', async () => {
  await withTempDir('pumuki-lifecycle-status-tracking-', async (repoRoot) => {
    mkdirSync(join(repoRoot, 'docs'), { recursive: true });
    writeFileSync(
      join(repoRoot, 'AGENTS.md'),
      [
        '# AGENTS',
        '',
        '- La unica fuente viva del tracking interno es `PUMUKI-RESET-MASTER-PLAN.md`.',
      ].join('\n'),
      'utf8'
    );
    writeFileSync(
      join(repoRoot, 'docs', 'README.md'),
      [
        '# Docs',
        '',
        '- Fuente viva del tracking interno: `docs/tracking/plan-activo-de-trabajo.md`',
      ].join('\n'),
      'utf8'
    );
    writeFileSync(join(repoRoot, 'PUMUKI-RESET-MASTER-PLAN.md'), '- Estado: 🚧\n', 'utf8');

    const git = new FakeLifecycleGitService(repoRoot, [], {});
    const status = readLifecycleStatus({
      cwd: repoRoot,
      git,
    });

    assert.equal(status.governanceObservation.tracking.enforced, true);
    assert.equal(status.governanceObservation.tracking.canonical_path, 'PUMUKI-RESET-MASTER-PLAN.md');
    assert.equal(status.governanceObservation.tracking.conflict, true);
    assert.equal(
      status.governanceObservation.attention_codes.includes('TRACKING_CANONICAL_SOURCE_CONFLICT'),
      true
    );
    assert.equal(
      status.governanceObservation.agent_bootstrap_hints.some((hint) =>
        hint.includes('Tracking canónico en conflicto')
      ),
      true
    );
  });
});

test('readLifecycleStatus no marca tracking inválido cuando la board canónica usa la 🚧 en la primera columna', async () => {
  await withTempDir('pumuki-lifecycle-status-ruralgo-board-', async (repoRoot) => {
    mkdirSync(join(repoRoot, 'docs'), { recursive: true });
    writeFileSync(
      join(repoRoot, 'docs', 'README.md'),
      [
        '# Docs',
        '',
        '- Fuente viva del tracking interno: `docs/RURALGO_SEGUIMIENTO.md`',
      ].join('\n'),
      'utf8'
    );
    writeFileSync(
      join(repoRoot, 'docs', 'RURALGO_SEGUIMIENTO.md'),
      [
        '| Estado | Task | Resumen |',
        '|--------|------|---------|',
        '| 🚧 | RGO-1900-01 | Slice activa |',
      ].join('\n'),
      'utf8'
    );

    const git = new FakeLifecycleGitService(repoRoot, [], {});
    const status = readLifecycleStatus({
      cwd: repoRoot,
      git,
    });

    assert.equal(status.governanceObservation.tracking.canonical_path, 'docs/RURALGO_SEGUIMIENTO.md');
    assert.equal(status.governanceObservation.tracking.in_progress_count, 1);
    assert.equal(status.governanceObservation.tracking.single_in_progress_valid, true);
    assert.equal(
      status.governanceObservation.attention_codes.includes('TRACKING_CANONICAL_IN_PROGRESS_INVALID'),
      false
    );
  });
});

test('readLifecycleStatus expone el tracking canónico del repo en la raíz del payload', async () => {
  await withTempDir('pumuki-lifecycle-status-top-level-tracking-', async (repoRoot) => {
    mkdirSync(join(repoRoot, 'docs'), { recursive: true });
    mkdirSync(join(repoRoot, 'docs', 'validation', 'refactor'), { recursive: true });
    writeFileSync(
      join(repoRoot, 'AGENTS.md'),
      '# fixture\n- la única fuente viva del tracking interno es `PUMUKI-RESET-MASTER-PLAN.md`\n',
      'utf8'
    );
    writeFileSync(
      join(repoRoot, 'PUMUKI-RESET-MASTER-PLAN.md'),
      '# plan\n\n[🚧] - PUMUKI-INC-078 (RuralGo) corregir tracking canónico\n',
      'utf8'
    );
    writeFileSync(
      join(repoRoot, 'docs', 'validation', 'refactor', 'last-run.json'),
      JSON.stringify({
        status: 'IN_PROGRESS',
        plan_file: 'PUMUKI-RESET-MASTER-PLAN.md',
        next: 'PUMUKI-INC-078',
      }),
      'utf8'
    );

    const git = new FakeLifecycleGitService(repoRoot, [], {});
    const status = readLifecycleStatus({
      cwd: repoRoot,
      git,
    });

    assert.equal(status.tracking.enforced, true);
    assert.equal(status.tracking.canonical_path, 'PUMUKI-RESET-MASTER-PLAN.md');
    assert.equal(status.tracking.canonical_present, true);
    assert.equal(status.tracking.source_file, 'AGENTS.md');
    assert.equal(status.tracking.in_progress_count, 1);
    assert.equal(status.tracking.single_in_progress_valid, true);
    assert.equal(status.tracking.conflict, false);
    assert.equal(status.tracking.active_task_id, 'PUMUKI-INC-078');
    assert.equal(status.tracking.last_run_status, 'IN_PROGRESS');
  });
});

test('readLifecycleStatus devuelve lifecycle vacío y hooks ausentes cuando no hay instalación', async () => {
  await withTempDir('pumuki-lifecycle-status-empty-', async (repoRoot) => {
    const git = new FakeLifecycleGitService(repoRoot, [], {});

    const status = readLifecycleStatus({
      cwd: repoRoot,
      git,
    });

    assert.equal(status.version.effective, getCurrentPumukiVersion());
    assert.equal(status.version.consumerInstalled, null);
    assert.equal(status.version.lifecycleInstalled, null);
    assert.equal(status.version.driftWarning, null);
    assert.equal(status.version.alignmentCommand, null);
    assert.deepEqual(status.lifecycleState, {
      installed: undefined,
      version: undefined,
      hooks: undefined,
      installedAt: undefined,
      openSpecManagedArtifacts: undefined,
    });
    assert.deepEqual(status.hookStatus, {
      'pre-commit': { exists: false, managedBlockPresent: false },
      'pre-push': { exists: false, managedBlockPresent: false },
    });
    assert.equal(status.hooksDirectory, join(repoRoot, '.git', 'hooks'));
    assert.equal(status.hooksDirectoryResolution, 'default');
    assert.equal(status.experimentalFeatures.features.analytics.mode, 'off');
    assert.equal(status.experimentalFeatures.features.operational_memory.mode, 'off');
    assert.equal(status.experimentalFeatures.features.pre_write.mode, 'strict');
    assert.equal(status.experimentalFeatures.features.saas_ingestion.mode, 'off');
    assert.equal(status.experimentalFeatures.features.heuristics.mode, 'off');
    assert.equal(status.experimentalFeatures.features.learning_context.mode, 'off');
    assert.equal(status.experimentalFeatures.features.mcp_enterprise.mode, 'off');
    assert.equal(status.experimentalFeatures.features.sdd.mode, 'off');
    assert.equal(status.governanceNextAction.stage, 'PRE_WRITE');
    assert.equal(status.governanceObservation.evidence.readable, 'missing');
    assert.equal(status.governanceObservation.governance_effective, 'attention');
  });
});
