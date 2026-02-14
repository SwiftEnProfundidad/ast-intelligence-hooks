export type AdapterRealSessionCliOptions = {
  outFile: string;
  statusReportFile: string;
  operator: string;
  adapterVersion: string;
  tailLines: number;
};

export type AdapterParsedStatusReport = {
  verdict?: string;
  verifyExitCode?: number;
  strictExitCode?: number;
  anyExitCode?: number;
  strictAssessmentPass: boolean;
  anyAssessmentPass: boolean;
};

export type AdapterRealSessionReportParams = {
  options: AdapterRealSessionCliOptions;
  nowIso: string;
  branch: string;
  repository: string;
  nodeRuntime: string;
  hookConfigPath: string;
  hookConfigContent?: string;
  statusReportPath: string;
  statusReport?: string;
  parsedStatus: AdapterParsedStatusReport;
  runtimeLogPath?: string;
  runtimeLogContent?: string;
  runtimeLogTail: string;
  smokeLogPath?: string;
  smokeLogContent?: string;
  smokeLogTail: string;
  hookLogPath: string;
  hookLogContent?: string;
  hookLogTail: string;
  writesLogPath: string;
  writesLogContent?: string;
  writesLogTail: string;
  hasRuntimeLog: boolean;
  hasSmokeLog: boolean;
  hasHookLog: boolean;
  hasWritesLog: boolean;
  hookConfigExists: boolean;
};

export const DEFAULT_ADAPTER_REAL_SESSION_OUT_FILE =
  '.audit-reports/adapter/adapter-real-session-report.md';
export const DEFAULT_ADAPTER_STATUS_REPORT_FILE =
  '.audit-reports/adapter/adapter-session-status.md';
export const DEFAULT_ADAPTER_REAL_SESSION_OPERATOR = 'unknown';
export const DEFAULT_ADAPTER_REAL_SESSION_VERSION = 'unknown';
export const DEFAULT_ADAPTER_REAL_SESSION_TAIL_LINES = 120;
