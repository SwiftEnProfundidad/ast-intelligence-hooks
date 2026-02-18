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

type MenuMode = 'consumer' | 'advanced';

const CONSUMER_ACTION_IDS = new Set(['1', '2', '3', '7', '8', '27']);

const MENU_HELP: Readonly<Record<string, string>> = {
  '1': 'Evalua solo los cambios staged (PRE_COMMIT).',
  '2': 'Evalua upstream..HEAD (PRE_PUSH).',
  '3': 'Evalua baseRef..HEAD (CI).',
  '4': 'Ejecuta gate de iOS en modo CI.',
  '5': 'Ejecuta gate de backend en modo CI.',
  '6': 'Ejecuta gate de frontend en modo CI.',
  '7': 'Muestra bundles activos de skills con version y hash.',
  '8': 'Lee el .ai_evidence.json actual.',
  '9': 'Genera reporte de estado de sesion del adapter.',
  '10': 'Recolecta artefactos CI del consumidor.',
  '11': 'Genera reporte de auth/check de CI del consumidor.',
  '12': 'Ejecuta lint de workflows del consumidor.',
  '13': 'Genera support bundle de startup-failure.',
  '14': 'Genera borrador de ticket de soporte.',
  '15': 'Genera reporte de startup-unblock status.',
  '16': 'Genera reporte real-session del adapter.',
  '17': 'Ejecuta docs hygiene check.',
  '18': 'Verifica freshness de skills lock.',
  '19': 'Ejecuta startup triage bundle del consumidor.',
  '20': 'Genera reporte A/B del mock consumer.',
  '21': 'Genera reporte de blockers readiness (phase5).',
  '22': 'Genera adapter readiness report.',
  '23': 'Genera execution closure status (phase5).',
  '24': 'Ejecuta cierre phase5 one-shot.',
  '25': 'Genera external handoff report (phase5).',
  '26': 'Limpia artefactos locales de validacion.',
  '27': 'Salir.',
};

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

const filterVisibleActions = (
  actions: ReadonlyArray<MenuAction>,
  mode: MenuMode
): ReadonlyArray<MenuAction> => {
  if (mode === 'advanced') {
    return actions;
  }
  return actions.filter((action) => CONSUMER_ACTION_IDS.has(action.id));
};

const printMenu = (actions: ReadonlyArray<MenuAction>, mode: MenuMode): void => {
  const title = mode === 'advanced' ? 'Pumuki Framework Menu (Advanced)' : 'Pumuki Framework Menu (Consumer)';
  output.write(`\n${title}\n`);
  if (mode === 'consumer') {
    output.write('A. Switch to advanced menu\n');
  } else {
    output.write('C. Switch to consumer menu\n');
  }

  for (const action of actions) {
    const help = MENU_HELP[action.id];
    const suffix = help ? ` - ${help}` : '';
    output.write(`${action.id}. ${action.label}${suffix}\n`);
  }
};

const menu = async (): Promise<void> => {
  const rl = createInterface({ input, output });

  try {
    let mode: MenuMode = resolveInitialMenuMode();
    const prompts = createFrameworkMenuPrompts(rl);
    const actions: ReadonlyArray<MenuAction> = createFrameworkMenuActions({
      prompts,
      runStaged: runStagedGate,
      runRange: runRangeGate,
      resolveDefaultRangeFrom,
      printActiveSkillsBundles,
    });

    while (true) {
      const visibleActions = filterVisibleActions(actions, mode);
      printMenu(visibleActions, mode);
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

      const selected = visibleActions.find((action) => action.id === option);

      if (!selected) {
        if (mode === 'consumer' && actions.some((action) => action.id === option)) {
          output.write('Option available in advanced menu. Select A to switch.\n');
          continue;
        }
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
