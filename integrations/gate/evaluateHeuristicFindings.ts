import { parse } from '@babel/parser';
import type { Fact } from '../../core/facts/Fact';
import type { FileContentFact } from '../../core/facts/FileContentFact';
import type { Finding } from '../../core/gate/Finding';

type HeuristicParams = {
  facts: ReadonlyArray<Fact>;
  detectedPlatforms: {
    backend?: { detected: boolean };
    frontend?: { detected: boolean };
  };
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const hasNode = (
  node: unknown,
  predicate: (value: Record<string, unknown>) => boolean
): boolean => {
  if (!isObject(node)) {
    return false;
  }

  if (predicate(node)) {
    return true;
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (hasNode(item, predicate)) {
          return true;
        }
      }
      continue;
    }

    if (isObject(value) && hasNode(value, predicate)) {
      return true;
    }
  }

  return false;
};

const hasEmptyCatchClause = (node: unknown): boolean => {
  return hasNode(node, (value) => {
    if (value.type !== 'CatchClause') {
      return false;
    }
    const body = value.body;
    return isObject(body) && Array.isArray(body.body) && body.body.length === 0;
  });
};

const hasExplicitAnyType = (node: unknown): boolean => {
  return hasNode(node, (value) => value.type === 'TSAnyKeyword');
};

const isSemanticTargetPath = (path: string): boolean => {
  const supportedExtension =
    path.endsWith('.ts') ||
    path.endsWith('.tsx') ||
    path.endsWith('.js') ||
    path.endsWith('.jsx');
  if (!supportedExtension) {
    return false;
  }

  return path.startsWith('apps/backend/') || path.startsWith('apps/frontend/') || path.startsWith('apps/web/');
};

const isTypeScriptPath = (path: string): boolean => {
  return path.endsWith('.ts') || path.endsWith('.tsx');
};

const asFileContentFact = (fact: Fact): FileContentFact | undefined => {
  if (fact.kind !== 'FileContent') {
    return undefined;
  }
  return fact;
};

const hasBackendOrFrontend = (params: HeuristicParams): boolean => {
  return Boolean(params.detectedPlatforms.backend?.detected || params.detectedPlatforms.frontend?.detected);
};

export const evaluateHeuristicFindings = (params: HeuristicParams): Finding[] => {
  if (!hasBackendOrFrontend(params)) {
    return [];
  }

  const findings: Finding[] = [];

  for (const fact of params.facts) {
    const fileFact = asFileContentFact(fact);
    if (!fileFact || !isSemanticTargetPath(fileFact.path)) {
      continue;
    }

    try {
      const ast = parse(fileFact.content, {
        sourceType: 'unambiguous',
        plugins: ['typescript', 'jsx'],
      });

      if (hasEmptyCatchClause(ast)) {
        findings.push({
          ruleId: 'heuristics.ts.empty-catch.ast',
          severity: 'WARN',
          code: 'HEURISTICS_EMPTY_CATCH_AST',
          message: 'AST heuristic detected an empty catch block.',
          filePath: fileFact.path,
        });
      }

      if (isTypeScriptPath(fileFact.path) && hasExplicitAnyType(ast)) {
        findings.push({
          ruleId: 'heuristics.ts.explicit-any.ast',
          severity: 'WARN',
          code: 'HEURISTICS_EXPLICIT_ANY_AST',
          message: 'AST heuristic detected explicit any usage.',
          filePath: fileFact.path,
        });
      }
    } catch {
      continue;
    }
  }

  return findings;
};
