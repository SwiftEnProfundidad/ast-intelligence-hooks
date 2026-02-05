import { execFileSync } from 'node:child_process';
import type { Fact } from '../../core/facts/Fact';
import type { FileChangeFact } from '../../core/facts/FileChangeFact';
import type { FileContentFact } from '../../core/facts/FileContentFact';
import type { Finding } from '../../core/gate/Finding';
import type { GateOutcome } from '../../core/gate/GateOutcome';
import type { GatePolicy } from '../../core/gate/GatePolicy';
import type { GateStage } from '../../core/gate/GateStage';
import { evaluateGate } from '../../core/gate/evaluateGate';
import { evaluateRules } from '../../core/gate/evaluateRules';
import { iosEnterpriseRuleSet } from '../../core/rules/presets/iosEnterpriseRuleSet';
import { mergeRuleSets } from '../../core/rules/mergeRuleSets';
import { loadProjectRules } from '../config/loadProjectRules';

type ChangeFact = FileChangeFact & { source: string };
type ContentFact = FileContentFact & { source: string };

type StagedChange = {
  path: string;
  changeType: 'added' | 'modified' | 'deleted';
};

const runGit = (args: ReadonlyArray<string>): string => {
  return execFileSync('git', args, { encoding: 'utf8' });
};

const parseNameStatus = (output: string): StagedChange[] => {
  const trimmed = output.trim();
  if (!trimmed) {
    return [];
  }

  const changes: StagedChange[] = [];
  for (const line of trimmed.split('\n')) {
    if (!line) {
      continue;
    }
    const parts = line.split('\t');
    const status = parts[0];
    const statusCode = status[0];
    const path = statusCode === 'R' || statusCode === 'C' ? parts[2] : parts[1];
    if (!path) {
      continue;
    }
    const changeType =
      statusCode === 'A'
        ? 'added'
        : statusCode === 'M'
          ? 'modified'
          : statusCode === 'D'
            ? 'deleted'
            : statusCode === 'R' || statusCode === 'C'
              ? 'modified'
              : null;
    if (!changeType) {
      continue;
    }
    changes.push({ path, changeType });
  }
  return changes;
};

const createFacts = (changes: ReadonlyArray<StagedChange>): ReadonlyArray<Fact> => {
  const facts: Fact[] = [];
  const source = 'git:staged';

  for (const change of changes) {
    const changeFact: ChangeFact = {
      kind: 'FileChange',
      path: change.path,
      changeType: change.changeType,
      source,
    };
    facts.push(changeFact);

    if (change.changeType === 'deleted') {
      continue;
    }

    const content = runGit(['show', `:${change.path}`]);
    const contentFact: ContentFact = {
      kind: 'FileContent',
      path: change.path,
      content,
      source,
    };
    facts.push(contentFact);
  }

  return facts;
};

export function evaluateStagedIOS(params?: {
  policy?: GatePolicy;
  stage?: GateStage;
}): {
  outcome: GateOutcome;
  findings: Finding[];
} {
  const nameStatus = runGit(['diff', '--cached', '--name-status']);
  const changes = parseNameStatus(nameStatus).filter((change) =>
    change.path.endsWith('.swift')
  );

  if (changes.length === 0) {
    return { outcome: 'PASS', findings: [] };
  }

  const policy: GatePolicy =
    params?.policy ??
    {
      stage: params?.stage ?? 'PRE_COMMIT',
      blockOnOrAbove: 'CRITICAL',
      warnOnOrAbove: 'ERROR',
    };

  const facts = createFacts(changes);
  const projectConfig = loadProjectRules();
  const projectRules = projectConfig?.rules ?? [];
  const mergedRules = mergeRuleSets(iosEnterpriseRuleSet, projectRules, {
    allowDowngradeBaseline: projectConfig?.allowOverrideLocked === true,
  });
  const findings = evaluateRules(mergedRules, facts);
  const decision = evaluateGate(findings, policy);

  return { outcome: decision.outcome, findings };
}
