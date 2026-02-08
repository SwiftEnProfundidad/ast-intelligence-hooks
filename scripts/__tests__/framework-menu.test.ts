import assert from 'node:assert/strict';
import test from 'node:test';
import { formatActiveSkillsBundles } from '../framework-menu';

test('returns guidance when no active skills bundles are available', () => {
  const rendered = formatActiveSkillsBundles([]);

  assert.equal(
    rendered,
    'No active skills bundles found. Run `npm run skills:compile` to generate skills.lock.json.'
  );
});

test('renders active skills bundles deterministically by name/version', () => {
  const rendered = formatActiveSkillsBundles([
    {
      name: 'ios-guidelines',
      version: '1.0.0',
      hash: 'b'.repeat(64),
    },
    {
      name: 'backend-guidelines',
      version: '1.2.0',
      hash: 'a'.repeat(64),
    },
  ]);

  assert.equal(
    rendered,
    [
      'Active skills bundles:',
      '- backend-guidelines@1.2.0 hash=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '- ios-guidelines@1.0.0 hash=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    ].join('\n')
  );
});
