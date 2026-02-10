import type { BuildAdapterReadinessMarkdownParams } from './adapter-readiness-contract';

const appendListSection = (params: {
  lines: string[];
  title: string;
  values: ReadonlyArray<string>;
}): void => {
  params.lines.push(params.title);
  params.lines.push('');
  if (params.values.length === 0) {
    params.lines.push('- none');
  } else {
    for (const value of params.values) {
      params.lines.push(`- ${value}`);
    }
  }
  params.lines.push('');
};

export const appendAdapterReadinessHeaderSection = (params: {
  lines: string[];
  source: BuildAdapterReadinessMarkdownParams;
}): void => {
  params.lines.push('# Adapter Readiness');
  params.lines.push('');
  params.lines.push(`- generated_at: ${params.source.generatedAt}`);
  params.lines.push(`- verdict: ${params.source.summary.verdict}`);
  params.lines.push('');
};

export const appendAdapterReadinessInputsSection = (params: {
  lines: string[];
  source: BuildAdapterReadinessMarkdownParams;
}): void => {
  params.lines.push('## Inputs');
  params.lines.push('');
  params.lines.push(
    `- adapter_report: \`${params.source.adapterReportPath}\` (${params.source.hasAdapterReport ? 'found' : 'missing'})`
  );
  params.lines.push('');
};

export const appendAdapterReadinessStatusSection = (params: {
  lines: string[];
  source: BuildAdapterReadinessMarkdownParams;
}): void => {
  params.lines.push('## Adapter Status');
  params.lines.push('');
  for (const adapter of params.source.summary.adapters) {
    params.lines.push(`- ${adapter.name}: ${adapter.status}`);
    for (const note of adapter.notes) {
      params.lines.push(`  - ${note}`);
    }
  }
  params.lines.push('');
};

export const appendAdapterReadinessMissingInputsSection = (params: {
  lines: string[];
  source: BuildAdapterReadinessMarkdownParams;
}): void => {
  appendListSection({
    lines: params.lines,
    title: '## Missing Inputs',
    values: params.source.summary.missingInputs,
  });
};

export const appendAdapterReadinessBlockersSection = (params: {
  lines: string[];
  source: BuildAdapterReadinessMarkdownParams;
}): void => {
  appendListSection({
    lines: params.lines,
    title: '## Blockers',
    values: params.source.summary.blockers,
  });
};
