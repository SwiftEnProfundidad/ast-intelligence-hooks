import type { RuleSet } from '../../RuleSet';

import { fsPromisesFileOperationsRules } from './fsPromisesFileOperations';
import { fsPromisesMetadataRules } from './fsPromisesMetadataRules';

export const fsPromisesRules: RuleSet = [
  ...fsPromisesFileOperationsRules,
  ...fsPromisesMetadataRules,
];
