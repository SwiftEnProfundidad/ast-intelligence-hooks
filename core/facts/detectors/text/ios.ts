import {
  hasIdentifierAt,
  isIdentifierCharacter,
  nextNonWhitespaceIndex,
  prevNonWhitespaceIndex,
  readIdentifierBackward,
  scanCodeLikeSource,
} from './utils';

const isLikelySwiftTypeAnnotation = (source: string, identifierStart: number): boolean => {
  if (identifierStart <= 0) {
    return false;
  }

  const before = prevNonWhitespaceIndex(source, identifierStart - 1);
  return before >= 0 && source[before] === ':';
};

const isForceUnwrapAt = (source: string, index: number): boolean => {
  const previousIndex = prevNonWhitespaceIndex(source, index - 1);
  if (previousIndex < 0) {
    return false;
  }

  const nextIndex = nextNonWhitespaceIndex(source, index + 1);
  if (nextIndex >= 0 && (source[nextIndex] === '=' || source[nextIndex] === '!')) {
    return false;
  }

  const previousChar = source[previousIndex];
  const previousIdentifier = readIdentifierBackward(source, previousIndex);
  if (previousIdentifier.value === 'as') {
    return false;
  }
  if (
    previousIdentifier.start >= 0 &&
    isLikelySwiftTypeAnnotation(source, previousIdentifier.start)
  ) {
    return false;
  }

  const isPostfixToken =
    isIdentifierCharacter(previousChar) ||
    previousChar === ')' ||
    previousChar === ']' ||
    previousChar === '}';
  if (!isPostfixToken) {
    return false;
  }

  return true;
};

export const hasSwiftForceUnwrap = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    return current === '!' && isForceUnwrapAt(swiftSource, index);
  });
};

export const hasSwiftAnyViewUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'A') {
      return false;
    }

    return hasIdentifierAt(swiftSource, index, 'AnyView');
  });
};

export const hasSwiftDispatchQueueUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'D' || !hasIdentifierAt(swiftSource, index, 'DispatchQueue')) {
      return false;
    }

    const dotIndex = nextNonWhitespaceIndex(swiftSource, index + 'DispatchQueue'.length);
    return dotIndex >= 0 && swiftSource[dotIndex] === '.';
  });
};

export const hasSwiftDispatchGroupUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'D') {
      return false;
    }

    return hasIdentifierAt(swiftSource, index, 'DispatchGroup');
  });
};

export const hasSwiftDispatchSemaphoreUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'D') {
      return false;
    }

    return hasIdentifierAt(swiftSource, index, 'DispatchSemaphore');
  });
};

export const hasSwiftOperationQueueUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'O') {
      return false;
    }

    return hasIdentifierAt(swiftSource, index, 'OperationQueue');
  });
};

export const hasSwiftTaskDetachedUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'T' || !hasIdentifierAt(swiftSource, index, 'Task')) {
      return false;
    }

    const dotIndex = nextNonWhitespaceIndex(swiftSource, index + 'Task'.length);
    if (dotIndex < 0 || swiftSource[dotIndex] !== '.') {
      return false;
    }

    const detachedIndex = nextNonWhitespaceIndex(swiftSource, dotIndex + 1);
    return detachedIndex >= 0 && hasIdentifierAt(swiftSource, detachedIndex, 'detached');
  });
};

export const hasSwiftUncheckedSendableUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== '@' || !swiftSource.startsWith('@unchecked', index)) {
      return false;
    }

    const sendableIndex = nextNonWhitespaceIndex(swiftSource, index + '@unchecked'.length);
    return sendableIndex >= 0 && hasIdentifierAt(swiftSource, sendableIndex, 'Sendable');
  });
};

export const hasSwiftObservableObjectUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'O') {
      return false;
    }

    return hasIdentifierAt(swiftSource, index, 'ObservableObject');
  });
};

export const hasSwiftNavigationViewUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'N') {
      return false;
    }

    return hasIdentifierAt(swiftSource, index, 'NavigationView');
  });
};

export const hasSwiftOnTapGestureUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'o') {
      return false;
    }

    return hasIdentifierAt(swiftSource, index, 'onTapGesture');
  });
};

export const hasSwiftStringFormatUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'S' || !hasIdentifierAt(swiftSource, index, 'String')) {
      return false;
    }

    const openingParenIndex = nextNonWhitespaceIndex(swiftSource, index + 'String'.length);
    if (openingParenIndex < 0 || swiftSource[openingParenIndex] !== '(') {
      return false;
    }

    const formatIndex = nextNonWhitespaceIndex(swiftSource, openingParenIndex + 1);
    if (formatIndex < 0 || !hasIdentifierAt(swiftSource, formatIndex, 'format')) {
      return false;
    }

    const colonIndex = nextNonWhitespaceIndex(swiftSource, formatIndex + 'format'.length);
    return colonIndex >= 0 && swiftSource[colonIndex] === ':';
  });
};

export const hasSwiftUIScreenMainBoundsUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'U' || !hasIdentifierAt(swiftSource, index, 'UIScreen')) {
      return false;
    }

    const dotMainIndex = nextNonWhitespaceIndex(swiftSource, index + 'UIScreen'.length);
    if (dotMainIndex < 0 || swiftSource[dotMainIndex] !== '.') {
      return false;
    }

    const mainIndex = nextNonWhitespaceIndex(swiftSource, dotMainIndex + 1);
    if (mainIndex < 0 || !hasIdentifierAt(swiftSource, mainIndex, 'main')) {
      return false;
    }

    const dotBoundsIndex = nextNonWhitespaceIndex(swiftSource, mainIndex + 'main'.length);
    if (dotBoundsIndex < 0 || swiftSource[dotBoundsIndex] !== '.') {
      return false;
    }

    const boundsIndex = nextNonWhitespaceIndex(swiftSource, dotBoundsIndex + 1);
    return boundsIndex >= 0 && hasIdentifierAt(swiftSource, boundsIndex, 'bounds');
  });
};

export const hasSwiftForceTryUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 't' || !hasIdentifierAt(swiftSource, index, 'try')) {
      return false;
    }

    const bangIndex = nextNonWhitespaceIndex(swiftSource, index + 'try'.length);
    return bangIndex >= 0 && swiftSource[bangIndex] === '!';
  });
};

export const hasSwiftForceCastUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== 'a' || !hasIdentifierAt(swiftSource, index, 'as')) {
      return false;
    }

    const bangIndex = nextNonWhitespaceIndex(swiftSource, index + 'as'.length);
    return bangIndex >= 0 && swiftSource[bangIndex] === '!';
  });
};

export const hasSwiftCallbackStyleSignature = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: swiftSource, index, current }) => {
    if (current !== '@' || !swiftSource.startsWith('@escaping', index)) {
      return false;
    }

    const segmentStart = Math.max(0, index - 180);
    const segmentEnd = Math.min(swiftSource.length, index + 260);
    const segment = swiftSource.slice(segmentStart, segmentEnd);

    return (
      /\b(?:completion|handler|callback)\s*:\s*(?:@[A-Za-z0-9_]+\s+)?@escaping\b/.test(
        segment
      ) || /\bfunc\b[\s\S]{0,180}@escaping[\s\S]{0,120}->\s*Void\b/.test(segment)
    );
  });
};
