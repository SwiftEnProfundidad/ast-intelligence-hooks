import type {
  ConsumerMenuMatrixBaselineAnalysis,
  ConsumerMenuMatrixBaselineReport,
  ConsumerMenuMatrixReport,
  MatrixOptionId,
} from './framework-menu-matrix-baseline-lib';
import { MATRIX_MENU_OPTION_IDS } from './framework-menu-matrix-evidence-lib';
import type { DoctorDeepCheckLayer, LifecycleDoctorReport } from '../integrations/lifecycle/doctor';
import type { LifecycleStatus } from '../integrations/lifecycle/status';

const OPTION_IDS: ReadonlyArray<MatrixOptionId> = [...MATRIX_MENU_OPTION_IDS];
const DOCTOR_LAYERS: ReadonlyArray<DoctorDeepCheckLayer> = [
  'core',
  'operational',
  'integration',
  'policy-pack',
];
const ACCEPTANCE_LAYERS = [
  'core',
  'operational',
  'integration',
  'policy-pack',
  'experimental',
] as const;

export type ConsumerMenuMatrixBaselineLayerId = (typeof ACCEPTANCE_LAYERS)[number];
export type ConsumerMenuMatrixBaselineLayerVerdict = 'PASS' | 'WARN' | 'FAIL' | 'N/A';
export type ConsumerMenuMatrixBaselineLayerSummary = {
  verdict: ConsumerMenuMatrixBaselineLayerVerdict;
  passCount: number;
  warnCount: number;
  failCount: number;
  itemIds: ReadonlyArray<string>;
};

export type ConsumerMenuMatrixBaselineSnapshot = {
  generatedAt: string;
  fixture: string;
  repoRoot: string;
  rounds: number;
  stable: boolean;
  analysis: ConsumerMenuMatrixBaselineAnalysis;
  latestRound: ConsumerMenuMatrixReport;
  roundsData: ReadonlyArray<ConsumerMenuMatrixReport>;
  status: {
    policyValidation: LifecycleStatus['policyValidation'];
    experimentalFeatures: LifecycleStatus['experimentalFeatures'];
  };
  doctor: {
    blocking: boolean;
    layerSummary: Record<ConsumerMenuMatrixBaselineLayerId, ConsumerMenuMatrixBaselineLayerSummary>;
  };
};

const UNKNOWN_OPTION_REPORT = {
  stage: 'UNKNOWN',
  outcome: 'UNKNOWN',
  filesScanned: 0,
  totalViolations: 0,
  diagnosis: 'unknown' as const,
};

const buildEmptyRound = (): ConsumerMenuMatrixReport => {
  return {
    byOption: Object.fromEntries(
      MATRIX_MENU_OPTION_IDS.map((id) => [id, { ...UNKNOWN_OPTION_REPORT }])
    ) as ConsumerMenuMatrixReport['byOption'],
  };
};

const buildLayerSummary = (params: {
  verdict: ConsumerMenuMatrixBaselineLayerVerdict;
  passCount: number;
  warnCount: number;
  failCount: number;
  itemIds: ReadonlyArray<string>;
}): ConsumerMenuMatrixBaselineLayerSummary => {
  return {
    verdict: params.verdict,
    passCount: params.passCount,
    warnCount: params.warnCount,
    failCount: params.failCount,
    itemIds: params.itemIds,
  };
};

const summarizeDoctorLayer = (
  doctor: LifecycleDoctorReport,
  layer: DoctorDeepCheckLayer
): ConsumerMenuMatrixBaselineLayerSummary => {
  const checks = doctor.deep?.checks.filter((check) => check.layer === layer) ?? [];
  if (checks.length === 0) {
    return buildLayerSummary({
      verdict: 'N/A',
      passCount: 0,
      warnCount: 0,
      failCount: 0,
      itemIds: [],
    });
  }

  const passCount = checks.filter((check) => check.status === 'pass').length;
  const warnCount = checks.filter((check) => check.status === 'warn').length;
  const failCount = checks.filter((check) => check.status === 'fail').length;

  return buildLayerSummary({
    verdict: failCount > 0 ? 'FAIL' : warnCount > 0 ? 'WARN' : 'PASS',
    passCount,
    warnCount,
    failCount,
    itemIds: checks.map((check) => check.id),
  });
};

const summarizeExperimentalLayer = (
  status: LifecycleStatus
): ConsumerMenuMatrixBaselineLayerSummary => {
  const features = Object.entries(status.experimentalFeatures.features);
  const classified = features.map(([featureId, feature]) => {
    if (feature.blocking || feature.mode === 'strict') {
      return { featureId, verdict: 'FAIL' as const };
    }
    if (feature.mode === 'advisory' || feature.source !== 'default') {
      return { featureId, verdict: 'WARN' as const };
    }
    return { featureId, verdict: 'PASS' as const };
  });

  const passCount = classified.filter((feature) => feature.verdict === 'PASS').length;
  const warnCount = classified.filter((feature) => feature.verdict === 'WARN').length;
  const failCount = classified.filter((feature) => feature.verdict === 'FAIL').length;

  return buildLayerSummary({
    verdict: failCount > 0 ? 'FAIL' : warnCount > 0 ? 'WARN' : 'PASS',
    passCount,
    warnCount,
    failCount,
    itemIds: classified.map((feature) => feature.featureId),
  });
};

export const buildConsumerMenuMatrixLayerSummary = (params: {
  status: LifecycleStatus;
  doctor: LifecycleDoctorReport;
}): Record<ConsumerMenuMatrixBaselineLayerId, ConsumerMenuMatrixBaselineLayerSummary> => {
  const doctorSummary = Object.fromEntries(
    DOCTOR_LAYERS.map((layer) => [layer, summarizeDoctorLayer(params.doctor, layer)])
  ) as Record<DoctorDeepCheckLayer, ConsumerMenuMatrixBaselineLayerSummary>;

  return {
    ...doctorSummary,
    experimental: summarizeExperimentalLayer(params.status),
  };
};

export const buildConsumerMenuMatrixBaselineSnapshot = (params: {
  generatedAt: string;
  fixture: string;
  repoRoot: string;
  baseline: ConsumerMenuMatrixBaselineReport;
  status: LifecycleStatus;
  doctor: LifecycleDoctorReport;
}): ConsumerMenuMatrixBaselineSnapshot => {
  return {
    generatedAt: params.generatedAt,
    fixture: params.fixture,
    repoRoot: params.repoRoot,
    rounds: params.baseline.rounds.length,
    stable: params.baseline.analysis.stable,
    analysis: params.baseline.analysis,
    latestRound:
      params.baseline.rounds[params.baseline.rounds.length - 1] ?? buildEmptyRound(),
    roundsData: params.baseline.rounds,
    status: {
      policyValidation: params.status.policyValidation,
      experimentalFeatures: params.status.experimentalFeatures,
    },
    doctor: {
      blocking: params.doctor.deep?.blocking === true,
      layerSummary: buildConsumerMenuMatrixLayerSummary({
        status: params.status,
        doctor: params.doctor,
      }),
    },
  };
};

const formatStable = (stable: boolean): string => {
  return stable ? 'YES' : 'NO';
};

const formatDriftFields = (fields: ReadonlyArray<string>): string => {
  return fields.length > 0 ? fields.join(', ') : 'none';
};

export const renderConsumerMenuMatrixBaselineSummary = (
  snapshot: ConsumerMenuMatrixBaselineSnapshot
): string => {
  const lines = [
    '# Consumer Menu Matrix Baseline',
    '',
    `- fixture: ${snapshot.fixture}`,
    `- repo_root: ${snapshot.repoRoot}`,
    `- generated_at: ${snapshot.generatedAt}`,
    `- rounds: ${snapshot.rounds}`,
    `- stable: ${formatStable(snapshot.stable)}`,
    `- doctor_blocking: ${snapshot.doctor.blocking ? 'YES' : 'NO'}`,
    '',
    '## Drift analysis',
  ];

  for (const optionId of OPTION_IDS) {
    const analysis = snapshot.analysis.byOption[optionId];
    lines.push(
      `- option ${optionId}: stable=${formatStable(analysis.stable)} drift=${formatDriftFields(analysis.driftFields)}`
    );
  }

  lines.push('', '## Layer summary');

  for (const layer of ACCEPTANCE_LAYERS) {
    const summary = snapshot.doctor.layerSummary[layer];
    lines.push(
      `- layer ${layer}: verdict=${summary.verdict} pass=${summary.passCount} warn=${summary.warnCount} fail=${summary.failCount} items=${summary.itemIds.length > 0 ? summary.itemIds.join(', ') : 'none'}`
    );
  }

  lines.push('', '## Latest round');

  for (const optionId of OPTION_IDS) {
    const option = snapshot.latestRound.byOption[optionId];
    lines.push(
      `- option ${optionId}: stage=${option.stage} outcome=${option.outcome} files_scanned=${option.filesScanned} total_violations=${option.totalViolations} diagnosis=${option.diagnosis}`
    );
  }

  return `${lines.join('\n')}\n`;
};
