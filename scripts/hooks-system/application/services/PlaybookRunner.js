const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PLAYBOOKS_PATH = path.join(process.cwd(), 'scripts', 'hooks-system', 'config', 'playbooks.json');

class PlaybookRunner {
  constructor(options = {}) {
    this.cwd = options.cwd || process.cwd();
    this.playbooks = JSON.parse(fs.readFileSync(PLAYBOOKS_PATH, 'utf8'));
  }

  list() {
    return Object.entries(this.playbooks).map(([id, playbook]) => ({ id, ...playbook }));
  }

  run(id) {
    const playbook = this.playbooks[id];
    if (!playbook) {
      throw new Error(`Playbook '${id}' not found`);
    }

    for (const step of playbook.steps) {
      if (step.type === 'command') {
        const result = spawnSync(step.cmd, {
          shell: true,
          stdio: 'inherit',
          cwd: this.cwd,
        });
        if (result.status !== 0) {
          throw new Error(`Step failed: ${step.cmd}`);
        }
      }
    }
  }
}

module.exports = PlaybookRunner;
