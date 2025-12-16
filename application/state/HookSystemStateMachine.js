const fs = require('fs');
const path = require('path');
const { toErrorMessage } = require('../../infrastructure/utils/error-utils');

const STATE_FILE = path.join(process.cwd(), '.audit_tmp', 'autonomous-state.json');
const STATE_MAP_PATH = path.join(__dirname, '..', '..', 'config', 'state-map.json');

class HookSystemStateMachine {
  constructor(options = {}) {
    this.stateMap = JSON.parse(fs.readFileSync(STATE_MAP_PATH, 'utf8'));
    this.defaultState = options.defaultState || 'idle';
    this.state = this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        if (data && data.state && this.stateMap[data.state]) {
          return data.state;
        }
      }
    } catch (error) {
      console.error(`[HookSystemStateMachine] Failed to load state: ${toErrorMessage(error)}`);
    }
    this.persistState(this.defaultState);
    return this.defaultState;
  }

  persistState(state) {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify({ state, updatedAt: Date.now() }, null, 2));
  }

  getState() {
    return this.state;
  }

  canTransition(event) {
    const stateConfig = this.stateMap[this.state];
    return Boolean(stateConfig && stateConfig.on && stateConfig.on[event]);
  }

  transition(event) {
    if (!this.canTransition(event)) {
      throw new Error(`Invalid transition from '${this.state}' via '${event}'`);
    }
    const nextState = this.stateMap[this.state].on[event];
    this.state = nextState;
    this.persistState(nextState);
    return this.state;
  }
}

module.exports = HookSystemStateMachine;
