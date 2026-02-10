import { parseCompileSkillsLockArgs } from './compile-skills-lock-args-lib';
import { runCompileSkillsLockCli } from './compile-skills-lock-runner-lib';

const main = (): number => {
  const options = parseCompileSkillsLockArgs(process.argv.slice(2));
  return runCompileSkillsLockCli(options);
};

process.exitCode = main();
