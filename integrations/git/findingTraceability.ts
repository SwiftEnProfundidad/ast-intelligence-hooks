import type { Fact } from '../../core/facts/Fact';
import type { Finding } from '../../core/gate/Finding';
import type { Condition } from '../../core/rules/Condition';
import type { RuleDefinition } from '../../core/rules/RuleDefinition';
import type { RuleSet } from '../../core/rules/RuleSet';

type Trace = {
  matched: boolean;
  filePath?: string;
  lines?: readonly number[];
  matchedBy?: string;
  source?: string;
};

type RuleScope = RuleDefinition['scope'];

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

const normalizePath = (path: string): string => path.replace(/\\/g, '/');

const sortedUniqueLines = (lines: ReadonlyArray<number>): readonly number[] | undefined => {
  const normalized = Array.from(
    new Set(lines.filter((line) => Number.isFinite(line)).map((line) => Math.trunc(line)))
  ).sort((left, right) => left - right);
  return normalized.length > 0 ? normalized : undefined;
};

const collectContainsLineNumbers = (content: string, tokens: ReadonlyArray<string>): readonly number[] => {
  if (tokens.length === 0) {
    return [];
  }
  const lines = content.split(/\r?\n/);
  const matches: number[] = [];
  lines.forEach((line, index) => {
    if (tokens.some((token) => token.length > 0 && line.includes(token))) {
      matches.push(index + 1);
    }
  });
  return matches;
};

const collectRegexLineNumbers = (content: string, patterns: ReadonlyArray<string>): readonly number[] => {
  if (patterns.length === 0) {
    return [];
  }
  const lines = content.split(/\r?\n/);
  const regexes = patterns.map((pattern) => new RegExp(pattern));
  const matches: number[] = [];
  lines.forEach((line, index) => {
    if (regexes.some((regex) => regex.test(line))) {
      matches.push(index + 1);
    }
  });
  return matches;
};

const pickRepresentativeTrace = (traces: ReadonlyArray<Trace>): Trace | undefined => {
  if (traces.length === 0) {
    return undefined;
  }
  const sortable = traces
    .filter((trace): trace is Trace & { filePath: string } => Boolean(trace.filePath))
    .map((trace) => ({ ...trace, filePath: normalizePath(trace.filePath) }))
    .sort((left, right) => left.filePath.localeCompare(right.filePath));
  if (sortable.length > 0) {
    return sortable[0];
  }
  return traces[0];
};

const traceFileChange = (
  condition: Extract<Condition, { kind: 'FileChange' }>,
  facts: ReadonlyArray<Fact>
): Trace => {
  const matches = facts
    .filter((fact): fact is Extract<Fact, { kind: 'FileChange' }> => fact.kind === 'FileChange')
    .filter((fact) => {
      if (condition.where?.pathPrefix && !fact.path.startsWith(condition.where.pathPrefix)) {
        return false;
      }
      if (condition.where?.changeType && fact.changeType !== condition.where.changeType) {
        return false;
      }
      return true;
    })
    .sort((left, right) => left.path.localeCompare(right.path));

  const selected = matches[0];
  if (!selected) {
    return { matched: false };
  }
  return {
    matched: true,
    filePath: normalizePath(selected.path),
    matchedBy: 'FileChange',
    source: selected.source,
  };
};

const traceFileContent = (
  condition: Extract<Condition, { kind: 'FileContent' }>,
  facts: ReadonlyArray<Fact>,
  scope?: RuleScope
): Trace => {
  const matches = facts
    .filter((fact): fact is Extract<Fact, { kind: 'FileContent' }> => fact.kind === 'FileContent')
    .filter((fact) => matchesScope(fact.path, scope))
    .filter((fact) => {
      const contains = condition.contains;
      if (contains && contains.length > 0 && !contains.every((token) => fact.content.includes(token))) {
        return false;
      }
      const regex = condition.regex;
      if (regex && regex.length > 0) {
        const matchesAll = regex.every((pattern) => new RegExp(pattern).test(fact.content));
        if (!matchesAll) {
          return false;
        }
      }
      return true;
    })
    .sort((left, right) => left.path.localeCompare(right.path));

  const selected = matches[0];
  if (!selected) {
    return { matched: false };
  }

  const containsLines = collectContainsLineNumbers(selected.content, condition.contains ?? []);
  const regexLines = collectRegexLineNumbers(selected.content, condition.regex ?? []);
  const lines = sortedUniqueLines([...containsLines, ...regexLines]);

  return {
    matched: true,
    filePath: normalizePath(selected.path),
    lines,
    matchedBy: 'FileContent',
    source: selected.source,
  };
};

const traceDependency = (
  condition: Extract<Condition, { kind: 'Dependency' }>,
  facts: ReadonlyArray<Fact>
): Trace => {
  const selected = facts
    .filter((fact): fact is Extract<Fact, { kind: 'Dependency' }> => fact.kind === 'Dependency')
    .find((fact) => {
      if (condition.where?.from && fact.from !== condition.where.from) {
        return false;
      }
      if (condition.where?.to && fact.to !== condition.where.to) {
        return false;
      }
      return true;
    });
  if (!selected) {
    return { matched: false };
  }
  return {
    matched: true,
    matchedBy: 'Dependency',
    source: selected.source,
  };
};

const traceHeuristic = (
  condition: Extract<Condition, { kind: 'Heuristic' }>,
  facts: ReadonlyArray<Fact>
): Trace => {
  const matches = facts
    .filter((fact): fact is Extract<Fact, { kind: 'Heuristic' }> => fact.kind === 'Heuristic')
    .filter((fact) => {
      if (condition.where?.ruleId && fact.ruleId !== condition.where.ruleId) {
        return false;
      }
      if (condition.where?.code && fact.code !== condition.where.code) {
        return false;
      }
      if (condition.where?.filePathPrefix) {
        const filePath = fact.filePath ?? '';
        if (!filePath.startsWith(condition.where.filePathPrefix)) {
          return false;
        }
      }
      return true;
    })
    .sort((left, right) => (left.filePath ?? '').localeCompare(right.filePath ?? ''));

  const selected = matches[0];
  if (!selected) {
    return { matched: false };
  }
  return {
    matched: true,
    filePath: selected.filePath ? normalizePath(selected.filePath) : undefined,
    lines: sortedUniqueLines(selected.lines ?? []),
    matchedBy: 'Heuristic',
    source: selected.source,
  };
};

const traceCondition = (
  condition: Condition,
  facts: ReadonlyArray<Fact>,
  scope?: RuleScope
): Trace => {
  if (condition.kind === 'FileChange') {
    return traceFileChange(condition, facts);
  }
  if (condition.kind === 'FileContent') {
    return traceFileContent(condition, facts, scope);
  }
  if (condition.kind === 'Dependency') {
    return traceDependency(condition, facts);
  }
  if (condition.kind === 'Heuristic') {
    return traceHeuristic(condition, facts);
  }
  if (condition.kind === 'All') {
    const childTraces = condition.conditions.map((child) => traceCondition(child, facts, scope));
    if (childTraces.some((trace) => !trace.matched)) {
      return { matched: false };
    }
    const representative = pickRepresentativeTrace(childTraces.filter((trace) => trace.filePath));
    if (!representative) {
      return { matched: true, matchedBy: 'All' };
    }
    const mergedLines = sortedUniqueLines(
      childTraces
        .filter((trace) => trace.filePath && normalizePath(trace.filePath) === representative.filePath)
        .flatMap((trace) => (trace.lines ? [...trace.lines] : []))
    );
    const matchedBy = Array.from(
      new Set(
        childTraces
          .map((trace) => trace.matchedBy)
          .filter((value): value is string => typeof value === 'string' && value.length > 0)
      )
    );
    return {
      matched: true,
      filePath: representative.filePath,
      lines: mergedLines,
      matchedBy: matchedBy.length > 0 ? `All(${matchedBy.join('+')})` : 'All',
      source: representative.source,
    };
  }
  if (condition.kind === 'Any') {
    for (const child of condition.conditions) {
      const trace = traceCondition(child, facts, scope);
      if (trace.matched) {
        return trace;
      }
    }
    return { matched: false };
  }

  const childTrace = traceCondition(condition.condition, facts, scope);
  return {
    matched: !childTrace.matched,
    matchedBy: !childTrace.matched ? 'Not' : undefined,
  };
};

export const attachFindingTraceability = (params: {
  findings: ReadonlyArray<Finding>;
  rules: RuleSet;
  facts: ReadonlyArray<Fact>;
}): ReadonlyArray<Finding> => {
  const ruleById = new Map<string, RuleDefinition>();
  for (const rule of params.rules) {
    ruleById.set(rule.id, rule);
  }

  return params.findings.map((finding) => {
    const rule = ruleById.get(finding.ruleId);
    if (!rule) {
      return finding;
    }

    const trace = traceCondition(rule.when, params.facts, rule.scope);
    if (!trace.matched) {
      return finding;
    }

    return {
      ...finding,
      filePath: finding.filePath ?? trace.filePath,
      lines: finding.lines ?? trace.lines,
      matchedBy: finding.matchedBy ?? trace.matchedBy,
      source: finding.source ?? trace.source,
    };
  });
};
