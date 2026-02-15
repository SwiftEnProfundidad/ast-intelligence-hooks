export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

export const hasNode = (
  node: unknown,
  predicate: (value: Record<string, unknown>) => boolean
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
