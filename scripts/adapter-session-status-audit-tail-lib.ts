import type { AdapterSessionStatusTail } from './adapter-session-status-contract';
import { findLatestAuditFile } from './adapter-session-status-audit-latest-lib';
import { buildAdapterSessionStatusTailEntries } from './adapter-session-status-audit-tail-entries-lib';

export { findLatestAuditFile };

export const collectAdapterSessionStatusTails = (params: {
  repoRoot: string;
  tailLines: number;
}): ReadonlyArray<AdapterSessionStatusTail> => {
  return buildAdapterSessionStatusTailEntries({
    repoRoot: params.repoRoot,
    tailLines: params.tailLines,
  });
};
