import assert from 'node:assert/strict';
import test from 'node:test';
import { checkValidationDocsHygiene } from '../validation-docs-hygiene-lib';

test('accepts allowed runbooks and archive reports', () => {
  const result = checkValidationDocsHygiene([
    'docs/validation/README.md',
    'docs/validation/consumer-ci-startup-failure-playbook.md',
    'docs/validation/phase5-execution-closure.md',
    'docs/validation/enterprise-consumer-isolation-policy.md',
    'docs/validation/mock-consumer-integration-runbook.md',
    'docs/validation/archive/skills-rollout-mock_consumer-report.md',
  ]);

  assert.deepEqual(result.violations, []);
});

test('flags generated outputs accidentally tracked in docs/validation root', () => {
  const result = checkValidationDocsHygiene([
    'docs/validation/README.md',
    'docs/validation/consumer-ci-auth-check.md',
    'docs/validation/consumer-support-ticket-draft.md',
    'docs/validation/adapter-session-status.md',
  ]);

  assert.deepEqual(result.violations, [
    'docs/validation/adapter-session-status.md',
    'docs/validation/consumer-ci-auth-check.md',
    'docs/validation/consumer-support-ticket-draft.md',
  ]);
});

test('ignores non-validation paths passed by callers', () => {
  const result = checkValidationDocsHygiene([
    'README.md',
    'docs/README.md',
    'docs/validation/adapter-hook-runtime-validation.md',
  ]);

  assert.deepEqual(result.violations, []);
});
