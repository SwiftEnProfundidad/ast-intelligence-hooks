const { getGitTreeState, isTreeBeyondLimit, summarizeTreeState } = require('../GitTreeState');
const childProcess = require('child_process');

function makeMockGitStatus(stagedFiles = [], workingFiles = [], untrackedFiles = []) {
  const lines = [];
  stagedFiles.forEach(file => {
    lines.push(`A  ${file}`);
  });
  workingFiles.forEach(file => {
    lines.push(` M ${file}`);
  });
  untrackedFiles.forEach(file => {
    lines.push(`?? ${file}`);
  });
  return lines.join('\n');
}

describe('GitTreeState', () => {
  let execSyncSpy;

  beforeEach(() => {
    execSyncSpy = jest.spyOn(childProcess, 'execSync');
    execSyncSpy.mockReset();
  });

  afterEach(() => {
    execSyncSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('getGitTreeState', () => {
    it('should return state with empty arrays when git tree is clean', () => {
      execSyncSpy.mockReturnValue('');
      const state = getGitTreeState();
      expect(state.stagedFiles).toEqual([]);
      expect(state.workingFiles).toEqual([]);
      expect(state.uniqueCount).toBe(0);
    });

    it('should detect staged files', () => {
      const statusOutput = makeMockGitStatus(['file1.ts', 'file2.ts'], [], []);
      execSyncSpy.mockReturnValue(statusOutput);
      const state = getGitTreeState();
      expect(state.stagedFiles).toHaveLength(2);
      expect(state.stagedCount).toBe(2);
    });

    it('should detect working directory files', () => {
      const statusOutput = makeMockGitStatus([], ['file1.ts', 'file2.ts'], []);
      execSyncSpy.mockReturnValue(statusOutput);
      const state = getGitTreeState();
      expect(state.workingFiles).toHaveLength(2);
      expect(state.workingCount).toBe(2);
    });

    it('should detect untracked files', () => {
      const statusOutput = makeMockGitStatus([], [], ['new-file.ts']);
      execSyncSpy.mockReturnValue(statusOutput);
      const state = getGitTreeState();
      expect(state.workingFiles).toContain('new-file.ts');
    });

    it('should calculate unique count correctly', () => {
      const statusOutput = makeMockGitStatus(['file1.ts'], ['file2.ts'], ['file3.ts']);
      execSyncSpy.mockReturnValue(statusOutput);
      const state = getGitTreeState();
      expect(state.uniqueCount).toBe(3);
    });

    it('should handle files in both staged and working', () => {
      const statusOutput = 'M  file1.ts\n M file1.ts';
      execSyncSpy.mockReturnValue(statusOutput);
      const state = getGitTreeState();
      expect(state.stagedFiles).toContain('file1.ts');
      expect(state.workingFiles).toContain('file1.ts');
      expect(state.uniqueCount).toBe(1);
    });

    it('should use custom repo root', () => {
      execSyncSpy.mockReturnValue('');
      const customRoot = '/custom/repo';
      getGitTreeState({ repoRoot: customRoot });
      expect(execSync).toHaveBeenCalledWith(
        'git status --porcelain',
        expect.objectContaining({ cwd: customRoot })
      );
    });

    it('should handle git errors gracefully', () => {
      execSyncSpy.mockImplementation(() => {
        throw new Error('Not a git repository');
      });
      const state = getGitTreeState();
      expect(state.stagedFiles).toEqual([]);
      expect(state.workingFiles).toEqual([]);
      expect(state.error).toBeDefined();
    });
  });

  describe('isTreeBeyondLimit', () => {
    it('should return false when state is null', () => {
      expect(isTreeBeyondLimit(null, 10)).toBe(false);
    });

    it('should return false when limit is invalid', () => {
      const state = { stagedCount: 5, workingCount: 5 };
      expect(isTreeBeyondLimit(state, 0)).toBe(false);
      expect(isTreeBeyondLimit(state, -1)).toBe(false);
      expect(isTreeBeyondLimit(state, NaN)).toBe(false);
    });

    it('should return true when staged count exceeds limit', () => {
      const state = { stagedCount: 15, workingCount: 5 };
      expect(isTreeBeyondLimit(state, 10)).toBe(true);
    });

    it('should return true when working count exceeds limit', () => {
      const state = { stagedCount: 5, workingCount: 15 };
      expect(isTreeBeyondLimit(state, 10)).toBe(true);
    });

    it('should return false when counts are within limit', () => {
      const state = { stagedCount: 5, workingCount: 5 };
      expect(isTreeBeyondLimit(state, 10)).toBe(false);
    });
  });

  describe('summarizeTreeState', () => {
    it('should summarize clean tree state', () => {
      const state = {
        stagedFiles: [],
        workingFiles: [],
        stagedCount: 0,
        workingCount: 0,
        uniqueCount: 0,
      };
      const summary = summarizeTreeState(state);
      expect(summary).toContain('staged 0');
      expect(summary).toContain('working 0');
      expect(summary).toContain('unique 0');
    });

    it('should summarize state with staged files', () => {
      const state = {
        stagedFiles: ['file1.ts', 'file2.ts'],
        workingFiles: [],
        stagedCount: 2,
        workingCount: 0,
        uniqueCount: 2,
      };
      const summary = summarizeTreeState(state);
      expect(summary).toContain('staged');
      expect(summary).toContain('2');
    });

    it('should summarize state with working files', () => {
      const state = {
        stagedFiles: [],
        workingFiles: ['file1.ts'],
        stagedCount: 0,
        workingCount: 1,
        uniqueCount: 1,
      };
      const summary = summarizeTreeState(state);
      expect(summary).toContain('working');
    });
  });
});

