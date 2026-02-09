import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  parseConsumerSupportTicketArgs,
  resolveRequiredConsumerSupportTicketFile,
} from './consumer-support-ticket-cli-lib';
import { buildSupportTicketDraft } from './consumer-support-ticket-draft-lib';
import { parseAuthReport, parseSupportBundle } from './consumer-support-ticket-parser-lib';

const main = (): number => {
  const cwd = process.cwd();
  const options = parseConsumerSupportTicketArgs(process.argv.slice(2));

  const supportBundlePath = resolveRequiredConsumerSupportTicketFile(
    cwd,
    options.supportBundleFile
  );
  const authReportPath = resolveRequiredConsumerSupportTicketFile(
    cwd,
    options.authReportFile
  );

  const supportBundle = readFileSync(supportBundlePath, 'utf8');
  const authReport = readFileSync(authReportPath, 'utf8');

  const draft = buildSupportTicketDraft({
    repo: options.repo,
    supportBundlePath: options.supportBundleFile,
    authReportPath: options.authReportFile,
    support: parseSupportBundle(supportBundle),
    auth: parseAuthReport(authReport),
  });

  const outputPath = resolve(cwd, options.outFile);
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
