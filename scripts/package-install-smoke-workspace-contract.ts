export type SmokeWorkspace = {
  repoRoot: string;
  reportsDir: string;
  reportRoot: string;
  tmpRoot: string;
  consumerRepo: string;
  bareRemote: string;
  commandLog: string[];
  summary: string[];
  tarballPath?: string;
};
