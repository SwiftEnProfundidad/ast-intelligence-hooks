export type CompileSkillsLockCliOptions = {
  check: boolean;
  print: boolean;
  manifestFile?: string;
  outputFile?: string;
};

export const parseCompileSkillsLockArgs = (
  args: ReadonlyArray<string>
): CompileSkillsLockCliOptions => {
  const options: CompileSkillsLockCliOptions = {
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
