import { parseCompileSkillsLockArgs } from './compile-skills-lock-args-lib';
import { runCompileSkillsLockCli } from './compile-skills-lock-runner-lib';

const main = (): number => {
  try {
    const options = parseCompileSkillsLockArgs(process.argv.slice(2));
    return runCompileSkillsLockCli(options);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown skills lock compilation error.';
    process.stderr.write(`${message}\n`);
    return 1;
  }
};

process.exitCode = main();
