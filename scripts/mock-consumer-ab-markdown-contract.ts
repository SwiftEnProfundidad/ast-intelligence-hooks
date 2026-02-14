import type { EvidenceAssessment } from './mock-consumer-ab-contract';

export type MockConsumerAbMarkdownParams = {
  generatedAt: string;
  repo: string;
  blockSummaryFile: string;
  minimalSummaryFile: string;
  blockEvidenceFile: string;
  minimalEvidenceFile: string;
  blockReady: boolean;
  minimalReady: boolean;
  blockEvidence: EvidenceAssessment;
  minimalEvidence: EvidenceAssessment;
};

export type MockConsumerAbVerdict = 'READY' | 'BLOCKED';
