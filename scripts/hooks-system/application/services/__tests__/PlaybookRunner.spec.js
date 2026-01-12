jest.mock('child_process', () => ({
  spawnSync: jest.fn(),
}));

const childProcess = require('child_process');
const PlaybookRunner = require('../PlaybookRunner');
const fs = require('fs');
const path = require('path');

const { spawnSync } = childProcess;

function makeSUT(options = {}) {
  return new PlaybookRunner(options);
}

function createMockPlaybooksFile(content) {
  const playbooksPath = path.join(process.cwd(), 'scripts', 'hooks-system', 'config', 'playbooks.json');
  const dir = path.dirname(playbooksPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(playbooksPath, JSON.stringify(content, null, 2));
}

function cleanupPlaybooksFile() {
  const playbooksPath = path.join(process.cwd(), 'scripts', 'hooks-system', 'config', 'playbooks.json');
  if (fs.existsSync(playbooksPath)) {
    fs.unlinkSync(playbooksPath);
  }
}

describe('PlaybookRunner', () => {
  beforeEach(() => {
    cleanupPlaybooksFile();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupPlaybooksFile();
  });

  describe('constructor', () => {
    it('should initialize with default cwd', () => {
      createMockPlaybooksFile({});
      const runner = makeSUT();
      expect(runner.cwd).toBe(process.cwd());
    });

    it('should initialize with custom cwd', () => {
      createMockPlaybooksFile({});
      const customCwd = '/custom/path';
      const runner = makeSUT({ cwd: customCwd });
      expect(runner.cwd).toBe(customCwd);
    });

    it('should load playbooks from file', () => {
      const playbooks = {
        test: { steps: [{ type: 'command', cmd: 'echo test' }] },
      };
      createMockPlaybooksFile(playbooks);
      const runner = makeSUT();
      expect(runner.playbooks).toEqual(playbooks);
    });
  });

  describe('list', () => {
    it('should return list of playbooks with ids', () => {
      const playbooks = {
        playbook1: { name: 'Playbook 1', steps: [] },
        playbook2: { name: 'Playbook 2', steps: [] },
      };
      createMockPlaybooksFile(playbooks);
      const runner = makeSUT();
      const list = runner.list();
      expect(list).toHaveLength(2);
      expect(list[0].id).toBe('playbook1');
      expect(list[0].name).toBe('Playbook 1');
      expect(list[1].id).toBe('playbook2');
      expect(list[1].name).toBe('Playbook 2');
    });

    it('should return empty array when no playbooks', () => {
      createMockPlaybooksFile({});
      const runner = makeSUT();
      const list = runner.list();
      expect(list).toEqual([]);
    });
  });

  describe('run', () => {
    it('should execute playbook steps', () => {
      const playbooks = {
        test: {
          steps: [
            { type: 'command', cmd: 'echo step1' },
            { type: 'command', cmd: 'echo step2' },
          ],
        },
      };
      createMockPlaybooksFile(playbooks);
      spawnSync.mockReturnValue({ status: 0 });
      const runner = makeSUT();
      runner.run('test');
      expect(spawnSync).toHaveBeenCalledTimes(2);
    });

    it('should throw error when playbook not found', () => {
      createMockPlaybooksFile({});
      const runner = makeSUT();
      expect(() => {
        runner.run('nonexistent');
      }).toThrow("Playbook 'nonexistent' not found");
    });

    it('should throw error when step fails', () => {
      const playbooks = {
        test: {
          steps: [{ type: 'command', cmd: 'failing-command' }],
        },
      };
      createMockPlaybooksFile(playbooks);
      spawnSync.mockReturnValue({ status: 1 });
      const runner = makeSUT();
      expect(() => {
        runner.run('test');
      }).toThrow('Step failed');
    });

    it('should use custom cwd for commands', () => {
      const customCwd = '/custom/path';
      const playbooks = {
        test: {
          steps: [{ type: 'command', cmd: 'echo test' }],
        },
      };
      createMockPlaybooksFile(playbooks);
      spawnSync.mockReturnValue({ status: 0 });
      const runner = makeSUT({ cwd: customCwd });
      runner.run('test');
      expect(spawnSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ cwd: customCwd })
      );
    });
  });
});

