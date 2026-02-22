import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { createFrameworkMenuActions, type MenuAction } from './framework-menu-actions';
import { formatAdvancedMenuView } from './framework-menu-advanced-view-lib';
import { createConsumerMenuRuntime } from './framework-menu-consumer-runtime-lib';
import {
  runRangeGate,
  runRepoAndStagedGate,
  runRepoAndStagedGateSilent,
  runRepoGateSilent,
  runStagedGateSilent,
  runWorkingTreeGateSilent,
  runRepoAndStagedPrePushGateSilent,
  runWorkingTreePrePushGateSilent,
} from './framework-menu-gate-lib';
import { createFrameworkMenuPrompts } from './framework-menu-prompts';
import { resolveDefaultRangeFrom } from './framework-menu-runners';
import {
  formatActiveSkillsBundles,
  loadAndFormatActiveSkillsBundles,
} from './framework-menu-skills-lib';
export * from './framework-menu-builders';
export { formatAdvancedMenuView } from './framework-menu-advanced-view-lib';
export { buildMenuGateParams } from './framework-menu-gate-lib';
export { formatActiveSkillsBundles } from './framework-menu-skills-lib';
type MenuMode = 'consumer' | 'advanced';

const printActiveSkillsBundles = (): void => {
  const rendered = loadAndFormatActiveSkillsBundles(process.cwd());
  output.write(`\n${rendered}\n`);
};

const resolveInitialMenuMode = (): MenuMode => {
  if (process.env.PUMUKI_MENU_MODE === 'advanced') {
    return 'advanced';
  }
  return 'consumer';
};

const printAdvancedMenu = (actions: ReadonlyArray<MenuAction>): void => {
  output.write(`\n${formatAdvancedMenuView(actions)}\n`);
};

const menu = async (): Promise<void> => {
  const rl = createInterface({ input, output });

  try {
    let mode: MenuMode = resolveInitialMenuMode();
    const prompts = createFrameworkMenuPrompts(rl);
    const advancedActions: ReadonlyArray<MenuAction> = createFrameworkMenuActions({
      prompts,
      runStaged: runStagedGate,
      runRange: runRangeGate,
      runRepoAudit: runRepoGateSilent,
      runRepoAndStagedAudit: runRepoAndStagedGateSilent,
      runStagedAndUnstagedAudit: runWorkingTreeGateSilent,
      resolveDefaultRangeFrom,
      printActiveSkillsBundles,
    });
    const consumerRuntime = createConsumerMenuRuntime({
      runRepoGate: runRepoGateSilent,
      runRepoAndStagedGate: runRepoAndStagedPrePushGateSilent,
      runStagedGate: runStagedGateSilent,
      runWorkingTreeGate: runWorkingTreePrePushGateSilent,
      write: (text) => {
        output.write(text);
      },
    });

    while (true) {
      if (mode === 'consumer') {
        consumerRuntime.printMenu();
      } else {
        printAdvancedMenu(advancedActions);
      }
      const option = (await rl.question('\nSelect option: ')).trim();
      const normalized = option.toUpperCase();

      if (mode === 'consumer' && normalized === 'A') {
        mode = 'advanced';
        continue;
      }

      if (mode === 'advanced' && normalized === 'C') {
        mode = 'consumer';
        continue;
      }

      if (mode === 'consumer') {
        const selectedConsumer = consumerRuntime.actions.find((action) => action.id === option);
        if (!selectedConsumer) {
          output.write('Invalid option.\n');
          continue;
        }
        if (selectedConsumer.id === '10') {
          break;
        }
        try {
          await selectedConsumer.execute();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unexpected menu execution error.';
          output.write(`Error: ${message}\n`);
        }
      } else {
        const selectedAdvanced = advancedActions.find((action) => action.id === option);
        if (!selectedAdvanced) {
          output.write('Invalid option.\n');
          continue;
        }
        if (selectedAdvanced.id === '27') {
          break;
        }
        try {
          await selectedAdvanced.execute();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unexpected menu execution error.';
          output.write(`Error: ${message}\n`);
        }
      }
    }
  } finally {
    rl.close();
  }
};

export const runFrameworkMenu = async (): Promise<void> => {
  await menu();
};
