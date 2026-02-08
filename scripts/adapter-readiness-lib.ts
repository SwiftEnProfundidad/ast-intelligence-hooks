export type ParsedAdapterReport = {
  validationResult?: 'PASS' | 'FAIL';
  nodeCommandNotFound: boolean;
};

export type AdapterReadinessEntry = {
  name: 'adapter';
  status: 'PASS' | 'FAIL' | 'MISSING';
  notes: ReadonlyArray<string>;
};

export type AdapterReadinessSummary = {
  verdict: 'READY' | 'BLOCKED' | 'PENDING';
  adapters: ReadonlyArray<AdapterReadinessEntry>;
  blockers: ReadonlyArray<string>;
  missingInputs: ReadonlyArray<string>;
};

const dedupe = (values: ReadonlyArray<string>): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push(value);
  }

  return result;
};

export const parseAdapterReport = (
  markdown: string
): ParsedAdapterReport => {
  const validationRaw = markdown
    .match(/- Validation result:\s*([^\n]+)/)?.[1]
    ?.trim()
    .toUpperCase();

  const validationResult =
    validationRaw === 'PASS' || validationRaw === 'FAIL'
      ? (validationRaw as 'PASS' | 'FAIL')
      : undefined;

  const runtimeNodeRaw = markdown
    .match(/- Any `bash: node: command not found`:\s*([^\n]+)/)?.[1]
    ?.trim()
    .toUpperCase();

  const nodeCommandNotFound =
    runtimeNodeRaw === 'YES'
      ? true
      : runtimeNodeRaw === 'NO'
        ? false
        : /node:\s*command not found/i.test(markdown);

  return {
    validationResult,
    nodeCommandNotFound,
  };
};

export const summarizeAdapterReadiness = (params: {
  hasAdapterReport: boolean;
  adapter?: ParsedAdapterReport;
}): AdapterReadinessSummary => {
  const blockers: string[] = [];
  const missingInputs: string[] = [];
  const adapters: AdapterReadinessEntry[] = [];

  if (!params.hasAdapterReport) {
    missingInputs.push('Missing Adapter adapter report');
    adapters.push({
      name: 'adapter',
      status: 'MISSING',
      notes: ['No Adapter diagnostics report was provided.'],
    });
  } else {
    const notes: string[] = [];
    let status: AdapterReadinessEntry['status'] = 'PASS';

    if (params.adapter?.validationResult !== 'PASS') {
      status = 'FAIL';
      notes.push(
        `Adapter validation result is ${params.adapter?.validationResult ?? 'unknown'}`
      );
      blockers.push(
        `Adapter adapter validation is ${params.adapter?.validationResult ?? 'unknown'}`
      );
    }

    if (params.adapter?.nodeCommandNotFound) {
      status = 'FAIL';
      notes.push('Adapter runtime reports node command resolution failures.');
      blockers.push('Adapter adapter runtime reports `node: command not found`.');
    }

    if (notes.length === 0) {
      notes.push('Adapter adapter diagnostics are healthy.');
    }

    adapters.push({
      name: 'adapter',
      status,
      notes,
    });
  }

  const verdict: AdapterReadinessSummary['verdict'] =
    blockers.length > 0 ? 'BLOCKED' : missingInputs.length > 0 ? 'PENDING' : 'READY';

  return {
    verdict,
    adapters,
    blockers: dedupe(blockers),
    missingInputs: dedupe(missingInputs),
  };
};

export const buildAdapterReadinessMarkdown = (params: {
  generatedAt: string;
  adapterReportPath: string;
  hasAdapterReport: boolean;
  summary: AdapterReadinessSummary;
}): string => {
  const lines: string[] = [];

  lines.push('# Adapter Readiness');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- verdict: ${params.summary.verdict}`);
  lines.push('');

  lines.push('## Inputs');
  lines.push('');
  lines.push(
    `- adapter_report: \`${params.adapterReportPath}\` (${params.hasAdapterReport ? 'found' : 'missing'})`
  );
  lines.push('');

  lines.push('## Adapter Status');
  lines.push('');
  for (const adapter of params.summary.adapters) {
    lines.push(`- ${adapter.name}: ${adapter.status}`);
    for (const note of adapter.notes) {
      lines.push(`  - ${note}`);
    }
  }
  lines.push('');

  lines.push('## Missing Inputs');
  lines.push('');
  if (params.summary.missingInputs.length === 0) {
    lines.push('- none');
  } else {
    for (const missingInput of params.summary.missingInputs) {
      lines.push(`- ${missingInput}`);
    }
  }
  lines.push('');

  lines.push('## Blockers');
  lines.push('');
  if (params.summary.blockers.length === 0) {
    lines.push('- none');
  } else {
    for (const blocker of params.summary.blockers) {
      lines.push(`- ${blocker}`);
    }
  }
  lines.push('');

  lines.push('## Next Actions');
  lines.push('');
  if (params.summary.verdict === 'READY') {
    lines.push('- Adapter diagnostics are healthy.');
    lines.push('- Keep this report attached to rollout validation evidence.');
  } else {
    if (!params.hasAdapterReport) {
      lines.push(
        '- Generate Adapter report: `npm run validation:adapter-real-session-report -- --status-report docs/validation/adapter-session-status.md --out docs/validation/adapter-real-session-report.md`'
      );
    }
    if (
      params.summary.blockers.some(
        (item) => item.includes('Adapter adapter validation') || item.includes('node: command not found')
      )
    ) {
      lines.push(
        '- Execute `docs/validation/adapter-hook-runtime-validation.md`, then regenerate adapter readiness report.'
      );
    }
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};
