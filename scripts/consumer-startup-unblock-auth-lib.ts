import type { ParsedAuthReport } from './consumer-support-ticket-parser-lib';

export const hasConsumerStartupUnblockUserScopeGap = (auth?: ParsedAuthReport): boolean => {
  const missingScopes = (auth?.missingScopes ?? '')
    .toLowerCase()
    .split(',')
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0);

  if (missingScopes.includes('user')) {
    return true;
  }

  const billingError = (auth?.billingError ?? '').toLowerCase();
  return billingError.includes('user scope') || billingError.includes('"user" scope');
};
