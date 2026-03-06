import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectBacklogHeadingDrift,
  collectBacklogIdIssueMap,
  collectBacklogWatchEntries,
  dedupeBacklogWatchEntriesById,
  runBacklogWatch,
} from '../watch-consumer-backlog-lib';

const sampleMarkdown = `# Backlog

| Orden | ID | Estado | Referencia upstream | Nota |
|---|---|---|---|---|
| 1 | PUMUKI-001 | ✅ | #100 | cerrado |
| 2 | PUMUKI-002 | ⏳ | Pendiente | pendiente |
| 3 | PUMUKI-M001 | 🚧 | #101 | en curso |
| 4 | PUMUKI-003 | ⛔ | #102 | bloqueado |
`;

const textualStatusMarkdown = `# Feedback canónico

| ID | Fecha | Tipo | Severidad | Estado |
|---|---|---|---|---|
| PUMUKI-INC-001 | 2026-03-02 | Incoherencia | High | REPORTED |
| FP-001 | 2026-03-02 | Falso positivo | High | FIXED (#481, #490) |
| AST-GAP-001 | 2026-03-02 | Gap | Medium | OPEN |
`;

const fluxStatusMarkdown = `# Bugs y Mejoras de Pumuki

| ID | Fecha | Tipo | Area | Estado |
|---|---|---|---|---|
| PUM-001 | 2026-03-05 | Bug | SDD | ✅ Cerrado |
| PUM-002 | 2026-03-05 | Bug | Skills | 🚧 En construccion |
`;

const saasOperationalMarkdown = `# Registro de Bugs y Mejoras de Pumuki

## Seguimiento operativo (Bugs)
| Orden | ID | Severidad | Prioridad | Estado | Referencia upstream | Versión objetivo | Nota |
|---|---|---|---|---|---|---|---|
| 18 | PUMUKI-018 | HIGH | P1 | ⏳ | Pendiente | TBC | Falso positivo \`ios.no-force-unwrap\` al detectar patrón seguro \`!= nil\` en Swift y bloquear \`ci:local\` por \`EVIDENCE_GATE_BLOCKED\`. |
`;

const headingDriftMarkdown = `| ID | Estado | Referencia upstream |
|---|---|---|
| PUMUKI-INC-300 | 🚧 | #710 |

### ⏳ PUMUKI-INC-300
Detalle.
`;

test('collectBacklogWatchEntries detecta ids, estados e issueRef', () => {
  const entries = collectBacklogWatchEntries(sampleMarkdown);
  assert.deepEqual(
    entries.map((entry) => [entry.id, entry.status, entry.issueNumber]),
    [
      ['PUMUKI-001', '✅', 100],
      ['PUMUKI-002', '⏳', null],
      ['PUMUKI-M001', '🚧', 101],
      ['PUMUKI-003', '⛔', 102],
    ]
  );
});

test('runBacklogWatch clasifica needs_issue, drift y active', async () => {
  const result = await runBacklogWatch({
    filePath: '/tmp/backlog-watch.md',
    readFile: () => sampleMarkdown,
    resolveIssueState: (issueNumber) => {
      if (issueNumber === 101) {
        return 'OPEN';
      }
      if (issueNumber === 102) {
        return 'CLOSED';
      }
      return 'OPEN';
    },
  });

  assert.equal(result.entriesScanned, 4);
  assert.equal(result.nonClosedEntries, 3);
  assert.equal(result.issueStatesResolved, 2);
  assert.equal(result.classification.needsIssue.length, 1);
  assert.equal(result.classification.driftClosedIssue.length, 1);
  assert.equal(result.classification.activeIssue.length, 1);
  assert.equal(result.classification.needsIssue[0]?.id, 'PUMUKI-002');
  assert.equal(result.classification.driftClosedIssue[0]?.id, 'PUMUKI-003');
  assert.equal(result.classification.activeIssue[0]?.id, 'PUMUKI-M001');
  assert.deepEqual(result.resolution.resolvedByMap, []);
  assert.deepEqual(result.resolution.resolvedByGhLookup, []);
  assert.deepEqual(result.resolution.unresolvedIds, ['PUMUKI-002']);
  assert.equal(result.hasActionRequired, true);
});

test('runBacklogWatch queda en no-action cuando todo está cerrado', async () => {
  const markdown = `| Orden | ID | Estado | Referencia upstream | Nota |\n|---|---|---|---|---|\n| 1 | PUMUKI-001 | ✅ | #100 | cerrado |\n`;
  const result = await runBacklogWatch({
    filePath: '/tmp/backlog-watch-closed.md',
    readFile: () => markdown,
    resolveIssueState: () => 'CLOSED',
  });
  assert.equal(result.nonClosedEntries, 0);
  assert.equal(result.hasActionRequired, false);
  assert.equal(result.classification.needsIssue.length, 0);
  assert.equal(result.classification.driftClosedIssue.length, 0);
  assert.equal(result.classification.activeIssue.length, 0);
  assert.deepEqual(result.resolution.unresolvedIds, []);
});

test('collectBacklogWatchEntries soporta estados textuales e IDs de RuralGo', () => {
  const entries = collectBacklogWatchEntries(textualStatusMarkdown);
  assert.deepEqual(
    entries.map((entry) => [entry.id, entry.status, entry.issueNumber]),
    [
      ['PUMUKI-INC-001', '🚧', null],
      ['FP-001', '✅', 481],
      ['AST-GAP-001', '⏳', null],
    ]
  );
});

test('collectBacklogWatchEntries soporta IDs PUM legacy de Flux', () => {
  const entries = collectBacklogWatchEntries(fluxStatusMarkdown);
  assert.deepEqual(
    entries.map((entry) => [entry.id, entry.status]),
    [
      ['PUM-001', '✅'],
      ['PUM-002', '🚧'],
    ]
  );
});

test('collectBacklogWatchEntries soporta el formato operativo real de SAAS con columna Pendiente sin issue', () => {
  const entries = collectBacklogWatchEntries(saasOperationalMarkdown);
  assert.deepEqual(
    entries.map((entry) => [entry.id, entry.status, entry.issueNumber]),
    [['PUMUKI-018', '⏳', null]]
  );
});

test('collectBacklogWatchEntries prioriza issue de columnas derechas frente a # en contexto', () => {
  const markdown = `| ID | Estado | Contexto | Referencia |\n|---|---|---|---|\n| PUMUKI-INC-056 | 🚧 REPORTED (#544, #547) | post-#543 auditoría | Pendiente |\n`;
  const entries = collectBacklogWatchEntries(markdown);
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.issueNumber, 544);
});

test('dedupeBacklogWatchEntriesById conserva entrada más útil por id', () => {
  const entries = collectBacklogWatchEntries(
    `| ID | Estado | Ref |\n|---|---|---|\n| PUMUKI-INC-100 | 🚧 REPORTED | Pendiente |\n| PUMUKI-INC-100 | 🚧 REPORTED (#700) | #700 |\n`
  );
  const deduped = dedupeBacklogWatchEntriesById(entries);
  assert.equal(deduped.length, 1);
  assert.equal(deduped[0]?.issueNumber, 700);
});

test('runBacklogWatch deduplica IDs repetidos en tablas resumen/detalle', async () => {
  const markdown =
    `| ID | Estado | Ref |\n|---|---|---|\n| PUMUKI-INC-100 | 🚧 REPORTED | Pendiente |\n| PUMUKI-INC-100 | 🚧 REPORTED (#700) | #700 |\n`;
  const result = await runBacklogWatch({
    filePath: '/tmp/backlog-watch-dedupe.md',
    readFile: () => markdown,
    resolveIssueState: (issueNumber) => (issueNumber === 700 ? 'OPEN' : 'CLOSED'),
  });
  assert.equal(result.entriesScanned, 2);
  assert.equal(result.nonClosedEntries, 1);
  assert.equal(result.classification.needsIssue.length, 0);
  assert.equal(result.classification.activeIssue.length, 1);
  assert.equal(result.classification.activeIssue[0]?.issueNumber, 700);
});

test('runBacklogWatch usa idIssueMap para resolver filas sin #issue y evitar needsIssue fantasma', async () => {
  const markdown = `| ID | Estado | Ref |\n|---|---|---|\n| PUMUKI-INC-059 | 🚧 REPORTED | Pendiente |\n`;
  const result = await runBacklogWatch({
    filePath: '/tmp/backlog-watch-id-map.md',
    readFile: () => markdown,
    idIssueMap: {
      'PUMUKI-INC-059': 646,
    },
    resolveIssueState: (issueNumber) => (issueNumber === 646 ? 'CLOSED' : 'OPEN'),
  });

  assert.equal(result.nonClosedEntries, 1);
  assert.equal(result.classification.needsIssue.length, 0);
  assert.equal(result.classification.driftClosedIssue.length, 1);
  assert.equal(result.classification.driftClosedIssue[0]?.issueNumber, 646);
  assert.deepEqual(result.resolution.resolvedByMap, ['PUMUKI-INC-059']);
  assert.deepEqual(result.resolution.resolvedByGhLookup, []);
  assert.deepEqual(result.resolution.unresolvedIds, []);
  assert.equal(result.issueStatesResolved, 1);
});

test('collectBacklogIdIssueMap extrae mapeo canónico ID->issue desde markdown', () => {
  const markdown =
    `| ID | Estado | Ref |\n|---|---|---|\n| PUMUKI-INC-059 | 🚧 REPORTED (#646) | #646 |\n| FP-030 | ✅ FIXED (#648) | #648 |\n| AST-GAP-001 | ⏳ PENDING | Pendiente |\n`;
  const map = collectBacklogIdIssueMap(markdown);
  assert.deepEqual(map, {
    'PUMUKI-INC-059': 646,
    'FP-030': 648,
  });
});

test('runBacklogWatch enriquece issueNumber por ID cuando no hay mapping local', async () => {
  const markdown = `| ID | Estado | Ref |\n|---|---|---|\n| PUMUKI-INC-200 | ⏳ REPORTED | Pendiente |\n`;
  const lookedUp: Array<[string, string | undefined]> = [];

  const result = await runBacklogWatch({
    filePath: '/tmp/backlog-watch-gh-enrichment.md',
    repo: 'SwiftEnProfundidad/ast-intelligence-hooks',
    readFile: () => markdown,
    resolveIssueNumberById: (id, repo) => {
      lookedUp.push([id, repo]);
      return id === 'PUMUKI-INC-200' ? 654 : null;
    },
    resolveIssueState: (issueNumber) => (issueNumber === 654 ? 'OPEN' : 'CLOSED'),
  });

  assert.deepEqual(lookedUp, [['PUMUKI-INC-200', 'SwiftEnProfundidad/ast-intelligence-hooks']]);
  assert.equal(result.classification.needsIssue.length, 0);
  assert.equal(result.classification.activeIssue.length, 1);
  assert.equal(result.classification.activeIssue[0]?.issueNumber, 654);
  assert.deepEqual(result.resolution.resolvedByMap, []);
  assert.deepEqual(result.resolution.resolvedByGhLookup, ['PUMUKI-INC-200']);
  assert.deepEqual(result.resolution.unresolvedIds, []);
  assert.equal(result.issueStatesResolved, 1);
});

test('runBacklogWatch no consulta resolver por ID si issue ya viene del idIssueMap', async () => {
  const markdown = `| ID | Estado | Ref |\n|---|---|---|\n| PUMUKI-INC-201 | ⏳ REPORTED | Pendiente |\n| PUMUKI-INC-202 | ⏳ REPORTED | Pendiente |\n`;
  const lookedUp: string[] = [];

  const result = await runBacklogWatch({
    filePath: '/tmp/backlog-watch-gh-enrichment-mixed.md',
    readFile: () => markdown,
    idIssueMap: {
      'PUMUKI-INC-201': 700,
    },
    resolveIssueNumberById: (id) => {
      lookedUp.push(id);
      return id === 'PUMUKI-INC-202' ? 701 : null;
    },
    resolveIssueState: (issueNumber) => (issueNumber === 701 ? 'CLOSED' : 'OPEN'),
  });

  assert.deepEqual(lookedUp, ['PUMUKI-INC-202']);
  assert.equal(result.classification.needsIssue.length, 0);
  assert.equal(result.classification.activeIssue.length, 1);
  assert.equal(result.classification.driftClosedIssue.length, 1);
  assert.deepEqual(result.resolution.resolvedByMap, ['PUMUKI-INC-201']);
  assert.deepEqual(result.resolution.resolvedByGhLookup, ['PUMUKI-INC-202']);
  assert.deepEqual(result.resolution.unresolvedIds, []);
  assert.deepEqual(
    result.classification.activeIssue.map((entry) => entry.issueNumber),
    [700]
  );
  assert.deepEqual(
    result.classification.driftClosedIssue.map((entry) => entry.issueNumber),
    [701]
  );
});

test('runBacklogWatch mantiene unresolvedIds cuando no hay mapping ni lookup', async () => {
  const markdown = `| ID | Estado | Ref |\n|---|---|---|\n| PUMUKI-INC-203 | ⏳ REPORTED | Pendiente |\n`;
  const result = await runBacklogWatch({
    filePath: '/tmp/backlog-watch-unresolved.md',
    readFile: () => markdown,
    resolveIssueNumberById: () => null,
    resolveIssueState: () => 'OPEN',
  });

  assert.deepEqual(result.resolution.resolvedByMap, []);
  assert.deepEqual(result.resolution.resolvedByGhLookup, []);
  assert.deepEqual(result.resolution.unresolvedIds, ['PUMUKI-INC-203']);
  assert.equal(result.classification.needsIssue.length, 1);
});

test('collectBacklogHeadingDrift detecta drift entre heading y estado efectivo por ID', () => {
  const drift = collectBacklogHeadingDrift(headingDriftMarkdown);
  assert.equal(drift.length, 1);
  assert.equal(drift[0]?.id, 'PUMUKI-INC-300');
  assert.equal(drift[0]?.headingStatus, '⏳');
  assert.equal(drift[0]?.effectiveStatus, '🚧');
});

test('runBacklogWatch reporta heading drift como action-required', async () => {
  const result = await runBacklogWatch({
    filePath: '/tmp/backlog-watch-heading-drift.md',
    readFile: () => headingDriftMarkdown,
    resolveIssueState: () => 'OPEN',
  });

  assert.equal(result.classification.needsIssue.length, 0);
  assert.equal(result.classification.driftClosedIssue.length, 0);
  assert.equal(result.classification.activeIssue.length, 1);
  assert.equal(result.headingDrift.length, 1);
  assert.equal(result.headingDrift[0]?.id, 'PUMUKI-INC-300');
  assert.equal(result.hasActionRequired, true);
});

test('runBacklogWatch mantiene visible un pendiente real del backlog SAAS cuando no existe issue upstream', async () => {
  const result = await runBacklogWatch({
    filePath: '/tmp/backlog-watch-saas-real.md',
    readFile: () => saasOperationalMarkdown,
    resolveIssueState: () => 'OPEN',
  });

  assert.equal(result.entriesScanned, 1);
  assert.equal(result.nonClosedEntries, 1);
  assert.equal(result.classification.needsIssue.length, 1);
  assert.equal(result.classification.needsIssue[0]?.id, 'PUMUKI-018');
  assert.equal(result.classification.needsIssue[0]?.issueNumber, null);
  assert.deepEqual(result.resolution.unresolvedIds, ['PUMUKI-018']);
  assert.equal(result.hasActionRequired, true);
});
