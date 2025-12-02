const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { setupGuardEnvironment } = require('../__mocks__/guardEnvironment');

const repoRoot = path.resolve(__dirname, '../..');

describe('Guard system integration', () => {
    let tmpDir;
    let environment;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-integration-'));
        environment = setupGuardEnvironment(tmpDir);
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    const runCli = (script, args = []) => spawnSync('node', [script, ...args], {
        cwd: repoRoot,
        stdio: 'pipe',
        env: {
            ...process.env,
            HOOKS_REPO_ROOT: environment.repoRoot
        }
    });

    it('runs health check CLI successfully', () => {
        const script = path.join(repoRoot, 'infrastructure/watchdog/health-check.js');
        const result = runCli(script);

        expect(result.status).toBe(0);
        const outputFile = path.join(environment.repoRoot, '.audit_tmp', 'health-status.json');
        expect(fs.existsSync(outputFile)).toBe(true);
        const payload = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        expect(payload.status).toBeDefined();
    });

    it('runs auto-recovery CLI without errors', () => {
        const script = path.join(repoRoot, 'infrastructure/watchdog/auto-recovery.js');
        const result = runCli(script, ['test-reason', 'guard']);

        expect(result.status).toBe(0);
    });
});
