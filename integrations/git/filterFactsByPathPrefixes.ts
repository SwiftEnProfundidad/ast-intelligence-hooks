import type { Fact } from '../../core/facts/Fact';

const normalizePath = (value: string): string => value.replace(/\\/g, '/').replace(/^\/+/, '');

export const resolveGateScopePathPrefixesFromEnv = (): string[] => {
  const raw = process.env.PUMUKI_GATE_SCOPE_PATH_PREFIXES?.trim();
  if (!raw) {
    return [];
  }
  return Array.from(
    new Set(
      raw
        .split(/[,;]/)
        .map((segment) => normalizePath(segment.trim()))
        .filter((segment) => segment.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));
};

const primaryPathForFact = (fact: Fact): string | null => {
  if (fact.kind === 'FileContent' || fact.kind === 'FileChange') {
    return fact.path;
  }
  if (fact.kind === 'Heuristic') {
    return fact.filePath ?? null;
  }
  if (fact.kind === 'Dependency') {
    return fact.from;
  }
  return null;
};

const pathMatchesAnyPrefix = (path: string, prefixes: ReadonlyArray<string>): boolean => {
  const normalized = normalizePath(path);
  for (const prefix of prefixes) {
    if (normalized === prefix) {
      return true;
    }
    const withSlash = prefix.endsWith('/') ? prefix : `${prefix}/`;
    if (normalized.startsWith(withSlash)) {
      return true;
    }
  }
  return false;
};

export const filterFactsByPathPrefixes = (
  facts: ReadonlyArray<Fact>,
  prefixes: ReadonlyArray<string>
): Fact[] => {
  if (prefixes.length === 0) {
    return [...facts];
  }
  return facts.filter((fact) => {
    const primary = primaryPathForFact(fact);
    if (primary === null) {
      return true;
    }
    return pathMatchesAnyPrefix(primary, prefixes);
  });
};
