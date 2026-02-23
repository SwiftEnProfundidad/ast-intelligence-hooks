import type { RuleSet } from '../RuleSet';
import { mergeRuleSets } from '../mergeRuleSets';

import { typescriptRules } from './heuristics/typescript';
import { processRules } from './heuristics/process';
import { securityRules } from './heuristics/security';
import { browserRules } from './heuristics/browser';
import { vmRules } from './heuristics/vm';
import { fsSyncRules } from './heuristics/fsSync';
import { fsPromisesRules } from './heuristics/fsPromises';
import { fsCallbacksRules } from './heuristics/fsCallbacks';
import { iosRules } from './heuristics/ios';
import { androidRules } from './heuristics/android';
import { commonLegacyRules } from './heuristics/commonLegacy';

const heuristicsRuleGroups: RuleSet[] = [
  typescriptRules,
  processRules,
  securityRules,
  browserRules,
  vmRules,
  fsSyncRules,
  fsPromisesRules,
  fsCallbacksRules,
  iosRules,
  androidRules,
  commonLegacyRules,
];

export const astHeuristicsRuleSet: RuleSet = heuristicsRuleGroups.reduce(
  (accumulator, next) => mergeRuleSets(accumulator, next),
  [] as RuleSet
);
