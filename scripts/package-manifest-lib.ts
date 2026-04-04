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
  'integrations/policy/policyProfiles.ts',
  'integrations/policy/experimentalFeatures.ts',
  'integrations/telemetry/gateTelemetry.ts',
  'integrations/lifecycle/cli.ts',
  'integrations/notifications/emitAuditSummaryNotification.ts',
  'integrations/evidence/buildEvidence.ts',
  'skills.sources.json',
  'docs/codex-skills/android-enterprise-rules.md',
  'docs/codex-skills/backend-enterprise-rules.md',
  'docs/codex-skills/frontend-enterprise-rules.md',
  'docs/codex-skills/ios-enterprise-rules.md',
  'docs/codex-skills/swift-concurrency.md',
  'docs/codex-skills/swiftui-expert-skill.md',
];

export const CANONICAL_ALLOWED_LEGACY_PATHS = new Set([
  'legacy/scripts/hooks-system/infrastructure/cascade-hooks/verify-adapter-hooks-runtime.sh',
  'legacy/scripts/hooks-system/infrastructure/cascade-hooks/run-hook-with-node.sh',
  'legacy/scripts/hooks-system/infrastructure/cascade-hooks/collect-runtime-diagnostics.sh',
]);

const LEGACY_ROOT_PATTERN = /^legacy\//;

export const FORBIDDEN_PACKAGE_PATTERNS: RegExp[] = [
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
  const forbiddenMatches = filePaths.filter((path) => {
    if (LEGACY_ROOT_PATTERN.test(path)) {
      return !CANONICAL_ALLOWED_LEGACY_PATHS.has(path);
    }

    return FORBIDDEN_PACKAGE_PATTERNS.some((pattern) => pattern.test(path));
  });

  return {
    missingRequired,
    forbiddenMatches,
  };
};
