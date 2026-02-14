import { DEFAULT_ACTIONLINT_BIN, DEFAULT_CONSUMER_REPO_PATH } from './framework-menu-runners';
import { parsePositive, type Questioner } from './framework-menu-prompt-types';
import type { Phase5ExecutionClosurePromptResult } from './framework-menu-prompts-phase5-contract';
import type { Phase5ExecutionClosureBasePrompt } from './framework-menu-prompts-phase5-closure-shared-lib';

export const askLiveConsumerPhase5ExecutionClosurePrompt = async (
  rl: Questioner,
  params: Phase5ExecutionClosureBasePrompt
): Promise<Phase5ExecutionClosurePromptResult> => {
  const workflowLintPrompt = await rl.question('include workflow lint? [yes]: ');
  const authPreflightPrompt = await rl.question(
    'run auth preflight and fail-fast on auth block? [yes]: '
  );
  const includeAdapterPrompt = await rl.question('include adapter diagnostics? [yes]: ');
  const requireAdapterPrompt = await rl.question('require adapter readiness verdict READY? [no]: ');

  const runWorkflowLint = !workflowLintPrompt.trim() ? true : parsePositive(workflowLintPrompt);
  const includeAuthPreflight = !authPreflightPrompt.trim()
    ? true
    : parsePositive(authPreflightPrompt);
  const includeAdapter = !includeAdapterPrompt.trim() ? true : parsePositive(includeAdapterPrompt);
  const requireAdapterReadiness = includeAdapter && parsePositive(requireAdapterPrompt);

  let repoPath: string | undefined;
  let actionlintBin: string | undefined;

  if (runWorkflowLint) {
    const repoPathPrompt = await rl.question(
      `consumer repo path [${DEFAULT_CONSUMER_REPO_PATH}]: `
    );
    const actionlintBinPrompt = await rl.question(
      `actionlint binary [${DEFAULT_ACTIONLINT_BIN}]: `
    );

    repoPath = repoPathPrompt.trim() || DEFAULT_CONSUMER_REPO_PATH;
    actionlintBin = actionlintBinPrompt.trim() || DEFAULT_ACTIONLINT_BIN;
  }

  return {
    repo: params.repo,
    limit: params.limit,
    outDir: params.outDir,
    runWorkflowLint,
    includeAuthPreflight,
    repoPath,
    actionlintBin,
    includeAdapter,
    requireAdapterReadiness,
    useMockConsumerTriage: false,
  };
};
