export type { Fact } from './Fact';
export type { FactSet } from './FactSet';
export type { FileChangeFact } from './FileChangeFact';
export type { DependencyFact } from './DependencyFact';
export type { FileContentFact } from './FileContentFact';
export type { HeuristicFact } from './HeuristicFact';
export {
  extractHeuristicFacts,
  type HeuristicExtractionParams,
  type ExtractedHeuristicFact,
} from './extractHeuristicFacts';
