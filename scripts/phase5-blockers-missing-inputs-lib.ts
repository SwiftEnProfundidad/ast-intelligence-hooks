export const collectPhase5BlockersMissingInputs = (params: {
  hasAdapterReport: boolean;
  hasConsumerTriageReport: boolean;
  adapterRequired: boolean;
}): string[] => {
  const missingInputs: string[] = [];

  if (params.adapterRequired && !params.hasAdapterReport) {
    missingInputs.push('Missing Adapter real-session report');
  }
  if (!params.hasConsumerTriageReport) {
    missingInputs.push('Missing consumer startup triage report');
  }

  return missingInputs;
};
