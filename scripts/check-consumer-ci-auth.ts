import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  buildConsumerCiAuthMarkdown,
  parseAuthScopes,
  parseConsumerCiAuthArgs,
  REQUIRED_CONSUMER_CI_AUTH_SCOPES,
  tryRunGh,
  tryRunGhJson,
  type RepoActionsPermissionsResponse,
  type UserActionsBillingResponse,
} from './consumer-ci-auth-check-lib';

const main = (): number => {
  const options = parseConsumerCiAuthArgs(process.argv.slice(2));
  const owner = options.repo.split('/')[0]?.trim();

  if (!owner) {
    throw new Error('Invalid repo value. Expected owner/repo format.');
  }

  const authStatus = tryRunGh(['auth', 'status']);
  const scopes = authStatus.ok ? parseAuthScopes(authStatus.output ?? '') : [];
  const missingScopes = REQUIRED_CONSUMER_CI_AUTH_SCOPES.filter(
    (scope) => !scopes.includes(scope)
  );

  const actionsPermissions = tryRunGhJson<RepoActionsPermissionsResponse>([
    'api',
    `repos/${options.repo}/actions/permissions`,
  ]);

  const billing = tryRunGhJson<UserActionsBillingResponse>([
    'api',
    `users/${owner}/settings/billing/actions`,
  ]);

  const verdict: 'READY' | 'BLOCKED' =
    authStatus.ok && missingScopes.length === 0 && actionsPermissions.ok
      ? 'READY'
      : 'BLOCKED';

  const markdown = buildConsumerCiAuthMarkdown({
    options,
    authStatus,
    scopes,
    missingScopes,
    actionsPermissions,
    billing,
    verdict,
  });

  const outputPath = resolve(process.cwd(), options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf8');

  process.stdout.write(
    `consumer CI auth check report generated at ${outputPath} (verdict=${verdict})\n`
  );

  return verdict === 'READY' ? 0 : 1;
};

process.exitCode = main();
