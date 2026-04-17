import type { LifecycleExperimentalFeaturesSnapshot } from './experimentalFeaturesSnapshot';
import type { GovernanceNextActionSummary } from './governanceNextAction';
import { buildGovernanceNextActionSummaryLines } from './governanceNextAction';
import type { GovernanceObservationSnapshot } from './governanceObservationSnapshot';
import { buildGovernanceObservationSummaryLines } from './governanceObservationSnapshot';
import { writeInfo } from './cliOutputs';
import type { LifecyclePolicyValidationSnapshot } from './policyValidationSnapshot';

export type GovernanceConsoleSnapshot = {
  governanceObservation: GovernanceObservationSnapshot;
  governanceNextAction: GovernanceNextActionSummary;
  policyValidation: LifecyclePolicyValidationSnapshot;
  experimentalFeatures: LifecycleExperimentalFeaturesSnapshot;
};

const GOVERNANCE_CONSOLE_FEATURE_ORDER = [
  'analytics',
  'heuristics',
  'learning_context',
  'mcp_enterprise',
  'operational_memory',
  'pre_write',
  'saas_ingestion',
  'sdd',
] as const;

const buildGovernancePolicySummaryLine = (
  policyValidation: LifecyclePolicyValidationSnapshot
): string =>
  `Policy-as-code: PRE_WRITE=${policyValidation.stages.PRE_WRITE.validationCode ?? 'n/a'} strict=${policyValidation.stages.PRE_WRITE.strict ? 'yes' : 'no'} ` +
  `PRE_COMMIT=${policyValidation.stages.PRE_COMMIT.validationCode ?? 'n/a'} strict=${policyValidation.stages.PRE_COMMIT.strict ? 'yes' : 'no'} ` +
  `PRE_PUSH=${policyValidation.stages.PRE_PUSH.validationCode ?? 'n/a'} strict=${policyValidation.stages.PRE_PUSH.strict ? 'yes' : 'no'} ` +
  `CI=${policyValidation.stages.CI.validationCode ?? 'n/a'} strict=${policyValidation.stages.CI.strict ? 'yes' : 'no'}`;

const buildGovernanceExperimentalSummaryLines = (
  experimentalFeatures: LifecycleExperimentalFeaturesSnapshot
): string[] =>
  GOVERNANCE_CONSOLE_FEATURE_ORDER.map((featureKey) => {
    const feature = experimentalFeatures.features[featureKey];
    return `Experimental: ${featureKey.toUpperCase()}=${feature.mode} source=${feature.source} layer=${feature.layer} blocking=${feature.blocking ? 'yes' : 'no'} env=${feature.activationVariable}`;
  });

export const buildGovernanceConsoleSummaryLines = (
  snapshot: GovernanceConsoleSnapshot
): string[] => {
  const lines = ['Governance truth:'];
  for (const line of buildGovernanceObservationSummaryLines(snapshot.governanceObservation)) {
    lines.push(`  ${line}`);
  }
  for (const hint of snapshot.governanceObservation.evidence.human_summary_preview) {
    lines.push(`  Evidence hint: ${hint}`);
  }
  lines.push('Governance next action:');
  for (const line of buildGovernanceNextActionSummaryLines(snapshot.governanceNextAction)) {
    lines.push(`  ${line}`);
  }
  lines.push(buildGovernancePolicySummaryLine(snapshot.policyValidation));
  lines.push(...buildGovernanceExperimentalSummaryLines(snapshot.experimentalFeatures));
  return lines;
};

export const printGovernanceConsoleHuman = (
  snapshot: GovernanceConsoleSnapshot
): void => {
  writeInfo('[pumuki] governance console (S1 / shared status-doctor baseline):');
  for (const line of buildGovernanceConsoleSummaryLines(snapshot)) {
    writeInfo(`[pumuki]   ${line}`);
  }
};
