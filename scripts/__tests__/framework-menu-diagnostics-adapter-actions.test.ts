import assert from 'node:assert/strict';
import test from 'node:test';
import type { FrameworkMenuActionContext } from '../framework-menu-action-contract';
import { createFrameworkMenuDiagnosticsAdapterActions } from '../framework-menu-actions-diagnostics-adapter-lib';
import { runAdapterRealSessionReport } from '../framework-menu-runners-adapter-real-session-lib';
import { runAdapterSessionStatusReport } from '../framework-menu-runners-adapter-session-lib';

const createMenuContext = (): FrameworkMenuActionContext => {
  return {
    prompts: {} as FrameworkMenuActionContext['prompts'],
    runStaged: async () => {},
    runRange: async () => {},
    runRepoAudit: async () => {},
    runRepoAndStagedAudit: async () => {},
    runStagedAndUnstagedAudit: async () => {},
    resolveDefaultRangeFrom: () => 'origin/main',
    printActiveSkillsBundles: () => {},
  };
};

test('adapter session report action routes verdict through runAndPrintExitCode', async () => {
  let receivedCode: number | undefined;
  let receivedParams: { outFile: string } | undefined;
  const actions = createFrameworkMenuDiagnosticsAdapterActions(
    {
      ...createMenuContext(),
      prompts: {
        askAdapterSessionStatusReport: async () => ({ outFile: 'session.md' }),
      } as FrameworkMenuActionContext['prompts'],
    },
    {
      runAdapterSessionStatusReport: async (params) => {
        receivedParams = params;
        return 1;
      },
      runAdapterRealSessionReport,
      runAndPrintExitCode: async (run) => {
        receivedCode = await run();
      },
    }
  );

  const action = actions.find((candidate) => candidate.id === '9');
  assert.ok(action);
  await action.execute();

  assert.deepEqual(receivedParams, { outFile: 'session.md' });
  assert.equal(receivedCode, 1);
});

test('adapter real-session report action routes verdict through runAndPrintExitCode', async () => {
  let receivedCode: number | undefined;
  let receivedParams: { statusReportFile: string; outFile: string } | undefined;
  const actions = createFrameworkMenuDiagnosticsAdapterActions(
    {
      ...createMenuContext(),
      prompts: {
        askAdapterRealSessionReport: async () => ({
          statusReportFile: 'status.md',
          outFile: 'real.md',
        }),
      } as FrameworkMenuActionContext['prompts'],
    },
    {
      runAdapterSessionStatusReport,
      runAdapterRealSessionReport: async (params) => {
        receivedParams = params;
        return 2;
      },
      runAndPrintExitCode: async (run) => {
        receivedCode = await run();
      },
    }
  );

  const action = actions.find((candidate) => candidate.id === '16');
  assert.ok(action);
  await action.execute();

  assert.deepEqual(receivedParams, {
    statusReportFile: 'status.md',
    outFile: 'real.md',
  });
  assert.equal(receivedCode, 2);
});
