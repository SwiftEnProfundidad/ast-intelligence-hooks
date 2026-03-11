export type PumukiNotificationStage = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI' | 'PRE_WRITE';

export type PumukiCriticalNotificationEvent =
  | {
      kind: 'audit.summary';
      totalViolations: number;
      criticalViolations: number;
      highViolations: number;
    }
  | {
      kind: 'gate.blocked';
      stage: PumukiNotificationStage;
      totalViolations: number;
      causeCode?: string;
      causeMessage?: string;
      remediation?: string;
    }
  | {
      kind: 'evidence.stale';
      evidencePath: string;
      ageMinutes: number;
    }
  | {
      kind: 'gitflow.violation';
      currentBranch: string;
      reason: string;
    };
