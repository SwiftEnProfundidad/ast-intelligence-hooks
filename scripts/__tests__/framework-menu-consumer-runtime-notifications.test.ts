import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createConsumerMenuRuntime } from '../framework-menu-consumer-runtime-lib';
import type { PumukiCriticalNotificationEvent } from '../framework-menu-system-notifications-lib';

test('consumer runtime emite notificación audit summary tras opción 1', { concurrency: false }, async () => {
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-notify-'));
  process.chdir(temp);
  try {
    const events: PumukiCriticalNotificationEvent[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {
        writeFileSync(
          join(temp, '.ai_evidence.json'),
          JSON.stringify(
            {
              snapshot: {
                stage: 'PRE_COMMIT',
                outcome: 'BLOCK',
                files_scanned: 8,
                files_affected: 3,
                findings: [
                  { ruleId: 'backend.solid.srp.class-too-many-responsibilities', severity: 'CRITICAL', filePath: 'src/a.ts' },
                  { ruleId: 'backend.solid.ocp.closed-for-modification', severity: 'ERROR', filePath: 'src/b.ts' },
                  { ruleId: 'backend.clean.layers.boundary', severity: 'WARN', filePath: 'src/c.ts' },
                ],
              },
              severity_metrics: { by_severity: { CRITICAL: 1, ERROR: 1, WARN: 1, INFO: 0 } },
            },
            null,
            2
          )
        );
      },
      runRepoAndStagedGate: async () => {},
      runStagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runPreflight: async () => {},
      emitSystemNotification: ({ event }) => {
        events.push(event);
        return { delivered: false, reason: 'disabled' };
      },
      write: () => {},
    });

    const action = runtime.actions.find((item) => item.id === '1');
    assert.ok(action, 'Expected consumer action id=1');
    await action.execute();

    assert.equal(events.length, 1);
    assert.equal(events[0]?.kind, 'audit.summary');
    if (events[0]?.kind !== 'audit.summary') {
      assert.fail('Expected audit.summary notification event');
    }
    assert.equal(events[0].totalViolations, 3);
    assert.equal(events[0].criticalViolations, 1);
    assert.equal(events[0].highViolations, 1);
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime emite notificación audit summary tras opción 2', { concurrency: false }, async () => {
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-notify-opt2-'));
  process.chdir(temp);
  try {
    const events: PumukiCriticalNotificationEvent[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => {
        writeFileSync(
          join(temp, '.ai_evidence.json'),
          JSON.stringify(
            {
              snapshot: {
                stage: 'PRE_PUSH',
                outcome: 'BLOCK',
                files_scanned: 5,
                files_affected: 2,
                findings: [
                  { ruleId: 'backend.solid.srp.class-too-many-responsibilities', severity: 'CRITICAL', filePath: 'src/a.ts' },
                  { ruleId: 'backend.clean.layers.boundary', severity: 'WARN', filePath: 'src/c.ts' },
                ],
              },
              severity_metrics: { by_severity: { CRITICAL: 1, ERROR: 0, WARN: 1, INFO: 0 } },
            },
            null,
            2
          )
        );
      },
      runStagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runPreflight: async () => {},
      emitSystemNotification: ({ event }) => {
        events.push(event);
        return { delivered: false, reason: 'disabled' };
      },
      write: () => {},
    });

    const action = runtime.actions.find((item) => item.id === '2');
    assert.ok(action, 'Expected consumer action id=2');
    await action.execute();

    assert.equal(events.length, 1);
    assert.equal(events[0]?.kind, 'audit.summary');
    if (events[0]?.kind !== 'audit.summary') {
      assert.fail('Expected audit.summary notification event');
    }
    assert.equal(events[0].totalViolations, 2);
    assert.equal(events[0].criticalViolations, 1);
    assert.equal(events[0].highViolations, 0);
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime emite notificación audit summary tras opción 3', { concurrency: false }, async () => {
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-notify-opt3-'));
  process.chdir(temp);
  try {
    const events: PumukiCriticalNotificationEvent[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => {},
      runStagedGate: async () => {
        writeFileSync(
          join(temp, '.ai_evidence.json'),
          JSON.stringify(
            {
              snapshot: {
                stage: 'PRE_COMMIT',
                outcome: 'WARN',
                files_scanned: 3,
                files_affected: 1,
                findings: [{ ruleId: 'backend.clean.layers.boundary', severity: 'WARN', filePath: 'src/c.ts' }],
              },
              severity_metrics: { by_severity: { CRITICAL: 0, ERROR: 0, WARN: 1, INFO: 0 } },
            },
            null,
            2
          )
        );
      },
      runWorkingTreeGate: async () => {},
      runPreflight: async () => {},
      emitSystemNotification: ({ event }) => {
        events.push(event);
        return { delivered: false, reason: 'disabled' };
      },
      write: () => {},
    });

    const action = runtime.actions.find((item) => item.id === '3');
    assert.ok(action, 'Expected consumer action id=3');
    await action.execute();

    assert.equal(events.length, 1);
    assert.equal(events[0]?.kind, 'audit.summary');
    if (events[0]?.kind !== 'audit.summary') {
      assert.fail('Expected audit.summary notification event');
    }
    assert.equal(events[0].totalViolations, 1);
    assert.equal(events[0].criticalViolations, 0);
    assert.equal(events[0].highViolations, 0);
  } finally {
    process.chdir(previous);
  }
});

test('consumer runtime emite notificación audit summary tras opción 4', { concurrency: false }, async () => {
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-notify-opt4-'));
  process.chdir(temp);
  try {
    const events: PumukiCriticalNotificationEvent[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => {},
      runStagedGate: async () => {},
      runWorkingTreeGate: async () => {
        writeFileSync(
          join(temp, '.ai_evidence.json'),
          JSON.stringify(
            {
              snapshot: {
                stage: 'PRE_PUSH',
                outcome: 'BLOCK',
                files_scanned: 9,
                files_affected: 2,
                findings: [
                  { ruleId: 'backend.solid.ocp.closed-for-modification', severity: 'ERROR', filePath: 'src/b.ts' },
                  { ruleId: 'backend.solid.ocp.closed-for-modification', severity: 'ERROR', filePath: 'src/b.ts' },
                ],
              },
              severity_metrics: { by_severity: { CRITICAL: 0, ERROR: 2, WARN: 0, INFO: 0 } },
            },
            null,
            2
          )
        );
      },
      runPreflight: async () => {},
      emitSystemNotification: ({ event }) => {
        events.push(event);
        return { delivered: false, reason: 'disabled' };
      },
      write: () => {},
    });

    const action = runtime.actions.find((item) => item.id === '4');
    assert.ok(action, 'Expected consumer action id=4');
    await action.execute();

    assert.equal(events.length, 1);
    assert.equal(events[0]?.kind, 'audit.summary');
    if (events[0]?.kind !== 'audit.summary') {
      assert.fail('Expected audit.summary notification event');
    }
    assert.equal(events[0].totalViolations, 2);
    assert.equal(events[0].criticalViolations, 0);
    assert.equal(events[0].highViolations, 2);
  } finally {
    process.chdir(previous);
  }
});
