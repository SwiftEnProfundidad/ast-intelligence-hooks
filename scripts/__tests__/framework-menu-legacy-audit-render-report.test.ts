import assert from 'node:assert/strict';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  formatLegacyAuditReport,
  formatLegacyFileDiagnostics,
} from '../framework-menu-legacy-audit-lib';
import { readLegacyAuditSummary } from '../framework-menu-legacy-audit-summary';
import { writeLegacyAuditEvidenceFixture } from './framework-menu-legacy-audit-render-test-helpers';

test('formatLegacyAuditReport renderiza secciones legacy con resumen por plataforma', async () => {
  await withTempDir('pumuki-legacy-audit-format-', async (repoRoot) => {
    writeLegacyAuditEvidenceFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);
    const rendered = formatLegacyAuditReport(summary);

    assert.match(rendered, /PUMUKI — Legacy Read-Only Evidence Snapshot/);
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
    assert.match(rendered, /TOP FINDINGS SNAPSHOT/);
    assert.match(rendered, /READ-ONLY EVIDENCE SNAPSHOT/);
    assert.match(rendered, /Export semantics: legacy read-only snapshot/);
    assert.match(rendered, /Canonical verdict: pumuki status --json \/ doctor --deep --json/);
    assert.match(rendered, /ios\.quality\.long-function/);
  });
});

test('formatLegacyAuditReport usa el stage real en el resumen final cuando no es PRE_COMMIT', async () => {
  await withTempDir('pumuki-legacy-audit-pre-push-status-', async (repoRoot) => {
    writeLegacyAuditEvidenceFixture(repoRoot, {
      snapshot: {
        stage: 'PRE_PUSH',
        outcome: 'BLOCK',
      },
    });
    const summary = readLegacyAuditSummary(repoRoot);
    const rendered = formatLegacyAuditReport(summary);

    assert.match(rendered, /Evidence stage\/outcome: PRE_PUSH \/ BLOCK/);
    assert.match(rendered, /Evidence stage: PRE_PUSH/);
    assert.match(rendered, /Evidence outcome: BLOCK/);
  });
});

test('formatLegacyAuditReport ajusta lineas al ancho de panel solicitado', async () => {
  await withTempDir('pumuki-legacy-audit-width-', async (repoRoot) => {
    writeLegacyAuditEvidenceFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);
    const rendered = formatLegacyAuditReport(summary, { panelWidth: 72 });

    for (const line of rendered.split('\n')) {
      assert.ok(line.length <= 72, `line exceeds panel width (72): ${line}`);
    }
    assert.match(rendered, /READ-ONLY SNAPSHOT/);
  });
});

test('formatLegacyAuditReport soporta anchos pequeño/medio/grande sin overflow', async () => {
  await withTempDir('pumuki-legacy-audit-width-matrix-', async (repoRoot) => {
    writeLegacyAuditEvidenceFixture(repoRoot);
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
    writeLegacyAuditEvidenceFixture(repoRoot);
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

test('formatLegacyAuditReport añade metrica read-only sin next actions ni bloqueo derivado', async () => {
  await withTempDir('pumuki-legacy-audit-impact-metrics-', async (repoRoot) => {
    writeLegacyAuditEvidenceFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);
    const rendered = formatLegacyAuditReport(summary);

    assert.match(rendered, /Affected ratio:/);
    assert.doesNotMatch(rendered, /Next action:/);
    assert.doesNotMatch(rendered, /ACTION REQUIRED/);
  });
});
