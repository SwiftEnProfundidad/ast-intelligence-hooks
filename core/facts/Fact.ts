import type { DependencyFact } from './DependencyFact';
import type { FileChangeFact } from './FileChangeFact';
import type { FileContentFact } from './FileContentFact';
import type { HeuristicFact } from './HeuristicFact';

type FactBase = {
  source: string;
};

export type Fact = (FileChangeFact | DependencyFact | FileContentFact | HeuristicFact) & FactBase;
