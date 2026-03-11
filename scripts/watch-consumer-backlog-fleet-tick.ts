import { existsSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import {
  buildBacklogWatchFleetJsonPayload,
  formatBacklogWatchFleetHumanOutput,
  runBacklogWatchFleet,
  summarizeBacklogWatchFleet,
} from './watch-consumer-backlog-fleet-lib';

type FleetTarget = {
  key: 'saas' | 'ruralgo' | 'flux';
  filePath: string;
  repo?: string;
};

type ParsedArgs = {
  json: boolean;
  failOnFindings: boolean;
  targets: ReadonlyArray<FleetTarget>;
};

const JSON_TOOL_NAME = 'backlog-watch-fleet-tick';
const DEFAULT_REPO = 'SwiftEnProfundidad/ast-intelligence-hooks';
const DEFAULT_TARGETS = {
  saas: resolve(
    homedir(),
    'Developer/Projects/SAAS:APP_SUPERMERCADOS/docs/pumuki/PUMUKI_BUGS_MEJORAS.md'
  ),
  ruralgo: resolve(
    homedir(),
    'Developer/Projects/R_GO/docs/technical/08-validation/refactor/pumuki-integration-feedback.md'
  ),
  flux: resolve(homedir(), 'Developer/Projects/Flux_training/docs/BUGS_Y_MEJORAS_PUMUKI.md'),
} as const;

const HELP_TEXT = `Usage:
  npx --yes tsx@4.21.0 scripts/watch-consumer-backlog-fleet-tick.ts [--json] [--no-fail]
    [--saas=<path>] [--ruralgo=<path>] [--flux=<path>] [--repo=<owner/name>]

Defaults:
  --saas=${DEFAULT_TARGETS.saas}
  --ruralgo=${DEFAULT_TARGETS.ruralgo}
  --flux=${DEFAULT_TARGETS.flux}
  --repo=${DEFAULT_REPO}

Options:
  --json        Imprime salida consolidada JSON.
  --no-fail     No devuelve exit code 1 aunque existan findings accionables.
  --saas=PATH   Override ruta backlog SAAS.
  --ruralgo=PATH Override ruta backlog RuralGo.
  --flux=PATH   Override ruta backlog Flux.
  --repo=NAME   Override repo para targets que consultan upstream.
`;

class HelpRequestedError extends Error {
  constructor() {
    super(HELP_TEXT);
    this.name = 'HelpRequestedError';
  }
}

const parseArgs = (argv: ReadonlyArray<string>): ParsedArgs => {
  let json = false;
  let failOnFindings = true;
  let saasPath = DEFAULT_TARGETS.saas;
  let ruralgoPath = DEFAULT_TARGETS.ruralgo;
  let fluxPath = DEFAULT_TARGETS.flux;
  let repo = DEFAULT_REPO;

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
    if (arg.startsWith('--saas=')) {
      saasPath = resolve(arg.slice('--saas='.length).trim());
      continue;
    }
    if (arg.startsWith('--ruralgo=')) {
      ruralgoPath = resolve(arg.slice('--ruralgo='.length).trim());
      continue;
    }
    if (arg.startsWith('--flux=')) {
      fluxPath = resolve(arg.slice('--flux='.length).trim());
      continue;
    }
    if (arg.startsWith('--repo=')) {
      const value = arg.slice('--repo='.length).trim();
      repo = value.length > 0 ? value : DEFAULT_REPO;
      continue;
    }
    throw new Error(`Unknown argument "${arg}"\n\n${HELP_TEXT}`);
  }

  const targets: FleetTarget[] = [
    { key: 'saas', filePath: saasPath, repo },
    { key: 'ruralgo', filePath: ruralgoPath, repo },
    { key: 'flux', filePath: fluxPath },
  ];

  for (const target of targets) {
    if (!existsSync(target.filePath)) {
      throw new Error(
        `Target backlog not found for ${target.key}: ${target.filePath}\n` +
          `Use --${target.key}=<path> to override.\n\n${HELP_TEXT}`
      );
    }
  }

  return {
    json,
    failOnFindings,
    targets,
  };
};

const main = async (): Promise<void> => {
  const parsed = parseArgs(process.argv.slice(2));
  const results = await runBacklogWatchFleet(parsed.targets);
  const summary = summarizeBacklogWatchFleet(results);

  if (parsed.json) {
    writeFileSync(
      process.stdout.fd,
      `${JSON.stringify(buildBacklogWatchFleetJsonPayload(JSON_TOOL_NAME, results), null, 2)}\n`
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
