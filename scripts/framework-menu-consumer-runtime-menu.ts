import {
  type LegacyAuditSummary,
  readLegacyAuditSummary,
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
import type {
  ConsumerAction,
  ConsumerRuntimeWrite,
} from './framework-menu-consumer-runtime-types';

const buildConsumerRuntimeMenuStatus = (
  menuSummary: LegacyAuditSummary
): { level: 'info' | 'block' | 'warn' | 'ok'; label: string } =>
  menuSummary.status !== 'ok'
    ? { level: 'info', label: 'NO_EVIDENCE' }
    : menuSummary.bySeverity.CRITICAL > 0 || menuSummary.bySeverity.HIGH > 0
      ? { level: 'block', label: 'BLOCK' }
      : menuSummary.bySeverity.MEDIUM > 0 || menuSummary.bySeverity.LOW > 0
        ? { level: 'warn', label: 'WARN' }
        : { level: 'ok', label: 'PASS' };

export const renderConsumerRuntimeClassicMenu = (
  actions: ReadonlyArray<ConsumerAction>,
  useColor: () => boolean
): string => {
  const lines = [
    'PUMUKI — Hook-System (run: npx ast-hooks)',
    'AST Intelligence System Overview',
    'A. Switch to advanced menu',
    '',
    ...actions.map((action) => `${action.id}) ${action.label}`),
  ];
  return renderLegacyPanel(lines, {
    width: resolveLegacyPanelOuterWidth(),
    color: useColor(),
  });
};

export const renderConsumerRuntimeModernMenu = (
  params: {
    actions: ReadonlyArray<ConsumerAction>;
    repoRoot: string;
    useColor: () => boolean;
  }
): string => {
  const menuSummary = readLegacyAuditSummary(params.repoRoot);
  const menuStatus = buildConsumerRuntimeMenuStatus(menuSummary);
  const tokens = buildCliDesignTokens({
    width: resolveLegacyPanelOuterWidth(),
    color: params.useColor(),
  });
  const groupedActions = resolveConsumerMenuLayout(params.actions);
  const lines = [
    'PUMUKI — Hook-System (run: npx ast-hooks)',
    'AST Intelligence System Overview',
    `Status: ${renderBadge(menuStatus.label, menuStatus.level, tokens)}`,
    'A. Switch to advanced menu',
    '',
    ...groupedActions.flatMap((group) => [
      group.title,
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
}): void => {
  const classicMenu = renderConsumerRuntimeClassicMenu(params.actions, params.useColor);
  if (!isMenuUiV2Enabled()) {
    params.write(`\n${classicMenu}\n`);
    return;
  }

  try {
    params.write(`\n${renderConsumerRuntimeModernMenu({
      actions: params.actions,
      repoRoot: params.repoRoot,
      useColor: params.useColor,
    })}\n`);
  } catch {
    params.write('\n[pumuki][menu-ui-v2] Render failed. Falling back to classic menu.\n');
    params.write(`\n${classicMenu}\n`);
  }
};
