export type BacklogIssueState = 'OPEN' | 'CLOSED';
export type BacklogStatusEmoji = '✅' | '🚧' | '⏳' | '⛔';

export type BacklogIssueNumberResolver = (
  backlogId: string,
  repo?: string
) => number | null | Promise<number | null>;
