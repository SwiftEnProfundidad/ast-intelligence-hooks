import type { MatrixOptionId } from './framework-menu-matrix-evidence-lib';

export type ConsumerMenuCanaryStage = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
export type ConsumerMenuCanaryPlatform = 'ios' | 'android' | 'backend' | 'frontend';

export type ConsumerMenuCanaryResult = {
  option: MatrixOptionId;
  detected: boolean;
  totalViolations: number;
  filesScanned: number;
  ruleIds: string[];
};

export type ConsumerMenuCanaryScenario = {
  stage: ConsumerMenuCanaryStage;
  platform: ConsumerMenuCanaryPlatform;
  option: MatrixOptionId;
  expectedRuleId: string;
  canaryRelativePath: string;
  canarySource: string;
};
