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

const isLifecycleCommand = (value: string): value is LifecycleCommand =>
  value === 'install' ||
  value === 'uninstall' ||
  value === 'remove' ||
  value === 'update' ||
  value === 'doctor' ||
  value === 'status' ||
  value === 'sdd' ||
  value === 'adapter';

const parseAdapterAgent = (value: string | undefined): AdapterAgent => {
  const normalized = (value ?? '').trim();
  if (/^[a-z0-9._-]+$/i.test(normalized)) {
    return normalized;
  }
  throw new Error(`Unsupported adapter agent "${value}". Use an alphanumeric id.`);
};

const parseSddStage = (value: string | undefined): SddStage => {
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
  let updateSpec: string | undefined;
  let json = false;
  let sddCommand: SddCommand | undefined;
  let sddStage: SddStage | undefined;
  let sddSessionAction: SddSessionAction | undefined;
  let sddChangeId: string | undefined;
  let sddTtlMinutes: number | undefined;
  let adapterCommand: 'install' | undefined;
  let adapterAgent: AdapterAgent | undefined;
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
  console.log(`[pumuki] repo: ${report.repoRoot}`);
  console.log(`[pumuki] package version: ${report.packageVersion}`);
  console.log(
    `[pumuki] tracked node_modules paths: ${report.trackedNodeModulesPaths.length}`
  );
  console.log(
    `[pumuki] hook pre-commit: ${report.hookStatus['pre-commit'].managedBlockPresent ? 'managed' : 'missing'}`
  );
  console.log(
    `[pumuki] hook pre-push: ${report.hookStatus['pre-push'].managedBlockPresent ? 'managed' : 'missing'}`
  );

  if (report.issues.length === 0) {
    console.log('[pumuki] doctor verdict: PASS');
    return;
  }

  for (const issue of report.issues) {
    console.log(`[pumuki] ${issue.severity.toUpperCase()}: ${issue.message}`);
  }
  const hasBlocking = report.issues.some((issue) => issue.severity === 'error');
  console.log(`[pumuki] doctor verdict: ${hasBlocking ? 'BLOCKED' : 'WARN'}`);
};

const PRE_WRITE_TELEMETRY_CHAIN = 'pumuki->ai_gate->ai_evidence';

type PreWriteValidationEnvelope = {
  sdd: ReturnType<typeof evaluateSddPolicy>;
  ai_gate: ReturnType<typeof evaluateAiGate>;
  telemetry: {
    chain: typeof PRE_WRITE_TELEMETRY_CHAIN;
    stage: SddStage;
  };
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
  },
});

export const runLifecycleCli = async (
  argv: ReadonlyArray<string>
): Promise<number> => {
  try {
    const parsed = parseLifecycleCliArgs(argv);

    switch (parsed.command) {
      case 'install': {
        const result = runLifecycleInstall();
        console.log(
          `[pumuki] installed ${result.version} at ${result.repoRoot} (hooks changed: ${result.changedHooks.join(', ') || 'none'})`
        );
        if (result.openSpecBootstrap) {
          console.log(
            `[pumuki] openspec bootstrap: installed=${result.openSpecBootstrap.packageInstalled ? 'yes' : 'no'} project=${result.openSpecBootstrap.projectInitialized ? 'yes' : 'no'} actions=${result.openSpecBootstrap.actions.join(', ') || 'none'}`
          );
          if (result.openSpecBootstrap.skippedReason === 'NO_PACKAGE_JSON') {
            console.log('[pumuki] openspec bootstrap skipped npm install (package.json not found)');
          }
        }
        return 0;
      }
      case 'uninstall': {
        const result = runLifecycleUninstall({
          purgeArtifacts: parsed.purgeArtifacts,
        });
        console.log(
          `[pumuki] uninstalled from ${result.repoRoot} (hooks changed: ${result.changedHooks.join(', ') || 'none'})`
        );
        if (parsed.purgeArtifacts) {
          console.log(
            `[pumuki] removed artifacts: ${result.removedArtifacts.join(', ') || 'none'}`
          );
        }
        return 0;
      }
      case 'remove': {
        const result = runLifecycleRemove();
        console.log(
          `[pumuki] removed from ${result.repoRoot} (package removed: ${result.packageRemoved ? 'yes' : 'no'}, hooks changed: ${result.changedHooks.join(', ') || 'none'})`
        );
        console.log(
          `[pumuki] removed artifacts: ${result.removedArtifacts.join(', ') || 'none'}`
        );
        return 0;
      }
      case 'update': {
        const result = runLifecycleUpdate({
          targetSpec: parsed.updateSpec,
        });
        console.log(
          `[pumuki] updated to ${result.targetSpec} at ${result.repoRoot} (hooks changed: ${result.reinstallHooksChanged.join(', ') || 'none'})`
        );
        console.log(
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
          console.log(JSON.stringify(status, null, 2));
        } else {
          console.log(`[pumuki] repo: ${status.repoRoot}`);
          console.log(`[pumuki] package version: ${status.packageVersion}`);
          console.log(`[pumuki] lifecycle installed: ${status.lifecycleState.installed ?? 'false'}`);
          console.log(`[pumuki] lifecycle version: ${status.lifecycleState.version ?? 'unknown'}`);
          console.log(
            `[pumuki] hooks: pre-commit=${status.hookStatus['pre-commit'].managedBlockPresent ? 'managed' : 'missing'}, pre-push=${status.hookStatus['pre-push'].managedBlockPresent ? 'managed' : 'missing'}`
          );
          console.log(
            `[pumuki] tracked node_modules paths: ${status.trackedNodeModulesCount}`
          );
        }
        return 0;
      }
      case 'sdd': {
        if (parsed.sddCommand === 'status') {
          const sddStatus = readSddStatus();
          if (parsed.json) {
            console.log(JSON.stringify(sddStatus, null, 2));
          } else {
            console.log(`[pumuki][sdd] repo: ${sddStatus.repoRoot}`);
            console.log(
              `[pumuki][sdd] openspec: installed=${sddStatus.openspec.installed ? 'yes' : 'no'} version=${sddStatus.openspec.version ?? 'unknown'}`
            );
            console.log(
              `[pumuki][sdd] openspec compatibility: compatible=${sddStatus.openspec.compatible ? 'yes' : 'no'} minimum=${sddStatus.openspec.minimumVersion} recommended=${sddStatus.openspec.recommendedVersion} parsed=${sddStatus.openspec.parsedVersion ?? 'unknown'}`
            );
            console.log(
              `[pumuki][sdd] openspec project initialized: ${sddStatus.openspec.projectInitialized ? 'yes' : 'no'}`
            );
            console.log(
              `[pumuki][sdd] session: active=${sddStatus.session.active ? 'yes' : 'no'} valid=${sddStatus.session.valid ? 'yes' : 'no'} change=${sddStatus.session.changeId ?? 'none'}`
            );
            if (typeof sddStatus.session.remainingSeconds === 'number') {
              console.log(
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
            ? evaluateAiGate({
              repoRoot: process.cwd(),
              stage: result.stage,
            })
            : null;
          if (parsed.json) {
            console.log(
              JSON.stringify(
                aiGate
                  ? buildPreWriteValidationEnvelope(result, aiGate)
                  : result,
                null,
                2
              )
            );
          } else {
            console.log(
              `[pumuki][sdd] stage=${result.stage} allowed=${result.decision.allowed ? 'yes' : 'no'} code=${result.decision.code}`
            );
            console.log(`[pumuki][sdd] ${result.decision.message}`);
            if (result.validation) {
              console.log(
                `[pumuki][sdd] validation: ok=${result.validation.ok ? 'yes' : 'no'} failed=${result.validation.totals.failed} errors=${result.validation.issues.errors}`
              );
            }
            if (aiGate) {
              console.log(
                `[pumuki][ai-gate] stage=${aiGate.stage} status=${aiGate.status} violations=${aiGate.violations.length}`
              );
              for (const violation of aiGate.violations) {
                console.log(
                  `[pumuki][ai-gate] ${violation.code}: ${violation.message}`
                );
              }
            }
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
              console.log(JSON.stringify(session, null, 2));
            } else {
              console.log(
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
              console.log(JSON.stringify(session, null, 2));
            } else {
              console.log(
                `[pumuki][sdd] session refreshed: change=${session.changeId ?? 'none'} ttlMinutes=${session.ttlMinutes ?? 'unknown'} valid=${session.valid ? 'yes' : 'no'}`
              );
            }
            return 0;
          }
          const session = closeSddSession();
          if (parsed.json) {
            console.log(JSON.stringify(session, null, 2));
          } else {
            console.log('[pumuki][sdd] session closed');
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
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log(
              `[pumuki] adapter install: agent=${result.agent} dry-run=${result.dryRun ? 'yes' : 'no'} changed=${result.changedFiles.length}`
            );
            if (result.changedFiles.length > 0) {
              console.log(
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
    console.error(message);
    return 1;
  }
};

if (require.main === module) {
  void runLifecycleCli(process.argv.slice(2)).then((code) => {
    process.exit(code);
  });
}
