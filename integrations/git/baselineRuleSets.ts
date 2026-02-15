import { androidRuleSet } from '../../core/rules/presets/androidRuleSet';
import { backendRuleSet } from '../../core/rules/presets/backendRuleSet';
import { frontendRuleSet } from '../../core/rules/presets/frontendRuleSet';
import { iosEnterpriseRuleSet } from '../../core/rules/presets/iosEnterpriseRuleSet';
import { rulePackVersions } from '../../core/rules/presets/rulePackVersions';
import type { RuleSet } from '../../core/rules/RuleSet';
import type { DetectedPlatforms } from '../platform/detectPlatforms';
import type { BaselineRuleSetEntry } from './EvidenceService';

export const buildCombinedBaselineRules = (detected: DetectedPlatforms): RuleSet => {
  const rules: RuleSet[number][] = [];
  if (detected.ios) {
    rules.push(...iosEnterpriseRuleSet);
  }
  if (detected.backend) {
    rules.push(...backendRuleSet);
  }
  if (detected.frontend) {
    rules.push(...frontendRuleSet);
  }
  if (detected.android) {
    rules.push(...androidRuleSet);
  }
  return rules;
};

export const buildBaselineRuleSetEntries = (detected: DetectedPlatforms): BaselineRuleSetEntry[] => {
  const entries: BaselineRuleSetEntry[] = [];
  if (detected.ios) {
    entries.push({
      platform: 'ios',
      bundle: `iosEnterpriseRuleSet@${rulePackVersions.iosEnterpriseRuleSet}`,
      rules: iosEnterpriseRuleSet,
    });
  }
  if (detected.backend) {
    entries.push({
      platform: 'backend',
      bundle: `backendRuleSet@${rulePackVersions.backendRuleSet}`,
      rules: backendRuleSet,
    });
  }
  if (detected.frontend) {
    entries.push({
      platform: 'frontend',
      bundle: `frontendRuleSet@${rulePackVersions.frontendRuleSet}`,
      rules: frontendRuleSet,
    });
  }
  if (detected.android) {
    entries.push({
      platform: 'android',
      bundle: `androidRuleSet@${rulePackVersions.androidRuleSet}`,
      rules: androidRuleSet,
    });
  }
  return entries;
};
