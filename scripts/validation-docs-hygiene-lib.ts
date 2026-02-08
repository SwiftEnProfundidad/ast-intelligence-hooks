export type ValidationDocsHygieneResult = {
  violations: ReadonlyArray<string>;
};

const ALLOWED_ROOT_DOCS = new Set<string>([
  'docs/validation/README.md',
  'docs/validation/consumer-ci-startup-failure-playbook.md',
  'docs/validation/github-support-ticket-template-startup-failure.md',
  'docs/validation/skills-rollout-consumer-ci-artifacts.md',
  'docs/validation/skills-rollout-consumer-repositories.md',
  'docs/validation/windsurf-hook-runtime-local-report.md',
  'docs/validation/windsurf-hook-runtime-validation.md',
  'docs/validation/windsurf-real-session-report-template.md',
]);

const ARCHIVE_PREFIX = 'docs/validation/archive/';

const isAllowedTrackedValidationDoc = (trackedPath: string): boolean => {
  if (ALLOWED_ROOT_DOCS.has(trackedPath)) {
    return true;
  }

  if (trackedPath.startsWith(ARCHIVE_PREFIX)) {
    return true;
  }

  return false;
};

export const checkValidationDocsHygiene = (
  trackedPaths: ReadonlyArray<string>
): ValidationDocsHygieneResult => {
  const violations = trackedPaths
    .filter((trackedPath) => trackedPath.startsWith('docs/validation/'))
    .filter((trackedPath) => !isAllowedTrackedValidationDoc(trackedPath))
    .sort((left, right) => left.localeCompare(right));

  return {
    violations,
  };
};
