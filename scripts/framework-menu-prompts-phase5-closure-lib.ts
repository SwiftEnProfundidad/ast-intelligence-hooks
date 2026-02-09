import { DEFAULT_ACTIONLINT_BIN, DEFAULT_CONSUMER_REPO_PATH } from './framework-menu-runners';
import {
  parseInteger,
  parsePositive,
  type Questioner,
} from './framework-menu-prompt-types';
import type { Phase5ExecutionClosurePromptResult } from './framework-menu-prompts-phase5-contract';

const askMockConsumerPhase5ExecutionClosurePrompt = async (
  rl: Questioner,
  params: {
    repo: string;
    limit: number;
    outDir: string;
  }
): Promise<Phase5ExecutionClosurePromptResult> => {
  const includeAdapterPrompt = await rl.question('include adapter diagnostics? [no]: ');
  const includeAdapter = parsePositive(includeAdapterPrompt);
  const requireAdapterPrompt = await rl.question('require adapter readiness verdict READY? [no]: ');

  return {
    repo: params.repo,
    limit: params.limit,
    outDir: params.outDir,
    runWorkflowLint: false,
    includeAuthPreflight: false,
    includeAdapter,
    requireAdapterReadiness: includeAdapter && parsePositive(requireAdapterPrompt),
    useMockConsumerTriage: true,
  };
};

const askLiveConsumerPhase5ExecutionClosurePrompt = async (
  rl: Questioner,
  params: {
    repo: string;
    limit: number;
    outDir: string;
  }
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

export const askPhase5ExecutionClosurePrompt = async (
  rl: Questioner
): Promise<Phase5ExecutionClosurePromptResult> => {
  const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
  const limitPrompt = await rl.question('runs to inspect [20]: ');
  const outDirPrompt = await rl.question('output directory [.audit-reports/phase5]: ');
  const mockConsumerPrompt = await rl.question('use local mock-consumer package-smoke mode? [no]: ');

  const params = {
    repo: repoPrompt.trim() || 'owner/repo',
    limit: parseInteger(limitPrompt, 20),
    outDir: outDirPrompt.trim() || '.audit-reports/phase5',
  };

  if (parsePositive(mockConsumerPrompt)) {
    return askMockConsumerPhase5ExecutionClosurePrompt(rl, params);
  }

  return askLiveConsumerPhase5ExecutionClosurePrompt(rl, params);
};
