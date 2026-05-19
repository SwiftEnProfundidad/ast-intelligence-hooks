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
import {
  readLifecycleDependencyInventory,
  type LifecycleDependencyInventory,
} from './dependencyInventory';
import { readPreWriteLeaseStatus } from './preWriteLease';
import {
  readLifecycleNotificationStatus,
  type LifecycleNotificationStatus,
} from './notificationStatus';
import {
  extractEvidenceBlockingCauses,
  formatEvidenceBlockingCause,
} from '../evidence/blockingCauses';

export type LifecycleStatus = {
  repoRoot: string;
  packageVersion: string;
  version: ReturnType<typeof buildLifecycleVersionReport>;
  lifecycleState: LifecycleState;
  hookStatus: ReturnType<typeof getPumukiHooksStatus>;
  hooksDirectory: string;
  hooksDirectoryResolution: 'git-rev-parse' | 'git-config' | 'default';
  trackedNodeModulesCount: number;
  dependencyInventory: LifecycleDependencyInventory;
  policyValidation: LifecyclePolicyValidationSnapshot;
  experimentalFeatures: LifecycleExperimentalFeaturesSnapshot;
  notifications: LifecycleNotificationStatus;
  issues: ReadonlyArray<DoctorIssue>;
};

const buildLifecycleIssues = (repoRoot: string): ReadonlyArray<DoctorIssue> => {
  const notificationStatus = readLifecycleNotificationStatus({ repoRoot });
  const evidenceResult = readEvidenceResult(repoRoot);
  const preWriteLeaseStatus = readPreWriteLeaseStatus({
    repoRoot,
    git: new LifecycleGitService(),
  });
  const notificationIssues: DoctorIssue[] = notificationStatus.deliverable
    ? []
    : [
        {
          severity: 'warning',
          message:
            `System notifications are not deliverable (${notificationStatus.disabledReason ?? 'unknown'}). ` +
            `${notificationStatus.remediation ?? 'Review notification configuration.'}`,
        },
      ];
  const leaseIssues: DoctorIssue[] =
    !preWriteLeaseStatus.valid && preWriteLeaseStatus.changedCodePaths.length > 0
      ? [
          {
            severity: 'error',
            message:
              `ENFORCEMENT_GAP: PRE_WRITE hard-stop lease is not valid (${preWriteLeaseStatus.code}) ` +
              `for ${preWriteLeaseStatus.changedCodePaths.length} changed code file(s).`,
          },
        ]
      : [];
  if (evidenceResult.kind !== 'valid') {
    return [...notificationIssues, ...leaseIssues];
  }

  const evidence = evidenceResult.evidence;
  const blocked =
    evidence.snapshot.outcome === 'BLOCK' ||
    evidence.ai_gate.status === 'BLOCKED' ||
    evidence.severity_metrics.gate_status === 'BLOCKED';

  if (!blocked) {
    if (evidence.snapshot.outcome !== 'WARN') {
      return [...notificationIssues, ...leaseIssues];
    }

    const warnStage = evidence?.snapshot?.stage ?? 'PRE_WRITE';
    return [
      ...notificationIssues,
      ...leaseIssues,
      {
        severity: 'warning',
        message: appendTrackingActionableContext({
          repoRoot,
          message: `Governance requires attention (${warnStage}).`,
        }),
      },
    ];
  }

  const blockedStage = evidence?.snapshot?.stage ?? 'PRE_WRITE';
  const message = appendTrackingActionableContext({
    repoRoot,
    message: `Governance is blocked (${blockedStage}).`,
  });
  const blockingCauses = extractEvidenceBlockingCauses(evidence);
  const causeDetails =
    blockingCauses.length > 0
      ? ` Blocking causes: ${blockingCauses.length}. ${blockingCauses
          .map(formatEvidenceBlockingCause)
          .join(' | ')}`
      : '';
  return [
    ...notificationIssues,
    ...leaseIssues,
    {
      severity: 'error',
      message: `${message}${causeDetails}`,
      blockingCauses,
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
  const dependencyInventory = readLifecycleDependencyInventory(repoRoot);
  const lifecycleState = readLifecycleState(git, repoRoot);
  const version = buildLifecycleVersionReport({
    repoRoot,
    lifecycleVersion: lifecycleState.version,
  });
  const policyValidation = readLifecyclePolicyValidationSnapshot(repoRoot);
  const experimentalFeatures = readLifecycleExperimentalFeaturesSnapshot();
  const notifications = readLifecycleNotificationStatus({ repoRoot });
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
    dependencyInventory,
    policyValidation,
    experimentalFeatures,
    notifications,
    issues,
  };
};
