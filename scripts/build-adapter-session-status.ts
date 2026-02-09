import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { collectAdapterSessionStatusTails } from './adapter-session-status-audit-tail-lib';
import { runAdapterSessionStatusCommands } from './adapter-session-status-command-lib';
import {
  ADAPTER_SESSION_STATUS_COMMANDS,
  buildAdapterSessionStatusMarkdown,
  deriveAdapterSessionVerdictFromCommands,
  exitCodeForAdapterSessionVerdict,
  parseAdapterSessionStatusArgs,
} from './adapter-session-status-report-lib';

const main = (): number => {
  const options = parseAdapterSessionStatusArgs(process.argv.slice(2));

  const commands = runAdapterSessionStatusCommands(ADAPTER_SESSION_STATUS_COMMANDS);
  const verdict = deriveAdapterSessionVerdictFromCommands(commands);
  const repoRoot = resolve(process.cwd());

  const markdown = buildAdapterSessionStatusMarkdown({
    generatedAtIso: new Date().toISOString(),
    options,
    commands,
    verdict,
    tails: collectAdapterSessionStatusTails({
      repoRoot,
      tailLines: options.tailLines,
    }),
  });

  const outputPath = resolve(process.cwd(), options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf8');

  process.stdout.write(
    `adapter session status report generated at ${outputPath} (verdict=${verdict})\n`
  );

  return exitCodeForAdapterSessionVerdict(verdict);
};

process.exitCode = main();
