export type SddStage = 'PRE_WRITE' | 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';

export type SddDecisionCode =
  | 'ALLOWED'
  | 'OPENSPEC_MISSING'
  | 'OPENSPEC_VERSION_UNSUPPORTED'
  | 'OPENSPEC_PROJECT_MISSING'
  | 'SDD_SESSION_MISSING'
  | 'SDD_SESSION_INVALID'
  | 'SDD_CHANGE_MISSING'
  | 'SDD_CHANGE_ARCHIVED'
  | 'SDD_VALIDATION_FAILED'
  | 'SDD_VALIDATION_ERROR';

export type SddDecision = {
  allowed: boolean;
  code: SddDecisionCode;
  message: string;
  details?: Record<string, string | number | boolean | bigint | symbol | null | Date | object>;
};

export type OpenSpecValidationSummary = {
  ok: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  totals: {
    items: number;
    failed: number;
    passed: number;
  };
  issues: {
    errors: number;
    warnings: number;
    infos: number;
  };
};

export type SddSessionState = {
  repoRoot: string;
  active: boolean;
  changeId?: string;
  updatedAt?: string;
  expiresAt?: string;
  ttlMinutes?: number;
  valid: boolean;
  remainingSeconds?: number;
};

export type SddStatusPayload = {
  repoRoot: string;
  openspec: {
    installed: boolean;
    version?: string;
    projectInitialized: boolean;
    minimumVersion: string;
    recommendedVersion: string;
    compatible: boolean;
    parsedVersion?: string;
  };
  session: SddSessionState;
};

export type SddEvaluateResult = {
  stage: SddStage;
  decision: SddDecision;
  status: SddStatusPayload;
  validation?: OpenSpecValidationSummary;
};
