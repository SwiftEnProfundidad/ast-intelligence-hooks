import { createSkillsLockDeterministicHash } from '../integrations/config/skillsLock';
import {
  checkSkillsLockStatus,
  compileSkillsLock,
  writeSkillsLock,
} from '../integrations/config/compileSkillsLock';

type CliOptions = {
  check: boolean;
  print: boolean;
  manifestFile?: string;
  outputFile?: string;
};

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    check: false,
    print: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--check') {
      options.check = true;
      continue;
    }

    if (arg === '--print') {
      options.print = true;
      continue;
    }

    if (arg === '--manifest') {
      const nextValue = args[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for --manifest');
      }
      options.manifestFile = nextValue;
      index += 1;
      continue;
    }

    if (arg === '--output') {
      const nextValue = args[index + 1];
      if (!nextValue) {
        throw new Error('Missing value for --output');
      }
      options.outputFile = nextValue;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

const main = (): number => {
  const options = parseArgs(process.argv.slice(2));

  if (options.check) {
    const check = checkSkillsLockStatus({
      manifestFile: options.manifestFile,
      lockFile: options.outputFile,
    });

    process.stdout.write(`${check.status.toUpperCase()}: ${check.details}\n`);
    return check.status === 'fresh' ? 0 : 1;
  }

  const lock = compileSkillsLock({
    manifestFile: options.manifestFile,
  });
  const lockHash = createSkillsLockDeterministicHash(lock);

  if (options.print) {
    process.stdout.write(`${JSON.stringify(lock, null, 2)}\n`);
    process.stdout.write(`skills.lock hash: ${lockHash}\n`);
    return 0;
  }

  const outputPath = writeSkillsLock(lock, {
    outputFile: options.outputFile,
  });

  process.stdout.write(`skills.lock generated at ${outputPath}\n`);
  process.stdout.write(`skills.lock hash: ${lockHash}\n`);
  return 0;
};

process.exitCode = main();
