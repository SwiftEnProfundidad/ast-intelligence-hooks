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
import {
  buildGovernanceConsoleSummaryLines,
  type GovernanceConsoleSnapshot,
} from '../integrations/lifecycle/cliGovernanceConsole';
import type { ConsumerPreflightResult } from './framework-menu-consumer-preflight-types';

export const formatAdvancedMenuView = (
  actions: ReadonlyArray<MenuAction>,
  options?: {
    evidenceSummary?: FrameworkMenuEvidenceSummary;
    preflight?: ConsumerPreflightResult | null;
    governanceConsole?: GovernanceConsoleSnapshot | null;
  }
): string => {
  const evidenceSummary = options?.evidenceSummary ?? readEvidenceSummaryForMenu(process.cwd());
  const tokens = buildCliDesignTokens();
  const statusBadge = resolveAdvancedStatusBadge(evidenceSummary, tokens);
  const groupedActions = resolveAdvancedMenuLayout(actions);
  const governanceConsole = options?.preflight
    ? {
      governanceObservation: options.preflight.governanceObservation,
      governanceNextAction: options.preflight.governanceNextAction,
      policyValidation: options.preflight.policyValidation,
      experimentalFeatures: options.preflight.experimentalFeatures,
    }
    : (options?.governanceConsole ?? null);
  const lines = [
    'Pumuki Framework Menu (Advanced)',
    `Status: ${statusBadge}`,
    ...(governanceConsole
      ? [
        'Governance Console',
        ...buildGovernanceConsoleSummaryLines({
          governanceObservation: governanceConsole.governanceObservation,
          governanceNextAction: governanceConsole.governanceNextAction,
          policyValidation: governanceConsole.policyValidation,
          experimentalFeatures: governanceConsole.experimentalFeatures,
        }).map((line) => `  ${line}`),
        '',
      ]
      : []),
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
    preflight?: ConsumerPreflightResult | null;
    governanceConsole?: GovernanceConsoleSnapshot | null;
  }
): string => {
  const evidenceSummary = options?.evidenceSummary ?? readEvidenceSummaryForMenu(process.cwd());
  const governanceConsole = options?.preflight
    ? {
      governanceObservation: options.preflight.governanceObservation,
      governanceNextAction: options.preflight.governanceNextAction,
      policyValidation: options.preflight.policyValidation,
      experimentalFeatures: options.preflight.experimentalFeatures,
    }
    : (options?.governanceConsole ?? null);
  const lines = [
    'Pumuki Framework Menu (Advanced)',
    ...(governanceConsole
      ? [
        'Governance Console',
        ...buildGovernanceConsoleSummaryLines({
          governanceObservation: governanceConsole.governanceObservation,
          governanceNextAction: governanceConsole.governanceNextAction,
          policyValidation: governanceConsole.policyValidation,
          experimentalFeatures: governanceConsole.experimentalFeatures,
        }).map((line) => `  ${line}`),
        '',
      ]
      : []),
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
