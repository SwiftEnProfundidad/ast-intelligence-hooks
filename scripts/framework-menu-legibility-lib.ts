const collapseBlankLines = (
  lines: ReadonlyArray<string>,
  maxConsecutiveBlankLines: number
): string[] => {
  const sanitized: string[] = [];
  let blankCount = 0;
  for (const line of lines) {
    if (line.trim().length === 0) {
      blankCount += 1;
      if (blankCount > maxConsecutiveBlankLines) {
        continue;
      }
      sanitized.push('');
      continue;
    }
    blankCount = 0;
    sanitized.push(line);
  }
  while (sanitized.length > 0 && sanitized[sanitized.length - 1]?.trim().length === 0) {
    sanitized.pop();
  }
  return sanitized;
};

export const truncateTextForTerminal = (
  value: string,
  maxLength: number
): string => {
  const safeMaxLength = Math.max(1, Math.trunc(maxLength));
  if (value.length <= safeMaxLength) {
    return value;
  }
  if (safeMaxLength <= 1) {
    return '…';
  }
  return `${value.slice(0, safeMaxLength - 1)}…`;
};

export const normalizeMenuDensity = (
  lines: ReadonlyArray<string>,
  options?: {
    maxConsecutiveBlankLines?: number;
    compactMode?: boolean;
  }
): ReadonlyArray<string> => {
  const compactMode = options?.compactMode ?? false;
  const maxConsecutiveBlankLines = compactMode
    ? 0
    : (options?.maxConsecutiveBlankLines ?? 1);
  return collapseBlankLines(lines, Math.max(0, maxConsecutiveBlankLines));
};

export const wrapLineForTerminal = (
  line: string,
  width: number
): ReadonlyArray<string> => {
  const safeWidth = Math.max(8, Math.trunc(width));
  if (line.length <= safeWidth) {
    return [line];
  }
  const leadingWhitespace = line.match(/^\s*/)?.[0] ?? '';
  const words = line.trim().split(/\s+/);
  if (words.length <= 1) {
    const chunks: string[] = [];
    let index = 0;
    while (index < line.length) {
      chunks.push(line.slice(index, index + safeWidth));
      index += safeWidth;
    }
    return chunks;
  }

  const wrapped: string[] = [];
  let current = leadingWhitespace;
  for (const word of words) {
    const candidate = current.trim().length === 0
      ? `${leadingWhitespace}${word}`
      : `${current} ${word}`;
    if (candidate.length <= safeWidth) {
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
