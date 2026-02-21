import { runLifecycleAdapterInstall } from '../../integrations/lifecycle/adapter';

type ParsedArgs = {
  agent: string;
  dryRun: boolean;
};

const parseArgs = (argv: ReadonlyArray<string>): ParsedArgs => {
  let agent = '';
  let dryRun = false;
  for (const arg of argv) {
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg.startsWith('--agent=')) {
      agent = arg.slice('--agent='.length).trim();
      continue;
    }
    throw new Error(`Unsupported argument "${arg}".`);
  }
  if (agent.length === 0) {
    throw new Error('Missing --agent=<name>.');
  }
  return {
    agent,
    dryRun,
  };
};

const run = (): number => {
  try {
    const parsed = parseArgs(process.argv.slice(2));
    const result = runLifecycleAdapterInstall({
      agent: parsed.agent,
      dryRun: parsed.dryRun,
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    return 1;
  }
};

process.exitCode = run();
