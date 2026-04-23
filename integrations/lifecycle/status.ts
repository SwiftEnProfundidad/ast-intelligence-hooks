import { getPumukiHooksStatus, resolvePumukiHooksDirectory } from './hookManager';
import { LifecycleGitService, type ILifecycleGitService } from './gitService';
import { buildLifecycleVersionReport } from './packageInfo';
import { readEvidenceResult } from '../evidence/readEvidence';
import { appendTrackingActionableContext } from '../git/aiGateRepoPolicyFindings';
import {
  readLifecycleExperimentalFeaturesSnapshot,
  type LifecycleExperimentalFeaturesSnapshot,
} from './experimentalFeaturesSnapshot';
import {
  readLifecyclePolicyValidationSnapshot,
  type LifecyclePolicyValidationSnapshot,
} from './policyValidationSnapshot';
import { readLifecycleState, type LifecycleState } from './state';
import type { DoctorIssue } from './doctor';

export type LifecycleStatus = {
  repoRoot: string;
  packageVersion: string;
  version: ReturnType<typeof buildLifecycleVersionReport>;
  lifecycleState: LifecycleState;
  hookStatus: ReturnType<typeof getPumukiHooksStatus>;
  hooksDirectory: string;
  hooksDirectoryResolution: 'git-rev-parse' | 'git-config' | 'default';
  trackedNodeModulesCount: number;
  policyValidation: LifecyclePolicyValidationSnapshot;
  experimentalFeatures: LifecycleExperimentalFeaturesSnapshot;
  issues: ReadonlyArray<DoctorIssue>;
};

const buildLifecycleIssues = (repoRoot: string): ReadonlyArray<DoctorIssue> => {
  const evidenceResult = readEvidenceResult(repoRoot);
  if (evidenceResult.kind !== 'valid') {
    return [];
  }

  const evidence = evidenceResult.evidence;
  const blocked =
    evidence.snapshot.outcome === 'BLOCK' ||
    evidence.ai_gate.status === 'BLOCKED' ||
    evidence.severity_metrics.gate_status === 'BLOCKED';

  if (!blocked) {
    return [];
  }

  const blockedStage = evidence?.snapshot?.stage ?? 'PRE_WRITE';
  const message = appendTrackingActionableContext({
    repoRoot,
    message: `Governance is blocked (${blockedStage}).`,
  });
  return [
    {
      severity: 'error',
      message,
    },
  ];
};

export const readLifecycleStatus = (params?: {
  cwd?: string;
  git?: ILifecycleGitService;
}): LifecycleStatus => {
  const git = params?.git ?? new LifecycleGitService();
  const cwd = params?.cwd ?? process.cwd();
  const repoRoot = git.resolveRepoRoot(cwd);
  const hooksDirectory = resolvePumukiHooksDirectory(repoRoot);
  const trackedNodeModulesCount = git.trackedNodeModulesPaths(repoRoot).length;
  const lifecycleState = readLifecycleState(git, repoRoot);
  const version = buildLifecycleVersionReport({
    repoRoot,
    lifecycleVersion: lifecycleState.version,
  });
  const policyValidation = readLifecyclePolicyValidationSnapshot(repoRoot);
  const experimentalFeatures = readLifecycleExperimentalFeaturesSnapshot();
  const issues = buildLifecycleIssues(repoRoot);

  return {
    repoRoot,
    packageVersion: version.effective,
    version,
    lifecycleState,
    hookStatus: getPumukiHooksStatus(repoRoot),
    hooksDirectory: hooksDirectory.path,
    hooksDirectoryResolution: hooksDirectory.source,
    trackedNodeModulesCount,
    policyValidation,
    experimentalFeatures,
    issues,
  };
};
