import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { rulePackVersions } from '../../core/rules/presets/rulePackVersions';

const readDoc = (relativePath: string): string => {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
};

const assertContainsVersion = (params: {
  label: string;
  markdown: string;
  expected: string;
}): void => {
  assert.match(
    params.markdown,
    new RegExp(params.expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `${params.label} is missing expected version token: ${params.expected}`
  );
};

test('rule-pack documentation stays in sync with rulePackVersions source of truth', () => {
  const docsReadme = readDoc('docs/rule-packs/README.md');
  const iosDoc = readDoc('docs/rule-packs/ios.md');
  const backendDoc = readDoc('docs/rule-packs/backend.md');
  const frontendDoc = readDoc('docs/rule-packs/frontend.md');
  const androidDoc = readDoc('docs/rule-packs/android.md');
  const heuristicsDoc = readDoc('docs/rule-packs/heuristics.md');

  assertContainsVersion({
    label: 'rule-packs README iOS',
    markdown: docsReadme,
    expected: `iosEnterpriseRuleSet@${rulePackVersions.iosEnterpriseRuleSet}`,
  });
  assertContainsVersion({
    label: 'rule-packs README backend',
    markdown: docsReadme,
    expected: `backendRuleSet@${rulePackVersions.backendRuleSet}`,
  });
  assertContainsVersion({
    label: 'rule-packs README frontend',
    markdown: docsReadme,
    expected: `frontendRuleSet@${rulePackVersions.frontendRuleSet}`,
  });
  assertContainsVersion({
    label: 'rule-packs README android',
    markdown: docsReadme,
    expected: `androidRuleSet@${rulePackVersions.androidRuleSet}`,
  });
  assertContainsVersion({
    label: 'rule-packs README heuristics',
    markdown: docsReadme,
    expected: `astHeuristicsRuleSet@${rulePackVersions.astHeuristicsRuleSet}`,
  });
  assertContainsVersion({
    label: 'rule-packs README rulesgold',
    markdown: docsReadme,
    expected: `rulesgold.mdc@${rulePackVersions.rulesgold}`,
  });
  assertContainsVersion({
    label: 'rule-packs README rulesbackend',
    markdown: docsReadme,
    expected: `rulesbackend.mdc@${rulePackVersions.rulesbackend}`,
  });

  assertContainsVersion({
    label: 'iOS rule-pack doc',
    markdown: iosDoc,
    expected: `iosEnterpriseRuleSet@${rulePackVersions.iosEnterpriseRuleSet}`,
  });

  assertContainsVersion({
    label: 'backend rule-pack doc (rulesgold)',
    markdown: backendDoc,
    expected: `rulesgold.mdc@${rulePackVersions.rulesgold}`,
  });
  assertContainsVersion({
    label: 'backend rule-pack doc (rulesbackend)',
    markdown: backendDoc,
    expected: `rulesbackend.mdc@${rulePackVersions.rulesbackend}`,
  });
  assertContainsVersion({
    label: 'backend rule-pack doc (backendRuleSet)',
    markdown: backendDoc,
    expected: `backendRuleSet@${rulePackVersions.backendRuleSet}`,
  });

  assertContainsVersion({
    label: 'frontend rule-pack doc',
    markdown: frontendDoc,
    expected: `frontendRuleSet@${rulePackVersions.frontendRuleSet}`,
  });

  assertContainsVersion({
    label: 'android rule-pack doc',
    markdown: androidDoc,
    expected: `androidRuleSet@${rulePackVersions.androidRuleSet}`,
  });

  assertContainsVersion({
    label: 'heuristics rule-pack doc',
    markdown: heuristicsDoc,
    expected: `astHeuristicsRuleSet@${rulePackVersions.astHeuristicsRuleSet}`,
  });
});
