import type { CliDesignTokens, CliPaletteRole } from './framework-menu-ui-components-types';

const PANEL_MIN_WIDTH = 56;
const PANEL_MAX_WIDTH = 120;
const PANEL_DEFAULT_WIDTH = 88;
const PANEL_TTY_MARGIN = 8;

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const resolvePanelOuterWidth = (requested?: number): number => {
  const forcedWidth = Number(process.env.PUMUKI_MENU_WIDTH ?? 0);
  if (Number.isFinite(forcedWidth) && forcedWidth > 0) {
    return clamp(Math.trunc(forcedWidth), PANEL_MIN_WIDTH, PANEL_MAX_WIDTH);
  }
  if (Number.isFinite(requested ?? Number.NaN) && (requested ?? 0) > 0) {
    return clamp(Math.trunc(Number(requested)), PANEL_MIN_WIDTH, PANEL_MAX_WIDTH);
  }
  const ttyColumns = Number(process.stdout.columns ?? 0);
  if (Number.isFinite(ttyColumns) && ttyColumns > 0) {
    return clamp(Math.trunc(ttyColumns - PANEL_TTY_MARGIN), PANEL_MIN_WIDTH, PANEL_MAX_WIDTH);
  }
  return PANEL_DEFAULT_WIDTH;
};

const useColor = (enabled?: boolean): boolean => {
  if (typeof enabled === 'boolean') {
    return enabled;
  }
  if (process.env.NO_COLOR === '1') {
    return false;
  }
  return process.stdout.isTTY === true;
};

const useAsciiMode = (): boolean => {
  if (process.env.PUMUKI_MENU_ASCII === '1') {
    return true;
  }
  const locale = (process.env.LC_ALL ?? process.env.LC_CTYPE ?? process.env.LANG ?? '').toLowerCase();
  return locale === 'c' || locale === 'posix';
};

export const colorizeCliText = (text: string, code: string, enabled: boolean): string => {
  if (!enabled) {
    return text;
  }
  return `\u001b[${code}m${text}\u001b[0m`;
};

export const applyCliPalette = (
  value: string,
  role: CliPaletteRole,
  tokens: CliDesignTokens
): string => {
  return colorizeCliText(value, tokens.palette[role], tokens.colorEnabled);
};

export const buildCliDesignTokens = (options?: {
  width?: number;
  color?: boolean;
}): CliDesignTokens => {
  const asciiMode = useAsciiMode();
  const panelOuterWidth = resolvePanelOuterWidth(options?.width);

  return {
    colorEnabled: useColor(options?.color),
    asciiMode,
    panelOuterWidth,
    panelInnerWidth: panelOuterWidth - 4,
    border: asciiMode
      ? {
        topLeft: '+',
        topRight: '+',
        bottomLeft: '+',
        bottomRight: '+',
        horizontal: '-',
        vertical: '|',
      }
      : {
        topLeft: '╭',
        topRight: '╮',
        bottomLeft: '╰',
        bottomRight: '╯',
        horizontal: '─',
        vertical: '│',
      },
    palette: {
      title: '96;1',
      subtitle: '92;1',
      switch: '90',
      sectionTitle: '96;1',
      statusWarning: '93;1',
      rule: '93',
      goal: '92',
      critical: '91',
      high: '93',
      medium: '33',
      low: '94',
      muted: '90',
      border: '94',
    },
  };
};
