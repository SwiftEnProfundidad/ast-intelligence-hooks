import { resolve } from 'node:path';
import type { EnterpriseContractSuiteOptions } from './enterprise-contract-suite-contract';

export const DEFAULT_ENTERPRISE_CONTRACT_REPORT_PATH =
  '.audit-reports/enterprise-contract-suite/report.json';

export const DEFAULT_ENTERPRISE_CONTRACT_SUMMARY_PATH =
  '.audit-reports/enterprise-contract-suite/summary.md';

export const parseEnterpriseContractSuiteArgs = (
  argv: ReadonlyArray<string>,
  cwd = process.cwd()
): EnterpriseContractSuiteOptions => {
  const options: EnterpriseContractSuiteOptions = {
    repoRoot: resolve(cwd),
    reportPath: DEFAULT_ENTERPRISE_CONTRACT_REPORT_PATH,
    summaryPath: DEFAULT_ENTERPRISE_CONTRACT_SUMMARY_PATH,
    printJson: false,
  };

  for (const arg of argv) {
    if (arg === '--json') {
      options.printJson = true;
      continue;
    }

    if (arg.startsWith('--repo=')) {
      const value = arg.slice('--repo='.length).trim();
      if (!value) {
        throw new Error('Flag --repo requires a non-empty path.');
      }
      options.repoRoot = resolve(value);
      continue;
    }

    if (arg.startsWith('--out=')) {
      const value = arg.slice('--out='.length).trim();
      if (!value) {
        throw new Error('Flag --out requires a non-empty path.');
      }
      options.reportPath = value;
      continue;
    }

    if (arg.startsWith('--summary=')) {
      const value = arg.slice('--summary='.length).trim();
      if (!value) {
        throw new Error('Flag --summary requires a non-empty path.');
      }
      options.summaryPath = value;
      continue;
    }

    throw new Error(
      `Unsupported argument "${arg}". Allowed: --repo=<path> --out=<path> --summary=<path> --json`
    );
  }

  return options;
};
