import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAdapterRealSessionEvaluationMessages } from '../adapter-real-session-analysis-messages-lib';
import type { AdapterRealSessionReportParams } from '../adapter-real-session-contract';
import type { AdapterRealSessionSignals } from '../adapter-real-session-analysis-signals-lib';

const makeReport = (
  overrides: Partial<AdapterRealSessionReportParams['parsedStatus']> = {}
): AdapterRealSessionReportParams => ({
  options: {
    outFile: '.audit-reports/adapter/adapter-real-session-report.md',
    statusReportFile: '.audit-reports/adapter/adapter-session-status.md',
    operator: 'qa',
    adapterVersion: '1.0.0',
    tailLines: 50,
  },
  nowIso: '2026-03-13T10:00:00.000Z',
  branch: 'refactor/pumuki-reset-core-policy',
  repository: 'git@github.com:org/pumuki.git',
  nodeRuntime: 'v22.0.0',
  hookConfigPath: '~/.codeium/adapter/hooks.json',
  statusReportPath: '.audit-reports/adapter/adapter-session-status.md',
  parsedStatus: {
    verdict: 'BLOCKED',
    verifyExitCode: undefined,
    strictExitCode: undefined,
    anyExitCode: undefined,
    verifyAvailable: false,
    strictAvailable: false,
    anyAvailable: false,
    strictAssessmentPass: false,
    anyAssessmentPass: false,
    ...overrides,
  },
  runtimeLogTail: '',
  smokeLogTail: '',
  hookLogPath: '.audit_tmp/cascade-hook.log',
  hookLogTail: '',
  writesLogPath: '.audit_tmp/cascade-writes.log',
  writesLogTail: '',
  hasRuntimeLog: false,
  hasSmokeLog: false,
  hasHookLog: false,
  hasWritesLog: false,
  hookConfigExists: true,
});

const makeSignals = (
  overrides: Partial<AdapterRealSessionSignals> = {}
): AdapterRealSessionSignals => ({
  preWriteObserved: false,
  postWriteObserved: false,
  nodeCommandMissing: false,
  ...overrides,
});

test('prioritizes missing session probes over missing write events', () => {
  const messages = buildAdapterRealSessionEvaluationMessages({
    validationPass: false,
    report: makeReport(),
    signals: makeSignals(),
  });

  assert.match(
    messages.summary,
    /does not expose direct session assessment probes for adapter diagnostics/i
  );
  assert.match(
    messages.rootCause,
    /No strict or include-simulated session probe is available/i
  );
  assert.match(
    messages.correctiveAction,
    /partial evidence only, or run adapter diagnostics from the Pumuki source workspace/i
  );
});

test('keeps missing write events ahead of strict assessment messaging when probes exist', () => {
  const messages = buildAdapterRealSessionEvaluationMessages({
    validationPass: false,
    report: makeReport({
      strictAvailable: true,
      anyAvailable: true,
    }),
    signals: makeSignals(),
  });

  assert.match(messages.summary, /Real pre\/post write events were not fully observed/i);
  assert.match(messages.rootCause, /Incomplete real IDE event coverage/i);
});
