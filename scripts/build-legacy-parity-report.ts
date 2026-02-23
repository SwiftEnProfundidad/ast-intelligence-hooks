import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildLegacyParityReport,
  formatLegacyParityReportMarkdown,
} from './legacy-parity-report-lib';

type Args = {
  legacyPath: string;
  enterprisePath: string;
  outputPath: string;
};

const parseArgs = (argv: ReadonlyArray<string>): Args => {
  let legacyPath = '';
  let enterprisePath = '';
  let outputPath = 'docs/LEGACY_PARITY_REPORT.md';

  for (const arg of argv) {
    if (arg.startsWith('--legacy=')) {
      legacyPath = arg.slice('--legacy='.length).trim();
      continue;
    }
    if (arg.startsWith('--enterprise=')) {
      enterprisePath = arg.slice('--enterprise='.length).trim();
      continue;
    }
    if (arg.startsWith('--out=')) {
      outputPath = arg.slice('--out='.length).trim();
    }
  }

  if (legacyPath.length === 0 || enterprisePath.length === 0) {
    throw new Error(
      'Usage: node --import tsx scripts/build-legacy-parity-report.ts --legacy=<path> --enterprise=<path> [--out=<path>]'
    );
  }

  return {
    legacyPath,
    enterprisePath,
    outputPath,
  };
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const report = buildLegacyParityReport({
    legacyPath: args.legacyPath,
    enterprisePath: args.enterprisePath,
  });
  const markdown = formatLegacyParityReportMarkdown(report);
  const outputPath = resolve(args.outputPath);
  writeFileSync(outputPath, `${markdown}\n`, 'utf8');
  process.stdout.write(
    `[pumuki][legacy-parity] dominance=${report.dominance} compared_rules=${report.totals.comparedRules} output=${outputPath}\n`
  );
  if (report.dominance === 'FAIL') {
    process.exitCode = 1;
  }
};

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  process.stderr.write(`[pumuki][legacy-parity] error: ${message}\n`);
  process.exitCode = 1;
}
