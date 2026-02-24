export type AstDetectorLanguage = 'typescript' | 'swift' | 'kotlin' | 'generic';

export type AstDetectorContractEntry = {
  language: AstDetectorLanguage;
  ruleIdPrefix: string;
  detectorModules: ReadonlyArray<string>;
  locatorConvention: 'has* + find*Lines';
};

export const AST_DETECTOR_CONTRACT: ReadonlyArray<AstDetectorContractEntry> = [
  {
    language: 'typescript',
    ruleIdPrefix: 'heuristics.ts.',
    detectorModules: [
      'core/facts/detectors/typescript/index.ts',
      'core/facts/detectors/process/*',
      'core/facts/detectors/security/*',
      'core/facts/detectors/browser/*',
      'core/facts/detectors/vm/*',
      'core/facts/detectors/fs/*',
    ],
    locatorConvention: 'has* + find*Lines',
  },
  {
    language: 'typescript',
    ruleIdPrefix: 'common.',
    detectorModules: ['core/facts/detectors/typescript/index.ts'],
    locatorConvention: 'has* + find*Lines',
  },
  {
    language: 'swift',
    ruleIdPrefix: 'heuristics.ios.',
    detectorModules: ['core/facts/detectors/text/ios.ts'],
    locatorConvention: 'has* + find*Lines',
  },
  {
    language: 'kotlin',
    ruleIdPrefix: 'heuristics.android.',
    detectorModules: ['core/facts/detectors/text/android.ts'],
    locatorConvention: 'has* + find*Lines',
  },
  {
    language: 'generic',
    ruleIdPrefix: 'workflow.bdd.',
    detectorModules: ['core/facts/extractHeuristicFacts.ts'],
    locatorConvention: 'has* + find*Lines',
  },
];

export const resolveAstDetectorLanguageByRuleId = (
  ruleId: string
): AstDetectorLanguage | null => {
  const normalized = ruleId.trim().toLowerCase();
  if (normalized.length === 0) {
    return null;
  }
  for (const entry of AST_DETECTOR_CONTRACT) {
    if (normalized.startsWith(entry.ruleIdPrefix.toLowerCase())) {
      return entry.language;
    }
  }
  return null;
};
