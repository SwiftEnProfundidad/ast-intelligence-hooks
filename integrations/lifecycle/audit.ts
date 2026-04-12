import { readEvidence } from '../evidence/readEvidence';
import { GitService } from '../git/GitService';
import { hasAllowedExtension } from '../git/gitDiffUtils';
import { runPlatformGate } from '../git/runPlatformGate';
import { evaluatePlatformGateFindings } from '../git/runPlatformGateEvaluation';
import { DEFAULT_FACT_FILE_EXTENSIONS } from '../git/runPlatformGateFacts';
import { resolvePolicyForStage } from '../gate/stagePolicies';

export type LifecycleAuditStage = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';

export type LifecycleAuditResult = {
  command: 'pumuki audit';
  repo_root: string;
  stage: LifecycleAuditStage;
  scope: { kind: 'repo' };
  audit_mode: 'gate' | 'engine';
  gate_exit_code: number;
  files_scanned: number | null;
  untracked_matching_extensions_count: number;
  snapshot_outcome: string | null;
  policy_reconcile_hint: string;
};

const POLICY_RECONCILE_HINT =
  'If .pumuki/policy-as-code.json signatures drift after a pumuki upgrade, run: pumuki policy reconcile --apply';

const countUntrackedMatchingExtensions = (
  git: GitService,
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

export const runLifecycleAudit = async (params: {
  stage: LifecycleAuditStage;
  auditMode: 'gate' | 'engine';
}): Promise<LifecycleAuditResult> => {
  const git = new GitService();
  const repoRoot = git.resolveRepoRoot();
  const resolved = resolvePolicyForStage(params.stage, repoRoot);
  const extensions = DEFAULT_FACT_FILE_EXTENSIONS;
  const untrackedMatchingExtensionsCount = countUntrackedMatchingExtensions(git, extensions);

  const gateParams =
    params.auditMode === 'engine'
      ? {
          policy: resolved.policy,
          policyTrace: resolved.trace,
          scope: { kind: 'repo' as const },
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
          scope: { kind: 'repo' as const },
          silent: true,
          auditMode: 'gate' as const,
        };

  const gateExitCode = await runPlatformGate(gateParams);
  const evidence = readEvidence(repoRoot);
  const filesScanned =
    typeof evidence?.snapshot.files_scanned === 'number' &&
    Number.isFinite(evidence.snapshot.files_scanned)
      ? evidence.snapshot.files_scanned
      : null;
  const snapshotOutcome =
    typeof evidence?.snapshot.outcome === 'string' ? evidence.snapshot.outcome : null;

  return {
    command: 'pumuki audit',
    repo_root: repoRoot,
    stage: params.stage,
    scope: { kind: 'repo' },
    audit_mode: params.auditMode,
    gate_exit_code: gateExitCode,
    files_scanned: filesScanned,
    untracked_matching_extensions_count: untrackedMatchingExtensionsCount,
    snapshot_outcome: snapshotOutcome,
    policy_reconcile_hint: POLICY_RECONCILE_HINT,
  };
};
