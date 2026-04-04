import { basename, join, resolve } from 'node:path';

export const DEFAULT_CONSUMER_MENU_MATRIX_BASELINE_ROUNDS = 3;
export const DEFAULT_CONSUMER_MENU_MATRIX_BASELINE_OUT_BASE =
  '.audit-reports/fixture-matrix';
export const DEFAULT_CONSUMER_MENU_MATRIX_BASELINE_DIRNAME =
  'consumer-menu-matrix-baseline';
export const DEFAULT_CONSUMER_MENU_MATRIX_BASELINE_REPORT_FILE = 'report.json';
export const DEFAULT_CONSUMER_MENU_MATRIX_BASELINE_SUMMARY_FILE = 'summary.md';

export type ConsumerMenuMatrixBaselineCliOptions = {
  repoRoot: string;
  fixture: string;
  rounds: number;
  outDir: string;
  printJson: boolean;
};

export type ConsumerMenuMatrixBaselineOutputPaths = {
  reportPath: string;
  summaryPath: string;
};

const readRequiredArgValue = (
  args: ReadonlyArray<string>,
  index: number,
  option: string
): string => {
  const value = args[index + 1];
  if (!value) {
    throw new Error(`Missing value for ${option}`);
  }
  return value;
};

export const resolveConsumerMenuMatrixBaselineOutputPaths = (
  outDir: string
): ConsumerMenuMatrixBaselineOutputPaths => {
  return {
    reportPath: join(outDir, DEFAULT_CONSUMER_MENU_MATRIX_BASELINE_REPORT_FILE),
    summaryPath: join(outDir, DEFAULT_CONSUMER_MENU_MATRIX_BASELINE_SUMMARY_FILE),
  };
};

export const parseConsumerMenuMatrixBaselineArgs = (
  args: ReadonlyArray<string>,
  cwd = process.cwd()
): ConsumerMenuMatrixBaselineCliOptions => {
  let repoRoot = resolve(cwd);
  let fixture = '';
  let rounds = DEFAULT_CONSUMER_MENU_MATRIX_BASELINE_ROUNDS;
  let outDir = '';
  let printJson = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--json') {
      printJson = true;
      continue;
    }

    if (arg === '--repo-root' || arg === '--repo') {
      repoRoot = resolve(cwd, readRequiredArgValue(args, index, arg));
      index += 1;
      continue;
    }

    if (arg === '--fixture') {
      fixture = readRequiredArgValue(args, index, arg).trim();
      if (!fixture) {
        throw new Error('Flag --fixture requires a non-empty value.');
      }
      index += 1;
      continue;
    }

    if (arg === '--rounds') {
      const rawValue = readRequiredArgValue(args, index, arg);
      const parsedValue = Number.parseInt(rawValue, 10);
      if (!Number.isInteger(parsedValue) || parsedValue < 1) {
        throw new Error('Flag --rounds requires an integer greater than or equal to 1.');
      }
      rounds = parsedValue;
      index += 1;
      continue;
    }

    if (arg === '--out-dir') {
      outDir = resolve(cwd, readRequiredArgValue(args, index, arg));
      index += 1;
      continue;
    }

    throw new Error(
      `Unknown argument: ${arg}. Allowed: --repo-root <path> --fixture <name> --rounds <n> --out-dir <path> --json`
    );
  }

  const resolvedFixture = fixture || basename(repoRoot) || 'fixture';
  const resolvedOutDir =
    outDir ||
    resolve(
      cwd,
      DEFAULT_CONSUMER_MENU_MATRIX_BASELINE_OUT_BASE,
      resolvedFixture,
      DEFAULT_CONSUMER_MENU_MATRIX_BASELINE_DIRNAME
    );

  return {
    repoRoot,
    fixture: resolvedFixture,
    rounds,
    outDir: resolvedOutDir,
    printJson,
  };
};
