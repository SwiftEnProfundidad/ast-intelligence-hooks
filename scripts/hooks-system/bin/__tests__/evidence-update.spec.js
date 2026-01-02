const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

describe('ast-hooks evidence:update', () => {
    let repoRoot;
    let subdir;

    beforeEach(() => {
        repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ast-hooks-evidence-cli-'));
        subdir = path.join(repoRoot, 'packages', 'app');
        fs.mkdirSync(subdir, { recursive: true });

        execSync('git init', { cwd: repoRoot, stdio: 'ignore' });
        execSync('git config user.email "test@example.com"', { cwd: repoRoot, stdio: 'ignore' });
        execSync('git config user.name "Test"', { cwd: repoRoot, stdio: 'ignore' });

        fs.writeFileSync(path.join(repoRoot, 'README.md'), 'test', 'utf8');
        execSync('git add README.md', { cwd: repoRoot, stdio: 'ignore' });
        execSync('git commit -m "chore: init"', { cwd: repoRoot, stdio: 'ignore' });
    });

    afterEach(() => {
        fs.rmSync(repoRoot, { recursive: true, force: true });
    });

    it('updates .AI_EVIDENCE.json in repo root even when executed from subdirectory', () => {
        const cliPath = path.resolve(__dirname, '..', 'cli.js');
        const output = execSync(`node ${cliPath} evidence:update`, {
            cwd: subdir,
            encoding: 'utf8',
            env: {
                ...process.env,
                AUTO_EVIDENCE_TRIGGER: 'test',
                AUTO_EVIDENCE_REASON: 'test',
                AUTO_EVIDENCE_SUMMARY: 'test'
            }
        }).trim();

        const evidencePath = path.join(repoRoot, '.AI_EVIDENCE.json');
        expect(fs.realpathSync(output)).toBe(fs.realpathSync(evidencePath));
        expect(fs.existsSync(evidencePath)).toBe(true);

        const json = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
        expect(typeof json.timestamp).toBe('string');
        expect(json.timestamp.length).toBeGreaterThan(10);
    });
});
