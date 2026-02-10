import type {
  ConsumerSupportBundleCliOptions,
  ConsumerSupportBundleRepoResponse,
  ConsumerSupportBundleWorkflowRun,
} from './consumer-support-bundle-contract';

const toMarkdownLiteral = (value: string): string => {
  return value.length > 0 ? value : '(empty)';
};

export const buildConsumerSupportBundleHeaderLines = (params: {
  generatedAtIso: string;
  options: ConsumerSupportBundleCliOptions;
  repoInfo?: ConsumerSupportBundleRepoResponse;
  runs: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
  startupFailures: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
  startupStalledRuns: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
}): string[] => {
  const lines: string[] = [];
  lines.push('# Consumer Startup Failure Support Bundle');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAtIso}`);
  lines.push(`- target_repo: \`${params.options.repo}\``);
  if (params.repoInfo) {
    lines.push(
      `- repo_visibility: \`${params.repoInfo.visibility}\` (private=${String(params.repoInfo.private)})`
    );
  }
  lines.push(`- runs_checked: ${params.runs.length}`);
  lines.push(`- startup_failure_runs: ${params.startupFailures.length}`);
  lines.push(`- startup_stalled_runs: ${params.startupStalledRuns.length}`);
  lines.push('');
  return lines;
};

export const buildConsumerSupportBundleAuthSectionLines = (
  authStatus: string
): string[] => {
  const lines: string[] = [];
  lines.push('## GH Auth Status');
  lines.push('');
  lines.push('```text');
  lines.push(toMarkdownLiteral(authStatus.trimEnd()));
  lines.push('```');
  lines.push('');
  return lines;
};
