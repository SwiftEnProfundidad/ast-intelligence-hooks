import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectBacklogIssueEntries,
  reconcileBacklogMarkdown,
  runBacklogIssuesReconcile,
  type BacklogIssueState,
} from '../reconcile-consumer-backlog-issues-lib';

const sampleMarkdown = `# Backlog

| Prioridad | ID | Estado | Issue | Nota |
|---|---|---|---|---|
| P0 | PUMUKI-001 | ⛔ | #100 | bloqueado histórico |
| P1 | PUMUKI-002 | ✅ | #101 | marcado como cerrado |
| P1 | PUMUKI-003 | 🚧 | #102 | en curso |
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
  assert.equal(result.changes.length, 2);
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
  assert.equal(result.changes.length, 2);
  assert.ok(typeof written === 'string');
  assert.match(written ?? '', /\| P0 \| PUMUKI-001 \| ✅ \| #100 \|/);
  assert.match(written ?? '', /\| P1 \| PUMUKI-002 \| ⏳ \| #101 \|/);
});
