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
        package_version: '6.3.26',
        lifecycle_version: '6.3.26',
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

    assert.equal(report.repoRoot, repoRoot);
    assert.equal(typeof report.policyValidation.stages.PRE_COMMIT.hash, 'string');
    assert.equal(typeof report.policyValidation.stages.PRE_PUSH.hash, 'string');
    assert.equal(typeof report.policyValidation.stages.CI.hash, 'string');
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
    assert.equal(report.lifecycleState.installed, 'true');
    assert.equal(report.lifecycleState.version, '6.3.11');
    assert.equal(report.lifecycleState.hooks, 'pre-commit,pre-push');
    assert.equal(report.lifecycleState.installedAt, '2026-02-17T00:00:00.000Z');
    assert.equal(git.resolveRepoRootCalls.length >= 1, true);
    assert.equal(realpathSync(git.resolveRepoRootCalls[0] ?? defaultCwd), realpathSync(defaultCwd));
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

test('runLifecycleDoctor --deep reporta fallo bloqueante cuando evidence está ausente', async () => {
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
    assert.equal(report.deep?.checks.some((check) => check.id === 'evidence-source-drift' && check.status === 'fail'), true);
    assert.equal(report.deep?.blocking, true);
    assert.equal(doctorHasBlockingIssues(report), true);
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
            pre_write: { command: 'npx --yes pumuki-pre-write' },
            pre_commit: { command: './node_modules/.bin/pumuki-pre-commit' },
            pre_push: { command: './node_modules/.bin/pumuki-pre-push' },
            ci: { command: 'npx --yes pumuki-ci' },
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
    assert.equal(report.deep?.checks.every((check) => check.status === 'pass'), true);
    assert.equal(report.deep?.contract.overall, 'compatible');
    assert.equal(report.deep?.blocking, false);
    assert.equal(doctorHasBlockingIssues(report), false);
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
            pre_write: { command: 'npx --yes pumuki-pre-write' },
            pre_commit: { command: './node_modules/.bin/pumuki-pre-commit' },
            pre_push: { command: './node_modules/.bin/pumuki-pre-push' },
            ci: { command: 'npx --yes pumuki-ci' },
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
