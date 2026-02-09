import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { createFrameworkMenuActions, type MenuAction } from './framework-menu-actions';
import { runRangeGate, runStagedGate } from './framework-menu-gate-lib';
import { createFrameworkMenuPrompts } from './framework-menu-prompts';
import { resolveDefaultRangeFrom } from './framework-menu-runners';
import {
  formatActiveSkillsBundles,
  loadAndFormatActiveSkillsBundles,
} from './framework-menu-skills-lib';

export * from './framework-menu-builders';
export { buildMenuGateParams } from './framework-menu-gate-lib';
export { formatActiveSkillsBundles } from './framework-menu-skills-lib';

const printActiveSkillsBundles = (): void => {
  const rendered = loadAndFormatActiveSkillsBundles(process.cwd());
  output.write(`\n${rendered}\n`);
};

const menu = async (): Promise<void> => {
  const rl = createInterface({ input, output });

  try {
    const prompts = createFrameworkMenuPrompts(rl);
    const actions: ReadonlyArray<MenuAction> = createFrameworkMenuActions({
      prompts,
      runStaged: runStagedGate,
      runRange: runRangeGate,
      resolveDefaultRangeFrom,
      printActiveSkillsBundles,
    });

    while (true) {
      output.write('\nPumuki Framework Menu\n');
      for (const action of actions) {
        output.write(`${action.id}. ${action.label}\n`);
      }

      const option = (await rl.question('\nSelect option: ')).trim();
      const selected = actions.find((action) => action.id === option);

      if (!selected) {
        output.write('Invalid option.\n');
        continue;
      }

      if (selected.id === '27') {
        break;
      }

      try {
        await selected.execute();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unexpected menu execution error.';
        output.write(`Error: ${message}\n`);
      }
    }
  } finally {
    rl.close();
  }
};

export const runFrameworkMenu = async (): Promise<void> => {
  await menu();
};
