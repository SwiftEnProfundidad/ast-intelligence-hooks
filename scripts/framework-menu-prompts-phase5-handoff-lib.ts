import { parsePositive, type Questioner } from './framework-menu-prompt-types';
import type { Phase5ExternalHandoffPromptResult } from './framework-menu-prompts-phase5-contract';

const parseArtifactUrlsPrompt = (artifactUrlsPrompt: string): string[] => {
  return artifactUrlsPrompt
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
};

export const askPhase5ExternalHandoffPrompt = async (
  rl: Questioner
): Promise<Phase5ExternalHandoffPromptResult> => {
  const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
  const statusPrompt = await rl.question(
    'phase5 status report path [.audit-reports/phase5/phase5-execution-closure-status.md]: '
  );
  const blockersPrompt = await rl.question(
    'phase5 blockers report path [.audit-reports/phase5/phase5-blockers-readiness.md]: '
  );
  const consumerPrompt = await rl.question(
    'consumer unblock report path [.audit-reports/phase5/consumer-startup-unblock-status.md]: '
  );
  const mockAbPrompt = await rl.question(
    'mock A/B report path [.audit-reports/phase5/mock-consumer-ab-report.md]: '
  );
  const runReportPrompt = await rl.question(
    'phase5 run report path [.audit-reports/phase5/phase5-execution-closure-run-report.md]: '
  );
  const outPrompt = await rl.question(
    'output path [.audit-reports/phase5/phase5-external-handoff.md]: '
  );
  const artifactUrlsPrompt = await rl.question('artifact URLs (comma-separated) [none]: ');
  const requireArtifactPrompt = await rl.question('require artifact URLs? [no]: ');
  const requireMockAbPrompt = await rl.question('require mock A/B report READY? [no]: ');

  return {
    repo: repoPrompt.trim() || 'owner/repo',
    phase5StatusReportFile:
      statusPrompt.trim() || '.audit-reports/phase5/phase5-execution-closure-status.md',
    phase5BlockersReportFile:
      blockersPrompt.trim() || '.audit-reports/phase5/phase5-blockers-readiness.md',
    consumerUnblockReportFile:
      consumerPrompt.trim() || '.audit-reports/phase5/consumer-startup-unblock-status.md',
    mockAbReportFile:
      mockAbPrompt.trim() || '.audit-reports/phase5/mock-consumer-ab-report.md',
    runReportFile:
      runReportPrompt.trim() || '.audit-reports/phase5/phase5-execution-closure-run-report.md',
    outFile: outPrompt.trim() || '.audit-reports/phase5/phase5-external-handoff.md',
    artifactUrls: parseArtifactUrlsPrompt(artifactUrlsPrompt),
    requireArtifactUrls: parsePositive(requireArtifactPrompt),
    requireMockAbReport: parsePositive(requireMockAbPrompt),
  };
};
