import type { ParsedAuthReport, ParsedSupportBundle } from './consumer-support-ticket-parser-lib';
import {
  buildSupportTicketAttachmentLines,
  buildSupportTicketAuthLines,
  buildSupportTicketEvidenceLines,
  buildSupportTicketHeaderLines,
  buildSupportTicketProblemSummaryLines,
  buildSupportTicketRequestLines,
} from './consumer-support-ticket-draft-sections-lib';

export const buildSupportTicketDraft = (params: {
  repo: string;
  supportBundlePath: string;
  authReportPath: string;
  support: ParsedSupportBundle;
  auth: ParsedAuthReport;
}): string => {
  const lines = [
    ...buildSupportTicketHeaderLines({
      generatedAt: new Date().toISOString(),
      repo: params.repo,
      supportBundlePath: params.supportBundlePath,
      authReportPath: params.authReportPath,
    }),
    ...buildSupportTicketProblemSummaryLines(params.support),
    ...buildSupportTicketEvidenceLines(params.support),
    ...buildSupportTicketAuthLines(params.auth),
    ...buildSupportTicketRequestLines(),
    ...buildSupportTicketAttachmentLines({
      supportBundlePath: params.supportBundlePath,
      authReportPath: params.authReportPath,
    }),
  ];

  return `${lines.join('\n')}\n`;
};
