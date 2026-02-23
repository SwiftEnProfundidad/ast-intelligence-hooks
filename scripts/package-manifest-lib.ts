export const REQUIRED_PACKAGE_PATHS = [
  'bin/pumuki.js',
  'bin/pumuki-framework.js',
  'bin/pumuki-pre-commit.js',
  'bin/pumuki-pre-push.js',
  'bin/pumuki-ci.js',
  'bin/pumuki-mcp-evidence.js',
  'core/utils/stableStringify.ts',
  'core/facts/detectors/typescript/index.ts',
  'core/rules/presets/heuristics/typescript.ts',
  'scripts/package-install-smoke.ts',
  'integrations/git/runPlatformGate.ts',
  'integrations/lifecycle/cli.ts',
  'integrations/notifications/emitAuditSummaryNotification.ts',
  'integrations/evidence/buildEvidence.ts',
];

export const FORBIDDEN_PACKAGE_PATTERNS: RegExp[] = [
  /^legacy\//,
  /\/__tests__\//,
  /^docs\/validation\/archive\//,
  /^\.audit-reports\//,
  /^\.audit_tmp\//,
];

export type PackageManifestReport = {
  missingRequired: string[];
  forbiddenMatches: string[];
};

export const inspectPackageManifestPaths = (
  filePaths: ReadonlyArray<string>
): PackageManifestReport => {
  const missingRequired = REQUIRED_PACKAGE_PATHS.filter(
    (requiredPath) => !filePaths.includes(requiredPath)
  );
  const forbiddenMatches = filePaths.filter((path) =>
    FORBIDDEN_PACKAGE_PATTERNS.some((pattern) => pattern.test(path))
  );

  return {
    missingRequired,
    forbiddenMatches,
  };
};
