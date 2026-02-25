export type ConsumerSupportBundleCliOptions = {
  repo: string;
  limit: number;
  outFile: string;
};

export type ConsumerSupportBundleWorkflowRun = {
  databaseId: number;
  workflowName: string;
  status: string;
  conclusion: string | null;
  url: string;
  event: string;
  createdAt: string;
  headBranch: string;
  headSha: string;
};

export type ConsumerSupportBundleRunMetadata = {
  id: number;
  name: string;
  path: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  referenced_workflows: ReadonlyArray<unknown>;
};

export type ConsumerSupportBundleJobsResponse = {
  total_count: number;
};

export type ConsumerSupportBundleArtifactResponse = {
  total_count: number;
};

export type ConsumerSupportBundleRepoResponse = {
  full_name: string;
  private: boolean;
  visibility: string;
};

export type ConsumerSupportBundleRepoActionsPermissionsResponse = {
  enabled: boolean;
  allowed_actions: string;
  sha_pinning_required: boolean;
};

type ConsumerSupportBundleUserActionsBillingValue = string | number | boolean | null | Date;
export type ConsumerSupportBundleUserActionsBillingResponse = Record<
  string,
  ConsumerSupportBundleUserActionsBillingValue
>;

export type ConsumerSupportBundleRunDiagnostic = {
  run: ConsumerSupportBundleWorkflowRun;
  metadata?: ConsumerSupportBundleRunMetadata;
  jobsCount?: number;
  artifactsCount?: number;
  error?: string;
};

export const DEFAULT_CONSUMER_SUPPORT_BUNDLE_LIMIT = 20;
export const DEFAULT_CONSUMER_SUPPORT_BUNDLE_OUT_FILE =
  '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md';
