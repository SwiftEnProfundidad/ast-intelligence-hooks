import type { Questioner } from './framework-menu-prompt-types';
import type { MockConsumerAbReportPromptResult } from './framework-menu-prompts-phase5-contract';

export const askMockConsumerAbReportPrompt = async (
  rl: Questioner
): Promise<MockConsumerAbReportPromptResult> => {
  const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
  const outPrompt = await rl.question(
    'output path [.audit-reports/mock-consumer/mock-consumer-ab-report.md]: '
  );
  const blockPrompt = await rl.question(
    'block summary path [.audit-reports/package-smoke/block/summary.md]: '
  );
  const minimalPrompt = await rl.question(
    'minimal summary path [.audit-reports/package-smoke/minimal/summary.md]: '
  );
  const blockEvidencePrompt = await rl.question(
    'block CI evidence path [.audit-reports/package-smoke/block/ci.ai_evidence.json]: '
  );
  const minimalEvidencePrompt = await rl.question(
    'minimal CI evidence path [.audit-reports/package-smoke/minimal/ci.ai_evidence.json]: '
  );

  return {
    repo: repoPrompt.trim() || 'owner/repo',
    outFile: outPrompt.trim() || '.audit-reports/mock-consumer/mock-consumer-ab-report.md',
    blockSummaryFile: blockPrompt.trim() || '.audit-reports/package-smoke/block/summary.md',
    minimalSummaryFile:
      minimalPrompt.trim() || '.audit-reports/package-smoke/minimal/summary.md',
    blockEvidenceFile:
      blockEvidencePrompt.trim() || '.audit-reports/package-smoke/block/ci.ai_evidence.json',
    minimalEvidenceFile:
      minimalEvidencePrompt.trim() ||
      '.audit-reports/package-smoke/minimal/ci.ai_evidence.json',
  };
};
