import type {
  Phase5BlockersReadinessCommandParams,
  Phase5ExecutionClosureStatusCommandParams,
  Phase5ExternalHandoffCommandParams,
} from './framework-menu-builders-phase5-contract';
import { buildPhase5TsxCommandPrefix } from './framework-menu-builders-phase5-shared-lib';

export const buildPhase5BlockersReadinessCommandArgs = (
  params: Phase5BlockersReadinessCommandParams
): string[] => {
  return [
    ...buildPhase5TsxCommandPrefix(params.scriptPath),
    '--adapter-report',
    params.adapterReportFile,
    '--consumer-triage-report',
    params.consumerTriageReportFile,
    '--out',
    params.outFile,
  ];
};

export const buildPhase5ExecutionClosureStatusCommandArgs = (
  params: Phase5ExecutionClosureStatusCommandParams
): string[] => {
  const args = [
    ...buildPhase5TsxCommandPrefix(params.scriptPath),
    '--phase5-blockers-report',
    params.phase5BlockersReportFile,
    '--consumer-unblock-report',
    params.consumerUnblockReportFile,
    '--adapter-readiness-report',
    params.adapterReadinessReportFile,
    '--out',
    params.outFile,
  ];

  if (params.requireAdapterReadiness) {
    args.push('--require-adapter-readiness');
  }

  return args;
};

export const buildPhase5ExternalHandoffCommandArgs = (
  params: Phase5ExternalHandoffCommandParams
): string[] => {
  const args = [
    ...buildPhase5TsxCommandPrefix(params.scriptPath),
    '--repo',
    params.repo,
    '--phase5-status-report',
    params.phase5StatusReportFile,
    '--phase5-blockers-report',
    params.phase5BlockersReportFile,
    '--consumer-unblock-report',
    params.consumerUnblockReportFile,
    '--mock-ab-report',
    params.mockAbReportFile,
    '--run-report',
    params.runReportFile,
    '--out',
    params.outFile,
  ];

  for (const url of params.artifactUrls) {
    args.push('--artifact-url', url);
  }

  if (params.requireArtifactUrls) {
    args.push('--require-artifact-urls');
  }

  if (params.requireMockAbReport) {
    args.push('--require-mock-ab-report');
  }

  return args;
};
