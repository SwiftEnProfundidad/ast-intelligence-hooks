import type { Fact } from '../../core/facts/Fact';
import type { IGitService } from './GitService';
import { getFactsForCommitRange } from './getCommitRangeFacts';

export type GateScope =
  | {
    kind: 'staged';
    extensions?: string[];
  }
  | {
    kind: 'range';
    fromRef: string;
    toRef: string;
    extensions?: string[];
  };

const DEFAULT_EXTENSIONS = ['.swift', '.ts', '.tsx', '.js', '.jsx', '.kt', '.kts'];

export const resolveFactsForGateScope = async (params: {
  scope: GateScope;
  git: IGitService;
}): Promise<ReadonlyArray<Fact>> => {
  const extensions = params.scope.extensions ?? DEFAULT_EXTENSIONS;
  if (params.scope.kind === 'staged') {
    return params.git.getStagedFacts(extensions);
  }

  return getFactsForCommitRange({
    fromRef: params.scope.fromRef,
    toRef: params.scope.toRef,
    extensions: [...extensions],
    git: params.git,
  });
};
