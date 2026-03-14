import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { runSddAutoSync, runSddSyncDocs } from '../syncDocs';
import type { EvidenceReadResult } from '../../evidence/readEvidence';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const withFixtureRepo = async (
  prefix: string,
  callback: (repoRoot: string) => Promise<void> | void
): Promise<void> => {
  const repoRoot = mkdtempSync(join(tmpdir(), prefix));
  runGit(repoRoot, ['init', '-b', 'main']);
  runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
  runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
  writeFileSync(join(repoRoot, 'README.md'), '# fixture\n', 'utf8');
  try {
    await callback(repoRoot);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
};

const writeCanonicalDoc = (repoRoot: string, body: string): string => {
  const path = join(
    repoRoot,
    'docs',
    'technical',
    '08-validation',
    'refactor',
    'pumuki-integration-feedback.md'
  );
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body, 'utf8');
  return path;
};

const buildValidBlockedEvidenceResult = (): EvidenceReadResult => ({
  kind: 'valid',
  evidence: {
    timestamp: '2026-03-04T10:10:00.000Z',
    snapshot: {
      outcome: 'BLOCK',
    },
    ai_gate: {
      status: 'BLOCKED',
      violations: [
        {
          code: 'EVIDENCE_STALE',
        },
      ],
    },
    sdd_metrics: {
      decision: {
        allowed: false,
        code: 'SDD_CHANGE_INCOMPLETE',
      },
    },
  } as Extract<EvidenceReadResult, { kind: 'valid' }>['evidence'],
  source_descriptor: {
    source: 'local-file',
    path: '/repo/.ai_evidence.json',
    digest: 'sha256:abcd',
    generated_at: '2026-03-04T10:10:00.000Z',
  },
});

const buildValidAllowedEvidenceResult = (): EvidenceReadResult => ({
  kind: 'valid',
  evidence: {
    timestamp: '2026-03-04T10:20:00.000Z',
    snapshot: {
      outcome: 'ALLOW',
    },
    ai_gate: {
      status: 'ALLOWED',
      violations: [],
    },
    sdd_metrics: {
      decision: {
        allowed: true,
        code: 'ALLOWED',
      },
    },
  } as Extract<EvidenceReadResult, { kind: 'valid' }>['evidence'],
  source_descriptor: {
    source: 'local-file',
    path: '/repo/.ai_evidence.json',
    digest: 'sha256:efgh',
    generated_at: '2026-03-04T10:20:00.000Z',
  },
});

const buildInvalidSchemaEvidenceResult = (): EvidenceReadResult => ({
  kind: 'invalid',
  reason: 'schema',
  source_descriptor: {
    source: 'local-file',
    path: '/repo/.ai_evidence.json',
    digest: 'sha256:invalid',
    generated_at: null,
  },
});

test('runSddSyncDocs dry-run previsualiza diff y no modifica archivo', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-dry-run-', (repoRoot) => {
    const canonicalPath = writeCanonicalDoc(
      repoRoot,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );
    const before = readFileSync(canonicalPath, 'utf8');

    const result = runSddSyncDocs({
      repoRoot,
      dryRun: true,
    });
    const after = readFileSync(canonicalPath, 'utf8');

    assert.equal(result.dryRun, true);
    assert.equal(result.context.change, null);
    assert.equal(result.context.stage, null);
    assert.equal(result.context.task, null);
    assert.equal(result.context.fromEvidencePath, null);
    assert.equal(result.updated, true);
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0]?.updated, true);
    assert.match(result.files[0]?.diffMarkdown ?? '', /sdd-status/i);
    assert.equal(before, after);
  });
});

test('runSddSyncDocs aplica cambios deterministas y segunda ejecución no cambia nada', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-apply-', (repoRoot) => {
    const canonicalPath = writeCanonicalDoc(
      repoRoot,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );

    const first = runSddSyncDocs({
      repoRoot,
      dryRun: false,
    });
    const synced = readFileSync(canonicalPath, 'utf8');
    const second = runSddSyncDocs({
      repoRoot,
      dryRun: false,
    });

    assert.equal(first.updated, true);
    assert.equal(first.context.change, null);
    assert.equal(first.context.stage, null);
    assert.equal(first.context.task, null);
    assert.equal(first.context.fromEvidencePath, null);
    assert.match(synced, /openspec_installed:/);
    assert.equal(second.updated, false);
    assert.equal(second.files[0]?.updated, false);
  });
});

test('runSddSyncDocs incluye contexto explícito change/stage/task en resultado', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-context-', (repoRoot) => {
    writeCanonicalDoc(
      repoRoot,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );

    const result = runSddSyncDocs({
      repoRoot,
      dryRun: true,
      change: 'rgo-1700-01',
      stage: 'PRE_PUSH',
      task: 'P12.F2.T63',
      now: () => new Date('2026-03-04T10:00:00.000Z'),
    });

    assert.equal(result.context.change, 'rgo-1700-01');
    assert.equal(result.context.stage, 'PRE_PUSH');
    assert.equal(result.context.task, 'P12.F2.T63');
    assert.equal(result.context.fromEvidencePath, null);
    assert.equal(result.learning?.path, 'openspec/changes/rgo-1700-01/learning.json');
    assert.equal(result.learning?.written, false);
    assert.equal(result.learning?.artifact.version, '1.0');
    assert.equal(result.learning?.artifact.change_id, 'rgo-1700-01');
    assert.equal(result.learning?.artifact.generated_at, '2026-03-04T10:00:00.000Z');
    assert.deepEqual(result.learning?.artifact.successful_patterns, [
      'sync-docs.completed',
      'sync-docs.updated',
    ]);
    assert.deepEqual(result.learning?.artifact.gate_anomalies, ['evidence.missing']);
    assert.deepEqual(result.learning?.artifact.rule_updates, ['evidence.bootstrap.required']);
    assert.equal(result.learning?.artifact.scoring.profile, 'heuristic-v1');
    assert.equal(result.learning?.artifact.scoring.score, 93);
    assert.equal(result.learning?.artifact.scoring.successful_count, 2);
    assert.equal(result.learning?.artifact.scoring.failed_count, 0);
    assert.equal(result.learning?.artifact.scoring.anomaly_count, 1);
    assert.equal(result.learning?.artifact.scoring.rule_update_count, 1);
    assert.equal(
      existsSync(join(repoRoot, 'openspec', 'changes', 'rgo-1700-01', 'learning.json')),
      false
    );
  });
});

test('runSddSyncDocs permite leer evidencia desde --from-evidence (ruta alternativa)', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-from-evidence-', (repoRoot) => {
    writeCanonicalDoc(
      repoRoot,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );

    const customEvidencePath = join(repoRoot, '.pumuki', 'evidence', 'custom-invalid.json');
    mkdirSync(dirname(customEvidencePath), { recursive: true });
    writeFileSync(customEvidencePath, '{invalid-json', 'utf8');

    const result = runSddSyncDocs({
      repoRoot,
      dryRun: true,
      change: 'rgo-1700-01',
      fromEvidencePath: '.pumuki/evidence/custom-invalid.json',
      now: () => new Date('2026-03-04T10:00:00.000Z'),
    });

    assert.equal(result.context.fromEvidencePath, '.pumuki/evidence/custom-invalid.json');
    assert.deepEqual(result.learning?.artifact.gate_anomalies, ['evidence.invalid.schema']);
    assert.deepEqual(result.learning?.artifact.rule_updates, [
      'evidence.rebuild.required',
      'evidence.schema.repair',
    ]);
  });
});

test('runSddSyncDocs bloquea --from-evidence cuando intenta salir del repo root', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-from-evidence-escape-', (repoRoot) => {
    writeCanonicalDoc(
      repoRoot,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );

    assert.throws(
      () =>
        runSddSyncDocs({
          repoRoot,
          dryRun: true,
          change: 'rgo-1700-01',
          fromEvidencePath: '../outside-evidence.json',
        }),
      /--from-evidence must resolve inside repository root/i
    );
  });
});

test('runSddSyncDocs persiste learning artifact cuando change está presente y no es dry-run', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-learning-write-', (repoRoot) => {
    writeCanonicalDoc(
      repoRoot,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );

    const result = runSddSyncDocs({
      repoRoot,
      dryRun: false,
      change: 'rgo-1700-02',
      stage: 'PRE_COMMIT',
      task: 'P12.F2.T65',
      now: () => new Date('2026-03-04T10:05:00.000Z'),
    });

    const learningPath = join(repoRoot, 'openspec', 'changes', 'rgo-1700-02', 'learning.json');
    assert.equal(result.learning?.written, true);
    assert.equal(result.learning?.path, 'openspec/changes/rgo-1700-02/learning.json');
    assert.equal(result.learning?.artifact.stage, 'PRE_COMMIT');
    assert.equal(result.learning?.artifact.task, 'P12.F2.T65');
    assert.equal(result.learning?.artifact.generated_at, '2026-03-04T10:05:00.000Z');
    assert.deepEqual(result.learning?.artifact.gate_anomalies, ['evidence.missing']);
    assert.equal(existsSync(learningPath), true);
    const stored = readFileSync(learningPath, 'utf8');
    const parsed = JSON.parse(stored) as {
      version: string;
      change_id: string;
      stage: string | null;
      task: string | null;
      generated_at: string;
      failed_patterns: string[];
      successful_patterns: string[];
      rule_updates: string[];
      gate_anomalies: string[];
    };
    assert.equal(parsed.version, '1.0');
    assert.equal(parsed.change_id, 'rgo-1700-02');
    assert.equal(parsed.stage, 'PRE_COMMIT');
    assert.equal(parsed.task, 'P12.F2.T65');
    assert.equal(parsed.generated_at, '2026-03-04T10:05:00.000Z');
    assert.deepEqual(parsed.failed_patterns, []);
    assert.deepEqual(parsed.successful_patterns, ['sync-docs.completed', 'sync-docs.updated']);
    assert.deepEqual(parsed.rule_updates, ['evidence.bootstrap.required']);
    assert.deepEqual(parsed.gate_anomalies, ['evidence.missing']);
    assert.equal(result.learning?.artifact.scoring.profile, 'heuristic-v1');
    assert.equal(result.learning?.artifact.scoring.score, 93);
  });
});

test('runSddSyncDocs agrega señales de gate cuando evidenceReader devuelve evidencia bloqueada', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-learning-signals-', (repoRoot) => {
    writeCanonicalDoc(
      repoRoot,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );

    const result = runSddSyncDocs({
      repoRoot,
      dryRun: true,
      change: 'rgo-1700-03',
      stage: 'PRE_WRITE',
      task: 'P12.F2.T66',
      evidenceReader: () => buildValidBlockedEvidenceResult(),
      now: () => new Date('2026-03-04T10:10:00.000Z'),
    });

    assert.deepEqual(result.learning?.artifact.failed_patterns, [
      'ai-gate.blocked',
      'sdd.blocked.SDD_CHANGE_INCOMPLETE',
    ]);
    assert.deepEqual(result.learning?.artifact.successful_patterns, [
      'sync-docs.completed',
      'sync-docs.updated',
    ]);
    assert.deepEqual(result.learning?.artifact.gate_anomalies, [
      'ai-gate.violation.EVIDENCE_STALE',
      'snapshot.outcome.block',
    ]);
    assert.deepEqual(result.learning?.artifact.rule_updates, [
      'ai-gate.unblock.required',
      'ai-gate.violation.EVIDENCE_STALE.review',
      'sdd.SDD_CHANGE_INCOMPLETE.remediate',
      'snapshot.outcome.review',
    ]);
    assert.equal(result.learning?.artifact.scoring.profile, 'heuristic-v1');
    assert.equal(result.learning?.artifact.scoring.score, 18);
  });
});

test('runSddSyncDocs genera rule_updates para evidencia inválida de schema', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-learning-invalid-', (repoRoot) => {
    writeCanonicalDoc(
      repoRoot,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );

    const result = runSddSyncDocs({
      repoRoot,
      dryRun: true,
      change: 'rgo-1700-04',
      stage: 'PRE_WRITE',
      task: 'P12.F2.T67',
      evidenceReader: () => buildInvalidSchemaEvidenceResult(),
      now: () => new Date('2026-03-04T10:30:00.000Z'),
    });

    assert.deepEqual(result.learning?.artifact.failed_patterns, []);
    assert.deepEqual(result.learning?.artifact.successful_patterns, [
      'sync-docs.completed',
      'sync-docs.updated',
    ]);
    assert.deepEqual(result.learning?.artifact.gate_anomalies, ['evidence.invalid.schema']);
    assert.deepEqual(result.learning?.artifact.rule_updates, [
      'evidence.rebuild.required',
      'evidence.schema.repair',
    ]);
    assert.equal(result.learning?.artifact.scoring.score, 88);
  });
});

test('runSddSyncDocs mantiene rule_updates vacío cuando la evidencia válida está en allow', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-learning-allow-', (repoRoot) => {
    writeCanonicalDoc(
      repoRoot,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );

    const result = runSddSyncDocs({
      repoRoot,
      dryRun: true,
      change: 'rgo-1700-05',
      stage: 'PRE_WRITE',
      task: 'P12.F2.T67',
      evidenceReader: () => buildValidAllowedEvidenceResult(),
      now: () => new Date('2026-03-04T10:35:00.000Z'),
    });

    assert.deepEqual(result.learning?.artifact.failed_patterns, []);
    assert.deepEqual(result.learning?.artifact.successful_patterns, [
      'ai-gate.allowed',
      'sdd.allowed',
      'sync-docs.completed',
      'sync-docs.updated',
    ]);
    assert.deepEqual(result.learning?.artifact.gate_anomalies, []);
    assert.deepEqual(result.learning?.artifact.rule_updates, []);
    assert.equal(result.learning?.artifact.scoring.score, 100);
  });
});

test('runSddSyncDocs soporta múltiples documentos canónicos de forma determinista', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-multi-target-', (repoRoot) => {
    const firstPath = writeCanonicalDoc(
      repoRoot,
      [
        '# First',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: first',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );
    const secondRelativePath = 'docs/ops/secondary-sync.md';
    const secondPath = join(repoRoot, secondRelativePath);
    mkdirSync(dirname(secondPath), { recursive: true });
    writeFileSync(
      secondPath,
      [
        '# Second',
        '',
        '<!-- PUMUKI:BEGIN SECONDARY_STATUS -->',
        '- stale: second',
        '<!-- PUMUKI:END SECONDARY_STATUS -->',
        '',
      ].join('\n'),
      'utf8'
    );

    const result = runSddSyncDocs({
      repoRoot,
      dryRun: false,
      targets: [
        {
          path: 'docs/technical/08-validation/refactor/pumuki-integration-feedback.md',
          sections: [
            {
              id: 'sdd-status',
              beginMarker: '<!-- PUMUKI:BEGIN SDD_STATUS -->',
              endMarker: '<!-- PUMUKI:END SDD_STATUS -->',
              renderBody: () => '- value: first-updated',
            },
          ],
        },
        {
          path: secondRelativePath,
          sections: [
            {
              id: 'secondary-status',
              beginMarker: '<!-- PUMUKI:BEGIN SECONDARY_STATUS -->',
              endMarker: '<!-- PUMUKI:END SECONDARY_STATUS -->',
              renderBody: () => '- value: second-updated',
            },
          ],
        },
      ],
    });

    assert.equal(result.files.length, 2);
    assert.equal(result.files[0]?.updated, true);
    assert.equal(result.files[1]?.updated, true);
    assert.match(readFileSync(firstPath, 'utf8'), /first-updated/);
    assert.match(readFileSync(secondPath, 'utf8'), /second-updated/);
  });
});

test('runSddSyncDocs por defecto sincroniza 3 docs canónicos SDD cuando existen en el repo consumer', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-default-consumer-targets-', (repoRoot) => {
    writeCanonicalDoc(
      repoRoot,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );

    const trackingHubPath = join(repoRoot, 'docs', 'strategy', 'ruralgo-tracking-hub.md');
    mkdirSync(dirname(trackingHubPath), { recursive: true });
    writeFileSync(trackingHubPath, '# Tracking hub\n', 'utf8');

    const operationalSummaryPath = join(
      repoRoot,
      'docs',
      'technical',
      '08-validation',
      'refactor',
      'operational-summary.md'
    );
    mkdirSync(dirname(operationalSummaryPath), { recursive: true });
    writeFileSync(operationalSummaryPath, '# Operational summary\n', 'utf8');

    const lastRunPath = join(repoRoot, 'docs', 'validation', 'refactor', 'last-run.json');
    mkdirSync(dirname(lastRunPath), { recursive: true });
    writeFileSync(
      lastRunPath,
      `${JSON.stringify({ status: 'IN_PROGRESS', task: 'RGO-TEST' }, null, 2)}\n`,
      'utf8'
    );

    const result = runSddSyncDocs({
      repoRoot,
      dryRun: false,
    });

    const syncedTrackingHub = readFileSync(trackingHubPath, 'utf8');
    const syncedOperationalSummary = readFileSync(operationalSummaryPath, 'utf8');
    const syncedLastRun = JSON.parse(readFileSync(lastRunPath, 'utf8')) as {
      pumuki_sdd_status?: {
        source?: string;
        session_active?: boolean;
      };
    };

    assert.equal(result.files.length, 4);
    assert.deepEqual(
      result.files.map((file) => file.path).sort((left, right) => left.localeCompare(right)),
      [
        'docs/strategy/ruralgo-tracking-hub.md',
        'docs/technical/08-validation/refactor/operational-summary.md',
        'docs/technical/08-validation/refactor/pumuki-integration-feedback.md',
        'docs/validation/refactor/last-run.json',
      ]
    );
    assert.match(syncedTrackingHub, /PUMUKI:BEGIN SDD_SYNC_STATUS/);
    assert.match(syncedOperationalSummary, /PUMUKI:BEGIN SDD_SYNC_STATUS/);
    assert.equal(syncedLastRun.pumuki_sdd_status?.source, 'pumuki sdd sync-docs');
    assert.equal(typeof syncedLastRun.pumuki_sdd_status?.session_active, 'boolean');
  });
});

test('runSddSyncDocs es fail-safe: conflicto en un archivo evita escritura parcial de otros archivos', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-failsafe-', (repoRoot) => {
    const firstPath = writeCanonicalDoc(
      repoRoot,
      [
        '# First',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: first',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );
    const secondRelativePath = 'docs/ops/secondary-sync.md';
    const secondPath = join(repoRoot, secondRelativePath);
    mkdirSync(dirname(secondPath), { recursive: true });
    writeFileSync(secondPath, '# Second without markers\n', 'utf8');

    const firstBefore = readFileSync(firstPath, 'utf8');
    const secondBefore = readFileSync(secondPath, 'utf8');

    assert.throws(
      () =>
        runSddSyncDocs({
          repoRoot,
          dryRun: false,
          targets: [
            {
              path: 'docs/technical/08-validation/refactor/pumuki-integration-feedback.md',
              sections: [
                {
                  id: 'sdd-status',
                  beginMarker: '<!-- PUMUKI:BEGIN SDD_STATUS -->',
                  endMarker: '<!-- PUMUKI:END SDD_STATUS -->',
                  renderBody: () => '- value: first-updated',
                },
              ],
            },
            {
              path: secondRelativePath,
              sections: [
                {
                  id: 'secondary-status',
                  beginMarker: '<!-- PUMUKI:BEGIN SECONDARY_STATUS -->',
                  endMarker: '<!-- PUMUKI:END SECONDARY_STATUS -->',
                  renderBody: () => '- value: second-updated',
                },
              ],
            },
          ],
        }),
      /sync-docs conflict/i
    );

    const firstAfter = readFileSync(firstPath, 'utf8');
    const secondAfter = readFileSync(secondPath, 'utf8');
    assert.equal(firstAfter, firstBefore);
    assert.equal(secondAfter, secondBefore);
  });
});

test('runSddSyncDocs falla con conflicto de marcadores y no toca el archivo', async () => {
  await withFixtureRepo('pumuki-sdd-sync-docs-conflict-', (repoRoot) => {
    const canonicalPath = writeCanonicalDoc(repoRoot, '# Canonical\n\nwithout managed markers\n');
    const before = readFileSync(canonicalPath, 'utf8');

    assert.throws(
      () =>
        runSddSyncDocs({
          repoRoot,
          dryRun: false,
        }),
      /sync-docs conflict/i
    );
    const after = readFileSync(canonicalPath, 'utf8');
    assert.equal(before, after);
  });
});

test('runSddAutoSync dry-run orquesta sync-docs + learning sin modificar archivos', async () => {
  await withFixtureRepo('pumuki-sdd-auto-sync-dry-run-', (repoRoot) => {
    const canonicalPath = writeCanonicalDoc(
      repoRoot,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );
    const before = readFileSync(canonicalPath, 'utf8');

    const result = runSddAutoSync({
      repoRoot,
      dryRun: true,
      change: 'rgo-1700-06',
      stage: 'PRE_PUSH',
      task: 'P12.F2.T70',
      now: () => new Date('2026-03-04T11:00:00.000Z'),
    });
    const after = readFileSync(canonicalPath, 'utf8');

    assert.equal(result.command, 'pumuki sdd auto-sync');
    assert.equal(result.dryRun, true);
    assert.equal(result.context.change, 'rgo-1700-06');
    assert.equal(result.context.stage, 'PRE_PUSH');
    assert.equal(result.context.task, 'P12.F2.T70');
    assert.equal(result.context.fromEvidencePath, null);
    assert.equal(result.syncDocs.updated, true);
    assert.equal(result.syncDocs.files.length, 4);
    assert.deepEqual(
      result.syncDocs.files.map((file) => file.path).sort((left, right) => left.localeCompare(right)),
      [
        'docs/technical/08-validation/refactor/pumuki-integration-feedback.md',
        'openspec/changes/rgo-1700-06/design.md',
        'openspec/changes/rgo-1700-06/retrospective.md',
        'openspec/changes/rgo-1700-06/tasks.md',
      ]
    );
    assert.equal(result.learning.path, 'openspec/changes/rgo-1700-06/learning.json');
    assert.equal(result.learning.written, false);
    assert.equal(before, after);
  });
});

test('runSddAutoSync aplica sync-docs y persiste learning en modo escritura', async () => {
  await withFixtureRepo('pumuki-sdd-auto-sync-write-', (repoRoot) => {
    const canonicalPath = writeCanonicalDoc(
      repoRoot,
      [
        '# Canonical',
        '',
        '<!-- PUMUKI:BEGIN SDD_STATUS -->',
        '- stale: true',
        '<!-- PUMUKI:END SDD_STATUS -->',
        '',
      ].join('\n')
    );

    const result = runSddAutoSync({
      repoRoot,
      dryRun: false,
      change: 'rgo-1700-07',
      stage: 'PRE_COMMIT',
      task: 'P12.F2.T70',
      now: () => new Date('2026-03-04T11:05:00.000Z'),
    });

    assert.equal(result.command, 'pumuki sdd auto-sync');
    assert.equal(result.syncDocs.updated, true);
    assert.equal(result.context.fromEvidencePath, null);
    assert.match(readFileSync(canonicalPath, 'utf8'), /openspec_installed:/);
    const tasksPath = join(repoRoot, 'openspec', 'changes', 'rgo-1700-07', 'tasks.md');
    const designPath = join(repoRoot, 'openspec', 'changes', 'rgo-1700-07', 'design.md');
    const retrospectivePath = join(repoRoot, 'openspec', 'changes', 'rgo-1700-07', 'retrospective.md');
    assert.equal(existsSync(tasksPath), true);
    assert.equal(existsSync(designPath), true);
    assert.equal(existsSync(retrospectivePath), true);
    assert.match(readFileSync(tasksPath, 'utf8'), /PUMUKI:BEGIN AUTO_SYNC_STATUS/);
    assert.match(readFileSync(designPath, 'utf8'), /PUMUKI:BEGIN AUTO_SYNC_STATUS/);
    assert.match(readFileSync(retrospectivePath, 'utf8'), /PUMUKI:BEGIN AUTO_SYNC_STATUS/);
    const learningPath = join(repoRoot, 'openspec', 'changes', 'rgo-1700-07', 'learning.json');
    assert.equal(existsSync(learningPath), true);
    assert.equal(result.learning.written, true);
    assert.equal(result.learning.path, 'openspec/changes/rgo-1700-07/learning.json');
  });
});

test('runSddAutoSync falla cuando falta --change', () => {
  assert.throws(
    () =>
      runSddAutoSync({
        repoRoot: process.cwd(),
        dryRun: true,
      }),
    /auto-sync requires --change/i
  );
});
