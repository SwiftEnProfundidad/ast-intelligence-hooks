const fs = require('fs');
const os = require('os');
const path = require('path');

const EvidenceMonitorService = require('../EvidenceMonitorService');

describe('EvidenceMonitorService', () => {
    let tmpDir;
    let evidencePath;
    let criticalDocPath;
    let updateScriptPath;
    let notifications;
    let execCalls;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-monitor-'));
        evidencePath = path.join(tmpDir, '.AI_EVIDENCE.json');
        criticalDocPath = path.join(tmpDir, 'docs', 'planning', 'LIBRARY_FIVE_STARS_ROADMAP.md');
        updateScriptPath = path.join(tmpDir, 'update-evidence.sh');
        fs.mkdirSync(path.dirname(criticalDocPath), { recursive: true });
        fs.writeFileSync(updateScriptPath, '#!/bin/bash\nexit 0', { mode: 0o755 });
        notifications = [];
        execCalls = [];
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    const createService = (overrides = {}) => new EvidenceMonitorService({
        repoRoot: tmpDir,
        evidencePath,
        criticalDocPath,
        updateScriptPath,
        notifier: payload => notifications.push(payload),
        logger: { warn: jest.fn(), error: jest.fn() },
        execFn: command => execCalls.push(command),
        fsModule: fs,
        ...overrides
    });

    it('notifies when evidence file is missing and triggers auto refresh', () => {
        const service = createService({ autoRefreshCooldownMs: 0 });

        service.performInitialChecks();

        expect(notifications[0]).toMatchObject({ level: 'warn', type: 'evidence_missing' });
        expect(execCalls.length).toBeGreaterThan(0);
    });

    it('flags stale evidence and triggers auto refresh', () => {
        fs.writeFileSync(evidencePath, JSON.stringify({ timestamp: new Date(Date.now() - (11 * 60 * 1000)).toISOString() }));
        fs.writeFileSync(criticalDocPath, '# doc');
        const service = createService({ autoRefreshCooldownMs: 0, staleThresholdMs: 10 * 60 * 1000 });

        service.performInitialChecks();

        expect(notifications.find(entry => entry.type === 'evidence_stale')).toBeTruthy();
        expect(execCalls.length).toBeGreaterThan(0);
    });

    it.skip('marks critical document missing', () => {
        fs.writeFileSync(evidencePath, JSON.stringify({ timestamp: new Date().toISOString() }));
        const service = createService();

        service.performInitialChecks();

        expect(notifications.find(entry => entry.type === 'evidence_doc_missing')).toBeTruthy();
    });

    it.skip('does not notify when the critical document comes back before threshold', () => {
        jest.useFakeTimers();
        fs.writeFileSync(evidencePath, JSON.stringify({ timestamp: new Date().toISOString() }));
        fs.writeFileSync(criticalDocPath, '# doc');

        const watchers = [];
        const fsMock = Object.assign({}, fs);
        fsMock.watch = jest.fn((target, handler) => {
            watchers.push({ target, handler });
            return { close: jest.fn() };
        });

        const service = createService({
            fsModule: fsMock,
            criticalDocMissingDelayMs: 1000,
            autoRefreshEnabled: false
        });

        try {
            service.start();

            const criticalWatcher = watchers.find(entry => entry.target === path.dirname(criticalDocPath));
            expect(criticalWatcher).toBeTruthy();

            fs.rmSync(criticalDocPath);
            criticalWatcher.handler('rename', path.basename(criticalDocPath));

            fs.writeFileSync(criticalDocPath, '# doc restored');
            jest.advanceTimersByTime(1000);

            expect(notifications.find(entry => entry.type === 'evidence_doc_missing')).toBeFalsy();
        } finally {
            service.stop();
            jest.useRealTimers();
        }
    });
});
