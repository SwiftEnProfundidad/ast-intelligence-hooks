type CliPaletteRole =
  | 'title'
  | 'subtitle'
  | 'switch'
  | 'sectionTitle'
  | 'statusWarning'
  | 'rule'
  | 'goal'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'muted'
  | 'border';

export type CliDesignTokens = {
  colorEnabled: boolean;
  asciiMode: boolean;
  panelOuterWidth: number;
  panelInnerWidth: number;
  border: {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
    horizontal: string;
    vertical: string;
  };
  palette: Record<CliPaletteRole, string>;
};

const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;
const PANEL_MIN_WIDTH = 56;
const PANEL_MAX_WIDTH = 120;
const PANEL_DEFAULT_WIDTH = 88;
const PANEL_TTY_MARGIN = 8;

const stripAnsi = (value: string): string => value.replace(ANSI_PATTERN, '');

const visibleLength = (value: string): number => stripAnsi(value).length;

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const resolvePanelOuterWidth = (requested?: number): number => {
  const forcedWidth = Number(process.env.PUMUKI_MENU_WIDTH ?? 0);
  if (Number.isFinite(forcedWidth) && forcedWidth > 0) {
    return clamp(Math.trunc(forcedWidth), PANEL_MIN_WIDTH, PANEL_MAX_WIDTH);
  }
  if (Number.isFinite(requested ?? NaN) && (requested ?? 0) > 0) {
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

const color = (text: string, code: string, enabled: boolean): string => {
  if (!enabled) {
    return text;
  }
  return `\u001b[${code}m${text}\u001b[0m`;
};

const padRight = (value: string, width: number): string => {
  const padding = width - visibleLength(value);
  if (padding <= 0) {
    return value;
  }
  return `${value}${' '.repeat(padding)}`;
};

const wrapLine = (line: string, width: number): string[] => {
  if (visibleLength(line) <= width) {
    return [line];
  }
  const leadingWhitespace = line.match(/^\s*/)?.[0] ?? '';
  const words = line.trim().split(/\s+/);
  if (words.length <= 1) {
    const chunks: string[] = [];
    let index = 0;
    while (index < line.length) {
      chunks.push(line.slice(index, index + width));
      index += width;
    }
    return chunks;
  }

  const wrapped: string[] = [];
  let current = leadingWhitespace;
  for (const word of words) {
    const candidate = current.trim().length === 0
      ? `${leadingWhitespace}${word}`
      : `${current} ${word}`;
    if (visibleLength(candidate) <= width) {
      current = candidate;
      continue;
    }
    if (current.trim().length > 0) {
      wrapped.push(current);
    }
    current = `${leadingWhitespace}${word}`;
  }
  if (current.trim().length > 0) {
    wrapped.push(current);
  }
  return wrapped.length > 0 ? wrapped : [''];
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

const withPalette = (value: string, role: CliPaletteRole, tokens: CliDesignTokens): string => {
  return color(value, tokens.palette[role], tokens.colorEnabled);
};

export const renderSectionHeader = (
  index: number | string,
  title: string,
  tokens: CliDesignTokens
): string => {
  return withPalette(`${index}) ${title}`, 'sectionTitle', tokens);
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
  if (params.hint && params.hint.trim().length > 0) {
    return `${params.id}) ${params.label} - ${params.hint}`;
  }
  return `${params.id}) ${params.label}`;
};

export const renderHintBlock = (
  title: string,
  lines: ReadonlyArray<string>,
  tokens: CliDesignTokens
): ReadonlyArray<string> => {
  const header = withPalette(title, 'muted', tokens);
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
  return withPalette(`${marker} ${label.toUpperCase()}`, role, tokens);
};

export const renderPanel = (
  lines: ReadonlyArray<string>,
  tokens: CliDesignTokens
): string => {
  const wrappedLines = lines.flatMap((line) => wrapLine(line, tokens.panelInnerWidth));
  const border = (value: string): string => color(value, tokens.palette.border, tokens.colorEnabled);
  const top = border(
    `${tokens.border.topLeft}${tokens.border.horizontal.repeat(tokens.panelInnerWidth + 2)}${tokens.border.topRight}`
  );
  const bottom = border(
    `${tokens.border.bottomLeft}${tokens.border.horizontal.repeat(tokens.panelInnerWidth + 2)}${tokens.border.bottomRight}`
  );
  const body = wrappedLines
    .map((line) => {
      const content = padRight(line, tokens.panelInnerWidth);
      return `${border(tokens.border.vertical)} ${content} ${border(tokens.border.vertical)}`;
    })
    .join('\n');
  return [top, body, bottom].join('\n');
};
