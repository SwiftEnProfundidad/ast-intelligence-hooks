import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import type { GatePolicy } from '../../core/gate/GatePolicy';
import { runPlatformGate } from '../git/runPlatformGate';
import {
  doctorHasBlockingIssues,
  runLifecycleDoctor,
  type LifecycleDoctorReport,
} from './doctor';
import { runLifecycleInstall } from './install';
import { runLifecycleRemove } from './remove';
import { readLifecycleStatus } from './status';
import { runLifecycleUninstall } from './uninstall';
import { runLifecycleUpdate } from './update';
import { runOpenSpecBootstrap } from './openSpecBootstrap';
import { runLifecycleAdapterInstall, type AdapterAgent } from './adapter';
import { createLoopSessionContract, isLoopSessionTransitionAllowed } from './loopSessionContract';
import {
  createLoopSession,
  listLoopSessions,
  readLoopSession,
  updateLoopSession,
} from './loopSessionStore';
import {
  closeSddSession,
  evaluateSddPolicy,
  openSddSession,
  readSddStatus,
  refreshSddSession,
  runSddSyncDocs,
  type SddStage,
} from '../sdd';
import { evaluateAiGate } from '../gate/evaluateAiGate';
import { runEnterpriseAiGateCheck } from '../mcp/aiGateCheck';
import { emitAuditSummaryNotificationFromAiGate } from '../notifications/emitAuditSummaryNotification';
import {
  buildPreWriteAutomationTrace,
  type PreWriteAutomationTrace,
} from './preWriteAutomation';
import { buildLocalHotspotsReport, type LocalHotspotsReport } from './analyticsHotspots';
import { resolveHotspotsSaasIngestionAuditPath } from './saasIngestionAudit';
import { readHotspotsSaasIngestionPayload } from './saasIngestionContract';
import {
  buildHotspotsSaasIngestionMetrics,
  readHotspotsSaasIngestionAuditEvents,
  writeHotspotsSaasIngestionMetrics,
} from './saasIngestionMetrics';
import {
  collectRemoteCiDiagnostics,
  type RemoteCiDiagnostics,
} from './remoteCiDiagnostics';

type LifecycleCommand =
  | 'install'
  | 'uninstall'
  | 'remove'
  | 'update'
  | 'doctor'
  | 'status'
  | 'loop'
  | 'sdd'
  | 'adapter'
  | 'analytics';

type SddCommand = 'status' | 'validate' | 'session' | 'sync-docs';
type LoopCommand = 'run' | 'status' | 'stop' | 'resume' | 'list' | 'export';
type AnalyticsCommand = 'hotspots';
type AnalyticsHotspotsCommand = 'report' | 'diagnose';

type SddSessionAction = 'open' | 'refresh' | 'close';

type ParsedArgs = {
  command: LifecycleCommand;
  purgeArtifacts: boolean;
  updateSpec?: string;
  json: boolean;
  remoteChecks?: boolean;
  doctorDeep?: boolean;
  sddCommand?: SddCommand;
  loopCommand?: LoopCommand;
  loopSessionId?: string;
  loopObjective?: string;
  loopMaxAttempts?: number;
  loopOutputJsonPath?: string;
  sddStage?: SddStage;
  sddSessionAction?: SddSessionAction;
  sddChangeId?: string;
  sddTtlMinutes?: number;
  sddSyncDocsDryRun?: boolean;
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
  pumuki doctor [--remote-checks] [--deep] [--json]
  pumuki status [--json] [--remote-checks]
  pumuki loop run --objective=<text> [--max-attempts=<n>] [--json]
  pumuki loop status --session=<session-id> [--json]
  pumuki loop stop --session=<session-id> [--json]
  pumuki loop resume --session=<session-id> [--json]
  pumuki loop list [--json]
  pumuki loop export --session=<session-id> [--output-json=<path>] [--json]
  pumuki adapter install --agent=<name> [--dry-run] [--json]
  pumuki analytics hotspots report [--top=<n>] [--since-days=<n>] [--json] [--output-json=<path>] [--output-markdown=<path>]
  pumuki analytics hotspots diagnose [--json]
  pumuki sdd status [--json]
  pumuki sdd validate [--stage=PRE_WRITE|PRE_COMMIT|PRE_PUSH|CI] [--json]
  pumuki sdd session --open --change=<change-id> [--ttl-minutes=<n>] [--json]
  pumuki sdd session --refresh [--ttl-minutes=<n>] [--json]
  pumuki sdd session --close [--json]
  pumuki sdd sync-docs [--dry-run] [--json]
`.trim();

const LOOP_RUN_POLICY: GatePolicy = {
  stage: 'STAGED',
  blockOnOrAbove: 'ERROR',
  warnOnOrAbove: 'WARN',
};

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
  value === 'loop' ||
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
  let remoteChecks = false;
  let doctorDeep = false;
  let sddCommand: ParsedArgs['sddCommand'];
  let loopCommand: ParsedArgs['loopCommand'];
  let loopSessionId: ParsedArgs['loopSessionId'];
  let loopObjective: ParsedArgs['loopObjective'];
  let loopMaxAttempts: ParsedArgs['loopMaxAttempts'];
  let loopOutputJsonPath: ParsedArgs['loopOutputJsonPath'];
  let sddStage: ParsedArgs['sddStage'];
  let sddSessionAction: ParsedArgs['sddSessionAction'];
  let sddChangeId: ParsedArgs['sddChangeId'];
  let sddTtlMinutes: ParsedArgs['sddTtlMinutes'];
  let sddSyncDocsDryRun = false;
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

  if (commandRaw === 'loop') {
    const subcommandRaw = argv[1] ?? '';
    if (
      subcommandRaw !== 'run' &&
      subcommandRaw !== 'status' &&
      subcommandRaw !== 'stop' &&
      subcommandRaw !== 'resume' &&
      subcommandRaw !== 'list' &&
      subcommandRaw !== 'export'
    ) {
      throw new Error(`Unsupported loop subcommand "${subcommandRaw}".\n\n${HELP_TEXT}`);
    }
    loopCommand = subcommandRaw;
    for (const arg of argv.slice(2)) {
      if (arg === '--json') {
        json = true;
        continue;
      }
      if (arg.startsWith('--session=')) {
        loopSessionId = arg.slice('--session='.length).trim();
        continue;
      }
      if (arg.startsWith('--objective=')) {
        loopObjective = arg.slice('--objective='.length).trim();
        continue;
      }
      if (arg.startsWith('--max-attempts=')) {
        const parsedAttempts = Number.parseInt(arg.slice('--max-attempts='.length), 10);
        if (!Number.isInteger(parsedAttempts) || parsedAttempts <= 0) {
          throw new Error(`Invalid --max-attempts value "${arg}".`);
        }
        loopMaxAttempts = parsedAttempts;
        continue;
      }
      if (arg.startsWith('--output-json=')) {
        loopOutputJsonPath = parseOutputPathFlag(
          arg.slice('--output-json='.length),
          '--output-json'
        );
        continue;
      }
      throw new Error(`Unsupported argument "${arg}".\n\n${HELP_TEXT}`);
    }

    if (loopCommand === 'run') {
      if (!loopObjective || loopObjective.length === 0) {
        throw new Error(`Missing --objective=<text> for "pumuki loop run".\n\n${HELP_TEXT}`);
      }
      return {
        command: commandRaw,
        purgeArtifacts: false,
        json,
        loopCommand,
        loopObjective,
        loopMaxAttempts: loopMaxAttempts ?? 3,
      };
    }
    if (loopCommand === 'list') {
      if (loopSessionId || loopObjective || typeof loopMaxAttempts === 'number' || loopOutputJsonPath) {
        throw new Error(`"pumuki loop list" only supports [--json].\n\n${HELP_TEXT}`);
      }
      return {
        command: commandRaw,
        purgeArtifacts: false,
        json,
        loopCommand,
      };
    }
    if (!loopSessionId || loopSessionId.length === 0) {
      throw new Error(`Missing --session=<session-id> for "pumuki loop ${loopCommand}".\n\n${HELP_TEXT}`);
    }
    if (loopObjective || typeof loopMaxAttempts === 'number') {
      throw new Error(`Unsupported run-only flags for "pumuki loop ${loopCommand}".\n\n${HELP_TEXT}`);
    }
    if (loopCommand !== 'export' && loopOutputJsonPath) {
      throw new Error(`--output-json is only supported with "pumuki loop export".\n\n${HELP_TEXT}`);
    }
    const parsedLoopArgs: ParsedArgs = {
      command: commandRaw,
      purgeArtifacts: false,
      json,
      loopCommand,
      loopSessionId,
    };
    if (loopOutputJsonPath) {
      parsedLoopArgs.loopOutputJsonPath = loopOutputJsonPath;
    }
    return parsedLoopArgs;
  }

  if (commandRaw === 'sdd') {
    const subcommandRaw = argv[1] ?? 'status';
    if (
      subcommandRaw !== 'status' &&
      subcommandRaw !== 'validate' &&
      subcommandRaw !== 'session' &&
      subcommandRaw !== 'sync-docs'
    ) {
      throw new Error(`Unsupported SDD subcommand "${subcommandRaw}".\n\n${HELP_TEXT}`);
    }
    sddCommand = subcommandRaw;

    for (const arg of argv.slice(2)) {
      if (arg === '--json') {
        json = true;
        continue;
      }
      if (arg === '--dry-run') {
        if (sddCommand !== 'sync-docs') {
          throw new Error(`--dry-run is only supported with "pumuki sdd sync-docs".\n\n${HELP_TEXT}`);
        }
        sddSyncDocsDryRun = true;
        continue;
      }
      if (arg.startsWith('--stage=')) {
        if (sddCommand !== 'validate') {
          throw new Error(`--stage is only supported with "pumuki sdd validate".\n\n${HELP_TEXT}`);
        }
        sddStage = parseSddStage(arg.slice('--stage='.length));
        continue;
      }
      if (arg === '--open') {
        if (sddCommand !== 'session') {
          throw new Error(`--open is only supported with "pumuki sdd session".\n\n${HELP_TEXT}`);
        }
        sddSessionAction = 'open';
        continue;
      }
      if (arg === '--refresh') {
        if (sddCommand !== 'session') {
          throw new Error(`--refresh is only supported with "pumuki sdd session".\n\n${HELP_TEXT}`);
        }
        sddSessionAction = 'refresh';
        continue;
      }
      if (arg === '--close') {
        if (sddCommand !== 'session') {
          throw new Error(`--close is only supported with "pumuki sdd session".\n\n${HELP_TEXT}`);
        }
        sddSessionAction = 'close';
        continue;
      }
      if (arg.startsWith('--change=')) {
        if (sddCommand !== 'session') {
          throw new Error(`--change is only supported with "pumuki sdd session".\n\n${HELP_TEXT}`);
        }
        sddChangeId = arg.slice('--change='.length).trim();
        continue;
      }
      if (arg.startsWith('--ttl-minutes=')) {
        if (sddCommand !== 'session') {
          throw new Error(`--ttl-minutes is only supported with "pumuki sdd session".\n\n${HELP_TEXT}`);
        }
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
    if (sddCommand === 'sync-docs') {
      if (sddSessionAction || sddChangeId || typeof sddTtlMinutes === 'number') {
        throw new Error(
          `"pumuki sdd sync-docs" only supports [--dry-run] [--json].\n\n${HELP_TEXT}`
        );
      }
      return {
        command: commandRaw,
        purgeArtifacts: false,
        json,
        sddCommand,
        sddSyncDocsDryRun,
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
    if (arg === '--remote-checks') {
      remoteChecks = true;
      continue;
    }
    if (arg === '--deep') {
      doctorDeep = true;
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

  if (remoteChecks && commandRaw !== 'doctor' && commandRaw !== 'status') {
    throw new Error(`--remote-checks is only supported with "pumuki doctor" or "pumuki status".\n\n${HELP_TEXT}`);
  }
  if (doctorDeep && commandRaw !== 'doctor') {
    throw new Error(`--deep is only supported with "pumuki doctor".\n\n${HELP_TEXT}`);
  }

  return {
    command: commandRaw,
    purgeArtifacts,
    updateSpec,
    json,
    ...(remoteChecks ? { remoteChecks: true } : {}),
    ...(doctorDeep ? { doctorDeep: true } : {}),
  };
};

const printRemoteCiDiagnostics = (diagnostics: RemoteCiDiagnostics): void => {
  writeInfo(
    `[pumuki][remote-ci] status=${diagnostics.status.toUpperCase()} checks=${diagnostics.checks.total} failing=${diagnostics.checks.failing}`
  );
  if (diagnostics.pr) {
    writeInfo(
      `[pumuki][remote-ci] pr=#${diagnostics.pr.number} branch=${diagnostics.pr.headRefName} url=${diagnostics.pr.url}`
    );
  }
  if (diagnostics.reason) {
    writeInfo(`[pumuki][remote-ci] reason=${diagnostics.reason}`);
  }
  for (const blocker of diagnostics.blockers) {
    writeInfo(
      `[pumuki][remote-ci] ${blocker.severity.toUpperCase()} ${blocker.code}: ${blocker.message}`
    );
    writeInfo(`[pumuki][remote-ci] remediation: ${blocker.remediation}`);
  }
};

const printDoctorReport = (
  report: LifecycleDoctorReport,
  remoteCiDiagnostics?: RemoteCiDiagnostics
): void => {
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

  for (const issue of report.issues) {
    writeInfo(`[pumuki] ${issue.severity.toUpperCase()}: ${issue.message}`);
  }

  if (report.deep?.enabled) {
    for (const check of report.deep.checks) {
      writeInfo(
        `[pumuki][doctor][deep] ${check.id}: status=${check.status.toUpperCase()} severity=${check.severity.toUpperCase()} ${check.message}`
      );
      if (check.status === 'fail' && check.remediation) {
        writeInfo(`[pumuki][doctor][deep] remediation: ${check.remediation}`);
      }
    }
  }

  const hasBlocking = doctorHasBlockingIssues(report);
  const hasWarnings =
    report.issues.length > 0 ||
    report.deep?.checks.some((check) => check.status === 'fail') === true;

  if (!hasWarnings && !hasBlocking) {
    writeInfo('[pumuki] doctor verdict: PASS');
  } else {
    writeInfo(`[pumuki] doctor verdict: ${hasBlocking ? 'BLOCKED' : 'WARN'}`);
  }

  if (remoteCiDiagnostics) {
    printRemoteCiDiagnostics(remoteCiDiagnostics);
  }
};

const PRE_WRITE_TELEMETRY_CHAIN = 'pumuki->mcp->ai_gate->ai_evidence';
const PRE_WRITE_INSTALL_REMEDIATION_COMMAND =
  'npx --yes --package pumuki@latest pumuki install';

type PreWriteValidationEnvelope = {
  sdd: ReturnType<typeof evaluateSddPolicy>;
  ai_gate: ReturnType<typeof evaluateAiGate>;
  automation: PreWriteAutomationTrace;
  bootstrap: {
    enabled: boolean;
    attempted: boolean;
    status: 'SKIPPED' | 'OK' | 'FAILED';
    actions: ReadonlyArray<string>;
    details?: string;
  };
  next_action?: {
    reason: string;
    command: string;
  };
  telemetry: {
    chain: typeof PRE_WRITE_TELEMETRY_CHAIN;
    stage: SddStage;
    mcp_tool: 'ai_gate_check';
  };
};

type PreWriteOpenSpecBootstrapTrace = {
  enabled: boolean;
  attempted: boolean;
  status: 'SKIPPED' | 'OK' | 'FAILED';
  actions: string[];
  details?: string;
};

type LifecycleCliDependencies = {
  emitAuditSummaryNotificationFromAiGate: typeof emitAuditSummaryNotificationFromAiGate;
  runPlatformGate: typeof runPlatformGate;
  collectRemoteCiDiagnostics: typeof collectRemoteCiDiagnostics;
};

const defaultLifecycleCliDependencies: LifecycleCliDependencies = {
  emitAuditSummaryNotificationFromAiGate,
  runPlatformGate,
  collectRemoteCiDiagnostics,
};

const PRE_WRITE_HINTS_BY_CODE: Readonly<Record<string, string>> = {
  EVIDENCE_MISSING: 'Regenera evidencia ejecutando una auditoría completa antes de continuar.',
  EVIDENCE_INVALID: 'Corrige el contrato de .ai_evidence.json y vuelve a ejecutar el gate.',
  EVIDENCE_CHAIN_INVALID: 'Regenera evidencia para restablecer la cadena criptográfica íntegra.',
  EVIDENCE_STALE: 'Refresca evidencia para este repo y rama.',
  EVIDENCE_REPO_ROOT_MISMATCH: 'Regenera evidencia desde este repositorio.',
  EVIDENCE_BRANCH_MISMATCH: 'Regenera evidencia en la rama actual.',
  EVIDENCE_RULES_COVERAGE_MISSING: 'Ejecuta auditoría completa para recalcular rules_coverage.',
  EVIDENCE_RULES_COVERAGE_INCOMPLETE: 'Asegura unevaluated=0 y coverage_ratio=1.',
  GITFLOW_PROTECTED_BRANCH: 'Trabaja en feature/* y evita ramas protegidas.',
  MCP_ENTERPRISE_RECEIPT_MISSING: 'Invoca ai_gate_check desde pumuki-enterprise MCP antes de PRE_WRITE.',
  MCP_ENTERPRISE_RECEIPT_INVALID: 'Corrige recibo MCP y vuelve a invocar ai_gate_check.',
  MCP_ENTERPRISE_RECEIPT_STALE: 'Vuelve a ejecutar ai_gate_check para emitir recibo fresco.',
  MCP_ENTERPRISE_RECEIPT_STAGE_MISMATCH: 'Reejecuta ai_gate_check con stage PRE_WRITE.',
  MCP_ENTERPRISE_RECEIPT_REPO_ROOT_MISMATCH: 'Genera el recibo MCP en este mismo repositorio.',
};

const PRE_WRITE_OPENSPEC_AUTOREMEDIABLE_CODES = new Set<string>([
  'OPENSPEC_MISSING',
  'OPENSPEC_VERSION_UNSUPPORTED',
  'OPENSPEC_PROJECT_MISSING',
]);

const resolvePreWriteNextAction = (params: {
  sdd: ReturnType<typeof evaluateSddPolicy>;
  aiGate: ReturnType<typeof evaluateAiGate> | null;
}): PreWriteValidationEnvelope['next_action'] | undefined => {
  if (!params.sdd.decision.allowed && PRE_WRITE_OPENSPEC_AUTOREMEDIABLE_CODES.has(params.sdd.decision.code)) {
    return {
      reason: params.sdd.decision.code,
      command: PRE_WRITE_INSTALL_REMEDIATION_COMMAND,
    };
  }
  if (!params.aiGate || params.aiGate.allowed) {
    return undefined;
  }
  const hasMcpViolation = params.aiGate.violations.some((violation) =>
    violation.code.startsWith('MCP_ENTERPRISE_RECEIPT_')
  );
  if (!hasMcpViolation) {
    return undefined;
  }
  return {
    reason: 'MCP_ENTERPRISE_RECEIPT',
    command: 'npx --yes --package pumuki@latest pumuki-pre-write',
  };
};

const wrapPreWritePanelLine = (value: string, width: number): string[] => {
  if (width < 20 || value.length <= width) {
    return [value];
  }
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current.length === 0) {
      current = word;
      continue;
    }
    if (`${current} ${word}`.length <= width) {
      current = `${current} ${word}`;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current.length > 0) {
    lines.push(current);
  }
  return lines;
};

const renderPreWritePanel = (lines: ReadonlyArray<string>): string => {
  const terminalWidth = Number.isFinite(process.stdout.columns ?? NaN)
    ? Number(process.stdout.columns)
    : 110;
  const width = Math.min(140, Math.max(86, terminalWidth - 2));
  const innerWidth = width - 4;
  const normalized = lines.flatMap((line) => wrapPreWritePanelLine(line, innerWidth));
  const top = `╔${'═'.repeat(width - 2)}╗`;
  const bottom = `╚${'═'.repeat(width - 2)}╝`;
  const body = normalized.map((line) => `║ ${line.padEnd(innerWidth, ' ')} ║`);
  return [top, ...body, bottom].join('\n');
};

const buildPreWriteValidationPanel = (params: {
  sdd: ReturnType<typeof evaluateSddPolicy>;
  aiGate: ReturnType<typeof evaluateAiGate>;
  automation: PreWriteAutomationTrace;
}): string => {
  const git = params.aiGate.repo_state.git;
  const receipt = params.aiGate.mcp_receipt;
  const lines: string[] = [
    'PRE-FLIGHT CHECK',
    `Stage: ${params.sdd.stage} · SDD: ${params.sdd.decision.code} · AI Gate: ${params.aiGate.status}`,
    `Branch: ${git.branch ?? 'unknown'} · Upstream: ${git.upstream ?? 'none'}`,
    `Worktree: dirty=${git.dirty ? 'yes' : 'no'} staged=${git.staged} unstaged=${git.unstaged} ahead=${git.ahead} behind=${git.behind}`,
    `Evidence: kind=${params.aiGate.evidence.kind} age=${params.aiGate.evidence.age_seconds ?? 'n/a'}s max=${params.aiGate.evidence.max_age_seconds}s`,
    `Evidence source: source=${params.aiGate.evidence.source.source} path=${params.aiGate.evidence.source.path} digest=${params.aiGate.evidence.source.digest ?? 'null'} generated_at=${params.aiGate.evidence.source.generated_at ?? 'null'}`,
    `MCP receipt: required=${receipt.required ? 'yes' : 'no'} kind=${receipt.kind} age=${receipt.age_seconds ?? 'n/a'}s max=${receipt.max_age_seconds ?? 'n/a'}s`,
    `Auto-heal: attempted=${params.automation.attempted ? 'yes' : 'no'} actions=${params.automation.actions.length}`,
    `Violations: ${params.aiGate.violations.length}`,
  ];

  if (params.automation.actions.length > 0) {
    lines.push('');
    lines.push('Auto-heal actions:');
    for (const action of params.automation.actions) {
      lines.push(`- ${action.action}: ${action.status} (${action.details})`);
    }
  }

  if (params.aiGate.violations.length > 0) {
    lines.push('');
    lines.push('Blocking causes:');
    for (const violation of params.aiGate.violations) {
      lines.push(`- ${violation.code}: ${violation.message}`);
    }
    lines.push('');
    lines.push('Operational hints:');
    for (const violation of params.aiGate.violations) {
      const hint = PRE_WRITE_HINTS_BY_CODE[violation.code];
      if (!hint) {
        continue;
      }
      lines.push(`- ${violation.code}: ${hint}`);
    }
  }

  return renderPreWritePanel(lines);
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
    case 'SDD_VALIDATION_EMPTY_SCOPE':
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
  aiGate: ReturnType<typeof evaluateAiGate>,
  automation: PreWriteAutomationTrace,
  bootstrap: PreWriteOpenSpecBootstrapTrace,
  nextAction: PreWriteValidationEnvelope['next_action']
): PreWriteValidationEnvelope => ({
  sdd: result,
  ai_gate: aiGate,
  automation: {
    attempted: automation.attempted,
    actions: [...automation.actions],
  },
  bootstrap: {
    enabled: bootstrap.enabled,
    attempted: bootstrap.attempted,
    status: bootstrap.status,
    actions: [...bootstrap.actions],
    details: bootstrap.details,
  },
  next_action: nextAction,
  telemetry: {
    chain: PRE_WRITE_TELEMETRY_CHAIN,
    stage: result.stage,
    mcp_tool: 'ai_gate_check',
  },
});

const writeLoopAttemptEvidence = (params: {
  repoRoot: string;
  sessionId: string;
  attempt: number;
  payload: {
    session_id: string;
    attempt: number;
    started_at: string;
    finished_at: string;
    gate_exit_code: number;
    gate_allowed: boolean;
    gate_code: string;
    policy: GatePolicy;
    scope: 'workingTree';
  };
}): string => {
  const relativePath = `.pumuki/loop-sessions/${params.sessionId}.attempt-${params.attempt}.json`;
  const absolutePath = resolve(params.repoRoot, relativePath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${JSON.stringify(params.payload, null, 2)}\n`, 'utf8');
  return relativePath;
};

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
        const report = runLifecycleDoctor({
          deep: parsed.doctorDeep === true,
        });
        const remoteCiDiagnostics = parsed.remoteChecks
          ? activeDependencies.collectRemoteCiDiagnostics({
              repoRoot: report.repoRoot,
            })
          : undefined;
        if (parsed.json) {
          writeInfo(
            JSON.stringify(
              remoteCiDiagnostics
                ? {
                    ...report,
                    remoteCiDiagnostics,
                  }
                : report,
              null,
              2
            )
          );
        } else {
          printDoctorReport(report, remoteCiDiagnostics);
        }
        return doctorHasBlockingIssues(report) ? 1 : 0;
      }
      case 'status': {
        const status = readLifecycleStatus();
        const remoteCiDiagnostics = parsed.remoteChecks
          ? activeDependencies.collectRemoteCiDiagnostics({
              repoRoot: status.repoRoot,
            })
          : undefined;
        if (parsed.json) {
          writeInfo(
            JSON.stringify(
              remoteCiDiagnostics
                ? {
                    ...status,
                    remoteCiDiagnostics,
                  }
                : status,
              null,
              2
            )
          );
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
          if (remoteCiDiagnostics) {
            printRemoteCiDiagnostics(remoteCiDiagnostics);
          }
        }
        return 0;
      }
      case 'loop': {
        const repoRoot = process.cwd();
        if (parsed.loopCommand === 'run') {
          const session = createLoopSessionContract({
            objective: parsed.loopObjective ?? '',
            maxAttempts: parsed.loopMaxAttempts ?? 3,
          });
          createLoopSession({
            repoRoot,
            session,
          });
          const attemptNumber = session.current_attempt + 1;
          const startedAt = new Date().toISOString();
          const gateExitCode = await activeDependencies.runPlatformGate({
            policy: LOOP_RUN_POLICY,
            scope: {
              kind: 'workingTree',
            },
            auditMode: 'engine',
          });
          const finishedAt = new Date().toISOString();
          const gateAllowed = gateExitCode === 0;
          const gateCode = gateAllowed ? 'ALLOW' : 'BLOCK';
          const evidencePath = writeLoopAttemptEvidence({
            repoRoot,
            sessionId: session.session_id,
            attempt: attemptNumber,
            payload: {
              session_id: session.session_id,
              attempt: attemptNumber,
              started_at: startedAt,
              finished_at: finishedAt,
              gate_exit_code: gateExitCode,
              gate_allowed: gateAllowed,
              gate_code: gateCode,
              policy: LOOP_RUN_POLICY,
              scope: 'workingTree',
            },
          });
          const updatedSession: typeof session = {
            ...session,
            status: gateAllowed ? 'running' : 'blocked',
            updated_at: finishedAt,
            current_attempt: attemptNumber,
            attempts: [
              ...session.attempts,
              {
                attempt: attemptNumber,
                started_at: startedAt,
                finished_at: finishedAt,
                outcome: gateAllowed ? 'pass' : 'block',
                gate_allowed: gateAllowed,
                gate_code: gateCode,
                evidence_path: evidencePath,
              },
            ],
          };
          updateLoopSession({
            repoRoot,
            session: updatedSession,
          });
          if (parsed.json) {
            writeInfo(JSON.stringify(updatedSession, null, 2));
          } else {
            writeInfo(
              `[pumuki][loop] session created: id=${updatedSession.session_id} status=${updatedSession.status} attempt=${updatedSession.current_attempt}/${updatedSession.max_attempts}`
            );
            writeInfo(
              `[pumuki][loop] attempt #${attemptNumber} gate=${gateCode} evidence=${evidencePath}`
            );
          }
          return gateAllowed ? 0 : 1;
        }
        if (parsed.loopCommand === 'list') {
          const sessions = listLoopSessions(repoRoot);
          if (parsed.json) {
            writeInfo(JSON.stringify(sessions, null, 2));
          } else {
            writeInfo(`[pumuki][loop] sessions=${sessions.length}`);
            for (const session of sessions) {
              writeInfo(
                `[pumuki][loop] ${session.session_id} status=${session.status} attempt=${session.current_attempt}/${session.max_attempts} updated_at=${session.updated_at}`
              );
            }
          }
          return 0;
        }

        const sessionRead = readLoopSession({
          repoRoot,
          sessionId: parsed.loopSessionId ?? '',
        });
        if (sessionRead.kind === 'missing') {
          writeError(`[pumuki][loop] session not found: ${parsed.loopSessionId}`);
          return 1;
        }
        if (sessionRead.kind === 'invalid') {
          writeError(
            `[pumuki][loop] invalid session "${parsed.loopSessionId}": ${sessionRead.reason}`
          );
          return 1;
        }
        if (parsed.loopCommand === 'status') {
          if (parsed.json) {
            writeInfo(JSON.stringify(sessionRead.session, null, 2));
          } else {
            writeInfo(
              `[pumuki][loop] ${sessionRead.session.session_id} status=${sessionRead.session.status} attempt=${sessionRead.session.current_attempt}/${sessionRead.session.max_attempts} updated_at=${sessionRead.session.updated_at}`
            );
          }
          return 0;
        }
        if (parsed.loopCommand === 'export') {
          const outputPath = toLocalOutputAbsolutePath(
            repoRoot,
            parsed.loopOutputJsonPath ??
              `.audit-reports/loop-session-${sessionRead.session.session_id}.json`
          );
          mkdirSync(dirname(outputPath), { recursive: true });
          writeFileSync(outputPath, `${JSON.stringify(sessionRead.session, null, 2)}\n`, 'utf8');
          if (parsed.json) {
            writeInfo(
              JSON.stringify(
                {
                  session_id: sessionRead.session.session_id,
                  output_json: parsed.loopOutputJsonPath ??
                    `.audit-reports/loop-session-${sessionRead.session.session_id}.json`,
                },
                null,
                2
              )
            );
          } else {
            writeInfo(
              `[pumuki][loop] export completed: session=${sessionRead.session.session_id} path=${parsed.loopOutputJsonPath ??
                `.audit-reports/loop-session-${sessionRead.session.session_id}.json`}`
            );
          }
          return 0;
        }

        const nextStatus: 'stopped' | 'running' =
          parsed.loopCommand === 'stop' ? 'stopped' : 'running';
        if (!isLoopSessionTransitionAllowed(sessionRead.session.status, nextStatus)) {
          writeError(
            `[pumuki][loop] invalid transition ${sessionRead.session.status} -> ${nextStatus} for ${sessionRead.session.session_id}`
          );
          return 1;
        }
        const updated: typeof sessionRead.session = {
          ...sessionRead.session,
          status: nextStatus,
          updated_at: new Date().toISOString(),
        };
        updateLoopSession({
          repoRoot,
          session: updated,
        });
        if (parsed.json) {
          writeInfo(JSON.stringify(updated, null, 2));
        } else {
          writeInfo(
            `[pumuki][loop] session ${updated.session_id} status=${updated.status}`
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
          let result = evaluateSddPolicy({
            stage: parsed.sddStage ?? 'PRE_COMMIT',
          });
          const preWriteAutoBootstrapEnabled = process.env.PUMUKI_PREWRITE_AUTO_BOOTSTRAP !== '0';
          const preWriteBootstrapTrace: PreWriteOpenSpecBootstrapTrace = {
            enabled: preWriteAutoBootstrapEnabled,
            attempted: false,
            status: 'SKIPPED',
            actions: [],
          };
          if (
            result.stage === 'PRE_WRITE'
            && !result.decision.allowed
            && PRE_WRITE_OPENSPEC_AUTOREMEDIABLE_CODES.has(result.decision.code)
          ) {
            if (preWriteAutoBootstrapEnabled) {
              preWriteBootstrapTrace.attempted = true;
              try {
                const bootstrap = runOpenSpecBootstrap({
                  repoRoot: process.cwd(),
                });
                preWriteBootstrapTrace.status = 'OK';
                preWriteBootstrapTrace.actions = [...bootstrap.actions];
                if (bootstrap.skippedReason) {
                  preWriteBootstrapTrace.details = `skipped=${bootstrap.skippedReason}`;
                }
              } catch (error) {
                preWriteBootstrapTrace.status = 'FAILED';
                preWriteBootstrapTrace.details = error instanceof Error
                  ? error.message
                  : 'Unknown OpenSpec bootstrap error';
              }
              result = evaluateSddPolicy({
                stage: parsed.sddStage ?? 'PRE_COMMIT',
              });
            } else {
              preWriteBootstrapTrace.details =
                'auto bootstrap disabled via PUMUKI_PREWRITE_AUTO_BOOTSTRAP=0';
            }
          }
          const shouldEvaluateAiGate = result.stage === 'PRE_WRITE';
          let aiGate = shouldEvaluateAiGate
            ? runEnterpriseAiGateCheck({
              repoRoot: process.cwd(),
              stage: result.stage,
              requireMcpReceipt: true,
            }).result
            : null;
          const automationTrace: PreWriteAutomationTrace = {
            attempted: false,
            actions: [],
          };
          if (result.stage === 'PRE_WRITE' && aiGate) {
            const auto = await buildPreWriteAutomationTrace({
              repoRoot: process.cwd(),
              sdd: result,
              aiGate,
              runPlatformGate: activeDependencies.runPlatformGate,
            });
            aiGate = auto.aiGate;
            automationTrace.attempted = auto.trace.attempted;
            automationTrace.actions = auto.trace.actions;
          }
          const nextAction = resolvePreWriteNextAction({
            sdd: result,
            aiGate,
          });
          if (parsed.json) {
            writeInfo(
              JSON.stringify(
                aiGate
                  ? buildPreWriteValidationEnvelope(
                    result,
                    aiGate,
                    automationTrace,
                    preWriteBootstrapTrace,
                    nextAction
                  )
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
            if (result.stage === 'PRE_WRITE') {
              writeInfo(
                `[pumuki][sdd] openspec auto-bootstrap: enabled=${preWriteBootstrapTrace.enabled ? 'yes' : 'no'} attempted=${preWriteBootstrapTrace.attempted ? 'yes' : 'no'} status=${preWriteBootstrapTrace.status} actions=${preWriteBootstrapTrace.actions.join(',') || 'none'}`
              );
              if (preWriteBootstrapTrace.details) {
                writeInfo(
                  `[pumuki][sdd] openspec auto-bootstrap details: ${preWriteBootstrapTrace.details}`
                );
              }
            }
            if (aiGate) {
              writeInfo(buildPreWriteValidationPanel({
                sdd: result,
                aiGate,
                automation: automationTrace,
              }));
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
            if (nextAction) {
              writeInfo(`[pumuki][sdd] next action (${nextAction.reason}): ${nextAction.command}`);
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
        if (parsed.sddCommand === 'sync-docs') {
          const syncResult = runSddSyncDocs({
            repoRoot: process.cwd(),
            dryRun: parsed.sddSyncDocsDryRun === true,
          });
          if (parsed.json) {
            writeInfo(JSON.stringify(syncResult, null, 2));
          } else {
            writeInfo(
              `[pumuki][sdd] sync-docs dry_run=${syncResult.dryRun ? 'yes' : 'no'} updated=${syncResult.updated ? 'yes' : 'no'} files=${syncResult.files.length}`
            );
            for (const file of syncResult.files) {
              writeInfo(
                `[pumuki][sdd] file=${file.path} updated=${file.updated ? 'yes' : 'no'} before=${file.beforeDigest} after=${file.afterDigest}`
              );
              if (file.updated) {
                writeInfo(file.diffMarkdown);
              }
            }
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
    const isExplicitHelpInvocation = argv.some((arg) => arg === '--help' || arg === '-h');
    const message = error instanceof Error ? error.message : 'Unexpected lifecycle CLI error.';
    writeError(message);
    return isExplicitHelpInvocation ? 0 : 1;
  }
};

if (require.main === module) {
  void runLifecycleCli(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
