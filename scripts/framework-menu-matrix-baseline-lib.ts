import {
  runConsumerMenuMatrix,
} from './framework-menu-matrix-runner-lib';
import {
  MATRIX_MENU_OPTION_IDS,
  type ConsumerMenuMatrixReport,
  type ConsumerMenuMatrixOptionReport,
  type MatrixOptionId,
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

const EMPTY_DRIFT: MatrixOptionDrift = { stable: true, driftFields: [] };

const seedMatrixOptionDrift = (): Record<MatrixOptionId, MatrixOptionDrift> => {
  return Object.fromEntries(
    MATRIX_MENU_OPTION_IDS.map((optionId) => [optionId, { ...EMPTY_DRIFT }])
  ) as Record<MatrixOptionId, MatrixOptionDrift>;
};

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
  const byOption = MATRIX_MENU_OPTION_IDS.reduce<Record<MatrixOptionId, MatrixOptionDrift>>((acc, optionId) => {
    acc[optionId] = computeOptionDrift(rounds, optionId);
    return acc;
  }, seedMatrixOptionDrift());

  const stable = MATRIX_MENU_OPTION_IDS.every((optionId) => byOption[optionId].stable);

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
