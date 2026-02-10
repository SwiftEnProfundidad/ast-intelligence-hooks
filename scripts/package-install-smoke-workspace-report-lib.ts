import { join } from 'node:path';
import {
  writeReportFile,
  type RunCommandResult,
} from './package-install-smoke-runner-common';
import type { SmokeWorkspace } from './package-install-smoke-workspace-contract';

export const pushCommandLog = (
  commandLog: string[],
  result: RunCommandResult
): void => {
  commandLog.push(`$ ${result.command}\n${result.combined}`.trim());
};

export const writeFailureReport = (
  workspace: SmokeWorkspace,
  error: Error
): void => {
  workspace.summary.push('- Status: FAIL');
  workspace.summary.push(`- Error: ${error.message}`);
  writeReportFile(
    workspace.repoRoot,
    join(workspace.reportsDir, 'command.log'),
    workspace.commandLog.join('\n\n')
  );
  writeReportFile(
    workspace.repoRoot,
    join(workspace.reportsDir, 'summary.md'),
    workspace.summary.join('\n')
  );
};

export const writeSuccessReport = (workspace: SmokeWorkspace): void => {
  writeReportFile(
    workspace.repoRoot,
    join(workspace.reportsDir, 'command.log'),
    workspace.commandLog.join('\n\n')
  );
  writeReportFile(
    workspace.repoRoot,
    join(workspace.reportsDir, 'summary.md'),
    workspace.summary.join('\n')
  );
};
