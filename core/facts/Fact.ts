import type { DependencyFact } from './DependencyFact';
import type { FileChangeFact } from './FileChangeFact';

type FactBase = {
  source: string;
};

export type Fact = (FileChangeFact | DependencyFact) & FactBase;
