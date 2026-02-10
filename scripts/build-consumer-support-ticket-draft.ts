import { parseConsumerSupportTicketArgs } from './consumer-support-ticket-cli-lib';
import {
  buildConsumerSupportTicketDraftFromOptions,
  writeConsumerSupportTicketDraft,
} from './consumer-support-ticket-runner-lib';

const main = (): number => {
  const cwd = process.cwd();
  const options = parseConsumerSupportTicketArgs(process.argv.slice(2));

  const draft = buildConsumerSupportTicketDraftFromOptions({
    cwd,
    options,
  });

  const outputPath = writeConsumerSupportTicketDraft({
    cwd,
    outFile: options.outFile,
    draft,
  });

  process.stdout.write(`consumer support ticket draft generated at ${outputPath}\n`);
  return 0;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`consumer support ticket draft failed: ${message}\n`);
  process.exit(1);
}
