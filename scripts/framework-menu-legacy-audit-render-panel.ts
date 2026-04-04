import type {
  LegacyMenuDesignTokens,
  LegacyMenuPaletteRole,
} from './framework-menu-legacy-audit-types';

export const LEGACY_AUDIT_OVERVIEW_TITLE = 'PUMUKI — Legacy Read-Only Evidence Snapshot';
export const LEGACY_AUDIT_OVERVIEW_SUBTITLE =
  'Derived from .ai_evidence.json without recomputing the canonical gate verdict';

const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;
const PANEL_MIN_WIDTH = 56;
const PANEL_MAX_WIDTH = 120;
const PANEL_DEFAULT_WIDTH = 88;
const PANEL_TTY_MARGIN = 8;

const stripAnsi = (value: string): string => value.replace(ANSI_PATTERN, '');

const visibleLength = (value: string): number => stripAnsi(value).length;

const padRight = (value: string, width: number): string => {
  const padding = width - visibleLength(value);
  if (padding <= 0) {
    return value;
  }
  return `${value}${' '.repeat(padding)}`;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
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

const toAsciiLine = (line: string): string => {
  return line
    .replace(/—/g, '-')
    .replace(/→/g, '->')
    .replace(/•/g, '*')
    .replace(/●/g, 'o')
    .replace(/⚠/g, '!')
    .replace(/✅/g, 'OK')
    .replace(/ℹ/g, 'i')
    .replace(/┌/g, '+')
    .replace(/└/g, '+')
    .replace(/│/g, '|');
};

export const resolveLegacyPanelOuterWidth = (requested?: number): number => {
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

const buildLegacyMenuDesignTokens = (options?: {
  width?: number;
  color?: boolean;
}): LegacyMenuDesignTokens => {
  const asciiMode = useAsciiMode();
  const panelOuterWidth = resolveLegacyPanelOuterWidth(options?.width);
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

export const resolveLegacyMenuDesignTokens = (options?: {
  width?: number;
  color?: boolean;
}): LegacyMenuDesignTokens => buildLegacyMenuDesignTokens(options);

const applyPalette = (
  line: string,
  role: LegacyMenuPaletteRole,
  tokens: LegacyMenuDesignTokens
): string => {
  return color(line, tokens.palette[role], tokens.colorEnabled);
};

const styleLegacyLine = (line: string, tokens: LegacyMenuDesignTokens): string => {
  if (line.length === 0) {
    return line;
  }
  if (line.startsWith(LEGACY_AUDIT_OVERVIEW_TITLE)) {
    return applyPalette(line, 'title', tokens);
  }
  if (line === LEGACY_AUDIT_OVERVIEW_SUBTITLE) {
    return applyPalette(line, 'subtitle', tokens);
  }
  if (line.startsWith('A. Switch')) {
    return applyPalette(line, 'switch', tokens);
  }
  if (line === 'QUICK SUMMARY' || line === 'METRICS' || line.startsWith('FINAL SUMMARY')) {
    return applyPalette(line, 'sectionTitle', tokens);
  }
  if (/^(\d\)|5\)|6\))\s/.test(line)) {
    return applyPalette(line, 'sectionTitle', tokens);
  }
  if (line.includes('ACTION REQUIRED')) {
    return applyPalette(line, 'statusWarning', tokens);
  }
  if (line.startsWith('Rule:')) {
    return applyPalette(line, 'rule', tokens);
  }
  if (line.startsWith('Goal:')) {
    return applyPalette(line, 'goal', tokens);
  }
  if (line.startsWith('● CRITICAL')) {
    return applyPalette(line, 'critical', tokens);
  }
  if (line.startsWith('● HIGH')) {
    return applyPalette(line, 'high', tokens);
  }
  if (line.startsWith('● MEDIUM')) {
    return applyPalette(line, 'medium', tokens);
  }
  if (line.startsWith('● LOW')) {
    return applyPalette(line, 'low', tokens);
  }
  if (line.startsWith('Pipeline') || line.startsWith('Outputs') || line.startsWith('Top violations:')) {
    return applyPalette(line, 'muted', tokens);
  }
  return line;
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

export const renderLegacyPanel = (
  lines: ReadonlyArray<string>,
  options?: { width?: number; color?: boolean }
): string => {
  const tokens = buildLegacyMenuDesignTokens(options);
  const wrappedLines = lines.flatMap((line) =>
    wrapLine(tokens.asciiMode ? toAsciiLine(line) : line, tokens.panelInnerWidth)
  );
  const border = (value: string): string => color(value, tokens.palette.border, tokens.colorEnabled);
  const top = border(
    `${tokens.border.topLeft}${tokens.border.horizontal.repeat(tokens.panelInnerWidth + 2)}${tokens.border.topRight}`
  );
  const bottom = border(
    `${tokens.border.bottomLeft}${tokens.border.horizontal.repeat(tokens.panelInnerWidth + 2)}${tokens.border.bottomRight}`
  );
  const body = wrappedLines
    .map((line) => {
      const content = padRight(styleLegacyLine(line, tokens), tokens.panelInnerWidth);
      return `${border(tokens.border.vertical)} ${content} ${border(tokens.border.vertical)}`;
    })
    .join('\n');
  return [top, body, bottom].join('\n');
};
