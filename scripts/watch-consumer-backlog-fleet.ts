import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildBacklogWatchFleetJsonPayload,
  formatBacklogWatchFleetHumanOutput,
  runBacklogWatchFleet,
  summarizeBacklogWatchFleet,
} from './watch-consumer-backlog-fleet-lib';

type FleetTarget = {
  filePath: string;
  repo?: string;
};

type ParsedArgs = {
  targets: ReadonlyArray<FleetTarget>;
  json: boolean;
  failOnFindings: boolean;
};

const JSON_TOOL_NAME = 'backlog-watch-fleet';

const HELP_TEXT = `Usage:
  npx --yes tsx@4.21.0 scripts/watch-consumer-backlog-fleet.ts --target=<markdown-path>[::owner/name] [--target=<markdown-path>[::owner/name] ...] [--json] [--no-fail]

Options:
  --target=<path>[::repo]  Backlog markdown consumidor a vigilar. Puedes repetir el flag.
                           Ejemplo: --target=/repo/docs/backlog.md::owner/name
  --json                   Imprime resultado consolidado en JSON.
  --no-fail                No devuelve exit code 1 aunque existan findings accionables.
`;

class HelpRequestedError extends Error {
  constructor() {
    super(HELP_TEXT);
    this.name = 'HelpRequestedError';
  }
}

const parseTarget = (rawTarget: string): FleetTarget => {
  const trimmed = rawTarget.trim();
  const separatorIndex = trimmed.indexOf('::');
  if (separatorIndex === -1) {
    return {
      filePath: resolve(trimmed),
    };
  }
  const filePath = trimmed.slice(0, separatorIndex).trim();
  const repo = trimmed.slice(separatorIndex + 2).trim();
  return {
    filePath: resolve(filePath),
    repo: repo.length > 0 ? repo : undefined,
  };
};

const parseArgs = (argv: ReadonlyArray<string>): ParsedArgs => {
  const targets: FleetTarget[] = [];
  let json = false;
  let failOnFindings = true;

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      throw new HelpRequestedError();
    }
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (arg === '--no-fail') {
      failOnFindings = false;
      continue;
    }
    if (arg.startsWith('--target=')) {
      const rawTarget = arg.slice('--target='.length);
      if (rawTarget.trim().length === 0) {
        throw new Error(`Invalid --target (empty value)\n\n${HELP_TEXT}`);
      }
      targets.push(parseTarget(rawTarget));
      continue;
    }
    throw new Error(`Unknown argument "${arg}"\n\n${HELP_TEXT}`);
  }

  if (targets.length === 0) {
    throw new Error(`Missing --target\n\n${HELP_TEXT}`);
  }

  return {
    targets,
    json,
    failOnFindings,
  };
};

const main = async (): Promise<void> => {
  const parsed = parseArgs(process.argv.slice(2));
  const results = await runBacklogWatchFleet(parsed.targets);
  const summary = summarizeBacklogWatchFleet(results);

  if (parsed.json) {
    writeFileSync(
      process.stdout.fd,
      `${JSON.stringify(
        {
          ...buildBacklogWatchFleetJsonPayload(JSON_TOOL_NAME, results),
          invocation: {
            mode: 'json',
            targets_count: parsed.targets.length,
          },
        },
        null,
        2
      )}\n`
    );
  } else {
    writeFileSync(process.stdout.fd, formatBacklogWatchFleetHumanOutput(JSON_TOOL_NAME, results));
  }

  if (parsed.failOnFindings && summary.hasActionRequired) {
    process.exitCode = 1;
  }
};

main().catch((error: unknown) => {
  if (error instanceof HelpRequestedError) {
    writeFileSync(process.stdout.fd, `${HELP_TEXT}\n`);
    process.exitCode = 0;
    return;
  }
  const message = error instanceof Error ? error.message : String(error);
  writeFileSync(process.stderr.fd, `${message}\n`);
  process.exitCode = 1;
});
