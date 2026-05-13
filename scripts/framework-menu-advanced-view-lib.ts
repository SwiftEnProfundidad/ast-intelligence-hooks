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
import {
  ADVANCED_MENU_HELP,
  compactAdvancedMenuHelp,
} from './framework-menu-advanced-view-help';
import { resolveAdvancedStatusBadge } from './framework-menu-advanced-view-status';
import { resolveAdvancedMenuLayout } from './framework-menu-layout-lib';
import {
  buildCliDesignTokens,
  renderActionRow,
  renderBadge,
} from './framework-menu-ui-components-lib';

export const formatAdvancedMenuView = (
  actions: ReadonlyArray<MenuAction>,
  options?: {
    evidenceSummary?: FrameworkMenuEvidenceSummary;
  }
): string => {
  const evidenceSummary = options?.evidenceSummary ?? readEvidenceSummaryForMenu(process.cwd());
  const tokens = buildCliDesignTokens();
  const statusBadge = resolveAdvancedStatusBadge(evidenceSummary, tokens);
  const groupedActions = resolveAdvancedMenuLayout(actions);
  const lines = [
    'Pumuki Framework Menu (Advanced)',
    `Status: ${statusBadge}`,
    'C. Switch to consumer menu',
    '',
    ...groupedActions.flatMap((group, groupIndex) => [
      `${groupIndex + 1}) ${group.title}`,
      ...group.items.map((item) => {
        return renderActionRow({
          id: item.id,
          label: item.action.label,
          hint: compactAdvancedMenuHelp(item.id),
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
