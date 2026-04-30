import { chdir, cwd } from 'node:process';
import {
  runRepoAndStagedPrePushGateSilent,
  runRepoGateSilent,
  runStagedGateSilent,
  runUnstagedGateSilent,
  runWorkingTreeGateSilent,
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
  runUnstagedGateSilent: () => Promise<void>;
  runWorkingTreeGateSilent: () => Promise<void>;
  runWorkingTreePrePushGateSilent: () => Promise<void>;
  readMatrixOptionReport: (repoRoot: string, optionId: MatrixOptionId) => ConsumerMenuMatrixOptionReport;
};

const createDefaultDependencies = (): ConsumerMenuMatrixRunnerDependencies => ({
  runRepoGateSilent,
  runRepoAndStagedPrePushGateSilent,
  runStagedGateSilent,
  runUnstagedGateSilent,
  runWorkingTreeGateSilent,
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

    const option11 = await runOption(
      '11',
      repoRoot,
      dependencies.runStagedGateSilent,
      dependencies.readMatrixOptionReport
    );
    const option12 = await runOption(
      '12',
      repoRoot,
      dependencies.runUnstagedGateSilent,
      dependencies.readMatrixOptionReport
    );
    const option13 = await runOption(
      '13',
      repoRoot,
      dependencies.runWorkingTreeGateSilent,
      dependencies.readMatrixOptionReport
    );
    const option14 = await runOption(
      '14',
      repoRoot,
      dependencies.runRepoGateSilent,
      dependencies.readMatrixOptionReport
    );

    return {
      byOption: {
        '1': option1,
        '2': option2,
        '3': option3,
        '4': option4,
        '9': option9,
        '11': option11,
        '12': option12,
        '13': option13,
        '14': option14,
      },
    };
  } finally {
    chdir(previousCwd);
  }
};
