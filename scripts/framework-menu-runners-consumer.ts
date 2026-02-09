import {
  buildConsumerStartupTriageCommandArgs,
  buildMockConsumerAbReportCommandArgs,
} from './framework-menu-builders';
import { resolveScriptOrReportMissing, runNpx } from './framework-menu-runner-common';

export const runConsumerCiArtifactsScan = async (params: {
  repo: string;
  limit: number;
  outFile: string;
}): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/collect-consumer-ci-artifacts.ts');
  if (!scriptPath) {
    return;
  }

  runNpx([
    '--yes',
    'tsx@4.21.0',
    scriptPath,
    '--repo',
    params.repo,
    '--limit',
    String(params.limit),
    '--out',
    params.outFile,
  ]);
};

export const runConsumerCiAuthCheck = async (params: {
  repo: string;
  outFile: string;
}): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/check-consumer-ci-auth.ts');
  if (!scriptPath) {
    return;
  }

  runNpx([
    '--yes',
    'tsx@4.21.0',
    scriptPath,
    '--repo',
    params.repo,
    '--out',
    params.outFile,
  ]);
};

export const runConsumerWorkflowLintScan = async (params: {
  repoPath: string;
  actionlintBin: string;
  outFile: string;
}): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/lint-consumer-workflows.ts');
  if (!scriptPath) {
    return;
  }

  runNpx([
    '--yes',
    'tsx@4.21.0',
    scriptPath,
    '--repo-path',
    params.repoPath,
    '--actionlint-bin',
    params.actionlintBin,
    '--out',
    params.outFile,
  ]);
};

export const runConsumerSupportBundle = async (params: {
  repo: string;
  limit: number;
  outFile: string;
}): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing(
    'scripts/build-consumer-startup-failure-support-bundle.ts'
  );
  if (!scriptPath) {
    return;
  }

  runNpx([
    '--yes',
    'tsx@4.21.0',
    scriptPath,
    '--repo',
    params.repo,
    '--limit',
    String(params.limit),
    '--out',
    params.outFile,
  ]);
};

export const runConsumerSupportTicketDraft = async (params: {
  repo: string;
  supportBundleFile: string;
  authReportFile: string;
  outFile: string;
}): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/build-consumer-support-ticket-draft.ts');
  if (!scriptPath) {
    return;
  }

  runNpx([
    '--yes',
    'tsx@4.21.0',
    scriptPath,
    '--repo',
    params.repo,
    '--support-bundle',
    params.supportBundleFile,
    '--auth-report',
    params.authReportFile,
    '--out',
    params.outFile,
  ]);
};

export const runConsumerStartupUnblockStatus = async (params: {
  repo: string;
  supportBundleFile: string;
  authReportFile: string;
  workflowLintReportFile: string;
  outFile: string;
}): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/build-consumer-startup-unblock-status.ts');
  if (!scriptPath) {
    return;
  }

  runNpx([
    '--yes',
    'tsx@4.21.0',
    scriptPath,
    '--repo',
    params.repo,
    '--support-bundle',
    params.supportBundleFile,
    '--auth-report',
    params.authReportFile,
    '--workflow-lint-report',
    params.workflowLintReportFile,
    '--out',
    params.outFile,
  ]);
};

export const runConsumerStartupTriage = async (params: {
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  repoPath?: string;
  actionlintBin?: string;
}): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/build-consumer-startup-triage.ts');
  if (!scriptPath) {
    return;
  }

  runNpx(
    buildConsumerStartupTriageCommandArgs({
      scriptPath,
      repo: params.repo,
      limit: params.limit,
      outDir: params.outDir,
      runWorkflowLint: params.runWorkflowLint,
      repoPath: params.repoPath,
      actionlintBin: params.actionlintBin,
    })
  );
};

export const runMockConsumerAbReport = async (params: {
  repo: string;
  outFile: string;
  blockSummaryFile: string;
  minimalSummaryFile: string;
  blockEvidenceFile: string;
  minimalEvidenceFile: string;
}): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/build-mock-consumer-ab-report.ts');
  if (!scriptPath) {
    return;
  }

  runNpx(
    buildMockConsumerAbReportCommandArgs({
      scriptPath,
      repo: params.repo,
      outFile: params.outFile,
      blockSummaryFile: params.blockSummaryFile,
      minimalSummaryFile: params.minimalSummaryFile,
      blockEvidenceFile: params.blockEvidenceFile,
      minimalEvidenceFile: params.minimalEvidenceFile,
    })
  );
};
