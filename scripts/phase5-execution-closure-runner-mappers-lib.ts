import type { Phase5ExecutionClosureCliOptions } from './phase5-execution-closure-runner-contract';

export const toPhase5ExecutionClosureCommandOptions = (
  options: Phase5ExecutionClosureCliOptions
) => ({
  repo: options.repo,
  limit: options.limit,
  outDir: options.outDir,
  runWorkflowLint: options.runWorkflowLint,
  includeAuthPreflight: options.includeAuthPreflight,
  repoPath: options.repoPath,
  actionlintBin: options.actionlintBin,
  includeAdapter: options.includeAdapter,
  requireAdapterReadiness: options.requireAdapterReadiness,
  useMockConsumerTriage: options.useMockConsumerTriage,
});

export const toPhase5ExecutionClosureRunReportOptions = (
  options: Phase5ExecutionClosureCliOptions
) => ({
  outDir: options.outDir,
  limit: options.limit,
  runWorkflowLint: options.runWorkflowLint,
  includeAuthPreflight: options.includeAuthPreflight,
  includeAdapter: options.includeAdapter,
  requireAdapterReadiness: options.requireAdapterReadiness,
  useMockConsumerTriage: options.useMockConsumerTriage,
  repoPathProvided: Boolean(options.repoPath?.trim()),
  actionlintBinProvided: Boolean(options.actionlintBin?.trim()),
});
