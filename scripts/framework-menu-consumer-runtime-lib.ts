import { emitSystemNotification } from './framework-menu-system-notifications-lib';
import { createConsumerRuntimeActions } from './framework-menu-consumer-runtime-actions';
import { printConsumerRuntimeMenu } from './framework-menu-consumer-runtime-menu';
import {
  resolveConsumerRuntimeUseColor,
} from './framework-menu-consumer-runtime-audit';
import type { FrameworkMenuEvidenceSummary } from './framework-menu-evidence-summary-lib';
import type { ConsumerPreflightResult } from './framework-menu-consumer-preflight-types';
import type { GovernanceConsoleSnapshot } from '../integrations/lifecycle/cliGovernanceConsole';
import { readLifecycleStatus } from '../integrations/lifecycle/status';
import type {
  ConsumerAction,
  ConsumerMenuRuntime,
  ConsumerMenuRuntimeParams,
} from './framework-menu-consumer-runtime-types';

export type {
  ConsumerAction,
  ConsumerMenuRuntime,
  ConsumerMenuRuntimeParams,
} from './framework-menu-consumer-runtime-types';

const readMenuGovernanceConsoleSnapshot = (
  repoRoot: string
): GovernanceConsoleSnapshot | null => {
  try {
    const status = readLifecycleStatus({ cwd: repoRoot });
    return {
      governanceObservation: status.governanceObservation,
      governanceNextAction: status.governanceNextAction,
      policyValidation: status.policyValidation,
      experimentalFeatures: status.experimentalFeatures,
    };
  } catch {
    return null;
  }
};

export const createConsumerMenuRuntime = (
  params: ConsumerMenuRuntimeParams
): ConsumerMenuRuntime => {
  const repoRoot = process.cwd();
  let summaryOverride: FrameworkMenuEvidenceSummary | null = null;
  let lastPreflight: ConsumerPreflightResult | null = null;
  const emitNotification =
    params.emitSystemNotification
    ?? ((payload: Parameters<typeof emitSystemNotification>[0]) =>
      emitSystemNotification(payload));
  const useColor = resolveConsumerRuntimeUseColor;

  const actions = createConsumerRuntimeActions({
    repoRoot,
    write: params.write,
    useColor,
    runRepoGate: params.runRepoGate,
    runRepoAndStagedGate: params.runRepoAndStagedGate,
    runStagedGate: params.runStagedGate,
    runWorkingTreeGate: params.runWorkingTreeGate,
    runPreflight: params.runPreflight,
    emitNotification,
    clearSummaryOverride: () => {
      summaryOverride = null;
    },
    getSummaryOverride: () => summaryOverride,
    setSummaryOverride: (summary) => {
      summaryOverride = summary;
    },
    clearLastPreflight: () => {
      lastPreflight = null;
    },
    setLastPreflight: (result) => {
      lastPreflight = result;
    },
  });

  return {
    actions: actions as ReadonlyArray<ConsumerAction>,
    printMenu: () => {
      const governanceConsole =
        lastPreflight
          ? {
              governanceObservation: lastPreflight.governanceObservation,
              governanceNextAction: lastPreflight.governanceNextAction,
              policyValidation: lastPreflight.policyValidation,
              experimentalFeatures: lastPreflight.experimentalFeatures,
            }
          : (params.readGovernanceConsole?.() ?? readMenuGovernanceConsoleSnapshot(repoRoot));
      printConsumerRuntimeMenu({
        actions,
        repoRoot,
        useColor,
        write: params.write,
        preflight: lastPreflight,
        governanceConsole,
      });
    },
    readCurrentSummary: () => summaryOverride,
    readLastPreflight: () => lastPreflight,
  };
};

export default {
  createConsumerMenuRuntime,
};
