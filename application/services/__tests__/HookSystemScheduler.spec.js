const HookSystemScheduler = require('../HookSystemScheduler');
const HookSystemStateMachine = require('../state/HookSystemStateMachine');
const { recordMetric } = require('../../../infrastructure/telemetry/metrics-logger');

jest.mock('../state/HookSystemStateMachine');
jest.mock('../../../infrastructure/telemetry/metrics-logger');

function makeSUT(options = {}) {
  const mockOrchestrator = {
    shouldReanalyze: jest.fn().mockReturnValue(true),
    analyzeContext: jest.fn().mockResolvedValue({ action: 'ignored' }),
  };
  const mockContextEngine = {
    detectContext: jest.fn(),
  };
  const defaultOptions = {
    orchestrator: mockOrchestrator,
    contextEngine: mockContextEngine,
    intervalMs: 1000,
    ...options,
  };
  return new HookSystemScheduler(defaultOptions);
}

describe('HookSystemScheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    HookSystemStateMachine.mockImplementation(() => ({
      getState: jest.fn().mockReturnValue('idle'),
      transition: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with provided options', () => {
      const mockOrchestrator = { shouldReanalyze: jest.fn() };
      const mockContextEngine = { detectContext: jest.fn() };
      const scheduler = makeSUT({
        orchestrator: mockOrchestrator,
        contextEngine: mockContextEngine,
        intervalMs: 5000,
      });
      expect(scheduler.orchestrator).toBe(mockOrchestrator);
      expect(scheduler.contextEngine).toBe(mockContextEngine);
      expect(scheduler.intervalMs).toBe(5000);
    });

    it('should use default interval when not provided', () => {
      const scheduler = makeSUT();
      expect(scheduler.intervalMs).toBe(1000);
    });

    it('should create state machine instance', () => {
      makeSUT();
      expect(HookSystemStateMachine).toHaveBeenCalled();
    });
  });

  describe('start', () => {
    it('should start timer when not already running', () => {
      const scheduler = makeSUT();
      scheduler.start();
      expect(scheduler.timer).toBeDefined();
    });

    it('should not start multiple timers', () => {
      const scheduler = makeSUT();
      scheduler.start();
      const firstTimer = scheduler.timer;
      scheduler.start();
      expect(scheduler.timer).toBe(firstTimer);
    });

    it('should call tick at interval', () => {
      const scheduler = makeSUT();
      const tickSpy = jest.spyOn(scheduler, 'tick').mockResolvedValue();
      scheduler.start();
      jest.advanceTimersByTime(1000);
      expect(tickSpy).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop timer when running', () => {
      const scheduler = makeSUT();
      scheduler.start();
      scheduler.stop();
      expect(scheduler.timer).toBeNull();
    });

    it('should handle stop when not running', () => {
      const scheduler = makeSUT();
      expect(() => scheduler.stop()).not.toThrow();
    });
  });

  describe('tick', () => {
    it('should skip when state is not idle', async () => {
      const mockStateMachine = {
        getState: jest.fn().mockReturnValue('analyzing'),
        transition: jest.fn(),
      };
      HookSystemStateMachine.mockImplementation(() => mockStateMachine);
      const scheduler = makeSUT();
      await scheduler.tick();
      expect(scheduler.orchestrator.shouldReanalyze).not.toHaveBeenCalled();
    });

    it('should skip when orchestrator should not reanalyze', async () => {
      const mockStateMachine = {
        getState: jest.fn().mockReturnValue('idle'),
        transition: jest.fn(),
      };
      HookSystemStateMachine.mockImplementation(() => mockStateMachine);
      const mockOrchestrator = {
        shouldReanalyze: jest.fn().mockReturnValue(false),
        analyzeContext: jest.fn(),
      };
      const scheduler = makeSUT({ orchestrator: mockOrchestrator });
      await scheduler.tick();
      expect(mockOrchestrator.analyzeContext).not.toHaveBeenCalled();
    });

    it('should execute analysis when conditions are met', async () => {
      const mockStateMachine = {
        getState: jest.fn().mockReturnValue('idle'),
        transition: jest.fn(),
      };
      HookSystemStateMachine.mockImplementation(() => mockStateMachine);
      const mockOrchestrator = {
        shouldReanalyze: jest.fn().mockReturnValue(true),
        analyzeContext: jest.fn().mockResolvedValue({ action: 'ignored' }),
      };
      const scheduler = makeSUT({ orchestrator: mockOrchestrator });
      await scheduler.tick();
      expect(mockOrchestrator.analyzeContext).toHaveBeenCalled();
      expect(mockStateMachine.transition).toHaveBeenCalledWith('analyze');
    });

    it('should record success metric on completion', async () => {
      const mockStateMachine = {
        getState: jest.fn().mockReturnValue('idle'),
        transition: jest.fn(),
      };
      HookSystemStateMachine.mockImplementation(() => mockStateMachine);
      const scheduler = makeSUT();
      await scheduler.tick();
      expect(recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          hook: 'autonomous-orchestrator',
          status: 'success',
        })
      );
    });

    it('should handle errors and transition to error state', async () => {
      const mockStateMachine = {
        getState: jest.fn().mockReturnValue('idle'),
        transition: jest.fn(),
      };
      HookSystemStateMachine.mockImplementation(() => mockStateMachine);
      const mockOrchestrator = {
        shouldReanalyze: jest.fn().mockReturnValue(true),
        analyzeContext: jest.fn().mockRejectedValue(new Error('Analysis failed')),
      };
      const scheduler = makeSUT({ orchestrator: mockOrchestrator });
      await scheduler.tick();
      expect(mockStateMachine.transition).toHaveBeenCalledWith('error');
      expect(mockStateMachine.transition).toHaveBeenCalledWith('reset');
      expect(recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failure',
        })
      );
    });
  });

  describe('executeAction', () => {
    it('should handle auto-execute action', async () => {
      const scheduler = makeSUT();
      const action = { action: 'auto-execute' };
      await expect(scheduler.executeAction(action)).resolves.not.toThrow();
    });

    it('should handle ask action', async () => {
      const scheduler = makeSUT();
      const action = { action: 'ask' };
      await expect(scheduler.executeAction(action)).resolves.not.toThrow();
    });

    it('should handle null action', async () => {
      const scheduler = makeSUT();
      await expect(scheduler.executeAction(null)).resolves.not.toThrow();
    });

    it('should handle action without action property', async () => {
      const scheduler = makeSUT();
      const action = { type: 'unknown' };
      await expect(scheduler.executeAction(action)).resolves.not.toThrow();
    });
  });
});

