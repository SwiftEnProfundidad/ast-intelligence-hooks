import { emitSystemNotification } from './framework-menu-system-notifications-lib';
import { createConsumerRuntimeActions } from './framework-menu-consumer-runtime-actions';
import { printConsumerRuntimeMenu } from './framework-menu-consumer-runtime-menu';
import {
  resolveConsumerRuntimeUseColor,
} from './framework-menu-consumer-runtime-audit';
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
  };
};

export default {
  createConsumerMenuRuntime,
};
