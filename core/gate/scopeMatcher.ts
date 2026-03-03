type ScopePattern = {
  include?: ReadonlyArray<string>;
  exclude?: ReadonlyArray<string>;
};

const normalizePath = (value: string): string => {
  return value.replace(/\\/g, '/');
};

const escapeRegex = (value: string): string => {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
};

const toGlobRegex = (pattern: string): RegExp => {
  let regex = '^';
  for (let index = 0; index < pattern.length; index += 1) {
    const current = pattern[index];
    if (current === '*') {
      const next = pattern[index + 1];
      if (next === '*') {
        const nextNext = pattern[index + 2];
        if (nextNext === '/') {
          regex += '(?:.*/)?';
          index += 2;
        } else {
          regex += '.*';
          index += 1;
        }
      } else {
        regex += '[^/]*';
      }
      continue;
    }
    if (current === '?') {
      regex += '[^/]';
      continue;
    }
    regex += escapeRegex(current);
  }
  regex += '$';
  return new RegExp(regex);
};

const extractPrefix = (pattern: string): string => {
  const wildcardIndex = pattern.search(/[*?]/);
  return wildcardIndex === -1 ? pattern : pattern.slice(0, wildcardIndex);
};

const isTrailingWildcardPattern = (pattern: string): boolean => {
  const wildcardIndex = pattern.search(/[*?]/);
  if (wildcardIndex === -1) {
    return false;
  }
  const suffix = pattern.slice(wildcardIndex);
  return /^[*?]+$/.test(suffix);
};

export const matchesPattern = (path: string, pattern: string): boolean => {
  const normalizedPath = normalizePath(path);
  const normalizedPattern = normalizePath(pattern);
  const wildcardIndex = normalizedPattern.search(/[*?]/);
  if (wildcardIndex === -1) {
    return normalizedPath.startsWith(normalizedPattern);
  }
  if (isTrailingWildcardPattern(normalizedPattern)) {
    return normalizedPath.startsWith(extractPrefix(normalizedPattern));
  }
  return toGlobRegex(normalizedPattern).test(normalizedPath);
};

const matchesAnyPattern = (path: string, patterns: ReadonlyArray<string>): boolean => {
  return patterns.some((pattern) => matchesPattern(path, pattern));
};

export const matchesScope = (path: string, scope?: ScopePattern): boolean => {
  const include = scope?.include;
  const exclude = scope?.exclude;
  if (exclude && exclude.length > 0 && matchesAnyPattern(path, exclude)) {
    return false;
  }
  if (!include || include.length === 0) {
    return true;
  }
  return matchesAnyPattern(path, include);
};
