const buildSubject = (overrides = {}) => {
  jest.resetModules();

  const evidenceMonitor = overrides.evidenceMonitor || {
    start: jest.fn(),
    refresh: jest.fn().mockResolvedValue(undefined),
    isStale: jest.fn().mockReturnValue(true)
  };
  const gitFlowService = overrides.gitFlowService || {
    getCurrentBranch: jest.fn().mockReturnValue('feature/test')
  };
  const gitQuery = overrides.gitQuery || {
    getUncommittedChanges: jest.fn().mockReturnValue([]),
    getBranchState: jest.fn().mockReturnValue({ ahead: 0, behind: 0 })
  };
  const orchestrator = overrides.orchestrator || {
    shouldReanalyze: jest.fn().mockReturnValue(false)
  };
  const notificationService = overrides.notificationService || {
    notify: jest.fn()
  };

  jest.doMock('../../../application/CompositionRoot', () => ({
    createForProduction: jest.fn(() => ({
      getEvidenceMonitor: () => evidenceMonitor,
      getGitFlowService: () => gitFlowService,
      getGitQueryAdapter: () => gitQuery,
      getOrchestrator: () => orchestrator,
      getNotificationService: () => notificationService
    }))
  }));

  const { startPollingLoops } = require('../ast-intelligence-automation');

  return {
    startPollingLoops,
    evidenceMonitor,
    gitFlowService,
    gitQuery,
    orchestrator,
    notificationService
  };
};

describe('AST Intelligence Automation MCP', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('module structure', () => {
    it('should exist as a file', () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../ast-intelligence-automation.js');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should be valid JavaScript', () => {
      expect(() => {
        require.resolve('../ast-intelligence-automation.js');
      }).not.toThrow();
    });
  });

  describe('constants', () => {
    it('should define MCP version', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(
        path.join(__dirname, '../ast-intelligence-automation.js'),
        'utf-8'
      );
      expect(content).toContain('MCP_VERSION');
    });

    it('should define REPO_ROOT', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(
        path.join(__dirname, '../ast-intelligence-automation.js'),
        'utf-8'
      );
      expect(content).toContain('REPO_ROOT');
    });
  });

  describe('polling loops', () => {
    it('starts evidence monitor and configures interval', () => {
      const intervalCalls = [];
      const intervalSpy = jest.spyOn(global, 'setInterval').mockImplementation((callback, time) => {
        intervalCalls.push({ callback, time });
        return 1;
      });

      const subject = buildSubject();
      subject.startPollingLoops();

      const hasEvidenceInterval = intervalCalls.some(call => call.time === 180000);

      expect(subject.evidenceMonitor.start).toHaveBeenCalled();
      expect(intervalSpy).toHaveBeenCalled();
      expect(hasEvidenceInterval).toBe(true);
    });

    it('refreshes evidence when stale', async () => {
      const intervalCalls = [];
      jest.spyOn(global, 'setInterval').mockImplementation((callback, time) => {
        intervalCalls.push({ callback, time });
        return 1;
      });

      const subject = buildSubject();
      subject.startPollingLoops();

      const evidenceInterval = intervalCalls.find(call => call.time === 180000);
      expect(evidenceInterval).toBeDefined();

      await evidenceInterval.callback();

      expect(subject.evidenceMonitor.refresh).toHaveBeenCalled();
      expect(subject.notificationService.notify).toHaveBeenCalledWith(expect.objectContaining({
        title: '🔄 Evidence Auto-Updated'
      }));
    });

    it('notifies when evidence refresh fails', async () => {
      const intervalCalls = [];
      jest.spyOn(global, 'setInterval').mockImplementation((callback, time) => {
        intervalCalls.push({ callback, time });
        return 1;
      });

      const evidenceMonitor = {
        start: jest.fn(),
        refresh: jest.fn().mockRejectedValue(new Error('Refresh failed')),
        isStale: jest.fn().mockReturnValue(true)
      };

      const subject = buildSubject({ evidenceMonitor });
      subject.startPollingLoops();

      const evidenceInterval = intervalCalls.find(call => call.time === 180000);
      expect(evidenceInterval).toBeDefined();

      await evidenceInterval.callback();

      expect(subject.evidenceMonitor.refresh).toHaveBeenCalled();
      expect(subject.notificationService.notify).toHaveBeenCalledWith(expect.objectContaining({
        title: '⚠️ Evidence Stale'
      }));
    });
  });
});
