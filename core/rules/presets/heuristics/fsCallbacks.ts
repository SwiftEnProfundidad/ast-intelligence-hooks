import type { RuleSet } from '../../RuleSet';

import { fsCallbacksFileOperationsRules } from './fsCallbacksFileOperationsRules';
import { fsCallbacksMetadataRules } from './fsCallbacksMetadataRules';

export const fsCallbacksRules: RuleSet = [
  ...fsCallbacksFileOperationsRules,
  ...fsCallbacksMetadataRules,
];
