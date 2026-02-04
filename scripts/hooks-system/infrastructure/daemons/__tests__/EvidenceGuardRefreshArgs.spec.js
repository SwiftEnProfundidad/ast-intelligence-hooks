const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');

describe('EvidenceGuard refresh arguments', () => {
    let tmpDir;
    let originalCwd;
    let spawnSpy;

    const makeSUT = () => {
        const EvidenceGuard = require('../evidence-guard');
        return new EvidenceGuard();
    };

    beforeEach(() => {
        jest.resetModules();
        spawnSpy = jest.spyOn(childProcess, 'spawn').mockImplementation(() => ({
            on: (event, handler) => {
                if (event === 'close') {
                    handler(0);
                }
            }
        }));

        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pumuki-guard-'));
        fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'tmp', version: '0.0.0' }));

        const scriptDir = path.join(tmpDir, 'scripts', 'hooks-system', 'bin');
        fs.mkdirSync(scriptDir, { recursive: true });
        fs.writeFileSync(path.join(scriptDir, 'update-evidence.sh'), '#!/bin/bash\nexit 0\n', { mode: 0o755 });

        originalCwd = process.cwd();
        process.chdir(tmpDir);

        process.env.EVIDENCE_GUARD_SKIP_NO_STAGED = 'false';
        process.env.EVIDENCE_GUARD_STAGED_ONLY = 'false';
    });

    afterEach(() => {
        spawnSpy.mockRestore();
        process.chdir(originalCwd);
        fs.rmSync(tmpDir, { recursive: true, force: true });
        delete process.env.EVIDENCE_GUARD_SKIP_NO_STAGED;
        delete process.env.EVIDENCE_GUARD_STAGED_ONLY;
    });

    it('includes --refresh-only when running update script', async () => {
        const guard = makeSUT();

        await guard.refreshEvidence();

        const bashCalls = spawnSpy.mock.calls.filter(call => call[0] === 'bash');
        expect(bashCalls.length).toBeGreaterThan(0);

        const args = bashCalls[0][1];
        expect(args).toContain('--refresh-only');
    });
});

