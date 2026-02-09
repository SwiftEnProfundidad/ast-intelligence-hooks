export type ParsedSupportBundle = {
  repoVisibility?: string;
  startupFailureRuns?: string;
  runUrls: ReadonlyArray<string>;
  path?: string;
  jobsCount?: string;
  artifactsCount?: string;
};

export type ParsedAuthReport = {
  verdict?: string;
  detectedScopes?: string;
  missingScopes?: string;
  billingError?: string;
};

const extractLineValue = (source: string, pattern: RegExp): string | undefined => {
  const match = source.match(pattern);
  if (!match || !match[1]) {
    return undefined;
  }
  return match[1].trim();
};

const dedupe = (values: ReadonlyArray<string>): string[] => {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    output.push(value);
  }

  return output;
};

export const parseSupportBundle = (markdown: string): ParsedSupportBundle => {
  const runUrls = dedupe(
    Array.from(
      markdown.matchAll(/https:\/\/github\.com\/[^\s)]+\/actions\/runs\/\d+/g),
      (match) => match[0]
    )
  );

  return {
    repoVisibility: extractLineValue(markdown, /- repo_visibility:\s*`([^`]+)`/),
    startupFailureRuns: extractLineValue(markdown, /- startup_failure_runs:\s*([0-9]+)/),
    runUrls,
    path: extractLineValue(markdown, /- path:\s*([^\n]+)/),
    jobsCount: extractLineValue(markdown, /- jobs\.total_count:\s*([0-9]+)/),
    artifactsCount: extractLineValue(markdown, /- artifacts\.total_count:\s*([0-9]+)/),
  };
};

export const parseAuthReport = (markdown: string): ParsedAuthReport => {
  return {
    verdict: extractLineValue(markdown, /- verdict:\s*([^\n]+)/),
    detectedScopes: extractLineValue(markdown, /- detected_scopes:\s*([^\n]+)/),
    missingScopes: extractLineValue(markdown, /- missing_scopes:\s*([^\n]+)/),
    billingError: extractLineValue(markdown, /## Billing Probe\s+[\s\S]*?- error:\s*([^\n]+)/),
  };
};
