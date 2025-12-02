const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const { setupGuardEnvironment } = require('../__mocks__/guardEnvironment');

const repoRoot = path.resolve(__dirname, '../..');
const cliPath = path.join(repoRoot, 'infrastructure/watchdog/token-monitor.js');

describe('token-monitor CLI integration', () => {
    let tmpDir;
    let environment;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'token-monitor-'));
        environment = setupGuardEnvironment(tmpDir);
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    const runCli = () =>
        spawnSync('node', [cliPath], {
            cwd: repoRoot,
            stdio: 'pipe',
            env: {
                ...process.env,
                HOOKS_REPO_ROOT: environment.repoRoot
            }
        });

    const writeUsage = percent => {
        const record = {
            timestamp: new Date().toISOString(),
            tokensUsed: Math.round((percent / 100) * 1_000_000),
            maxTokens: 1_000_000,
            percentUsed: percent,
            source: 'integration-test'
        };
        fs.writeFileSync(environment.tokenUsagePath, `${JSON.stringify(record)}\n`, 'utf8');
    };

    it('returns exit code 0 when usage is healthy', () => {
        writeUsage(15);
        const result = runCli();
        expect(result.status).toBe(0);
    });

    it('returns exit code 1 when usage is warning', () => {
        writeUsage(92);
        const result = runCli();
        expect(result.status).toBe(1);
    });

    it('returns exit code 2 when usage is critical', () => {
        writeUsage(96);
        const result = runCli();
        expect(result.status).toBe(2);
    });
});
