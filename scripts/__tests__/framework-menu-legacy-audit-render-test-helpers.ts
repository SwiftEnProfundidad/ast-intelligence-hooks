import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const writeLegacyAuditEvidenceFixture = (repoRoot: string): void => {
  const payload = {
    version: '2.1',
    snapshot: {
      stage: 'PRE_COMMIT',
      outcome: 'BLOCK',
      findings: [
        {
          ruleId: 'ios.quality.long-function',
          severity: 'CRITICAL',
          filePath: 'apps/ios/App/Feature.swift',
          lines: [18, 22],
        },
        {
          ruleId: 'backend.avoid-explicit-any',
          severity: 'ERROR',
          filePath: 'apps/backend/src/domain/service.ts',
          lines: 44,
        },
        {
          ruleId: 'frontend.no-console-log',
          severity: 'WARN',
          filePath: 'apps/web/src/components/Banner.tsx',
        },
        {
          ruleId: 'android.no-thread-sleep',
          severity: 'WARN',
          filePath: 'apps/android/app/src/main/java/com/example/Main.kt',
        },
      ],
    },
    rulesets: [
      { platform: 'generic', bundle: 'astHeuristicsRuleSet@0.5.0', hash: 'h1' },
      { platform: 'backend', bundle: 'backendRuleSet@1.0.0', hash: 'h2' },
    ],
    severity_metrics: {
      by_severity: {
        CRITICAL: 1,
        ERROR: 1,
        WARN: 2,
        INFO: 0,
      },
    },
  };
  writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(payload, null, 2), 'utf8');
};

export const writeLegacyAuditAbsolutePathsFixture = (repoRoot: string): void => {
  const payload = {
    version: '2.1',
    snapshot: {
      stage: 'PRE_COMMIT',
      outcome: 'BLOCK',
      findings: [
        {
          ruleId: 'skills.backend.no-empty-catch',
          severity: 'CRITICAL',
          filePath: `${repoRoot}/apps/backend/src/runtime/process.ts`,
          lines: 27,
        },
        {
          ruleId: 'skills.frontend.avoid-explicit-any',
          severity: 'ERROR',
          filePath: `${repoRoot}/apps/web/src/ui/banner.tsx`,
          lines: [14, 22],
        },
      ],
    },
    severity_metrics: {
      by_severity: {
        CRITICAL: 1,
        ERROR: 1,
        WARN: 0,
        INFO: 0,
      },
    },
  };
  writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(payload, null, 2), 'utf8');
};

export const escapeLegacyAuditRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
