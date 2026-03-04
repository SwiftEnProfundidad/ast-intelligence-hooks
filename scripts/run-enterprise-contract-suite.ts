import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
import {
  parseEnterpriseContractSuiteArgs,
} from './enterprise-contract-suite-args-lib';
import {
  buildEnterpriseContractReport,
  renderEnterpriseContractSummary,
} from './enterprise-contract-suite-report-lib';
import type {
  EnterpriseContractProfileSpec,
  EnterpriseContractProfileResult,
} from './enterprise-contract-suite-contract';
import { resolveEnterpriseContractProfiles } from './enterprise-contract-suite-contract';
import { ensureDirectory } from './package-install-smoke-file-lib';
import { runCommand } from './package-install-smoke-command-lib';

const runProfile = (
  repoRoot: string,
  profile: EnterpriseContractProfileSpec
): EnterpriseContractProfileResult => {
  const args = ['--import', 'tsx', 'scripts/package-install-smoke.ts', `--mode=${profile.mode}`];
  const result = runCommand({
    cwd: repoRoot,
    executable: 'node',
    args,
  });

  return {
    id: profile.id,
    mode: profile.mode,
    command: `node ${args.join(' ')}`,
    expectedExitCode: profile.expectedExitCode,
    exitCode: result.exitCode,
    status: result.exitCode === profile.expectedExitCode ? 'PASS' : 'FAIL',
  };
};

const writeTextFile = (repoRoot: string, relativePath: string, content: string): void => {
  const filePath = join(repoRoot, relativePath);
  ensureDirectory(dirname(filePath));
  writeFileSync(filePath, content, 'utf8');
};

const main = (): number => {
  const options = parseEnterpriseContractSuiteArgs(process.argv.slice(2));
  const results = resolveEnterpriseContractProfiles().map((profile) =>
    runProfile(options.repoRoot, profile)
  );

  const report = buildEnterpriseContractReport({
    repoRoot: options.repoRoot,
    profiles: results,
  });

  writeTextFile(options.repoRoot, options.reportPath, `${JSON.stringify(report, null, 2)}\n`);
  writeTextFile(options.repoRoot, options.summaryPath, renderEnterpriseContractSummary(report));

  if (options.printJson) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }

  return report.overall === 'PASS' ? 0 : 1;
};

process.exit(main());
