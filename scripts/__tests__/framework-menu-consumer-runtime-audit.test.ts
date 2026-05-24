import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { renderConsumerRuntimeSummary } from '../framework-menu-consumer-runtime-audit';

test('renderConsumerRuntimeSummary denuncia drift de regla fichero y linea aunque coincidan totales', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-menu-drift-'));
  writeFileSync(
    join(repoRoot, '.ai_evidence.json'),
    JSON.stringify({
      snapshot: {
        stage: 'PRE_COMMIT',
        outcome: 'BLOCK',
        files_scanned: 1,
        files_affected: 1,
        platforms: [
          {
            platform: 'iOS',
            by_severity: {
              HIGH: 1,
            },
          },
        ],
        findings: [
          {
            severity: 'ERROR',
            ruleId: 'canonical.rule',
            file: 'apps/ios/Canonical.swift',
            lines: [22],
          },
        ],
      },
      severity_metrics: {
        by_enterprise_severity: {
          CRITICAL: 0,
          HIGH: 1,
          MEDIUM: 0,
          LOW: 0,
        },
      },
    })
  );

  const writes: string[] = [];
  renderConsumerRuntimeSummary({
    repoRoot,
    summaryOverride: {
      status: 'ok',
      stage: 'PRE_COMMIT',
      outcome: 'BLOCK',
      totalFindings: 1,
      filesScanned: 0,
      filesAffected: 0,
      bySeverity: {
        CRITICAL: 0,
        ERROR: 1,
        WARN: 0,
        INFO: 0,
      },
      byEnterpriseSeverity: {
        CRITICAL: 0,
        HIGH: 1,
        MEDIUM: 0,
        LOW: 0,
      },
      topFiles: [{ file: 'apps/ios/Gate.swift', count: 1 }],
      topFileLocations: [{ file: 'apps/ios/Gate.swift', line: 7 }],
      topFindings: [
        {
          severity: 'HIGH',
          ruleId: 'gate.rule',
          file: 'apps/ios/Gate.swift',
          line: 7,
        },
      ],
      platformAuditRows: [{ platform: 'iOS', violations: 1 }],
    },
    write: (value) => {
      writes.push(value);
    },
    useColor: () => false,
  });

  const rendered = writes.join('\n');
  assert.match(rendered, /MENU_GATE_EVIDENCE_DRIFT/);
  assert.match(
    rendered,
    /topFinding\.0[\s\S]*gate\.rule -> apps\/ios\/Gate\.swift:7[\s\S]*canonical\.rule -> apps\/ios\/Canonical\.swift:22/
  );
});
