import { emitSystemNotification } from './framework-menu-system-notifications-lib';
import { createConsumerRuntimeActions } from './framework-menu-consumer-runtime-actions';
import { printConsumerRuntimeMenu } from './framework-menu-consumer-runtime-menu';
import {
  resolveConsumerRuntimeUseColor,
} from './framework-menu-consumer-runtime-audit';
import type { FrameworkMenuEvidenceSummary } from './framework-menu-evidence-summary-lib';
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

export const createConsumerMenuRuntime = (
  params: ConsumerMenuRuntimeParams
): ConsumerMenuRuntime => {
  const repoRoot = process.cwd();
  let summaryOverride: FrameworkMenuEvidenceSummary | null = null;
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
  });

  return {
    actions: actions as ReadonlyArray<ConsumerAction>,
    printMenu: () => {
      printConsumerRuntimeMenu({
        actions,
        repoRoot,
        useColor,
        write: params.write,
      });
    },
    readCurrentSummary: () => summaryOverride,
  };
};

export default {
  createConsumerMenuRuntime,
};
