export type ConsumerCiArtifactsCliOptions = {
  repo: string;
  limit: number;
  outFile: string;
};

export type ConsumerCiWorkflowRun = {
  databaseId: number;
  displayTitle: string;
  workflowName: string;
  status: string;
  conclusion: string | null;
  url: string;
  createdAt: string;
  event: string;
  headBranch: string;
  headSha: string;
};

export type ConsumerCiRunMetadata = {
  id: number;
  name: string;
  path: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  referenced_workflows: ReadonlyArray<unknown>;
};

export type ConsumerCiArtifact = {
  id: number;
  name: string;
  size_in_bytes: number;
  archive_download_url: string;
  expired: boolean;
  expires_at: string;
};

export type ConsumerCiArtifactResponse = {
  total_count: number;
  artifacts: ConsumerCiArtifact[];
};

export type ConsumerCiRunArtifactsResult = {
  run: ConsumerCiWorkflowRun;
  metadata?: ConsumerCiRunMetadata;
  artifacts?: ConsumerCiArtifactResponse;
  errorLabel: string;
};

export const DEFAULT_LIMIT = 20;
export const DEFAULT_OUT_FILE = '.audit-reports/consumer-triage/consumer-ci-artifacts-report.md';
