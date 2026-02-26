import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { runLifecycleDoctor, type LifecycleDoctorReport } from './doctor';
import { runLifecycleInstall } from './install';
import { runLifecycleRemove } from './remove';
import { readLifecycleStatus } from './status';
import { runLifecycleUninstall } from './uninstall';
import { runLifecycleUpdate } from './update';
import { runLifecycleAdapterInstall, type AdapterAgent } from './adapter';
import {
  closeSddSession,
  evaluateSddPolicy,
  openSddSession,
  readSddStatus,
  refreshSddSession,
  type SddStage,
} from '../sdd';
import { evaluateAiGate } from '../gate/evaluateAiGate';
import { runEnterpriseAiGateCheck } from '../mcp/aiGateCheck';
import { emitAuditSummaryNotificationFromAiGate } from '../notifications/emitAuditSummaryNotification';
import { buildLocalHotspotsReport, type LocalHotspotsReport } from './analyticsHotspots';
import { resolveHotspotsSaasIngestionAuditPath } from './saasIngestionAudit';
import { readHotspotsSaasIngestionPayload } from './saasIngestionContract';
import {
  buildHotspotsSaasIngestionMetrics,
  readHotspotsSaasIngestionAuditEvents,
  writeHotspotsSaasIngestionMetrics,
} from './saasIngestionMetrics';

type LifecycleCommand =
  | 'install'
  | 'uninstall'
  | 'remove'
  | 'update'
  | 'doctor'
  | 'status'
  | 'sdd'
  | 'adapter'
  | 'analytics';

type SddCommand = 'status' | 'validate' | 'session';
type AnalyticsCommand = 'hotspots';
type AnalyticsHotspotsCommand = 'report' | 'diagnose';

type SddSessionAction = 'open' | 'refresh' | 'close';

type ParsedArgs = {
  command: LifecycleCommand;
  purgeArtifacts: boolean;
  updateSpec?: string;
  json: boolean;
  sddCommand?: SddCommand;
  sddStage?: SddStage;
  sddSessionAction?: SddSessionAction;
  sddChangeId?: string;
  sddTtlMinutes?: number;
  adapterCommand?: 'install';
  adapterAgent?: AdapterAgent;
  adapterDryRun?: boolean;
  analyticsCommand?: AnalyticsCommand;
  analyticsHotspotsCommand?: AnalyticsHotspotsCommand;
  analyticsTopN?: number;
  analyticsSinceDays?: number;
  analyticsJsonOutputPath?: string;
  analyticsMarkdownOutputPath?: string;
};

const HELP_TEXT = `
Pumuki lifecycle commands:
  pumuki install
  pumuki uninstall [--purge-artifacts]
  pumuki remove
  pumuki update [--latest|--spec=<package-spec>]
  pumuki doctor
  pumuki status
  pumuki adapter install --agent=<name> [--dry-run] [--json]
  pumuki analytics hotspots report [--top=<n>] [--since-days=<n>] [--json] [--output-json=<path>] [--output-markdown=<path>]
  pumuki analytics hotspots diagnose [--json]
  pumuki sdd status [--json]
  pumuki sdd validate [--stage=PRE_WRITE|PRE_COMMIT|PRE_PUSH|CI] [--json]
  pumuki sdd session --open --change=<change-id> [--ttl-minutes=<n>] [--json]
  pumuki sdd session --refresh [--ttl-minutes=<n>] [--json]
  pumuki sdd session --close [--json]
`.trim();

const writeInfo = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

const writeError = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

const withOptionalLocation = (message: string, location?: string): string => {
  if (!location || location.trim().length === 0) {
    return message;
  }
  return `${message} -> ${location}`;
};

const isLifecycleCommand = (value: string): value is LifecycleCommand =>
  value === 'install' ||
  value === 'uninstall' ||
  value === 'remove' ||
  value === 'update' ||
  value === 'doctor' ||
  value === 'status' ||
  value === 'sdd' ||
  value === 'adapter' ||
  value === 'analytics';

const parseAdapterAgent = (value?: string): AdapterAgent => {
  const normalized = (value ?? '').trim();
  if (/^[a-z0-9._-]+$/i.test(normalized)) {
    return normalized;
  }
  throw new Error(`Unsupported adapter agent "${value}". Use an alphanumeric id.`);
};

const parseSddStage = (value?: string): SddStage => {
  const normalized = (value ?? 'PRE_COMMIT').trim().toUpperCase();
  if (
    normalized === 'PRE_WRITE' ||
    normalized === 'PRE_COMMIT' ||
    normalized === 'PRE_PUSH' ||
    normalized === 'CI'
  ) {
    return normalized;
  }
  throw new Error(`Unsupported SDD stage "${value}". Use PRE_WRITE, PRE_COMMIT, PRE_PUSH or CI.`);
};

const parseOutputPathFlag = (value: string, flagName: '--output-json' | '--output-markdown'): string => {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error(`Invalid ${flagName} value "${value}".`);
  }
  return normalized;
};

const toLocalOutputAbsolutePath = (repoRoot: string, candidatePath: string): string => {
  const repoRootAbsolute = resolve(repoRoot);
  const resolved = isAbsolute(candidatePath) ? resolve(candidatePath) : resolve(repoRootAbsolute, candidatePath);
  const rel = relative(repoRootAbsolute, resolved);
  if (rel === '..' || rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) || isAbsolute(rel)) {
    throw new Error(`Output path "${candidatePath}" must stay inside repo root.`);
  }
  return resolved;
};

const formatHotspotsMarkdownReport = (report: LocalHotspotsReport): string => {
  const lines: string[] = [];
  lines.push('# Pumuki Hotspots Report');
  lines.push('');
  lines.push(`- Generated At: ${report.generatedAt}`);
  lines.push(`- Repo Root: ${report.repoRoot}`);
  lines.push(`- Top N: ${report.options.topN}`);
  lines.push(`- Since Days: ${report.options.sinceDays}`);
  lines.push(`- Ranked: ${report.totals.ranked}`);
  lines.push('');
  if (report.hotspots.length === 0) {
    lines.push('No hotspots found.');
    lines.push('');
    return lines.join('\n');
  }
  lines.push('| Rank | Path | Raw Score | Normalized | Findings | C | H | M | L | Commits | Churn Lines | Authors |');
  lines.push('| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const hotspot of report.hotspots) {
    lines.push(
      `| ${hotspot.rank} | ${hotspot.path} | ${hotspot.rawScore} | ${hotspot.normalizedScore} | ${hotspot.findingsTotal} | ${hotspot.findingsByEnterpriseSeverity.CRITICAL} | ${hotspot.findingsByEnterpriseSeverity.HIGH} | ${hotspot.findingsByEnterpriseSeverity.MEDIUM} | ${hotspot.findingsByEnterpriseSeverity.LOW} | ${hotspot.churnCommits} | ${hotspot.churnTotalLines} | ${hotspot.churnDistinctAuthors} |`
    );
  }
  lines.push('');
  return lines.join('\n');
};

type HotspotsPublishDiagnosticsIssue = {
  severity: 'warning' | 'error';
  code: string;
  message: string;
};

type HotspotsPublishDiagnostics = {
  generated_at: string;
  repo_root: string;
  status: 'healthy' | 'degraded' | 'blocked';
  contract: {
    status: 'missing' | 'invalid' | 'valid';
    path: string;
    reason?: string;
    source_version?: string;
    tenant_id?: string;
    repository_id?: string;
    payload_hash?: string;
  };
  audit: {
    path: string;
    events: number;
    latest_event?: {
      event_id: string;
      event_at: string;
      outcome: 'success' | 'error';
      attempts: number;
      latency_ms: number;
      status?: number;
      error_code?: string;
      retryable?: boolean;
    };
  };
  metrics: {
    path: string;
    snapshot: ReturnType<typeof buildHotspotsSaasIngestionMetrics>;
  };
  issues: ReadonlyArray<HotspotsPublishDiagnosticsIssue>;
};

const buildHotspotsPublishDiagnostics = (repoRoot: string): HotspotsPublishDiagnostics => {
  const generatedAt = new Date().toISOString();
  const contractRead = readHotspotsSaasIngestionPayload(repoRoot);
  const auditEvents = readHotspotsSaasIngestionAuditEvents(repoRoot);
  const auditPath = resolveHotspotsSaasIngestionAuditPath(repoRoot);
  const latestEvent =
    auditEvents.length === 0 ? undefined : auditEvents[auditEvents.length - 1];
  const metricsSnapshot = buildHotspotsSaasIngestionMetrics({
    repoRoot,
    generatedAt,
  });
  const metricsPath = writeHotspotsSaasIngestionMetrics({
    repoRoot,
    metrics: metricsSnapshot,
  });
  const issues: HotspotsPublishDiagnosticsIssue[] = [];
  if (contractRead.kind === 'missing') {
    issues.push({
      severity: 'warning',
      code: 'CONTRACT_MISSING',
      message: 'No contract payload found for SaaS ingestion diagnostics.',
    });
  } else if (contractRead.kind === 'invalid') {
    issues.push({
      severity: 'error',
      code: 'CONTRACT_INVALID',
      message: contractRead.reason,
    });
  }
  if (auditEvents.length === 0) {
    issues.push({
      severity: 'warning',
      code: 'AUDIT_EMPTY',
      message: 'No SaaS ingestion audit events were found.',
    });
  }
  if (metricsSnapshot.totals.error > 0) {
    issues.push({
      severity: 'error',
      code: 'PUBLISH_ERRORS_PRESENT',
      message: `Detected ${metricsSnapshot.totals.error} failed publish events.`,
    });
  }
  const hasBlockingIssues = issues.some((issue) => issue.severity === 'error');
  const status: HotspotsPublishDiagnostics['status'] = hasBlockingIssues
    ? 'blocked'
    : issues.length > 0
      ? 'degraded'
      : 'healthy';
  const contract: HotspotsPublishDiagnostics['contract'] =
    contractRead.kind === 'valid'
      ? {
        status: 'valid',
        path: contractRead.path,
        source_version: contractRead.integrity.source_version,
        tenant_id: contractRead.contract.tenant_id,
        repository_id: contractRead.contract.repository.repository_id,
        payload_hash: contractRead.contract.integrity.payload_hash,
      }
      : contractRead.kind === 'missing'
        ? {
          status: 'missing',
          path: contractRead.path,
        }
        : {
          status: 'invalid',
          path: contractRead.path,
          reason: contractRead.reason,
        };

  return {
    generated_at: generatedAt,
    repo_root: repoRoot,
    status,
    contract,
    audit: {
      path: auditPath,
      events: auditEvents.length,
      latest_event: latestEvent
        ? {
          event_id: latestEvent.event_id,
          event_at: latestEvent.event_at,
          outcome: latestEvent.outcome,
          attempts: latestEvent.attempts,
          latency_ms: latestEvent.latency_ms,
          status: latestEvent.status,
          error_code: latestEvent.error_code,
          retryable: latestEvent.retryable,
        }
        : undefined,
    },
    metrics: {
      path: metricsPath,
      snapshot: metricsSnapshot,
    },
    issues,
  };
};

const printHotspotsPublishDiagnostics = (diagnostics: HotspotsPublishDiagnostics): void => {
  writeInfo(
    `[pumuki][analytics][saas] status=${diagnostics.status} issues=${diagnostics.issues.length}`
  );
  writeInfo(
    `[pumuki][analytics][saas] contract: status=${diagnostics.contract.status} path=${diagnostics.contract.path}`
  );
  if (diagnostics.contract.status === 'valid') {
    writeInfo(
      `[pumuki][analytics][saas] contract tenant=${diagnostics.contract.tenant_id} repo=${diagnostics.contract.repository_id} version=${diagnostics.contract.source_version}`
    );
  }
  if (diagnostics.contract.status === 'invalid') {
    writeInfo(
      `[pumuki][analytics][saas] contract reason=${diagnostics.contract.reason ?? 'invalid'}`
    );
  }
  writeInfo(
    `[pumuki][analytics][saas] audit: path=${diagnostics.audit.path} events=${diagnostics.audit.events}`
  );
  if (diagnostics.audit.latest_event) {
    writeInfo(
      `[pumuki][analytics][saas] latest_event outcome=${diagnostics.audit.latest_event.outcome} attempts=${diagnostics.audit.latest_event.attempts} latency_ms=${diagnostics.audit.latest_event.latency_ms} status=${diagnostics.audit.latest_event.status ?? 'n/a'}`
    );
  }
  writeInfo(
    `[pumuki][analytics][saas] metrics: path=${diagnostics.metrics.path} success=${diagnostics.metrics.snapshot.totals.success} error=${diagnostics.metrics.snapshot.totals.error} success_rate=${diagnostics.metrics.snapshot.totals.success_rate} p95_latency_ms=${diagnostics.metrics.snapshot.latency_ms.p95}`
  );
  for (const issue of diagnostics.issues) {
    writeInfo(
      `[pumuki][analytics][saas] ${issue.severity.toUpperCase()} ${issue.code}: ${issue.message}`
    );
  }
};

export const parseLifecycleCliArgs = (argv: ReadonlyArray<string>): ParsedArgs => {
  const commandRaw = argv[0];
  if (!commandRaw || commandRaw === '--help' || commandRaw === '-h') {
    throw new Error(HELP_TEXT);
  }
  if (!isLifecycleCommand(commandRaw)) {
    throw new Error(`Unknown command "${commandRaw}".\n\n${HELP_TEXT}`);
  }

  let purgeArtifacts = false;
  let updateSpec: ParsedArgs['updateSpec'];
  let json = false;
  let sddCommand: ParsedArgs['sddCommand'];
  let sddStage: ParsedArgs['sddStage'];
  let sddSessionAction: ParsedArgs['sddSessionAction'];
  let sddChangeId: ParsedArgs['sddChangeId'];
  let sddTtlMinutes: ParsedArgs['sddTtlMinutes'];
  let adapterCommand: ParsedArgs['adapterCommand'];
  let adapterAgent: ParsedArgs['adapterAgent'];
  let adapterDryRun = false;
  let analyticsCommand: ParsedArgs['analyticsCommand'];
  let analyticsHotspotsCommand: ParsedArgs['analyticsHotspotsCommand'];
  let analyticsTopN: ParsedArgs['analyticsTopN'];
  let analyticsSinceDays: ParsedArgs['analyticsSinceDays'];
  let analyticsJsonOutputPath: ParsedArgs['analyticsJsonOutputPath'];
  let analyticsMarkdownOutputPath: ParsedArgs['analyticsMarkdownOutputPath'];

  if (commandRaw === 'analytics') {
    const subcommandRaw = argv[1] ?? '';
    if (subcommandRaw !== 'hotspots') {
      throw new Error(`Unsupported analytics command "${subcommandRaw}".\n\n${HELP_TEXT}`);
    }
    analyticsCommand = 'hotspots';
    const hotspotsActionRaw = argv[2] ?? '';
    if (hotspotsActionRaw !== 'report' && hotspotsActionRaw !== 'diagnose') {
      throw new Error(
        `Unsupported analytics hotspots action "${hotspotsActionRaw}".\n\n${HELP_TEXT}`
      );
    }
    analyticsHotspotsCommand = hotspotsActionRaw;
    for (const arg of argv.slice(3)) {
      if (arg === '--json') {
        json = true;
        continue;
      }
      if (analyticsHotspotsCommand === 'report') {
        if (arg.startsWith('--top=')) {
          const parsedTop = Number.parseInt(arg.slice('--top='.length), 10);
          if (!Number.isInteger(parsedTop) || parsedTop <= 0) {
            throw new Error(`Invalid --top value "${arg}".`);
          }
          analyticsTopN = parsedTop;
          continue;
        }
        if (arg.startsWith('--since-days=')) {
          const parsedSinceDays = Number.parseInt(arg.slice('--since-days='.length), 10);
          if (!Number.isInteger(parsedSinceDays) || parsedSinceDays <= 0) {
            throw new Error(`Invalid --since-days value "${arg}".`);
          }
          analyticsSinceDays = parsedSinceDays;
          continue;
        }
        if (arg.startsWith('--output-json=')) {
          analyticsJsonOutputPath = parseOutputPathFlag(
            arg.slice('--output-json='.length),
            '--output-json'
          );
          continue;
        }
        if (arg.startsWith('--output-markdown=')) {
          analyticsMarkdownOutputPath = parseOutputPathFlag(
            arg.slice('--output-markdown='.length),
            '--output-markdown'
          );
          continue;
        }
      }
      throw new Error(`Unsupported argument "${arg}".\n\n${HELP_TEXT}`);
    }
    const parsedAnalyticsArgs: ParsedArgs = {
      command: commandRaw,
      purgeArtifacts: false,
      json,
      analyticsCommand,
      analyticsHotspotsCommand,
    };
    if (analyticsHotspotsCommand === 'report') {
      parsedAnalyticsArgs.analyticsTopN = analyticsTopN ?? 10;
      parsedAnalyticsArgs.analyticsSinceDays = analyticsSinceDays ?? 90;
      if (analyticsJsonOutputPath) {
        parsedAnalyticsArgs.analyticsJsonOutputPath = analyticsJsonOutputPath;
      }
      if (analyticsMarkdownOutputPath) {
        parsedAnalyticsArgs.analyticsMarkdownOutputPath = analyticsMarkdownOutputPath;
      }
    }
    return parsedAnalyticsArgs;
  }

  if (commandRaw === 'sdd') {
    const subcommandRaw = argv[1] ?? 'status';
    if (
      subcommandRaw !== 'status' &&
      subcommandRaw !== 'validate' &&
      subcommandRaw !== 'session'
    ) {
      throw new Error(`Unsupported SDD subcommand "${subcommandRaw}".\n\n${HELP_TEXT}`);
    }
    sddCommand = subcommandRaw;

    for (const arg of argv.slice(2)) {
      if (arg === '--json') {
        json = true;
        continue;
      }
      if (arg.startsWith('--stage=')) {
        sddStage = parseSddStage(arg.slice('--stage='.length));
        continue;
      }
      if (arg === '--open') {
        sddSessionAction = 'open';
        continue;
      }
      if (arg === '--refresh') {
        sddSessionAction = 'refresh';
        continue;
      }
      if (arg === '--close') {
        sddSessionAction = 'close';
        continue;
      }
      if (arg.startsWith('--change=')) {
        sddChangeId = arg.slice('--change='.length).trim();
        continue;
      }
      if (arg.startsWith('--ttl-minutes=')) {
        const minutes = Number.parseInt(arg.slice('--ttl-minutes='.length), 10);
        if (!Number.isFinite(minutes) || minutes <= 0) {
          throw new Error(`Invalid --ttl-minutes value "${arg}".`);
        }
        sddTtlMinutes = minutes;
        continue;
      }
      throw new Error(`Unsupported argument "${arg}".\n\n${HELP_TEXT}`);
    }

    if (sddCommand === 'status') {
      return {
        command: commandRaw,
        purgeArtifacts: false,
        json,
        sddCommand,
      };
    }
    if (sddCommand === 'validate') {
      return {
        command: commandRaw,
        purgeArtifacts: false,
        json,
        sddCommand,
        sddStage: sddStage ?? 'PRE_COMMIT',
      };
    }

    if (!sddSessionAction) {
      throw new Error(
        `Missing SDD session action. Use one of --open | --refresh | --close.\n\n${HELP_TEXT}`
      );
    }
    if (sddSessionAction === 'open' && (!sddChangeId || sddChangeId.length === 0)) {
      throw new Error(`Missing --change=<change-id> for "pumuki sdd session --open".\n\n${HELP_TEXT}`);
    }
    if (sddSessionAction !== 'open' && sddChangeId) {
      throw new Error(`--change is only supported with "--open".\n\n${HELP_TEXT}`);
    }
    return {
      command: commandRaw,
      purgeArtifacts: false,
      json,
      sddCommand,
      sddSessionAction,
      sddChangeId,
      sddTtlMinutes,
    };
  }

  if (commandRaw === 'adapter') {
    const subcommandRaw = argv[1] ?? '';
    if (subcommandRaw !== 'install') {
      throw new Error(`Unsupported adapter subcommand "${subcommandRaw}".\n\n${HELP_TEXT}`);
    }
    adapterCommand = 'install';

    for (const arg of argv.slice(2)) {
      if (arg === '--json') {
        json = true;
        continue;
      }
      if (arg === '--dry-run') {
        adapterDryRun = true;
        continue;
      }
      if (arg.startsWith('--agent=')) {
        adapterAgent = parseAdapterAgent(arg.slice('--agent='.length).trim());
        continue;
      }
      throw new Error(`Unsupported argument "${arg}".\n\n${HELP_TEXT}`);
    }
    if (!adapterAgent) {
      throw new Error(`Missing --agent=<name> for "pumuki adapter install".\n\n${HELP_TEXT}`);
    }
    return {
      command: commandRaw,
      purgeArtifacts: false,
      json,
      adapterCommand,
      adapterAgent,
      adapterDryRun,
    };
  }

  for (const arg of argv.slice(1)) {
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (arg === '--purge-artifacts') {
      purgeArtifacts = true;
      continue;
    }
    if (arg === '--latest') {
      updateSpec = undefined;
      continue;
    }
    if (arg.startsWith('--spec=')) {
      updateSpec = arg.slice('--spec='.length).trim();
      continue;
    }

    throw new Error(`Unsupported argument "${arg}".\n\n${HELP_TEXT}`);
  }

  return {
    command: commandRaw,
    purgeArtifacts,
    updateSpec,
    json,
  };
};

const printDoctorReport = (report: LifecycleDoctorReport): void => {
  writeInfo(`[pumuki] repo: ${report.repoRoot}`);
  writeInfo(`[pumuki] package version: ${report.packageVersion}`);
  writeInfo(
    `[pumuki] tracked node_modules paths: ${report.trackedNodeModulesPaths.length}`
  );
  writeInfo(
    `[pumuki] hook pre-commit: ${report.hookStatus['pre-commit'].managedBlockPresent ? 'managed' : 'missing'}`
  );
  writeInfo(
    `[pumuki] hook pre-push: ${report.hookStatus['pre-push'].managedBlockPresent ? 'managed' : 'missing'}`
  );

  if (report.issues.length === 0) {
    writeInfo('[pumuki] doctor verdict: PASS');
    return;
  }

  for (const issue of report.issues) {
    writeInfo(`[pumuki] ${issue.severity.toUpperCase()}: ${issue.message}`);
  }
  const hasBlocking = report.issues.some((issue) => issue.severity === 'error');
  writeInfo(`[pumuki] doctor verdict: ${hasBlocking ? 'BLOCKED' : 'WARN'}`);
};

const PRE_WRITE_TELEMETRY_CHAIN = 'pumuki->mcp->ai_gate->ai_evidence';

type PreWriteValidationEnvelope = {
  sdd: ReturnType<typeof evaluateSddPolicy>;
  ai_gate: ReturnType<typeof evaluateAiGate>;
  telemetry: {
    chain: typeof PRE_WRITE_TELEMETRY_CHAIN;
    stage: SddStage;
    mcp_tool: 'ai_gate_check';
  };
};

type LifecycleCliDependencies = {
  emitAuditSummaryNotificationFromAiGate: typeof emitAuditSummaryNotificationFromAiGate;
};

const defaultLifecycleCliDependencies: LifecycleCliDependencies = {
  emitAuditSummaryNotificationFromAiGate,
};

const resolveSddDecisionLocation = (
  result: ReturnType<typeof evaluateSddPolicy>
) => {
  const changeId = result.status.session.changeId;
  switch (result.decision.code) {
    case 'OPENSPEC_MISSING':
    case 'OPENSPEC_VERSION_UNSUPPORTED':
    case 'OPENSPEC_PROJECT_MISSING':
    case 'SDD_VALIDATION_FAILED':
    case 'SDD_VALIDATION_ERROR':
      return 'openspec/changes:1';
    case 'SDD_CHANGE_MISSING':
      return changeId && changeId.trim().length > 0
        ? `openspec/changes/${changeId.trim()}:1`
        : 'openspec/changes:1';
    case 'SDD_CHANGE_ARCHIVED':
      return changeId && changeId.trim().length > 0
        ? `openspec/changes/archive/${changeId.trim()}:1`
        : 'openspec/changes/archive:1';
    case 'SDD_SESSION_MISSING':
    case 'SDD_SESSION_INVALID':
      return '.git/config:1';
    default:
      return undefined;
  }
};

const resolveAiGateViolationLocation = (code: string) => {
  if (code.startsWith('EVIDENCE_')) {
    return '.ai_evidence.json:1';
  }
  if (code === 'GITFLOW_PROTECTED_BRANCH') {
    return '.git/HEAD:1';
  }
  return undefined;
};

const buildPreWriteValidationEnvelope = (
  result: ReturnType<typeof evaluateSddPolicy>,
  aiGate: ReturnType<typeof evaluateAiGate>
): PreWriteValidationEnvelope => ({
  sdd: result,
  ai_gate: aiGate,
  telemetry: {
    chain: PRE_WRITE_TELEMETRY_CHAIN,
    stage: result.stage,
    mcp_tool: 'ai_gate_check',
  },
});

export const runLifecycleCli = async (
  argv: ReadonlyArray<string>,
  dependencies: Partial<LifecycleCliDependencies> = {}
): Promise<number> => {
  try {
    const activeDependencies: LifecycleCliDependencies = {
      ...defaultLifecycleCliDependencies,
      ...dependencies,
    };
    const parsed = parseLifecycleCliArgs(argv);

    switch (parsed.command) {
      case 'install': {
        const result = runLifecycleInstall();
        writeInfo(
          `[pumuki] installed ${result.version} at ${result.repoRoot} (hooks changed: ${result.changedHooks.join(', ') || 'none'})`
        );
        if (result.openSpecBootstrap) {
          writeInfo(
            `[pumuki] openspec bootstrap: installed=${result.openSpecBootstrap.packageInstalled ? 'yes' : 'no'} project=${result.openSpecBootstrap.projectInitialized ? 'yes' : 'no'} actions=${result.openSpecBootstrap.actions.join(', ') || 'none'}`
          );
          if (result.openSpecBootstrap.skippedReason === 'NO_PACKAGE_JSON') {
            writeInfo('[pumuki] openspec bootstrap skipped npm install (package.json not found)');
          }
        }
        return 0;
      }
      case 'uninstall': {
        const result = runLifecycleUninstall({
          purgeArtifacts: parsed.purgeArtifacts,
        });
        writeInfo(
          `[pumuki] uninstalled from ${result.repoRoot} (hooks changed: ${result.changedHooks.join(', ') || 'none'})`
        );
        if (parsed.purgeArtifacts) {
          writeInfo(
            `[pumuki] removed artifacts: ${result.removedArtifacts.join(', ') || 'none'}`
          );
        }
        return 0;
      }
      case 'remove': {
        const result = runLifecycleRemove();
        writeInfo(
          `[pumuki] removed from ${result.repoRoot} (package removed: ${result.packageRemoved ? 'yes' : 'no'}, hooks changed: ${result.changedHooks.join(', ') || 'none'})`
        );
        writeInfo(
          `[pumuki] removed artifacts: ${result.removedArtifacts.join(', ') || 'none'}`
        );
        return 0;
      }
      case 'update': {
        const result = runLifecycleUpdate({
          targetSpec: parsed.updateSpec,
        });
        writeInfo(
          `[pumuki] updated to ${result.targetSpec} at ${result.repoRoot} (hooks changed: ${result.reinstallHooksChanged.join(', ') || 'none'})`
        );
        writeInfo(
          `[pumuki] openspec compatibility: migrated-legacy=${result.openSpecCompatibility.migratedLegacyPackage ? 'yes' : 'no'} actions=${result.openSpecCompatibility.actions.join(', ') || 'none'}`
        );
        return 0;
      }
      case 'doctor': {
        const report = runLifecycleDoctor();
        printDoctorReport(report);
        return report.issues.some((issue) => issue.severity === 'error') ? 1 : 0;
      }
      case 'status': {
        const status = readLifecycleStatus();
        if (parsed.json) {
          writeInfo(JSON.stringify(status, null, 2));
        } else {
          writeInfo(`[pumuki] repo: ${status.repoRoot}`);
          writeInfo(`[pumuki] package version: ${status.packageVersion}`);
          writeInfo(`[pumuki] lifecycle installed: ${status.lifecycleState.installed ?? 'false'}`);
          writeInfo(`[pumuki] lifecycle version: ${status.lifecycleState.version ?? 'unknown'}`);
          writeInfo(
            `[pumuki] hooks: pre-commit=${status.hookStatus['pre-commit'].managedBlockPresent ? 'managed' : 'missing'}, pre-push=${status.hookStatus['pre-push'].managedBlockPresent ? 'managed' : 'missing'}`
          );
          writeInfo(
            `[pumuki] tracked node_modules paths: ${status.trackedNodeModulesCount}`
          );
        }
        return 0;
      }
      case 'analytics': {
        if (parsed.analyticsCommand === 'hotspots' && parsed.analyticsHotspotsCommand === 'report') {
          const repoRoot = process.cwd();
          const report = buildLocalHotspotsReport({
            repoRoot,
            topN: parsed.analyticsTopN ?? 10,
            sinceDays: parsed.analyticsSinceDays ?? 90,
          });
          if (parsed.analyticsJsonOutputPath) {
            const outputPath = toLocalOutputAbsolutePath(repoRoot, parsed.analyticsJsonOutputPath);
            mkdirSync(dirname(outputPath), { recursive: true });
            writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
            writeInfo(`[pumuki][analytics] json report exported -> ${parsed.analyticsJsonOutputPath}`);
          }
          if (parsed.analyticsMarkdownOutputPath) {
            const outputPath = toLocalOutputAbsolutePath(repoRoot, parsed.analyticsMarkdownOutputPath);
            mkdirSync(dirname(outputPath), { recursive: true });
            writeFileSync(outputPath, formatHotspotsMarkdownReport(report), 'utf8');
            writeInfo(
              `[pumuki][analytics] markdown report exported -> ${parsed.analyticsMarkdownOutputPath}`
            );
          }
          if (parsed.json) {
            writeInfo(JSON.stringify(report, null, 2));
          } else {
            writeInfo(
              `[pumuki][analytics] hotspots report: top=${report.options.topN} since_days=${report.options.sinceDays} ranked=${report.totals.ranked}`
            );
            if (report.hotspots.length === 0) {
              writeInfo('[pumuki][analytics] no hotspots matched current local signals.');
            } else {
              for (const hotspot of report.hotspots) {
                writeInfo(
                  `[pumuki][analytics] #${hotspot.rank} ${hotspot.path} score=${hotspot.rawScore} normalized=${hotspot.normalizedScore} findings=${hotspot.findingsTotal} c=${hotspot.findingsByEnterpriseSeverity.CRITICAL} h=${hotspot.findingsByEnterpriseSeverity.HIGH} m=${hotspot.findingsByEnterpriseSeverity.MEDIUM} l=${hotspot.findingsByEnterpriseSeverity.LOW} churn_commits=${hotspot.churnCommits} churn_lines=${hotspot.churnTotalLines} authors=${hotspot.churnDistinctAuthors}`
                );
              }
            }
          }
          return 0;
        }
        if (
          parsed.analyticsCommand === 'hotspots' &&
          parsed.analyticsHotspotsCommand === 'diagnose'
        ) {
          const diagnostics = buildHotspotsPublishDiagnostics(process.cwd());
          if (parsed.json) {
            writeInfo(JSON.stringify(diagnostics, null, 2));
          } else {
            printHotspotsPublishDiagnostics(diagnostics);
          }
          return diagnostics.status === 'blocked' ? 1 : 0;
        }
        return 1;
      }
      case 'sdd': {
        if (parsed.sddCommand === 'status') {
          const sddStatus = readSddStatus();
          if (parsed.json) {
            writeInfo(JSON.stringify(sddStatus, null, 2));
          } else {
            writeInfo(`[pumuki][sdd] repo: ${sddStatus.repoRoot}`);
            writeInfo(
              `[pumuki][sdd] openspec: installed=${sddStatus.openspec.installed ? 'yes' : 'no'} version=${sddStatus.openspec.version ?? 'unknown'}`
            );
            writeInfo(
              `[pumuki][sdd] openspec compatibility: compatible=${sddStatus.openspec.compatible ? 'yes' : 'no'} minimum=${sddStatus.openspec.minimumVersion} recommended=${sddStatus.openspec.recommendedVersion} parsed=${sddStatus.openspec.parsedVersion ?? 'unknown'}`
            );
            writeInfo(
              `[pumuki][sdd] openspec project initialized: ${sddStatus.openspec.projectInitialized ? 'yes' : 'no'}`
            );
            writeInfo(
              `[pumuki][sdd] session: active=${sddStatus.session.active ? 'yes' : 'no'} valid=${sddStatus.session.valid ? 'yes' : 'no'} change=${sddStatus.session.changeId ?? 'none'}`
            );
            if (typeof sddStatus.session.remainingSeconds === 'number') {
              writeInfo(
                `[pumuki][sdd] session remaining seconds: ${sddStatus.session.remainingSeconds}`
              );
            }
          }
          return 0;
        }
        if (parsed.sddCommand === 'validate') {
          const result = evaluateSddPolicy({
            stage: parsed.sddStage ?? 'PRE_COMMIT',
          });
          const shouldEvaluateAiGate = result.stage === 'PRE_WRITE';
          const aiGate = shouldEvaluateAiGate
            ? runEnterpriseAiGateCheck({
              repoRoot: process.cwd(),
              stage: result.stage,
            }).result
            : null;
          if (parsed.json) {
            writeInfo(
              JSON.stringify(
                aiGate
                  ? buildPreWriteValidationEnvelope(result, aiGate)
                  : result,
                null,
                2
              )
            );
          } else {
            writeInfo(
              `[pumuki][sdd] stage=${result.stage} allowed=${result.decision.allowed ? 'yes' : 'no'} code=${result.decision.code}`
            );
            writeInfo(
              withOptionalLocation(
                `[pumuki][sdd] ${result.decision.message}`,
                resolveSddDecisionLocation(result)
              )
            );
            if (result.validation) {
              writeInfo(
                `[pumuki][sdd] validation: ok=${result.validation.ok ? 'yes' : 'no'} failed=${result.validation.totals.failed} errors=${result.validation.issues.errors}`
              );
            }
            if (aiGate) {
              writeInfo(
                `[pumuki][ai-gate] stage=${aiGate.stage} status=${aiGate.status} violations=${aiGate.violations.length}`
              );
              for (const violation of aiGate.violations) {
                writeInfo(
                  withOptionalLocation(
                    `[pumuki][ai-gate] ${violation.code}: ${violation.message}`,
                    resolveAiGateViolationLocation(violation.code)
                  )
                );
              }
            }
          }
          if (result.stage === 'PRE_WRITE' && aiGate) {
            activeDependencies.emitAuditSummaryNotificationFromAiGate({
              repoRoot: process.cwd(),
              stage: result.stage,
              aiGateResult: aiGate,
            });
          }
          if (!result.decision.allowed) {
            return 1;
          }
          if (aiGate && !aiGate.allowed) {
            return 1;
          }
          return 0;
        }
        if (parsed.sddCommand === 'session') {
          if (parsed.sddSessionAction === 'open') {
            const session = openSddSession({
              changeId: parsed.sddChangeId ?? '',
              ttlMinutes: parsed.sddTtlMinutes,
            });
            if (parsed.json) {
              writeInfo(JSON.stringify(session, null, 2));
            } else {
              writeInfo(
                `[pumuki][sdd] session opened: change=${session.changeId} ttlMinutes=${session.ttlMinutes ?? 'unknown'} valid=${session.valid ? 'yes' : 'no'}`
              );
            }
            return 0;
          }
          if (parsed.sddSessionAction === 'refresh') {
            const session = refreshSddSession({
              ttlMinutes: parsed.sddTtlMinutes,
            });
            if (parsed.json) {
              writeInfo(JSON.stringify(session, null, 2));
            } else {
              writeInfo(
                `[pumuki][sdd] session refreshed: change=${session.changeId ?? 'none'} ttlMinutes=${session.ttlMinutes ?? 'unknown'} valid=${session.valid ? 'yes' : 'no'}`
              );
            }
            return 0;
          }
          const session = closeSddSession();
          if (parsed.json) {
            writeInfo(JSON.stringify(session, null, 2));
          } else {
            writeInfo('[pumuki][sdd] session closed');
          }
          return 0;
        }
        return 0;
      }
      case 'adapter': {
        if (parsed.adapterCommand === 'install' && parsed.adapterAgent) {
          const result = runLifecycleAdapterInstall({
            agent: parsed.adapterAgent,
            dryRun: parsed.adapterDryRun,
          });
          if (parsed.json) {
            writeInfo(JSON.stringify(result, null, 2));
          } else {
            writeInfo(
              `[pumuki] adapter install: agent=${result.agent} dry-run=${result.dryRun ? 'yes' : 'no'} changed=${result.changedFiles.length}`
            );
            if (result.changedFiles.length > 0) {
              writeInfo(
                `[pumuki] adapter files: ${result.changedFiles.join(', ')}`
              );
            }
          }
          return 0;
        }
        return 1;
      }
      default:
        return 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected lifecycle CLI error.';
    writeError(message);
    return 1;
  }
};

if (require.main === module) {
  void runLifecycleCli(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
