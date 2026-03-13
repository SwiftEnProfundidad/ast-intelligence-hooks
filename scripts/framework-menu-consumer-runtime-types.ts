import type { FrameworkMenuEvidenceSummary } from './framework-menu-evidence-summary-lib';
import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationEmitResult,
} from './framework-menu-system-notifications-lib';

export type ConsumerAction = {
  id: string;
  label: string;
  execute: () => Promise<void>;
};

export type ConsumerRuntimeBlockedGate = {
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  totalViolations: number;
  causeCode: string;
  causeMessage: string;
  remediation: string;
};

export type ConsumerRuntimeGateResult = {
  blocked?: ConsumerRuntimeBlockedGate;
};

export type ConsumerRuntimeWrite = (text: string) => void;

export type ConsumerRuntimeEmitNotification = (params: {
  event: PumukiCriticalNotificationEvent;
  repoRoot: string;
}) => SystemNotificationEmitResult;

export type ConsumerMenuRuntimeParams = {
  runRepoGate: () => Promise<ConsumerRuntimeGateResult | void>;
  runRepoAndStagedGate: () => Promise<ConsumerRuntimeGateResult | void>;
  runStagedGate: () => Promise<ConsumerRuntimeGateResult | void>;
  runWorkingTreeGate: () => Promise<ConsumerRuntimeGateResult | void>;
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
  summaryOverride?: FrameworkMenuEvidenceSummary | null;
};

export type ConsumerRuntimeNotificationDependencies = {
  emitNotification: ConsumerRuntimeEmitNotification;
  repoRoot: string;
};

export type ConsumerRuntimeSummaryHandler = (
  summary: FrameworkMenuEvidenceSummary
) => void;
