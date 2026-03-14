import assert from 'node:assert/strict';
import test from 'node:test';
import { runAdapterRealSessionReport } from '../framework-menu-runners-adapter-real-session-lib';
import { runAdapterSessionStatusReport } from '../framework-menu-runners-adapter-session-lib';

test('adapter session status runner returns command exit code instead of throwing', async () => {
  const code = await runAdapterSessionStatusReport(
    { outFile: 'session.md' },
    {
      resolveScriptOrReportMissing: () => '/tmp/build-adapter-session-status.ts',
      runNpx: () => {
        throw { status: 7 };
      },
      getExitCode: (error) => Number((error as { status?: number }).status ?? 1),
    }
  );

  assert.equal(code, 7);
});

test('adapter real-session runner returns command exit code instead of throwing', async () => {
  const code = await runAdapterRealSessionReport(
    {
      statusReportFile: 'status.md',
      outFile: 'real.md',
    },
    {
      resolveScriptOrReportMissing: () => '/tmp/build-adapter-real-session-report.ts',
      runNpx: () => {
        throw { status: 9 };
      },
      getExitCode: (error) => Number((error as { status?: number }).status ?? 1),
    }
  );

  assert.equal(code, 9);
});

test('adapter session status runner degrades cleanly when script is unavailable', async () => {
  const code = await runAdapterSessionStatusReport(
    { outFile: 'session.md' },
    {
      resolveScriptOrReportMissing: () => undefined,
      runNpx: () => {
        throw new Error('should not run');
      },
      getExitCode: () => 1,
    }
  );

  assert.equal(code, 0);
});
