import type { MenuAction } from './framework-menu-action-contract';
import {
  formatEvidenceSummaryForMenu,
  type FrameworkMenuEvidenceSummary,
  readEvidenceSummaryForMenu,
} from './framework-menu-evidence-summary-lib';
import {
  renderLegacyPanel,
  resolveLegacyPanelOuterWidth,
} from './framework-menu-legacy-audit-lib';
import { resolveAdvancedMenuLayout } from './framework-menu-layout-lib';
import {
  buildCliDesignTokens,
  renderActionRow,
  renderBadge,
} from './framework-menu-ui-components-lib';

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

export const formatAdvancedMenuView = (
  actions: ReadonlyArray<MenuAction>,
  options?: {
    evidenceSummary?: FrameworkMenuEvidenceSummary;
  }
): string => {
  const evidenceSummary = options?.evidenceSummary ?? readEvidenceSummaryForMenu(process.cwd());
  const tokens = buildCliDesignTokens();
  const statusBadge = renderBadge(
    evidenceSummary.status === 'missing'
      ? 'WARN'
      : evidenceSummary.status === 'invalid'
        ? 'BLOCK'
        : 'PASS',
    evidenceSummary.status === 'missing'
      ? 'warn'
      : evidenceSummary.status === 'invalid'
        ? 'block'
        : 'ok',
    tokens
  );
  const groupedActions = resolveAdvancedMenuLayout(actions);
  const lines = [
    'Pumuki Framework Menu (Advanced)',
    `Status: ${statusBadge}`,
    'C. Switch to consumer menu',
    '',
    ...groupedActions.flatMap((group, groupIndex) => [
      `${groupIndex + 1}) ${group.title}`,
      ...group.items.map((item) => {
        const help = ADVANCED_MENU_HELP[item.id] ?? '';
        const compactHelp = help.split('.').at(0) ?? '';
        return renderActionRow({
          id: item.id,
          label: item.action.label,
          hint: compactHelp,
        });
      }),
      '',
    ]),
  ];
  return [
    formatEvidenceSummaryForMenu(evidenceSummary),
    renderLegacyPanel(lines, {
      width: resolveLegacyPanelOuterWidth(),
      color: tokens.colorEnabled,
    }),
  ].join('\n\n');
};

export const formatAdvancedMenuClassicView = (
  actions: ReadonlyArray<MenuAction>,
  options?: {
    evidenceSummary?: FrameworkMenuEvidenceSummary;
  }
): string => {
  const evidenceSummary = options?.evidenceSummary ?? readEvidenceSummaryForMenu(process.cwd());
  const lines = [
    'Pumuki Framework Menu (Advanced)',
    'C. Switch to consumer menu',
    ...actions.map((action) => {
      const help = ADVANCED_MENU_HELP[action.id];
      const suffix = help ? ` - ${help}` : '';
      return `${action.id}. ${action.label}${suffix}`;
    }),
  ];
  return [
    formatEvidenceSummaryForMenu(evidenceSummary),
    lines.join('\n'),
  ].join('\n\n');
};
