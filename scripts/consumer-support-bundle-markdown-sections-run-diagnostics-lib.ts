import type { ConsumerSupportBundleRunDiagnostic } from './consumer-support-bundle-contract';

export const buildRunDiagnosticsSectionLines = (params: {
  diagnostics: ReadonlyArray<ConsumerSupportBundleRunDiagnostic>;
}): string[] => {
  const lines: string[] = [];
  lines.push('## Run Diagnostics');
  lines.push('');
  for (const diagnostic of params.diagnostics) {
    lines.push(`### Run ${diagnostic.run.databaseId}`);
    lines.push('');
    lines.push(`- url: ${diagnostic.run.url}`);
    lines.push(`- workflowName: ${diagnostic.run.workflowName || '(empty)'}`);
    lines.push(`- event: ${diagnostic.run.event}`);
    lines.push(`- conclusion: ${diagnostic.run.conclusion ?? 'null'}`);
    if (diagnostic.metadata) {
      lines.push(`- path: ${diagnostic.metadata.path}`);
      lines.push(
        `- referenced_workflows: ${diagnostic.metadata.referenced_workflows.length}`
      );
    }
    if (typeof diagnostic.jobsCount === 'number') {
      lines.push(`- jobs.total_count: ${diagnostic.jobsCount}`);
    }
    if (typeof diagnostic.artifactsCount === 'number') {
      lines.push(`- artifacts.total_count: ${diagnostic.artifactsCount}`);
    }
    if (diagnostic.error) {
      lines.push(`- error: ${diagnostic.error}`);
    }
    lines.push('');
  }
  return lines;
};
