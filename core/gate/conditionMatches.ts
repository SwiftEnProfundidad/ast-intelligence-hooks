import type { Condition } from '../rules/Condition';
import type { RuleDefinition } from '../rules/RuleDefinition';
import type { Fact } from '../facts/Fact';
import type { DependencyFact } from '../facts/DependencyFact';
import type { FileChangeFact } from '../facts/FileChangeFact';
import type { FileContentFact } from '../facts/FileContentFact';

type RuleScope = RuleDefinition['scope'];

type FactInput = Fact | FileChangeFact | FileContentFact;

type FactMatch = {
  facts: ReadonlyArray<FactInput>;
  scope?: RuleScope;
};

const isFileChangeFact = (fact: FactInput): fact is FileChangeFact =>
  fact.kind === 'FileChange';

const isFileContentFact = (fact: FactInput): fact is FileContentFact =>
  fact.kind === 'FileContent';

const isDependencyFact = (fact: FactInput): fact is DependencyFact =>
  fact.kind === 'Dependency';

const extractPrefix = (pattern: string): string => {
  const wildcardIndex = pattern.indexOf('*');
  return wildcardIndex === -1 ? pattern : pattern.slice(0, wildcardIndex);
};

const matchesAnyPrefix = (path: string, patterns: ReadonlyArray<string>): boolean => {
  return patterns.some((pattern) => path.startsWith(extractPrefix(pattern)));
};

const matchesScope = (path: string, scope?: RuleScope): boolean => {
  const include = scope?.include;
  const exclude = scope?.exclude;
  if (exclude && exclude.length > 0 && matchesAnyPrefix(path, exclude)) {
    return false;
  }
  if (!include || include.length === 0) {
    return true;
  }
  return matchesAnyPrefix(path, include);
};

const matchesFileChange = (
  condition: Extract<Condition, { kind: 'FileChange' }>,
  facts: ReadonlyArray<FactInput>
): boolean => {
  for (const fact of facts) {
    if (!isFileChangeFact(fact)) {
      continue;
    }
    if (condition.where?.pathPrefix && !fact.path.startsWith(condition.where.pathPrefix)) {
      continue;
    }
    if (condition.where?.changeType && fact.changeType !== condition.where.changeType) {
      continue;
    }
    return true;
  }
  return false;
};

const matchesDependency = (
  condition: Extract<Condition, { kind: 'Dependency' }>,
  facts: ReadonlyArray<FactInput>
): boolean => {
  for (const fact of facts) {
    if (!isDependencyFact(fact)) {
      continue;
    }
    if (condition.where?.from && fact.from !== condition.where.from) {
      continue;
    }
    if (condition.where?.to && fact.to !== condition.where.to) {
      continue;
    }
    return true;
  }
  return false;
};

const matchesFileContent = (
  condition: Extract<Condition, { kind: 'FileContent' }>,
  match: FactMatch
): boolean => {
  const contains = condition.contains;
  const regex = condition.regex;

  for (const fact of match.facts) {
    if (!isFileContentFact(fact)) {
      continue;
    }
    if (!matchesScope(fact.path, match.scope)) {
      continue;
    }
    if (contains && contains.length > 0 && !contains.every((token) => fact.content.includes(token))) {
      continue;
    }
    if (regex && regex.length > 0) {
      const matchesAll = regex.every((pattern) => new RegExp(pattern).test(fact.content));
      if (!matchesAll) {
        continue;
      }
    }
    return true;
  }

  return false;
};

export const conditionMatches = (
  condition: Condition,
  facts: ReadonlyArray<FactInput>,
  scope?: RuleScope
): boolean => {
  const match: FactMatch = { facts, scope };

  if (condition.kind === 'FileChange') {
    return matchesFileChange(condition, facts);
  }

  if (condition.kind === 'FileContent') {
    return matchesFileContent(condition, match);
  }

  if (condition.kind === 'Dependency') {
    return matchesDependency(condition, facts);
  }

  if (condition.kind === 'All') {
    return condition.conditions.every((child) => conditionMatches(child, facts, scope));
  }

  if (condition.kind === 'Any') {
    return condition.conditions.some((child) => conditionMatches(child, facts, scope));
  }

  return !conditionMatches(condition.condition, facts, scope);
};
