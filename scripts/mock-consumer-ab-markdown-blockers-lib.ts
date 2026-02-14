export const buildMockConsumerAbBlockersLines = (
  blockers: ReadonlyArray<string>
): ReadonlyArray<string> => {
  if (blockers.length === 0) {
    return ['## Blockers', '', '- none', ''];
  }

  return ['## Blockers', '', ...blockers.map((blocker) => `- ${blocker}`), ''];
};
