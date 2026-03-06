import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import { readLegacyAuditSummary } from '../framework-menu-legacy-audit-summary';

const writeEvidenceFixture = (repoRoot: string): void => {
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

const writeEvidenceAbsolutePathsFixture = (repoRoot: string): void => {
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

const writeEvidenceIosAndroidOnlyFixture = (repoRoot: string): void => {
  const payload = {
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
  };
  writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(payload, null, 2), 'utf8');
};

const writeEvidenceRuleIdMappedFixture = (repoRoot: string): void => {
  const payload = {
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
  };
  writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(payload, null, 2), 'utf8');
};

const writeEvidenceTsHeuristicMappedFixture = (repoRoot: string): void => {
  const payload = {
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
  };
  writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(payload, null, 2), 'utf8');
};

const writeEvidenceWithFilesScannedFixture = (repoRoot: string, filesScanned: number): void => {
  const payload = {
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
  };
  writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(payload, null, 2), 'utf8');
};

const writeEvidenceWithFileMetricsFixture = (
  repoRoot: string,
  filesScanned: number,
  filesAffected: number
): void => {
  const payload = {
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
  };
  writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(payload, null, 2), 'utf8');
};

const writeEvidenceMixedRepoHeuristicFixture = (repoRoot: string): void => {
  const payload = {
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
  };
  writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(payload, null, 2), 'utf8');
};

const writeEvidenceSnapshotPlatformsFixture = (repoRoot: string): void => {
  const payload = {
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
  };
  writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(payload, null, 2), 'utf8');
};

test('readLegacyAuditSummary mantiene siempre las 5 plataformas con cero cuando no hay findings', async () => {
  await withTempDir('pumuki-legacy-audit-platforms-', async (repoRoot) => {
    writeEvidenceIosAndroidOnlyFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);

    assert.equal(summary.platforms.length, 5);
    const backend = summary.platforms.find((platform) => platform.platform === 'Backend');
    const frontend = summary.platforms.find((platform) => platform.platform === 'Frontend');
    assert.ok(backend);
    assert.ok(frontend);
    assert.equal(backend?.bySeverity.CRITICAL, 0);
    assert.equal(backend?.bySeverity.HIGH, 0);
    assert.equal(backend?.bySeverity.MEDIUM, 0);
    assert.equal(backend?.bySeverity.LOW, 0);
    assert.equal(frontend?.bySeverity.CRITICAL, 0);
    assert.equal(frontend?.bySeverity.HIGH, 0);
    assert.equal(frontend?.bySeverity.MEDIUM, 0);
    assert.equal(frontend?.bySeverity.LOW, 0);
  });
});

test('readLegacyAuditSummary clasifica plataforma por ruleId cuando el path no pertenece a apps', async () => {
  await withTempDir('pumuki-legacy-audit-ruleid-platform-', async (repoRoot) => {
    writeEvidenceRuleIdMappedFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);

    const backend = summary.platforms.find((platform) => platform.platform === 'Backend');
    const other = summary.platforms.find((platform) => platform.platform === 'Other');
    assert.ok(backend);
    assert.ok(other);
    assert.equal(backend?.filesAffected, 1);
    assert.equal(backend?.topViolations[0]?.ruleId, 'skills.backend.no-empty-catch');
    assert.equal(other?.filesAffected, 0);
  });
});

test('readLegacyAuditSummary clasifica heuristics.ts a frontend y backend en repos framework', async () => {
  await withTempDir('pumuki-legacy-audit-ts-heuristic-platform-', async (repoRoot) => {
    writeEvidenceTsHeuristicMappedFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);

    const backend = summary.platforms.find((platform) => platform.platform === 'Backend');
    const frontend = summary.platforms.find((platform) => platform.platform === 'Frontend');
    const other = summary.platforms.find((platform) => platform.platform === 'Other');
    assert.ok(backend);
    assert.ok(frontend);
    assert.ok(other);
    assert.equal(backend?.filesAffected, 1);
    assert.equal(frontend?.filesAffected, 1);
    assert.equal(other?.filesAffected, 0);
  });
});

test('readLegacyAuditSummary usa snapshot.files_scanned y score por densidad de violaciones', async () => {
  await withTempDir('pumuki-legacy-audit-files-scanned-', async (repoRoot) => {
    writeEvidenceWithFilesScannedFixture(repoRoot, 200);
    const relaxed = readLegacyAuditSummary(repoRoot);
    writeEvidenceWithFilesScannedFixture(repoRoot, 1);
    const strict = readLegacyAuditSummary(repoRoot);

    assert.equal(relaxed.filesScanned, 200);
    assert.equal(strict.filesScanned, 1);
    assert.ok(relaxed.codeHealthScore > strict.codeHealthScore);
  });
});

test('readLegacyAuditSummary separa snapshot.files_scanned de snapshot.files_affected', async () => {
  await withTempDir('pumuki-legacy-audit-file-metrics-', async (repoRoot) => {
    writeEvidenceWithFileMetricsFixture(repoRoot, 939, 40);
    const summary = readLegacyAuditSummary(repoRoot);

    assert.equal(summary.filesScanned, 939);
    assert.equal(summary.filesAffected, 40);
  });
});

test('readLegacyAuditSummary en repo mixto prioriza path apps/* frente a fallback heuristics.ts.*', async () => {
  await withTempDir('pumuki-legacy-audit-mixed-repo-', async (repoRoot) => {
    writeEvidenceMixedRepoHeuristicFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);

    const backend = summary.platforms.find((platform) => platform.platform === 'Backend');
    const frontend = summary.platforms.find((platform) => platform.platform === 'Frontend');
    const other = summary.platforms.find((platform) => platform.platform === 'Other');

    assert.ok(backend);
    assert.ok(frontend);
    assert.ok(other);
    assert.equal(backend?.filesAffected, 1);
    assert.equal(frontend?.filesAffected, 1);
    assert.equal(other?.filesAffected, 0);
  });
});

test('readLegacyAuditSummary prioriza snapshot.platforms cuando existe en evidencia', async () => {
  await withTempDir('pumuki-legacy-audit-snapshot-platforms-', async (repoRoot) => {
    writeEvidenceSnapshotPlatformsFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);

    const ios = summary.platforms.find((platform) => platform.platform === 'iOS');
    const other = summary.platforms.find((platform) => platform.platform === 'Other');
    assert.ok(ios);
    assert.ok(other);
    assert.equal(ios?.filesAffected, 2);
    assert.equal(ios?.bySeverity.CRITICAL, 1);
    assert.equal(ios?.bySeverity.HIGH, 1);
    assert.equal(other?.filesAffected, 1);
    assert.equal(other?.bySeverity.MEDIUM, 1);
  });
});

test('readLegacyAuditSummary normaliza paths absolutos a repo-relative', async () => {
  await withTempDir('pumuki-legacy-audit-absolute-paths-', async (repoRoot) => {
    writeEvidenceAbsolutePathsFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);

    assert.equal(summary.topFindings?.[0]?.file.startsWith(repoRoot), false);
    assert.equal(summary.topFiles[0]?.file.startsWith(repoRoot), false);
  });
});

test('readLegacyAuditSummary resume findings, severidad y rulesets', async () => {
  await withTempDir('pumuki-legacy-audit-summary-', async (repoRoot) => {
    writeEvidenceFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);

    assert.equal(summary.status, 'ok');
    assert.equal(summary.stage, 'PRE_COMMIT');
    assert.equal(summary.outcome, 'BLOCK');
    assert.equal(summary.totalViolations, 4);
    assert.equal(summary.filesScanned, 4);
    assert.equal(summary.filesAffected, 4);
    assert.equal(summary.bySeverity.CRITICAL, 1);
    assert.equal(summary.bySeverity.HIGH, 1);
    assert.equal(summary.bySeverity.MEDIUM, 2);
    assert.equal(summary.rulesets.length > 0, true);
  });
});
