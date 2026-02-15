import { hasIdentifierAt, scanCodeLikeSource } from './utils';

export const hasKotlinThreadSleepCall = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: kotlinSource, index, current }) => {
    if (current !== 'T') {
      return false;
    }

    return (
      hasIdentifierAt(kotlinSource, index, 'Thread') &&
      kotlinSource.startsWith('.sleep', index + 'Thread'.length)
    );
  });
};

export const hasKotlinGlobalScopeUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: kotlinSource, index, current }) => {
    if (current !== 'G' || !hasIdentifierAt(kotlinSource, index, 'GlobalScope')) {
      return false;
    }

    const start = index + 'GlobalScope'.length;
    const tail = kotlinSource.slice(start, start + 32);
    return /^\s*\.(launch|async|produce|actor)\b/.test(tail);
  });
};

export const hasKotlinRunBlockingUsage = (source: string): boolean => {
  return scanCodeLikeSource(source, ({ source: kotlinSource, index, current }) => {
    if (current !== 'r' || !hasIdentifierAt(kotlinSource, index, 'runBlocking')) {
      return false;
    }

    const start = index + 'runBlocking'.length;
    const tail = kotlinSource.slice(start, start + 48);
    return /^\s*(<[^>\n]+>\s*)?(\(|\{)/.test(tail);
  });
};
