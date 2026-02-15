import {
  applyPhase5BlockersReadinessFlagArg,
  isPhase5BlockersReadinessFlagArg,
} from './phase5-blockers-readiness-arg-flags-lib';
import {
  applyPhase5BlockersReadinessValueArg,
  isPhase5BlockersReadinessValueArg,
} from './phase5-blockers-readiness-arg-values-lib';
export { readPhase5BlockersReadinessInput } from './phase5-blockers-readiness-input-lib';
import type { Phase5BlockersReadinessCliOptions } from './phase5-blockers-readiness-cli-contract';

export const DEFAULT_ADAPTER_REPORT_FILE = '.audit-reports/adapter/adapter-real-session-report.md';
export const DEFAULT_CONSUMER_TRIAGE_FILE =
  '.audit-reports/consumer-triage/consumer-startup-triage-report.md';
export const DEFAULT_PHASE5_BLOCKERS_READINESS_OUT_FILE =
  '.audit-reports/phase5/phase5-blockers-readiness.md';

export const parsePhase5BlockersReadinessArgs = (
  args: ReadonlyArray<string>
): Phase5BlockersReadinessCliOptions => {
  const options: Phase5BlockersReadinessCliOptions = {
    adapterReportFile: DEFAULT_ADAPTER_REPORT_FILE,
    consumerTriageReportFile: DEFAULT_CONSUMER_TRIAGE_FILE,
    outFile: DEFAULT_PHASE5_BLOCKERS_READINESS_OUT_FILE,
    requireAdapterReport: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (isPhase5BlockersReadinessValueArg(arg)) {
      const value = args[index + 1];
      if (!value) {
        throw new Error(`Missing value for ${arg}`);
      }
      applyPhase5BlockersReadinessValueArg({
        options,
        arg,
        value,
      });
      index += 1;
      continue;
    }

    if (isPhase5BlockersReadinessFlagArg(arg)) {
      applyPhase5BlockersReadinessFlagArg({
        options,
      });
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};
