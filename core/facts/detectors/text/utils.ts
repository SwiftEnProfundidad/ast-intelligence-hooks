export const isIdentifierCharacter = (value: string): boolean => {
  return /^[A-Za-z0-9_]$/.test(value);
};

export const prevNonWhitespaceIndex = (source: string, start: number): number => {
  for (let index = start; index >= 0; index -= 1) {
    if (!/\s/.test(source[index])) {
      return index;
    }
  }
  return -1;
};

export const nextNonWhitespaceIndex = (source: string, start: number): number => {
  for (let index = start; index < source.length; index += 1) {
    if (!/\s/.test(source[index])) {
      return index;
    }
  }
  return -1;
};

export const readIdentifierBackward = (
  source: string,
  endIndex: number
): { value: string; start: number } => {
  if (!isIdentifierCharacter(source[endIndex])) {
    return { value: '', start: -1 };
  }

  let start = endIndex;
  while (start > 0 && isIdentifierCharacter(source[start - 1])) {
    start -= 1;
  }

  return {
    value: source.slice(start, endIndex + 1),
    start,
  };
};

export const hasIdentifierAt = (source: string, index: number, identifier: string): boolean => {
  if (!source.startsWith(identifier, index)) {
    return false;
  }

  const before = source[index - 1];
  const after = source[index + identifier.length];
  const validBefore = typeof before === 'undefined' || !isIdentifierCharacter(before);
  const validAfter = typeof after === 'undefined' || !isIdentifierCharacter(after);
  return validBefore && validAfter;
};

export const scanCodeLikeSource = (
  source: string,
  matcher: (params: { source: string; index: number; current: string }) => boolean
): boolean => {
  let index = 0;
  let inLineComment = false;
  let blockCommentDepth = 0;
  let inString = false;
  let inMultilineString = false;

  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1];
    const nextTwo = source[index + 2];

    if (inLineComment) {
      if (current === '\n') {
        inLineComment = false;
      }
      index += 1;
      continue;
    }

    if (blockCommentDepth > 0) {
      if (current === '/' && next === '*') {
        blockCommentDepth += 1;
        index += 2;
        continue;
      }
      if (current === '*' && next === '/') {
        blockCommentDepth -= 1;
        index += 2;
        continue;
      }
      index += 1;
      continue;
    }

    if (inMultilineString) {
      if (current === '"' && next === '"' && nextTwo === '"') {
        inMultilineString = false;
        index += 3;
        continue;
      }
      index += 1;
      continue;
    }

    if (inString) {
      if (current === '\\') {
        index += 2;
        continue;
      }
      if (current === '"') {
        inString = false;
      }
      index += 1;
      continue;
    }

    if (current === '/' && next === '/') {
      inLineComment = true;
      index += 2;
      continue;
    }

    if (current === '/' && next === '*') {
      blockCommentDepth = 1;
      index += 2;
      continue;
    }

    if (current === '"' && next === '"' && nextTwo === '"') {
      inMultilineString = true;
      index += 3;
      continue;
    }

    if (current === '"') {
      inString = true;
      index += 1;
      continue;
    }

    if (matcher({ source, index, current })) {
      return true;
    }

    index += 1;
  }

  return false;
};
