import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectPackageManifestPaths, REQUIRED_PACKAGE_PATHS } from '../package-manifest-lib';

test('inspectPackageManifestPaths reports no issues when required paths are present and no forbidden entries exist', () => {
  const filePaths = [
    ...REQUIRED_PACKAGE_PATHS,
    'README.md',
    'docs/TESTING.md',
    'integrations/git/preCommitBackend.cli.ts',
  ];

  const report = inspectPackageManifestPaths(filePaths);
  assert.deepEqual(report.missingRequired, []);
  assert.deepEqual(report.forbiddenMatches, []);
});

test('inspectPackageManifestPaths reports missing required files deterministically', () => {
  const filePaths = REQUIRED_PACKAGE_PATHS.filter(
    (path) => path !== 'bin/pumuki-pre-push.js' && path !== 'integrations/evidence/buildEvidence.ts'
  );

  const report = inspectPackageManifestPaths(filePaths);
  assert.deepEqual(report.missingRequired, [
    'bin/pumuki-pre-push.js',
    'integrations/evidence/buildEvidence.ts',
  ]);
});

test('inspectPackageManifestPaths reports forbidden bundle entries', () => {
  const filePaths = [
    ...REQUIRED_PACKAGE_PATHS,
    'legacy/scripts/hooks-system/infrastructure/ast/ast-intelligence.js',
    'scripts/__tests__/framework-menu.test.ts',
    'docs/validation/archive/skills-rollout-mock_consumer-report.md',
    '.audit-reports/package-smoke/summary.md',
  ];

  const report = inspectPackageManifestPaths(filePaths);
  assert.deepEqual(report.forbiddenMatches, [
    'legacy/scripts/hooks-system/infrastructure/ast/ast-intelligence.js',
    'scripts/__tests__/framework-menu.test.ts',
    'docs/validation/archive/skills-rollout-mock_consumer-report.md',
    '.audit-reports/package-smoke/summary.md',
  ]);
});
