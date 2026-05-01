import {
  readEvidenceSummaryForMenu,
  type FrameworkMenuEvidenceSummary,
} from './framework-menu-evidence-summary-lib';
import {
  renderLegacyPanel,
  resolveLegacyPanelOuterWidth,
} from './framework-menu-legacy-audit-lib';
import { resolveConsumerMenuLayout } from './framework-menu-layout-lib';
import {
  buildCliDesignTokens,
  renderActionRow,
  renderBadge,
} from './framework-menu-ui-components-lib';
import { isMenuUiV2Enabled } from './framework-menu-ui-version-lib';
import { buildGovernanceConsoleSummaryLines } from '../integrations/lifecycle/cliGovernanceConsole';
import type { GovernanceConsoleSnapshot } from '../integrations/lifecycle/cliGovernanceConsole';
import type { ConsumerPreflightResult } from './framework-menu-consumer-preflight-types';
import type { ConsumerAction, ConsumerRuntimeWrite } from './framework-menu-consumer-runtime-types';

const buildConsumerRuntimeMenuStatus = (
  menuSummary: FrameworkMenuEvidenceSummary
): { level: 'info' | 'block' | 'warn' | 'ok'; label: string } =>
  menuSummary.status !== 'ok'
    ? { level: 'info', label: 'NO_EVIDENCE' }
    : (menuSummary.outcome ?? 'UNKNOWN').trim().toUpperCase() === 'BLOCK'
      ? { level: 'block', label: 'BLOCK' }
      : (menuSummary.outcome ?? 'UNKNOWN').trim().toUpperCase() === 'WARN'
        ? { level: 'warn', label: 'WARN' }
        : (menuSummary.outcome ?? 'UNKNOWN').trim().toUpperCase() === 'PASS'
          ? { level: 'ok', label: 'PASS' }
          : { level: 'info', label: (menuSummary.outcome ?? 'UNKNOWN').trim().toUpperCase() };

export const renderConsumerRuntimeClassicMenu = (
  params: {
    actions: ReadonlyArray<ConsumerAction>;
    repoRoot: string;
    useColor: () => boolean;
  }
): string => {
  const menuSummary = readEvidenceSummaryForMenu(params.repoRoot);
  const menuStatus = buildConsumerRuntimeMenuStatus(menuSummary);
  const tokens = buildCliDesignTokens({
    width: resolveLegacyPanelOuterWidth(),
    color: params.useColor(),
  });
  const groupedActions = resolveConsumerMenuLayout(params.actions);
  const lines = [
    'PUMUKI — Hook-System (run: npx ast-hooks)',
    'AST Intelligence System Overview',
    '',
    ...groupedActions.flatMap((group) => [
      ...(group.title.trim().length > 0 ? [group.title] : []),
      ...group.items.map((item) => renderActionRow({
        id: item.id,
        label: item.action.label,
      })),
      '',
    ]),
  ];
  return renderLegacyPanel(lines, {
    width: resolveLegacyPanelOuterWidth(),
    color: params.useColor(),
  });
};

export const renderConsumerRuntimeModernMenu = (
  params: {
    actions: ReadonlyArray<ConsumerAction>;
    repoRoot: string;
    useColor: () => boolean;
    preflight?: ConsumerPreflightResult | null;
    governanceConsole?: GovernanceConsoleSnapshot | null;
  }
): string => {
  const menuSummary = readEvidenceSummaryForMenu(params.repoRoot);
  const menuStatus = buildConsumerRuntimeMenuStatus(menuSummary);
  const tokens = buildCliDesignTokens({
    width: resolveLegacyPanelOuterWidth(),
    color: params.useColor(),
  });
  const groupedActions = resolveConsumerMenuLayout(params.actions);
  const governanceConsole =
    params.preflight
      ? {
          governanceObservation: params.preflight.governanceObservation,
          governanceNextAction: params.preflight.governanceNextAction,
          policyValidation: params.preflight.policyValidation,
          experimentalFeatures: params.preflight.experimentalFeatures,
        }
      : params.governanceConsole;
  const lines = [
    'PUMUKI — Hook-System (run: npx ast-hooks)',
    'AST Intelligence System Overview',
    ...(governanceConsole
      ? [
        '',
        'Governance Console',
        ...buildGovernanceConsoleSummaryLines({
          governanceObservation: governanceConsole.governanceObservation,
          governanceNextAction: governanceConsole.governanceNextAction,
          policyValidation: governanceConsole.policyValidation,
          experimentalFeatures: governanceConsole.experimentalFeatures,
        }).map((line) => `  ${line}`),
      ]
      : []),
    '',
    ...groupedActions.flatMap((group) => [
      ...(group.title.trim().length > 0 ? [group.title] : []),
      ...group.items.map((item) => renderActionRow({
        id: item.id,
        label: item.action.label,
      })),
      '',
    ]),
  ];
  return renderLegacyPanel(lines, {
    width: resolveLegacyPanelOuterWidth(),
    color: params.useColor(),
  });
};

export const printConsumerRuntimeMenu = (params: {
  actions: ReadonlyArray<ConsumerAction>;
  repoRoot: string;
  useColor: () => boolean;
  write: ConsumerRuntimeWrite;
  preflight?: ConsumerPreflightResult | null;
  governanceConsole?: GovernanceConsoleSnapshot | null;
}): void => {
  const classicMenu = renderConsumerRuntimeClassicMenu({
    actions: params.actions,
    repoRoot: params.repoRoot,
    useColor: params.useColor,
  });
  if (!isMenuUiV2Enabled()) {
    params.write(`\n${classicMenu}\n`);
    return;
  }

  try {
    params.write(`\n${renderConsumerRuntimeModernMenu({
      actions: params.actions,
      repoRoot: params.repoRoot,
      useColor: params.useColor,
      preflight: params.preflight,
      governanceConsole: params.governanceConsole,
    })}\n`);
  } catch {
    params.write('\n[pumuki][menu-ui-v2] Render failed. Falling back to classic menu.\n');
    params.write(`\n${classicMenu}\n`);
  }
};
