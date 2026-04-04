export type GateStage =
  | 'STAGED'
  | 'PRE_WRITE'
  | 'PRE_COMMIT'
  | 'PRE_PUSH'
  | 'CI';
