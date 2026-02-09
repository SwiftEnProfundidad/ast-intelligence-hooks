export const buildAdapterRealSessionReportCommandArgs = (params: {
  scriptPath: string;
  statusReportFile: string;
  outFile: string;
}): string[] => {
  return [
    '--yes',
    'tsx@4.21.0',
    params.scriptPath,
    '--status-report',
    params.statusReportFile,
    '--out',
    params.outFile,
  ];
};

export const buildConsumerStartupTriageCommandArgs = (params: {
  scriptPath: string;
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  repoPath?: string;
  actionlintBin?: string;
}): string[] => {
  const args = [
    '--yes',
    'tsx@4.21.0',
    params.scriptPath,
    '--repo',
    params.repo,
    '--limit',
    String(params.limit),
    '--out-dir',
    params.outDir,
  ];

  if (!params.runWorkflowLint) {
    args.push('--skip-workflow-lint');
    return args;
  }

  if (params.repoPath) {
    args.push('--repo-path', params.repoPath);
  }

  if (params.actionlintBin) {
    args.push('--actionlint-bin', params.actionlintBin);
  }

  return args;
};

export const buildMockConsumerAbReportCommandArgs = (params: {
  scriptPath: string;
  repo: string;
  outFile: string;
  blockSummaryFile: string;
  minimalSummaryFile: string;
  blockEvidenceFile: string;
  minimalEvidenceFile: string;
}): string[] => {
  return [
    '--yes',
    'tsx@4.21.0',
    params.scriptPath,
    '--repo',
    params.repo,
    '--out',
    params.outFile,
    '--block-summary',
    params.blockSummaryFile,
    '--minimal-summary',
    params.minimalSummaryFile,
    '--block-evidence',
    params.blockEvidenceFile,
    '--minimal-evidence',
    params.minimalEvidenceFile,
  ];
};

export const buildValidationDocsHygieneCommandArgs = (params: {
  scriptPath: string;
}): string[] => {
  return [
    '--yes',
    'tsx@4.21.0',
    params.scriptPath,
  ];
};

export const buildCleanValidationArtifactsCommandArgs = (params: {
  scriptPath: string;
  dryRun: boolean;
}): string[] => {
  const args = [
    '--yes',
    'tsx@4.21.0',
    params.scriptPath,
  ];

  if (params.dryRun) {
    args.push('--dry-run');
  }

  return args;
};

export const buildPhase5BlockersReadinessCommandArgs = (params: {
  scriptPath: string;
  adapterReportFile: string;
  consumerTriageReportFile: string;
  outFile: string;
}): string[] => {
  return [
    '--yes',
    'tsx@4.21.0',
    params.scriptPath,
    '--adapter-report',
    params.adapterReportFile,
    '--consumer-triage-report',
    params.consumerTriageReportFile,
    '--out',
    params.outFile,
  ];
};

export const buildPhase5ExecutionClosureStatusCommandArgs = (params: {
  scriptPath: string;
  phase5BlockersReportFile: string;
  consumerUnblockReportFile: string;
  adapterReadinessReportFile: string;
  outFile: string;
  requireAdapterReadiness: boolean;
}): string[] => {
  const args = [
    '--yes',
    'tsx@4.21.0',
    params.scriptPath,
    '--phase5-blockers-report',
    params.phase5BlockersReportFile,
    '--consumer-unblock-report',
    params.consumerUnblockReportFile,
    '--adapter-readiness-report',
    params.adapterReadinessReportFile,
    '--out',
    params.outFile,
  ];

  if (params.requireAdapterReadiness) {
    args.push('--require-adapter-readiness');
  }

  return args;
};

export const buildPhase5ExternalHandoffCommandArgs = (params: {
  scriptPath: string;
  repo: string;
  phase5StatusReportFile: string;
  phase5BlockersReportFile: string;
  consumerUnblockReportFile: string;
  mockAbReportFile: string;
  runReportFile: string;
  outFile: string;
  artifactUrls: ReadonlyArray<string>;
  requireArtifactUrls: boolean;
  requireMockAbReport: boolean;
}): string[] => {
  const args = [
    '--yes',
    'tsx@4.21.0',
    params.scriptPath,
    '--repo',
    params.repo,
    '--phase5-status-report',
    params.phase5StatusReportFile,
    '--phase5-blockers-report',
    params.phase5BlockersReportFile,
    '--consumer-unblock-report',
    params.consumerUnblockReportFile,
    '--mock-ab-report',
    params.mockAbReportFile,
    '--run-report',
    params.runReportFile,
    '--out',
    params.outFile,
  ];

  for (const url of params.artifactUrls) {
    args.push('--artifact-url', url);
  }

  if (params.requireArtifactUrls) {
    args.push('--require-artifact-urls');
  }

  if (params.requireMockAbReport) {
    args.push('--require-mock-ab-report');
  }

  return args;
};

export const buildPhase5ExecutionClosureCommandArgs = (params: {
  scriptPath: string;
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  includeAuthPreflight: boolean;
  repoPath?: string;
  actionlintBin?: string;
  includeAdapter: boolean;
  requireAdapterReadiness: boolean;
  useMockConsumerTriage: boolean;
}): string[] => {
  const args = [
    '--yes',
    'tsx@4.21.0',
    params.scriptPath,
    '--repo',
    params.repo,
    '--limit',
    String(params.limit),
    '--out-dir',
    params.outDir,
  ];

  if (!params.runWorkflowLint) {
    args.push('--skip-workflow-lint');
  } else {
    if (params.repoPath) {
      args.push('--repo-path', params.repoPath);
    }

    if (params.actionlintBin) {
      args.push('--actionlint-bin', params.actionlintBin);
    }
  }

  if (!params.includeAuthPreflight) {
    args.push('--skip-auth-preflight');
  }

  if (!params.includeAdapter) {
    args.push('--skip-adapter');
  }

  if (params.requireAdapterReadiness) {
    args.push('--require-adapter-readiness');
  }

  if (params.useMockConsumerTriage) {
    args.push('--mock-consumer');
  }

  return args;
};

export const buildAdapterReadinessCommandArgs = (params: {
  scriptPath: string;
  adapterReportFile: string;
  outFile: string;
}): string[] => {
  return [
    '--yes',
    'tsx@4.21.0',
    params.scriptPath,
    '--adapter-report',
    params.adapterReportFile,
    '--out',
    params.outFile,
  ];
};

export const buildSkillsLockCheckCommandArgs = (): string[] => {
  return [
    'run',
    'skills:lock:check',
  ];
};
