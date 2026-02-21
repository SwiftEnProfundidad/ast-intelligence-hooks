export type HeuristicsConfig = {
  astSemanticEnabled: boolean;
  typeScriptScope: 'platform' | 'all';
};

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const TS_SCOPE_ALL_VALUES = new Set(['all', 'repo', 'full']);

const parseBooleanFlag = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }
  return TRUE_VALUES.has(value.trim().toLowerCase());
};

export const loadHeuristicsConfig = (): HeuristicsConfig => {
  const rawTsScope = process.env.PUMUKI_HEURISTICS_TS_SCOPE?.trim().toLowerCase();
  return {
    astSemanticEnabled: parseBooleanFlag(process.env.PUMUKI_ENABLE_AST_HEURISTICS),
    typeScriptScope: rawTsScope && TS_SCOPE_ALL_VALUES.has(rawTsScope) ? 'all' : 'platform',
  };
};
