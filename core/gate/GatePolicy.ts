import type { Severity } from '../rules/Severity';
import type { GateStage } from './GateStage';

export type GatePolicy = {
  stage: GateStage;
  blockOnOrAbove: Severity;
  warnOnOrAbove: Severity;
  defaultSeverity?: Severity;
};
