import { readEvidence } from '../evidence/readEvidence';
import type { AiEvidenceV2_1, SnapshotFinding, SnapshotRulesCoverage } from '../evidence/schema';
import { GitService, type IGitService } from '../git/GitService';
import { hasAllowedExtension } from '../git/gitDiffUtils';
import { runPlatformGate } from '../git/runPlatformGate';
import { evaluatePlatformGateFindings } from '../git/runPlatformGateEvaluation';
import { DEFAULT_FACT_FILE_EXTENSIONS, type GateScope } from '../git/runPlatformGateFacts';
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
  scope: { kind: 'repo' | 'staged'; staged_matching_extensions_count: number };
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

const resolveLifecycleAuditScope = (params: {
  stage: LifecycleAuditStage;
  stagedMatchingExtensions: ReadonlyArray<string>;
}): GateScope => {
  if (params.stage === 'PRE_WRITE' && params.stagedMatchingExtensions.length > 0) {
    return { kind: 'staged' };
  }
  return { kind: 'repo' };
};

const isFindingBlocking = (finding: SnapshotFinding): boolean => {
  if (typeof finding.blocking === 'boolean') {
    return finding.blocking;
  }
  return finding.severity === 'CRITICAL' || finding.severity === 'ERROR';
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
  scope: GateScope;
  findings: ReadonlyArray<LifecycleAuditFinding>;
}): boolean =>
  params.stage === 'PRE_WRITE' &&
  params.scope.kind === 'staged' &&
  params.findings.length > 0 &&
  params.findings.every(
    (finding) => finding.code === 'SKILLS_GLOBAL_ENFORCEMENT_INCOMPLETE_CRITICAL'
  );

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
  const stagedMatchingExtensions = collectStagedMatchingExtensions(git, extensions);
  const scope = resolveLifecycleAuditScope({
    stage: params.stage,
    stagedMatchingExtensions,
  });

  const gateParams =
    params.auditMode === 'engine'
      ? {
          policy: resolved.policy,
          policyTrace: resolved.trace,
          scope,
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
          scope,
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
  const effectiveFindings = scopedGlobalEnforcementOnly
    ? findings.map(toScopedAuditAdvisoryFinding)
    : findings;
  const gateExitCode = scopedGlobalEnforcementOnly ? 0 : originalGateExitCode;

  return {
    command: 'pumuki audit',
    repo_root: repoRoot,
    stage: params.stage,
    scope: {
      kind: scope.kind,
      staged_matching_extensions_count: stagedMatchingExtensions.length,
    },
    audit_mode: params.auditMode,
    gate_exit_code: gateExitCode,
    files_scanned: filesScanned,
    untracked_matching_extensions_count: untrackedMatchingExtensionsCount,
    snapshot_outcome: snapshotOutcome,
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
