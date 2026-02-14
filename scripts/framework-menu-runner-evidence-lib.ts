import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const printEvidence = (): void => {
  const evidencePath = resolve(process.cwd(), '.ai_evidence.json');
  if (!existsSync(evidencePath)) {
    process.stdout.write('\n.ai_evidence.json not found in repository root.\n');
    return;
  }

  process.stdout.write('\n');
  process.stdout.write(readFileSync(evidencePath, 'utf8'));
  process.stdout.write('\n');
};
