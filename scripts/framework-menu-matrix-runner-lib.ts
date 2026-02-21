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

const UNKNOWN_OPTION_REPORT: ConsumerMenuMatrixOptionReport = {
  stage: 'UNKNOWN',
  outcome: 'UNKNOWN',
  filesScanned: 0,
  totalViolations: 0,
  diagnosis: 'unknown',
};

export type ConsumerMenuMatrixRunnerDependencies = {
  runRepoGateSilent: () => Promise<void>;
  runRepoAndStagedPrePushGateSilent: () => Promise<void>;
  runStagedGateSilent: () => Promise<void>;
  runWorkingTreePrePushGateSilent: () => Promise<void>;
  readMatrixOptionReport: (repoRoot: string, optionId: MatrixOptionId) => ConsumerMenuMatrixOptionReport;
};

const createDefaultDependencies = (): ConsumerMenuMatrixRunnerDependencies => ({
  runRepoGateSilent,
  runRepoAndStagedPrePushGateSilent,
  runStagedGateSilent,
  runWorkingTreePrePushGateSilent,
  readMatrixOptionReport,
});

const runOption = async (
  optionId: MatrixOptionId,
  repoRoot: string,
  gate: () => Promise<void>,
  readReport: (repoRoot: string, optionId: MatrixOptionId) => ConsumerMenuMatrixOptionReport
): Promise<ConsumerMenuMatrixOptionReport> => {
  try {
    await gate();
    return readReport(repoRoot, optionId);
  } catch {
    return UNKNOWN_OPTION_REPORT;
  }
};

export const runConsumerMenuMatrix = async (params?: {
  repoRoot?: string;
  dependencies?: Partial<ConsumerMenuMatrixRunnerDependencies>;
}): Promise<ConsumerMenuMatrixReport> => {
  const previousCwd = cwd();
  const repoRoot = params?.repoRoot ?? previousCwd;
  const dependencies: ConsumerMenuMatrixRunnerDependencies = {
    ...createDefaultDependencies(),
    ...(params?.dependencies ?? {}),
  };
  chdir(repoRoot);
  try {
    const option1 = await runOption('1', repoRoot, dependencies.runRepoGateSilent, dependencies.readMatrixOptionReport);
    const option2 = await runOption(
      '2',
      repoRoot,
      dependencies.runRepoAndStagedPrePushGateSilent,
      dependencies.readMatrixOptionReport
    );
    const option3 = await runOption('3', repoRoot, dependencies.runStagedGateSilent, dependencies.readMatrixOptionReport);
    const option4 = await runOption(
      '4',
      repoRoot,
      dependencies.runWorkingTreePrePushGateSilent,
      dependencies.readMatrixOptionReport
    );
    const option9 = (() => {
      try {
        return dependencies.readMatrixOptionReport(repoRoot, '9');
      } catch {
        return UNKNOWN_OPTION_REPORT;
      }
    })();

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
