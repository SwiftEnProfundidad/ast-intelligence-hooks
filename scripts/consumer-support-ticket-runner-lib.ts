import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { ConsumerSupportTicketCliOptions } from './consumer-support-ticket-cli-contract';
import { resolveRequiredConsumerSupportTicketFile } from './consumer-support-ticket-cli-lib';
import { buildSupportTicketDraft } from './consumer-support-ticket-draft-lib';
import { parseAuthReport, parseSupportBundle } from './consumer-support-ticket-parser-lib';

export const buildConsumerSupportTicketDraftFromOptions = (params: {
  cwd: string;
  options: ConsumerSupportTicketCliOptions;
}): string => {
  const supportBundlePath = resolveRequiredConsumerSupportTicketFile(
    params.cwd,
    params.options.supportBundleFile
  );
  const authReportPath = resolveRequiredConsumerSupportTicketFile(
    params.cwd,
    params.options.authReportFile
  );

  const supportBundle = readFileSync(supportBundlePath, 'utf8');
  const authReport = readFileSync(authReportPath, 'utf8');

  return buildSupportTicketDraft({
    repo: params.options.repo,
    supportBundlePath: params.options.supportBundleFile,
    authReportPath: params.options.authReportFile,
    support: parseSupportBundle(supportBundle),
    auth: parseAuthReport(authReport),
  });
};

export const writeConsumerSupportTicketDraft = (params: {
  cwd: string;
  outFile: string;
  draft: string;
}): string => {
  const outputPath = resolve(params.cwd, params.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, params.draft, 'utf8');
  return outputPath;
};
