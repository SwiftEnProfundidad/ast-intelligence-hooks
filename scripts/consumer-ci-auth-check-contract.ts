export type CliOptions = {
  repo: string;
  outFile: string;
};

export type RepoActionsPermissionsResponse = {
  enabled: boolean;
  allowed_actions: string;
  sha_pinning_required: boolean;
};

export type UserActionsBillingResponse = Record<string, unknown>;

export type CommandResult = {
  ok: boolean;
  output?: string;
  error?: string;
};

export type JsonResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export type BuildConsumerCiAuthMarkdownParams = {
  options: CliOptions;
  authStatus: CommandResult;
  scopes: ReadonlyArray<string>;
  missingScopes: ReadonlyArray<string>;
  actionsPermissions: JsonResult<RepoActionsPermissionsResponse>;
  billing: JsonResult<UserActionsBillingResponse>;
  verdict: 'READY' | 'BLOCKED';
};

export const DEFAULT_CONSUMER_CI_AUTH_OUT_FILE =
  '.audit-reports/consumer-triage/consumer-ci-auth-check.md';

export const REQUIRED_CONSUMER_CI_AUTH_SCOPES = ['repo', 'workflow'] as const;
