const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');

describe('EvidenceGuard watchdog', () => {
    let tmpDir;
    let originalCwd;
    let setIntervalSpy;

    const makeSUT = () => {
        const EvidenceGuard = require('../evidence-guard');
        return new EvidenceGuard();
    };

    beforeEach(() => {
        jest.resetModules();
        setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => ({
            unref: jest.fn()
        }));
        childProcess.spawn = jest.fn().mockImplementation(() => ({
            on: (event, handler) => {
                if (event === 'close') {
                    handler(0);
                }
            },
            unref: jest.fn()
        }));
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pumuki-guard-'));
        fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'tmp', version: '0.0.0' }));
        const scriptDir = path.join(tmpDir, 'scripts', 'hooks-system', 'bin');
        fs.mkdirSync(scriptDir, { recursive: true });
        fs.writeFileSync(path.join(scriptDir, 'update-evidence.sh'), '#!/bin/bash\nexit 0', { mode: 0o755 });
        originalCwd = process.cwd();
        process.chdir(tmpDir);
    });

    afterEach(() => {
        setIntervalSpy.mockRestore();
        process.chdir(originalCwd);
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('spawns a watchdog process when starting the guard', async () => {
        const guard = makeSUT();

        await guard.start();

        const nodeCalls = childProcess.spawn.mock.calls.filter(call => call[0] === process.execPath);
        const hasWatchdog = nodeCalls.some(call => call[1].includes('--watchdog'));
        expect(hasWatchdog).toBe(true);
    });
});
