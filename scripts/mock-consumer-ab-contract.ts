export type MockConsumerAbCliOptions = {
  repo: string;
  outFile: string;
  blockSummaryFile: string;
  minimalSummaryFile: string;
  blockEvidenceFile: string;
  minimalEvidenceFile: string;
  dryRun: boolean;
};

export type EvidenceAssessment = {
  file: string;
  exists: boolean;
  parseError?: string;
  version?: string;
  stage?: string;
  outcome?: string;
};

export const DEFAULT_MOCK_CONSUMER_AB_REPO = 'owner/repo';
export const DEFAULT_MOCK_CONSUMER_AB_OUT_FILE =
  '.audit-reports/mock-consumer/mock-consumer-ab-report.md';
export const DEFAULT_MOCK_CONSUMER_AB_BLOCK_SUMMARY =
  '.audit-reports/package-smoke/block/summary.md';
export const DEFAULT_MOCK_CONSUMER_AB_MINIMAL_SUMMARY =
  '.audit-reports/package-smoke/minimal/summary.md';
export const DEFAULT_MOCK_CONSUMER_AB_BLOCK_EVIDENCE_FILE =
  '.audit-reports/package-smoke/block/ci.ai_evidence.json';
export const DEFAULT_MOCK_CONSUMER_AB_MINIMAL_EVIDENCE_FILE =
  '.audit-reports/package-smoke/minimal/ci.ai_evidence.json';
