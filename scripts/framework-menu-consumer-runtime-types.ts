import type { LegacyAuditSummary } from './framework-menu-legacy-audit-lib';
import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationEmitResult,
} from './framework-menu-system-notifications-lib';

export type ConsumerAction = {
  id: string;
  label: string;
  execute: () => Promise<void>;
};

export type ConsumerRuntimeWrite = (text: string) => void;

export type ConsumerRuntimeEmitNotification = (params: {
  event: PumukiCriticalNotificationEvent;
  repoRoot: string;
}) => SystemNotificationEmitResult;

export type ConsumerMenuRuntimeParams = {
  runRepoGate: () => Promise<void>;
  runRepoAndStagedGate: () => Promise<void>;
  runStagedGate: () => Promise<void>;
  runWorkingTreeGate: () => Promise<void>;
  runPreflight?: (
    stage: 'PRE_COMMIT' | 'PRE_PUSH'
  ) => Promise<string | void> | string | void;
  emitSystemNotification?: ConsumerRuntimeEmitNotification;
  write: ConsumerRuntimeWrite;
};

export type ConsumerMenuRuntime = {
  actions: ReadonlyArray<ConsumerAction>;
  printMenu: () => void;
};

export type ConsumerRuntimeScope = 'staged' | 'workingTree';

export type ConsumerRuntimeSummaryDependencies = {
  repoRoot: string;
  write: ConsumerRuntimeWrite;
  useColor: () => boolean;
};

export type ConsumerRuntimeNotificationDependencies = {
  emitNotification: ConsumerRuntimeEmitNotification;
  repoRoot: string;
};

export type ConsumerRuntimeSummaryHandler = (
  summary: LegacyAuditSummary
) => void;
