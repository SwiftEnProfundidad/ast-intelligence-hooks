import { runLifecycleDoctor, type LifecycleDoctorReport } from './doctor';
import { runLifecycleInstall } from './install';
import { runLifecycleRemove } from './remove';
import { readLifecycleStatus } from './status';
import { runLifecycleUninstall } from './uninstall';
import { runLifecycleUpdate } from './update';

type LifecycleCommand =
  | 'install'
  | 'uninstall'
  | 'remove'
  | 'update'
  | 'doctor'
  | 'status';

type ParsedArgs = {
  command: LifecycleCommand;
  purgeArtifacts: boolean;
  updateSpec?: string;
};

const HELP_TEXT = `
Pumuki lifecycle commands:
  pumuki install
  pumuki uninstall [--purge-artifacts]
  pumuki remove
  pumuki update [--latest|--spec=<package-spec>]
  pumuki doctor
  pumuki status
`.trim();

const isLifecycleCommand = (value: string): value is LifecycleCommand =>
  value === 'install' ||
  value === 'uninstall' ||
  value === 'remove' ||
  value === 'update' ||
  value === 'doctor' ||
  value === 'status';

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
  for (const arg of argv.slice(1)) {
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
        return 0;
      }
      case 'doctor': {
        const report = runLifecycleDoctor();
        printDoctorReport(report);
        return report.issues.some((issue) => issue.severity === 'error') ? 1 : 0;
      }
      case 'status': {
        const status = readLifecycleStatus();
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
        return 0;
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
