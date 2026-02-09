import type { Phase5ExternalHandoffCliOptions } from './build-phase5-external-handoff-contract';
import { createDefaultPhase5ExternalHandoffCliOptions } from './build-phase5-external-handoff-contract';

export const parsePhase5ExternalHandoffArgs = (
  args: ReadonlyArray<string>
): Phase5ExternalHandoffCliOptions => {
  const options = createDefaultPhase5ExternalHandoffCliOptions();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--repo') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --repo');
      }
      options.repo = value;
      index += 1;
      continue;
    }
    if (arg === '--phase5-status-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --phase5-status-report');
      }
      options.phase5StatusReportFile = value;
      index += 1;
      continue;
    }
    if (arg === '--phase5-blockers-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --phase5-blockers-report');
      }
      options.phase5BlockersReportFile = value;
      index += 1;
      continue;
    }
    if (arg === '--consumer-unblock-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --consumer-unblock-report');
      }
      options.consumerUnblockReportFile = value;
      index += 1;
      continue;
    }
    if (arg === '--mock-ab-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --mock-ab-report');
      }
      options.mockAbReportFile = value;
      index += 1;
      continue;
    }
    if (arg === '--run-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --run-report');
      }
      options.runReportFile = value;
      index += 1;
      continue;
    }
    if (arg === '--out') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out');
      }
      options.outFile = value;
      index += 1;
      continue;
    }
    if (arg === '--artifact-url') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --artifact-url');
      }
      options.artifactUrls.push(value);
      index += 1;
      continue;
    }
    if (arg === '--require-artifact-urls') {
      options.requireArtifactUrls = true;
      continue;
    }
    if (arg === '--require-mock-ab-report') {
      options.requireMockAbReport = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};
