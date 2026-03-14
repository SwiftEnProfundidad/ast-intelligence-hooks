import {
  applyCliPalette,
} from './framework-menu-ui-components-tokens';
import type { CliDesignTokens, CliPaletteRole } from './framework-menu-ui-components-types';
import {
  truncateTextForTerminal,
} from './framework-menu-legibility-lib';

export const renderSectionHeader = (
  index: number | string,
  title: string,
  tokens: CliDesignTokens
): string => {
  return applyCliPalette(`${index}) ${title}`, 'sectionTitle', tokens);
};

export const renderMetricRow = (
  label: string,
  value: string | number
): string => `${label}: ${value}`;

export const renderActionRow = (params: {
  id: string;
  label: string;
  hint?: string;
}): string => {
  const label = truncateTextForTerminal(params.label, 120);
  if (params.hint && params.hint.trim().length > 0) {
    const hint = truncateTextForTerminal(params.hint, 120);
    return `${params.id}) ${label} - ${hint}`;
  }
  return `${params.id}) ${label}`;
};

export const renderHintBlock = (
  title: string,
  lines: ReadonlyArray<string>,
  tokens: CliDesignTokens
): ReadonlyArray<string> => {
  const header = applyCliPalette(title, 'muted', tokens);
  return [header, ...lines.map((line) => `• ${line}`)];
};

export const renderBadge = (
  label: string,
  level: 'ok' | 'warn' | 'block' | 'info',
  tokens: CliDesignTokens
): string => {
  const marker = tokens.asciiMode ? '*' : '●';
  const role: CliPaletteRole = level === 'ok'
    ? 'goal'
    : level === 'warn'
      ? 'high'
      : level === 'block'
        ? 'critical'
        : 'muted';
  return applyCliPalette(`${marker} ${label.toUpperCase()}`, role, tokens);
};
