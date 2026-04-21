import type { RepoTrackingDeclaration, RepoTrackingState } from './schema';
import { resolveRepoTrackingState } from '../lifecycle/trackingState';

export const readRepoTrackingState = (repoRoot: string): RepoTrackingState => {
  const state = resolveRepoTrackingState(repoRoot);

  return {
    enforced: state.enforced,
    canonical_path: state.canonical_path,
    canonical_present: state.canonical_present,
    source_file: state.source_file,
    in_progress_count: state.in_progress_count,
    single_in_progress_valid: state.single_in_progress_valid,
    conflict: state.conflict,
    declarations: state.declarations as ReadonlyArray<RepoTrackingDeclaration>,
  };
};
