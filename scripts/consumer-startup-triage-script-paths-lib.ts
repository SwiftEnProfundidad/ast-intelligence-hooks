import { fileURLToPath } from 'node:url';

const SCRIPTS_PREFIX = 'scripts/';

export const resolveConsumerStartupTriageScript = (
  moduleUrl: string,
  displayScript: string
): { displayScript: string; scriptPath: string } => {
  const relativeScript = displayScript.startsWith(SCRIPTS_PREFIX)
    ? displayScript.slice(SCRIPTS_PREFIX.length)
    : displayScript;

  return {
    displayScript,
    scriptPath: fileURLToPath(new URL(`./${relativeScript}`, moduleUrl)),
  };
};
