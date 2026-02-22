import { runGitflowCli } from './gitflow-cli-lib';

const exitCode = runGitflowCli(process.argv.slice(2), {
  cwd: process.cwd(),
});

process.exitCode = exitCode;
