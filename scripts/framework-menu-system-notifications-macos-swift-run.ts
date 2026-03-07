import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  SWIFT_BLOCKED_DIALOG_SCRIPT_RELATIVE_PATH,
  type SystemNotificationCommandRunnerWithOutput,
} from './framework-menu-system-notifications-types';
import { extractDialogButton } from './framework-menu-system-notifications-macos-runner';
import { buildSwiftFloatingDialogArgs } from './framework-menu-system-notifications-macos-swift-args';
import { SWIFT_BLOCKED_DIALOG_SOURCE } from './framework-menu-system-notifications-macos-swift-source';

export const resolveSwiftBlockedDialogScriptPath = (repoRoot: string): string => {
  const scriptPath = join(repoRoot, SWIFT_BLOCKED_DIALOG_SCRIPT_RELATIVE_PATH);
  mkdirSync(dirname(scriptPath), { recursive: true });
  if (!existsSync(scriptPath) || readFileSync(scriptPath, 'utf8') !== `${SWIFT_BLOCKED_DIALOG_SOURCE}
`) {
    writeFileSync(scriptPath, `${SWIFT_BLOCKED_DIALOG_SOURCE}
`, 'utf8');
  }
  return scriptPath;
};

export const runBlockedDialogWithSwiftHelper = (params: {
  repoRoot: string;
  title: string;
  cause: string;
  remediation: string;
  runner: SystemNotificationCommandRunnerWithOutput;
}): {
  selectedButton: string | null;
  commandFailed: boolean;
} => {
  const scriptPath = resolveSwiftBlockedDialogScriptPath(params.repoRoot);
  const dialogResult = params.runner(
    'swift',
    buildSwiftFloatingDialogArgs({
      scriptPath,
      title: params.title,
      cause: params.cause,
      remediation: params.remediation,
    })
  );
  if (dialogResult.exitCode !== 0) {
    return {
      selectedButton: null,
      commandFailed: true,
    };
  }
  return {
    selectedButton: extractDialogButton(dialogResult.stdout),
    commandFailed: false,
  };
};
