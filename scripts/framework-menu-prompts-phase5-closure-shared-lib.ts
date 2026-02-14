import { parseInteger, parsePositive, type Questioner } from './framework-menu-prompt-types';

export type Phase5ExecutionClosureBasePrompt = {
  repo: string;
  limit: number;
  outDir: string;
  useMockConsumerTriage: boolean;
};

export const askPhase5ExecutionClosureBasePrompt = async (
  rl: Questioner
): Promise<Phase5ExecutionClosureBasePrompt> => {
  const repoPrompt = await rl.question('consumer repo (owner/repo) [owner/repo]: ');
  const limitPrompt = await rl.question('runs to inspect [20]: ');
  const outDirPrompt = await rl.question('output directory [.audit-reports/phase5]: ');
  const mockConsumerPrompt = await rl.question('use local mock-consumer package-smoke mode? [no]: ');

  return {
    repo: repoPrompt.trim() || 'owner/repo',
    limit: parseInteger(limitPrompt, 20),
    outDir: outDirPrompt.trim() || '.audit-reports/phase5',
    useMockConsumerTriage: parsePositive(mockConsumerPrompt),
  };
};
