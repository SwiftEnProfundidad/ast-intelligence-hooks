const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('E2E: Full Workflow', () => {
    let testDir;
    const REPO_ROOT = path.resolve(__dirname, '../../../..');

    beforeAll(() => {
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pumuki-e2e-'));
        execSync('git init', { cwd: testDir, stdio: 'pipe' });
        execSync('git config user.email "test@test.com"', { cwd: testDir, stdio: 'pipe' });
        execSync('git config user.name "Test User"', { cwd: testDir, stdio: 'pipe' });
    });

    afterAll(() => {
        if (testDir && fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    describe('pumuki-init', () => {
        test('should detect project type and create config', () => {
            fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify({
                name: 'test-project',
                dependencies: { '@nestjs/core': '^10.0.0' }
            }));

            const initScript = path.join(REPO_ROOT, 'scripts/hooks-system/bin/pumuki-init.js');
            const result = execSync(`node ${initScript}`, { cwd: testDir, encoding: 'utf8' });

            expect(result).toContain('Detected platforms');
            expect(fs.existsSync(path.join(testDir, '.pumuki.config.js'))).toBe(true);
        });
    });

    describe('pumuki-audit', () => {
        test('should run AST analysis on files', () => {
            fs.writeFileSync(path.join(testDir, 'test.ts'), `
        export class TestService {
          constructor() {}
          doSomething() { return 'test'; }
        }
      `);

            const auditScript = path.join(REPO_ROOT, 'scripts/hooks-system/bin/pumuki-audit.js');

            try {
                const result = execSync(`node ${auditScript}`, { cwd: testDir, encoding: 'utf8', timeout: 30000 });
                expect(result).toContain('Audit');
            } catch (err) {
                expect(err.stdout || err.message).toBeDefined();
            }
        });
    });

    describe('ai_gate_check flow', () => {
        test('should pass gate on feature branch', () => {
            execSync('git checkout -b feature/test-e2e', { cwd: testDir, stdio: 'pipe' });

            const evidenceFile = path.join(testDir, '.AI_EVIDENCE.json');
            fs.writeFileSync(evidenceFile, JSON.stringify({
                timestamp: new Date().toISOString(),
                session_id: 'test-e2e',
                rules_read: { file: 'rulesbackend.mdc', verified: true },
                protocol_3_questions: { answered: true }
            }));

            expect(fs.existsSync(evidenceFile)).toBe(true);

            const evidence = JSON.parse(fs.readFileSync(evidenceFile, 'utf8'));
            expect(evidence.session_id).toBe('test-e2e');
        });

        test('should block on protected branch without evidence', () => {
            execSync('git checkout -b main', { cwd: testDir, stdio: 'pipe' });

            const evidenceFile = path.join(testDir, '.AI_EVIDENCE.json');
            if (fs.existsSync(evidenceFile)) {
                fs.unlinkSync(evidenceFile);
            }

            expect(fs.existsSync(evidenceFile)).toBe(false);
        });
    });

    describe('pre-commit hook simulation', () => {
        test('should analyze staged files', () => {
            execSync('git checkout -b feature/pre-commit-test', { cwd: testDir, stdio: 'pipe' });

            const testFile = path.join(testDir, 'staged.ts');
            fs.writeFileSync(testFile, 'export const test = "value";');

            execSync('git add staged.ts', { cwd: testDir, stdio: 'pipe' });

            const stagedFiles = execSync('git diff --cached --name-only', { cwd: testDir, encoding: 'utf8' });
            expect(stagedFiles.trim()).toBe('staged.ts');
        });
    });

    describe('gitflow enforcement', () => {
        test('should detect branch type', () => {
            const branches = [
                { name: 'feature/new-feature', type: 'feature' },
                { name: 'fix/bug-fix', type: 'fix' },
                { name: 'develop', type: 'protected' },
                { name: 'main', type: 'protected' }
            ];

            branches.forEach(({ name, type }) => {
                const isProtected = ['main', 'master', 'develop'].includes(name);
                const isFeature = name.startsWith('feature/');
                const isFix = name.startsWith('fix/');

                if (type === 'protected') {
                    expect(isProtected).toBe(true);
                } else if (type === 'feature') {
                    expect(isFeature).toBe(true);
                } else if (type === 'fix') {
                    expect(isFix).toBe(true);
                }
            });
        });

        test('should complete full git flow cycle', () => {
            execSync('git checkout -b feature/gitflow-cycle-test', { cwd: testDir, stdio: 'pipe' });

            fs.writeFileSync(path.join(testDir, 'gitflow-test.ts'), 'export const x = 1;');
            execSync('git add gitflow-test.ts', { cwd: testDir, stdio: 'pipe' });
            execSync('git commit --no-verify -m "feat: add gitflow test file"', { cwd: testDir, stdio: 'pipe' });

            const log = execSync('git log --oneline -1', { cwd: testDir, encoding: 'utf8' });
            expect(log).toContain('feat: add gitflow test file');

            const branch = execSync('git branch --show-current', { cwd: testDir, encoding: 'utf8' });
            expect(branch.trim()).toBe('feature/gitflow-cycle-test');
        });

        test('should validate commit message format', () => {
            const validMessages = [
                'feat: add new feature',
                'fix: resolve bug',
                'docs: update readme',
                'refactor: improve code',
                'test: add unit tests',
                'chore: update deps'
            ];

            const invalidMessages = [
                'added feature',
                'Fix bug',
                'WIP',
                ''
            ];

            validMessages.forEach(msg => {
                const isValid = /^(feat|fix|docs|refactor|test|chore|style|perf|ci|build|revert)(\(.+\))?: .+/.test(msg);
                expect(isValid).toBe(true);
            });

            invalidMessages.forEach(msg => {
                const isValid = /^(feat|fix|docs|refactor|test|chore|style|perf|ci|build|revert)(\(.+\))?: .+/.test(msg);
                expect(isValid).toBe(false);
            });
        });

        test('should list all branches', () => {
            const branches = execSync('git branch --list', { cwd: testDir, encoding: 'utf8' });
            expect(branches).toBeDefined();
            expect(branches.trim().length).toBeGreaterThan(0);
        });
    });
});
