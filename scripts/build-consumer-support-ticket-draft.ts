import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  buildSupportTicketDraft,
  parseAuthReport,
  parseSupportBundle,
} from './consumer-support-ticket-lib';

type CliOptions = {
  repo: string;
  supportBundleFile: string;
  authReportFile: string;
  outFile: string;
};

const DEFAULT_REPO = 'SwiftEnProfundidad/R_GO';
const DEFAULT_SUPPORT_BUNDLE_FILE = 'docs/validation/skills-rollout-r_go-support-bundle.md';
const DEFAULT_AUTH_REPORT_FILE = 'docs/validation/consumer-ci-auth-check.md';
const DEFAULT_OUT_FILE = 'docs/validation/consumer-support-ticket-draft.md';

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    repo: DEFAULT_REPO,
    supportBundleFile: DEFAULT_SUPPORT_BUNDLE_FILE,
    authReportFile: DEFAULT_AUTH_REPORT_FILE,
    outFile: DEFAULT_OUT_FILE,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--repo') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --repo');
      }
      options.repo = value;
      index += 1;
      continue;
    }

    if (arg === '--support-bundle') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --support-bundle');
      }
      options.supportBundleFile = value;
      index += 1;
      continue;
    }

    if (arg === '--auth-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --auth-report');
      }
      options.authReportFile = value;
      index += 1;
      continue;
    }

    if (arg === '--out') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out');
      }
      options.outFile = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

const resolveRequiredFile = (pathLike: string): string => {
  const absolute = resolve(process.cwd(), pathLike);
  if (!existsSync(absolute)) {
    throw new Error(`Input file not found: ${pathLike}`);
  }
  return absolute;
};

const main = (): number => {
  const options = parseArgs(process.argv.slice(2));

  const supportBundlePath = resolveRequiredFile(options.supportBundleFile);
  const authReportPath = resolveRequiredFile(options.authReportFile);

  const supportBundle = readFileSync(supportBundlePath, 'utf8');
  const authReport = readFileSync(authReportPath, 'utf8');

  const draft = buildSupportTicketDraft({
    repo: options.repo,
    supportBundlePath: options.supportBundleFile,
    authReportPath: options.authReportFile,
    support: parseSupportBundle(supportBundle),
    auth: parseAuthReport(authReport),
  });

  const outputPath = resolve(process.cwd(), options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, draft, 'utf8');

  process.stdout.write(`consumer support ticket draft generated at ${outputPath}\n`);
  return 0;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`consumer support ticket draft failed: ${message}\n`);
  process.exit(1);
}
