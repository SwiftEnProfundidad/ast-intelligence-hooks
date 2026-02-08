export type ParsedWindsurfAdapterReport = {
  validationResult?: 'PASS' | 'FAIL';
  nodeCommandNotFound: boolean;
};

export type AdapterReadinessEntry = {
  name: 'windsurf';
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

export const parseWindsurfAdapterReport = (
  markdown: string
): ParsedWindsurfAdapterReport => {
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
  hasWindsurfReport: boolean;
  windsurf?: ParsedWindsurfAdapterReport;
}): AdapterReadinessSummary => {
  const blockers: string[] = [];
  const missingInputs: string[] = [];
  const adapters: AdapterReadinessEntry[] = [];

  if (!params.hasWindsurfReport) {
    missingInputs.push('Missing Windsurf adapter report');
    adapters.push({
      name: 'windsurf',
      status: 'MISSING',
      notes: ['No Windsurf diagnostics report was provided.'],
    });
  } else {
    const notes: string[] = [];
    let status: AdapterReadinessEntry['status'] = 'PASS';

    if (params.windsurf?.validationResult !== 'PASS') {
      status = 'FAIL';
      notes.push(
        `Windsurf validation result is ${params.windsurf?.validationResult ?? 'unknown'}`
      );
      blockers.push(
        `Windsurf adapter validation is ${params.windsurf?.validationResult ?? 'unknown'}`
      );
    }

    if (params.windsurf?.nodeCommandNotFound) {
      status = 'FAIL';
      notes.push('Windsurf runtime reports node command resolution failures.');
      blockers.push('Windsurf adapter runtime reports `node: command not found`.');
    }

    if (notes.length === 0) {
      notes.push('Windsurf adapter diagnostics are healthy.');
    }

    adapters.push({
      name: 'windsurf',
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
  windsurfReportPath: string;
  hasWindsurfReport: boolean;
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
    `- windsurf_report: \`${params.windsurfReportPath}\` (${params.hasWindsurfReport ? 'found' : 'missing'})`
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
    if (!params.hasWindsurfReport) {
      lines.push(
        '- Generate Windsurf report: `npm run validation:windsurf-real-session-report -- --status-report docs/validation/windsurf-session-status.md --out docs/validation/windsurf-real-session-report.md`'
      );
    }
    if (
      params.summary.blockers.some(
        (item) => item.includes('Windsurf adapter validation') || item.includes('node: command not found')
      )
    ) {
      lines.push(
        '- Execute `docs/validation/windsurf-hook-runtime-validation.md`, then regenerate adapter readiness report.'
      );
    }
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};
