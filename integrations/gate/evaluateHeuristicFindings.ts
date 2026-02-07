import {
  extractHeuristicFacts,
  type ExtractedHeuristicFact,
  type HeuristicExtractionParams,
} from '../../core/facts/extractHeuristicFacts';
import type { Finding } from '../../core/gate/Finding';

const toFinding = (fact: ExtractedHeuristicFact): Finding => {
  return {
    ruleId: fact.ruleId,
    severity: fact.severity,
    code: fact.code,
    message: fact.message,
    filePath: fact.filePath,
  };
};

export { extractHeuristicFacts };
export type { HeuristicExtractionParams, ExtractedHeuristicFact };

export const heuristicFactsToFindings = (
  heuristicFacts: ReadonlyArray<ExtractedHeuristicFact>
): ReadonlyArray<Finding> => {
  return heuristicFacts.map((fact) => toFinding(fact));
};

export const evaluateHeuristicFindings = (
  params: HeuristicExtractionParams
): ReadonlyArray<Finding> => {
  const heuristicFacts = extractHeuristicFacts(params);
  return heuristicFactsToFindings(heuristicFacts);
};
