const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function makeSUT() {
    const workspaceRoot = path.resolve(__dirname, '../../../..');
    const guardScriptPath = path.join(workspaceRoot, 'scripts', 'hooks-system', 'bin', 'evidence-guard');

    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pumuki evidence guard project '));
    fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify({ name: 'tmp', version: '0.0.0' }));

    const pidFilePath = path.join(projectRoot, '.evidence-guard.pid');
    fs.writeFileSync(pidFilePath, String(process.pid));

    return { guardScriptPath, projectRoot, pidFilePath };
}

describe('evidence-guard wrapper', () => {
    it('should resolve project root from cwd (supports paths with spaces)', () => {
        const { guardScriptPath, projectRoot } = makeSUT();

        const output = execFileSync('bash', [guardScriptPath, 'status'], {
            cwd: projectRoot,
            encoding: 'utf8'
        });

        expect(output).toContain('Evidence guard is running');
    });

    it('should find PID file in project root with spaces in path', () => {
        const { guardScriptPath, projectRoot, pidFilePath } = makeSUT();

        expect(fs.existsSync(pidFilePath)).toBe(true);

        const output = execFileSync('bash', [guardScriptPath, 'status'], {
            cwd: projectRoot,
            encoding: 'utf8'
        });

        expect(output).toContain(`PID: ${process.pid}`);
    });
});
