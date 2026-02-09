import type {
  ConsumerCiArtifactsCliOptions,
  ConsumerCiRunArtifactsResult,
} from './collect-consumer-ci-artifacts-contract';

const toMegabytes = (bytes: number): string => {
  return (bytes / (1024 * 1024)).toFixed(2);
};

export const buildConsumerCiArtifactsReportMarkdown = (params: {
  options: ConsumerCiArtifactsCliOptions;
  runArtifactsResults: ReadonlyArray<ConsumerCiRunArtifactsResult>;
  generatedAt: string;
}): string => {
  const startupFailures = params.runArtifactsResults.filter(
    (entry) => entry.run.conclusion === 'startup_failure'
  );

  const lines: string[] = [];
  lines.push('# Consumer CI Artifact Report');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- repo: \`${params.options.repo}\``);
  lines.push(`- runs_checked: ${params.runArtifactsResults.length}`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(`- startup_failure_runs: ${startupFailures.length}`);
  lines.push(
    `- non_startup_failure_runs: ${params.runArtifactsResults.length - startupFailures.length}`
  );
  lines.push('');

  lines.push('## Runs');
  lines.push('');
  lines.push('| run_id | workflow | event | branch | status | conclusion | artifacts | url |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');

  for (const entry of params.runArtifactsResults) {
    const workflowName =
      entry.run.workflowName || entry.metadata?.name || entry.metadata?.path || '(unknown)';
    const artifactsCount = entry.artifacts?.total_count ?? 0;
    const artifactsCell = entry.errorLabel ? `error: ${entry.errorLabel}` : String(artifactsCount);

    lines.push(
      `| ${entry.run.databaseId} | ${workflowName} | ${entry.run.event} | ${entry.run.headBranch} | ${entry.run.status} | ${entry.run.conclusion ?? 'null'} | ${artifactsCell} | ${entry.run.url} |`
    );

    if (entry.artifacts && entry.artifacts.artifacts.length > 0) {
      for (const artifact of entry.artifacts.artifacts) {
        lines.push(
          `  - artifact \`${artifact.name}\` id=${artifact.id} size_mb=${toMegabytes(artifact.size_in_bytes)} expired=${artifact.expired} expires_at=${artifact.expires_at}`
        );
        lines.push(`    - download_url: ${artifact.archive_download_url}`);
      }
      continue;
    }

    if (entry.metadata?.conclusion === 'startup_failure') {
      lines.push(
        `  - startup_failure details: path=\`${entry.metadata.path}\` referenced_workflows=${entry.metadata.referenced_workflows.length}`
      );
    }
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
};
