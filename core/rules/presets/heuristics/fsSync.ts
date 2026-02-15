import type { RuleSet } from '../../RuleSet';

import { fsSyncAppendRules } from './fsSyncAppendRules';
import { fsSyncDescriptorRules } from './fsSyncDescriptorRules';
import { fsSyncFileOperationsRules } from './fsSyncFileOperationsRules';
import { fsSyncPathRules } from './fsSyncPathRules';

export const fsSyncRules: RuleSet = [
  ...fsSyncFileOperationsRules,
  ...fsSyncDescriptorRules,
  ...fsSyncPathRules,
  ...fsSyncAppendRules,
];
