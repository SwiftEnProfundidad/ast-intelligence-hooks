export type ParsedWindsurfRealSessionReport = {
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
  windsurfValidationResult?: 'PASS' | 'FAIL';
  consumerTriageVerdict?: 'READY' | 'BLOCKED';
  windsurfRequired: boolean;
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

export const parseWindsurfRealSessionReport = (
  markdown: string
): ParsedWindsurfRealSessionReport => {
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
  hasWindsurfReport: boolean;
  hasConsumerTriageReport: boolean;
  windsurf?: ParsedWindsurfRealSessionReport;
  consumer?: ParsedConsumerStartupTriageReport;
  requireWindsurfReport?: boolean;
}): Phase5BlockersSummary => {
  const blockers: string[] = [];
  const missingInputs: string[] = [];
  const windsurfRequired = params.requireWindsurfReport ?? false;

  if (windsurfRequired && !params.hasWindsurfReport) {
    missingInputs.push('Missing Windsurf real-session report');
  }
  if (!params.hasConsumerTriageReport) {
    missingInputs.push('Missing consumer startup triage report');
  }

  if (missingInputs.length > 0) {
    return {
      verdict: 'MISSING_INPUTS',
      blockers: missingInputs,
      windsurfValidationResult: params.windsurf?.validationResult,
      consumerTriageVerdict: params.consumer?.verdict,
      windsurfRequired,
      missingInputs,
    };
  }

  if (params.hasWindsurfReport && params.windsurf?.validationResult !== 'PASS') {
    blockers.push(
      `Windsurf real-session validation is ${params.windsurf?.validationResult ?? 'unknown'}`
    );
  }

  if (params.hasWindsurfReport && params.windsurf?.nodeCommandNotFound) {
    blockers.push('Windsurf runtime still reports node command resolution failures');
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
    windsurfValidationResult: params.windsurf?.validationResult,
    consumerTriageVerdict: params.consumer?.verdict,
    windsurfRequired,
    missingInputs,
  };
};

export const buildPhase5BlockersReadinessMarkdown = (params: {
  generatedAt: string;
  windsurfReportPath: string;
  consumerTriageReportPath: string;
  hasWindsurfReport: boolean;
  hasConsumerTriageReport: boolean;
  requireWindsurfReport: boolean;
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
    `- windsurf_report: \`${params.windsurfReportPath}\` (${params.hasWindsurfReport ? 'found' : 'missing'})`
  );
  lines.push(`- windsurf_required: ${params.requireWindsurfReport ? 'YES' : 'NO'}`);
  lines.push(
    `- consumer_triage_report: \`${params.consumerTriageReportPath}\` (${params.hasConsumerTriageReport ? 'found' : 'missing'})`
  );
  lines.push('');

  lines.push('## Signals');
  lines.push('');
  lines.push(
    `- windsurf_validation_result: ${params.summary.windsurfValidationResult ?? 'unknown'}`
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
    if (!params.hasWindsurfReport) {
      lines.push(
        '- Optional: generate Windsurf report for adapter diagnostics traceability (`npm run validation:windsurf-real-session-report -- --status-report docs/validation/windsurf-session-status.md --out docs/validation/windsurf-real-session-report.md`).'
      );
    }
  } else {
    if (!params.hasWindsurfReport && params.requireWindsurfReport) {
      lines.push(
        '- Generate Windsurf report: `npm run validation:windsurf-real-session-report -- --status-report docs/validation/windsurf-session-status.md --out docs/validation/windsurf-real-session-report.md`'
      );
    }
    if (!params.hasConsumerTriageReport) {
      lines.push(
        '- Generate consumer triage report: `npm run validation:consumer-startup-triage -- --repo <owner>/<repo> --out-dir docs/validation --skip-workflow-lint`'
      );
    }
    if (params.summary.blockers.some((item) => item.includes('Windsurf runtime'))) {
      lines.push(
        '- Execute `docs/validation/windsurf-hook-runtime-validation.md` in a real Windsurf session and regenerate reports.'
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
    if (!params.hasWindsurfReport && !params.requireWindsurfReport) {
      lines.push(
        '- Optional: attach Windsurf adapter diagnostics when validating IDE-specific integrations.'
      );
    }
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};
