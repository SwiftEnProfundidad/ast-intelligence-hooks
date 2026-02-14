import {
  DEFAULT_ACTIONLINT_BIN,
  DEFAULT_CONSUMER_REPO_PATH,
} from './framework-menu-runners';
import {
  parseInteger,
  parsePositive,
  type Questioner,
} from './framework-menu-prompt-types';
import type { ConsumerStartupTriagePromptResult } from './framework-menu-prompts-consumer-contract';

const askConsumerStartupTriageWithoutWorkflowLintPrompt = async (params: {
  repo: string;
  limit: number;
  outDir: string;
}): Promise<ConsumerStartupTriagePromptResult> => {
  return {
    repo: params.repo,
    limit: params.limit,
    outDir: params.outDir,
    runWorkflowLint: false,
  };
};

const askConsumerStartupTriageWithWorkflowLintPrompt = async (
  rl: Questioner,
  params: {
    repo: string;
    limit: number;
    outDir: string;
  }
): Promise<ConsumerStartupTriagePromptResult> => {
  const repoPathPrompt = await rl.question(
    `consumer repo path [${DEFAULT_CONSUMER_REPO_PATH}]: `
  );
  const actionlintBinPrompt = await rl.question(
    `actionlint binary [${DEFAULT_ACTIONLINT_BIN}]: `
  );

  return {
    repo: params.repo,
    limit: params.limit,
    outDir: params.outDir,
    runWorkflowLint: true,
    repoPath: repoPathPrompt.trim() || DEFAULT_CONSUMER_REPO_PATH,
    actionlintBin: actionlintBinPrompt.trim() || DEFAULT_ACTIONLINT_BIN,
  };
};

export const askConsumerStartupTriagePrompt = async (
  rl: Questioner
): Promise<ConsumerStartupTriagePromptResult> => {
  const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
  const limitPrompt = await rl.question('runs to inspect [20]: ');
  const outDirPrompt = await rl.question('output directory [.audit-reports/consumer-triage]: ');
  const workflowLintPrompt = await rl.question('include workflow lint? [no]: ');

  const params = {
    repo: repoPrompt.trim() || 'owner/repo',
    limit: parseInteger(limitPrompt, 20),
    outDir: outDirPrompt.trim() || '.audit-reports/consumer-triage',
  };

  if (!parsePositive(workflowLintPrompt)) {
    return askConsumerStartupTriageWithoutWorkflowLintPrompt(params);
  }

  return askConsumerStartupTriageWithWorkflowLintPrompt(rl, params);
};
