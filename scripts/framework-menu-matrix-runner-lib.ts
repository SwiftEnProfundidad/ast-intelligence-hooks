import { chdir, cwd } from 'node:process';
import {
  runRepoAndStagedPrePushGateSilent,
  runRepoGateSilent,
  runStagedGateSilent,
  runWorkingTreePrePushGateSilent,
} from './framework-menu-gate-lib';
import {
  readMatrixOptionReport,
  type ConsumerMenuMatrixReport,
  type ConsumerMenuMatrixOptionReport,
  type MatrixOptionId,
} from './framework-menu-matrix-evidence-lib';

const runOption = async (
  optionId: MatrixOptionId,
  repoRoot: string,
  gate: () => Promise<void>
): Promise<ConsumerMenuMatrixOptionReport> => {
  await gate();
  return readMatrixOptionReport(repoRoot, optionId);
};

export const runConsumerMenuMatrix = async (params?: {
  repoRoot?: string;
}): Promise<ConsumerMenuMatrixReport> => {
  const previousCwd = cwd();
  const repoRoot = params?.repoRoot ?? previousCwd;
  chdir(repoRoot);
  try {
    const option1 = await runOption('1', repoRoot, runRepoGateSilent);
    const option2 = await runOption('2', repoRoot, runRepoAndStagedPrePushGateSilent);
    const option3 = await runOption('3', repoRoot, runStagedGateSilent);
    const option4 = await runOption('4', repoRoot, runWorkingTreePrePushGateSilent);
    const option9 = readMatrixOptionReport(repoRoot, '9');

    return {
      byOption: {
        '1': option1,
        '2': option2,
        '3': option3,
        '4': option4,
        '9': option9,
      },
    };
  } finally {
    chdir(previousCwd);
  }
};
