const path = require('path');
const fs = require('fs');

const { GuardAutoManagerService } = require('../GuardAutoManagerService');

describe('GuardAutoManagerService', () => {
    const repoRoot = fs.mkdtempSync(path.join(require('os').tmpdir(), 'guard-auto-'));

    afterAll(() => {
        fs.rmSync(repoRoot, { recursive: true, force: true });
    });

    const createService = (overrides = {}) => {
        const logs = [];
        const logger = {
            info: (msg, data) => logs.push({ level: 'info', msg, data }),
            warn: (msg, data) => logs.push({ level: 'warn', msg, data }),
            error: (msg, data) => logs.push({ level: 'error', msg, data })
        };

        const enqueue = jest.fn();
        const timers = {
            setInterval: jest.fn((fn) => {
                timers.cb = fn;
                return Symbol('interval');
            }),
            clearInterval: jest.fn()
        };

        const fsModule = {
            ...(overrides.fsModule || fs),
            mkdirSync: jest.fn(),
            appendFileSync: jest.fn(),
            writeFileSync: jest.fn(),
            readFileSync: jest.fn(),
            rmdirSync: jest.fn(),
            unlinkSync: jest.fn(),
            existsSync: jest.fn().mockReturnValue(false)
        };

        const spawnSync = jest.fn(() => ({ stdout: Buffer.from('ok'), stderr: Buffer.from('') }));

        const service = new GuardAutoManagerService({
            repoRoot,
            logger,
            notificationCenter: { enqueue },
            fsModule,
            childProcess: { spawnSync },
            timers,
            processRef: { on: jest.fn() }
        });
        service.__test = { logs, enqueue, timers, fsModule, spawnSync };
        return service;
    };

    it('starts service and schedules monitor loop', () => {
        const service = createService();

        const started = service.start();

        expect(started).toBe(true);
        expect(service.__test.timers.setInterval).toHaveBeenCalled();
    });

    it('enqueues notifications via notification center', () => {
        const service = createService();
        service.start();
        service.notifyUser('Guard-supervisor operativo.', 'info', { reason: 'test', cooldownMs: 0 });

        expect(service.__test.enqueue).toHaveBeenCalledWith({
            message: 'Guard-supervisor operativo.',
            level: 'info',
            type: 'guard_auto_manager_test',
            metadata: { reason: 'test', cooldownMs: 0 }
        });
    });
});
