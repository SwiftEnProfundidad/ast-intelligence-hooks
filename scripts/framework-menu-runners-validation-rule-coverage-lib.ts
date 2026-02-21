import { getExitCode } from './framework-menu-runner-common';
import {
  buildRuleCoverageDiagnostics,
  formatRuleCoverageDiagnostics,
} from './framework-menu-rule-coverage-diagnostics-lib';

export const runRuleCoverageDiagnostics = async (): Promise<number> => {
  try {
    const report = await buildRuleCoverageDiagnostics({
      repoRoot: process.cwd(),
    });
    process.stdout.write(`\n${formatRuleCoverageDiagnostics(report)}\n`);
    return 0;
  } catch (error) {
    return getExitCode(error);
  }
};

