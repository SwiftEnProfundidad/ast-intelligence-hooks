import {
  type FrameworkMenuEvidenceSummary,
} from './framework-menu-evidence-summary-lib';
import {
  buildCliDesignTokens,
  renderBadge,
} from './framework-menu-ui-components-lib';

export const resolveAdvancedStatusBadge = (
  evidenceSummary: FrameworkMenuEvidenceSummary,
  tokens: ReturnType<typeof buildCliDesignTokens>
): string => {
  if (evidenceSummary.status === 'missing') {
    return renderBadge('WARN', 'warn', tokens);
  }
  if (evidenceSummary.status === 'invalid') {
    return renderBadge('BLOCK', 'block', tokens);
  }

  const outcome = (evidenceSummary.outcome ?? 'UNKNOWN').trim().toUpperCase();
  if (outcome === 'PASS') {
    return renderBadge(outcome, 'ok', tokens);
  }
  if (outcome === 'WARN') {
    return renderBadge(outcome, 'warn', tokens);
  }
  if (outcome === 'BLOCK') {
    return renderBadge(outcome, 'block', tokens);
  }
  return renderBadge(outcome, 'info', tokens);
};
