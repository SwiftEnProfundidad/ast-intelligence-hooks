import type { RuleSet } from '../../RuleSet';

import { securityCredentialsRules } from './securityCredentialsRules';
import { securityCryptoRules } from './securityCryptoRules';
import { securityJwtRules } from './securityJwtRules';
import { securityTlsRules } from './securityTlsRules';

export const securityRules: RuleSet = [
  ...securityCredentialsRules,
  ...securityCryptoRules,
  ...securityJwtRules,
  ...securityTlsRules,
];
