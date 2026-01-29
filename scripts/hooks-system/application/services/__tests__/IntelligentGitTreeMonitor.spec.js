const childProcess = require('child_process');

let AuditLogger;
let IntelligentGitTreeMonitor;
let IntelligentCommitAnalyzer;
let execSyncSpy;
let analyzeAndSuggestCommitsSpy;
let getReadyCommitsSpy;
let getNeedsAttentionSpy;
let ensureDirSpy;
let recordSpy;

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

function buildGitStatusOutput({ staged = [], working = [], untracked = [] } = {}) {
  const stagedLines = staged.map(file => `A  ${file}`);
  const workingLines = working.map(file => ` M ${file}`);
  const untrackedLines = untracked.map(file => `?? ${file}`);
  return [...stagedLines, ...workingLines, ...untrackedLines].join('\n');
}

describe('IntelligentGitTreeMonitor', () => {
  beforeEach(() => {
    jest.resetModules();
    execSyncSpy = jest.spyOn(childProcess, 'execSync');
    execSyncSpy.mockReset();
    AuditLogger = require('../logging/AuditLogger');
    IntelligentCommitAnalyzer = require('../IntelligentCommitAnalyzer');
    IntelligentGitTreeMonitor = require('../IntelligentGitTreeMonitor');
    analyzeAndSuggestCommitsSpy = jest.spyOn(IntelligentCommitAnalyzer.prototype, 'analyzeAndSuggestCommits');
    getReadyCommitsSpy = jest.spyOn(IntelligentCommitAnalyzer.prototype, 'getReadyCommits');
    getNeedsAttentionSpy = jest.spyOn(IntelligentCommitAnalyzer.prototype, 'getNeedsAttention');
    ensureDirSpy = jest.spyOn(AuditLogger.prototype, 'ensureDir').mockImplementation(() => {});
    recordSpy = jest.spyOn(AuditLogger.prototype, 'record').mockImplementation(() => {});
    analyzeAndSuggestCommitsSpy.mockResolvedValue([]);
    getReadyCommitsSpy.mockReturnValue([]);
    getNeedsAttentionSpy.mockReturnValue([]);
  });

  afterEach(() => {
    execSyncSpy.mockRestore();
    analyzeAndSuggestCommitsSpy.mockRestore();
    getReadyCommitsSpy.mockRestore();
    getNeedsAttentionSpy.mockRestore();
    ensureDirSpy.mockRestore();
    recordSpy.mockRestore();
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
      execSyncSpy.mockReturnValue('');
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
      analyzeAndSuggestCommitsSpy.mockResolvedValue([]);
      getReadyCommitsSpy.mockReturnValue(mockReadyCommits);
      getNeedsAttentionSpy.mockReturnValue([]);

      execSyncSpy.mockReturnValue(
        buildGitStatusOutput({ staged: ['file1.ts'], working: ['file2.ts'] })
      );

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
      analyzeAndSuggestCommitsSpy.mockResolvedValue(manySuggestions);
      getReadyCommitsSpy.mockReturnValue([]);
      getNeedsAttentionSpy.mockReturnValue([]);

      execSyncSpy.mockReturnValue(
        buildGitStatusOutput({ working: Array.from({ length: 15 }, (_, i) => `file${i}.ts`) })
      );

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
      analyzeAndSuggestCommitsSpy.mockResolvedValue(suggestions);
      getReadyCommitsSpy.mockReturnValue([]);
      getNeedsAttentionSpy.mockReturnValue([]);

      execSyncSpy.mockReturnValue(
        buildGitStatusOutput({ staged: ['file1.ts'], working: ['file2.ts'] })
      );

      const monitor = makeSUT();
      const result = await monitor.analyze();

      expect(result.action).toBe('info');
      expect(result.suggestions).toEqual(suggestions);
    });
  });

  describe('notify', () => {
    it('should not notify when git tree is clean', async () => {
      execSyncSpy.mockReturnValue('');
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
      analyzeAndSuggestCommitsSpy.mockResolvedValue([]);
      getReadyCommitsSpy.mockReturnValue(mockReadyCommits);
      getNeedsAttentionSpy.mockReturnValue([]);

      execSyncSpy.mockReturnValue(
        buildGitStatusOutput({ staged: ['file1.ts'] })
      );

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
