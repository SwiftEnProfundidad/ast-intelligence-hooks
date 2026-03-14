import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const writeEvidence = (repoRoot: string, payload: unknown): void => {
  writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(payload, null, 2), 'utf8');
};

export const writeEvidenceFixture = (repoRoot: string): void => {
  writeEvidence(repoRoot, {
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
  });
};

export const writeEvidenceAbsolutePathsFixture = (repoRoot: string): void => {
  writeEvidence(repoRoot, {
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
  });
};

export const writeEvidenceIosAndroidOnlyFixture = (repoRoot: string): void => {
  writeEvidence(repoRoot, {
    version: '2.1',
    snapshot: {
      stage: 'PRE_COMMIT',
      outcome: 'BLOCK',
      findings: [
        {
          ruleId: 'ios.no-force-unwrap',
          severity: 'CRITICAL',
          filePath: 'apps/ios/App/Feature.swift',
        },
        {
          ruleId: 'android.no-thread-sleep',
          severity: 'WARN',
          filePath: 'apps/android/app/src/main/java/com/example/Main.kt',
        },
      ],
    },
    severity_metrics: {
      by_severity: {
        CRITICAL: 1,
        ERROR: 0,
        WARN: 1,
        INFO: 0,
      },
    },
  });
};

export const writeEvidenceRuleIdMappedFixture = (repoRoot: string): void => {
  writeEvidence(repoRoot, {
    version: '2.1',
    snapshot: {
      stage: 'PRE_COMMIT',
      outcome: 'BLOCK',
      findings: [
        {
          ruleId: 'skills.backend.no-empty-catch',
          severity: 'CRITICAL',
          filePath: 'scripts/utility.ts',
        },
      ],
    },
    severity_metrics: {
      by_severity: {
        CRITICAL: 1,
        ERROR: 0,
        WARN: 0,
        INFO: 0,
      },
    },
  });
};

export const writeEvidenceTsHeuristicMappedFixture = (repoRoot: string): void => {
  writeEvidence(repoRoot, {
    version: '2.1',
    snapshot: {
      stage: 'PRE_COMMIT',
      outcome: 'BLOCK',
      findings: [
        {
          ruleId: 'heuristics.ts.child-process-exec-file-sync.ast',
          severity: 'ERROR',
          filePath: 'scripts/utility.ts',
        },
        {
          ruleId: 'heuristics.ts.inner-html.ast',
          severity: 'ERROR',
          filePath: 'scripts/ui.ts',
        },
      ],
    },
    severity_metrics: {
      by_severity: {
        CRITICAL: 0,
        ERROR: 2,
        WARN: 0,
        INFO: 0,
      },
    },
  });
};

export const writeEvidenceWithFilesScannedFixture = (repoRoot: string, filesScanned: number): void => {
  writeEvidence(repoRoot, {
    version: '2.1',
    snapshot: {
      stage: 'PRE_COMMIT',
      outcome: 'BLOCK',
      files_scanned: filesScanned,
      findings: [
        {
          ruleId: 'backend.avoid-explicit-any',
          severity: 'ERROR',
          filePath: 'apps/backend/src/domain/service.ts',
        },
      ],
    },
    severity_metrics: {
      by_severity: {
        CRITICAL: 0,
        ERROR: 1,
        WARN: 0,
        INFO: 0,
      },
    },
  });
};

export const writeEvidenceWithFileMetricsFixture = (
  repoRoot: string,
  filesScanned: number,
  filesAffected: number
): void => {
  writeEvidence(repoRoot, {
    version: '2.1',
    snapshot: {
      stage: 'PRE_COMMIT',
      outcome: 'BLOCK',
      files_scanned: filesScanned,
      files_affected: filesAffected,
      findings: [
        {
          ruleId: 'backend.avoid-explicit-any',
          severity: 'ERROR',
          filePath: 'apps/backend/src/domain/service.ts',
        },
      ],
    },
    severity_metrics: {
      by_severity: {
        CRITICAL: 0,
        ERROR: 1,
        WARN: 0,
        INFO: 0,
      },
    },
  });
};

export const writeEvidenceMixedRepoHeuristicFixture = (repoRoot: string): void => {
  writeEvidence(repoRoot, {
    version: '2.1',
    snapshot: {
      stage: 'PRE_COMMIT',
      outcome: 'BLOCK',
      findings: [
        {
          ruleId: 'heuristics.ts.explicit-any.ast',
          severity: 'ERROR',
          filePath: 'apps/backend/src/service.ts',
        },
        {
          ruleId: 'heuristics.ts.explicit-any.ast',
          severity: 'ERROR',
          filePath: 'apps/web/src/components/Banner.tsx',
        },
      ],
    },
    severity_metrics: {
      by_severity: {
        CRITICAL: 0,
        ERROR: 2,
        WARN: 0,
        INFO: 0,
      },
    },
  });
};

export const writeEvidenceSnapshotPlatformsFixture = (repoRoot: string): void => {
  writeEvidence(repoRoot, {
    version: '2.1',
    snapshot: {
      stage: 'PRE_COMMIT',
      outcome: 'BLOCK',
      findings: [
        {
          ruleId: 'heuristics.ts.console-log.ast',
          severity: 'WARN',
          filePath: 'scripts/only-other.ts',
        },
      ],
      platforms: [
        {
          platform: 'iOS',
          files_affected: 2,
          by_severity: { CRITICAL: 1, HIGH: 1, MEDIUM: 0, LOW: 0 },
          top_violations: [{ rule_id: 'ios.no-force-unwrap', count: 2 }],
        },
        {
          platform: 'Android',
          files_affected: 0,
          by_severity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
          top_violations: [],
        },
        {
          platform: 'Backend',
          files_affected: 0,
          by_severity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
          top_violations: [],
        },
        {
          platform: 'Frontend',
          files_affected: 0,
          by_severity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
          top_violations: [],
        },
        {
          platform: 'Other',
          files_affected: 1,
          by_severity: { CRITICAL: 0, HIGH: 0, MEDIUM: 1, LOW: 0 },
          top_violations: [{ rule_id: 'heuristics.ts.console-log.ast', count: 1 }],
        },
      ],
    },
    severity_metrics: {
      by_severity: {
        CRITICAL: 1,
        ERROR: 1,
        WARN: 1,
        INFO: 0,
      },
    },
  });
};
