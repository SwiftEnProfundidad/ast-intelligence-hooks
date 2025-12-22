const path = require('path');
const fs = require('fs');
const { getGitTreeState, isTreeBeyondLimit } = require('../GitTreeState');

jest.mock('../GitTreeState');
jest.mock('../IntelligentGitTreeMonitor');
jest.mock('../ContextDetectionEngine');
jest.mock('../PlatformDetectionService');
jest.mock('../AutonomousOrchestrator');
jest.mock('../../use-cases/AutoExecuteAIStartUseCase');

const RealtimeGuardService = require('../RealtimeGuardService');

const EVIDENCE_PATH = path.join(process.cwd(), '.AI_EVIDENCE.json');

function makeSUT(options = {}) {
  const defaultOptions = {
    notifier: jest.fn(),
    notifications: true,
    ...options,
  };
  const service = new RealtimeGuardService(defaultOptions);
  jest.spyOn(fs, 'existsSync').mockReturnValue(true);
  jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
  jest.spyOn(fs, 'readFileSync').mockReturnValue('{}');
  jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {});
  jest.spyOn(fs, 'watch').mockReturnValue({ close: jest.fn() });
  return service;
}

function createMockEvidence(timestamp) {
  return {
    timestamp: new Date(timestamp).toISOString(),
    ai_gate: { status: 'ALLOWED' },
  };
}

describe('RealtimeGuardService - Critical Methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    process.env.HOOK_GUARD_AUTO_REFRESH = 'false';
    process.env.HOOK_GUARD_EVIDENCE_STALE_THRESHOLD = '60000';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('readEvidenceTimestamp', () => {
    it('should return timestamp when evidence file exists', () => {
      const now = Date.now();
      const evidence = createMockEvidence(now);
      const service = makeSUT();
      fs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(true);
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(evidence));
      const timestamp = service.readEvidenceTimestamp();
      expect(timestamp).toBe(now);
    });

    it('should return null when evidence file does not exist', () => {
      const service = makeSUT();
      fs.existsSync.mockReturnValue(false);
      const timestamp = service.readEvidenceTimestamp();
      expect(timestamp).toBeNull();
    });

    it('should return null when evidence file is invalid JSON', () => {
      const service = makeSUT();
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json');
      const timestamp = service.readEvidenceTimestamp();
      expect(timestamp).toBeNull();
    });

    it('should return null when timestamp is invalid', () => {
      const service = makeSUT();
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({ timestamp: 'invalid' }));
      const timestamp = service.readEvidenceTimestamp();
      expect(timestamp).toBeNull();
    });
  });

  describe('evaluateEvidenceAge', () => {
    it('should not trigger alert when evidence is fresh', () => {
      const now = Date.now();
      const freshTimestamp = now - 30000;
      const evidence = createMockEvidence(freshTimestamp);
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(evidence));
      const service = makeSUT();
      jest.spyOn(service, 'readEvidenceTimestamp').mockReturnValue(freshTimestamp);
      const notifySpy = jest.spyOn(service, 'notify');
      service.evaluateEvidenceAge('test');
      expect(notifySpy).not.toHaveBeenCalled();
    });

    it('should trigger stale alert when evidence is old', () => {
      const now = Date.now();
      const staleTimestamp = now - 120000;
      const service = makeSUT();
      service.lastUserActivityAt = now - 500000;
      jest.spyOn(service, 'readEvidenceTimestamp').mockReturnValue(staleTimestamp);
      const triggerSpy = jest.spyOn(service, 'triggerStaleAlert');
      service.evaluateEvidenceAge('test');
      expect(triggerSpy).toHaveBeenCalledWith('test', expect.any(Number));
    });

    it('should suppress stale alert when user activity is recent', () => {
      const now = Date.now();
      const staleTimestamp = now - 120000;
      const service = makeSUT();
      service.lastUserActivityAt = now - 10000;
      jest.spyOn(service, 'readEvidenceTimestamp').mockReturnValue(staleTimestamp);
      const triggerSpy = jest.spyOn(service, 'triggerStaleAlert');
      service.evaluateEvidenceAge('test');
      expect(triggerSpy).not.toHaveBeenCalled();
    });

    it('should notify fresh when evidence becomes fresh after being stale', () => {
      const now = Date.now();
      const freshTimestamp = now - 30000;
      const service = makeSUT();
      service.lastStaleNotification = now - 10000;
      jest.spyOn(service, 'readEvidenceTimestamp').mockReturnValue(freshTimestamp);
      const notifySpy = jest.spyOn(service, 'notify');
      service.evaluateEvidenceAge('test', true);
      expect(notifySpy).toHaveBeenCalledWith('Evidence updated; back within SLA.', 'info');
    });
  });

  describe('triggerStaleAlert', () => {
    it('should notify when evidence is stale', () => {
      const service = makeSUT();
      service.lastStaleNotification = 0;
      const notifySpy = jest.spyOn(service, 'notify');
      const attemptSpy = jest.spyOn(service, 'attemptAutoRefresh').mockResolvedValue();
      service.triggerStaleAlert('test', 120000);
      expect(notifySpy).toHaveBeenCalled();
      expect(attemptSpy).toHaveBeenCalledWith('stale');
    });

    it('should respect reminder interval', () => {
      const now = Date.now();
      const service = makeSUT();
      service.lastStaleNotification = now - 30000;
      service.reminderIntervalMs = 60000;
      const notifySpy = jest.spyOn(service, 'notify');
      service.triggerStaleAlert('test', 120000);
      expect(notifySpy).not.toHaveBeenCalled();
    });

    it('should format age message correctly', () => {
      const service = makeSUT();
      service.lastStaleNotification = 0;
      service.staleThresholdMs = 60000;
      const notifySpy = jest.spyOn(service, 'notify');
      jest.spyOn(service, 'attemptAutoRefresh').mockResolvedValue();
      service.triggerStaleAlert('test', 120000);
      expect(notifySpy).toHaveBeenCalledWith(
        expect.stringContaining('Evidence has been'),
        'warn',
        { forceDialog: true }
      );
    });
  });

  describe('evaluateGitTree', () => {
    it('should handle clean git tree', async () => {
      const cleanState = {
        stagedCount: 0,
        workingCount: 0,
        uniqueCount: 0,
      };
      getGitTreeState.mockReturnValue(cleanState);
      const service = makeSUT();
      const resolveSpy = jest.spyOn(service, 'resolveDirtyTree');
      await service.evaluateGitTree();
      expect(resolveSpy).toHaveBeenCalledWith(cleanState, {
        stagedLimit: service.gitTreeStagedThreshold,
        unstagedLimit: service.gitTreeUnstagedThreshold,
        totalLimit: service.gitTreeTotalThreshold
      });
    });

    it('should handle dirty git tree beyond limit', async () => {
      const dirtyState = {
        stagedCount: 50,
        workingCount: 60,
        uniqueCount: 110,
      };
      getGitTreeState.mockReturnValue(dirtyState);
      isTreeBeyondLimit.mockReturnValue(true);
      const service = makeSUT();
      const handleSpy = jest.spyOn(service, 'handleDirtyTree');
      await service.evaluateGitTree();
      expect(handleSpy).toHaveBeenCalledWith(dirtyState, {
        stagedLimit: service.gitTreeStagedThreshold,
        unstagedLimit: service.gitTreeUnstagedThreshold,
        totalLimit: service.gitTreeTotalThreshold
      });
    });

    it.skip('should use intelligent monitor for large trees', async () => {
      const largeState = {
        stagedCount: 10,
        workingCount: 15,
        uniqueCount: 25,
      };
      getGitTreeState.mockReturnValue(largeState);
      isTreeBeyondLimit.mockReturnValue(false);
      const service = makeSUT();
      const mockNotify = jest.fn().mockResolvedValue();
      const IntelligentGitTreeMonitor = require('../IntelligentGitTreeMonitor');
      IntelligentGitTreeMonitor.mockImplementation(() => ({
        notify: mockNotify,
      }));
      await service.evaluateGitTree();
      expect(mockNotify).toHaveBeenCalled();
    });

    it.skip('should handle errors gracefully', async () => {
      const service = makeSUT();
      getGitTreeState.mockImplementation(() => {
        throw new Error('Git error');
      });
      const appendSpy = jest.spyOn(service, 'appendDebugLog');
      await service.evaluateGitTree();
      expect(appendSpy).toHaveBeenCalledWith(expect.stringContaining('DIRTY_TREE_ERROR'));
    });
  });

  describe('handleDirtyTree', () => {
    it('should notify when tree is dirty', () => {
      const dirtyState = {
        stagedCount: 50,
        workingCount: 60,
        uniqueCount: 110,
      };
      const service = makeSUT();
      service.lastDirtyTreeNotification = 0;
      const notifySpy = jest.spyOn(service, 'notify');
      service.handleDirtyTree(dirtyState, 100);
      expect(notifySpy).toHaveBeenCalled();
      expect(service.dirtyTreeActive).toBe(true);
    });

    it('should suppress notification within reminder interval', () => {
      const now = Date.now();
      const dirtyState = {
        stagedCount: 50,
        workingCount: 60,
        uniqueCount: 110,
      };
      const service = makeSUT();
      service.lastDirtyTreeNotification = now - 60000;
      service.gitTreeReminderMs = 300000;
      const notifySpy = jest.spyOn(service, 'notify');
      service.handleDirtyTree(dirtyState, 100);
      expect(notifySpy).not.toHaveBeenCalled();
    });

    it('should persist dirty tree state', () => {
      const dirtyState = {
        stagedCount: 50,
        workingCount: 60,
        uniqueCount: 110,
      };
      const service = makeSUT();
      service.lastDirtyTreeNotification = 0;
      const persistSpy = jest.spyOn(service, 'persistDirtyTreeState');
      service.handleDirtyTree(dirtyState, 100);
      expect(persistSpy).toHaveBeenCalled();
    });
  });

  describe('attemptAutoRefresh', () => {
    it('should skip when auto refresh is disabled', async () => {
      process.env.HOOK_GUARD_AUTO_REFRESH = 'false';
      const service = makeSUT();
      const readSpy = jest.spyOn(service, 'readEvidenceTimestamp');
      await service.attemptAutoRefresh('test');
      expect(readSpy).not.toHaveBeenCalled();
    });

    it('should skip when update script does not exist', async () => {
      process.env.HOOK_GUARD_AUTO_REFRESH = 'true';
      const service = makeSUT();
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath && filePath.includes('update-evidence.sh')) return false;
        return true;
      });
      const readSpy = jest.spyOn(service, 'readEvidenceTimestamp');
      await service.attemptAutoRefresh('test');
      expect(readSpy).not.toHaveBeenCalled();
    });

    it('should skip when evidence is fresh', async () => {
      process.env.HOOK_GUARD_AUTO_REFRESH = 'true';
      const now = Date.now();
      const freshTimestamp = now - 30000;
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const service = makeSUT();
      jest.spyOn(service, 'readEvidenceTimestamp').mockReturnValue(freshTimestamp);
      const refreshSpy = jest.spyOn(service, 'runDirectEvidenceRefresh');
      await service.attemptAutoRefresh('test');
      expect(refreshSpy).not.toHaveBeenCalled();
    });

    it('should skip when within cooldown period', async () => {
      process.env.HOOK_GUARD_AUTO_REFRESH = 'true';
      const now = Date.now();
      const staleTimestamp = now - 120000;
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const service = makeSUT();
      service.lastAutoRefresh = now - 10000;
      service.autoRefreshCooldownMs = 180000;
      jest.spyOn(service, 'readEvidenceTimestamp').mockReturnValue(staleTimestamp);
      const refreshSpy = jest.spyOn(service, 'runDirectEvidenceRefresh');
      await service.attemptAutoRefresh('test');
      expect(refreshSpy).not.toHaveBeenCalled();
    });

    it('should skip when refresh is already in flight', async () => {
      process.env.HOOK_GUARD_AUTO_REFRESH = 'true';
      const now = Date.now();
      const staleTimestamp = now - 120000;
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const service = makeSUT();
      service.autoRefreshInFlight = true;
      jest.spyOn(service, 'readEvidenceTimestamp').mockReturnValue(staleTimestamp);
      const refreshSpy = jest.spyOn(service, 'runDirectEvidenceRefresh');
      await service.attemptAutoRefresh('test');
      expect(refreshSpy).not.toHaveBeenCalled();
    });
  });

  describe('startGitTreeMonitoring', () => {
    it('should start monitoring when threshold is valid', () => {
      const service = makeSUT();
      service.gitTreeStagedThreshold = 10;
      service.gitTreeUnstagedThreshold = 15;
      service.gitTreeTotalThreshold = 20;
      service.gitTreeCheckIntervalMs = 60000;
      const evaluateSpy = jest.spyOn(service, 'evaluateGitTree').mockResolvedValue();
      service.startGitTreeMonitoring();
      expect(evaluateSpy).toHaveBeenCalled();
      expect(service.gitTreeTimer).toBeDefined();
    });

    it('should not start when threshold is invalid', () => {
      const service = makeSUT();
      service.gitTreeStagedThreshold = 0;
      service.gitTreeUnstagedThreshold = 0;
      service.gitTreeTotalThreshold = 0;
      service.startGitTreeMonitoring();
      expect(service.gitTreeTimer).toBeNull();
    });

    it('should not start when interval is zero', () => {
      const service = makeSUT();
      service.gitTreeStagedThreshold = 10;
      service.gitTreeUnstagedThreshold = 15;
      service.gitTreeTotalThreshold = 20;
      service.gitTreeCheckIntervalMs = 0;
      service.startGitTreeMonitoring();
      expect(service.gitTreeTimer).toBeNull();
    });
  });

  describe('startEvidencePolling', () => {
    it('should start polling when interval is positive', () => {
      const service = makeSUT();
      service.pollIntervalMs = 30000;
      const evaluateSpy = jest.spyOn(service, 'evaluateEvidenceAge');
      service.startEvidencePolling();
      expect(service.pollTimer).toBeDefined();
      jest.advanceTimersByTime(30000);
      expect(evaluateSpy).toHaveBeenCalledWith('polling');
    });

    it('should not start when interval is zero', () => {
      const service = makeSUT();
      service.pollIntervalMs = 0;
      service.startEvidencePolling();
      expect(service.pollTimer).toBeNull();
    });

    it('should clear existing timer before starting new one', () => {
      const service = makeSUT();
      service.pollIntervalMs = 30000;
      service.pollTimer = setInterval(() => {}, 1000);
      const clearSpy = jest.spyOn(global, 'clearInterval');
      service.startEvidencePolling();
      expect(clearSpy).toHaveBeenCalled();
    });
  });
});

