import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { readEvidenceResult } from '../evidence/readEvidence';
import { resolvePolicyForStage } from '../gate/stagePolicies';
import { getPumukiHooksStatus, resolvePumukiHooksDirectory } from './hookManager';
import { LifecycleGitService, type ILifecycleGitService } from './gitService';
import { buildLifecycleVersionReport, getCurrentPumukiVersion } from './packageInfo';
import {
  readLifecyclePolicyValidationSnapshot,
  type LifecyclePolicyValidationSnapshot,
} from './policyValidationSnapshot';
import { readLifecycleState, type LifecycleState } from './state';
import {
  detectOpenSpecInstallation,
  evaluateOpenSpecCompatibility,
  isOpenSpecProjectInitialized,
} from '../sdd/openSpecCli';

export type DoctorIssueSeverity = 'warning' | 'error';

export type DoctorIssue = {
  severity: DoctorIssueSeverity;
  message: string;
};

export type DoctorDeepCheckId =
  | 'upstream-readiness'
  | 'adapter-wiring'
  | 'policy-drift'
  | 'evidence-source-drift'
  | 'compatibility-contract';

export type DoctorDeepCheck = {
  id: DoctorDeepCheckId;
  status: 'pass' | 'fail';
  severity: 'info' | DoctorIssueSeverity;
  message: string;
  remediation?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type DoctorDeepReport = {
  enabled: true;
  checks: ReadonlyArray<DoctorDeepCheck>;
  blocking: boolean;
  contract: DoctorCompatibilityContract;
};

export type DoctorCompatibilityContract = {
  overall: 'compatible' | 'incompatible';
  pumuki: {
    installed: boolean;
    version: string;
  };
  openspec: {
    required: boolean;
    installed: boolean;
    version: string | null;
    minimumVersion: string;
    compatible: boolean;
  };
  hooks: {
    managed: boolean;
    managedCount: number;
    totalCount: number;
  };
  adapter: {
    valid: boolean;
  };
};

export type LifecycleDoctorReport = {
  repoRoot: string;
  packageVersion: string;
  version: ReturnType<typeof buildLifecycleVersionReport>;
  lifecycleState: LifecycleState;
  trackedNodeModulesPaths: ReadonlyArray<string>;
  hookStatus: ReturnType<typeof getPumukiHooksStatus>;
  hooksDirectory: string;
  hooksDirectoryResolution: 'git-rev-parse' | 'git-config' | 'default';
  policyValidation: LifecyclePolicyValidationSnapshot;
  issues: ReadonlyArray<DoctorIssue>;
  deep?: DoctorDeepReport;
};

const buildDoctorIssues = (params: {
  trackedNodeModulesPaths: ReadonlyArray<string>;
  hookStatus: ReturnType<typeof getPumukiHooksStatus>;
  hooksDirectory: string;
  lifecycleState: LifecycleState;
}): ReadonlyArray<DoctorIssue> => {
  const issues: DoctorIssue[] = [];

  if (params.trackedNodeModulesPaths.length > 0) {
    issues.push({
      severity: 'error',
      message:
        'Tracked files under node_modules were detected. This baseline is unsafe for enterprise install/uninstall lifecycle.',
    });
  }

  if (
    params.lifecycleState.installed === 'true' &&
    !Object.values(params.hookStatus).every((entry) => entry.managedBlockPresent)
  ) {
    const totalHooks = Object.keys(params.hookStatus).length;
    const managedHooks = Object.values(params.hookStatus).filter(
      (entry) => entry.managedBlockPresent
    ).length;
    issues.push({
      severity: 'warning',
      message:
        `Lifecycle state says installed=true but managed hook blocks are incomplete (${managedHooks}/${totalHooks}). ` +
        `Effective hooks path: ${params.hooksDirectory}. ` +
        'If you use versioned hooks via core.hooksPath, ensure those hooks include the PUMUKI MANAGED block or rerun "pumuki install".',
    });
  }

  if (
    params.lifecycleState.installed !== 'true' &&
    Object.values(params.hookStatus).some((entry) => entry.managedBlockPresent)
  ) {
    issues.push({
      severity: 'warning',
      message:
        'Managed hook blocks exist but lifecycle state is not marked as installed.',
    });
  }

  return issues;
};

const DEEP_EVIDENCE_MAX_AGE_SECONDS = 1800;

const toCanonicalPath = (value: string): string => {
  try {
    return realpathSync(value).replace(/\\/g, '/').toLowerCase();
  } catch {
    return resolve(value).replace(/\\/g, '/').toLowerCase();
  }
};

const runGitSafely = (
  git: ILifecycleGitService,
  cwd: string,
  args: ReadonlyArray<string>
): string | undefined => {
  try {
    const output = git.runGit(args, cwd).trim();
    return output.length > 0 ? output : undefined;
  } catch {
    return undefined;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readNestedString = (
  source: Record<string, unknown>,
  path: ReadonlyArray<string>
): string | undefined => {
  let cursor: unknown = source;
  for (const segment of path) {
    if (!isRecord(cursor)) {
      return undefined;
    }
    cursor = cursor[segment];
  }
  return typeof cursor === 'string' && cursor.trim().length > 0 ? cursor : undefined;
};

const hasRobustPumukiCommandResolution = (command: string): boolean => {
  const normalized = command.trim();
  if (normalized.length === 0) {
    return false;
  }

  if (/node_modules[\\/]\.bin[\\/]pumuki/i.test(normalized)) {
    return true;
  }

  if (
    /node\s+.*node_modules[\\/]pumuki[\\/]bin[\\/]pumuki(?:-[a-z0-9-]+)?\.js/i.test(
      normalized
    )
  ) {
    return true;
  }

  if (/--package\s+pumuki(?:@[^\s]+)?/i.test(normalized)) {
    return true;
  }

  return false;
};

const mutatesPathForCommandExecution = (command: string): boolean =>
  /\bPATH\s*=\s*[^\n]*\$PATH/i.test(command);

const buildDeepCheck = (
  check: Omit<DoctorDeepCheck, 'status' | 'severity'> & {
    status: DoctorDeepCheck['status'];
    severity: DoctorDeepCheck['severity'];
  }
): DoctorDeepCheck => check;

const evaluateUpstreamReadinessCheck = (params: {
  git: ILifecycleGitService;
  repoRoot: string;
}): DoctorDeepCheck => {
  const branch =
    runGitSafely(params.git, params.repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD']) ?? 'unknown';
  const upstream = runGitSafely(params.git, params.repoRoot, [
    'rev-parse',
    '--abbrev-ref',
    '--symbolic-full-name',
    '@{u}',
  ]);
  if (!upstream) {
    return buildDeepCheck({
      id: 'upstream-readiness',
      status: 'fail',
      severity: 'warning',
      message: `Branch "${branch}" has no upstream tracking.`,
      remediation: `Run "git push --set-upstream origin ${branch}" before relying on PRE_PUSH diagnostics.`,
      metadata: {
        branch,
        upstream: null,
      },
    });
  }
  return buildDeepCheck({
    id: 'upstream-readiness',
    status: 'pass',
    severity: 'info',
    message: `Upstream tracking is configured (${upstream}).`,
    metadata: {
      branch,
      upstream,
    },
  });
};

const evaluateAdapterWiringCheck = (repoRoot: string): DoctorDeepCheck => {
  const adapterPath = join(repoRoot, '.pumuki', 'adapter.json');
  if (!existsSync(adapterPath)) {
    return buildDeepCheck({
      id: 'adapter-wiring',
      status: 'fail',
      severity: 'warning',
      message: 'Adapter wiring file .pumuki/adapter.json is missing.',
      remediation: 'Run "pumuki adapter install --agent=codex" to scaffold adapter hooks and MCP wiring.',
      metadata: {
        path: adapterPath,
      },
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(adapterPath, 'utf8')) as unknown;
  } catch {
    return buildDeepCheck({
      id: 'adapter-wiring',
      status: 'fail',
      severity: 'error',
      message: 'Adapter wiring file is not valid JSON.',
      remediation: 'Re-run "pumuki adapter install --agent=codex" to repair adapter wiring contract.',
      metadata: {
        path: adapterPath,
      },
    });
  }

  if (!isRecord(parsed)) {
    return buildDeepCheck({
      id: 'adapter-wiring',
      status: 'fail',
      severity: 'error',
      message: 'Adapter wiring payload must be an object.',
      remediation: 'Re-run "pumuki adapter install --agent=codex" to restore adapter schema.',
      metadata: {
        path: adapterPath,
      },
    });
  }

  const requiredCommandPaths: ReadonlyArray<ReadonlyArray<string>> = [
    ['hooks', 'pre_write', 'command'],
    ['hooks', 'pre_commit', 'command'],
    ['hooks', 'pre_push', 'command'],
    ['hooks', 'ci', 'command'],
    ['mcp', 'enterprise', 'command'],
    ['mcp', 'evidence', 'command'],
  ];
  const missingPaths = requiredCommandPaths
    .filter((path) => !readNestedString(parsed, path))
    .map((path) => path.join('.'));

  if (missingPaths.length > 0) {
    return buildDeepCheck({
      id: 'adapter-wiring',
      status: 'fail',
      severity: 'error',
      message: `Adapter wiring is incomplete (missing: ${missingPaths.join(', ')}).`,
      remediation: 'Re-run "pumuki adapter install --agent=codex" and keep generated commands unchanged.',
      metadata: {
        path: adapterPath,
        missing_count: missingPaths.length,
      },
    });
  }

  const weakResolutionPaths = requiredCommandPaths
    .map((path) => {
      const command = readNestedString(parsed, path);
      return {
        path: path.join('.'),
        command,
      };
    })
    .filter(
      (entry) =>
        entry.command &&
        (!hasRobustPumukiCommandResolution(entry.command) ||
          mutatesPathForCommandExecution(entry.command))
    );

  if (weakResolutionPaths.length > 0) {
    const pathMutationCount = weakResolutionPaths.filter(
      (entry) => entry.command && mutatesPathForCommandExecution(entry.command)
    ).length;
    return buildDeepCheck({
      id: 'adapter-wiring',
      status: 'fail',
      severity: 'warning',
      message: `Adapter wiring commands are present but use fragile binary resolution or PATH mutation (${weakResolutionPaths.map((entry) => entry.path).join(', ')}).`,
      remediation:
        'Re-run "pumuki adapter install --agent=codex" to restore robust local/bin-or-package command resolution.',
      metadata: {
        path: adapterPath,
        weak_resolution_count: weakResolutionPaths.length,
        path_mutation_count: pathMutationCount,
      },
    });
  }

  return buildDeepCheck({
    id: 'adapter-wiring',
    status: 'pass',
    severity: 'info',
    message: 'Adapter wiring contract is valid.',
    metadata: {
      path: adapterPath,
    },
  });
};

const evaluatePolicyDriftCheck = (repoRoot: string): DoctorDeepCheck => {
  const preCommitFirst = resolvePolicyForStage('PRE_COMMIT', repoRoot);
  const preCommitSecond = resolvePolicyForStage('PRE_COMMIT', repoRoot);
  const prePushFirst = resolvePolicyForStage('PRE_PUSH', repoRoot);
  const prePushSecond = resolvePolicyForStage('PRE_PUSH', repoRoot);

  const preCommitStable =
    preCommitFirst.trace.hash === preCommitSecond.trace.hash &&
    preCommitFirst.policy.blockOnOrAbove === preCommitSecond.policy.blockOnOrAbove &&
    preCommitFirst.policy.warnOnOrAbove === preCommitSecond.policy.warnOnOrAbove;
  const prePushStable =
    prePushFirst.trace.hash === prePushSecond.trace.hash &&
    prePushFirst.policy.blockOnOrAbove === prePushSecond.policy.blockOnOrAbove &&
    prePushFirst.policy.warnOnOrAbove === prePushSecond.policy.warnOnOrAbove;

  if (!preCommitStable || !prePushStable) {
    return buildDeepCheck({
      id: 'policy-drift',
      status: 'fail',
      severity: 'error',
      message: 'Policy resolution is non-deterministic across repeated reads.',
      remediation: 'Lock policy configuration and rerun doctor --deep after removing nondeterministic overrides.',
      metadata: {
        pre_commit_hash: preCommitFirst.trace.hash,
        pre_push_hash: prePushFirst.trace.hash,
      },
    });
  }

  const usesDefault =
    preCommitFirst.trace.source === 'default' || prePushFirst.trace.source === 'default';
  if (usesDefault) {
    return buildDeepCheck({
      id: 'policy-drift',
      status: 'fail',
      severity: 'warning',
      message: 'Policy is running on default fallback without explicit skills policy or hard-mode.',
      remediation: 'Define skills.policy.json or .pumuki/hard-mode.json to avoid policy drift in enterprise environments.',
      metadata: {
        pre_commit_source: preCommitFirst.trace.source,
        pre_push_source: prePushFirst.trace.source,
      },
    });
  }

  return buildDeepCheck({
    id: 'policy-drift',
    status: 'pass',
    severity: 'info',
    message: 'Policy resolution is deterministic and explicitly configured.',
    metadata: {
      pre_commit_source: preCommitFirst.trace.source,
      pre_push_source: prePushFirst.trace.source,
    },
  });
};

const evaluateEvidenceSourceDriftCheck = (params: {
  git: ILifecycleGitService;
  repoRoot: string;
}): DoctorDeepCheck => {
  const evidenceResult = readEvidenceResult(params.repoRoot);
  if (evidenceResult.kind === 'missing') {
    return buildDeepCheck({
      id: 'evidence-source-drift',
      status: 'fail',
      severity: 'error',
      message: '.ai_evidence.json is missing.',
      remediation: 'Regenerate evidence with a full audit before continuing with enterprise checks.',
      metadata: {
        path: evidenceResult.source_descriptor.path,
      },
    });
  }

  if (evidenceResult.kind === 'invalid') {
    return buildDeepCheck({
      id: 'evidence-source-drift',
      status: 'fail',
      severity: 'error',
      message: `.ai_evidence.json is invalid${evidenceResult.version ? ` (version=${evidenceResult.version})` : ''}.`,
      remediation: 'Repair evidence schema and regenerate evidence from this repository and branch.',
      metadata: {
        path: evidenceResult.source_descriptor.path,
      },
    });
  }

  const violations: string[] = [];
  let severity: DoctorIssueSeverity = 'warning';
  const toError = (): void => {
    severity = 'error';
  };

  const nowMs = Date.now();
  const timestampMs = Date.parse(evidenceResult.evidence.timestamp);
  const ageSeconds = Number.isFinite(timestampMs)
    ? Math.max(0, Math.floor((nowMs - timestampMs) / 1000))
    : null;

  if (!Number.isFinite(timestampMs)) {
    toError();
    violations.push('Evidence timestamp is invalid.');
  } else if (timestampMs > nowMs) {
    toError();
    violations.push('Evidence timestamp is in the future.');
  } else if (ageSeconds !== null && ageSeconds > DEEP_EVIDENCE_MAX_AGE_SECONDS) {
    toError();
    violations.push(
      `Evidence is stale (${ageSeconds}s > ${DEEP_EVIDENCE_MAX_AGE_SECONDS}s).`
    );
  }

  const currentBranch = runGitSafely(params.git, params.repoRoot, [
    'rev-parse',
    '--abbrev-ref',
    'HEAD',
  ]);
  const currentUpstream = runGitSafely(params.git, params.repoRoot, [
    'rev-parse',
    '--abbrev-ref',
    '--symbolic-full-name',
    '@{u}',
  ]);

  const expectedEvidencePath = resolve(params.repoRoot, '.ai_evidence.json');
  if (
    toCanonicalPath(evidenceResult.source_descriptor.path) !==
    toCanonicalPath(expectedEvidencePath)
  ) {
    toError();
    violations.push(
      `Evidence source path mismatch (${evidenceResult.source_descriptor.path} != ${expectedEvidencePath}).`
    );
  }

  if (
    evidenceResult.source_descriptor.digest &&
    !/^sha256:[0-9a-f]{64}$/i.test(evidenceResult.source_descriptor.digest)
  ) {
    toError();
    violations.push('Evidence digest format is invalid.');
  }

  const evidenceRepoRoot = evidenceResult.evidence.repo_state?.repo_root;
  if (
    typeof evidenceRepoRoot === 'string' &&
    evidenceRepoRoot.trim().length > 0 &&
    toCanonicalPath(evidenceRepoRoot) !== toCanonicalPath(params.repoRoot)
  ) {
    toError();
    violations.push(`Evidence repo_root mismatch (${evidenceRepoRoot} != ${params.repoRoot}).`);
  }

  const evidenceBranch = evidenceResult.evidence.repo_state?.git?.branch;
  if (
    typeof evidenceBranch === 'string' &&
    evidenceBranch.trim().length > 0 &&
    typeof currentBranch === 'string' &&
    currentBranch.trim().length > 0 &&
    evidenceBranch !== currentBranch
  ) {
    toError();
    violations.push(`Evidence branch mismatch (${evidenceBranch} != ${currentBranch}).`);
  }

  const evidenceUpstream = evidenceResult.evidence.repo_state?.git?.upstream;
  if (
    typeof evidenceUpstream === 'string' &&
    evidenceUpstream.trim().length > 0 &&
    typeof currentUpstream === 'string' &&
    currentUpstream.trim().length > 0 &&
    evidenceUpstream !== currentUpstream
  ) {
    violations.push(`Evidence upstream mismatch (${evidenceUpstream} != ${currentUpstream}).`);
  }

  if (violations.length > 0) {
    return buildDeepCheck({
      id: 'evidence-source-drift',
      status: 'fail',
      severity,
      message: violations.join(' '),
      remediation: 'Regenerate evidence in the current repository and branch before running enterprise gates.',
      metadata: {
        source_path: evidenceResult.source_descriptor.path,
        evidence_age_seconds: ageSeconds,
        current_branch: currentBranch ?? null,
        current_upstream: currentUpstream ?? null,
      },
    });
  }

  return buildDeepCheck({
    id: 'evidence-source-drift',
    status: 'pass',
    severity: 'info',
    message: 'Evidence source metadata is aligned with repository state.',
    metadata: {
      source_path: evidenceResult.source_descriptor.path,
      evidence_age_seconds: ageSeconds,
      current_branch: currentBranch ?? null,
      current_upstream: currentUpstream ?? null,
    },
  });
};

const buildCompatibilityContract = (params: {
  repoRoot: string;
  lifecycleState: LifecycleState;
  hookStatus: ReturnType<typeof getPumukiHooksStatus>;
  adapterCheck: DoctorDeepCheck;
}): DoctorCompatibilityContract => {
  const hooks = Object.values(params.hookStatus);
  const managedCount = hooks.filter((entry) => entry.managedBlockPresent).length;
  const totalCount = hooks.length;
  const hooksManaged = totalCount > 0 && managedCount === totalCount;

  const openSpecRequired = isOpenSpecProjectInitialized(params.repoRoot);
  const openSpecInstalled = detectOpenSpecInstallation(params.repoRoot);
  const openSpecCompatibility = evaluateOpenSpecCompatibility(openSpecInstalled);
  const openSpecCompatible = openSpecRequired ? openSpecCompatibility.compatible : true;

  const adapterValid = params.adapterCheck.status === 'pass';
  const pumukiInstalled = params.lifecycleState.installed === 'true';
  const overallCompatible =
    pumukiInstalled && hooksManaged && adapterValid && openSpecCompatible;

  return {
    overall: overallCompatible ? 'compatible' : 'incompatible',
    pumuki: {
      installed: pumukiInstalled,
      version: getCurrentPumukiVersion({ repoRoot: params.repoRoot }),
    },
    openspec: {
      required: openSpecRequired,
      installed: openSpecInstalled.installed,
      version: openSpecInstalled.version ?? null,
      minimumVersion: openSpecCompatibility.minimumVersion,
      compatible: openSpecCompatible,
    },
    hooks: {
      managed: hooksManaged,
      managedCount,
      totalCount,
    },
    adapter: {
      valid: adapterValid,
    },
  };
};

const evaluateCompatibilityContractCheck = (
  contract: DoctorCompatibilityContract
): DoctorDeepCheck => {
  if (contract.overall === 'compatible') {
    return buildDeepCheck({
      id: 'compatibility-contract',
      status: 'pass',
      severity: 'info',
      message: 'Compatibility contract is satisfied for pumuki/openspec/hooks/adapter.',
      metadata: {
        pumuki_installed: contract.pumuki.installed,
        openspec_required: contract.openspec.required,
        openspec_compatible: contract.openspec.compatible,
        hooks_managed: contract.hooks.managed,
        adapter_valid: contract.adapter.valid,
      },
    });
  }

  const remediation: string[] = [];
  if (!contract.pumuki.installed) {
    remediation.push('Run "pumuki install" to restore lifecycle state.');
  }
  if (!contract.hooks.managed) {
    remediation.push('Regenerate managed hooks with "pumuki install".');
  }
  if (!contract.adapter.valid) {
    remediation.push('Repair adapter wiring with "pumuki adapter install --agent=codex".');
  }
  if (contract.openspec.required && !contract.openspec.compatible) {
    remediation.push(
      `Install or upgrade OpenSpec to >= ${contract.openspec.minimumVersion} before enterprise validation.`
    );
  }

  return buildDeepCheck({
    id: 'compatibility-contract',
    status: 'fail',
    severity: 'warning',
    message: 'Compatibility contract is not satisfied for one or more required components.',
    remediation: remediation.join(' '),
    metadata: {
      pumuki_installed: contract.pumuki.installed,
      openspec_required: contract.openspec.required,
      openspec_compatible: contract.openspec.compatible,
      hooks_managed: contract.hooks.managed,
      adapter_valid: contract.adapter.valid,
    },
  });
};

const buildDoctorDeepReport = (params: {
  git: ILifecycleGitService;
  repoRoot: string;
  lifecycleState: LifecycleState;
  hookStatus: ReturnType<typeof getPumukiHooksStatus>;
}): DoctorDeepReport => {
  const adapterCheck = evaluateAdapterWiringCheck(params.repoRoot);
  const compatibilityContract = buildCompatibilityContract({
    repoRoot: params.repoRoot,
    lifecycleState: params.lifecycleState,
    hookStatus: params.hookStatus,
    adapterCheck,
  });

  const checks: DoctorDeepCheck[] = [
    evaluateUpstreamReadinessCheck({
      git: params.git,
      repoRoot: params.repoRoot,
    }),
    adapterCheck,
    evaluatePolicyDriftCheck(params.repoRoot),
    evaluateEvidenceSourceDriftCheck({
      git: params.git,
      repoRoot: params.repoRoot,
    }),
    evaluateCompatibilityContractCheck(compatibilityContract),
  ];

  return {
    enabled: true,
    checks,
    blocking: checks.some(
      (check) => check.status === 'fail' && check.severity === 'error'
    ),
    contract: compatibilityContract,
  };
};

export const runLifecycleDoctor = (params?: {
  cwd?: string;
  git?: ILifecycleGitService;
  deep?: boolean;
}): LifecycleDoctorReport => {
  const git = params?.git ?? new LifecycleGitService();
  const cwd = params?.cwd ?? process.cwd();
  const repoRoot = git.resolveRepoRoot(cwd);
  const trackedNodeModulesPaths = git.trackedNodeModulesPaths(repoRoot);
  const hooksDirectory = resolvePumukiHooksDirectory(repoRoot);
  const hookStatus = getPumukiHooksStatus(repoRoot);
  const lifecycleState = readLifecycleState(git, repoRoot);

  const issues = buildDoctorIssues({
    trackedNodeModulesPaths,
    hookStatus,
    hooksDirectory: hooksDirectory.path,
    lifecycleState,
  });
  const deep = params?.deep
    ? buildDoctorDeepReport({
      git,
      repoRoot,
      lifecycleState,
      hookStatus,
    })
    : undefined;
  const version = buildLifecycleVersionReport({
    repoRoot,
    lifecycleVersion: lifecycleState.version,
  });

  return {
    repoRoot,
    packageVersion: version.effective,
    version,
    lifecycleState,
    trackedNodeModulesPaths,
    hookStatus,
    hooksDirectory: hooksDirectory.path,
    hooksDirectoryResolution: hooksDirectory.source,
    policyValidation: readLifecyclePolicyValidationSnapshot(repoRoot),
    issues,
    deep,
  };
};

export const doctorHasBlockingIssues = (report: LifecycleDoctorReport): boolean =>
  report.issues.some((issue) => issue.severity === 'error') || report.deep?.blocking === true;
