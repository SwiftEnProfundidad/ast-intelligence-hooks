export type Phase5ExecutionClosureSummary = {
  verdict: 'READY' | 'BLOCKED' | 'MISSING_INPUTS';
  blockers: ReadonlyArray<string>;
  missingInputs: ReadonlyArray<string>;
  warnings: ReadonlyArray<string>;
  phase5BlockersVerdict?: string;
  consumerUnblockVerdict?: string;
  adapterReadinessVerdict?: string;
  requireAdapterReadiness: boolean;
};

const dedupe = (values: ReadonlyArray<string>): string[] => {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    output.push(value);
  }
  return output;
};

export const parseVerdictFromMarkdown = (markdown: string): string | undefined => {
  const raw = markdown.match(/- verdict:\s*([A-Z_]+)/)?.[1]?.trim();
  return raw && raw.length > 0 ? raw : undefined;
};

export const summarizePhase5ExecutionClosure = (params: {
  hasPhase5BlockersReport: boolean;
  hasConsumerUnblockReport: boolean;
  hasAdapterReadinessReport: boolean;
  phase5BlockersVerdict?: string;
  consumerUnblockVerdict?: string;
  adapterReadinessVerdict?: string;
  requireAdapterReadiness: boolean;
}): Phase5ExecutionClosureSummary => {
  const missingInputs: string[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!params.hasPhase5BlockersReport) {
    missingInputs.push('Missing Phase 5 blockers readiness report');
  }
  if (!params.hasConsumerUnblockReport) {
    missingInputs.push('Missing consumer startup unblock status report');
  }
  if (params.requireAdapterReadiness && !params.hasAdapterReadinessReport) {
    missingInputs.push('Missing adapter readiness report');
  }

  if (missingInputs.length === 0) {
    if ((params.phase5BlockersVerdict ?? '').toUpperCase() !== 'READY') {
      blockers.push(
        `Phase 5 blockers readiness verdict is ${params.phase5BlockersVerdict ?? 'unknown'}`
      );
    }
    if ((params.consumerUnblockVerdict ?? '').toUpperCase() !== 'READY_FOR_RETEST') {
      blockers.push(
        `Consumer startup unblock verdict is ${params.consumerUnblockVerdict ?? 'unknown'}`
      );
    }

    const adapterVerdict = (params.adapterReadinessVerdict ?? '').toUpperCase();
    if (params.requireAdapterReadiness) {
      if (adapterVerdict !== 'READY') {
        blockers.push(
          `Adapter readiness verdict is ${params.adapterReadinessVerdict ?? 'unknown'}`
        );
      }
    } else if (params.hasAdapterReadinessReport && adapterVerdict !== 'READY') {
      warnings.push(
        `Adapter readiness is ${params.adapterReadinessVerdict ?? 'unknown'} (not required in current mode)`
      );
    }
  }

  const verdict: Phase5ExecutionClosureSummary['verdict'] =
    missingInputs.length > 0 ? 'MISSING_INPUTS' : blockers.length > 0 ? 'BLOCKED' : 'READY';

  return {
    verdict,
    blockers: dedupe(blockers),
    missingInputs: dedupe(missingInputs),
    warnings: dedupe(warnings),
    phase5BlockersVerdict: params.phase5BlockersVerdict,
    consumerUnblockVerdict: params.consumerUnblockVerdict,
    adapterReadinessVerdict: params.adapterReadinessVerdict,
    requireAdapterReadiness: params.requireAdapterReadiness,
  };
};

export const buildPhase5ExecutionClosureStatusMarkdown = (params: {
  generatedAt: string;
  phase5BlockersReportPath: string;
  consumerUnblockReportPath: string;
  adapterReadinessReportPath: string;
  hasPhase5BlockersReport: boolean;
  hasConsumerUnblockReport: boolean;
  hasAdapterReadinessReport: boolean;
  summary: Phase5ExecutionClosureSummary;
}): string => {
  const lines: string[] = [];

  lines.push('# Phase 5 Execution Closure Status');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- verdict: ${params.summary.verdict}`);
  lines.push('');

  lines.push('## Inputs');
  lines.push('');
  lines.push(
    `- phase5_blockers_report: \`${params.phase5BlockersReportPath}\` (${params.hasPhase5BlockersReport ? 'found' : 'missing'})`
  );
  lines.push(
    `- consumer_unblock_report: \`${params.consumerUnblockReportPath}\` (${params.hasConsumerUnblockReport ? 'found' : 'missing'})`
  );
  lines.push(
    `- adapter_readiness_report: \`${params.adapterReadinessReportPath}\` (${params.hasAdapterReadinessReport ? 'found' : 'missing'})`
  );
  lines.push(
    `- adapter_readiness_required: ${params.summary.requireAdapterReadiness ? 'YES' : 'NO'}`
  );
  lines.push('');

  lines.push('## Parsed Verdicts');
  lines.push('');
  lines.push(`- phase5_blockers: ${params.summary.phase5BlockersVerdict ?? 'unknown'}`);
  lines.push(`- consumer_unblock: ${params.summary.consumerUnblockVerdict ?? 'unknown'}`);
  lines.push(`- adapter_readiness: ${params.summary.adapterReadinessVerdict ?? 'unknown'}`);
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

  lines.push('## Warnings');
  lines.push('');
  if (params.summary.warnings.length === 0) {
    lines.push('- none');
  } else {
    for (const warning of params.summary.warnings) {
      lines.push(`- ${warning}`);
    }
  }
  lines.push('');

  lines.push('## Next Actions');
  lines.push('');
  if (params.summary.verdict === 'READY') {
    lines.push('- Phase 5 execution closure criteria are satisfied.');
    lines.push('- Archive generated reports and update rollout tracker references.');
  } else {
    if (params.summary.verdict === 'MISSING_INPUTS') {
      lines.push('- Generate missing reports first, then re-run this status command.');
    }
    if (params.summary.verdict === 'BLOCKED') {
      lines.push('- Resolve blockers from report inputs and regenerate reports.');
    }
    lines.push('- Re-run: `npm run validation:phase5-execution-closure-status`.');
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};
