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

type LifecycleCommand =
  | 'install'
  | 'uninstall'
  | 'remove'
  | 'update'
  | 'doctor'
  | 'status'
  | 'sdd'
  | 'adapter';

type SddCommand = 'status' | 'validate' | 'session';

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
  value === 'adapter';

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
