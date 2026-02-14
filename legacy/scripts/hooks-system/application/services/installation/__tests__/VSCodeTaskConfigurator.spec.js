const fs = require('fs');
const os = require('os');
const path = require('path');

const VSCodeTaskConfigurator = require('../VSCodeTaskConfigurator');

describe('VSCodeTaskConfigurator', () => {
    let testRoot;

    beforeEach(() => {
        testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ast-hooks-vscode-task-'));
    });

    afterEach(() => {
        if (testRoot && fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
    });

    it('should generate AST Session Loader task with a short command (no multiline bash -lc script)', () => {
        const configurator = new VSCodeTaskConfigurator(testRoot, null);
        configurator.configure();

        const tasksJsonPath = path.join(testRoot, '.vscode', 'tasks.json');
        expect(fs.existsSync(tasksJsonPath)).toBe(true);

        const tasksJson = JSON.parse(fs.readFileSync(tasksJsonPath, 'utf8'));
        const task = tasksJson.tasks.find(t => t.label === 'AST Session Loader' || t.identifier === 'ast-session-loader');
        expect(task).toBeTruthy();

        expect(task.command).toBe('bash');
        expect(Array.isArray(task.args)).toBe(true);

        // Current implementation embeds a multi-line script in args[1] (very noisy in terminal as "Executing task: ...")
        // We want a single-line command.
        expect(String(task.args[1] || '')).not.toContain('\n');
    });
});
