import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyBacklogIssueReferenceMapping,
  buildBacklogStatusSummary,
  collectBacklogIssueEntries,
  collectBacklogOperationalStatusEntries,
  reconcileBacklogMarkdown,
  runBacklogIssuesReconcile,
  syncBacklogSectionHeadingStatus,
  syncBacklogNextStepNarrative,
  syncBacklogStatusSummary,
  type BacklogIssueState,
} from '../reconcile-consumer-backlog-issues-lib';

const sampleMarkdown = `# Backlog

| Prioridad | ID | Estado | Issue | Nota |
|---|---|---|---|---|
| P0 | PUMUKI-001 | ⛔ | #100 | bloqueado histórico |
| P1 | PUMUKI-002 | ✅ | #101 | marcado como cerrado |
| P1 | PUMUKI-003 | 🚧 | #102 | en curso |
`;

const summaryMarkdown = `# Registro de Bugs y Mejoras de Pumuki

## Estado de este backlog
- ✅ Cerrados: 0
- 🚧 En construcción: 1 (\`PUMUKI-999\`)
- ⏳ Pendientes: 0
- ⛔ Bloqueados: 0

## Seguimiento operativo (Bugs)
| Orden | ID | Severidad | Prioridad | Estado | Referencia upstream | Versión objetivo | Nota |
|---|---|---|---|---|---|---|---|
| 1 | PUMUKI-001 | HIGH | P1 | ✅ | #100 | TBC | cerrado |
| 2 | PUMUKI-002 | HIGH | P1 | ⏳ | Pendiente | TBC | pendiente |

## Seguimiento operativo (Mejoras)
| Orden | ID | Severidad | Prioridad | Estado | Referencia upstream | Versión objetivo | Nota |
|---|---|---|---|---|---|---|---|
| 1 | PUMUKI-M001 | MEDIUM | P2 | 🚧 | Pendiente | TBC | en curso |
| 2 | PUMUKI-M002 | HIGH | P1 | ⛔ | #101 | TBC | bloqueado |
`;

const headingSyncMarkdown = `# Registro de Bugs y Mejoras de Pumuki

## Seguimiento operativo (Bugs)
| Orden | ID | Estado | Referencia upstream | Nota |
|---|---|---|---|---|
| 1 | PUMUKI-004 | ✅ | #700 | cerrado |
| 2 | PUMUKI-005 | ⏳ | #701 | pendiente |

### ⏳ PUMUKI-004
Detalle.

### ✅ PUMUKI-005
Detalle.
`;

const headingOnlyDriftMarkdown = `# Backlog
| ID | Estado | Referencia upstream |
|---|---|---|
| PUMUKI-010 | ✅ | Pendiente |

### ⏳ PUMUKI-010
Detalle.
`;

const closedNarrativeMarkdown = `# Registro de Bugs y Mejoras de Pumuki

## Estado de este backlog
- ✅ Cerrados: 0
- 🚧 En construcción: 1 (\`PUMUKI-002\`)
- ⏳ Pendientes: 1
- ⛔ Bloqueados: 0

## Seguimiento operativo (Bugs)
| Orden | ID | Severidad | Prioridad | Estado | Referencia upstream | Versión objetivo | Nota |
|---|---|---|---|---|---|---|---|
| 1 | PUMUKI-002 | MEDIUM | P1 | ✅ | #641 | TBC | cerrado |

## Próximo paso operativo (sin intervención manual en el seguimiento)
- Objetivo inmediato:
  - Avanzar PUMUKI-002.
- Entregables de ese paso:
  - Mantener trazabilidad.
- Regla de continuidad:
  - Excepción documentada.

## Formato obligatorio para bugs
- ID
`;

test('collectBacklogIssueEntries detecta filas con emoji de estado e issue', () => {
  const entries = collectBacklogIssueEntries(sampleMarkdown);
  assert.equal(entries.length, 3);
  assert.deepEqual(
    entries.map((entry) => [entry.lineNumber, entry.currentEmoji, entry.issueNumber]),
    [
      [5, '⛔', 100],
      [6, '✅', 101],
      [7, '🚧', 102],
    ]
  );
});

test('collectBacklogOperationalStatusEntries detecta IDs y estado en tablas de seguimiento', () => {
  const entries = collectBacklogOperationalStatusEntries(summaryMarkdown);
  assert.deepEqual(
    entries.map((entry) => `${entry.id}:${entry.status}`),
    ['PUMUKI-001:✅', 'PUMUKI-002:⏳', 'PUMUKI-M001:🚧', 'PUMUKI-M002:⛔']
  );
});

test('buildBacklogStatusSummary calcula conteos e IDs en progreso/bloqueados', () => {
  const summary = buildBacklogStatusSummary(summaryMarkdown);
  assert.equal(summary.closed, 1);
  assert.equal(summary.inProgress, 1);
  assert.equal(summary.pending, 1);
  assert.equal(summary.blocked, 1);
  assert.deepEqual(summary.inProgressIds, ['PUMUKI-M001']);
  assert.deepEqual(summary.blockedIds, ['PUMUKI-M002']);
});

test('syncBacklogStatusSummary reescribe estado de backlog con conteos reales', () => {
  const result = syncBacklogStatusSummary(summaryMarkdown);
  assert.equal(result.updated, true);
  assert.match(result.markdown, /- ✅ Cerrados: 1/);
  assert.match(result.markdown, /- 🚧 En construcción: 1 \(`PUMUKI-M001`\)/);
  assert.match(result.markdown, /- ⏳ Pendientes: 1/);
  assert.match(result.markdown, /- ⛔ Bloqueados: 1 \(`PUMUKI-M002`\)/);
});

test('syncBacklogSectionHeadingStatus alinea emoji de headings con estado efectivo por ID', () => {
  const result = syncBacklogSectionHeadingStatus(headingSyncMarkdown);
  assert.equal(result.updated, true);
  assert.equal(result.changes.length, 2);
  assert.match(result.markdown, /### ✅ PUMUKI-004/);
  assert.match(result.markdown, /### ⏳ PUMUKI-005/);
});

test('syncBacklogSectionHeadingStatus no cambia markdown sin headings compatibles', () => {
  const markdown = `## Seguimiento\n| ID | Estado | Issue |\n|---|---|---|\n| PUMUKI-010 | ✅ | #710 |\n`;
  const result = syncBacklogSectionHeadingStatus(markdown);
  assert.equal(result.updated, false);
  assert.equal(result.changes.length, 0);
  assert.equal(result.markdown, markdown);
});

test('syncBacklogNextStepNarrative actualiza narrativa cuando backlog queda 100% cerrado', () => {
  const summary = buildBacklogStatusSummary(closedNarrativeMarkdown);
  const result = syncBacklogNextStepNarrative({
    markdown: closedNarrativeMarkdown,
    summary,
  });
  assert.equal(result.updated, true);
  assert.match(result.markdown, /Backlog cerrado al 100%/);
  assert.match(result.markdown, /abrir issue upstream al primer incidente real/);
});

test('reconcileBacklogMarkdown corrige estados según OPEN/CLOSED', () => {
  const issueStates = new Map<number, BacklogIssueState>([
    [100, 'CLOSED'],
    [101, 'OPEN'],
    [102, 'OPEN'],
  ]);

  const result = reconcileBacklogMarkdown({
    markdown: sampleMarkdown,
    issueStates,
  });

  assert.deepEqual(
    result.changes.map((change) => [change.issueNumber, change.from, change.to, change.issueState]),
    [
      [100, '⛔', '✅', 'CLOSED'],
      [101, '✅', '⏳', 'OPEN'],
    ]
  );
  assert.match(result.updatedMarkdown, /\| P0 \| PUMUKI-001 \| ✅ \| #100 \|/);
  assert.match(result.updatedMarkdown, /\| P1 \| PUMUKI-002 \| ⏳ \| #101 \|/);
  assert.match(result.updatedMarkdown, /\| P1 \| PUMUKI-003 \| 🚧 \| #102 \|/);
  assert.equal(result.summaryUpdated, false);
  assert.equal(result.nextStepUpdated, false);
  assert.equal(result.headingUpdated, false);
  assert.equal(result.headingChanges.length, 0);
  assert.equal(result.summary.closed, 1);
  assert.equal(result.summary.inProgress, 1);
  assert.equal(result.summary.pending, 1);
  assert.equal(result.summary.blocked, 0);
});

test('runBacklogIssuesReconcile dry-run no escribe archivo', async () => {
  let written: string | undefined;
  const result = await runBacklogIssuesReconcile({
    filePath: '/tmp/backlog.md',
    apply: false,
    readFile: () => sampleMarkdown,
    writeFile: (_path, contents) => {
      written = contents;
    },
    resolveIssueState: (issueNumber) => {
      if (issueNumber === 100) {
        return 'CLOSED';
      }
      return 'OPEN';
    },
  });

  assert.equal(result.apply, false);
  assert.equal(result.updated, false);
  assert.equal(result.mappingSource, 'none');
  assert.equal(result.referenceChanges.length, 0);
  assert.deepEqual(result.referenceResolution.resolvedByProvidedMap, []);
  assert.deepEqual(result.referenceResolution.resolvedByLookup, []);
  assert.equal(result.changes.length, 2);
  assert.equal(result.summaryUpdated, false);
  assert.equal(result.nextStepUpdated, false);
  assert.equal(result.headingUpdated, false);
  assert.equal(result.headingChanges.length, 0);
  assert.equal(result.summary.closed, 1);
  assert.equal(written, undefined);
});

test('runBacklogIssuesReconcile apply escribe archivo cuando hay cambios', async () => {
  let written: string | undefined;
  const result = await runBacklogIssuesReconcile({
    filePath: '/tmp/backlog.md',
    apply: true,
    readFile: () => sampleMarkdown,
    writeFile: (_path, contents) => {
      written = contents;
    },
    resolveIssueState: (issueNumber) => {
      if (issueNumber === 100) {
        return 'CLOSED';
      }
      return 'OPEN';
    },
  });

  assert.equal(result.apply, true);
  assert.equal(result.updated, true);
  assert.equal(result.mappingSource, 'none');
  assert.equal(result.referenceChanges.length, 0);
  assert.deepEqual(result.referenceResolution.resolvedByProvidedMap, []);
  assert.deepEqual(result.referenceResolution.resolvedByLookup, []);
  assert.equal(result.changes.length, 2);
  assert.equal(result.summaryUpdated, false);
  assert.equal(result.nextStepUpdated, false);
  assert.equal(result.headingUpdated, false);
  assert.equal(result.headingChanges.length, 0);
  assert.equal(result.summary.pending, 1);
  assert.ok(typeof written === 'string');
  assert.match(written ?? '', /\| P0 \| PUMUKI-001 \| ✅ \| #100 \|/);
  assert.match(written ?? '', /\| P1 \| PUMUKI-002 \| ⏳ \| #101 \|/);
});

test('applyBacklogIssueReferenceMapping rellena issue en filas con referencia pendiente', () => {
  const markdown = `| Orden | ID | Estado | Referencia upstream | Nota |\n|---|---|---|---|---|\n| 1 | PUMUKI-009 | ⏳ | Pendiente | pendiente |\n`;
  const result = applyBacklogIssueReferenceMapping({
    markdown,
    idIssueMap: new Map([['PUMUKI-009', 624]]),
  });

  assert.equal(result.changes.length, 1);
  assert.match(result.updatedMarkdown, /\| 1 \| PUMUKI-009 \| ⏳ \| #624 \| pendiente \|/);
});

test('runBacklogIssuesReconcile aplica mapping y reconcilia estado para issue cerrada', async () => {
  const markdown = `| Orden | ID | Estado | Referencia upstream | Nota |\n|---|---|---|---|---|\n| 1 | PUMUKI-009 | ⏳ | Pendiente | pendiente |\n`;
  let written: string | undefined;
  const result = await runBacklogIssuesReconcile({
    filePath: '/tmp/backlog-map.md',
    apply: true,
    idIssueMap: new Map([['PUMUKI-009', 624]]),
    readFile: () => markdown,
    writeFile: (_path, contents) => {
      written = contents;
    },
    resolveIssueState: (issueNumber) => {
      if (issueNumber === 624) {
        return 'CLOSED';
      }
      return 'OPEN';
    },
  });

  assert.equal(result.referenceChanges.length, 1);
  assert.deepEqual(result.referenceResolution.resolvedByProvidedMap, ['PUMUKI-009']);
  assert.deepEqual(result.referenceResolution.resolvedByLookup, []);
  assert.deepEqual(result.referenceResolution.unresolvedReferenceIds, []);
  assert.equal(result.changes.length, 1);
  assert.equal(result.nextStepUpdated, false);
  assert.equal(result.updated, true);
  assert.match(written ?? '', /\| 1 \| PUMUKI-009 \| ✅ \| #624 \| pendiente \|/);
});

test('runBacklogIssuesReconcile resuelve referencia pendiente vía resolver por ID', async () => {
  const markdown = `| Orden | ID | Estado | Referencia upstream | Nota |\n|---|---|---|---|---|\n| 1 | PUMUKI-INC-200 | ⏳ | Pendiente | pendiente |\n`;
  const lookedUp: Array<[string, string | undefined]> = [];
  let written: string | undefined;

  const result = await runBacklogIssuesReconcile({
    filePath: '/tmp/backlog-resolver.md',
    repo: 'SwiftEnProfundidad/ast-intelligence-hooks',
    apply: true,
    readFile: () => markdown,
    writeFile: (_path, contents) => {
      written = contents;
    },
    resolveIssueNumberById: (id, repo) => {
      lookedUp.push([id, repo]);
      return id === 'PUMUKI-INC-200' ? 654 : null;
    },
    resolveIssueState: (issueNumber) => (issueNumber === 654 ? 'CLOSED' : 'OPEN'),
  });

  assert.deepEqual(lookedUp, [['PUMUKI-INC-200', 'SwiftEnProfundidad/ast-intelligence-hooks']]);
  assert.equal(result.referenceChanges.length, 1);
  assert.equal(result.referenceChanges[0]?.issueNumber, 654);
  assert.deepEqual(result.referenceResolution.resolvedByProvidedMap, []);
  assert.deepEqual(result.referenceResolution.resolvedByLookup, ['PUMUKI-INC-200']);
  assert.deepEqual(result.referenceResolution.unresolvedReferenceIds, []);
  assert.equal(result.changes.length, 1);
  assert.equal(result.issuesResolved, 1);
  assert.match(written ?? '', /\| 1 \| PUMUKI-INC-200 \| ✅ \| #654 \| pendiente \|/);
});

test('runBacklogIssuesReconcile prioriza idIssueMap y evita lookup redundante', async () => {
  const markdown = `| Orden | ID | Estado | Referencia upstream | Nota |\n|---|---|---|---|---|\n| 1 | PUMUKI-INC-201 | ⏳ | Pendiente | pendiente |\n`;
  const lookedUp: string[] = [];
  const result = await runBacklogIssuesReconcile({
    filePath: '/tmp/backlog-resolver-priority.md',
    apply: false,
    idIssueMap: new Map([['PUMUKI-INC-201', 700]]),
    readFile: () => markdown,
    resolveIssueNumberById: (id) => {
      lookedUp.push(id);
      return 701;
    },
    resolveIssueState: (issueNumber) => (issueNumber === 700 ? 'OPEN' : 'CLOSED'),
  });

  assert.deepEqual(lookedUp, []);
  assert.equal(result.referenceChanges.length, 1);
  assert.equal(result.referenceChanges[0]?.issueNumber, 700);
  assert.deepEqual(result.referenceResolution.resolvedByProvidedMap, ['PUMUKI-INC-201']);
  assert.deepEqual(result.referenceResolution.resolvedByLookup, []);
  assert.deepEqual(result.referenceResolution.unresolvedReferenceIds, []);
  assert.equal(result.issuesResolved, 1);
});

test('runBacklogIssuesReconcile mantiene unresolvedReferenceIds cuando no se puede resolver', async () => {
  const markdown = `| Orden | ID | Estado | Referencia upstream | Nota |\n|---|---|---|---|---|\n| 1 | AST-GAP-010 | ⏳ | Pendiente | pendiente |\n`;
  const result = await runBacklogIssuesReconcile({
    filePath: '/tmp/backlog-unresolved-reference.md',
    apply: false,
    readFile: () => markdown,
    resolveIssueNumberById: () => null,
    resolveIssueState: () => 'OPEN',
  });

  assert.deepEqual(result.referenceResolution.resolvedByProvidedMap, []);
  assert.deepEqual(result.referenceResolution.resolvedByLookup, []);
  assert.deepEqual(result.referenceResolution.unresolvedReferenceIds, ['AST-GAP-010']);
  assert.equal(result.referenceChanges.length, 0);
  assert.equal(result.issuesResolved, 0);
});

test('runBacklogIssuesReconcile apply escribe cuando el único delta es heading sync', async () => {
  let written: string | undefined;
  const result = await runBacklogIssuesReconcile({
    filePath: '/tmp/backlog-heading-only.md',
    apply: true,
    readFile: () => headingOnlyDriftMarkdown,
    writeFile: (_path, contents) => {
      written = contents;
    },
    resolveIssueState: () => 'OPEN',
  });

  assert.equal(result.referenceChanges.length, 0);
  assert.equal(result.changes.length, 0);
  assert.equal(result.summaryUpdated, false);
  assert.equal(result.nextStepUpdated, false);
  assert.equal(result.headingUpdated, true);
  assert.equal(result.headingChanges.length, 1);
  assert.equal(result.updated, true);
  assert.match(written ?? '', /### ✅ PUMUKI-010/);
});
