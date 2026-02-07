export const rulePackVersions = {
  astHeuristicsRuleSet: '0.3.0',
  iosEnterpriseRuleSet: '1.0.0',
  backendRuleSet: '1.0.0',
  frontendRuleSet: '1.0.0',
  androidRuleSet: '1.0.0',
  rulesgold: '1.0.0',
  rulesbackend: '1.0.0',
} as const;

export type RulePackName = keyof typeof rulePackVersions;
