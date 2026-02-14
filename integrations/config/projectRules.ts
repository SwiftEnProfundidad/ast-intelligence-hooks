import type { RuleSet } from '../../core/rules/RuleSet';

export type ProjectRulesConfig = {
  rules?: RuleSet;
  allowOverrideLocked?: boolean;
};
