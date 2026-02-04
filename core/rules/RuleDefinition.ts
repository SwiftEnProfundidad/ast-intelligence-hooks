export interface RuleDefinition {
  id: string;
  description: string;
  severity: 'INFO' | 'WARN' | 'BLOCK';
  when: object;
  then: object;
}
