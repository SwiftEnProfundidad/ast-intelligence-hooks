import type {
  AiGateCheckResult,
  AiGateViolation,
} from '../integrations/gate/evaluateAiGate';
import type {
  GovernanceNextActionReader,
  GovernanceNextActionSummary,
} from '../integrations/lifecycle/governanceNextAction';
import type { GovernanceObservationSnapshot } from '../integrations/lifecycle/governanceObservationSnapshot';
import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationEmitResult,
} from './framework-menu-system-notifications-lib';

export type ConsumerPreflightStage = 'PRE_COMMIT' | 'PRE_PUSH';

export type ConsumerPreflightResult = {
  stage: ConsumerPreflightStage;
  status: AiGateCheckResult['status'];
  result: AiGateCheckResult;
  governanceObservation: GovernanceObservationSnapshot;
  governanceNextAction: GovernanceNextActionSummary;
  hints: ReadonlyArray<string>;
  notificationResults: ReadonlyArray<SystemNotificationEmitResult>;
};

export type ConsumerPreflightDependencies = {
  evaluateAiGate: (params: {
    repoRoot: string;
    stage: ConsumerPreflightStage;
  }) => AiGateCheckResult;
  emitSystemNotification: (params: {
    event: PumukiCriticalNotificationEvent;
    repoRoot: string;
  }) => SystemNotificationEmitResult;
  readGovernanceNextAction: GovernanceNextActionReader;
};

export type ConsumerPreflightRenderOptions = {
  panelWidth?: number;
  color?: boolean;
};

export type ConsumerPreflightHintDependencies = {
  actionableHintsByCode?: Readonly<Record<string, string>>;
};

export type ConsumerPreflightViolationList = ReadonlyArray<AiGateViolation>;
