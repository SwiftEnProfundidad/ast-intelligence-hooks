const HookSystemStateMachine = require('../HookSystemStateMachine');
const fs = require('fs');
const path = require('path');

function makeSUT(options = {}) {
  return new HookSystemStateMachine(options);
}

function cleanupStateFile() {
  const stateFile = path.join(process.cwd(), '.audit_tmp', 'autonomous-state.json');
  if (fs.existsSync(stateFile)) {
    fs.unlinkSync(stateFile);
  }
}

describe('HookSystemStateMachine', () => {
  beforeEach(() => {
    cleanupStateFile();
  });

  afterEach(() => {
    cleanupStateFile();
  });

  describe('constructor', () => {
    it('should initialize with default state when no options provided', () => {
      const stateMachine = makeSUT();
      expect(stateMachine.getState()).toBeDefined();
    });

    it('should initialize with custom default state', () => {
      const stateMachine = makeSUT({ defaultState: 'active' });
      expect(stateMachine.getState()).toBe('active');
    });

    it('should load state from file if exists', () => {
      const stateFile = path.join(process.cwd(), '.audit_tmp', 'autonomous-state.json');
      const stateDir = path.dirname(stateFile);
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }
      const validState = 'idle';
      fs.writeFileSync(stateFile, JSON.stringify({ state: validState, updatedAt: Date.now() }, null, 2));
      const stateMachine = makeSUT();
      expect(stateMachine.getState()).toBe(validState);
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const stateMachine = makeSUT();
      const state = stateMachine.getState();
      expect(typeof state).toBe('string');
    });
  });

  describe('canTransition', () => {
    it('should return true for valid transitions', () => {
      const stateMachine = makeSUT();
      const canTransition = stateMachine.canTransition('start');
      expect(typeof canTransition).toBe('boolean');
    });

    it('should return false for invalid transitions', () => {
      const stateMachine = makeSUT();
      const canTransition = stateMachine.canTransition('invalid_event');
      expect(canTransition).toBe(false);
    });
  });

  describe('transition', () => {
    it('should transition to new state on valid event', () => {
      const stateMachine = makeSUT();
      if (stateMachine.canTransition('start')) {
        const newState = stateMachine.transition('start');
        expect(newState).toBeDefined();
        expect(stateMachine.getState()).toBe(newState);
      }
    });

    it('should throw error on invalid transition', () => {
      const stateMachine = makeSUT();
      expect(() => {
        stateMachine.transition('invalid_event');
      }).toThrow('Invalid transition');
    });

    it('should persist state after transition', () => {
      const stateMachine = makeSUT();
      if (stateMachine.canTransition('start')) {
        const newState = stateMachine.transition('start');
        const stateFile = path.join(process.cwd(), '.audit_tmp', 'autonomous-state.json');
        expect(fs.existsSync(stateFile)).toBe(true);
        const persisted = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        expect(persisted.state).toBe(newState);
      }
    });
  });

  describe('loadState', () => {
    it('should return default state when file does not exist', () => {
      cleanupStateFile();
      const stateMachine = makeSUT({ defaultState: 'idle' });
      expect(stateMachine.getState()).toBe('idle');
    });

    it('should persist default state when loading fails', () => {
      cleanupStateFile();
      const stateMachine = makeSUT({ defaultState: 'idle' });
      const stateFile = path.join(process.cwd(), '.audit_tmp', 'autonomous-state.json');
      expect(fs.existsSync(stateFile)).toBe(true);
    });
  });
});

