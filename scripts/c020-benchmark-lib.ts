import { resolve } from 'node:path';

export const DEFAULT_C020_LEGACY_BASELINE_PATH = 'assets/benchmarks/legacy-baseline-precommit-v012.json';

export type C020BenchmarkOptions = {
  legacyBaselinePath: string;
  enterpriseEvidencePath: string;
  menuLogPath: string;
  parityReportPath: string;
  parityLogPath: string;
  outputDir: string;
  strictScope: boolean;
  sddBypass: boolean;
};

export const buildDefaultC020BenchmarkOptions = (): C020BenchmarkOptions => ({
  legacyBaselinePath: DEFAULT_C020_LEGACY_BASELINE_PATH,
  enterpriseEvidencePath: '.audit_tmp/c020-a/enterprise-menu1.json',
  menuLogPath: '.audit_tmp/c020-a/menu-option1.out',
  parityReportPath: '.audit-reports/c020-a-legacy-parity-menu1.md',
  parityLogPath: '.audit_tmp/c020-a/parity-menu1.out',
  outputDir: '.audit_tmp/c020-a',
  strictScope: false,
  sddBypass: true,
});

const normalizePath = (value: string): string => resolve(value.trim());

export const parseC020BenchmarkArgs = (
  argv: ReadonlyArray<string>,
  defaults: C020BenchmarkOptions = buildDefaultC020BenchmarkOptions()
): C020BenchmarkOptions => {
  const options: C020BenchmarkOptions = { ...defaults };

  for (const arg of argv) {
    if (arg.startsWith('--legacy=')) {
      options.legacyBaselinePath = normalizePath(arg.slice('--legacy='.length));
      continue;
    }
    if (arg.startsWith('--enterprise=')) {
      options.enterpriseEvidencePath = normalizePath(arg.slice('--enterprise='.length));
      continue;
    }
    if (arg.startsWith('--menu-log=')) {
      options.menuLogPath = normalizePath(arg.slice('--menu-log='.length));
      continue;
    }
    if (arg.startsWith('--parity=')) {
      options.parityReportPath = normalizePath(arg.slice('--parity='.length));
      continue;
    }
    if (arg.startsWith('--parity-log=')) {
      options.parityLogPath = normalizePath(arg.slice('--parity-log='.length));
      continue;
    }
    if (arg.startsWith('--out-dir=')) {
      options.outputDir = normalizePath(arg.slice('--out-dir='.length));
      continue;
    }
    if (arg === '--strict-scope') {
      options.strictScope = true;
      continue;
    }
    if (arg === '--no-sdd-bypass') {
      options.sddBypass = false;
      continue;
    }
  }

  return options;
};

export const buildLegacyParityCommandArgs = (options: C020BenchmarkOptions): string[] => {
  const args = [
    '--import',
    'tsx',
    'scripts/build-legacy-parity-report.ts',
    `--legacy=${options.legacyBaselinePath}`,
    `--enterprise=${options.enterpriseEvidencePath}`,
    `--out=${options.parityReportPath}`,
  ];
  if (!options.strictScope) {
    args.push('--allow-scope-mismatch');
  }
  return args;
};
