const tsxCommandPrefix = (scriptPath: string): string[] => {
  return ['--yes', 'tsx@4.21.0', scriptPath];
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
    ...tsxCommandPrefix(params.scriptPath),
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
    ...tsxCommandPrefix(params.scriptPath),
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
