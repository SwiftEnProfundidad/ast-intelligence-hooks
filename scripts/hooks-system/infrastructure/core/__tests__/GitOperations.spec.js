const { GitOperations } = require('../GitOperations');
const { execSync } = require('child_process');

jest.mock('child_process');

function makeMockGitOutput(files) {
  return files.join('\n') + (files.length > 0 ? '\n' : '');
}

describe('GitOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStagedFiles', () => {
    it('should return array of staged files', () => {
      const mockFiles = ['file1.ts', 'file2.ts', 'file3.ts'];
      execSync.mockReturnValue(makeMockGitOutput(mockFiles));
      const files = GitOperations.getStagedFiles();
      expect(files).toEqual(mockFiles);
      expect(execSync).toHaveBeenCalledWith(
        'git diff --cached --name-only --diff-filter=ACM',
        { encoding: 'utf8' }
      );
    });

    it('should return empty array when no staged files', () => {
      execSync.mockReturnValue('');
      const files = GitOperations.getStagedFiles();
      expect(files).toEqual([]);
    });

    it('should filter out empty lines', () => {
      execSync.mockReturnValue('file1.ts\n\nfile2.ts\n');
      const files = GitOperations.getStagedFiles();
      expect(files).toEqual(['file1.ts', 'file2.ts']);
    });

    it('should return empty array on git error', () => {
      execSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });
      const files = GitOperations.getStagedFiles();
      expect(files).toEqual([]);
    });
  });

  describe('getWorkingDirectoryFiles', () => {
    it('should return array of working directory files', () => {
      const mockFiles = ['file1.ts', 'file2.ts'];
      execSync.mockReturnValue(makeMockGitOutput(mockFiles));
      const files = GitOperations.getWorkingDirectoryFiles();
      expect(files).toEqual(mockFiles);
      expect(execSync).toHaveBeenCalledWith(
        'git diff --name-only --diff-filter=ACM',
        { encoding: 'utf8' }
      );
    });

    it('should return empty array when no working files', () => {
      execSync.mockReturnValue('');
      const files = GitOperations.getWorkingDirectoryFiles();
      expect(files).toEqual([]);
    });

    it('should return empty array on git error', () => {
      execSync.mockImplementation(() => {
        throw new Error('Git error');
      });
      const files = GitOperations.getWorkingDirectoryFiles();
      expect(files).toEqual([]);
    });
  });

  describe('getAllChangedFiles', () => {
    it('should return array of all changed files', () => {
      const mockFiles = ['staged1.ts', 'staged2.ts', 'working1.ts'];
      execSync.mockReturnValue(makeMockGitOutput(mockFiles));
      const files = GitOperations.getAllChangedFiles();
      expect(files).toEqual(mockFiles);
    });

    it('should combine staged and working files', () => {
      execSync.mockReturnValue('staged.ts\nworking.ts\n');
      const files = GitOperations.getAllChangedFiles();
      expect(files).toContain('staged.ts');
      expect(files).toContain('working.ts');
    });

    it('should return empty array on git error', () => {
      execSync.mockImplementation(() => {
        throw new Error('Git error');
      });
      const files = GitOperations.getAllChangedFiles();
      expect(files).toEqual([]);
    });
  });

  describe('isInGitRepository', () => {
    it('should return true when in git repository', () => {
      execSync.mockReturnValue('.git');
      const isGit = GitOperations.isInGitRepository();
      expect(isGit).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        'git rev-parse --git-dir',
        { stdio: 'ignore' }
      );
    });

    it('should return false when not in git repository', () => {
      execSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });
      const isGit = GitOperations.isInGitRepository();
      expect(isGit).toBe(false);
    });
  });

  describe('getRepositoryRoot', () => {
    it('should return repository root path', () => {
      const mockRoot = '/path/to/repo';
      execSync.mockReturnValue(mockRoot + '\n');
      const root = GitOperations.getRepositoryRoot();
      expect(root).toBe(mockRoot);
      expect(execSync).toHaveBeenCalledWith(
        'git rev-parse --show-toplevel',
        { encoding: 'utf8' }
      );
    });

    it('should return current working directory on error', () => {
      execSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });
      const root = GitOperations.getRepositoryRoot();
      expect(root).toBe(process.cwd());
    });

    it('should trim whitespace from root path', () => {
      execSync.mockReturnValue('  /path/to/repo  \n');
      const root = GitOperations.getRepositoryRoot();
      expect(root).toBe('/path/to/repo');
    });
  });
});

