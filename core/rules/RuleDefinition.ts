import type { GateStage } from '../gate/GateStage';
import type { Condition } from './Condition';
import type { Consequence } from './Consequence';
import type { Severity } from './Severity';

export interface RuleDefinition {
  id: string;
  description: string;
  severity: Severity;
  when: Condition;
  then: Consequence;
  locked?: boolean;
  platform?: 'ios' | 'android' | 'backend' | 'frontend' | 'text' | 'generic';
  stage?: GateStage;
  scope?: {
    include?: string[];
    exclude?: string[];
  };
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
}
