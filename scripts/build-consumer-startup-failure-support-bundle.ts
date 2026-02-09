import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  buildConsumerSupportBundleMarkdown,
  parseConsumerSupportBundleArgs,
} from './consumer-startup-failure-support-bundle-lib';
import {
  collectConsumerSupportBundleRunDiagnostics,
  ensureConsumerSupportBundleAuth,
  loadConsumerSupportBundleActionsPermissions,
  loadConsumerSupportBundleBillingInfo,
  loadConsumerSupportBundleRepoInfo,
  loadConsumerSupportBundleWorkflowRuns,
} from './consumer-support-bundle-gh-lib';

const main = (): number => {
  const options = parseConsumerSupportBundleArgs(process.argv.slice(2));
  const authStatus = ensureConsumerSupportBundleAuth();
  const repoInfoResult = loadConsumerSupportBundleRepoInfo(options.repo);
  const actionsPermissionsResult = loadConsumerSupportBundleActionsPermissions(options.repo);
  const billingResult = loadConsumerSupportBundleBillingInfo(options.repo);
  const runs = loadConsumerSupportBundleWorkflowRuns(options);
  const diagnostics = collectConsumerSupportBundleRunDiagnostics({
    repo: options.repo,
    runs,
  });

  const markdown = buildConsumerSupportBundleMarkdown({
    generatedAtIso: new Date().toISOString(),
    options,
    authStatus,
    repoInfo: repoInfoResult.ok ? repoInfoResult.data : undefined,
    actionsPermissions: actionsPermissionsResult.ok
      ? actionsPermissionsResult.data
      : undefined,
    actionsPermissionsError: actionsPermissionsResult.ok
      ? undefined
      : actionsPermissionsResult.error,
    billingInfo: billingResult.ok ? billingResult.data : undefined,
    billingError: billingResult.ok ? undefined : billingResult.error,
    runs,
    diagnostics,
  });

  const outputPath = resolve(process.cwd(), options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf8');
  process.stdout.write(
    `consumer startup-failure support bundle generated at ${outputPath}\n`
  );
  return 0;
};

process.exitCode = main();
