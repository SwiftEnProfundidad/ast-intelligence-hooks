import {
  buildRuralGoS1EvidencePackMarkdown,
  writeRuralGoS1EvidencePack,
} from './ruralgo-s1-evidence-pack-lib';

type CliOptions = {
  consumerRoot: string;
  outFile: string;
  packageVersion: string;
  generatedAt: string;
};

const parseArgs = (argv: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    consumerRoot: '<RURALGO_REPO_ROOT>',
    outFile: '.audit-reports/ruralgo-s1/ruralgo-s1-evidence-pack.md',
    packageVersion: 'unknown',
    generatedAt: new Date().toISOString(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    switch (token) {
      case '--consumer-root':
        if (!next) {
          throw new Error('missing value for --consumer-root');
        }
        options.consumerRoot = next;
        index += 1;
        break;
      case '--out':
        if (!next) {
          throw new Error('missing value for --out');
        }
        options.outFile = next;
        index += 1;
        break;
      case '--package-version':
        if (!next) {
          throw new Error('missing value for --package-version');
        }
        options.packageVersion = next;
        index += 1;
        break;
      case '--generated-at':
        if (!next) {
          throw new Error('missing value for --generated-at');
        }
        options.generatedAt = next;
        index += 1;
        break;
      default:
        throw new Error(`unknown argument: ${token}`);
    }
  }

  return options;
};

const main = (): number => {
  const cwd = process.cwd();
  const options = parseArgs(process.argv.slice(2));
  const markdown = buildRuralGoS1EvidencePackMarkdown({
    cwd,
    consumerRoot: options.consumerRoot,
    packageVersion: options.packageVersion,
    generatedAt: options.generatedAt,
  });
  const outputPath = writeRuralGoS1EvidencePack({
    cwd,
    outFile: options.outFile,
    markdown,
  });
  process.stdout.write(`ruralgo s1 evidence pack generated at ${outputPath}\n`);
  return 0;
};

try {
  process.exitCode = main();
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`ruralgo s1 evidence pack failed: ${message}\n`);
  process.exitCode = 1;
}
