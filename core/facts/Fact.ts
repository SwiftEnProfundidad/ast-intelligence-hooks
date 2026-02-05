import type { DependencyFact } from './DependencyFact';
import type { FileChangeFact } from './FileChangeFact';
import type { FileContentFact } from './FileContentFact';

type FactBase = {
  source: string;
};

export type Fact = (FileChangeFact | DependencyFact | FileContentFact) & FactBase;
