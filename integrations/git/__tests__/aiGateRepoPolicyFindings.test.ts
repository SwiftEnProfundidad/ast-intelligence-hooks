import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import {
  appendTrackingActionableContext,
  collectTrackingActiveEntriesFromMarkdown,
} from '../aiGateRepoPolicyFindings';

test('collectTrackingActiveEntriesFromMarkdown detecta filas activas de backlog tabular', () => {
  const markdown = [
    '| 3 | `PUMUKI-INC-081` | High | 🚧 reported activo | contexto |',
    '| 5 | `PUMUKI-INC-083` | High | 🚧 reported activo | contexto |',
  ].join('\n');

  assert.deepEqual(collectTrackingActiveEntriesFromMarkdown(markdown), [
    { taskId: 'PUMUKI-INC-081', lineNumber: 1 },
    { taskId: 'PUMUKI-INC-083', lineNumber: 2 },
  ]);
});

test('appendTrackingActionableContext añade entradas activas y fuente del board consumidor', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-hotfix-inc-081-083-'));
  const boardPath = join(
    repoRoot,
    'docs',
    'technical',
    '08-validation',
    'refactor',
    'pumuki-integration-feedback.md'
  );
  mkdirSync(join(repoRoot, 'docs', 'technical', '08-validation', 'refactor'), {
    recursive: true,
  });
  writeFileSync(
    boardPath,
    [
      '# Tracking',
      '',
      '| 3 | `PUMUKI-INC-081` | High | 🚧 reported activo | contexto |',
      '| 5 | `PUMUKI-INC-083` | High | 🚧 reported activo | contexto |',
    ].join('\n'),
    'utf8'
  );

  const message = appendTrackingActionableContext({
    repoRoot,
    message: 'Canonical tracking file has 2 in-progress tasks; expected exactly 1.',
  });

  assert.match(message, /active_entries=PUMUKI-INC-081@L3, PUMUKI-INC-083@L4/i);
  assert.match(message, /tracking_source=docs\/technical\/08-validation\/refactor\/pumuki-integration-feedback\.md/i);
});
