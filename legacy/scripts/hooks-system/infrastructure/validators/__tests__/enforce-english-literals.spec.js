const fs = require('fs');
const os = require('os');
const path = require('path');

describe('enforce-english-literals validator', () => {
    let repoRoot;
    const originalEnv = { ...process.env };

    beforeEach(() => {
        repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'language-guard-'));
        process.env.HOOK_GUARD_REPO_ROOT = repoRoot;
        fs.mkdirSync(path.join(repoRoot, 'scripts/hooks-system/config'), { recursive: true });
    });

    afterEach(() => {
        process.env = { ...originalEnv };
        fs.rmSync(repoRoot, { recursive: true, force: true });
    });

    it('detects banned characters and words inside staged files', () => {
        const config = {
            extensions: ['ts'],
            bannedCharacters: ['á'],
            bannedWords: ['gracias']
        };
        fs.writeFileSync(
            path.join(repoRoot, 'scripts/hooks-system/config/language-guard.json'),
            JSON.stringify(config)
        );

        const filePath = path.join(repoRoot, 'src/example.ts');
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(
            filePath,
            'const mensaje = "gracias por tu colaboraci\u00f3n";\nconst titulo = "Planificaci\u00f3n \u00e1gil";\n'
        );

        jest.resetModules();
        const validator = require('../enforce-english-literals');

        const violations = validator.analyzeFile('src/example.ts', config);
        expect(violations).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ reason: 'banned_word' }),
                expect.objectContaining({ reason: 'banned_character' })
            ])
        );
    });

    it('ignores files outside configured extensions', () => {
        const config = {
            extensions: ['ts'],
            bannedCharacters: ['á'],
            bannedWords: ['gracias']
        };
        fs.writeFileSync(
            path.join(repoRoot, 'scripts/hooks-system/config/language-guard.json'),
            JSON.stringify(config)
        );

        jest.resetModules();
        const validator = require('../enforce-english-literals');

        const shouldSkip = validator.shouldInspect('README.md', config.extensions);
        expect(shouldSkip).toBe(false);
    });
});
