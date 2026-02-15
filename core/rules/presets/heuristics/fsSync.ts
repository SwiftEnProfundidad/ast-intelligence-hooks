import type { RuleSet } from '../../RuleSet';

import { fsSyncDescriptorRules } from './fsSyncDescriptorRules';
import { fsSyncFileOperationsRules } from './fsSyncFileOperations';

export const fsSyncRules: RuleSet = [
  ...fsSyncFileOperationsRules,
  ...fsSyncDescriptorRules,
];
