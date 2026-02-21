import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { createFrameworkMenuActions, type MenuAction } from './framework-menu-actions';
import { createConsumerMenuRuntime } from './framework-menu-consumer-runtime-lib';
import {
  formatEvidenceSummaryForMenu,
  readEvidenceSummaryForMenu,
} from './framework-menu-evidence-summary-lib';
import {
  runRangeGate,
  runRepoAndStagedGate,
  runRepoAndStagedPrePushGateSilent,
  runRepoAndStagedGateSilent,
  runRepoGate,
  runRepoGateSilent,
  runStagedGate,
  runStagedGateSilent,
  runWorkingTreeGate,
  runWorkingTreeGateSilent,
  runWorkingTreePrePushGateSilent,
} from './framework-menu-gate-lib';
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

const ADVANCED_MENU_HELP: Readonly<Record<string, string>> = {
  '1': 'Evalua solo los cambios staged (PRE_COMMIT).',
  '2': 'Evalua upstream..HEAD (PRE_PUSH).',
  '3': 'Evalua baseRef..HEAD (CI).',
  '28': 'Audita snapshot completo del repo (HEAD) con policy PRE_COMMIT.',
  '29': 'Audita snapshot indexado (repo + staged) con policy PRE_COMMIT.',
  '30': 'Audita cambios staged + unstaged del working tree con policy PRE_COMMIT.',
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
  '17': 'Verifica freshness de skills lock.',
  '18': 'Configura hard mode/enforcement enterprise.',
  '31': 'Configura notificaciones del sistema (macOS) para eventos criticos.',
  '32': 'Diagnóstico de cobertura de reglas evaluadas por stage (repo completo).',
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

const printAdvancedMenu = (actions: ReadonlyArray<MenuAction>): void => {
  const evidenceSummary = readEvidenceSummaryForMenu(process.cwd());
  output.write(`\n${formatEvidenceSummaryForMenu(evidenceSummary)}\n`);
  output.write('\nPumuki Framework Menu (Advanced)\n');
  output.write('C. Switch to consumer menu\n');

  for (const action of actions) {
    const help = ADVANCED_MENU_HELP[action.id];
    const suffix = help ? ` - ${help}` : '';
    output.write(`${action.id}. ${action.label}${suffix}\n`);
  }
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
