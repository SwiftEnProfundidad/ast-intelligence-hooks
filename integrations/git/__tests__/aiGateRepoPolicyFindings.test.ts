import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import {
  appendTrackingActionableContext,
  collectTrackingActiveEntriesFromMarkdown,
  toRepoPolicyFinding,
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

test('collectTrackingActiveEntriesFromMarkdown detecta filas activas del hub canonico de RuralGo', () => {
  const markdown = [
    '| Estado | Task ID | Foco | Definition of done |',
    '| --- | --- | --- | --- |',
    '| 🚧 | RGO-1900-01 | Buyer core | pendiente |',
    '| ✅ | RGO-1890-02 | previo | listo |',
    '| 🚧 | RGO-1900-02 | Duplicate active | pendiente |',
  ].join('\n');

  assert.deepEqual(collectTrackingActiveEntriesFromMarkdown(markdown), [
    { taskId: 'RGO-1900-01', lineNumber: 3 },
    { taskId: 'RGO-1900-02', lineNumber: 5 },
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

test('appendTrackingActionableContext prioriza docs/RURALGO_SEGUIMIENTO.md cuando existe', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-hotfix-ruralgo-hub-'));
  const boardPath = join(repoRoot, 'docs', 'RURALGO_SEGUIMIENTO.md');
  mkdirSync(join(repoRoot, 'docs'), { recursive: true });
  writeFileSync(
    boardPath,
    [
      '# Hub',
      '',
      '| Estado | Task ID | Foco | Definition of done |',
      '| --- | --- | --- | --- |',
      '| 🚧 | RGO-1900-01 | Buyer core | pendiente |',
      '| 🚧 | RGO-1900-02 | Duplicate active | pendiente |',
    ].join('\n'),
    'utf8'
  );

  const message = appendTrackingActionableContext({
    repoRoot,
    message: 'Canonical tracking file has 2 in-progress tasks; expected exactly 1.',
  });

  assert.match(message, /active_entries=RGO-1900-01@L5, RGO-1900-02@L6/i);
  assert.match(message, /tracking_source=docs\/RURALGO_SEGUIMIENTO\.md/i);
});

test('toRepoPolicyFinding deja EVIDENCE_PREWRITE_WORKTREE_WARN como advisory no bloqueante', () => {
  const worktreeWarn = toRepoPolicyFinding({
    code: 'EVIDENCE_PREWRITE_WORKTREE_WARN',
    severity: 'WARN',
    message:
      'PRE_WRITE worktree hygiene warning: pending_changes=20 (warn_threshold=12). Consider smaller staged/unstaged batches.',
  });
  const worktreeOverLimit = toRepoPolicyFinding({
    code: 'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT',
    severity: 'ERROR',
    message:
      'PRE_WRITE worktree hygiene exceeded: pending_changes=25 (block_threshold=24). Split worktree into atomic slices.',
  });

  assert.equal(worktreeWarn.severity, 'WARN');
  assert.equal(worktreeWarn.blocking, false);
  assert.equal(worktreeOverLimit.severity, 'ERROR');
  assert.equal(worktreeOverLimit.blocking, undefined);
});
