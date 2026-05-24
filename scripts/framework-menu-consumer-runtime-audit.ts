import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  formatLegacyAstBreakdown,
  formatLegacyEslintAudit,
  formatLegacyFileDiagnostics,
  formatLegacyPatternChecks,
  readLegacyAuditSummary,
  renderLegacyPanel,
  resolveLegacyPanelOuterWidth,
} from './framework-menu-legacy-audit-lib';
import {
  formatEvidenceSummaryForMenu,
  readEvidenceSummaryForMenu,
  type FrameworkMenuEvidenceSummary,
} from './framework-menu-evidence-summary-lib';
import { renderVintageEvidenceReport } from './framework-menu-consumer-runtime-evidence-classic';
import type {
  ConsumerRuntimeBlockedGate,
  ConsumerRuntimeNotificationDependencies,
  ConsumerRuntimeScope,
  ConsumerRuntimeSummaryDependencies,
} from './framework-menu-consumer-runtime-types';

export const resolveConsumerRuntimeUseColor = (): boolean => {
  if (process.env.NO_COLOR === '1') {
    return false;
  }
  return process.stdout.isTTY === true;
};

export const renderConsumerRuntimeSummary = (
  dependencies: ConsumerRuntimeSummaryDependencies
): FrameworkMenuEvidenceSummary => {
  const summary = dependencies.summaryOverride ?? readEvidenceSummaryForMenu(dependencies.repoRoot);
  const canonicalSummary = dependencies.summaryOverride
    ? readEvidenceSummaryForMenu(dependencies.repoRoot)
    : null;
  const lines = [
    formatEvidenceSummaryForMenu(summary),
    '',
    'Consumer runtime snapshot',
    `Files scanned: ${summary.filesScanned}`,
    `Files affected: ${summary.filesAffected}`,
  ];

  const driftLines = canonicalSummary
    ? buildConsumerRuntimeEvidenceDriftLines(summary, canonicalSummary)
    : [];
  if (driftLines.length > 0) {
    lines.push('', ...driftLines);
  }

  if (summary.status === 'ok' && summary.topFindings.length > 0) {
    const primaryFinding = summary.topFindings[0];
    lines.push('', `Primary block: ${primaryFinding.ruleId}`);
  }

  if (summary.topFiles.length > 0) {
    lines.push(
      'Top files',
      ...summary.topFiles.map((entry) => `- ${entry.file} (${entry.count})`)
    );
  }

  dependencies.write(`\n${renderLegacyPanel(lines, {
    width: resolveLegacyPanelOuterWidth(),
    color: dependencies.useColor(),
  })}\n`);

  const vintageSource =
    summary.status === 'ok' && !dependencies.summaryOverride
      ? readEvidenceSummaryForMenu(dependencies.repoRoot, {
        topFindingsLimit: 45,
        topFileLocationsLimit: 15,
        topFilesLimit: 10,
      })
      : summary;
  renderVintageEvidenceReport({
    write: dependencies.write,
    summary: vintageSource,
    useColor: dependencies.useColor,
  });
  return summary;
};

const toPlatformMap = (
  summary: FrameworkMenuEvidenceSummary
): Map<string, number> =>
  new Map((summary.platformAuditRows ?? []).map((row) => [row.platform, row.violations]));

const formatSummaryFinding = (
  finding: FrameworkMenuEvidenceSummary['topFindings'][number] | undefined
): string => {
  if (!finding) {
    return 'none';
  }
  return `[${finding.severity}] ${finding.ruleId} -> ${finding.file}:${finding.line}`;
};

const normalizeBlockedCauseLine = (cause: { line?: number; lines?: ReadonlyArray<number> }): number => {
  if (typeof cause.line === 'number' && Number.isFinite(cause.line) && cause.line > 0) {
    return Math.floor(cause.line);
  }
  const lines = Array.isArray(cause.lines)
    ? cause.lines
      .filter((line) => Number.isFinite(line) && line > 0)
      .map((line) => Math.floor(line))
    : [];
  return lines.length > 0 ? Math.min(...lines) : 1;
};

export const buildConsumerRuntimeEvidenceDriftLines = (
  gateSummary: FrameworkMenuEvidenceSummary,
  canonicalSummary: FrameworkMenuEvidenceSummary
): string[] => {
  const drifts: string[] = [];
  if (canonicalSummary.status !== 'ok') {
    return [
      `⚠ Menu/gate evidence drift: canonical_evidence=${canonicalSummary.status}; using gate blocked summary`,
    ];
  }
  if (gateSummary.stage !== canonicalSummary.stage) {
    drifts.push(`stage gate=${gateSummary.stage ?? 'null'} evidence=${canonicalSummary.stage ?? 'null'}`);
  }
  if (gateSummary.outcome !== canonicalSummary.outcome) {
    drifts.push(`outcome gate=${gateSummary.outcome ?? 'null'} evidence=${canonicalSummary.outcome ?? 'null'}`);
  }
  if (gateSummary.totalFindings !== canonicalSummary.totalFindings) {
    drifts.push(`totalFindings gate=${gateSummary.totalFindings} evidence=${canonicalSummary.totalFindings}`);
  }

  const severityKeys = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
  for (const key of severityKeys) {
    const gateValue = gateSummary.byEnterpriseSeverity?.[key] ?? 0;
    const evidenceValue = canonicalSummary.byEnterpriseSeverity?.[key] ?? 0;
    if (gateValue !== evidenceValue) {
      drifts.push(`severity.${key} gate=${gateValue} evidence=${evidenceValue}`);
    }
  }

  const gatePlatforms = toPlatformMap(gateSummary);
  const evidencePlatforms = toPlatformMap(canonicalSummary);
  const platformNames = [...new Set([...gatePlatforms.keys(), ...evidencePlatforms.keys()])].sort();
  for (const platform of platformNames) {
    const gateValue = gatePlatforms.get(platform) ?? 0;
    const evidenceValue = evidencePlatforms.get(platform) ?? 0;
    if (gateValue !== evidenceValue) {
      drifts.push(`platform.${platform} gate=${gateValue} evidence=${evidenceValue}`);
    }
  }

  const topFindingCount = Math.max(
    gateSummary.topFindings.length,
    canonicalSummary.topFindings.length
  );
  for (let index = 0; index < topFindingCount; index += 1) {
    const gateFinding = formatSummaryFinding(gateSummary.topFindings[index]);
    const evidenceFinding = formatSummaryFinding(canonicalSummary.topFindings[index]);
    if (gateFinding !== evidenceFinding) {
      drifts.push(`topFinding.${index} gate=${gateFinding} evidence=${evidenceFinding}`);
    }
  }

  if (drifts.length === 0) {
    return [];
  }
  return [
    '⚠ Menu/gate evidence drift detected',
    'Diagnostic code: MENU_GATE_EVIDENCE_DRIFT',
    'Diagnostic severity: HIGH',
    ...drifts.map((drift) => `- ${drift}`),
  ];
};

export const printPrePushTrackedEvidenceDiskHint = (params: {
  write: ConsumerRuntimeSummaryDependencies['write'];
}): void => {
  params.write(
    '\n' +
      [
        'ℹ PRE_PUSH + `.ai_evidence.json` tracked: on PASS/WARN the gate may skip rewriting the file on disk',
        '  (avoids dirty tracked evidence). Local dev: PUMUKI_PRE_PUSH_ALWAYS_WRITE_TRACKED_EVIDENCE=1 forces disk write.',
      ].join('\n') +
      '\n'
  );
};

export const buildConsumerRuntimeBlockedSummary = (
  blocked: ConsumerRuntimeBlockedGate
): FrameworkMenuEvidenceSummary => {
  const normalizedCause = blocked.causeCode.toLowerCase();
  const inferredPlatform = normalizedCause.includes('backend')
    ? 'Backend'
    : normalizedCause.includes('frontend') || normalizedCause.includes('web')
      ? 'Frontend'
      : normalizedCause.includes('ios')
        ? 'iOS'
        : normalizedCause.includes('android')
          ? 'Android'
        : null;
  const blockingCauses = blocked.blockingCauses ?? [];
  const topFindings =
    blockingCauses.length > 0
      ? blockingCauses.map((cause) => ({
          severity: 'HIGH' as const,
          ruleId: cause.ruleId ?? cause.code,
          file: cause.file ?? 'PROJECT_ROOT',
          line: normalizeBlockedCauseLine(cause),
        }))
      : [
          {
            severity: 'HIGH' as const,
            ruleId: blocked.causeCode,
            file: 'PROJECT_ROOT',
            line: 1,
          },
        ];
  const topFiles = new Map<string, number>();
  for (const finding of topFindings) {
    topFiles.set(finding.file, (topFiles.get(finding.file) ?? 0) + 1);
  }
  const platformCounts = new Map<string, number>();
  const inferPlatform = (value: string): string | null => {
    const normalized = value.toLowerCase();
    if (normalized.includes('backend')) {
      return 'Backend';
    }
    if (normalized.includes('frontend') || normalized.includes('/web/') || normalized.includes('web')) {
      return 'Frontend';
    }
    if (normalized.includes('ios')) {
      return 'iOS';
    }
    if (normalized.includes('android')) {
      return 'Android';
    }
    return null;
  };
  if (blockingCauses.length > 0) {
    for (const cause of blockingCauses) {
      const platform = inferPlatform(`${cause.ruleId ?? cause.code} ${cause.file ?? ''}`);
      if (platform) {
        platformCounts.set(platform, (platformCounts.get(platform) ?? 0) + 1);
      }
    }
  } else if (inferredPlatform) {
    platformCounts.set(inferredPlatform, blocked.totalViolations);
  }
  return {
    status: 'ok',
    stage: blocked.stage,
    outcome: 'BLOCK',
    totalFindings: blocked.totalViolations,
    filesScanned: 0,
    filesAffected: 0,
    bySeverity: {
      CRITICAL: 0,
      ERROR: 1,
      WARN: 0,
      INFO: 0,
    },
    byEnterpriseSeverity: {
      CRITICAL: 0,
      HIGH: 1,
      MEDIUM: 0,
      LOW: 0,
    },
    topFiles: [
      ...topFiles.entries(),
    ].map(([file, count]) => ({
      file,
      count,
    })),
    topFileLocations: topFindings.map((finding) => ({
      file: finding.file,
      line: finding.line,
    })),
    topFindings,
    platformAuditRows: [...platformCounts.entries()].map(([platform, violations]) => ({
      platform,
      violations,
    })),
  };
};

export const buildConsumerRuntimeBlockedCauseLines = (
  blocked: ConsumerRuntimeBlockedGate
): string[] => {
  const causes = blocked.blockingCauses ?? [];
  if (causes.length === 0) {
    return [
      `🔴 Gate blocked: ${blocked.causeCode}`,
      `Cause: ${blocked.causeMessage}`,
      `Solution: ${blocked.remediation}`,
    ];
  }
  return [
    `🔴 Gate blocked: ${blocked.causeCode}`,
    `Blocking causes: ${causes.length}`,
    ...causes.flatMap((cause, index) => [
      `${index + 1}. ${cause.ruleId ?? cause.code}${cause.file ? ` @ ${cause.file}` : ''}`,
      `   Cause: ${cause.message}`,
      `   Solution: ${cause.remediation ?? blocked.remediation}`,
    ]),
  ];
};

export const printConsumerRuntimeEmptyScopeHint = (
  dependencies: Pick<ConsumerRuntimeSummaryDependencies, 'write'>,
  summary: FrameworkMenuEvidenceSummary,
  scope: ConsumerRuntimeScope
): void => {
  if (
    summary.status !== 'ok'
    || summary.filesScanned > 0
    || summary.outcome !== 'PASS'
  ) {
    return;
  }
  if (scope === 'staged') {
    dependencies.write(
      '\nℹ Scope vacío (staged): no hay archivos soportados en staged para auditar. Resultado PASS por alcance vacío; usa 1, 2 o 14 (repo completo) según necesidad.\n'
    );
    return;
  }
  if (scope === 'unstaged') {
    dependencies.write(
      '\nℹ Scope vacío (unstaged): no hay cambios sin stage ni untracked auditable. Resultado PASS por alcance vacío; usa 1, 14 u opciones 11–13 según el alcance que necesites.\n'
    );
    return;
  }
  dependencies.write(
    '\nℹ Scope vacío (working tree): no hay archivos soportados en staged/unstaged para auditar. Resultado PASS por alcance vacío; usa 1, 2, 13 o 14 según el alcance que necesites.\n'
  );
};

export const notifyConsumerRuntimeAuditSummary = (
  dependencies: ConsumerRuntimeNotificationDependencies,
  summary: FrameworkMenuEvidenceSummary
): void => {
  if (summary.status !== 'ok') {
    return;
  }
  const byEnterpriseSeverity = summary.byEnterpriseSeverity;
  dependencies.emitNotification({
    event: {
      kind: 'audit.summary',
      totalViolations: summary.totalFindings,
      criticalViolations: byEnterpriseSeverity?.CRITICAL ?? summary.bySeverity.CRITICAL,
      highViolations: byEnterpriseSeverity?.HIGH ?? summary.bySeverity.ERROR,
    },
    repoRoot: dependencies.repoRoot,
  });
};

export const renderConsumerRuntimePatternChecks = (repoRoot: string): string =>
  formatLegacyPatternChecks(readLegacyAuditSummary(repoRoot));

export const renderConsumerRuntimeEslintAudit = (repoRoot: string): string =>
  formatLegacyEslintAudit(readLegacyAuditSummary(repoRoot));

export const renderConsumerRuntimeAstBreakdown = (repoRoot: string): string =>
  formatLegacyAstBreakdown(readLegacyAuditSummary(repoRoot));

export const renderConsumerRuntimeFileDiagnostics = (repoRoot: string): string =>
  formatLegacyFileDiagnostics(readLegacyAuditSummary(repoRoot));

const buildClickableFindingsSection = (
  summary: FrameworkMenuEvidenceSummary
): string => {
  if (summary.topFindings.length === 0) {
    return '- none';
  }

  return summary.topFindings
    .map((finding) => {
      const safePath = encodeURI(finding.file.replace(/\\/g, '/').replace(/^\.\//, ''));
      return `- [${finding.severity}] ${finding.ruleId} -> [${finding.file}:${finding.line}](./${safePath}#L${finding.line})`;
    })
    .join('\n');
};

const buildClickableTopFilesSection = (
  summary: FrameworkMenuEvidenceSummary
): string => {
  if (summary.topFileLocations.length === 0) {
    return '- none';
  }

  return summary.topFileLocations
    .map((entry) => {
      const safePath = encodeURI(entry.file.replace(/\\/g, '/').replace(/^\.\//, ''));
      return `- [${entry.file}:${entry.line}](./${safePath}#L${entry.line})`;
    })
    .join('\n');
};

const buildConsumerRuntimeMarkdownDocument = (
  summary: FrameworkMenuEvidenceSummary
): string => {
  const stage = summary.stage ?? 'unknown';
  const outcome = summary.outcome ?? 'unknown';
  const byEnterpriseSeverity = summary.byEnterpriseSeverity;

  return [
    '# PUMUKI Legacy Read-Only Evidence Snapshot',
    '',
    'Derived from the canonical evidence summary. This document does not redefine the gate verdict.',
    '',
    '## Snapshot',
    `- Stage: \`${stage}\``,
    `- Outcome: \`${outcome}\``,
    `- Total violations: \`${summary.totalFindings}\``,
    `- Files scanned: \`${summary.filesScanned}\``,
    `- Files affected: \`${summary.filesAffected}\``,
    `- Severity: \`CRITICAL ${byEnterpriseSeverity?.CRITICAL ?? summary.bySeverity.CRITICAL} | HIGH ${byEnterpriseSeverity?.HIGH ?? summary.bySeverity.ERROR} | MEDIUM ${byEnterpriseSeverity?.MEDIUM ?? summary.bySeverity.WARN} | LOW ${byEnterpriseSeverity?.LOW ?? summary.bySeverity.INFO}\``,
    '- Mode: `legacy read-only`',
    '- Canonical verdict: `pumuki status --json | doctor --deep --json`',
    '',
    '## Clickable Top Files',
    buildClickableTopFilesSection(summary),
    '',
    '## Clickable Findings',
    buildClickableFindingsSection(summary),
    '',
  ].join('\n');
};

export const exportConsumerRuntimeMarkdown = (
  repoRoot: string = process.cwd(),
  summaryOverride?: FrameworkMenuEvidenceSummary | null
): string => {
  const outputPath = join(repoRoot, '.audit-reports', 'pumuki-legacy-audit.md');
  mkdirSync(join(outputPath, '..'), { recursive: true });
  writeFileSync(
    outputPath,
    buildConsumerRuntimeMarkdownDocument(summaryOverride ?? readEvidenceSummaryForMenu(repoRoot)),
    'utf8'
  );
  return outputPath;
};
