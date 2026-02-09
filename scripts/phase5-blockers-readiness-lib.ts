export type ParsedAdapterRealSessionReport = {
  validationResult?: 'PASS' | 'FAIL';
  reTestRequired?: boolean;
  nodeCommandNotFound: boolean;
};

export type ParsedConsumerStartupTriageReport = {
  verdict?: 'READY' | 'BLOCKED';
  requiredFailedSteps: ReadonlyArray<string>;
};

export type Phase5BlockersSummary = {
  verdict: 'READY' | 'BLOCKED' | 'MISSING_INPUTS';
  blockers: ReadonlyArray<string>;
  adapterValidationResult?: 'PASS' | 'FAIL';
  consumerTriageVerdict?: 'READY' | 'BLOCKED';
  adapterRequired: boolean;
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

export const parseAdapterRealSessionReport = (
  markdown: string
): ParsedAdapterRealSessionReport => {
  const validationRaw = markdown
    .match(/- Validation result:\s*([^\n]+)/)?.[1]
    ?.trim()
    .toUpperCase();

  const reTestRaw = markdown
    .match(/- Re-test required:\s*([^\n]+)/)?.[1]
    ?.trim()
    .toUpperCase();

  const validationResult =
    validationRaw === 'PASS' || validationRaw === 'FAIL'
      ? (validationRaw as 'PASS' | 'FAIL')
      : undefined;

  const reTestRequired =
    reTestRaw === 'YES' ? true : reTestRaw === 'NO' ? false : undefined;

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
    reTestRequired,
    nodeCommandNotFound,
  };
};

export const parseConsumerStartupTriageReport = (
  markdown: string
): ParsedConsumerStartupTriageReport => {
  const verdictRaw = markdown
    .match(/- verdict:\s*([^\n]+)/)?.[1]
    ?.trim()
    .toUpperCase();

  const verdict =
    verdictRaw === 'READY' || verdictRaw === 'BLOCKED'
      ? (verdictRaw as 'READY' | 'BLOCKED')
      : undefined;

  const requiredFailedSteps = dedupe(
    (markdown.match(/Resolve failed required step `([^`]+)`/g) ?? [])
      .map((line) => line.match(/`([^`]+)`/)?.[1]?.trim())
      .filter((value): value is string => Boolean(value))
  );

  return {
    verdict,
    requiredFailedSteps,
  };
};

export const summarizePhase5Blockers = (params: {
  hasAdapterReport: boolean;
  hasConsumerTriageReport: boolean;
  adapter?: ParsedAdapterRealSessionReport;
  consumer?: ParsedConsumerStartupTriageReport;
  requireAdapterReport?: boolean;
}): Phase5BlockersSummary => {
  const blockers: string[] = [];
  const missingInputs: string[] = [];
  const adapterRequired = params.requireAdapterReport ?? false;

  if (adapterRequired && !params.hasAdapterReport) {
    missingInputs.push('Missing Adapter real-session report');
  }
  if (!params.hasConsumerTriageReport) {
    missingInputs.push('Missing consumer startup triage report');
  }

  if (missingInputs.length > 0) {
    return {
      verdict: 'MISSING_INPUTS',
      blockers: missingInputs,
      adapterValidationResult: params.adapter?.validationResult,
      consumerTriageVerdict: params.consumer?.verdict,
      adapterRequired,
      missingInputs,
    };
  }

  if (params.hasAdapterReport && params.adapter?.validationResult !== 'PASS') {
    blockers.push(
      `Adapter real-session validation is ${params.adapter?.validationResult ?? 'unknown'}`
    );
  }

  if (params.hasAdapterReport && params.adapter?.nodeCommandNotFound) {
    blockers.push('Adapter runtime still reports node command resolution failures');
  }

  if (params.consumer?.verdict !== 'READY') {
    blockers.push(
      `Consumer startup triage verdict is ${params.consumer?.verdict ?? 'unknown'}`
    );
  }

  for (const step of params.consumer?.requiredFailedSteps ?? []) {
    blockers.push(`Consumer triage required step failed: ${step}`);
  }

  return {
    verdict: blockers.length === 0 ? 'READY' : 'BLOCKED',
    blockers: dedupe(blockers),
    adapterValidationResult: params.adapter?.validationResult,
    consumerTriageVerdict: params.consumer?.verdict,
    adapterRequired,
    missingInputs,
  };
};

export const buildPhase5BlockersReadinessMarkdown = (params: {
  generatedAt: string;
  adapterReportPath: string;
  consumerTriageReportPath: string;
  hasAdapterReport: boolean;
  hasConsumerTriageReport: boolean;
  requireAdapterReport: boolean;
  summary: Phase5BlockersSummary;
}): string => {
  const lines: string[] = [];

  lines.push('# Phase 5 Blockers Readiness');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- verdict: ${params.summary.verdict}`);
  lines.push('');

  lines.push('## Inputs');
  lines.push('');
  lines.push(
    `- adapter_report: \`${params.adapterReportPath}\` (${params.hasAdapterReport ? 'found' : 'missing'})`
  );
  lines.push(`- adapter_required: ${params.requireAdapterReport ? 'YES' : 'NO'}`);
  lines.push(
    `- consumer_triage_report: \`${params.consumerTriageReportPath}\` (${params.hasConsumerTriageReport ? 'found' : 'missing'})`
  );
  lines.push('');

  lines.push('## Signals');
  lines.push('');
  lines.push(
    `- adapter_validation_result: ${params.summary.adapterValidationResult ?? 'unknown'}`
  );
  lines.push(
    `- consumer_triage_verdict: ${params.summary.consumerTriageVerdict ?? 'unknown'}`
  );
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
    lines.push('- Phase 5 blockers are clear for execution closure.');
    lines.push('- Attach this report to release/rollout notes.');
    if (!params.hasAdapterReport) {
      lines.push(
        '- Optional: generate Adapter report for adapter diagnostics traceability (`npm run validation:adapter-real-session-report -- --status-report .audit-reports/adapter/adapter-session-status.md --out .audit-reports/adapter/adapter-real-session-report.md`).'
      );
    }
  } else {
    if (!params.hasAdapterReport && params.requireAdapterReport) {
      lines.push(
        '- Generate Adapter report: `npm run validation:adapter-real-session-report -- --status-report .audit-reports/adapter/adapter-session-status.md --out .audit-reports/adapter/adapter-real-session-report.md`'
      );
    }
    if (!params.hasConsumerTriageReport) {
      lines.push(
        '- Generate consumer triage report: `npm run validation:consumer-startup-triage -- --repo <owner>/<repo> --out-dir .audit-reports/consumer-triage --skip-workflow-lint`'
      );
    }
    if (params.summary.blockers.some((item) => item.includes('Adapter runtime'))) {
      lines.push(
        '- Execute `docs/validation/adapter-hook-runtime-validation.md` in a real Adapter session and regenerate reports.'
      );
    }
    if (
      params.summary.blockers.some(
        (item) => item.includes('Consumer startup triage') || item.includes('Consumer triage required step failed')
      )
    ) {
      lines.push(
        '- Resolve failed consumer triage steps and rerun `validation:consumer-startup-triage` to refresh status.'
      );
    }
    if (!params.hasAdapterReport && !params.requireAdapterReport) {
      lines.push(
        '- Optional: attach Adapter adapter diagnostics when validating IDE-specific integrations.'
      );
    }
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};
