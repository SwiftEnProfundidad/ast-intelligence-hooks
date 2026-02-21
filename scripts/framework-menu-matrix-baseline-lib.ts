import {
  runConsumerMenuMatrix,
} from './framework-menu-matrix-runner-lib';
import type {
  ConsumerMenuMatrixReport,
  ConsumerMenuMatrixOptionReport,
  MatrixOptionId,
} from './framework-menu-matrix-evidence-lib';

export type MatrixOptionDrift = {
  stable: boolean;
  driftFields: ReadonlyArray<keyof ConsumerMenuMatrixOptionReport>;
};

export type ConsumerMenuMatrixBaselineAnalysis = {
  stable: boolean;
  byOption: Record<MatrixOptionId, MatrixOptionDrift>;
};

export type ConsumerMenuMatrixBaselineReport = {
  rounds: ReadonlyArray<ConsumerMenuMatrixReport>;
  analysis: ConsumerMenuMatrixBaselineAnalysis;
};

const OPTION_IDS: ReadonlyArray<MatrixOptionId> = ['1', '2', '3', '4', '9'];

const OPTION_FIELDS: ReadonlyArray<keyof ConsumerMenuMatrixOptionReport> = [
  'stage',
  'outcome',
  'filesScanned',
  'totalViolations',
  'diagnosis',
];

const computeOptionDrift = (
  rounds: ReadonlyArray<ConsumerMenuMatrixReport>,
  optionId: MatrixOptionId
): MatrixOptionDrift => {
  if (rounds.length <= 1) {
    return {
      stable: true,
      driftFields: [],
    };
  }

  const baseline = rounds[0].byOption[optionId];
  const driftFields = OPTION_FIELDS.filter((field) => {
    return rounds.slice(1).some((round) => round.byOption[optionId][field] !== baseline[field]);
  });

  return {
    stable: driftFields.length === 0,
    driftFields,
  };
};

export const analyzeConsumerMenuMatrixBaseline = (
  rounds: ReadonlyArray<ConsumerMenuMatrixReport>
): ConsumerMenuMatrixBaselineAnalysis => {
  const byOption = OPTION_IDS.reduce<Record<MatrixOptionId, MatrixOptionDrift>>((acc, optionId) => {
    acc[optionId] = computeOptionDrift(rounds, optionId);
    return acc;
  }, {
    '1': { stable: true, driftFields: [] },
    '2': { stable: true, driftFields: [] },
    '3': { stable: true, driftFields: [] },
    '4': { stable: true, driftFields: [] },
    '9': { stable: true, driftFields: [] },
  });

  const stable = OPTION_IDS.every((optionId) => byOption[optionId].stable);

  return {
    stable,
    byOption,
  };
};

export const runConsumerMenuMatrixBaseline = async (params?: {
  repoRoot?: string;
  rounds?: number;
  runMatrix?: (params?: { repoRoot?: string }) => Promise<ConsumerMenuMatrixReport>;
}): Promise<ConsumerMenuMatrixBaselineReport> => {
  const roundsCount = Math.max(1, Math.trunc(params?.rounds ?? 2));
  const runner = params?.runMatrix ?? runConsumerMenuMatrix;
  const rounds: ConsumerMenuMatrixReport[] = [];

  for (let round = 0; round < roundsCount; round += 1) {
    rounds.push(await runner({ repoRoot: params?.repoRoot }));
  }

  return {
    rounds,
    analysis: analyzeConsumerMenuMatrixBaseline(rounds),
  };
};

export type {
  ConsumerMenuMatrixReport,
  ConsumerMenuMatrixOptionReport,
  MatrixOptionId,
} from './framework-menu-matrix-evidence-lib';

export default {
  runConsumerMenuMatrixBaseline,
  analyzeConsumerMenuMatrixBaseline,
};
