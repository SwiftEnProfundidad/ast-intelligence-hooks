import { createSkillsLockDeterministicHash } from '../integrations/config/skillsLock';
import {
  checkSkillsLockStatus,
  compileSkillsLock,
  writeSkillsLock,
} from '../integrations/config/compileSkillsLock';
import type { CompileSkillsLockCliOptions } from './compile-skills-lock-args-lib';

const runCompileSkillsLockCheck = (options: CompileSkillsLockCliOptions): number => {
  const check = checkSkillsLockStatus({
    manifestFile: options.manifestFile,
    lockFile: options.outputFile,
  });

  process.stdout.write(`${check.status.toUpperCase()}: ${check.details}\n`);
  return check.status === 'fresh' ? 0 : 1;
};

const runCompileSkillsLockBuild = (options: CompileSkillsLockCliOptions): number => {
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

export const runCompileSkillsLockCli = (
  options: CompileSkillsLockCliOptions
): number => {
  if (options.check) {
    return runCompileSkillsLockCheck(options);
  }

  return runCompileSkillsLockBuild(options);
};
