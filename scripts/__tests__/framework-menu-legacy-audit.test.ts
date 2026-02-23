import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  exportLegacyAuditMarkdown,
  formatLegacyAuditReport,
  formatLegacyFileDiagnostics,
  renderLegacyPanel,
  resolveLegacyMenuDesignTokens,
  resolveLegacyPanelOuterWidth,
  readLegacyAuditSummary,
} from '../framework-menu-legacy-audit-lib';

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

test('formatLegacyAuditReport renderiza secciones legacy con resumen por plataforma', async () => {
  await withTempDir('pumuki-legacy-audit-format-', async (repoRoot) => {
    writeEvidenceFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);
    const rendered = formatLegacyAuditReport(summary);

    assert.match(rendered, /PUMUKI — Hook-System \(run: npx ast-hooks\)/);
    assert.match(rendered, /QUICK SUMMARY/);
    assert.match(rendered, /Files scanned:\s+4/);
    assert.match(rendered, /PATTERN CHECKS/);
    assert.match(rendered, /AST INTELLIGENCE — SEVERITY BREAKDOWN/);
    assert.match(rendered, /Platform: iOS/);
    assert.match(rendered, /Platform: Android/);
    assert.match(rendered, /┌ Platform: iOS/);
    assert.match(rendered, /└ End platform block/);
    assert.match(rendered, /4\) RULESET COVERAGE/);
    assert.match(rendered, /iosEnterpriseRuleSet \(inferred\)/);
    assert.match(rendered, /backendRuleSet@1\.0\.0/);
    assert.match(rendered, /TOP VIOLATIONS & REMEDIATION/);
    assert.match(rendered, /FINAL SUMMARY — VIOLATIONS BY SEVERITY/);
    assert.match(rendered, /COMMIT BLOCKED — STRICT REPO\+STAGING/);
    assert.match(rendered, /Generated by Pumuki — Hook-System/);
    assert.match(rendered, /ios\.quality\.long-function/);
  });
});

test('exportLegacyAuditMarkdown genera reporte markdown en .audit-reports', async () => {
  await withTempDir('pumuki-legacy-audit-export-', async (repoRoot) => {
    writeEvidenceFixture(repoRoot);
    const outputDir = join(repoRoot, '.audit-reports');
    mkdirSync(outputDir, { recursive: true });

    const filePath = exportLegacyAuditMarkdown({
      repoRoot,
      outputPath: join(outputDir, 'legacy-audit.md'),
    });

    assert.equal(existsSync(filePath), true);
    const markdown = readFileSync(filePath, 'utf8');
    assert.match(markdown, /# PUMUKI Audit Report/);
    assert.match(markdown, /## Clickable Top Files/);
    assert.match(markdown, /## Clickable Findings/);
    assert.match(
      markdown,
      /\[apps\/ios\/App\/Feature\.swift:18\]\(\.\/apps\/ios\/App\/Feature\.swift#L18\)/
    );
    assert.match(markdown, /FINAL SUMMARY — VIOLATIONS BY SEVERITY/);
  });
});

test('formatLegacyAuditReport ajusta lineas al ancho de panel solicitado', async () => {
  await withTempDir('pumuki-legacy-audit-width-', async (repoRoot) => {
    writeEvidenceFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);
    const rendered = formatLegacyAuditReport(summary, { panelWidth: 72 });

    for (const line of rendered.split('\n')) {
      assert.ok(
        line.length <= 72,
        `line exceeds panel width (72): ${line}`
      );
    }
    assert.match(rendered, /ACTION REQUIRED/);
  });
});

test('formatLegacyAuditReport soporta anchos pequeño/medio/grande sin overflow', async () => {
  await withTempDir('pumuki-legacy-audit-width-matrix-', async (repoRoot) => {
    writeEvidenceFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);

    for (const width of [56, 72, 100]) {
      const rendered = formatLegacyAuditReport(summary, { panelWidth: width });
      for (const line of rendered.split('\n')) {
        assert.ok(line.length <= width, `line exceeds panel width (${width}): ${line}`);
      }
    }
  });
});

test('formatLegacyFileDiagnostics lista top de ficheros violados', async () => {
  await withTempDir('pumuki-legacy-file-diagnostics-', async (repoRoot) => {
    writeEvidenceFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);
    const rendered = formatLegacyFileDiagnostics(summary);

    assert.match(rendered, /FILE DIAGNOSTICS — TOP VIOLATED FILES/);
    assert.match(rendered, /apps\/backend\/src\/domain\/service\.ts: 1/);
    assert.match(rendered, /↳ apps\/backend\/src\/domain\/service\.ts:44/);
    assert.match(rendered, /apps\/ios\/App\/Feature\.swift: 1/);
    assert.match(rendered, /↳ apps\/ios\/App\/Feature\.swift:18/);
    assert.match(rendered, /VIOLATIONS — CLICKABLE LOCATIONS/);
    assert.match(
      rendered,
      /\[CRITICAL\] ios\.quality\.long-function -> apps\/ios\/App\/Feature\.swift:18/
    );
  });
});

test('formatLegacyAuditReport añade metricas de impacto y siguiente accion', async () => {
  await withTempDir('pumuki-legacy-audit-impact-metrics-', async (repoRoot) => {
    writeEvidenceFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);
    const rendered = formatLegacyAuditReport(summary);

    assert.match(rendered, /Affected ratio:/);
    assert.match(rendered, /Next action:/);
  });
});

test('readLegacyAuditSummary mantiene siempre las 5 plataformas con cero cuando no hay findings', async () => {
  await withTempDir('pumuki-legacy-audit-platforms-', async (repoRoot) => {
    writeEvidenceIosAndroidOnlyFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);
    const rendered = formatLegacyAuditReport(summary);

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

    assert.match(rendered, /┌ Platform: Backend/);
    assert.match(rendered, /┌ Platform: Frontend/);
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
    assert.equal(
      backend?.topViolations.some(
        (violation) => violation.ruleId === 'heuristics.ts.child-process-exec-file-sync.ast'
      ),
      true
    );
    assert.equal(
      other?.topViolations.some(
        (violation) => violation.ruleId === 'heuristics.ts.child-process-exec-file-sync.ast'
      ),
      false
    );
    assert.equal(
      frontend?.topViolations.some(
        (violation) => violation.ruleId === 'heuristics.ts.inner-html.ast'
      ),
      true
    );
  });
});

test('resolveLegacyPanelOuterWidth respeta override por PUMUKI_MENU_WIDTH', () => {
  const previous = process.env.PUMUKI_MENU_WIDTH;
  process.env.PUMUKI_MENU_WIDTH = '72';
  try {
    assert.equal(resolveLegacyPanelOuterWidth(), 72);
  } finally {
    if (typeof previous === 'string') {
      process.env.PUMUKI_MENU_WIDTH = previous;
    } else {
      delete process.env.PUMUKI_MENU_WIDTH;
    }
  }
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

test('renderLegacyPanel mantiene todas las lineas dentro del ancho solicitado', () => {
  const panel = renderLegacyPanel(
    [
      'PUMUKI — Hook-System (run: npx ast-hooks)',
      'Source files → AST analyzers → violations → severity evaluation → AI Gate verdict',
      'ACTION REQUIRED: Critical or high-severity issues detected. Please review and fix before proceeding.',
    ],
    { width: 70, color: false }
  );

  for (const line of panel.split('\n')) {
    assert.ok(line.length <= 70, `line exceeds panel width (70): ${line}`);
  }
});

test('resolveLegacyMenuDesignTokens aplica fallback no-color cuando NO_COLOR=1', () => {
  const previous = process.env.NO_COLOR;
  process.env.NO_COLOR = '1';
  try {
    const tokens = resolveLegacyMenuDesignTokens();
    assert.equal(tokens.colorEnabled, false);
  } finally {
    if (typeof previous === 'string') {
      process.env.NO_COLOR = previous;
    } else {
      delete process.env.NO_COLOR;
    }
  }
});

test('renderLegacyPanel usa bordes ASCII cuando PUMUKI_MENU_ASCII=1', () => {
  const previous = process.env.PUMUKI_MENU_ASCII;
  process.env.PUMUKI_MENU_ASCII = '1';
  try {
    const panel = renderLegacyPanel(
      [
        'PUMUKI — Hook-System (run: npx ast-hooks)',
        'AST Intelligence System Overview',
      ],
      { width: 70, color: false }
    );
    const lines = panel.split('\n');
    assert.match(lines[0] ?? '', /^\+-+\+$/);
    assert.match(lines[lines.length - 1] ?? '', /^\+-+\+$/);
    assert.equal(lines[1]?.startsWith('| '), true);
  } finally {
    if (typeof previous === 'string') {
      process.env.PUMUKI_MENU_ASCII = previous;
    } else {
      delete process.env.PUMUKI_MENU_ASCII;
    }
  }
});

test('renderLegacyPanel respeta ancho solicitado sin doble reduccion', () => {
  const panel = renderLegacyPanel(
    ['PUMUKI — Hook-System (run: npx ast-hooks)'],
    { width: 70, color: false }
  );
  const lines = panel.split('\n');
  const top = lines[0] ?? '';
  assert.equal(top.length, 70);
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
    assert.equal(
      backend?.topViolations.some(
        (violation) => violation.ruleId === 'heuristics.ts.explicit-any.ast'
      ),
      true
    );
    assert.equal(
      frontend?.topViolations.some(
        (violation) => violation.ruleId === 'heuristics.ts.explicit-any.ast'
      ),
      true
    );
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
