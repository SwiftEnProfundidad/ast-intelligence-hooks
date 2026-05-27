import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { installPumukiHooks } from './hookManager';
import { LifecycleGitService, type ILifecycleGitService } from './gitService';
import { runLifecycleDoctor } from './doctor';
import { runOpenSpecBootstrap, type OpenSpecBootstrapResult } from './openSpecBootstrap';
import { LifecycleNpmService, type ILifecycleNpmService } from './npmService';
import { getCurrentPumukiVersion } from './packageInfo';
import { generateEvidence } from '../evidence/generateEvidence';
import { readEvidence } from '../evidence/readEvidence';
import { captureRepoState } from '../evidence/repoState';
import { createEmptyEvaluationMetrics } from '../evidence/evaluationMetrics';
import { readOpenSpecManagedArtifacts, writeLifecycleState } from './state';
import { ensureRuntimeArtifactsIgnored } from './artifacts';
import { runLifecycleAdapterInstall } from './adapter';
import { runPolicyReconcile } from './policyReconcile';
import { emitGateBlockedNotification } from '../notifications/emitAuditSummaryNotification';
import { persistSystemNotificationsConfig } from '../../scripts/framework-menu-system-notifications-config';
import {
  readLifecycleNotificationStatus,
  type LifecycleNotificationStatus,
} from './notificationStatus';

export type LifecycleInstallResult = {
  repoRoot: string;
  version: string;
  changedHooks: ReadonlyArray<string>;
  openSpecBootstrap?: OpenSpecBootstrapResult;
  degradedDoctorBypass?: boolean;
  notifications: LifecycleNotificationStatus;
};

const shouldBootstrapEvidence = (repoRoot: string): boolean =>
  !existsSync(join(repoRoot, '.ai_evidence.json'));

const writeBootstrapEvidence = (repoRoot: string): void => {
  generateEvidence({
    stage: 'PRE_COMMIT',
    findings: [],
    gateOutcome: 'PASS',
    filesScanned: 0,
    evaluationMetrics: createEmptyEvaluationMetrics(),
    previousEvidence: readEvidence(repoRoot),
    detectedPlatforms: {},
    loadedRulesets: [],
    repoRoot,
    repoState: captureRepoState(repoRoot),
  });
};

const wireHooksLifecycleAndBootstrapEvidence = (params: {
  git: ILifecycleGitService;
  repoRoot: string;
  version: string;
  openSpecManagedArtifacts?: ReadonlyArray<string>;
}): ReadonlyArray<string> => {
  const hookResult = installPumukiHooks(params.repoRoot);
  writeLifecycleState({
    git: params.git,
    repoRoot: params.repoRoot,
    version: params.version,
    openSpecManagedArtifacts: params.openSpecManagedArtifacts,
  });
  ensureRuntimeArtifactsIgnored(params.repoRoot);
  if (shouldBootstrapEvidence(params.repoRoot)) {
    writeBootstrapEvidence(params.repoRoot);
  }
  return hookResult.changedHooks;
};

const ensureRepoBaselineAdapter = (repoRoot: string): void => {
  const adapterPath = join(repoRoot, '.pumuki', 'adapter.json');
  if (existsSync(adapterPath)) {
    return;
  }
  try {
    runLifecycleAdapterInstall({
      cwd: repoRoot,
      agent: 'repo',
    });
  } catch (cause: unknown) {
    if (process.env.PUMUKI_VERBOSE_INSTALL === '1') {
      console.debug('[pumuki] adapter scaffold skipped', cause);
    }
  }
};

const materializeStrictPolicyAsCode = (repoRoot: string): void => {
  try {
    const report = runPolicyReconcile({
      repoRoot,
      strict: true,
      apply: true,
    });
    if (report.summary.status === 'PASS') {
      return;
    }
    if (process.env.PUMUKI_VERBOSE_INSTALL === '1') {
      console.debug('[pumuki] strict policy reconcile skipped', report.summary.status);
    }
  } catch (cause: unknown) {
    if (process.env.PUMUKI_VERBOSE_INSTALL === '1') {
      console.debug('[pumuki] strict policy reconcile skipped', cause);
    }
  }
};

const isPreWriteEnforcementGapIssue = (message: string): boolean =>
  message.startsWith('ENFORCEMENT_GAP: PRE_WRITE hard-stop lease is not valid');

const ensureInstallNotificationsEnabled = (repoRoot: string): LifecycleNotificationStatus => {
  persistSystemNotificationsConfig(repoRoot, true);
  return readLifecycleNotificationStatus({ repoRoot });
};

export const runLifecycleInstall = (params?: {
  cwd?: string;
  git?: ILifecycleGitService;
  npm?: ILifecycleNpmService;
  bootstrapOpenSpec?: boolean;
  bestEffortAfterDoctorBlock?: boolean;
  notifyGateBlocked?: typeof emitGateBlockedNotification;
}): LifecycleInstallResult => {
  const git = params?.git ?? new LifecycleGitService();
  const bestEffortAfterDoctorBlock =
    params?.bestEffortAfterDoctorBlock ?? process.env.PUMUKI_AUTO_POSTINSTALL === '1';
  const report = runLifecycleDoctor({
    cwd: params?.cwd,
    git,
  });
  const notifications = ensureInstallNotificationsEnabled(report.repoRoot);
  const installBlockingIssues = report.issues.filter(
    (issue) => issue.severity === 'error' && !isPreWriteEnforcementGapIssue(issue.message)
  );
  const hasInstallBlockingIssues =
    installBlockingIssues.length > 0 || report.deep?.blocking === true;

  if (hasInstallBlockingIssues) {
    if (bestEffortAfterDoctorBlock) {
      const version = getCurrentPumukiVersion();
      const priorArtifacts = readOpenSpecManagedArtifacts(git, report.repoRoot);
      const changedHooks = wireHooksLifecycleAndBootstrapEvidence({
        git,
        repoRoot: report.repoRoot,
        version,
        openSpecManagedArtifacts: priorArtifacts.length > 0 ? priorArtifacts : undefined,
      });
      ensureRepoBaselineAdapter(report.repoRoot);
      materializeStrictPolicyAsCode(report.repoRoot);
      return {
        repoRoot: report.repoRoot,
        version,
        changedHooks,
        openSpecBootstrap: undefined,
        degradedDoctorBypass: true,
        notifications,
      };
    }
    const renderedIssues = installBlockingIssues.map((issue) => `- [${issue.severity}] ${issue.message}`).join('\n');
    const firstIssue = installBlockingIssues[0];
    const notificationResult = (params?.notifyGateBlocked ?? emitGateBlockedNotification)({
      repoRoot: report.repoRoot,
      stage: 'PRE_COMMIT',
      totalViolations: report.issues.length,
      causeCode: 'LIFECYCLE_INSTALL_SAFETY_BLOCKED',
      causeMessage: firstIssue?.message ?? 'pumuki install blocked by repository safety checks.',
      remediation: 'Corrige las incidencias activas del tracking externo y reintenta pumuki install.',
    });
    const notificationLine = notificationResult.delivered
      ? '- [info] Blocking notification delivered.'
      : `- [warning] Blocking notification not delivered: ${notificationResult.reason}`;
    throw new Error(
      `pumuki install blocked by repository safety checks.\n${renderedIssues}\n${notificationLine}\n` +
      'Fix the baseline (for example tracked node_modules) and retry.'
    );
  }

  const shouldBootstrapOpenSpec =
    params?.bootstrapOpenSpec ?? process.env.PUMUKI_SKIP_OPENSPEC_BOOTSTRAP !== '1';

  const openSpecBootstrap = shouldBootstrapOpenSpec
    ? runOpenSpecBootstrap({
      repoRoot: report.repoRoot,
      npm: params?.npm ?? new LifecycleNpmService(),
    })
    : undefined;

  const version = getCurrentPumukiVersion();
  const mergedOpenSpecArtifacts = new Set(
    readOpenSpecManagedArtifacts(git, report.repoRoot)
  );
  for (const artifact of openSpecBootstrap?.managedArtifacts ?? []) {
    mergedOpenSpecArtifacts.add(artifact);
  }
  const changedHooks = wireHooksLifecycleAndBootstrapEvidence({
    git,
    repoRoot: report.repoRoot,
    version,
    openSpecManagedArtifacts: Array.from(mergedOpenSpecArtifacts),
  });
  ensureRepoBaselineAdapter(report.repoRoot);
  materializeStrictPolicyAsCode(report.repoRoot);

  return {
    repoRoot: report.repoRoot,
    version,
    changedHooks,
    openSpecBootstrap,
    notifications,
  };
};
