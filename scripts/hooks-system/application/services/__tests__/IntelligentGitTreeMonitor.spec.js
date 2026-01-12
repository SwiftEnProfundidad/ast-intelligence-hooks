jest.mock('../GitTreeState', () => ({
  getGitTreeState: jest.fn(),
}));

jest.mock('../logging/AuditLogger', () => {
  return jest.fn().mockImplementation(() => ({
    record: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }));
});

jest.mock('../IntelligentCommitAnalyzer');

const IntelligentGitTreeMonitor = require('../IntelligentGitTreeMonitor');
const IntelligentCommitAnalyzer = require('../IntelligentCommitAnalyzer');
const { getGitTreeState } = require('../GitTreeState');

function makeSUT(options = {}) {
  const defaultOptions = {
    repoRoot: '/test/repo',
    notifier: jest.fn(),
    logger: { log: jest.fn(), error: jest.fn() },
    autoCommitEnabled: false,
    ...options,
  };
  return new IntelligentGitTreeMonitor(defaultOptions);
}

describe('IntelligentGitTreeMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getGitTreeState.mockReset();
    IntelligentCommitAnalyzer.prototype.analyzeAndSuggestCommits = jest.fn();
    IntelligentCommitAnalyzer.prototype.getReadyCommits = jest.fn();
    IntelligentCommitAnalyzer.prototype.getNeedsAttention = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided options', () => {
      const notifier = jest.fn();
      const logger = { log: jest.fn() };
      const monitor = makeSUT({ notifier, logger, autoCommitEnabled: true });
      expect(monitor.notifier).toBe(notifier);
      expect(monitor.logger).toBe(logger);
      expect(monitor.autoCommitEnabled).toBe(true);
    });

    it('should use default values when options not provided', () => {
      const monitor = makeSUT();
      expect(monitor.repoRoot).toBeDefined();
      expect(monitor.autoCommitEnabled).toBe(false);
    });

    it('should create IntelligentCommitAnalyzer instance', () => {
      const monitor = makeSUT();
      expect(monitor.analyzer).toBeDefined();
    });
  });

  describe('analyze', () => {
    it('should return clean action when git tree is clean', async () => {
      getGitTreeState.mockReturnValue({
        uniqueCount: 0,
        stagedFiles: [],
        workingFiles: [],
      });
      IntelligentCommitAnalyzer.prototype.analyzeAndSuggestCommits.mockResolvedValue([]);
      IntelligentCommitAnalyzer.prototype.getReadyCommits.mockReturnValue([]);
      IntelligentCommitAnalyzer.prototype.getNeedsAttention.mockReturnValue([]);
      const monitor = makeSUT();
      const result = await monitor.analyze();
      expect(result.action).toBe('clean');
      expect(result.message).toContain('clean');
    });

    it('should analyze files and suggest commits when ready', async () => {
      const mockReadyCommits = [
        {
          files: ['file1.ts', 'file2.ts'],
          commitMessage: 'feat: add feature',
          feature: 'feature-a',
          module: 'module-a',
          platform: 'backend',
        },
      ];
      IntelligentCommitAnalyzer.prototype.analyzeAndSuggestCommits.mockResolvedValue([]);
      IntelligentCommitAnalyzer.prototype.getReadyCommits.mockReturnValue(mockReadyCommits);
      IntelligentCommitAnalyzer.prototype.getNeedsAttention.mockReturnValue([]);

      getGitTreeState.mockReturnValue({
        uniqueCount: 2,
        stagedFiles: ['file1.ts'],
        workingFiles: ['file2.ts'],
      });

      const monitor = makeSUT();
      const result = await monitor.analyze();

      expect(result.action).toBe('suggest_commit');
      expect(result.readyCommits).toEqual(mockReadyCommits);
      expect(result.message).toContain('ready to commit');
    });

    it('should return too_many_features when suggestions exceed threshold', async () => {
      const manySuggestions = Array.from({ length: 15 }, (_, i) => ({
        feature: `feature-${i}`,
        files: [`file${i}.ts`],
        fileCount: 1,
      }));
      IntelligentCommitAnalyzer.prototype.analyzeAndSuggestCommits.mockResolvedValue(manySuggestions);
      IntelligentCommitAnalyzer.prototype.getReadyCommits.mockReturnValue([]);
      IntelligentCommitAnalyzer.prototype.getNeedsAttention.mockReturnValue([]);

      getGitTreeState.mockReturnValue({
        uniqueCount: 15,
        stagedFiles: [],
        workingFiles: Array.from({ length: 15 }, (_, i) => `file${i}.ts`),
      });

      const monitor = makeSUT();
      const result = await monitor.analyze();

      expect(result.action).toBe('too_many_features');
      expect(result.message).toContain('Consider splitting');
    });

    it('should return info action with suggestions', async () => {
      const suggestions = [
        { feature: 'feature-a', files: ['file1.ts'], fileCount: 1 },
        { feature: 'feature-b', files: ['file2.ts'], fileCount: 1 },
      ];
      IntelligentCommitAnalyzer.prototype.analyzeAndSuggestCommits.mockResolvedValue(suggestions);
      IntelligentCommitAnalyzer.prototype.getReadyCommits.mockReturnValue([]);
      IntelligentCommitAnalyzer.prototype.getNeedsAttention.mockReturnValue([]);

      getGitTreeState.mockReturnValue({
        uniqueCount: 2,
        stagedFiles: ['file1.ts'],
        workingFiles: ['file2.ts'],
      });

      const monitor = makeSUT();
      const result = await monitor.analyze();

      expect(result.action).toBe('info');
      expect(result.suggestions).toEqual(suggestions);
    });
  });

  describe('notify', () => {
    it('should not notify when git tree is clean', async () => {
      getGitTreeState.mockReturnValue({
        uniqueCount: 0,
        stagedFiles: [],
        workingFiles: [],
      });
      IntelligentCommitAnalyzer.prototype.analyzeAndSuggestCommits.mockResolvedValue([]);
      IntelligentCommitAnalyzer.prototype.getReadyCommits.mockReturnValue([]);
      IntelligentCommitAnalyzer.prototype.getNeedsAttention.mockReturnValue([]);
      const notifier = jest.fn();
      const monitor = makeSUT({ notifier });
      await monitor.notify();
      expect(notifier).not.toHaveBeenCalled();
    });

    it('should notify with commit suggestions', async () => {
      const mockReadyCommits = [
        {
          files: ['file1.ts'],
          commitMessage: 'feat: add feature',
          feature: 'feature-a',
          fileCount: 1,
        },
      ];
      IntelligentCommitAnalyzer.prototype.analyzeAndSuggestCommits.mockResolvedValue([]);
      IntelligentCommitAnalyzer.prototype.getReadyCommits.mockReturnValue(mockReadyCommits);
      IntelligentCommitAnalyzer.prototype.getNeedsAttention.mockReturnValue([]);

      getGitTreeState.mockReturnValue({
        uniqueCount: 1,
        stagedFiles: ['file1.ts'],
        workingFiles: [],
      });

      const notifier = jest.fn();
      const monitor = makeSUT({ notifier });
      await monitor.notify();

      expect(notifier).toHaveBeenCalled();
      const notification = notifier.mock.calls[0][0];
      expect(notification.title).toContain('Atomic Commit');
      expect(notification.action).toBe('suggest_commit');
    });
  });
});

