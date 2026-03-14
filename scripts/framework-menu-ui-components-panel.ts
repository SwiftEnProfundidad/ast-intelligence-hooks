import {
  applyCliPalette,
  colorizeCliText,
} from './framework-menu-ui-components-tokens';
import type { CliDesignTokens } from './framework-menu-ui-components-types';
import {
  normalizeMenuDensity,
  wrapLineForTerminal,
} from './framework-menu-legibility-lib';

const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

const stripAnsi = (value: string): string => value.replace(ANSI_PATTERN, '');

const visibleLength = (value: string): number => stripAnsi(value).length;

const padRight = (value: string, width: number): string => {
  const padding = width - visibleLength(value);
  if (padding <= 0) {
    return value;
  }
  return `${value}${' '.repeat(padding)}`;
};

export const renderPanel = (
  lines: ReadonlyArray<string>,
  tokens: CliDesignTokens
): string => {
  const wrappedLines = normalizeMenuDensity(lines, { maxConsecutiveBlankLines: 1 })
    .flatMap((line) => wrapLineForTerminal(line, tokens.panelInnerWidth));
  const border = (value: string): string => colorizeCliText(value, tokens.palette.border, tokens.colorEnabled);
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
