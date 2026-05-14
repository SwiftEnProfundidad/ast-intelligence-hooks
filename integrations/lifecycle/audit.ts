import { readEvidence } from '../evidence/readEvidence';
import type { AiEvidenceV2_1, SnapshotFinding, SnapshotRulesCoverage } from '../evidence/schema';
import { GitService, type IGitService } from '../git/GitService';
import { hasAllowedExtension } from '../git/gitDiffUtils';
import { runPlatformGate } from '../git/runPlatformGate';
import { evaluatePlatformGateFindings } from '../git/runPlatformGateEvaluation';
import { DEFAULT_FACT_FILE_EXTENSIONS } from '../git/runPlatformGateFacts';
import { resolvePolicyForStage, type ResolvedStagePolicy } from '../gate/stagePolicies';

export type LifecycleAuditStage = 'PRE_WRITE' | 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';

export type LifecycleAuditFinding = {
  ruleId: string;
  severity: string;
  code: string;
  message: string;
  file: string;
  lines?: SnapshotFinding['lines'];
  blocking: boolean;
};

export type LifecycleAuditResult = {
  command: 'pumuki audit';
  repo_root: string;
  stage: LifecycleAuditStage;
  scope: {
    kind: 'repo' | 'staged' | 'range';
    staged_matching_extensions_count: number;
    range_matching_extensions_count?: number;
    base_ref?: string;
    from_ref?: string;
    to_ref?: string;
  };
  audit_mode: 'gate' | 'engine';
  gate_exit_code: number;
  files_scanned: number | null;
  untracked_matching_extensions_count: number;
  snapshot_outcome: string | null;
  findings_count: number;
  blocking_findings_count: number;
  rules_coverage: SnapshotRulesCoverage | null;
  rule_id_normalization: {
    contract: 'registry_or_declared_runtime_normalization';
    registry_rule_ids_count: number;
    finding_rule_ids_count: number;
    entries: ReadonlyArray<{
      runtime_rule_id: string;
      registry_rule_id: string | null;
      status: 'registry_1_to_1' | 'runtime_derived';
      normalization: string;
    }>;
  };
  findings: ReadonlyArray<LifecycleAuditFinding>;
  policy_reconcile_hint: string;
};

type LifecycleAuditDependencies = {
  git: IGitService;
  readEvidence: typeof readEvidence;
  resolvePolicyForStage: typeof resolvePolicyForStage;
  runPlatformGate: typeof runPlatformGate;
};

type LifecycleAuditScope =
  | { kind: 'repo' }
  | { kind: 'staged' }
  | {
      kind: 'range';
      baseRef: string;
      fromRef: string;
      toRef: string;
      matchingExtensions: ReadonlyArray<string>;
    };

const POLICY_RECONCILE_HINT =
  'If .pumuki/policy-as-code.json signatures drift after a pumuki upgrade, run: pumuki policy reconcile --apply';

const countUntrackedMatchingExtensions = (
  git: Pick<IGitService, 'resolveRepoRoot' | 'runGit'>,
  extensions: ReadonlyArray<string>
): number => {
  const repoRoot = git.resolveRepoRoot();
  const raw = git.runGit(['ls-files', '--others', '--exclude-standard'], repoRoot);
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((path) => hasAllowedExtension(path, extensions)).length;
};

const collectStagedMatchingExtensions = (
  git: Pick<IGitService, 'resolveRepoRoot' | 'runGit'>,
  extensions: ReadonlyArray<string>
): string[] => {
  const repoRoot = git.resolveRepoRoot();
  return git.runGit(['diff', '--cached', '--name-only'], repoRoot)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((path) => hasAllowedExtension(path, extensions));
};

const collectStagedFiles = (
  git: Pick<IGitService, 'resolveRepoRoot' | 'runGit'>
): string[] => {
  const repoRoot = git.resolveRepoRoot();
  return git.runGit(['diff', '--cached', '--name-only'], repoRoot)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const runGitOrNull = (
  git: Pick<IGitService, 'runGit'>,
  args: ReadonlyArray<string>,
  cwd: string
): string | null => {
  try {
    const output = git.runGit([...args], cwd).trim();
    return output.length > 0 ? output : null;
  } catch {
    return null;
  }
};

const isResolvableRef = (
  git: Pick<IGitService, 'runGit'>,
  repoRoot: string,
  ref: string
): boolean => runGitOrNull(git, ['rev-parse', '--verify', ref], repoRoot) !== null;

const branchPrefersDevelopBase = (branch: string): boolean =>
  /^(feature|bugfix|chore|refactor|docs)\//.test(branch);

const branchPrefersMainBase = (branch: string): boolean => /^hotfix\//.test(branch);

const collectRangeMatchingExtensions = (params: {
  git: Pick<IGitService, 'runGit'>;
  repoRoot: string;
  fromRef: string;
  toRef: string;
  extensions: ReadonlyArray<string>;
}): string[] => {
  const raw = runGitOrNull(
    params.git,
    ['diff', '--name-only', `${params.fromRef}..${params.toRef}`],
    params.repoRoot
  );
  return (raw ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((path) => hasAllowedExtension(path, params.extensions));
};

const resolvePrePushRangeScope = (params: {
  git: Pick<IGitService, 'runGit'>;
  repoRoot: string;
  extensions: ReadonlyArray<string>;
}): LifecycleAuditScope | null => {
  const branch =
    runGitOrNull(params.git, ['rev-parse', '--abbrev-ref', 'HEAD'], params.repoRoot) ?? '';
  if (branch === 'HEAD' || branch.length === 0) {
    return null;
  }

  const explicitBase =
    process.env.PUMUKI_AUDIT_PRE_PUSH_BASE_REF?.trim() ??
    process.env.PUMUKI_PRE_PUSH_BASE_REF?.trim() ??
    '';
  const upstreamTracking = runGitOrNull(
    params.git,
    ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'],
    params.repoRoot
  );
  const preferredBaseRefs = [
    explicitBase,
    ...(branchPrefersDevelopBase(branch) ? ['origin/develop'] : []),
    ...(branchPrefersMainBase(branch) ? ['origin/main', 'origin/master'] : []),
    upstreamTracking ?? '',
    'origin/develop',
    'origin/main',
    'origin/master',
  ].filter((ref, index, refs) => ref.length > 0 && refs.indexOf(ref) === index);

  const baseRef = preferredBaseRefs.find((ref) =>
    isResolvableRef(params.git, params.repoRoot, ref)
  );
  if (typeof baseRef === 'undefined') {
    return null;
  }

  const mergeBase = runGitOrNull(params.git, ['merge-base', baseRef, 'HEAD'], params.repoRoot);
  if (mergeBase === null) {
    return null;
  }

  return {
    kind: 'range',
    baseRef,
    fromRef: mergeBase,
    toRef: 'HEAD',
    matchingExtensions: collectRangeMatchingExtensions({
      git: params.git,
      repoRoot: params.repoRoot,
      fromRef: mergeBase,
      toRef: 'HEAD',
      extensions: params.extensions,
    }),
  };
};

const resolveLifecycleAuditScope = (params: {
  stage: LifecycleAuditStage;
  git: Pick<IGitService, 'runGit'>;
  repoRoot: string;
  extensions: ReadonlyArray<string>;
  stagedFiles: ReadonlyArray<string>;
  stagedMatchingExtensions: ReadonlyArray<string>;
}): LifecycleAuditScope => {
  if (
    (params.stage === 'PRE_WRITE' || params.stage === 'PRE_COMMIT') &&
    params.stagedFiles.length > 0
  ) {
    return { kind: 'staged' };
  }
  if (params.stage === 'PRE_PUSH') {
    const rangeScope = resolvePrePushRangeScope({
      git: params.git,
      repoRoot: params.repoRoot,
      extensions: params.extensions,
    });
    if (rangeScope !== null) {
      return rangeScope;
    }
  }
  return { kind: 'repo' };
};

const toGateScope = (scope: LifecycleAuditScope) => {
  if (scope.kind === 'range') {
    return {
      kind: 'range' as const,
      fromRef: scope.fromRef,
      toRef: scope.toRef,
      extensions: [...DEFAULT_FACT_FILE_EXTENSIONS],
    };
  }
  return { kind: scope.kind };
};

const toResultScope = (params: {
  scope: LifecycleAuditScope;
  stagedMatchingExtensions: ReadonlyArray<string>;
}): LifecycleAuditResult['scope'] => {
  const base = {
    kind: params.scope.kind,
    staged_matching_extensions_count: params.stagedMatchingExtensions.length,
  };
  if (params.scope.kind !== 'range') {
    return base;
  }
  return {
    ...base,
    range_matching_extensions_count: params.scope.matchingExtensions.length,
    base_ref: params.scope.baseRef,
    from_ref: params.scope.fromRef,
    to_ref: params.scope.toRef,
  };
};

const isFindingBlocking = (finding: SnapshotFinding): boolean => {
  return Boolean(finding.ruleId);
};

const toLifecycleAuditFinding = (finding: SnapshotFinding): LifecycleAuditFinding => ({
  ruleId: finding.ruleId,
  severity: finding.severity,
  code: finding.code,
  message: finding.message,
  file: finding.file,
  ...(typeof finding.lines !== 'undefined' ? { lines: finding.lines } : {}),
  blocking: isFindingBlocking(finding),
});

const buildBlockedWithoutFindingsFallback = (params: {
  stage: LifecycleAuditStage;
  gateExitCode: number;
  snapshotOutcome: string | null;
}): LifecycleAuditFinding => ({
  ruleId: 'audit.gate.blocked-without-findings',
  severity: 'ERROR',
  code: 'AUDIT_BLOCKED_WITHOUT_FINDINGS',
  message:
    `Audit ${params.stage} exited ${params.gateExitCode} with outcome=${params.snapshotOutcome ?? 'unknown'} ` +
    'but produced no machine-readable findings. Re-run with this Pumuki version and inspect policy/SDD output; this fallback keeps JSON actionable.',
  file: '.ai_evidence.json',
  blocking: true,
});

const extractAuditFindings = (params: {
  evidence: AiEvidenceV2_1 | undefined;
  gateExitCode: number;
  stage: LifecycleAuditStage;
  snapshotOutcome: string | null;
}): ReadonlyArray<LifecycleAuditFinding> => {
  const findings = Array.isArray(params.evidence?.snapshot.findings)
    ? params.evidence.snapshot.findings.map(toLifecycleAuditFinding)
    : [];
  if (findings.length > 0) {
    return findings;
  }
  if (params.gateExitCode !== 0 || params.snapshotOutcome === 'BLOCK') {
    return [
      buildBlockedWithoutFindingsFallback({
        stage: params.stage,
        gateExitCode: params.gateExitCode,
        snapshotOutcome: params.snapshotOutcome,
      }),
    ];
  }
  return [];
};

const buildRuleIdNormalization = (params: {
  findings: ReadonlyArray<LifecycleAuditFinding>;
  rulesCoverage: SnapshotRulesCoverage | undefined;
}): LifecycleAuditResult['rule_id_normalization'] => {
  const registryRuleIds = new Set([
    ...(params.rulesCoverage?.stage_applicable_auto_rule_ids ?? []),
    ...(params.rulesCoverage?.declarative_rule_ids ?? []),
  ]);
  const findingRuleIds = [...new Set(params.findings.map((finding) => finding.ruleId))].sort();
  return {
    contract: 'registry_or_declared_runtime_normalization',
    registry_rule_ids_count: registryRuleIds.size,
    finding_rule_ids_count: findingRuleIds.length,
    entries: findingRuleIds.map((ruleId) => {
      if (registryRuleIds.has(ruleId)) {
        return {
          runtime_rule_id: ruleId,
          registry_rule_id: ruleId,
          status: 'registry_1_to_1',
          normalization: 'finding ruleId is an exact skills registry rule id',
        };
      }
      return {
        runtime_rule_id: ruleId,
        registry_rule_id: null,
        status: 'runtime_derived',
        normalization:
          'finding ruleId is emitted by baseline/runtime governance outside the skills registry; see rules_coverage for the AUTO skills scope evaluated at this stage',
      };
    }),
  };
};

const isScopedPreWriteGlobalEnforcementOnly = (params: {
  stage: LifecycleAuditStage;
  scope: LifecycleAuditScope;
  findings: ReadonlyArray<LifecycleAuditFinding>;
}): boolean =>
  params.stage === 'PRE_WRITE' &&
  params.scope.kind === 'staged' &&
  params.findings.length > 0 &&
  params.findings.every(
    (finding) => finding.code === 'SKILLS_GLOBAL_ENFORCEMENT_INCOMPLETE_CRITICAL'
  );

const isRangePrePushWithoutSupportedCodeSddOnly = (params: {
  stage: LifecycleAuditStage;
  scope: LifecycleAuditScope;
  findings: ReadonlyArray<LifecycleAuditFinding>;
}): boolean =>
  params.stage === 'PRE_PUSH' &&
  params.scope.kind === 'range' &&
  params.scope.matchingExtensions.length === 0 &&
  params.findings.length > 0 &&
  params.findings.every((finding) => finding.code === 'SDD_CHANGE_MISSING');

const toScopedAuditAdvisoryFinding = (
  finding: LifecycleAuditFinding
): LifecycleAuditFinding => ({
  ...finding,
  severity: 'INFO',
  code: 'AUDIT_SCOPED_GLOBAL_ENFORCEMENT_ADVISORY',
  message:
    'Scoped PRE_WRITE audit evaluated only the staged supported files; global skills enforcement debt is retained as advisory for repo-wide work. ' +
    finding.message,
  blocking: false,
});

const toRangeNoSupportedCodeAuditAdvisoryFinding = (
  finding: LifecycleAuditFinding
): LifecycleAuditFinding => ({
  ...finding,
  severity: 'INFO',
  code: 'AUDIT_RANGE_NO_SUPPORTED_CODE_ADVISORY',
  message:
    'Range PRE_PUSH audit found no supported code files in the branch delta; SDD baseline debt is retained as advisory for this atomic split slice. ' +
    finding.message,
  blocking: false,
});

const isStagedWithoutSupportedCode = (params: {
  stage: LifecycleAuditStage;
  scope: LifecycleAuditScope;
  stagedMatchingExtensions: ReadonlyArray<string>;
  findings: ReadonlyArray<LifecycleAuditFinding>;
}): boolean =>
  (params.stage === 'PRE_WRITE' || params.stage === 'PRE_COMMIT') &&
  params.scope.kind === 'staged' &&
  params.stagedMatchingExtensions.length === 0 &&
  params.findings.length > 0;

const toStagedNoSupportedCodeAuditAdvisoryFinding = (
  finding: LifecycleAuditFinding
): LifecycleAuditFinding => ({
  ...finding,
  severity: 'INFO',
  code: 'AUDIT_STAGED_NO_SUPPORTED_CODE_ADVISORY',
  message:
    'Staged audit found no supported code files; baseline repository debt is retained as advisory for this documentation/config-only slice. ' +
    finding.message,
  blocking: false,
});

export const runLifecycleAudit = async (params: {
  stage: LifecycleAuditStage;
  auditMode: 'gate' | 'engine';
  dependencies?: Partial<LifecycleAuditDependencies>;
}): Promise<LifecycleAuditResult> => {
  const activeDependencies: LifecycleAuditDependencies = {
    git: new GitService(),
    readEvidence,
    resolvePolicyForStage,
    runPlatformGate,
    ...params.dependencies,
  };
  const git = activeDependencies.git;
  const repoRoot = git.resolveRepoRoot();
  const resolved: ResolvedStagePolicy = activeDependencies.resolvePolicyForStage(
    params.stage,
    repoRoot
  );
  const extensions = DEFAULT_FACT_FILE_EXTENSIONS;
  const untrackedMatchingExtensionsCount = countUntrackedMatchingExtensions(git, extensions);
  const stagedFiles = collectStagedFiles(git);
  const stagedMatchingExtensions = collectStagedMatchingExtensions(git, extensions);
  const scope = resolveLifecycleAuditScope({
    stage: params.stage,
    git,
    repoRoot,
    extensions,
    stagedFiles,
    stagedMatchingExtensions,
  });
  const gateScope = toGateScope(scope);

  const gateParams =
    params.auditMode === 'engine'
      ? {
          policy: resolved.policy,
          policyTrace: resolved.trace,
          scope: gateScope,
          silent: true,
          auditMode: 'engine' as const,
          dependencies: {
            evaluatePlatformGateFindings: (
              evalParams: Parameters<typeof evaluatePlatformGateFindings>[0]
            ) =>
              evaluatePlatformGateFindings(evalParams, {
                loadHeuristicsConfig: () => ({
                  astSemanticEnabled: true,
                  typeScriptScope: 'all',
                }),
              }),
            printGateFindings: () => {},
          },
        }
      : {
          policy: resolved.policy,
          policyTrace: resolved.trace,
          scope: gateScope,
          silent: true,
          auditMode: 'gate' as const,
        };

  const originalGateExitCode = await activeDependencies.runPlatformGate(gateParams);
  const evidence = activeDependencies.readEvidence(repoRoot);
  const filesScanned =
    typeof evidence?.snapshot.files_scanned === 'number' &&
    Number.isFinite(evidence.snapshot.files_scanned)
      ? evidence.snapshot.files_scanned
      : null;
  const snapshotOutcome =
    typeof evidence?.snapshot.outcome === 'string' ? evidence.snapshot.outcome : null;
  const findings = extractAuditFindings({
    evidence,
    gateExitCode: originalGateExitCode,
    stage: params.stage,
    snapshotOutcome,
  });
  const scopedGlobalEnforcementOnly = isScopedPreWriteGlobalEnforcementOnly({
    stage: params.stage,
    scope,
    findings,
  });
  const rangePrePushWithoutSupportedCodeSddOnly = isRangePrePushWithoutSupportedCodeSddOnly({
    stage: params.stage,
    scope,
    findings,
  });
  const stagedWithoutSupportedCode = isStagedWithoutSupportedCode({
    stage: params.stage,
    scope,
    stagedMatchingExtensions,
    findings,
  });
  const gateAllowed = originalGateExitCode === 0;
  const effectiveFindings = scopedGlobalEnforcementOnly
    ? findings.map(toScopedAuditAdvisoryFinding)
    : rangePrePushWithoutSupportedCodeSddOnly
      ? findings.map(toRangeNoSupportedCodeAuditAdvisoryFinding)
    : stagedWithoutSupportedCode
      ? findings.map(toStagedNoSupportedCodeAuditAdvisoryFinding)
      : findings;
  const hasBlockingFinding = effectiveFindings.some((finding) => finding.blocking);
  const gateExitCode =
    scopedGlobalEnforcementOnly || rangePrePushWithoutSupportedCodeSddOnly || stagedWithoutSupportedCode
      ? 0
      : hasBlockingFinding
        ? 1
        : originalGateExitCode;
  const effectiveSnapshotOutcome =
    gateExitCode === 0 && snapshotOutcome === 'BLOCK' ? 'PASS' : snapshotOutcome;

  return {
    command: 'pumuki audit',
    repo_root: repoRoot,
    stage: params.stage,
    scope: toResultScope({ scope, stagedMatchingExtensions }),
    audit_mode: params.auditMode,
    gate_exit_code: gateExitCode,
    files_scanned: filesScanned,
    untracked_matching_extensions_count: untrackedMatchingExtensionsCount,
    snapshot_outcome: effectiveSnapshotOutcome,
    findings_count: effectiveFindings.length,
    blocking_findings_count: effectiveFindings.filter((finding) => finding.blocking).length,
    rules_coverage: evidence?.snapshot.rules_coverage ?? null,
    rule_id_normalization: buildRuleIdNormalization({
      findings: effectiveFindings,
      rulesCoverage: evidence?.snapshot.rules_coverage,
    }),
    findings: effectiveFindings,
    policy_reconcile_hint: POLICY_RECONCILE_HINT,
  };
};
