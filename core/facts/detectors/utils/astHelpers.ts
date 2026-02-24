export const isObject = (value: unknown): value is Record<string, string | number | boolean | bigint | symbol | null | undefined | Date | object> => {
  return typeof value === 'object' && value !== null;
};

export const hasNode = (
  node: unknown,
  predicate: (value: Record<string, string | number | boolean | bigint | symbol | null | undefined | Date | object>) => boolean
): boolean => {
  if (!isObject(node)) {
    return false;
  }

  if (predicate(node)) {
    return true;
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (hasNode(item, predicate)) {
          return true;
        }
      }
      continue;
    }

    if (isObject(value) && hasNode(value, predicate)) {
      return true;
    }
  }

  return false;
};

const extractStartLine = (node: Record<string, string | number | boolean | bigint | symbol | null | undefined | Date | object>): number | null => {
  const loc = node.loc;
  if (!isObject(loc)) {
    return null;
  }
  const start = loc.start;
  if (!isObject(start) || typeof start.line !== 'number' || !Number.isFinite(start.line)) {
    return null;
  }
  const line = Math.trunc(start.line);
  return line > 0 ? line : null;
};

export const collectNodeLineMatches = (
  node: unknown,
  predicate: (value: Record<string, string | number | boolean | bigint | symbol | null | undefined | Date | object>) => boolean,
  options?: { max?: number }
): readonly number[] => {
  const max = Math.max(1, Math.trunc(options?.max ?? 8));
  const lines: number[] = [];

  const walk = (value: unknown): void => {
    if (!isObject(value) || lines.length >= max) {
      return;
    }

    if (predicate(value)) {
      const line = extractStartLine(value);
      if (typeof line === 'number') {
        lines.push(line);
      }
    }

    for (const child of Object.values(value)) {
      if (Array.isArray(child)) {
        for (const entry of child) {
          if (lines.length >= max) {
            return;
          }
          walk(entry);
        }
        continue;
      }
      walk(child);
      if (lines.length >= max) {
        return;
      }
    }
  };

  walk(node);

  return Array.from(new Set(lines)).sort((left, right) => left - right);
};
