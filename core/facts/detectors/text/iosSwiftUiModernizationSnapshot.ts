import rawSnapshot from '../../../../assets/rule-packs/ios-swiftui-modernization-v1.json';

export type IosSwiftUiModernizationConfidence = 'HIGH' | 'MEDIUM';
export type IosSwiftUiModernizationStage = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
export type IosSwiftUiModernizationCategory = 'styling' | 'tabs' | 'scrolling';

export type IosSwiftUiModernizationMatch = {
  kind: 'regex';
  pattern: string;
};

export type IosSwiftUiModernizationEntry = {
  id: string;
  ruleId: string;
  heuristicRuleId: string;
  category: IosSwiftUiModernizationCategory;
  legacyApi: string;
  modernApi: string;
  rationale: string;
  confidence: IosSwiftUiModernizationConfidence;
  minimumStage: IosSwiftUiModernizationStage;
  minimumIos: string;
  match: IosSwiftUiModernizationMatch;
};

export type IosSwiftUiModernizationSnapshot = {
  snapshotId: string;
  version: string;
  generatedAt: string;
  sourceSkill: string;
  sourceReferences: readonly string[];
  entries: readonly IosSwiftUiModernizationEntry[];
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isStage = (value: unknown): value is IosSwiftUiModernizationStage =>
  value === 'PRE_COMMIT' || value === 'PRE_PUSH' || value === 'CI';

const isConfidence = (value: unknown): value is IosSwiftUiModernizationConfidence =>
  value === 'HIGH' || value === 'MEDIUM';

const isCategory = (value: unknown): value is IosSwiftUiModernizationCategory =>
  value === 'styling' || value === 'tabs' || value === 'scrolling';

const isMatch = (value: unknown): value is IosSwiftUiModernizationMatch => {
  return (
    isObject(value) &&
    value.kind === 'regex' &&
    isNonEmptyString(value.pattern)
  );
};

const isEntry = (value: unknown): value is IosSwiftUiModernizationEntry => {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.ruleId) &&
    isNonEmptyString(value.heuristicRuleId) &&
    isCategory(value.category) &&
    isNonEmptyString(value.legacyApi) &&
    isNonEmptyString(value.modernApi) &&
    isNonEmptyString(value.rationale) &&
    isConfidence(value.confidence) &&
    isStage(value.minimumStage) &&
    isNonEmptyString(value.minimumIos) &&
    isMatch(value.match)
  );
};

const isSnapshot = (value: unknown): value is IosSwiftUiModernizationSnapshot => {
  return (
    isObject(value) &&
    isNonEmptyString(value.snapshotId) &&
    isNonEmptyString(value.version) &&
    isNonEmptyString(value.generatedAt) &&
    isNonEmptyString(value.sourceSkill) &&
    Array.isArray(value.sourceReferences) &&
    value.sourceReferences.every((item) => isNonEmptyString(item)) &&
    Array.isArray(value.entries) &&
    value.entries.every((entry) => isEntry(entry))
  );
};

const parseSnapshot = (value: unknown): IosSwiftUiModernizationSnapshot => {
  if (!isSnapshot(value)) {
    throw new Error('Invalid iOS SwiftUI modernization snapshot.');
  }
  return value;
};

export const IOS_SWIFTUI_MODERNIZATION_SNAPSHOT = parseSnapshot(rawSnapshot);

const entryById = new Map(
  IOS_SWIFTUI_MODERNIZATION_SNAPSHOT.entries.map((entry) => [entry.id, entry] as const)
);

export const listIosSwiftUiModernizationEntries = (): readonly IosSwiftUiModernizationEntry[] => {
  return IOS_SWIFTUI_MODERNIZATION_SNAPSHOT.entries;
};

export const getIosSwiftUiModernizationEntry = (
  entryId: string
): IosSwiftUiModernizationEntry | undefined => {
  return entryById.get(entryId);
};
