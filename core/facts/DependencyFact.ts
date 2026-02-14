export interface DependencyFact {
  kind: 'Dependency';
  from: string;
  to: string;
  source: string;
}
