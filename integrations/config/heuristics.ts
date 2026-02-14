export type HeuristicsConfig = {
  astSemanticEnabled: boolean;
};

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

const parseBooleanFlag = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }
  return TRUE_VALUES.has(value.trim().toLowerCase());
};

export const loadHeuristicsConfig = (): HeuristicsConfig => {
  return {
    astSemanticEnabled: parseBooleanFlag(process.env.PUMUKI_ENABLE_AST_HEURISTICS),
  };
};
