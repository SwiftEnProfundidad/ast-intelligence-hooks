import { execFileSync } from 'node:child_process';
import { evaluateStagedIOS } from '../evaluateStagedIOS';

jest.mock('node:child_process', () => ({
  execFileSync: jest.fn(),
}));

type GitCall = {
  args: ReadonlyArray<string>;
  output: string;
};

const execFileSyncMock = jest.mocked(execFileSync);

const mockGitCalls = (calls: ReadonlyArray<GitCall>) => {
  execFileSyncMock.mockImplementation((command, args) => {
    if (command !== 'git') {
      throw new Error('Unexpected command');
    }
    const match = calls.find((call) =>
      call.args.length === args.length && call.args.every((value, index) => value === args[index])
    );
    if (!match) {
      throw new Error(`Unexpected git call: ${args.join(' ')}`);
    }
    return match.output;
  });
};

describe('evaluateStagedIOS', () => {
  beforeEach(() => {
    execFileSyncMock.mockReset();
  });

  it('returns PASS when no staged swift files exist', () => {
    mockGitCalls([
      {
        args: ['diff', '--cached', '--name-status'],
        output: 'M\tREADME.md',
      },
    ]);

    const result = evaluateStagedIOS();

    expect(result.outcome).toBe('PASS');
    expect(result.findings).toHaveLength(0);
  });

  it('returns PASS when staged swift file has no violations', () => {
    mockGitCalls([
      {
        args: ['diff', '--cached', '--name-status'],
        output: 'M\tApp/Feature.swift',
      },
      {
        args: ['show', ':App/Feature.swift'],
        output: 'struct Feature { let value = 1 }',
      },
    ]);

    const result = evaluateStagedIOS();

    expect(result.outcome).toBe('PASS');
    expect(result.findings).toHaveLength(0);
  });

  it('returns BLOCK when staged swift file triggers a CRITICAL rule', () => {
    mockGitCalls([
      {
        args: ['diff', '--cached', '--name-status'],
        output: 'M\tApp/View.swift',
      },
      {
        args: ['show', ':App/View.swift'],
        output: 'let view: AnyView',
      },
    ]);

    const result = evaluateStagedIOS();

    expect(result.outcome).toBe('BLOCK');
    expect(result.findings.some((finding) => finding.ruleId === 'ios.no-anyview')).toBe(true);
  });

  it('ignores non-swift staged files', () => {
    mockGitCalls([
      {
        args: ['diff', '--cached', '--name-status'],
        output: 'A\tDocs/readme.md\nM\tconfig.json',
      },
    ]);

    const result = evaluateStagedIOS();

    expect(result.outcome).toBe('PASS');
    expect(result.findings).toHaveLength(0);
  });
});
